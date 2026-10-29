from django.utils import timezone

from queueing.models import QueueEntry

from .models import Shop


def is_open(shop, at=None):
    at = at or timezone.localtime()
    current_time = timezone.localtime(at).time()
    if shop.is_closed_override:
        return False

    if shop.opens_at <= shop.closes_at:
        in_hours = shop.opens_at <= current_time < shop.closes_at
    else:
        in_hours = current_time >= shop.opens_at or current_time < shop.closes_at
    if not in_hours:
        return False

    if shop.break_start and shop.break_end:
        if shop.break_start <= shop.break_end:
            in_break = shop.break_start <= current_time < shop.break_end
        else:
            in_break = current_time >= shop.break_start or current_time < shop.break_end
        if in_break:
            return False
    return True


def estimated_wait_minutes(shop, entry=None, at=None):
    at = at or timezone.now()
    prefetched_entries = getattr(shop, '_prefetched_objects_cache', {}).get('queue_entries')
    if prefetched_entries is None:
        active = list(QueueEntry.objects.filter(
            shop=shop,
            status__in=QueueEntry.ACTIVE_STATUSES,
        ).select_related('service'))
    else:
        active = [
            item for item in prefetched_entries
            if item.status in QueueEntry.ACTIVE_STATUSES
        ]
    ahead = [
        item for item in active
        if item.status in (QueueEntry.Status.WAITING, QueueEntry.Status.CALLED)
        and (entry is None or item.joined_at < entry.joined_at)
    ]

    total_minutes = sum(item.service.minutes for item in ahead)
    current = min(
        (item for item in active if item.status == QueueEntry.Status.IN_SERVICE),
        key=lambda item: item.started_at or item.joined_at,
        default=None,
    )
    if current and current.started_at:
        elapsed = max(0, (at - current.started_at).total_seconds() / 60)
        total_minutes += max(0, current.service.minutes - elapsed)

    prefetched_barbers = getattr(shop, '_prefetched_objects_cache', {}).get('barbers')
    active_barbers = (
        sum(barber.is_active for barber in prefetched_barbers)
        if prefetched_barbers is not None
        else shop.barbers.filter(is_active=True).count()
    )
    return round(total_minutes / max(active_barbers, 1))


def find_matching_shops(service_name=None, max_price=None, within_minutes=None):
    shops = list(Shop.objects.prefetch_related('services', 'barbers', 'queue_entries__service'))
    if service_name:
        normalized_service = service_name.casefold()
        shops = [
            shop for shop in shops
            if any(
                service.is_active and normalized_service in service.name.casefold()
                for service in shop.services.all()
            )
        ]
    if max_price is not None:
        shops = [
            shop for shop in shops
            if any(
                service.is_active and service.price <= max_price
                for service in shop.services.all()
            )
        ]
    if within_minutes is not None:
        shops = [
            shop for shop in shops
            if estimated_wait_minutes(shop) <= within_minutes
        ]
    return shops
