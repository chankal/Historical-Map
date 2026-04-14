import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TourCard from "../components/TourCard";
import MapWithPins from "../components/MapWithPins";
import busStopIcon from "../images/bus-stop.png";
import fallbackData from "../data/fallbackData.js";
import "./AllEntries.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

const RETRY_DELAY_MS = [800, 1800];

async function fetchWithRetry(url, options = {}, retries = RETRY_DELAY_MS) {
  let lastError;

  for (let attempt = 0; attempt <= retries.length; attempt += 1) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;

      // Render cold starts can briefly return 5xx before the app is awake.
      if (res.status >= 500 && attempt < retries.length) {
        await new Promise((resolve) => setTimeout(resolve, retries[attempt]));
        continue;
      }

      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
      if (attempt < retries.length) {
        await new Promise((resolve) => setTimeout(resolve, retries[attempt]));
        continue;
      }
    }
  }

  throw lastError || new Error("Request failed");
}

export default function AllEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState("");
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const res = await fetchWithRetry(`${API_BASE}/all/`);
        const data = await res.json();

        const mapped = data.map((e) => ({
          id: e.id,
          name: e.name,
          slug: e.slug || e.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          blurb:
            e.details?.short_blurb ||
            e.details?.blurb ||
            e.details?.description ||
            "No blurb yet.",
          address: e.details?.address || null,
          lat: e.details?.lat ?? null,
          lng: e.details?.lng ?? null,
          image: e.image || null,
        }));

        setEntries(mapped);
      } catch (err) {
        console.warn("API unavailable, using fallback data:", err.message);
        setUsingFallback(true);
        const mapped = fallbackData.map((e) => ({
          id: e.id,
          name: e.name,
          slug: e.slug || e.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          blurb:
            e.details?.short_blurb ||
            e.details?.blurb ||
            e.details?.description ||
            "No blurb yet.",
          address: e.details?.address || null,
          lat: e.latLng?.lat ?? e.details?.lat ?? null,
          lng: e.latLng?.lng ?? e.details?.lng ?? null,
          image: e.image || null,
        }));
        setEntries(mapped);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  return (
    <div className="allEntriesPage">
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
      <main className="allEntriesContent">
        <TourCard
          className="allEntriesCard"
          left={
            <div className="allEntriesLeft">
              <Link className="returnToTours" to="/tours">
                &lt; Return to Tours
              </Link>

              <section className="tourInfoBox">
                <div className="tourHeaderRow">
                  <span className="tourHeaderLine" aria-hidden="true" />
                  <h2 className="tourInfoTitle">Atlanta History Tour</h2>
                  <span className="tourHeaderLine" aria-hidden="true" />
                </div>
                
                <div className="tourActionRow">
                  <div className="tourStops">
                    <img src={busStopIcon} alt="Bus stop icon" />
                    <span>{entries.length} stops</span>
                  </div>

                  <Link
                    className="tourStartButton"
                    to={entries.length > 0 ? `/entry/${entries[0].slug}` : "/entry"}
                  >
                    Get Started
                  </Link>
                </div>
              </section>

              <section className="entryList">
                {loading && <p>Loading entries...</p>}
                {error && <p>{error}</p>}
                {!loading &&
                  !error &&
                  entries.map((entry, index) => (
                    <Link
                      to={`/entry/${entry.slug}`}
                      key={entry.id}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <article
                        className="allEntriesEntryBox"
                        onMouseEnter={() => setSelectedEntryIndex(index)}
                        onMouseLeave={() => setSelectedEntryIndex(null)}
                        style={{
                          cursor: "pointer",
                          borderColor: selectedEntryIndex === index ? "#D43C67" : "#dfdfdf",
                          transition: "border-color 0.2s",
                        }}
                      >
                        <div className="allEntriesThumbWrap" aria-hidden="true">
                          <span className="entryIndexBadge">{index + 1}</span>
                          <div
                            className="allEntriesEntryThumb"
                            style={{
                              backgroundImage: entry.image ? `url(${entry.image})` : "none",
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          />
                        </div>
                        <div className="allEntriesEntryText">
                          <h3 className="allEntriesEntryName">{entry.name}</h3>
                          <p className="allEntriesEntryBlurb">{entry.blurb}</p>
                        </div>
                      </article>
                    </Link>
                  ))}
              </section>
            </div>
          }
          right={
            <MapWithPins
              entries={entries}
              selectedIndex={selectedEntryIndex}
            />
          }
        />
      </main>
    </div>
  );
}
