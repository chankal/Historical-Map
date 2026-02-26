from rest_framework import serializers
from .models import HistoricalEntry

class HistoricalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricalEntry
        fields = ['id', 'name', 'details']
