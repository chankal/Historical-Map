import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EntryMapPanel from "../components/EntryMapPanel";
import fallbackData from "../data/fallbackData.js";
import profileIcon from "../images/profile-icon.svg";
import "./PopUpEntryPage.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || null;

const LOREM_SPOTS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
];

function getSlug(entry) {
  return (
    entry.slug ||
    entry.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ||
    String(entry.id)
  );
}

function normalizeStopsFromApi(data, extra = {}) {
  if (Array.isArray(data.stops) && data.stops.length > 0) {
    return data.stops.map((stop) => ({ ...stop }));
  }

  const details = data.details || {};
  const address = details.address || "";
  const lat = details.lat ?? extra.latLng?.lat;
  const lng = details.lng ?? extra.latLng?.lng;

  return [0, 1, 2].map((index) => ({
    address,
    spot_blurb: LOREM_SPOTS[index],
    ...(lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : {}),
  }));
}

function normalizeEntry(data, extra = {}) {
  return {
    id: data.id,
    name: data.name,
    blurb: data.details?.blurb || "No blurb available.",
    shortDescription:
      data.details?.short_blurb ||
      data.details?.short_description ||
      data.details?.blurb ||
      "No short description available.",
    description: data.details?.description || "No description available.",
    address: data.details?.address || null,
    image: data.image || null,
    stops: normalizeStopsFromApi(data, extra),
  };
}

export default function PopUpEntryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(() => window.innerWidth > 820);
  const [closeOrbSignal, setCloseOrbSignal] = useState(0);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        setError("");
        setUsingFallback(false);
        setActiveStopIndex(0);
        setIsInfoOpen(window.innerWidth > 820);

        const res = await fetch(`${API_BASE}/entry/${slug}/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setEntry(normalizeEntry(data));
      } catch (err) {
        console.warn("API unavailable, using fallback data:", err.message);
        const fallback = fallbackData.find((item) => getSlug(item) === slug);

        if (!fallback) {
          setError(`Failed to load entry: ${err.message}`);
          return;
        }

        setUsingFallback(true);
        setEntry(normalizeEntry(fallback, { latLng: fallback.latLng }));
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEntry();
    }
  }, [slug]);

  const handleNextSpot = useCallback(() => {
    setActiveStopIndex((index) => {
      if (!entry?.stops?.length) return index;
      return Math.min(index + 1, entry.stops.length - 1);
    });
  }, [entry?.stops?.length]);

  const handlePrevSpot = useCallback(() => {
    setActiveStopIndex((index) => Math.max(0, index - 1));
  }, []);

  if (loading) {
    return <div className="popUpEntryStatus">Loading entry...</div>;
  }

  if (error) {
    return <div className="popUpEntryStatus popUpEntryStatusError">{error}</div>;
  }

  if (!entry) {
    return <div className="popUpEntryStatus">Entry not found</div>;
  }

  const stops = entry.stops || [];
  const currentStop = stops[activeStopIndex];
  const latLng =
    currentStop?.lat != null && currentStop?.lng != null
      ? { lat: parseFloat(currentStop.lat), lng: parseFloat(currentStop.lng) }
      : null;
  const locationSubline =
    typeof currentStop?.address === "string" && currentStop.address.length > 72
      ? `${currentStop.address.slice(0, 69)}...`
      : currentStop?.address || "";
  const streetViewOptions = {
    heading: currentStop?.heading != null ? Number(currentStop.heading) : undefined,
    pitch: currentStop?.pitch != null ? Number(currentStop.pitch) : undefined,
    fov: currentStop?.fov != null ? Number(currentStop.fov) : undefined,
    pano: currentStop?.pano || "",
  };

  return (
    <div className="popUpEntryPage">
      {usingFallback && (
        <div className="popUpEntryFallbackBanner">
          Live data is currently unavailable. Please contact an admin if this persists.
        </div>
      )}

      <EntryMapPanel
        latLng={latLng}
        spotBlurb={currentStop?.spot_blurb || entry.shortDescription}
        locationHeader={entry.name}
        locationSubline={locationSubline}
        activeIndex={activeStopIndex}
        totalStops={stops.length || 1}
        onNextSpot={handleNextSpot}
        onPrevSpot={handlePrevSpot}
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        streetViewOptions={streetViewOptions}
        headerActionLabel="Exit"
        onHeaderActionClick={() => navigate(`/entry/${slug}`)}
        onOrbClose={() => navigate(`/entry/${slug}`)}
        onOrbToggle={(isOpen) => {
          if (isOpen) {
            setIsInfoOpen(false);
          }
        }}
        forceCloseOrbSignal={closeOrbSignal}
      />

      <button
        type="button"
        className="popUpEntryInfoButton"
        aria-label="Show entry information"
        onClick={() => {
          setIsInfoOpen(true);
          setCloseOrbSignal((v) => v + 1);
        }}
      >
        <img className="popUpEntryProfileIcon" src={profileIcon} alt="" aria-hidden="true" />
      </button>

      {isInfoOpen && (
        <aside className="popUpEntryInfoCard" aria-label={`${entry.name} information`}>
          <button
            type="button"
            className="popUpEntryClose"
            aria-label="Close entry information"
            onClick={() => setIsInfoOpen(false)}
          >
            x
          </button>

          {entry.image && (
            <img className="popUpEntryImage" src={entry.image} alt={entry.name} />
          )}

          <div className="popUpEntryCardBody">
            <h1>{entry.name}</h1>

            <section>
              <h2>Blurb</h2>
              <p>{entry.shortDescription}</p>
            </section>

            <section>
              <h2>Description</h2>
              <p>{entry.description}</p>
            </section>
          </div>
        </aside>
      )}
    </div>
  );
}
