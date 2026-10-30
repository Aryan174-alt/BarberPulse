import pytest
from datetime import time
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient

from accounts.models import UserProfile
from queueing.models import QueueEntry
from shops.models import Barber, Service, Shop


@pytest.fixture(autouse=True)
def reset_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
def test_full_customer_and_owner_ui_journey():
    # 1. Setup Shop and Barber
    owner_user = get_user_model().objects.create_user(username='shop-owner-raj', password='ownerpass123')
    UserProfile.objects.create(user=owner_user, role=UserProfile.Role.OWNER)

    shop = Shop.objects.create(
        owner=owner_user,
        name='Raj Royal Salon',
        address='MI Road, Jaipur',
        lat=26.9150,
        lon=75.8000,
        opens_at=time(0, 0, 0),
        closes_at=time(23, 59, 59),
    )
    barber = Barber.objects.create(shop=shop, name='Rajesh', is_active=True)
    haircut = Service.objects.create(shop=shop, name='Haircut', minutes=30, price=200)
    shave = Service.objects.create(shop=shop, name='Shave', minutes=15, price=100)

    # 2. Customer arrives, views nearby shops
    client = APIClient()
    nearby_res = client.get('/api/shops/nearby/?lat=26.9124&lon=75.7873&sort=distance')
    assert nearby_res.status_code == 200
    shop_data = next((s for s in nearby_res.data if s['id'] == shop.pk), None)
    assert shop_data is not None
    assert shop_data['is_open'] is True
    assert shop_data['queue_length'] == 0

    # 3. Customer signs in and joins queue
    customer_user = get_user_model().objects.create_user(username='customer-amit', password='amitpass123')
    UserProfile.objects.create(user=customer_user, role=UserProfile.Role.CUSTOMER)
    client.force_authenticate(customer_user)

    join_res = client.post(f'/api/shops/{shop.pk}/queue/', {'service_id': haircut.pk})
    assert join_res.status_code == 201
    assert join_res.data['position'] == 1
    entry_id = join_res.data['id']

    # 4. Customer checks My Queue ticket
    my_queue_res = client.get('/api/queue/me/')
    assert my_queue_res.status_code == 200
    assert len(my_queue_res.data) == 1
    assert my_queue_res.data[0]['id'] == entry_id
    assert my_queue_res.data[0]['status'] == 'waiting'

    # 5. Owner checks dashboard queue
    owner_client = APIClient()
    owner_client.force_authenticate(owner_user)

    owner_queue_res = owner_client.get('/api/owner/queue/')
    assert owner_queue_res.status_code == 200
    assert len(owner_queue_res.data) == 1
    assert owner_queue_res.data[0]['customer_name'] == 'customer-amit'

    # 6. Owner calls next customer
    call_res = owner_client.post(f'/api/owner/queue/{entry_id}/call/')
    assert call_res.status_code == 200
    assert call_res.data['status'] == 'called'

    # 7. Customer sees their turn has arrived
    customer_queue_res = client.get('/api/queue/me/')
    assert customer_queue_res.data[0]['status'] == 'called'

    # 8. Owner starts service
    start_res = owner_client.post(f'/api/owner/queue/{entry_id}/start/')
    assert start_res.status_code == 200
    assert start_res.data['status'] == 'in_service'

    # 9. Owner completes service
    done_res = owner_client.post(f'/api/owner/queue/{entry_id}/done/')
    assert done_res.status_code == 200
    assert done_res.data['status'] == 'done'

    # 10. Queue is now clear for customer and owner
    assert len(client.get('/api/queue/me/').data) == 0
    assert len(owner_client.get('/api/owner/queue/').data) == 0


@pytest.mark.django_db
def test_walk_in_qr_and_assistant_search_flow():
    shop = Shop.objects.create(
        name='Bazaar Cuts', address='Bapu Bazaar, Jaipur',
        lat=26.9200, lon=75.8200,
        opens_at=time(0, 0, 0),
        closes_at=time(23, 59, 59),
    )
    Service.objects.create(shop=shop, name='Haircut', minutes=25, price=180)
    Barber.objects.create(shop=shop, name='Vikram', is_active=True)

    client = APIClient()

    # Walk-in scans QR code on counter and joins with name only
    walk_in_res = client.post(f'/api/shops/{shop.pk}/walk-in/', {'name': 'Rohan (Walk-in)'})
    assert walk_in_res.status_code == 201
    assert walk_in_res.data['walk_in_name'] == 'Rohan (Walk-in)'

    # Assistant Natural Search
    chat_res = client.post('/api/assistant/chat/', {
        'message': 'sasta haircut under 200',
        'lat': 26.9200,
        'lon': 75.8200,
    })
    assert chat_res.status_code == 200
    assert 'shops' in chat_res.data
    assert any(s['id'] == shop.pk for s in chat_res.data['shops'])
