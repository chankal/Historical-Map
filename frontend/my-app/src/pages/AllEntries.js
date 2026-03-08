import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import TourCard from "../components/TourCard";
import MapWithPins from "../components/MapWithPins";
import busStopIcon from "../images/bus-stop.png";
import hmapicon from "../images/Hmap.png";
import "./AllEntries.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

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
            e.details?.short_blurb ||
            e.details?.blurb ||
            e.details?.description ||
            "No blurb yet.",
          address: e.details?.address || null,
          image: e.image || null,
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
      <Navbar showToursHeader toursHeaderClassName="allEntriesToursHeaderBlock" />
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
                <div className="tourStops">
                  <img src={busStopIcon} alt="Bus stop icon" />
                  <span>{entries.length} stops</span>
                </div>
                <div className="tourActionRow">
                  <p className="tourInfoTime">
                    <span className="tourInfoTimeWithIcon">
                      <img src={hmapicon} alt="Historical sites icon" />
                      <span>Historical Sites</span>
                    </span>
                  </p>
                  <Link
                    className="tourStartButton"
                    to={entries.length > 0 ? `/entry/${entries[0].id}` : "/entry"}
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
                      to={`/entry/${entry.id}`}
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
                        <span className="entryIndexBadge">{index + 1}</span>
                        <div 
                          className="allEntriesEntryThumb" 
                          style={{
                            backgroundImage: entry.image ? `url(${entry.image})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                          aria-hidden="true" 
                        />
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
