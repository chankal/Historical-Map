# Generated manually for multi-stop entries

from django.db import migrations, models


def populate_stops(apps, schema_editor):
    HistoricalEntry = apps.get_model("api", "HistoricalEntry")
    lorems = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
    ]
    for entry in HistoricalEntry.objects.all():
        details = entry.details or {}
        addr = details.get("address") or ""
        lat = details.get("lat")
        lng = details.get("lng")
        stops = []
        for i in range(3):
            s = {"address": addr, "spot_blurb": lorems[i]}
            if lat is not None and lng is not None:
                try:
                    s["lat"] = float(lat)
                    s["lng"] = float(lng)
                except (TypeError, ValueError):
                    pass
            stops.append(s)
        entry.stops = stops
        entry.save(update_fields=["stops"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_add_slug"),
    ]

    operations = [
        migrations.AddField(
            model_name="historicalentry",
            name="stops",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.RunPython(populate_stops, noop_reverse),
    ]
