from django.contrib import admin

from .models import Barber, Service, Shop

admin.site.register(Shop)
admin.site.register(Barber)
admin.site.register(Service)
