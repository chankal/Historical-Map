import "./EntryMapPanel.css";

/**
 * Full-height Street View with header, info orb, and prev/next docked on the map.
 */
export default function EntryMapPanel({
  latLng,
  spotBlurb = "",
  locationHeader = "",
  locationSubline = "",
  activeIndex = 0,
  totalStops = 1,
  onNextSpot,
  onPrevSpot,
  googleMapsApiKey,
}) {
  const hasMap = latLng && googleMapsApiKey;
  const showIntraNav = totalStops > 1;

  if (latLng && !googleMapsApiKey) {
    return (
      <div className="entryMapPanel entryMapPanel--fill">
        <div className="entryMapPanelFrame entryMapPanelFrame--empty">
          <div className="entryRightEmpty entryMapPanelEmptyMsg">
            <p style={{ fontSize: "0.9rem", color: "#555" }}>
              Street View requires <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> to be set.
            </p>
          </div>
          {showIntraNav && (
            <div className="entryMapPanelDock">
              <button
                type="button"
                className="entryMapPanelNavBtn"
                onClick={onPrevSpot}
                disabled={activeIndex <= 0}
              >
                ← Previous
              </button>
              <span className="entryMapPanelDockMeta">
                {activeIndex + 1} / {totalStops}
              </span>
              <button
                type="button"
                className="entryMapPanelNavBtn"
                onClick={onNextSpot}
                disabled={activeIndex >= totalStops - 1}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="entryMapPanel entryMapPanel--fill">
      <div
        className={`entryMapPanelFrame ${!hasMap ? "entryMapPanelFrame--empty" : ""}`}
      >
        {hasMap ? (
          <>
            <iframe
              title="Street View"
              className="entryMapPanelIframe"
              loading="lazy"
              allowFullScreen
              allow="accelerometer; gyroscope"
              src={`https://www.google.com/maps/embed/v1/streetview?key=${googleMapsApiKey}&location=${latLng.lat},${latLng.lng}&heading=210&pitch=10`}
            />
            <header className="entryMapPanelHeader">
              <div className="entryMapPanelHeaderText">
                <span className="entryMapPanelHeaderTitle">
                  {locationHeader || "Location"}
                </span>
                {locationSubline ? (
                  <span className="entryMapPanelHeaderSub">{locationSubline}</span>
                ) : null}
              </div>
              {totalStops > 0 && (
                <span className="entryMapPanelHeaderBadge">
                  {activeIndex + 1} / {totalStops}
                </span>
              )}
            </header>

            <div className="entryMapPanelOrbWrap">
              <button
                type="button"
                className="entryMapPanelOrb"
                aria-label="About this location"
              >
                i
              </button>
              <div className="entryMapPanelTooltip" role="tooltip">
                {spotBlurb || "No description for this spot."}
              </div>
            </div>

            {showIntraNav && (
              <div className="entryMapPanelDock">
                <button
                  type="button"
                  className="entryMapPanelNavBtn"
                  onClick={onPrevSpot}
                  disabled={activeIndex <= 0}
                >
                  ← Previous
                </button>
                <span className="entryMapPanelDockHint">Move between spots</span>
                <button
                  type="button"
                  className="entryMapPanelNavBtn"
                  onClick={onNextSpot}
                  disabled={activeIndex >= totalStops - 1}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="entryRightEmpty entryMapPanelEmptyMsg">
            <p style={{ color: "#c0392b", fontWeight: "bold" }}>
              No location coordinates found for this spot.
            </p>
            <p style={{ fontSize: "0.85rem", color: "#555" }}>
              Please contact an admin to add coordinates for this entry.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
