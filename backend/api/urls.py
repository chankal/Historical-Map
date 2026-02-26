from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'entries', views.HistoricalEntryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('all/', views.get_all_entries, name='all-entries'),
    path('entry/<int:pk>/', views.get_entry, name='get-entry'),
]
