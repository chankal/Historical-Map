import Navbar from "../components/Navbar";
import TourCard from "../components/TourCard";
import { Link } from "react-router-dom";
import "./SitesPage.css";


export default function SitesPage() {
  return (
    <div className="sitesPage">
      <Navbar showToursHeader toursHeaderClassName="sitesToursHeaderBlock"/>

      <div className="sitesContent">
        <TourCard
          className="sitesTourCard"
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
              <div className="youtubeEmbedSection">
                <iframe
                  className="youtubeEmbedFrame"
                  src="https://youtube.com/embed/9a5mzYUssDw"
                  title="YouTube video"
                  allowFullScreen
                />
              </div>
          }
          
        />

      </div>
    </div>
  );
}
