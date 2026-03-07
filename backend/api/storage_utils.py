"""Upload files to Supabase Storage and return public URLs."""
import os
import uuid
from supabase import create_client

BUCKET_NAME = 'historical-images'


def get_supabase_client():
    """Create Supabase client from env vars."""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        raise ValueError(
            'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env'
        )
    return create_client(url, key)


def upload_image_to_supabase(file, name_prefix='entry') -> str:
    """
    Upload a file to Supabase Storage and return the public URL.
    """
    client = get_supabase_client()

    # Generate unique filename
    ext = os.path.splitext(getattr(file, 'name', 'image'))[1] or '.jpg'
    filename = f"{name_prefix}_{uuid.uuid4().hex}{ext}"

    content_type = getattr(file, 'content_type', None) or 'image/jpeg'
    if hasattr(file, 'seek'):
        file.seek(0)
    file_bytes = file.read() if hasattr(file, 'read') else file

    # storage3 accepts bytes, BufferedReader, FileIO, or path (not Django's InMemoryUploadedFile)
    client.storage.from_(BUCKET_NAME).upload(
        path=filename,
        file=file_bytes,
        file_options={'content-type': content_type}
    )

    # Build public URL
    base_url = os.getenv('SUPABASE_URL').rstrip('/')
    return f"{base_url}/storage/v1/object/public/{BUCKET_NAME}/{filename}"
