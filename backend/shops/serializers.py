from rest_framework import serializers

from .models import Barber, Service, Shop
from .services import estimated_wait_minutes, is_open


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ('id', 'name', 'minutes', 'price')


class BarberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Barber
        fields = ('id', 'name', 'is_active')


class ShopSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    photo_url = serializers.SerializerMethodField()
    is_open = serializers.SerializerMethodField()
    queue_length = serializers.SerializerMethodField()
    estimated_wait_min = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = (
            'id', 'name', 'address', 'lat', 'lon', 'opens_at', 'closes_at',
            'is_open', 'queue_length', 'estimated_wait_min', 'last_updated_at',
            'services', 'distance_km', 'phone', 'photo_url',
        )

    def get_photo_url(self, shop):
        if not shop.photo:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(shop.photo.url) if request else shop.photo.url

    def get_is_open(self, shop):
        return is_open(shop)

    def get_queue_length(self, shop):
        prefetched_entries = getattr(shop, '_prefetched_objects_cache', {}).get('queue_entries')
        if prefetched_entries is not None:
            return sum(entry.status in ('waiting', 'called', 'in_service') for entry in prefetched_entries)
        return shop.queue_entries.filter(status__in=('waiting', 'called', 'in_service')).count()

    def get_estimated_wait_min(self, shop):
        return estimated_wait_minutes(shop)

    def get_distance_km(self, shop):
        distances = self.context.get('distances', {})
        return distances.get(shop.pk)
