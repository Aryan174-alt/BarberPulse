from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, serializers, status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.models import UserProfile
from shops.models import Service, Shop
from shops.services import is_open

from .models import QueueEntry
from .serializers import QueueEntrySerializer
from .services import join_queue, join_walk_in, release_no_shows


class JoinQueueInputSerializer(serializers.Serializer):
    service_id = serializers.IntegerField(min_value=1)


class WalkInInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, allow_blank=False)
    service_id = serializers.IntegerField(min_value=1, required=False)


def require_owner(user):
    try:
        if user.profile.role != UserProfile.Role.OWNER:
            raise PermissionDenied('Shop owner account required.')
        return user.owned_shop
    except (UserProfile.DoesNotExist, Shop.DoesNotExist):
        raise PermissionDenied('An owner profile and linked shop are required.')


class JoinQueueView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'queue_join'

    def post(self, request, shop_id):
        input_serializer = JoinQueueInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        service_id = input_serializer.validated_data['service_id']
        try:
            entry = join_queue(request.user, shop_id, service_id)
        except Shop.DoesNotExist as error:
            raise NotFound('Shop not found.') from error
        except Service.DoesNotExist as error:
            raise ValidationError({'service_id': 'Choose an active service for this shop.'}) from error
        return Response(QueueEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


class MyQueueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        entries = QueueEntry.objects.filter(
            customer=request.user,
            status__in=QueueEntry.ACTIVE_STATUSES,
        ).select_related('shop', 'service', 'customer').prefetch_related('shop__services', 'shop__barbers')
        return Response(QueueEntrySerializer(entries, many=True).data)


class CancelQueueView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, entry_id):
        entry = get_object_or_404(
            QueueEntry,
            pk=entry_id,
            customer=request.user,
            status__in=(QueueEntry.Status.WAITING, QueueEntry.Status.CALLED),
        )
        entry.status = QueueEntry.Status.CANCELLED
        entry.finished_at = timezone.now()
        entry.save(update_fields=['status', 'finished_at'])
        entry.shop.save(update_fields=['last_updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class WalkInThrottle(ScopedRateThrottle):
    scope = 'walk_in'


class WalkInView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'walk_in' 

    def post(self, request, shop_id):
        input_serializer = WalkInInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        name = input_serializer.validated_data['name'].strip()
        if not name:
            raise ValidationError({'name': 'Enter a non-empty name.'})
        try:
            entry = join_walk_in(
                shop_id,
                name,
                input_serializer.validated_data.get('service_id'),
            )
        except Shop.DoesNotExist as error:
            raise NotFound('Shop not found.') from error
        except Service.DoesNotExist as error:
            raise ValidationError({'service_id': str(error) or 'No matching active service.'}) from error
        return Response(QueueEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


class OwnerShopView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        shop = require_owner(request.user)
        return Response({'id': shop.pk, 'name': shop.name, 'is_open': is_open(shop)})

    def patch(self, request):
        shop = require_owner(request.user)
        if 'is_closed_override' not in request.data:
            raise ValidationError({'is_closed_override': 'This field is required.'})
        value = request.data['is_closed_override']
        if not isinstance(value, bool):
            raise ValidationError({'is_closed_override': 'Expected true or false.'})
        shop.is_closed_override = value
        shop.save()
        return Response({'id': shop.pk, 'name': shop.name, 'is_open': is_open(shop)})


class OwnerQueueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        shop = require_owner(request.user)
        if release_no_shows(shop):
            shop.save(update_fields=['last_updated_at'])
        entries = QueueEntry.objects.filter(
            shop=shop,
            status__in=QueueEntry.ACTIVE_STATUSES,
        ).select_related('shop', 'service', 'customer').prefetch_related('shop__services', 'shop__barbers')
        return Response(QueueEntrySerializer(entries, many=True).data)


class OwnerQueueActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, entry_id, action):
        shop = require_owner(request.user)
        with transaction.atomic():
            locked_shop = Shop.objects.select_for_update().get(pk=shop.pk)
            if action == 'call':
                entry = QueueEntry.objects.select_for_update().filter(
                    shop=locked_shop, status=QueueEntry.Status.WAITING,
                ).order_by('joined_at', 'pk').first()
                if not entry:
                    raise ValidationError('There are no waiting customers.')
                if entry.pk != entry_id:
                    raise ValidationError('Call the first waiting customer in queue order.')
            else:
                entry = get_object_or_404(
                    QueueEntry.objects.select_for_update(),
                    pk=entry_id,
                    shop=locked_shop,
                )
            now = timezone.now()
            transitions = {
                'call': (QueueEntry.Status.WAITING, QueueEntry.Status.CALLED, 'called_at'),
                'start': (QueueEntry.Status.CALLED, QueueEntry.Status.IN_SERVICE, 'started_at'),
                'done': (QueueEntry.Status.IN_SERVICE, QueueEntry.Status.DONE, 'finished_at'),
                'no-show': (QueueEntry.Status.CALLED, QueueEntry.Status.NO_SHOW, 'finished_at'),
            }
            if action not in transitions:
                raise ValidationError('Unknown queue action.')
            expected, new_status, timestamp_field = transitions[action]
            if entry.status != expected:
                raise ValidationError(f'Cannot {action} an entry with status {entry.status}.')
            entry.status = new_status
            setattr(entry, timestamp_field, now)
            entry.save(update_fields=['status', timestamp_field])
            locked_shop.save(update_fields=['last_updated_at'])
        return Response(QueueEntrySerializer(entry).data)
