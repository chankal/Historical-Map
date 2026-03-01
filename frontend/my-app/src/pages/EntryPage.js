import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EntryCard from "../components/EntryCard";

const API_BASE = "http://127.0.0.1:8000/api";

export default function EntryPage() {
  const { id } = useParams();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        // add the street view stuff here
        <div className="entryRightEmpty">
            <p>STREET VIEW HERE</p>
        </div>
      }
    />
  );
}
