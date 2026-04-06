import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import EntryCard from "../components/EntryCard";
import EntryMapPanel from "../components/EntryMapPanel";
import Navbar from "../components/Navbar";
import TourCard from "../components/TourCard";
import fallbackData from "../data/fallbackData.js";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || null;

const LOREM_SPOTS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
];

/** Build 3 placeholder stops from legacy single-address data when API has no stops array */
function normalizeStopsFromApi(data, extra = {}) {
  if (Array.isArray(data.stops) && data.stops.length > 0) {
    return data.stops.map((s) => ({ ...s }));
  }
  const d = data.details || {};
  const addr = d.address || "";
  let lat = d.lat;
  let lng = d.lng;
  if ((lat == null || lng == null) && extra.latLng) {
    lat = extra.latLng.lat;
    lng = extra.latLng.lng;
  }
  return [0, 1, 2].map((i) => ({
    address: addr,
    spot_blurb: LOREM_SPOTS[i],
    ...(lat != null && lng != null
      ? { lat: Number(lat), lng: Number(lng) }
      : {}),
  }));
}

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
  const [activeStopIndex, setActiveStopIndex] = useState(0);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        setActiveStopIndex(0);
        const res = await fetch(`${API_BASE}/entry/${slug}/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const allRes = await fetch(`${API_BASE}/all/`);
        let computedStopNumber = null;
        let computedPrevEntrySlug = null;
        let computedNextEntrySlug = null;

        if (allRes.ok) {
          const allData = await allRes.json();
          const getSlug = (e) =>
            e.slug ||
            e.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ||
            String(e.id);
          const matchIndex = allData.findIndex(
            (e) => getSlug(e) === (data.slug || slug)
          );
          computedStopNumber = matchIndex >= 0 ? matchIndex + 1 : null;

          if (matchIndex > 0) {
            computedPrevEntrySlug = getSlug(allData[matchIndex - 1]);
          }

          if (matchIndex >= 0 && matchIndex < allData.length - 1) {
            computedNextEntrySlug = getSlug(allData[matchIndex + 1]);
          }
        }

        const stops = normalizeStopsFromApi(data);
        setEntry({
          id: data.id,
          name: data.name,
          blurb: data.details?.blurb || "No blurb available.",
          longDescription:
            data.details?.description || "No description available.",
          address: data.details?.address || null,
          obituary: data.details?.obituary || null,
          image: data.image || null,
          stops,
        });
        setStopNumber(computedStopNumber);
        setPrevEntrySlug(computedPrevEntrySlug);
        setNextEntrySlug(computedNextEntrySlug);
      } catch (err) {
        console.warn("API unavailable, using fallback data:", err.message);
        const getFallbackSlug = (e) =>
          e.slug ||
          e.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ||
          String(e.id);
        const fallback = fallbackData.find((e) => getFallbackSlug(e) === slug);
        if (fallback) {
          setUsingFallback(true);
          const matchIndex = fallbackData.findIndex(
            (e) => getFallbackSlug(e) === slug
          );
          const stops = normalizeStopsFromApi(fallback, { latLng: fallback.latLng });
          setEntry({
            id: fallback.id,
            name: fallback.name,
            blurb: fallback.details?.blurb || "No blurb available.",
            longDescription:
              fallback.details?.description || "No description available.",
            address: fallback.details?.address || null,
            obituary: fallback.details?.obituary || null,
            image: fallback.image || null,
            stops,
          });
          setStopNumber(matchIndex >= 0 ? matchIndex + 1 : null);
          setPrevEntrySlug(
            matchIndex > 0 ? getFallbackSlug(fallbackData[matchIndex - 1]) : null
          );
          setNextEntrySlug(
            matchIndex < fallbackData.length - 1
              ? getFallbackSlug(fallbackData[matchIndex + 1])
              : null
          );
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

  useEffect(() => {
    if (!entry?.stops?.length) {
      setLatLng(null);
      return;
    }
    const s = entry.stops[activeStopIndex];
    if (s?.lat != null && s?.lng != null) {
      setLatLng({
        lat: parseFloat(s.lat),
        lng: parseFloat(s.lng),
      });
    } else {
      setLatLng(null);
    }
  }, [entry, activeStopIndex]);

  const handleNextIntraStop = useCallback(() => {
    setActiveStopIndex((i) => {
      if (!entry?.stops?.length) return i;
      return Math.min(i + 1, entry.stops.length - 1);
    });
  }, [entry?.stops?.length]);

  const handlePrevIntraStop = useCallback(() => {
    setActiveStopIndex((i) => Math.max(0, i - 1));
  }, []);

  if (loading) {
    const sk = {
      display: "inline-block",
      background:
        "linear-gradient(90deg, #e8e8e8 25%, #d2d2d2 50%, #e8e8e8 75%)",
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
                <div style={{ ...sk, width: "110px", height: "14px" }} />

                <section className="entryIdentity" style={{ padding: "2px 0 0" }}>
                  <div className="entryAvatarWrap" aria-hidden="true">
                    <div
                      style={{ ...sk, width: "68px", height: "68px", borderRadius: "50%" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ ...sk, height: "28px", width: "60%", marginBottom: "10px" }}
                    />
                    <div style={{ ...sk, height: "13px", width: "85%" }} />
                  </div>
                </section>

                <div className="entryActionRow">
                  <div
                    style={{ ...sk, height: "32px", borderRadius: "10px", width: "100%" }}
                  />
                  <div
                    style={{ ...sk, height: "32px", borderRadius: "10px", width: "100%" }}
                  />
                </div>

                <section style={{ paddingTop: "2px" }}>
                  {[100, 92, 97, 87, 75, 90, 82].map((w, i) => (
                    <div
                      key={i}
                      style={{ ...sk, height: "13px", width: `${w}%`, marginBottom: "10px" }}
                    />
                  ))}
                </section>

                <div className="entryNavRow">
                  <div
                    style={{ ...sk, height: "28px", borderRadius: "10px", width: "100%" }}
                  />
                  <div
                    style={{ ...sk, height: "28px", borderRadius: "10px", width: "100%" }}
                  />
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
      <div style={{ padding: "40px", textAlign: "center" }}>Entry not found</div>
    );
  }

  const stops = entry.stops || [];
  const currentStop = stops[activeStopIndex];
  const directionsAddress =
    currentStop?.address || entry.address || null;
  const spotBlurb = currentStop?.spot_blurb || "";
  const addrLine =
    typeof currentStop?.address === "string" ? currentStop.address.trim() : "";
  const locationSubline =
    addrLine.length > 72 ? `${addrLine.slice(0, 69)}…` : addrLine;

  return (
    <>
      {usingFallback && (
        <div
          style={{
            background: "#e65c00",
            color: "#fff",
            textAlign: "center",
            padding: "6px 16px",
            fontSize: "0.82rem",
            fontFamily: '"Times New Roman", Times, serif',
            fontWeight: "lighter",
            letterSpacing: "0.01em",
          }}
        >
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
        address={directionsAddress}
        obituaryUrl={entry.obituary}
        image={entry.image}
        returnTo="/all-entries"
        right={
          <EntryMapPanel
            latLng={latLng}
            spotBlurb={spotBlurb}
            locationHeader={entry.name}
            locationSubline={locationSubline}
            activeIndex={activeStopIndex}
            totalStops={stops.length || 1}
            onNextSpot={handleNextIntraStop}
            onPrevSpot={handlePrevIntraStop}
            googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          />
        }
      />
    </>
  );
}
