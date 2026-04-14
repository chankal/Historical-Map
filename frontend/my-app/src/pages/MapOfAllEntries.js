import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MapWithPins from "../components/MapWithPins";
import fallbackData from "../data/fallbackData.js";
import "./MapOfAllEntries.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

function toSlug(entry) {
  return entry.slug || entry.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function mapApiEntry(entry) {
  return {
    id: entry.id,
    name: entry.name,
    slug: toSlug(entry),
    blurb:
      entry.details?.short_blurb ||
      entry.details?.blurb ||
      entry.details?.description ||
      "No blurb yet.",
    lat: entry.details?.lat ?? null,
    lng: entry.details?.lng ?? null,
    image: entry.image || null,
  };
}

function mapFallbackEntry(entry) {
  return {
    ...mapApiEntry(entry),
    lat: entry.latLng?.lat ?? entry.details?.lat ?? null,
    lng: entry.latLng?.lng ?? entry.details?.lng ?? null,
  };
}

export default function MapOfAllEntries() {
  const [entries, setEntries] = useState([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(null);
  const [cardStartIndex, setCardStartIndex] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  const carouselCards = entries.length
    ? Array.from({ length: entries.length }, (_, offset) => {
        const entryIndex = (cardStartIndex + offset) % entries.length;
        return {
          entry: entries[entryIndex],
          entryIndex,
        };
      })
    : [];
  const loopedCarouselCards = [...carouselCards, ...carouselCards];
  const selectedEntry =
    selectedEntryIndex !== null ? entries[selectedEntryIndex] : null;

  const moveCards = (direction) => {
    if (!entries.length) return;
    setCardStartIndex((currentIndex) => {
      const nextIndex = (currentIndex + direction + entries.length) % entries.length;
      return nextIndex;
    });
  };

  const handlePinClick = (entryIndex) => {
    setSelectedEntryIndex(entryIndex);
    setCardStartIndex(entryIndex);
  };

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setUsingFallback(false);

        const res = await fetch(`${API_BASE}/all/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setEntries(data.map(mapApiEntry));
      } catch (err) {
        console.warn("API unavailable, using fallback data:", err.message);
        setUsingFallback(true);
        setEntries(fallbackData.map(mapFallbackEntry));
      }
    };

    fetchEntries();
  }, []);

  return (
    <div className="mapAllPage">
      <nav className="mapAllTopActions" aria-label="Map page navigation">
        <button
          type="button"
          className="mapAllMenuToggle"
          aria-label={navOpen ? "Close map navigation menu" : "Open map navigation menu"}
          aria-expanded={navOpen}
          onClick={() => setNavOpen((isOpen) => !isOpen)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`mapAllTopMenu ${navOpen ? "mapAllTopMenuOpen" : ""}`}>
          <Link className="mapAllTopButton" to="/" onClick={() => setNavOpen(false)}>
            Home
          </Link>
          <Link className="mapAllTopButton" to="/all-entries" onClick={() => setNavOpen(false)}>
            List View
          </Link>
        </div>
      </nav>

      {usingFallback && (
        <div className="mapAllFallbackBanner">
          Live data is currently unavailable. Please contact an admin if this persists.
        </div>
      )}

      <div className="mapAllMapSection">
        <MapWithPins
          entries={entries}
          selectedIndex={selectedEntryIndex}
          onPinClick={handlePinClick}
          onPinHover={handlePinClick}
          onMapClick={() => setSelectedEntryIndex(null)}
          defaultZoom={11}
          fitBoundsBottomPadding={430}
        />

        {selectedEntry ? (
          <article className="mapAllPopupCard mapAllFocusedCard">
            <button
              type="button"
              className="mapAllFocusedClose"
              aria-label="Return to carousel"
              onClick={() => setSelectedEntryIndex(null)}
            >
              x
            </button>

            <div
              className="mapAllPopupImage"
              style={{
                backgroundImage: selectedEntry.image ? `url(${selectedEntry.image})` : "none",
              }}
              aria-hidden="true"
            >
              <span className="mapAllPopupIndex">{selectedEntryIndex + 1}</span>
            </div>

            <div className="mapAllPopupBody">
              <h2 className="mapAllPopupTitle">{selectedEntry.name}</h2>
              <p className="mapAllPopupDescription">{selectedEntry.blurb}</p>

              <Link className="mapAllPopupButton" to={`/entry/${selectedEntry.slug}`}>
                Read more
              </Link>
            </div>
          </article>
        ) : carouselCards.length > 0 ? (
          <div className="mapAllCardDock" aria-label="Featured map entries">
            <button
              type="button"
              className="mapAllCardNav mapAllCardNavLeft"
              aria-label="Show previous entries"
              onClick={() => moveCards(-1)}
            >
              &lt;
            </button>

            <div className="mapAllCardTrack">
              <div className="mapAllCardRail">
                {loopedCarouselCards.map(({ entry, entryIndex }, visibleIndex) => (
                  <article
                    key={`${entry.id}-${visibleIndex}`}
                    className={`mapAllPopupCard ${
                      selectedEntryIndex === entryIndex ? "mapAllPopupCardSelected" : ""
                    }`}
                  >
                    <div
                      className="mapAllPopupImage"
                      style={{
                        backgroundImage: entry.image ? `url(${entry.image})` : "none",
                      }}
                      aria-hidden="true"
                    >
                      <span className="mapAllPopupIndex">{entryIndex + 1}</span>
                    </div>

                    <div className="mapAllPopupBody">
                      <h2 className="mapAllPopupTitle">{entry.name}</h2>
                      <p className="mapAllPopupDescription">{entry.blurb}</p>

                      <Link className="mapAllPopupButton" to={`/entry/${entry.slug}`}>
                        Read more
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="mapAllCardNav mapAllCardNavRight"
              aria-label="Show next entries"
              onClick={() => moveCards(1)}
            >
              &gt;
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
