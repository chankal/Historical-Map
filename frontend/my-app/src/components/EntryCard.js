import { Link } from "react-router-dom";
import TourCard from "./TourCard";
import "./EntryCard.css";

export default function EntryCard({
  name = "Name",
  blurb = "Short blurb",
  longDescription = "Long description",
  stopNumber = null,
  prevEntrySlug = null,
  nextEntrySlug = null,
  returnTo = "/tours",
  address = null,
  obituaryUrl = null,
  image = null,
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

  const handleMemoriesClick = () => {
    if (!obituaryUrl) {
      alert("No obituary link available for this entry");
      return;
    }

    const normalizedUrl = /^https?:\/\//i.test(obituaryUrl)
      ? obituaryUrl
      : `https://${obituaryUrl}`;

    window.open(normalizedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="entryPage">
      <main className="entryContent">
        <TourCard
          className="entryTourCard"
          left={
            <div className="entryLeftLayout">
              <Link className="entryBox entryBack" to={returnTo}>
                <span className="entryBackIcon" aria-hidden="true">
                  &#8249;
                </span>
                <span>Return to Stops</span>
              </Link>

              <div className="entryNavRow">
                {prevEntrySlug ? (
                  <Link className="entryBox entryNavBtn" to={`/entry/${prevEntrySlug}`}>
                    &lt; Prev
                  </Link>
                ) : (
                  <button className="entryBox entryNavBtn" type="button" disabled>
                    &lt; Prev
                  </button>
                )}
                {nextEntrySlug ? (
                  <Link className="entryBox entryNavBtn" to={`/entry/${nextEntrySlug}`}>
                    Next &gt;
                  </Link>
                ) : (
                  <button className="entryBox entryNavBtn" type="button" disabled>
                    Next &gt;
                  </button>
                )}
              </div>

              <section className="entryBox entryIdentity">
                <div className="entryAvatarWrap" aria-hidden="true">
                  <div className="entryStopBadge">{stopNumber ?? ""}</div>
                  <div
                    className="entryAvatar"
                    style={{
                      backgroundImage: image ? `url(${image})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </div>
                <div>
                  <h2 className="entryName">{name}</h2>
                  <p className="entryBlurb">{blurb}</p>
                </div>
              </section>

              <div className="entryActionRow">
                <button
                  className="entryBox entryPager"
                  onClick={handleGetDirections}
                >
                  Get Directions
                </button>
                <button
                  className="entryBox entryPager"
                  onClick={handleMemoriesClick}
                  type="button"
                  disabled={!obituaryUrl}
                >
                  View &amp; Submit Memories
                </button>
              </div>

              <section className="entryBox entryLongDescription">
                {longDescription}
              </section>

            </div>
          }
          right={right || <div className="entryRightEmpty" />}
        />
      </main>
    </div>
  );
}
