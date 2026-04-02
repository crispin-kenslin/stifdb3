import { Link } from "react-router-dom";
import capsLogo from "../static/images/caps-logo.webp";
import stifLogo from "../static/images/stif-logo.png";

/*
 * LOGO SETUP:
 * 
 * Database Logo: stif-logo.png from src/static/images/
 * Lab Logo: caps-logo.webp from src/static/images/
 */

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container nav-inner">
        <div className="nav-left">
          <Link to="/" className="nav-logo-link" title="Home">
            <img 
              src={stifLogo} 
              alt="STIFDB3" 
              className="nav-logo-img"
            />
          </Link>
          <Link to="/" className="brand">STIFDB3</Link>
        </div>
        
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/browse">Browse</Link>
          <Link to="/search">Search</Link>
          <Link to="/help">Help</Link>
        </nav>

        <a 
          href="https://caps.ncbs.res.in/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="nav-logo-link lab-logo-link"
          title="Visit CAPS Lab website"
        >
          <img 
            src={capsLogo} 
            alt="CAPS Lab Logo" 
            className="nav-logo-img"
          />
        </a>
      </div>
    </header>
  );
}
