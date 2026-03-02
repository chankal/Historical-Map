from django.db import models

# Entry with name, JSON file, and image
class HistoricalEntry(models.Model):
    name = models.CharField(max_length=200)
    details = models.JSONField()
    image = models.ImageField(upload_to='historical_images/', null=True, blank=True)

    def __str__(self):
        return self.name