from django.urls import path

from .views import LoginView, OwnerShopRegisterView, RefreshView, RegisterView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('register/owner/', OwnerShopRegisterView.as_view(), name='owner-register'),
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('refresh/', RefreshView.as_view(), name='token_refresh'),
]
