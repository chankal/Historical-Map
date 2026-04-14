from django.db import models
from django.utils.text import slugify


class HistoricalEntry(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, blank=True, unique=True)
    details = models.JSONField()
    stops = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "List of {address, spot_blurb, lat?, lng?, heading?, pitch?, fov?, pano?} "
            "for multiple map locations."
        ),
    )
    image = models.URLField(max_length=500, blank=True, null=True)

    def _generate_unique_slug(self):
        base_slug = slugify(self.name or "") or "entry"
        slug = base_slug
        suffix = 2

        while HistoricalEntry.objects.exclude(pk=self.pk).filter(slug=slug).exists():
            slug = f"{base_slug}-{suffix}"
            suffix += 1

        return slug

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name