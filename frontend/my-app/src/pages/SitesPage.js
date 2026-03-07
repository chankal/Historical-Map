import Navbar from "../components/Navbar";
import TourCard from "../components/TourCard";
import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useGoogleMapsAPI } from "../contexts/GoogleMapsAPIContext";
import "./SitesPage.css";

const PARAMETER_VALUE = '600 Peachtree St NE, Atlanta, GA 30308';
// const YOUTUBE_EMBED_URL = "https://www.youtube.com/watch?v=RirtWtLhowI";

function videoIdOrAddress(value) {
  const videoIdRegex = /[0-9a-zA-Z-_]{22}/;
  return value.match(videoIdRegex) ? "videoId" : "address";
}

export default function SitesPage() {
  const navigate = useNavigate();
  const { requestAPIKey } = useGoogleMapsAPI();
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState("");
  const [status, setStatus] = useState("Click to load Aerial View");
  const [loadTriggered, setLoadTriggered] = useState(false);

  const initAerialView = async () => {
    if (loadTriggered) return;
    setLoadTriggered(true);
    
    setStatus("Requesting API key...");
    const apiKey = await requestAPIKey();
    
    if (!apiKey) {
      setStatus("Redirecting to all entries...");
      setTimeout(() => navigate('/all-entries'), 1000);
      return;
    }

    setStatus("Loading...");
    const parameterKey = videoIdOrAddress(PARAMETER_VALUE);
    const urlParameter = new URLSearchParams();
    urlParameter.set(parameterKey, PARAMETER_VALUE);
    urlParameter.set("key", apiKey);

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
  };

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
              <Link
                className="getStartedButton"
                to="/all-entries"
              >
                Get Started
              </Link>
              <Link
                to="/all-entries"
                style={{
                  display: 'inline-block',
                  marginTop: '15px',
                  padding: '10px 20px',
                  backgroundColor: '#61dafb',
                  color: '#0a0a0a',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: '600'
                }}
              >
                Browse All Entries
              </Link>
            </>
          }
          right={
            <iframe
        width="800"
        height="450"
        src="https://youtube.com/embed/9a5mzYUssDw" 
        //https://youtu.be/9a5mzYUssDw

        title="YouTube video"
        allowFullScreen> </iframe>
          //   videoSrc ? (
          //     <video
          //       className="tourImage"
          //       ref={videoRef}
          //       src={videoSrc}
          //       onClick={handleVideoClick}
          //       controls
          //       style={{ cursor: "pointer" }}
          //     />
          //   ) : (
          //     <div 
          //       className="tourPlaceholder" 
          //       onClick={!loadTriggered ? initAerialView : undefined}
          //       style={{ cursor: !loadTriggered ? 'pointer' : 'default' }}
          //     >
          //       {status}
          //       {!loadTriggered && <div style={{ marginTop: '10px', fontSize: '12px' }}>Click to load Aerial View (requires API key)</div>}
          //     </div>
          //   )
          }
          
        />

      </div>
    </div>
  );
}
