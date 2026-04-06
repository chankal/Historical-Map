import json
import urllib.parse
import urllib.request
from types import SimpleNamespace

from django.utils.text import slugify
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


def _geocode_stops(stops):
    if not isinstance(stops, list):
        return stops or []
    out = []
    for stop in stops:
        if not isinstance(stop, dict):
            out.append(stop)
            continue
        s = dict(stop)
        address = (s.get("address") or "").strip()
        if not address:
            out.append(s)
            continue
        if s.get("lat") is not None and s.get("lng") is not None:
            out.append(s)
            continue
        url = (
            "https://nominatim.openstreetmap.org/search?format=json&limit=1&q="
            + urllib.parse.quote(address)
        )
        req = urllib.request.Request(url, headers={"User-Agent": "HistoricalMapApp/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
            if data:
                s["lat"] = float(data[0]["lat"])
                s["lng"] = float(data[0]["lon"])
        except Exception:
            pass
        out.append(s)
    return out


def _legacy_stops_from_details(obj):
    d = obj.details or {}
    addr = d.get("address") or ""
    lat = d.get("lat")
    lng = d.get("lng")
    lorems = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
    ]
    stops = []
    for i in range(3):
        s = {"address": addr, "spot_blurb": lorems[i]}
        if lat is not None and lng is not None:
            try:
                s["lat"] = float(lat)
                s["lng"] = float(lng)
            except (TypeError, ValueError):
                pass
        stops.append(s)
    return stops


class HistoricalEntrySerializer(serializers.ModelSerializer):
    image_upload = serializers.ImageField(required=False, write_only=True)
    slug = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = HistoricalEntry
        fields = ['id', 'name', 'slug', 'details', 'stops', 'image', 'image_upload']

    def get_slug(self, obj):
        return slugify(obj.name) or str(obj.id)

    def validate_stops(self, value):
        if value is None or value == '':
            return []
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError('Invalid stops JSON.') from exc
        if not isinstance(value, list):
            raise serializers.ValidationError('stops must be a list.')
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not data.get('stops'):
            data['stops'] = _legacy_stops_from_details(instance)
        return data

    def create(self, validated_data):
        image_upload = validated_data.pop('image_upload', None)
        if image_upload:
            validated_data['image'] = upload_image_to_supabase(
                image_upload, name_prefix='entry'
            )
        validated_data['details'] = _geocode_details(validated_data.get('details', {}))
        stops_in = validated_data.get('stops', [])
        if not stops_in:
            stops_in = _legacy_stops_from_details(
                SimpleNamespace(details=validated_data.get('details', {}))
            )
        validated_data['stops'] = _geocode_stops(stops_in)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        image_upload = validated_data.pop('image_upload', None)
        if image_upload:
            validated_data['image'] = upload_image_to_supabase(
                image_upload, name_prefix='entry'
            )
        if 'details' in validated_data:
            validated_data['details'] = _geocode_details(validated_data['details'])
        if 'stops' in validated_data:
            validated_data['stops'] = _geocode_stops(validated_data.get('stops', []))
        return super().update(instance, validated_data)
