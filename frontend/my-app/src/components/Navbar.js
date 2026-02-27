import { NavLink } from "react-router-dom";
import "./Navbar.css";
import logo from "../images/svclogo.png";

export default function Navbar({
  showToursHeader = false,
  toursHeaderClassName = "",
}) {
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <img className="logo" src={logo} alt="South-View Cemetery Association" />
        </div>

        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            SOUTH-VIEW CEMETERY WEBSITE
          </NavLink>
          
          <NavLink to="/tours" className={({ isActive }) => (isActive ? "active" : "")}>
            TOURS
          </NavLink>

          <a className="contactBtn" href="#contact">
            CONTACT US
          </a>
        </nav>
      </header>

      {showToursHeader ? (
        <div className={`toursHeaderBlock ${toursHeaderClassName}`.trim()}>
          <div className="toursTop">
            <h1 className="toursTitle">3D Tours</h1>

            <button className="downloadBtn">
              <span className="downloadDot" aria-hidden="true" />
              DOWNLOAD OUR MOBILE APP
            </button>
          </div>

          <div className="toursRule" />
        </div>
      ) : null}
    </>
  );
}
