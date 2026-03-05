import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EntryCard from "../components/EntryCard";
import { useGoogleMapsAPI } from "../contexts/GoogleMapsAPIContext";

const API_BASE = "http://127.0.0.1:8000/api";

export default function EntryPage() {
  const { id } = useParams();
  const { requestAPIKey } = useGoogleMapsAPI();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [latLng, setLatLng] = useState(null);
  const [googleAPIKey, setGoogleAPIKey] = useState(null);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/entry/${id}/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setEntry({
          id: data.id,
          name: data.name,
          blurb:
            data.details?.blurb ||
            "No blurb available.",
          longDescription:
            data.details?.description ||
            "No description available.",
          address: data.details?.address || null,
          image: data.image || null,
        });
      } catch (err) {
        setError(`Failed to load entry: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEntry();
    }
  }, [id]);

  // Geocode the address using the internal API (proxies Nominatim, server-side cached)
  useEffect(() => {
    const geocodeAddress = async (address) => {
      try {
        const res = await fetch(
          `${API_BASE}/geocode/?address=${encodeURIComponent(address)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.lat && data.lng) {
            setLatLng({ lat: data.lat, lng: data.lng });
          } else {
            setLatLng(null);
          }
        } else {
          setLatLng(null);
        }
      } catch {
        setLatLng(null);
      }
    };

    if (entry?.address) {
      geocodeAddress(entry.address);
    }
  }, [entry]);

  // Request Google API key and show Street View when user clicks
  const handleLoadStreetView = async () => {
    const key = await requestAPIKey();
    if (key) setGoogleAPIKey(key);
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading entry...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "red" }}>
        {error}
      </div>
    );
  }

  if (!entry) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Entry not found
      </div>
    );
  }

  return (
    <EntryCard
      name={entry.name}
      blurb={entry.blurb}
      longDescription={entry.longDescription}
      address={entry.address}
      image={entry.image}
      returnTo="/all-entries"
      right={
        latLng && googleAPIKey ? (
          <iframe
            title="Street View"
            width="100%"
            height="430"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps/embed/v1/streetview?key=${googleAPIKey}&location=${latLng.lat},${latLng.lng}&heading=210&pitch=10`}
          />
        ) : latLng ? (
          <div
            className="entryRightEmpty"
            onClick={handleLoadStreetView}
            style={{ cursor: "pointer" }}
          >
            <p>Click to load Street View (requires Google API key)</p>
          </div>
        ) : null
      }
    />
  );
}
