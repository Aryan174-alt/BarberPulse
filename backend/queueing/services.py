from datetime import timedelta

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import APIException, PermissionDenied

from accounts.models import UserProfile
from shops.models import Service, Shop
from shops.services import is_open

from .models import QueueEntry


class ActiveQueueEntryExists(APIException):
    status_code = 409
    default_detail = 'You already have an active queue entry at this shop.'
    default_code = 'already_in_queue'


class ShopClosed(APIException):
    status_code = 400
    default_detail = 'This shop is currently closed.'
    default_code = 'shop_closed'


@transaction.atomic
def join_queue(user, shop_id, service_id):
    shop = Shop.objects.select_for_update().get(pk=shop_id)
    if not is_open(shop):
        raise ShopClosed()
    try:
        if user.profile.role != UserProfile.Role.CUSTOMER:
            raise PermissionDenied('Only customer accounts can join the queue.')
    except UserProfile.DoesNotExist:
        raise PermissionDenied('Create a customer profile before joining a queue.')
    if QueueEntry.objects.filter(shop=shop, customer=user, status__in=QueueEntry.ACTIVE_STATUSES).exists():
        raise ActiveQueueEntryExists()
    service = Service.objects.get(pk=service_id, shop=shop, is_active=True)
    try:
        entry = QueueEntry.objects.create(shop=shop, customer=user, service=service)
    except IntegrityError as error:
        raise ActiveQueueEntryExists() from error
    shop.save(update_fields=['last_updated_at'])
    return entry


@transaction.atomic
def join_walk_in(shop_id, name, service_id=None):
    shop = Shop.objects.select_for_update().get(pk=shop_id)
    if not is_open(shop):
        raise ShopClosed()
    services = Service.objects.filter(shop=shop, is_active=True)
    if service_id:
        service = services.get(pk=service_id)
    else:
        service = services.first()
    if not service:
        raise Service.DoesNotExist('This shop has no active services.')
    entry = QueueEntry.objects.create(shop=shop, service=service, walk_in_name=name)
    shop.save(update_fields=['last_updated_at'])
    return entry


def release_no_shows(shop):
    cutoff = timezone.now() - timedelta(minutes=5)
    return QueueEntry.objects.filter(
        shop=shop,
        status=QueueEntry.Status.CALLED,
        called_at__lte=cutoff,
    ).update(status=QueueEntry.Status.NO_SHOW, finished_at=timezone.now())
