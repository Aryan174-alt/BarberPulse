from django.conf import settings
from django.db import models


class Shop(models.Model):
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_shop',
    )
    name = models.CharField(max_length=120)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=30, blank=True, default='')
    lat = models.DecimalField(max_digits=9, decimal_places=6)
    lon = models.DecimalField(max_digits=9, decimal_places=6)
    photo = models.FileField(upload_to='shop_photos/', blank=True)
    opens_at = models.TimeField()
    closes_at = models.TimeField()
    break_start = models.TimeField(null=True, blank=True)
    break_end = models.TimeField(null=True, blank=True)
    is_closed_override = models.BooleanField(default=False)
    last_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_closed_override', 'last_updated_at'], name='shop_status_updated_idx'),
        ]

    def __str__(self):
        return self.name


class Barber(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='barbers')
    name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.name} ({self.shop.name})'


class Service(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=120)
    minutes = models.PositiveSmallIntegerField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} - {self.shop.name}'
