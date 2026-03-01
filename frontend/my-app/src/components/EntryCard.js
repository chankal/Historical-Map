import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import TourCard from "./TourCard";
import "./EntryCard.css";

export default function EntryCard({
  name = "Name",
  blurb = "Short blurb",
  longDescription = "Long description",
  returnTo = "/tours",
  address = null,
  right,
}) {
  const handleGetDirections = () => {
    if (!address) {
      alert("No address available for this location");
      return;
    }
    
    // Open directions
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      address
    )}`;
    // new tab
    window.open(mapsUrl, "_blank");
  };

  return (
    <div className="entryPage">
      <Navbar showToursHeader toursHeaderClassName="entryToursHeaderBlock" />

      <main className="entryContent">
        <TourCard
          className="entryTourCard"
          left={
            <div className="entryLeftLayout">
              <Link className="entryBox entryBack" to={returnTo}>
                &lt; Return to Stops
              </Link>

              <section className="entryBox entryIdentity">
                <div className="entryAvatar" aria-hidden="true" />
                <div>
                  <h2 className="entryName">{name}</h2>
                  <p className="entryBlurb">{blurb}</p>
                </div>
              </section>

              <div className="entryActionRow">
                <button
                  className="entryBox entryAction"
                  onClick={handleGetDirections}
                >
                  Get Directions
                </button>
                <button className="entryBox entryAction">View &amp; Submit Memories</button>
              </div>

              <section className="entryBox entryLongDescription">
                {longDescription}
              </section>

              <div className="entryNavRow">
                <button className="entryBox entryPager">&lt; Previous</button>
                <button className="entryBox entryPager">Next &gt;</button>
              </div>
            </div>
          }
          right={right || <div className="entryRightEmpty" />}
        />
      </main>
    </div>
  );
}
