import { NavLink } from "react-router-dom";
import capsLogo from "../static/images/caps-logo.webp";
import stifLogo from "../static/images/stifdb3-logo-bg.png";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="nav-inner">
        <div className="nav-left">
          <NavLink to="/" className="nav-logo-link stif-logo-link" title="STIFDB3 home">
            <img src={stifLogo} alt="STIFDB3 logo" className="nav-logo-stif" />
          </NavLink>
        </div>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink>
          <NavLink to="/browse" className={({ isActive }) => isActive ? "active" : ""}>Browse</NavLink>
          <NavLink to="/search" className={({ isActive }) => isActive ? "active" : ""}>Search</NavLink>
          <NavLink to="/tf-families" className={({ isActive }) => isActive ? "active" : ""}>TF Families</NavLink>
          <NavLink to="/predict" className={({ isActive }) => isActive ? "active" : ""}>STIFAL</NavLink>
          <NavLink to="/help" className={({ isActive }) => isActive ? "active" : ""}>Help</NavLink>
        </nav>

        <a
          href="https://caps.ncbs.res.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-logo-link lab-logo-link"
          title="Visit CAPS Lab"
        >
          <img src={capsLogo} alt="CAPS Lab" className="nav-logo-img" />
        </a>
      </div>
    </header>
  );
}
