from rest_framework import serializers


class EmailRequestSerializer(serializers.Serializer):
    email_content = serializers.CharField()
    tone = serializers.CharField(required=False, allow_blank=True, default="")
    greeting = serializers.CharField(required=False, allow_blank=True, default="")
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    sender_name = serializers.CharField(required=False, allow_blank=True, default="")