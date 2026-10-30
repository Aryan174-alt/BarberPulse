from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import UserProfile
from queueing.models import QueueEntry
from shops.models import Service, Shop
from queueing.services import release_no_shows


class QueueApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.shop = Shop.objects.create(
            name='Test shop', address='Jaipur', lat=26.9, lon=75.8,
            opens_at='00:00', closes_at='23:59',
        )
        self.service = Service.objects.create(shop=self.shop, name='Haircut', minutes=30, price=200)
        self.customer = get_user_model().objects.create_user(username='customer', password='pass12345')
        UserProfile.objects.create(user=self.customer, role=UserProfile.Role.CUSTOMER)
        self.client = APIClient()

    def test_customer_joins_queue_and_cannot_join_twice(self):
        self.client.force_authenticate(self.customer)
        response = self.client.post(
            reverse('queue-join', args=[self.shop.pk]),
            {'service_id': self.service.pk},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        duplicate = self.client.post(
            reverse('queue-join', args=[self.shop.pk]),
            {'service_id': self.service.pk},
            format='json',
        )
        self.assertEqual(duplicate.status_code, 409)

    def test_customer_can_cancel_waiting_entry(self):
        self.client.force_authenticate(self.customer)
        joined = self.client.post(
            reverse('queue-join', args=[self.shop.pk]),
            {'service_id': self.service.pk},
            format='json',
        )
        response = self.client.delete(reverse('queue-cancel', args=[joined.data['id']]))
        self.assertEqual(response.status_code, 204)

    def test_walk_in_can_join_with_name(self):
        response = self.client.post(
            reverse('queue-walk-in', args=[self.shop.pk]),
            {'name': 'Walk-in guest', 'service_id': self.service.pk},
            format='json',
        )
        self.assertEqual(response.status_code, 201)

    def test_owner_without_linked_shop_is_refused(self):
        owner = get_user_model().objects.create_user(username='owner', password='pass12345')
        UserProfile.objects.create(user=owner, role=UserProfile.Role.OWNER)
        self.client.force_authenticate(owner)
        self.assertEqual(self.client.get(reverse('owner-queue')).status_code, 403)

    def test_closed_shop_rejects_customer_join(self):
        self.shop.is_closed_override = True
        self.shop.save()
        self.client.force_authenticate(self.customer)
        response = self.client.post(
            reverse('queue-join', args=[self.shop.pk]),
            {'service_id': self.service.pk},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_owner_cannot_act_on_another_owners_queue(self):
        owner = get_user_model().objects.create_user(username='other-owner', password='pass12345')
        UserProfile.objects.create(user=owner, role=UserProfile.Role.OWNER)
        other_shop = Shop.objects.create(
            owner=owner, name='Other shop', address='Jaipur', lat=26.91, lon=75.81,
            opens_at='00:00', closes_at='23:59',
        )
        Service.objects.create(shop=other_shop, name='Cut', minutes=30, price=180)
        entry = QueueEntry.objects.create(
            shop=self.shop, service=self.service, walk_in_name='Guest',
            status=QueueEntry.Status.CALLED,
        )
        self.client.force_authenticate(owner)
        response = self.client.post(
            reverse('owner-queue-action', args=[entry.pk, 'start']),
            format='json',
        )
        self.assertEqual(response.status_code, 404)

    def test_owner_can_only_call_first_waiting_customer(self):
        owner = get_user_model().objects.create_user(username='queue-owner', password='pass12345')
        UserProfile.objects.create(user=owner, role=UserProfile.Role.OWNER)
        self.shop.owner = owner
        self.shop.save()
        first = QueueEntry.objects.create(shop=self.shop, service=self.service, walk_in_name='First')
        second = QueueEntry.objects.create(shop=self.shop, service=self.service, walk_in_name='Second')
        self.client.force_authenticate(owner)
        wrong_order = self.client.post(
            reverse('owner-queue-action', args=[second.pk, 'call']),
            format='json',
        )
        self.assertEqual(wrong_order.status_code, 400)
        called = self.client.post(
            reverse('owner-queue-action', args=[first.pk, 'call']),
            format='json',
        )
        self.assertEqual(called.status_code, 200)
        self.assertEqual(called.data['status'], QueueEntry.Status.CALLED)

    def test_called_entry_becomes_no_show_after_five_minutes(self):
        entry = QueueEntry.objects.create(
            shop=self.shop, service=self.service, walk_in_name='Late guest',
            status=QueueEntry.Status.CALLED,
            called_at=timezone.now() - timedelta(minutes=6),
        )
        self.assertEqual(release_no_shows(self.shop), 1)
        entry.refresh_from_db()
        self.assertEqual(entry.status, QueueEntry.Status.NO_SHOW)
