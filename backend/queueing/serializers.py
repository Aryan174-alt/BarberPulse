from rest_framework import serializers

from shops.serializers import ShopSerializer
from shops.services import estimated_wait_minutes

from .models import QueueEntry


class QueueEntrySerializer(serializers.ModelSerializer):
    shop = ShopSerializer(read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    customer_name = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()
    estimated_wait_min = serializers.SerializerMethodField()

    class Meta:
        model = QueueEntry
        fields = (
            'id', 'shop', 'service_name', 'customer_name', 'walk_in_name', 'status',
            'position', 'estimated_wait_min', 'joined_at', 'called_at', 'started_at',
        )

    def get_customer_name(self, entry):
        return entry.customer.username if entry.customer else entry.walk_in_name

    def get_position(self, entry):
        if entry.status == QueueEntry.Status.IN_SERVICE:
            return 0
        earlier = QueueEntry.objects.filter(
            shop=entry.shop,
            status__in=(QueueEntry.Status.WAITING, QueueEntry.Status.CALLED),
            joined_at__lt=entry.joined_at,
        ).count()
        return earlier + 1

    def get_estimated_wait_min(self, entry):
        return estimated_wait_minutes(entry.shop, entry=entry)
