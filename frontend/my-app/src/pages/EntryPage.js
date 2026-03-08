import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EntryCard from "../components/EntryCard";
import Navbar from "../components/Navbar";
import TourCard from "../components/TourCard";
import fallbackData from "../data/fallbackData.js";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || null;

export default function EntryPage() {
  const { id } = useParams();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [latLng, setLatLng] = useState(null);
  const [stopNumber, setStopNumber] = useState(null);
  const [prevEntryId, setPrevEntryId] = useState(null);
  const [nextEntryId, setNextEntryId] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/entry/${id}/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const allRes = await fetch(`${API_BASE}/all/`);
        let computedStopNumber = null;
        let computedPrevEntryId = null;
        let computedNextEntryId = null;

        if (allRes.ok) {
          const allData = await allRes.json();
          const matchIndex = allData.findIndex((e) => String(e.id) === String(data.id));
          computedStopNumber = matchIndex >= 0 ? matchIndex + 1 : null;

          if (matchIndex > 0) {
            computedPrevEntryId = allData[matchIndex - 1]?.id ?? null;
          }

          if (matchIndex >= 0 && matchIndex < allData.length - 1) {
            computedNextEntryId = allData[matchIndex + 1]?.id ?? null;
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
        setPrevEntryId(computedPrevEntryId);
        setNextEntryId(computedNextEntryId);
      } catch (err) {
        console.warn("API unavailable, using fallback data:", err.message);
        const fallback = fallbackData.find((e) => String(e.id) === String(id));
        if (fallback) {
          setUsingFallback(true);
          const matchIndex = fallbackData.findIndex((e) => String(e.id) === String(id));
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
          setPrevEntryId(matchIndex > 0 ? fallbackData[matchIndex - 1].id : null);
          setNextEntryId(matchIndex < fallbackData.length - 1 ? fallbackData[matchIndex + 1].id : null);
          if (fallback.latLng) setLatLng(fallback.latLng);
        } else {
          setError(`Failed to load entry: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEntry();
    }
  }, [id]);

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
    const sk = {
      display: "inline-block",
      background: "linear-gradient(90deg, #e8e8e8 25%, #d2d2d2 50%, #e8e8e8 75%)",
      backgroundSize: "200% 100%",
      animation: "entrySkeletonShimmer 1.4s infinite",
      borderRadius: "5px",
    };
    return (
      <div className="entryPage">
        <style>{`
          @keyframes entrySkeletonShimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        <Navbar showToursHeader toursHeaderClassName="entryToursHeaderBlock" />
        <main className="entryContent">
          <TourCard
            className="entryTourCard"
            left={
              <div className="entryLeftLayout">
                {/* back link placeholder */}
                <div style={{ ...sk, width: "110px", height: "14px" }} />

                {/* identity row */}
                <section className="entryIdentity" style={{ padding: "2px 0 0" }}>
                  <div className="entryAvatarWrap" aria-hidden="true">
                    <div style={{ ...sk, width: "68px", height: "68px", borderRadius: "50%" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...sk, height: "28px", width: "60%", marginBottom: "10px" }} />
                    <div style={{ ...sk, height: "13px", width: "85%" }} />
                  </div>
                </section>

                {/* action buttons */}
                <div className="entryActionRow">
                  <div style={{ ...sk, height: "32px", borderRadius: "10px", width: "100%" }} />
                  <div style={{ ...sk, height: "32px", borderRadius: "10px", width: "100%" }} />
                </div>

                {/* description lines */}
                <section style={{ paddingTop: "2px" }}>
                  {[100, 92, 97, 87, 75, 90, 82].map((w, i) => (
                    <div key={i} style={{ ...sk, height: "13px", width: `${w}%`, marginBottom: "10px" }} />
                  ))}
                </section>

                {/* nav row */}
                <div className="entryNavRow">
                  <div style={{ ...sk, height: "28px", borderRadius: "10px", width: "100%" }} />
                  <div style={{ ...sk, height: "28px", borderRadius: "10px", width: "100%" }} />
                </div>
              </div>
            }
            right={<div className="entryRightEmpty" style={{ background: "#e8e8e8" }} />}
          />
        </main>
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
      prevEntryId={prevEntryId}
      nextEntryId={nextEntryId}
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
