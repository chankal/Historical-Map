from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'entries', views.HistoricalEntryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('all/', views.get_all_entries, name='all-entries'),
    path('entry/<slug:slug>/', views.get_entry_by_slug, name='get-entry-by-slug'),
    # admin panel APIs
    path('admin-auth/login/', views.admin_login, name='admin-login'),
    path('admin-auth/verify/', views.admin_verify, name='admin-verify'),
]
