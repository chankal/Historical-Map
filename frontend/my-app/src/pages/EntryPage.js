import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EntryCard from "../components/EntryCard";

const API_BASE = "http://127.0.0.1:8000/api";
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API;

export default function EntryPage() {
  const { id } = useParams();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [latLng, setLatLng] = useState(null);

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
            data.details?.short_blurb ||
            data.details?.blurb ||
            data.details?.description ||
            "No blurb available.",
          longDescription:
            data.details?.description ||
            data.details?.long_description ||
            "No description available.",
          address: data.details?.address || null,
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

  // Geocode the address to get lat/lng
  useEffect(() => {
    const geocodeAddress = async (address) => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
        );
        const data = await res.json();
        if (data.status === "OK" && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          setLatLng(location);
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
      returnTo="/all-entries"
      right={
        latLng ? (
          <iframe
            title="Street View"
            width="100%"
            height="430"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps/embed/v1/streetview?key=${GOOGLE_API_KEY}&location=${latLng.lat},${latLng.lng}&heading=210&pitch=10`}
          />
        ) : entry.address ? (
          <div className="entryRightEmpty">
            <p>Street View not available for this address</p>
          </div>
        ) : null
      }
    />
  );
}
