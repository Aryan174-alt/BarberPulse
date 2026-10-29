from django.urls import path

from .views import NearbyShopsView, ShopDetailView, ShopSearchView

urlpatterns = [
    path('nearby/', NearbyShopsView.as_view(), name='shop-nearby'),
    path('search/', ShopSearchView.as_view(), name='shop-search'),
    path('<int:pk>/', ShopDetailView.as_view(), name='shop-detail'),
]
