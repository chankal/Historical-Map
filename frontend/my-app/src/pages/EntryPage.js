import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EntryCard from "../components/EntryCard";
import Navbar from "../components/Navbar";
import TourCard from "../components/TourCard";
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
        const lat = data.details?.lat;
        const lng = data.details?.lng;
        if (lat != null && lng != null) {
          setLatLng({ lat: parseFloat(lat), lng: parseFloat(lng) });
        } else {
          setLatLng(null);
        }
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
        ) : !latLng ? (
          <div className="entryRightEmpty">
            <p style={{ color: "#c0392b", fontWeight: "bold" }}>
              No location coordinates found for this entry.
            </p>
            <p style={{ fontSize: "0.85rem", color: "#555" }}>
              Please contact an admin to add coordinates for this entry.
            </p>
          </div>
        ) : null
      }
    />
    </>
  );
}
