from django.db import models


class HistoricalEntry(models.Model):
    name = models.CharField(max_length=200)
    details = models.JSONField()
    image = models.URLField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.name