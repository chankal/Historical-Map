import Navbar from "../components/Navbar";
import TourCard from "../components/TourCard";
import { Link } from "react-router-dom";
import "./SitesPage.css";


export default function SitesPage() {
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
                Browse All Entries
              </Link>
              
            </>
          }
          right={
            <video
              className="tourVideo"
              src={process.env.REACT_APP_TOUR_VIDEO_URL}
              autoPlay
              loop
              muted
              playsInline
              onPause={(e) => e.target.play()}
            />
          }
          
        />

      </div>
    </div>
  );
}
