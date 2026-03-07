from django import forms
from django.contrib import admin
from .models import HistoricalEntry
from .storage_utils import upload_image_to_supabase


class HistoricalEntryAdminForm(forms.ModelForm):
    image_upload = forms.ImageField(required=False, label='Upload new image')

    class Meta:
        model = HistoricalEntry
        fields = ['name', 'details', 'image', 'image_upload']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['image'].required = False

    def save(self, commit=True):
        instance = super().save(commit=False)
        f = self.cleaned_data.get('image_upload')
        if f:
            instance.image = upload_image_to_supabase(f, name_prefix='entry')
        if commit:
            instance.save()
        return instance


@admin.register(HistoricalEntry)
class HistoricalEntryAdmin(admin.ModelAdmin):
    form = HistoricalEntryAdminForm
    list_display = ('name', 'image')
