import { useRef, useState, useEffect, useCallback } from "react";
import "./EntryMapPanel.css";

function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

function requestFullscreenEl(el) {
  if (!el) return Promise.reject();
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
  return Promise.reject(new Error("Fullscreen not supported"));
}

function exitFullscreenDoc() {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
  if (document.msExitFullscreen) return document.msExitFullscreen();
  return Promise.reject();
}

/**
 * Full-height Street View with header, info orb, prev/next dock, and fullscreen overlay.
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
  streetViewOptions,
  headerActionLabel,
  onHeaderActionClick,
}) {
  const rootRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const syncFullscreenState = useCallback(() => {
    const el = rootRef.current;
    setIsFullscreen(!!el && getFullscreenElement() === el);
  }, []);

  useEffect(() => {
    const handler = () => syncFullscreenState();
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    document.addEventListener("mozfullscreenchange", handler);
    document.addEventListener("MSFullscreenChange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
      document.removeEventListener("mozfullscreenchange", handler);
      document.removeEventListener("MSFullscreenChange", handler);
    };
  }, [syncFullscreenState]);

  const enterFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    requestFullscreenEl(el).catch(() => {});
  }, []);

  const exitFullscreen = useCallback(() => {
    if (getFullscreenElement()) {
      exitFullscreenDoc().catch(() => {});
    }
  }, []);

  const hasMap = !!googleMapsApiKey && (!!latLng || !!streetViewOptions?.pano);
  const showIntraNav = totalStops > 1;
  const headerButtonLabel =
    headerActionLabel || (isFullscreen ? "Exit" : "Fullscreen");
  const headerButtonAria =
    headerActionLabel || (isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
  const headerButtonTitle =
    headerActionLabel || (isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen map");
  const handleHeaderButtonClick =
    onHeaderActionClick || (isFullscreen ? exitFullscreen : enterFullscreen);

  const embedParams = new URLSearchParams();
  if (googleMapsApiKey) embedParams.set("key", googleMapsApiKey);
  if (streetViewOptions?.pano) embedParams.set("pano", streetViewOptions.pano);
  if (latLng) embedParams.set("location", `${latLng.lat},${latLng.lng}`);
  if (streetViewOptions?.heading != null) {
    embedParams.set("heading", String(streetViewOptions.heading));
  }
  if (streetViewOptions?.pitch != null) {
    embedParams.set("pitch", String(streetViewOptions.pitch));
  }
  if (streetViewOptions?.fov != null) {
    embedParams.set("fov", String(streetViewOptions.fov));
  }

  const headerBlock = (
    <header className="entryMapPanelHeader">
      <div className="entryMapPanelHeaderText">
        <span className="entryMapPanelHeaderTitle">
          {locationHeader || "Location"}
        </span>
        {locationSubline ? (
          <span className="entryMapPanelHeaderSub">{locationSubline}</span>
        ) : null}
      </div>
      <div className="entryMapPanelHeaderActions">
        {totalStops > 0 && (
          <span className="entryMapPanelHeaderBadge">
            {activeIndex + 1} / {totalStops}
          </span>
        )}
        <button
          type="button"
          className="entryMapPanelFsBtn"
          onClick={handleHeaderButtonClick}
          aria-label={headerButtonAria}
          title={headerButtonTitle}
        >
          <span className="entryMapPanelFsLabel">
            {headerButtonLabel}
          </span>
        </button>
      </div>
    </header>
  );

  const orbBlock = (
    <div className="entryMapPanelOrbWrap">
      <button type="button" className="entryMapPanelOrb" aria-label="About this location">
        i
      </button>
      <div className="entryMapPanelTooltip" role="tooltip">
        {spotBlurb || "No description for this spot."}
      </div>
    </div>
  );

  const dockBlock =
    showIntraNav && (
      <div className="entryMapPanelDock">
        <button
          type="button"
          className="entryMapPanelNavBtn"
          onClick={onPrevSpot}
          disabled={activeIndex <= 0}
          aria-label="Previous spot"
        >
          &#8249;
        </button>
        <span className="entryMapPanelDockHint">Move between spots</span>
        <button
          type="button"
          className="entryMapPanelNavBtn"
          onClick={onNextSpot}
          disabled={activeIndex >= totalStops - 1}
          aria-label="Next spot"
        >
          &#8250;
        </button>
      </div>
    );

  if (latLng && !googleMapsApiKey) {
    return (
      <div className="entryMapPanel entryMapPanel--fill">
        <div ref={rootRef} className="entryMapPanelFullscreenRoot">
          <div className="entryMapPanelFrame entryMapPanelFrame--empty">
            {headerBlock}
            <div className="entryRightEmpty entryMapPanelEmptyMsg">
              <p style={{ fontSize: "0.9rem", color: "#555" }}>
                Street View requires <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> to be set.
              </p>
            </div>
            {showIntraNav && (
              <div className="entryMapPanelDock entryMapPanelDock--plain">
                <button
                  type="button"
                  className="entryMapPanelNavBtn"
                  onClick={onPrevSpot}
                  disabled={activeIndex <= 0}
                  aria-label="Previous spot"
                >
                  &#8249;
                </button>
                <span className="entryMapPanelDockMeta">
                  {activeIndex + 1} / {totalStops}
                </span>
                <button
                  type="button"
                  className="entryMapPanelNavBtn"
                  onClick={onNextSpot}
                  disabled={activeIndex >= totalStops - 1}
                  aria-label="Next spot"
                >
                  &#8250;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="entryMapPanel entryMapPanel--fill">
      <div ref={rootRef} className="entryMapPanelFullscreenRoot">
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
                allow="accelerometer; gyroscope; fullscreen"
                src={`https://www.google.com/maps/embed/v1/streetview?${embedParams.toString()}`}
              />
              {headerBlock}
              {orbBlock}
              {dockBlock}
            </>
          ) : (
            <>
              {headerBlock}
              <div className="entryRightEmpty entryMapPanelEmptyMsg">
                <p style={{ color: "#c0392b", fontWeight: "bold" }}>
                  No location coordinates found for this spot.
                </p>
                <p style={{ fontSize: "0.85rem", color: "#555" }}>
                  Please contact an admin to add coordinates for this entry.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
