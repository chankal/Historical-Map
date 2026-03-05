from django.shortcuts import render
from django.core.cache import cache
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import HistoricalEntry
from .serializers import HistoricalEntrySerializer
import requests as http_requests

# ViewSet for CRUD operations
class HistoricalEntryViewSet(viewsets.ModelViewSet):
    queryset = HistoricalEntry.objects.all()
    serializer_class = HistoricalEntrySerializer

# Simple API view to get all entries
@api_view(['GET'])
def get_all_entries(request):
    entries = HistoricalEntry.objects.all()
    serializer = HistoricalEntrySerializer(entries, many=True, context={'request': request})
    return Response(serializer.data)

# Get a single entry by ID
@api_view(['GET'])
def get_entry(request, pk):
    try:
        entry = HistoricalEntry.objects.get(pk=pk)
        serializer = HistoricalEntrySerializer(entry, context={'request': request})
        return Response(serializer.data)
    except HistoricalEntry.DoesNotExist:
        return Response({'error': 'Entry not found'}, status=404)


# Geocode an address via Nominatim with cache
@api_view(['GET'])
def geocode(request):
    address = request.query_params.get('address', '').strip()
    if not address:
        return Response({'error': 'address parameter is required'}, status=400)

    cache_key = f'geocode:{address.lower()}'
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    try:
        resp = http_requests.get(
            'https://nominatim.openstreetmap.org/search',
            params={'format': 'json', 'q': address, 'limit': 1},
            headers={'User-Agent': 'HistoricalMapApp/1.0'},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        return Response({'error': f'Nominatim request failed: {e}'}, status=502)

    if not data:
        return Response({'error': 'No results found'}, status=404)

    result = {'lat': float(data[0]['lat']), 'lng': float(data[0]['lon'])}
    # Cache indefinitely (addresses don't change often)
    cache.set(cache_key, result, timeout=None)
    return Response(result)
