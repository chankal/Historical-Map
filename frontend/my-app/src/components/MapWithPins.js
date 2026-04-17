import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MapWithPins.css";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function loadLink(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
}

export default function MapWithPins({
  entries = [],
  selectedIndex = null,
  onPinClick = null,
  onMapClick = null,
  defaultZoom = 12,
  fitBoundsBottomPadding = 50,
  fitBoundsMaxZoom = null,
}) {
  const [mapReady, setMapReady] = useState(false);
  const [geocodedStops, setGeocodedStops] = useState([]);
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const navigate = useNavigate();

  // Build stops from database-stored lat/lng
  useEffect(() => {
    if (entries.length === 0) {
      setGeocodedStops([]);
      return;
    }

    const results = [];
    entries.forEach((entry, i) => {
      const lat = entry.lat;
      const lng = entry.lng;
      if (lat != null && lng != null) {
        results.push({
          name: entry.name,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          entrySlug: entry.slug,
          index: i,
        });
      } else {
        console.warn(`No coordinates stored for entry: ${entry.name}`);
      }
    });

    setGeocodedStops(results);
  }, [entries]);

  // Load Leaflet once
  useEffect(() => {
    loadLink(
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
    );
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
    )
      .then(() => setMapReady(true))
      .catch(console.error);
  }, []);

  // Initialize map after Leaflet loads
  useEffect(() => {
    if (!mapReady || !mapDivRef.current || mapRef.current || !window.L) return;
    const L = window.L;

    const map = L.map(mapDivRef.current, {
      center: geocodedStops.length > 0 ? [geocodedStops[0].lat, geocodedStops[0].lng] : [33.745, -84.39],
      zoom: defaultZoom,
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: false,
      touchZoom: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org/">OSM</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;
  }, [mapReady, geocodedStops, defaultZoom]);

  useEffect(() => {
    if (!mapRef.current || !onMapClick) return undefined;

    mapRef.current.on("click", onMapClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", onMapClick);
      }
    };
  }, [onMapClick]);

  // Create/update markers when stops change
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Create markers for each stop
    geocodedStops.forEach((stop, i) => {
      const icon = L.divIcon({
        html: 
        `<div style="cursor: pointer;">
          <div class="map-pin-body">
            <span class="map-pin-num">${stop.index + 1}</span>
          </div>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 52],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(
        mapRef.current
      );

      // Add click handler to navigate or let the parent show entry details.
      if (stop.entrySlug) {
        marker.on("click", (event) => {
          if (window.L) {
            window.L.DomEvent.stopPropagation(event);
          }

          if (onPinClick) {
            onPinClick(stop.index);
            return;
          }

          navigate(`/entry/${stop.entrySlug}`);
        });
      }

      markersRef.current.push(marker);
    });
  }, [geocodedStops, navigate, onPinClick]);

  // Handle zoom when entry is selected or deselected
  useEffect(() => {
    if (!mapRef.current || geocodedStops.length === 0) return;

    if (selectedIndex === null) {
      // Zoom out to show all markers
      if (geocodedStops.length === 1) {
        // If only one marker, center on it with default zoom
        mapRef.current.flyTo([geocodedStops[0].lat, geocodedStops[0].lng], defaultZoom, {
          duration: 0.8,
          easeLinearity: 0.5,
        });
      } else {
        // If multiple markers, fit bounds to show all
        const L = window.L;
        const bounds = L.latLngBounds(
          geocodedStops.map((stop) => [stop.lat, stop.lng])
        );
        mapRef.current.flyToBounds(bounds, {
          paddingTopLeft: [50, 50],
          paddingBottomRight: [50, fitBoundsBottomPadding],
          ...(fitBoundsMaxZoom !== null ? { maxZoom: fitBoundsMaxZoom } : {}),
          duration: 0.8,
          easeLinearity: 0.5,
        });
      }
    } else {
      // Zoom in to selected marker
      const stop = geocodedStops.find((entry) => entry.index === selectedIndex);
      if (!stop) return;
      mapRef.current.flyTo([stop.lat, stop.lng], 17, {
        duration: 0.8,
        easeLinearity: 0.5,
      });
    }
  }, [selectedIndex, geocodedStops, defaultZoom, fitBoundsBottomPadding, fitBoundsMaxZoom]);

  return (
    <div className="map-with-pins-container">
      {!mapReady && (
        <div className="map-loading">
          <div className="map-loading-text">Loading map…</div>
        </div>
      )}
      <div ref={mapDivRef} className="map-canvas" />
    </div>
  );
}
