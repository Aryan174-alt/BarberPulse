from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .parser import parse_message


class AssistantParserTests(TestCase):
    def test_extracts_hinglish_request(self):
        parsed = parse_message('daadhi sasta under 150 kal subah')
        self.assertEqual(parsed['service'], 'beard trim')
        self.assertEqual(parsed['max_price'], 150)
        self.assertEqual(parsed['within_minutes'], 1440)
        self.assertEqual(parsed['priority'], 'cheapest')

    def test_unknown_service_is_left_for_follow_up(self):
        self.assertIsNone(parse_message('find me a good shop')['service'])

    def test_chat_requests_location_for_nearest_results(self):
        response = APIClient().post(
            reverse('assistant-chat'),
            {'message': 'nearest haircut'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('Share your location', response.data['message'])


class AssistantApiTests(TestCase):
    def test_chat_asks_for_missing_service(self):
        response = APIClient().post(
            reverse('assistant-chat'),
            {'message': 'Show me nearby shops'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['shops'], [])
        self.assertIn('Which service', response.data['message'])
