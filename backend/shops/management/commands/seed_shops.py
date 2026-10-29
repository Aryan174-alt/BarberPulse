from decimal import Decimal

from django.core.management.base import BaseCommand

from shops.models import Barber, Service, Shop


SHOPS = (
    ('Pink City Barber', 'Pink City, Jaipur', 26.9124, 75.7873, 2),
    ('MI Road Gents Salon', 'MI Road, Jaipur', 26.9157, 75.8001, 4),
    ('Bapu Bazaar Barbers', 'Bapu Bazaar, Jaipur', 26.9192, 75.8267, 0),
    ('C-Scheme Cut Studio', 'C-Scheme, Jaipur', 26.9028, 75.8069, 1),
    ('Malviya Nagar Barber Shop', 'Malviya Nagar, Jaipur', 26.8547, 75.8243, 3),
    ('Vaishali Nagar Gents Salon', 'Vaishali Nagar, Jaipur', 26.9121, 75.7421, 0),
    ('Mansarovar Hair Point', 'Mansarovar, Jaipur', 26.8573, 75.7678, 0),
    ('Raja Park Classic Cuts', 'Raja Park, Jaipur', 26.8913, 75.8314, 2),
)


class Command(BaseCommand):
    help = 'Create the eight local Jaipur demo shops and their services.'

    def handle(self, *args, **options):
        for index, (name, address, lat, lon, barber_count) in enumerate(SHOPS):
            shop, _ = Shop.objects.get_or_create(
                name=name,
                defaults={
                    'address': address,
                    'lat': Decimal(str(lat)),
                    'lon': Decimal(str(lon)),
                    'opens_at': '09:00',
                    'closes_at': '21:00',
                },
            )
            services = (
                ('Haircut', 30, 200 + index * 5),
                ('Beard trim', 15, 100 + index * 3),
            )
            for service_name, minutes, price in services:
                Service.objects.get_or_create(
                    shop=shop,
                    name=service_name,
                    defaults={'minutes': minutes, 'price': Decimal(price)},
                )
            for barber_index in range(max(barber_count, 1)):
                Barber.objects.get_or_create(
                    shop=shop,
                    name=f'Barber {barber_index + 1}',
                    defaults={'is_active': True},
                )
        self.stdout.write(self.style.SUCCESS(f'Created or kept {len(SHOPS)} demo shops.'))
