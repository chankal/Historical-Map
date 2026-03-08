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
            <iframe
        width="800"
        height="450"
        src="https://youtube.com/embed/9a5mzYUssDw" 

        title="YouTube video"
        allowFullScreen> </iframe>
          }
          
        />

      </div>
    </div>
  );
}
