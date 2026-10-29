from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from django.contrib.auth import get_user_model
from django.db import close_old_connections

from accounts.models import UserProfile
from queueing.models import QueueEntry
from queueing.services import ActiveQueueEntryExists, join_queue
from shops.models import Service, Shop


@pytest.mark.django_db(transaction=True)
def test_concurrent_duplicate_joins_create_one_active_entry():
    shop = Shop.objects.create(
        name='Concurrency shop', address='Jaipur', lat=26.9, lon=75.8,
        opens_at='00:00', closes_at='23:59',
    )
    service = Service.objects.create(shop=shop, name='Haircut', minutes=30, price=200)
    user = get_user_model().objects.create_user(username='racing-customer', password='pass12345')
    UserProfile.objects.create(user=user, role=UserProfile.Role.CUSTOMER)
    barrier = Barrier(8)

    def attempt():
        close_old_connections()
        barrier.wait()
        try:
            join_queue(user, shop.pk, service.pk)
            return 'created'
        except ActiveQueueEntryExists:
            return 'duplicate'
        finally:
            close_old_connections()

    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda _: attempt(), range(8)))

    assert results.count('created') == 1
    assert QueueEntry.objects.filter(shop=shop, customer=user, status__in=QueueEntry.ACTIVE_STATUSES).count() == 1
