from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile

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
