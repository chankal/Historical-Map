from django.contrib import admin


# Register your models here.
from .models import HistoricalEntry

admin.site.register(HistoricalEntry)