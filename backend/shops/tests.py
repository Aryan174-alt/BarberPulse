from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APIClient

from queueing.models import QueueEntry

from .geo import haversine_km
from .models import Barber, Service, Shop
from .services import estimated_wait_minutes, is_open


class GeographyTests(TestCase):
    def test_haversine_one_degree_at_equator(self):
        self.assertAlmostEqual(haversine_km(0, 0, 0, 1), 111.19, places=1)


class ShopServiceTests(TestCase):
    def setUp(self):
        self.shop = Shop.objects.create(
            name='Test shop',
            address='Jaipur',
            lat=26.9,
            lon=75.8,
            opens_at='09:00',
            closes_at='20:00',
            break_start='13:00',
            break_end='14:00',
        )
        self.shop.refresh_from_db()

    def local_time(self, hour, minute=0):
        return timezone.make_aware(datetime(2026, 10, 29, hour, minute), ZoneInfo('Asia/Kolkata'))

    def test_open_hours_boundaries_and_break(self):
        self.assertTrue(is_open(self.shop, self.local_time(9)))
        self.assertFalse(is_open(self.shop, self.local_time(20)))
        self.assertFalse(is_open(self.shop, self.local_time(13, 30)))

    def test_closed_override_closes_shop(self):
        self.shop.is_closed_override = True
        self.assertFalse(is_open(self.shop, self.local_time(10)))

    def test_wait_uses_queue_duration_and_current_service_remaining(self):
        user = get_user_model().objects.create_user(username='wait-customer', password='pass12345')
        Barber.objects.create(shop=self.shop, name='Barber')
        service = Service.objects.create(shop=self.shop, name='Cut', minutes=30, price=200)
        QueueEntry.objects.create(
            shop=self.shop, customer=user, service=service, status=QueueEntry.Status.IN_SERVICE,
            started_at=timezone.now() - timedelta(minutes=10),
        )
        waiting_user = get_user_model().objects.create_user(username='waiting-customer', password='pass12345')
        QueueEntry.objects.create(shop=self.shop, customer=waiting_user, service=service)
        self.assertEqual(estimated_wait_minutes(self.shop), 50)

    def test_nearby_endpoint_returns_real_shop_data_sorted_with_distance(self):
        client = APIClient()
        response = client.get(
            reverse('shop-nearby'),
            {'lat': '26.9', 'lon': '75.8', 'sort': 'distance'},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['id'], self.shop.pk)
        self.assertIn('estimated_wait_min', response.data[0])

    def test_nearby_endpoint_rejects_invalid_coordinates(self):
        response = APIClient().get(reverse('shop-nearby'), {'lat': '200', 'lon': '75'})
        self.assertEqual(response.status_code, 400)
