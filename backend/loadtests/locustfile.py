from locust import HttpUser, between, task


class QueueNearVisitor(HttpUser):
    wait_time = between(1, 2)

    @task
    def browse_nearby_shops(self):
        self.client.get(
            '/api/shops/nearby/',
            params={'lat': '26.9124', 'lon': '75.7873', 'radius_km': '15'},
            name='/api/shops/nearby',
        )
