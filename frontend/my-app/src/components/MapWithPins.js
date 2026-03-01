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

export default function MapWithPins({ entries = [], selectedIndex = null }) {
  const [mapReady, setMapReady] = useState(false);
  const [geocodedStops, setGeocodedStops] = useState([]);
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Geocode addresses to get coordinates
  useEffect(() => {
    if (entries.length === 0) return;

    const geocodeAddresses = async () => {
      const results = [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const address = entry.address;

        // Skip if no address
        if (!address) {
          console.warn(`No address for entry: ${entry.name}`);
          continue;
        }

        // Check if address already has coordinates
        let lat, lng;

        if (typeof address === "object") {
          lat =
            address.lat ||
            address.latitude ||
            address.coordinates?.lat ||
            address.coordinates?.latitude;
          lng =
            address.lng ||
            address.lon ||
            address.longitude ||
            address.coordinates?.lng ||
            address.coordinates?.lon ||
            address.coordinates?.longitude;
        }

        // If we have coordinates, use them
        if (lat && lng) {
          results.push({
            name: entry.name,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            index: i,
          });
        } else {
          // Otherwise, geocode the address string
          const addressString = address;

          try {
            // Use Nominatim (OpenStreetMap) geocoding API
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                addressString
              )}&limit=1`,
              {
                headers: {
                  "User-Agent": "HistoricalMapApp/1.0",
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data.length > 0) {
                results.push({
                  name: entry.name,
                  lat: parseFloat(data[0].lat),
                  lng: parseFloat(data[0].lon),
                  index: i,
                });
              } else {
                console.warn(`No geocoding results for: ${addressString}`);
              }
            }

            // Rate limit: wait 1 second between requests (Nominatim requirement)
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Error geocoding ${addressString}:`, error);
          }
        }
      }

      setGeocodedStops(results);
    };

    geocodeAddresses();
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

    mapRef.current = map;
  }, [mapReady, geocodedStops.length]);

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
        className: "",
        html: `<div class="map-pin-wrap">
          <div class="map-pin-body">
            <span class="map-pin-num">${i + 1}</span>
          </div>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 52],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(
        mapRef.current
      );
      markersRef.current.push(marker);
    });
  }, [geocodedStops]);

  // Handle zoom when entry is selected
  useEffect(() => {
    if (
      !mapRef.current ||
      selectedIndex === null ||
      !geocodedStops[selectedIndex]
    )
      return;

    const stop = geocodedStops[selectedIndex];
    mapRef.current.flyTo([stop.lat, stop.lng], 17, {
      duration: 0.8,
      easeLinearity: 0.5,
    });
  }, [selectedIndex, geocodedStops]);

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
