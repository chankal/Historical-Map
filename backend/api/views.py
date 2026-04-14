import hmac as hmac_lib
from django.core import signing
from django.utils.text import slugify
from django.conf import settings
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import HistoricalEntry
from .serializers import HistoricalEntrySerializer

ADMIN_TOKEN_MAX_AGE = 86400  # 24 hours

def _check_admin_token(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return False
    token = auth[7:]
    try:
        signing.loads(token, max_age=ADMIN_TOKEN_MAX_AGE, salt='admin-token')
        return True
    except Exception:
        return False


# ViewSet for CRUD operations
class HistoricalEntryViewSet(viewsets.ModelViewSet):
    queryset = HistoricalEntry.objects.order_by('id')
    serializer_class = HistoricalEntrySerializer

    def _require_admin(self, request):
        if not _check_admin_token(request):
            return Response({'error': 'Unauthorized'}, status=401)
        return None

    def create(self, request, *args, **kwargs):
        err = self._require_admin(request)
        if err:
            return err
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        err = self._require_admin(request)
        if err:
            return err
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        err = self._require_admin(request)
        if err:
            return err
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        err = self._require_admin(request)
        if err:
            return err
        return super().destroy(request, *args, **kwargs)


# Simple API view to get all entries
@api_view(['GET'])
def get_all_entries(request):
    entries = HistoricalEntry.objects.order_by('id')
    serializer = HistoricalEntrySerializer(entries, many=True, context={'request': request})
    return Response(serializer.data)


# Get a single entry by ID (for admin/API)
@api_view(['GET'])
def get_entry(request, pk):
    try:
        entry = HistoricalEntry.objects.get(pk=pk)
        serializer = HistoricalEntrySerializer(entry, context={'request': request})
        return Response(serializer.data)
    except HistoricalEntry.DoesNotExist:
        return Response({'error': 'Entry not found'}, status=404)


# Get a single entry by slug (name-based URL)
@api_view(['GET'])
def get_entry_by_slug(request, slug):
    slug_normalized = slugify(slug) or slug.lower().strip()
    entry = HistoricalEntry.objects.filter(slug=slug_normalized).first()
    if entry is None:
        # Backward-compatible fallback for older rows that may not have had slug populated.
        for candidate in HistoricalEntry.objects.order_by('id'):
            if slugify(candidate.name) == slug_normalized:
                entry = candidate
                break
    if entry is not None:
        serializer = HistoricalEntrySerializer(entry, context={'request': request})
        return Response(serializer.data)
    return Response({'error': 'Entry not found'}, status=404)


@api_view(['POST'])
def admin_login(request):
    password = request.data.get('password', '')
    expected = getattr(settings, 'ADMIN_PASSWORD', None)
    if not expected:
        return Response({'error': 'Admin password not configured on server'}, status=500)
    # security feature for preventing time based attack
    if not hmac_lib.compare_digest(str(password), str(expected)):
        return Response({'error': 'Invalid password'}, status=401)
    token = signing.dumps({'admin': True}, salt='admin-token')
    return Response({'token': token})


@api_view(['GET'])
def admin_verify(request):
    if not _check_admin_token(request):
        return Response({'error': 'Unauthorized'}, status=401)
    return Response({'valid': True})



