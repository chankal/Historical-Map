from rest_framework import serializers
from .models import HistoricalEntry
from .storage_utils import upload_image_to_supabase


class HistoricalEntrySerializer(serializers.ModelSerializer):
    image_upload = serializers.ImageField(required=False, write_only=True)

    class Meta:
        model = HistoricalEntry
        fields = ['id', 'name', 'details', 'image', 'image_upload']

    def create(self, validated_data):
        image_upload = validated_data.pop('image_upload', None)
        if image_upload:
            validated_data['image'] = upload_image_to_supabase(
                image_upload, name_prefix='entry'
            )
        return super().create(validated_data)

    def update(self, instance, validated_data):
        image_upload = validated_data.pop('image_upload', None)
        if image_upload:
            validated_data['image'] = upload_image_to_supabase(
                image_upload, name_prefix='entry'
            )
        return super().update(instance, validated_data)
