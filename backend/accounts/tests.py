from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import UserProfile


class AccountApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_registration_returns_jwt_and_creates_role_profile(self):
        response = self.client.post(
            reverse('register'),
            {'username': 'new-customer', 'password': 'LongSafePass!82', 'role': 'customer'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(username='new-customer')
        self.assertEqual(user.profile.role, UserProfile.Role.CUSTOMER)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_returns_role_with_jwt(self):
        user = get_user_model().objects.create_user(username='owner-login', password='LongSafePass!82')
        UserProfile.objects.create(user=user, role=UserProfile.Role.OWNER)
        response = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'owner-login', 'password': 'LongSafePass!82'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['role'], UserProfile.Role.OWNER)
