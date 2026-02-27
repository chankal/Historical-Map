import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import TourCard from "../components/TourCard";
import busStopIcon from "../images/bus-stop.png";
import "./AllEntries.css";

const entries = [
  { id: 1, name: "Name", blurb: "Short blurb" },
  { id: 2, name: "Name", blurb: "Short blurb" },
  { id: 3, name: "Name", blurb: "Short blurb" },
  { id: 4, name: "Name", blurb: "Short blurb" },
  { id: 5, name: "Name", blurb: "Short blurb" },
];

export default function AllEntries() {
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
                  <span>10 stops</span>
                </div>
                <p className="tourInfoTime">20-25 minutes</p>
                <Link className="tourStartButton" to="/entry">
                  Get Started
                </Link>
              </section>

              <section className="entryList">
                {entries.map((entry) => (
                  <article className="allEntriesEntryBox" key={entry.id}>
                    <div className="allEntriesEntryThumb" aria-hidden="true" />
                    <div className="allEntriesEntryText">
                      <h3 className="allEntriesEntryName">{entry.name}</h3>
                      <p className="allEntriesEntryBlurb">{entry.blurb}</p>
                    </div>
                  </article>
                ))}
              </section>
            </div>
          }
          right={<div className="allEntriesRightEmpty" aria-hidden="true" />}
        />
      </main>
    </div>
  );
}
