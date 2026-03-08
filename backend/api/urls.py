from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'entries', views.HistoricalEntryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('all/', views.get_all_entries, name='all-entries'),
    path('entry/<int:pk>/', views.get_entry, name='get-entry'),
    path('entry/<str:slug>/', views.get_entry_by_slug, name='get-entry-by-slug'),
    path('geocode/', views.geocode, name='geocode'),
    # admin panel APIs
    path('admin-auth/login/', views.admin_login, name='admin-login'),
    path('admin-auth/verify/', views.admin_verify, name='admin-verify'),
]
