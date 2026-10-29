from datetime import timedelta
from decimal import Decimal, InvalidOperation
from math import isfinite

from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .geo import haversine_km
from .models import Shop
from .serializers import ShopSerializer
from .services import estimated_wait_minutes, find_matching_shops


class NearbyShopsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            latitude = float(request.query_params['lat'])
            longitude = float(request.query_params['lon'])
        except (KeyError, ValueError):
            return Response({'detail': 'Valid lat and lon query parameters are required.'}, status=400)
        if not isfinite(latitude) or not isfinite(longitude) or not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
            return Response({'detail': 'Coordinates are outside valid ranges.'}, status=400)

        shops = list(Shop.objects.prefetch_related('services', 'barbers', 'queue_entries__service'))
        distances = {
            shop.pk: haversine_km(latitude, longitude, float(shop.lat), float(shop.lon))
            for shop in shops
        }
        radius = request.query_params.get('radius_km')
        if radius:
            try:
                max_distance = float(radius)
            except ValueError:
                return Response({'detail': 'radius_km must be a number.'}, status=400)
            if not isfinite(max_distance) or max_distance < 0:
                return Response({'detail': 'radius_km cannot be negative.'}, status=400)
            shops = [shop for shop in shops if distances[shop.pk] <= max_distance]

        sort = request.query_params.get('sort', 'distance')
        stale_before = timezone.now() - timedelta(minutes=30)
        if sort == 'distance':
            shops.sort(key=lambda shop: (
                shop.last_updated_at < stale_before,
                distances[shop.pk],
            ))
        elif sort == 'wait':
            shops.sort(key=lambda shop: (
                shop.last_updated_at < stale_before,
                estimated_wait_minutes(shop),
            ))
        else:
            return Response({'detail': 'sort must be distance or wait.'}, status=400)
        serializer = ShopSerializer(shops, many=True, context={'distances': distances})
        return Response(serializer.data)


class ShopDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    queryset = Shop.objects.prefetch_related('services', 'barbers', 'queue_entries__service')
    serializer_class = ShopSerializer


class ShopSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        service_name = request.query_params.get('service')
        max_price = request.query_params.get('max_price')
        within_minutes = request.query_params.get('within_minutes')
        price_limit = None
        if max_price:
            try:
                price_limit = Decimal(max_price)
            except InvalidOperation:
                return Response({'detail': 'max_price must be a number.'}, status=400)
            if not price_limit.is_finite() or price_limit < 0:
                return Response({'detail': 'max_price cannot be negative.'}, status=400)
        wait_limit = None
        if within_minutes:
            try:
                wait_limit = int(within_minutes)
            except ValueError:
                return Response({'detail': 'within_minutes must be an integer.'}, status=400)
            if wait_limit < 0:
                return Response({'detail': 'within_minutes cannot be negative.'}, status=400)
        shops = find_matching_shops(service_name, price_limit, wait_limit)
        results = ShopSerializer(shops, many=True).data
        if request.query_params.get('sort') == 'wait':
            results = sorted(results, key=lambda shop: shop['estimated_wait_min'])
        return Response(results)
