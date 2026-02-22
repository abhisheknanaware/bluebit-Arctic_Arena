import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiSearch,
  FiChevronDown,
  FiAlertTriangle,
  FiAlertOctagon,
  FiCloudRain,
  FiActivity,
  FiCheckCircle,
  FiBell,
  FiMenu,
  FiZap,
} from "react-icons/fi";

const Navbar = ({ role = "citizen", activeIncidents = 3 }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchRef = useRef(null);
  const closeTimeout = useRef(null);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* Close search on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Hover helpers for dropdown (PREVENT FLICKER) */
  const handleIncidentEnter = () => {
    clearTimeout(closeTimeout.current);
    setIncidentOpen(true);
  };

  const handleIncidentLeave = () => {
    closeTimeout.current = setTimeout(() => {
      setIncidentOpen(false);
    }, 150);
  };

  /* Active link styling */
  const linkClass = (path) =>
    `relative px-1 transition-colors
     after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-2
     after:h-[2px] after:w-6 after:bg-blue-600 after:rounded-full
     after:scale-x-0 after:transition-transform
     ${
       pathname === path
         ? "text-blue-600 after:scale-x-100"
         : "text-black hover:text-blue-600 hover:after:scale-x-100"
     }`;

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/admin/incidents?search=${searchQuery}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <nav className="fixed top-0 left-0 z-50 w-full bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <FiAlertTriangle size={20} />
            </div>
            <span className="text-lg font-semibold text-black">
              Distress Signal Network
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={linkClass("/")}>
              Home
            </Link>

            {/* Incident Dropdown */}
            <div
              className="relative"
              onMouseEnter={handleIncidentEnter}
              onMouseLeave={handleIncidentLeave}
            >
              <button
                onClick={() => setIncidentOpen((v) => !v)}
                className="flex items-center gap-1 text-black hover:text-blue-600"
              >
                Incident Types
                <FiChevronDown
                  className={`text-sm transition-transform ${
                    incidentOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {incidentOpen && (
                <div
                  className="absolute top-12 left-1/2 -translate-x-1/2 w-64 rounded-xl bg-white border shadow-xl py-2"
                  onMouseEnter={handleIncidentEnter}
                  onMouseLeave={handleIncidentLeave}
                >
                  <DropdownItem to="/incidents/fire">
                    <FiZap className="text-red-500" /> Fire
                  </DropdownItem>
                  <DropdownItem to="/incidents/flood">
                    <FiCloudRain className="text-blue-500" /> Flood
                  </DropdownItem>
                  <DropdownItem to="/incidents/medical">
                    <FiActivity className="text-green-600" /> Medical
                  </DropdownItem>
                </div>
              )}
            </div>

            {role === "authority" && (
              <Link to="/admin" className={linkClass("/admin")}>
                Command Dashboard
              </Link>
            )}

            <Link to="/guidelines" className={linkClass("/guidelines")}>
              Safety Guidelines
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 relative" ref={searchRef}>
            <span className="hidden md:flex items-center gap-1 text-sm text-black/70">
              <FiCheckCircle className="text-green-600" />
              System Online
            </span>

            {role === "authority" && (
              <span className="hidden md:flex items-center gap-1 text-sm text-red-600 font-medium">
                <FiBell />
                Active: {activeIncidents}
              </span>
            )}

            {role === "authority" && (
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="text-xl text-black hover:text-blue-600"
              >
                <FiSearch />
              </button>
            )}

            {searchOpen && (
              <div className="absolute right-0 top-14 w-72 rounded-xl bg-white p-4 shadow-xl">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Search incidents..."
                  className="w-full border-b px-2 py-2 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
            )}

            {role === "citizen" && (
              <Link
                to="/"
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white text-sm hover:bg-red-700"
              >
                <FiAlertOctagon />
                PANIC
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-2xl text-black"
            >
              <FiMenu />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white shadow-md">
          <div className="px-6 py-6 flex flex-col gap-4">
            <MobileNav to="/" setOpen={setMobileOpen}>
              Home
            </MobileNav>
            <MobileNav to="/incidents/fire" setOpen={setMobileOpen}>
              Fire
            </MobileNav>
            <MobileNav to="/incidents/flood" setOpen={setMobileOpen}>
              Flood
            </MobileNav>
            <MobileNav to="/incidents/medical" setOpen={setMobileOpen}>
              Medical
            </MobileNav>

            {role === "authority" && (
              <MobileNav to="/admin" setOpen={setMobileOpen}>
                Command Dashboard
              </MobileNav>
            )}

            <MobileNav to="/guidelines" setOpen={setMobileOpen}>
              Safety Guidelines
            </MobileNav>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

/* ===== Reusable Components ===== */

const DropdownItem = ({ to, children }) => (
  <Link
    to={to}
    className="group relative flex items-center gap-3 px-5 py-3 text-sm text-black  transition"
  >
    <span className="ml-3 flex items-center gap-2 group-hover:text-blue-600">
      {children}
    </span>
  </Link>
);

const MobileNav = ({ to, setOpen, children }) => (
  <Link
    to={to}
    onClick={() => setOpen(false)}
    className="text-black hover:text-blue-600"
  >
    {children}
  </Link>
);
