from django.db import models

# Create your models here.

# Entry with name  & JSON file
class HistoricalEntry(models.Model):
    name = models.CharField(max_length=200)
    details = models.JSONField() 

    def __str__(self):
        return self.name