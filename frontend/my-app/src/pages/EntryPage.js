import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EntryCard from "../components/EntryCard";
import fallbackData from "../data/fallbackData.js";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || null;

export default function EntryPage() {
  const { slug } = useParams();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [latLng, setLatLng] = useState(null);
  const [stopNumber, setStopNumber] = useState(null);
  const [prevEntrySlug, setPrevEntrySlug] = useState(null);
  const [nextEntrySlug, setNextEntrySlug] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/entry/${slug}/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const allRes = await fetch(`${API_BASE}/all/`);
        let computedStopNumber = null;
        let computedPrevEntrySlug = null;
        let computedNextEntrySlug = null;

        if (allRes.ok) {
          const allData = await allRes.json();
          const getSlug = (e) => e.slug || e.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || String(e.id);
          const matchIndex = allData.findIndex((e) => getSlug(e) === (data.slug || slug));
          computedStopNumber = matchIndex >= 0 ? matchIndex + 1 : null;

          if (matchIndex > 0) {
            computedPrevEntrySlug = getSlug(allData[matchIndex - 1]);
          }

          if (matchIndex >= 0 && matchIndex < allData.length - 1) {
            computedNextEntrySlug = getSlug(allData[matchIndex + 1]);
          }
        }

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
          obituary: data.details?.obituary || null,
          image: data.image || null,
        });
        setStopNumber(computedStopNumber);
        setPrevEntrySlug(computedPrevEntrySlug);
        setNextEntrySlug(computedNextEntrySlug);
      } catch (err) {
        console.warn("API unavailable, using fallback data:", err.message);
        const getFallbackSlug = (e) => e.slug || e.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || String(e.id);
        const fallback = fallbackData.find((e) => getFallbackSlug(e) === slug);
        if (fallback) {
          setUsingFallback(true);
          const matchIndex = fallbackData.findIndex((e) => getFallbackSlug(e) === slug);
          setEntry({
            id: fallback.id,
            name: fallback.name,
            blurb: fallback.details?.blurb || "No blurb available.",
            longDescription: fallback.details?.description || "No description available.",
            address: fallback.details?.address || null,
            obituary: fallback.details?.obituary || null,
            image: fallback.image || null,
          });
          setStopNumber(matchIndex >= 0 ? matchIndex + 1 : null);
          setPrevEntrySlug(matchIndex > 0 ? getFallbackSlug(fallbackData[matchIndex - 1]) : null);
          setNextEntrySlug(matchIndex < fallbackData.length - 1 ? getFallbackSlug(fallbackData[matchIndex + 1]) : null);
          if (fallback.latLng) setLatLng(fallback.latLng);
        } else {
          setError(`Failed to load entry: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEntry();
    }
  }, [slug]);

  // Geocode the address by calling Nominatim directly from the browser
  useEffect(() => {
    const geocodeAddress = async (address) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setLatLng({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
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

    if (entry?.address && !usingFallback) {
      geocodeAddress(entry.address);
    }
  }, [entry, usingFallback]);

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
    <>
      {usingFallback && (
        <div style={{
          background: "#e65c00",
          color: "#fff",
          textAlign: "center",
          padding: "6px 16px",
          fontSize: "0.82rem",
          fontFamily: '"Times New Roman", Times, serif',
          fontWeight: "lighter",
          letterSpacing: "0.01em",
        }}>
          Live data is currently unavailable. Please contact an admin if this persists.
        </div>
      )}
      <EntryCard
      name={entry.name}
      blurb={entry.blurb}
      longDescription={entry.longDescription}
      stopNumber={stopNumber}
      prevEntrySlug={prevEntrySlug}
      nextEntrySlug={nextEntrySlug}
      address={entry.address}
      obituaryUrl={entry.obituary}
      image={entry.image}
      returnTo="/all-entries"
      right={
        latLng && GOOGLE_MAPS_API_KEY ? (
          <iframe
            title="Street View"
            width="100%"
            height="430"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            allow="accelerometer; gyroscope"
            src={`https://www.google.com/maps/embed/v1/streetview?key=${GOOGLE_MAPS_API_KEY}&location=${latLng.lat},${latLng.lng}&heading=210&pitch=10`}
          />
        ) : entry.address ? (
          <div className="entryRightEmpty">
            <p>Click to load Street View (requires API key)</p>
          </div>
        ) : null
      }
    />
    </>
  );
}
