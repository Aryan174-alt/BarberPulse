from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from shops.geo import haversine_km
from shops.serializers import ShopSerializer
from shops.services import find_matching_shops

from .parser import parse_message


class AssistantChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get('message', '')
        if not isinstance(message, str) or not message.strip() or len(message) > 500:
            return Response({'detail': 'message must contain 1 to 500 characters.'}, status=400)
        filters = parse_message(message)
        if filters['max_price'] is not None and filters['max_price'] < 0:
            return Response({'detail': 'Price cannot be negative.'}, status=400)
        if not filters['service']:
            return Response({
                'message': 'Which service are you looking for: haircut, beard trim, or shave?',
                'filters': filters,
                'shops': [],
            })

        user_lat = request.data.get('lat')
        user_lon = request.data.get('lon')
        if (user_lat is None) != (user_lon is None):
            return Response({'detail': 'Provide both lat and lon, or neither.'}, status=400)
        location = None
        if user_lat is not None:
            try:
                lat, lon = float(user_lat), float(user_lon)
                if not -90 <= lat <= 90 or not -180 <= lon <= 180:
                    return Response({'detail': 'Coordinates are outside valid ranges.'}, status=400)
                location = (lat, lon)
            except (TypeError, ValueError):
                return Response({'detail': 'lat and lon must be valid numbers.'}, status=400)
        if filters['priority'] == 'nearest' and location is None:
            return Response({
                'message': 'Share your location with the location button, or ask me to find the fastest shop.',
                'filters': filters,
                'shops': [],
            })

        shops = find_matching_shops(
            filters['service'],
            filters['max_price'],
            filters['within_minutes'],
        )

        serialized = ShopSerializer(shops, many=True, context={'request': request}).data
        if location:
            for item in serialized:
                item['_distance_km'] = haversine_km(
                    location[0], location[1], float(item['lat']), float(item['lon']),
                )
        if filters['priority'] == 'nearest' and location:
            serialized.sort(key=lambda item: item['_distance_km'])
        else:
            def score(item):
                prices = [float(service['price']) for service in item['services']]
                price_weight = 0.02 if filters['priority'] != 'cheapest' else 1
                travel_minutes = item.get('_distance_km', 0) * 3
                return item['estimated_wait_min'] + travel_minutes + min(prices, default=0) * price_weight

            serialized.sort(key=score)
        for shop in serialized:
            shop.pop('_rank', None)
            shop.pop('_distance_km', None)
        return Response({
            'message': f'Found {len(serialized)} matching shops.',
            'filters': filters,
            'shops': serialized,
        })
