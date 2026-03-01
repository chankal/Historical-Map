import Navbar from "../components/Navbar";
import TourCard from "../components/TourCard";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./SitesPage.css";

const PARAMETER_VALUE = '600 Peachtree St NE, Atlanta, GA 30308';
const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API;

function videoIdOrAddress(value) {
  const videoIdRegex = /[0-9a-zA-Z-_]{22}/;
  return value.match(videoIdRegex) ? "videoId" : "address";
}

export default function SitesPage() {
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState("");
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    async function initAerialView() {
      const parameterKey = videoIdOrAddress(PARAMETER_VALUE);
      const urlParameter = new URLSearchParams();
      urlParameter.set(parameterKey, PARAMETER_VALUE);
      urlParameter.set("key", API_KEY);

      try {
        const response = await fetch(
          `https://aerialview.googleapis.com/v1/videos:lookupVideo?${urlParameter.toString()}`
        );
        const videoResult = await response.json();

        if (videoResult.state === "PROCESSING") {
          setStatus("Video still processing...");
        } else if (videoResult.error) {
          const errorMsg = videoResult.error.message || "Unknown error";
          setStatus(
            `Error: ${errorMsg}\n\nℹ️ Aerial View videos are only available for specific locations.`
          );
        } else if (videoResult.uris?.MP4_MEDIUM?.landscapeUri) {
          setVideoSrc(videoResult.uris.MP4_MEDIUM.landscapeUri);
          setStatus("");
        } else {
          setStatus("Video not available in the expected format.");
        }
      } catch (error) {
        setStatus("Error loading video: " + error.message);
      }
    }

    initAerialView();
  }, []);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  return (
    <div className="sitesPage">
      <Navbar showToursHeader />

      <div className="sitesContent">
        <TourCard
          left={
            <>
              <h2 className="tourName">
                <Link className="tourTitleLink" to="/all-entries">
                  ATLANTA HISTORY TOUR
                </Link>
              </h2>
              <p className="tourDesc">
                South-View residents who are honored for their contributions to the city of Atlanta.
              </p>
            </>
          }
          right={
            status ? (
              <div className="tourPlaceholder">{status}</div>
            ) : videoSrc ? (
              <video
                className="tourImage"
                ref={videoRef}
                src={videoSrc}
                onClick={handleVideoClick}
                controls
                style={{ cursor: "pointer" }}
              />
            ) : (
              <div className="tourPlaceholder">Image or Map Here</div>
            )
          }
        />
      </div>
    </div>
  );
}
