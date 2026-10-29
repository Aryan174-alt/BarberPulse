from django.conf import settings
from django.db import models
from django.db.models import Q

from shops.models import Service, Shop


class QueueEntry(models.Model):
    class Status(models.TextChoices):
        WAITING = 'waiting', 'Waiting'
        CALLED = 'called', 'Called'
        IN_SERVICE = 'in_service', 'In service'
        DONE = 'done', 'Done'
        NO_SHOW = 'no_show', 'No show'
        CANCELLED = 'cancelled', 'Cancelled'

    ACTIVE_STATUSES = (Status.WAITING, Status.CALLED, Status.IN_SERVICE)

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='queue_entries')
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='queue_entries',
    )
    walk_in_name = models.CharField(max_length=120, blank=True)
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name='queue_entries')
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.WAITING)
    joined_at = models.DateTimeField(auto_now_add=True)
    called_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['joined_at', 'pk']
        constraints = [
            models.UniqueConstraint(
                fields=['shop', 'customer'],
                condition=Q(
                    customer__isnull=False,
                    status__in=('waiting', 'called', 'in_service'),
                ),
                name='unique_active_queue_entry_per_customer_shop',
            ),
            models.CheckConstraint(
                condition=Q(customer__isnull=False) | ~Q(walk_in_name=''),
                name='queue_entry_has_customer_or_walk_in_name',
            ),
        ]
        indexes = [
            models.Index(fields=['shop', 'status', 'joined_at']),
        ]

    def __str__(self):
        return f'{self.shop.name}: {self.status} ({self.joined_at:%H:%M})'
