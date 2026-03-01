import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import TourCard from "../components/TourCard";
import MapWithPins from "../components/MapWithPins";
import busStopIcon from "../images/bus-stop.png";
import "./AllEntries.css";

const API_BASE = "http://127.0.0.1:8000/api";

export default function AllEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/all/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const mapped = data.map((e) => ({
          id: e.id,
          name: e.name,
          blurb:
            e.details?.description ||
            e.details?.short_blurb ||
            e.details?.blurb ||
            "No blurb yet.",
          address: e.details?.address || null,
        }));

        setEntries(mapped);
      } catch (err) {
        setError(`Failed to load entries: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  return (
    <div className="allEntriesPage">
      <Navbar showToursHeader />
      <main className="allEntriesContent">
        <TourCard
          className="allEntriesCard"
          left={
            <div className="allEntriesLeft">
              <Link className="returnToTours" to="/tours">
                &lt; Return to Tours
              </Link>

              <section className="tourInfoBox">
                <h2 className="tourInfoTitle">Atlanta History Tour</h2>
                <div className="tourStops">
                  <img src={busStopIcon} alt="Bus stop icon" />
                  <span>{entries.length} stops</span>
                </div>
                <p className="tourInfoTime">20-25 minutes</p>
                <Link
                  className="tourStartButton"
                  to={entries.length > 0 ? `/entry/${entries[0].id}` : "/entry"}
                >
                  Get Started
                </Link>
              </section>

              <section className="entryList">
                {loading && <p>Loading entries...</p>}
                {error && <p>{error}</p>}
                {!loading &&
                  !error &&
                  entries.map((entry, index) => (
                    <Link
                      to={`/entry/${entry.id}`}
                      key={entry.id}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <article
                        className="allEntriesEntryBox"
                        onMouseEnter={() => setSelectedEntryIndex(index)}
                        onMouseLeave={() => setSelectedEntryIndex(null)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="allEntriesEntryThumb" aria-hidden="true" />
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
