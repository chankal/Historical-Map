import { useEffect, useRef, useState } from "react";
import "./MapWithPins.css";

// Sample stops data - replace with actual data from props if needed
const DEFAULT_STOPS = [
  { name: "Stop 1", lat: 33.756, lng: -84.376 },
  { name: "Stop 2", lat: 33.749, lng: -84.388 },
  { name: "Stop 3", lat: 33.757, lng: -84.383 },
  { name: "Stop 4", lat: 33.758, lng: -84.39 },
  { name: "Stop 5", lat: 33.688, lng: -84.392 },
  { name: "Stop 6", lat: 33.762, lng: -84.37 },
  { name: "Stop 7", lat: 33.748, lng: -84.411 },
  { name: "Stop 8", lat: 33.751, lng: -84.374 },
  { name: "Stop 9", lat: 33.754, lng: -84.394 },
  { name: "Stop 10", lat: 33.754, lng: -84.422 },
];

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

export default function MapWithPins({ stops = DEFAULT_STOPS }) {
  const [mapReady, setMapReady] = useState(false);
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);

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
      center: [33.745, -84.39],
      zoom: 12,
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

    // Create markers for each stop
    // will be able to click on them and be interactive
    stops.forEach((stop, i) => {
      const icon = L.divIcon({
        className: "",
        html: `<div class="map-pin-wrap">
          <div class="map-pin-body">
            <span class="map-pin-num">${i + 1}</span>
          </div>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 52],
      });

      L.marker([stop.lat, stop.lng], { icon }).addTo(map);
    });

    mapRef.current = map;
  }, [mapReady, stops]);

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
