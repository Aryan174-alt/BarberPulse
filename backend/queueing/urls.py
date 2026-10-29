from django.urls import path

from .views import (
    CancelQueueView,
    JoinQueueView,
    MyQueueView,
    OwnerQueueActionView,
    OwnerQueueView,
    OwnerShopView,
    WalkInView,
)

urlpatterns = [
    path('shops/<int:shop_id>/queue/', JoinQueueView.as_view(), name='queue-join'),
    path('shops/<int:shop_id>/walk-in/', WalkInView.as_view(), name='queue-walk-in'),
    path('queue/me/', MyQueueView.as_view(), name='queue-me'),
    path('queue/<int:entry_id>/', CancelQueueView.as_view(), name='queue-cancel'),
    path('owner/shop/', OwnerShopView.as_view(), name='owner-shop'),
    path('owner/queue/', OwnerQueueView.as_view(), name='owner-queue'),
    path(
        'owner/queue/<int:entry_id>/<str:action>/',
        OwnerQueueActionView.as_view(),
        name='owner-queue-action',
    ),
]
