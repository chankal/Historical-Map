import { NavLink } from "react-router-dom";
import "./Navbar.css";
import logo from "../images/svclogo.png";

export default function Navbar({
  showToursHeader = false,
  toursHeaderClassName = "",
  toursHeaderTitle = "3D Tours",
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
        <section className="toursHeaderShell">
          <div className={`toursHeaderBlock ${toursHeaderClassName}`.trim()}>
            <div className="toursTop">
              <h1 className="toursTitle">{toursHeaderTitle}</h1>
            </div>
            <div className="toursRule" />
          </div>
        </section>
      ) : null}
    </>
  );
}
