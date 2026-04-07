from django.db import models


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

    def __str__(self):
        return self.name