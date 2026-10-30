import json
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile
from shops.models import Service, Shop

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=UserProfile.Role.choices, default=UserProfile.Role.CUSTOMER)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('This username is already in use.')
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    @transaction.atomic
    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        role = validated_data.pop('role', UserProfile.Role.CUSTOMER)
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user, role=role, phone=phone)
        refresh = RefreshToken.for_user(user)
        return {
            'user': {'id': user.pk, 'username': user.username, 'role': role},
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class OwnerShopRegisterSerializer(serializers.Serializer):
    owner_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30)
    password = serializers.CharField(write_only=True, min_length=8)
    shop_name = serializers.CharField(max_length=120)
    address = serializers.CharField(max_length=255)
    lat = serializers.DecimalField(max_digits=9, decimal_places=6, min_value=-90, max_value=90)
    lon = serializers.DecimalField(max_digits=9, decimal_places=6, min_value=-180, max_value=180)
    opens_at = serializers.TimeField()
    closes_at = serializers.TimeField()
    break_start = serializers.TimeField(required=False, allow_null=True)
    break_end = serializers.TimeField(required=False, allow_null=True)
    photo = serializers.FileField(required=False, allow_empty_file=False)
    services = serializers.CharField()

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists() or User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('An account already uses this email.')
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_photo(self, value):
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
        extension = Path(value.name).suffix.lower()
        if extension not in allowed_extensions:
            raise serializers.ValidationError('Upload a JPG, PNG, or WebP image.')
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Shop photo must be 5 MB or smaller.')
        header = value.read(12)
        value.seek(0)
        matches_extension = (
            (extension in {'.jpg', '.jpeg'} and header.startswith(b'\xff\xd8\xff'))
            or (extension == '.png' and header.startswith(b'\x89PNG\r\n\x1a\n'))
            or (extension == '.webp' and header.startswith(b'RIFF') and header[8:12] == b'WEBP')
        )
        if not matches_extension:
            raise serializers.ValidationError('The uploaded file contents do not match its image extension.')
        return value

    def validate_services(self, value):
        try:
            services = json.loads(value)
        except json.JSONDecodeError as error:
            raise serializers.ValidationError('Services must be valid JSON.') from error
        if not isinstance(services, list) or not services:
            raise serializers.ValidationError('Add at least one service.')
        if len(services) > 20:
            raise serializers.ValidationError('Add no more than 20 services.')
        cleaned = []
        for item in services:
            if not isinstance(item, dict):
                raise serializers.ValidationError('Each service must include name, minutes, and price.')
            name = str(item.get('name', '')).strip()
            try:
                minutes = int(item.get('minutes'))
                price = Decimal(str(item.get('price')))
            except (InvalidOperation, TypeError, ValueError) as error:
                raise serializers.ValidationError('Service duration and price must be numbers.') from error
            if (
                not name
                or len(name) > 120
                or minutes < 1
                or minutes > 600
                or not price.is_finite()
                or price < 0
                or price > Decimal('999999.99')
                or price.as_tuple().exponent < -2
            ):
                raise serializers.ValidationError('Check each service name, duration, and non-negative price.')
            cleaned.append({'name': name, 'minutes': minutes, 'price': price})
        return cleaned

    def validate(self, attrs):
        if bool(attrs.get('break_start')) != bool(attrs.get('break_end')):
            raise serializers.ValidationError('Provide both break start and break end, or leave both blank.')
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        services = validated_data.pop('services')
        photo = validated_data.pop('photo', None)
        password = validated_data.pop('password')
        owner_name = validated_data.pop('owner_name')
        email = validated_data.pop('email')
        phone = validated_data.pop('phone')
        shop_name = validated_data.pop('shop_name')
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=owner_name,
        )
        UserProfile.objects.create(user=user, role=UserProfile.Role.OWNER, phone=phone)
        shop = Shop.objects.create(
            owner=user,
            name=shop_name,
            phone=phone,
            photo=photo,
            **validated_data,
        )
        Service.objects.bulk_create([
            Service(shop=shop, **service)
            for service in services
        ])
        refresh = RefreshToken.for_user(user)
        refresh['role'] = UserProfile.Role.OWNER
        return {
            'user': {'id': user.pk, 'username': user.username, 'role': UserProfile.Role.OWNER},
            'shop': {'id': shop.pk, 'name': shop.name},
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class LoginTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        try:
            token['role'] = user.profile.role
        except UserProfile.DoesNotExist:
            token['role'] = UserProfile.Role.CUSTOMER
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        try:
            role = self.user.profile.role
        except UserProfile.DoesNotExist:
            role = UserProfile.Role.CUSTOMER
        data['user'] = {'id': self.user.pk, 'username': self.user.username, 'role': role}
        return data
