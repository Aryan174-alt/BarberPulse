import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from django.core.cache import cache
from rest_framework.test import APIClient

from accounts.models import UserProfile
from queueing.models import QueueEntry
from shops.models import Service, Shop

@pytest.fixture(autouse=True)
def reset_cache_between_tests():
    cache.clear()
    yield
    cache.clear()



@pytest.mark.django_db(transaction=True)
def test_check_constraint_rejects_empty_customer_and_walk_in():
    shop = Shop.objects.create(
        name='DB Test Shop', address='Jaipur', lat=26.9, lon=75.8,
        opens_at='09:00', closes_at='21:00',
    )
    service = Service.objects.create(shop=shop, name='Haircut', minutes=30, price=200)

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            QueueEntry.objects.create(
                shop=shop,
                service=service,
                customer=None,
                walk_in_name='',
            )


@pytest.mark.django_db(transaction=True)
def test_conditional_unique_constraint_enforces_one_active_entry():
    shop = Shop.objects.create(
        name='Constraint Shop', address='Jaipur', lat=26.9, lon=75.8,
        opens_at='09:00', closes_at='21:00',
    )
    service = Service.objects.create(shop=shop, name='Haircut', minutes=30, price=200)
    user = get_user_model().objects.create_user(username='db-customer-1', password='pass12345')
    UserProfile.objects.create(user=user, role=UserProfile.Role.CUSTOMER)

    # First active entry
    QueueEntry.objects.create(shop=shop, customer=user, service=service, status=QueueEntry.Status.WAITING)

    # Second active entry must be rejected at PostgreSQL database level
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            QueueEntry.objects.create(
                shop=shop,
                customer=user,
                service=service,
                status=QueueEntry.Status.CALLED,
            )


@pytest.mark.django_db(transaction=True)
def test_completed_entries_allow_subsequent_active_entry():
    shop = Shop.objects.create(
        name='Repeat Customer Shop', address='Jaipur', lat=26.9, lon=75.8,
        opens_at='09:00', closes_at='21:00',
    )
    service = Service.objects.create(shop=shop, name='Haircut', minutes=30, price=200)
    user = get_user_model().objects.create_user(username='db-customer-repeat', password='pass12345')
    UserProfile.objects.create(user=user, role=UserProfile.Role.CUSTOMER)

    # Completed entry in history
    QueueEntry.objects.create(
        shop=shop, customer=user, service=service, status=QueueEntry.Status.DONE,
    )

    # New active entry should succeed because previous is DONE
    new_entry = QueueEntry.objects.create(
        shop=shop, customer=user, service=service, status=QueueEntry.Status.WAITING,
    )
    assert new_entry.pk is not None


@pytest.mark.django_db(transaction=True)
def test_service_deletion_protected_when_queue_entries_exist():
    shop = Shop.objects.create(
        name='Protection Shop', address='Jaipur', lat=26.9, lon=75.8,
        opens_at='09:00', closes_at='21:00',
    )
    service = Service.objects.create(shop=shop, name='Shave', minutes=20, price=150)
    QueueEntry.objects.create(
        shop=shop, service=service, walk_in_name='Rahul', status=QueueEntry.Status.WAITING,
    )

    with pytest.raises(ProtectedError):
        service.delete()


@pytest.mark.django_db
def test_walk_in_throttling_protects_public_endpoint():
    shop = Shop.objects.create(
        name='Throttle Shop', address='Jaipur', lat=26.9, lon=75.8,
        opens_at='00:00', closes_at='23:59',
    )
    Service.objects.create(shop=shop, name='Quick Cut', minutes=15, price=100)
    client = APIClient()

    # Repeated walk-ins from the same IP client will trigger rate limiter
    responses = [
        client.post(f'/api/shops/{shop.pk}/walk-in/', {'name': f'WalkIn-{i}'})
        for i in range(15)
    ]
    status_codes = [r.status_code for r in responses]
    assert 201 in status_codes
    assert 429 in status_codes, f"Expected 429 Too Many Requests in statuses: {status_codes}"
