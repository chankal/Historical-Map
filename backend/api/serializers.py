import json
import urllib.parse
import urllib.request

from rest_framework import serializers
from .models import HistoricalEntry
from .storage_utils import upload_image_to_supabase


def _geocode_details(details):
    if not isinstance(details, dict):
        return details
    address = details.get('address', '').strip()
    if not address:
        return details
    if details.get('lat') is not None and details.get('lng') is not None:
        return details

    url = (
        'https://nominatim.openstreetmap.org/search?format=json&limit=1&q='
        + urllib.parse.quote(address)
    )
    req = urllib.request.Request(url, headers={'User-Agent': 'HistoricalMapApp/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        if data:
            details = dict(details)
            details['lat'] = float(data[0]['lat'])
            details['lng'] = float(data[0]['lon'])
    except Exception:
        pass
    return details


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
        validated_data['details'] = _geocode_details(validated_data.get('details', {}))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        image_upload = validated_data.pop('image_upload', None)
        if image_upload:
            validated_data['image'] = upload_image_to_supabase(
                image_upload, name_prefix='entry'
            )
        if 'details' in validated_data:
            validated_data['details'] = _geocode_details(validated_data['details'])
        return super().update(instance, validated_data)
