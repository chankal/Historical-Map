import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  const [navOpen, setNavOpen] = useState(false);
  const [isMobileMap, setIsMobileMap] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");
    const updateMobileMap = () => setIsMobileMap(mediaQuery.matches);

    updateMobileMap();
    mediaQuery.addEventListener("change", updateMobileMap);

    return () => {
      mediaQuery.removeEventListener("change", updateMobileMap);
    };
  }, []);

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
        <div className="allEntriesFallbackBanner">
          Live data is currently unavailable. Please contact an admin if this persists.
        </div>
      )}

      <main className="allEntriesContent">
        <MapWithPins
          entries={entries}
          selectedIndex={selectedEntryIndex}
          onPinClick={setSelectedEntryIndex}
          onPinHover={setSelectedEntryIndex}
          onMapClick={() => setSelectedEntryIndex(null)}
          defaultZoom={isMobileMap ? 13 : 13}
          fitBoundsBottomPadding={isMobileMap ? 300 : 50}
          fitBoundsMaxZoom={13}
        />

        <nav className="allEntriesTopActions" aria-label="All entries navigation">
          <button
            type="button"
            className="allEntriesMenuToggle"
            aria-label={navOpen ? "Close all entries navigation menu" : "Open all entries navigation menu"}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((isOpen) => !isOpen)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`allEntriesTopMenu ${navOpen ? "allEntriesTopMenuOpen" : ""}`}>
            <Link className="allEntriesTopButton" to="/" onClick={() => setNavOpen(false)}>
              Home
            </Link>
            <Link className="allEntriesTopButton" to="/map" onClick={() => setNavOpen(false)}>
              Slide View
            </Link>
          </div>
        </nav>

        <aside className="allEntriesListPanel" aria-label="All entries">
          <section className="allEntriesTourSummary">
            <div className="allEntriesTourHeaderRow">
              <span className="allEntriesTourHeaderLine" aria-hidden="true" />
              <h2 className="allEntriesTourTitle">Atlanta History Tour</h2>
              <span className="allEntriesTourHeaderLine" aria-hidden="true" />
            </div>

            <div className="allEntriesTourActionRow">
              <div className="allEntriesTourStops">
                <img src={busStopIcon} alt="" aria-hidden="true" />
                <span>{entries.length} stops</span>
              </div>

              <Link
                className="allEntriesTourStartButton"
                to={entries.length > 0 ? `/entry/${entries[0].slug}` : "/entry"}
              >
                Get Started
              </Link>
            </div>
          </section>

          <section className="entryList">
            {loading && <p className="entryListStatus">Loading entries...</p>}
            {error && <p className="entryListStatus">{error}</p>}
            {!loading &&
              !error &&
              entries.map((entry, index) => (
                <Link
                  to={`/entry/${entry.slug}`}
                  key={entry.id}
                  className="allEntriesEntryLink"
                  onMouseEnter={() => setSelectedEntryIndex(index)}
                  onMouseLeave={() => setSelectedEntryIndex(null)}
                  onFocus={() => setSelectedEntryIndex(index)}
                  onBlur={() => setSelectedEntryIndex(null)}
                >
                  <article
                    className={`allEntriesEntryBox ${
                      selectedEntryIndex === index ? "allEntriesEntryBoxSelected" : ""
                    }`}
                  >
                    <div className="allEntriesThumbWrap" aria-hidden="true">
                      <span className="entryIndexBadge">{index + 1}</span>
                      <div
                        className="allEntriesEntryThumb"
                        style={{
                          backgroundImage: entry.image ? `url(${entry.image})` : "none",
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
        </aside>
      </main>
    </div>
  );
}
