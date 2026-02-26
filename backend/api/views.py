from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import HistoricalEntry
from .serializers import HistoricalEntrySerializer

# ViewSet for CRUD operations
class HistoricalEntryViewSet(viewsets.ModelViewSet):
    queryset = HistoricalEntry.objects.all()
    serializer_class = HistoricalEntrySerializer

# Simple API view to get all entries
@api_view(['GET'])
def get_all_entries(request):
    entries = HistoricalEntry.objects.all()
    serializer = HistoricalEntrySerializer(entries, many=True)
    return Response(serializer.data)

# Get a single entry by ID
@api_view(['GET'])
def get_entry(request, pk):
    try:
        entry = HistoricalEntry.objects.get(pk=pk)
        serializer = HistoricalEntrySerializer(entry)
        return Response(serializer.data)
    except HistoricalEntry.DoesNotExist:
        return Response({'error': 'Entry not found'}, status=404)
