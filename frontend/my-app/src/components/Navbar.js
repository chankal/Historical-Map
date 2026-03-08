import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import logo from "../images/svclogo.png";

export default function Navbar({
  showToursHeader = false,
  toursHeaderClassName = "",
  toursHeaderTitle = "3D Tours",
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <img className="logo" src={logo} alt="South-View Cemetery Association" />
        </div>

        <button
          type="button"
          className="menuToggle"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav ${menuOpen ? "open" : ""}`}>
          <NavLink
            to="https://southviewcemetery.com/"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={closeMenu}
          >
            SOUTH-VIEW CEMETERY WEBSITE
          </NavLink>

          <NavLink to="/tours" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeMenu}>
            TOURS
          </NavLink>

          <a className="contactBtn" href="https://southviewcemetery.com/contact-us/" onClick={closeMenu}>
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
