import { useState, useEffect, useRef } from "react";
import AnnouncementBanner from "./AnnouncementBanner";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

const Navbar = ({ showAnnouncement = false, announcements = [] }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navRef = useRef(null);
  const location = useLocation();
  const { getCartItemCount } = useCart();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsScrolled(false);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Measure nav height and expose as CSS variable so layout can adapt
  useEffect(() => {
    const setNavHeight = () => {
      if (navRef.current) {
        const h = Math.ceil(navRef.current.getBoundingClientRect().height);
        document.documentElement.style.setProperty(
          "--app-nav-height",
          `${h}px`
        );
      }
    };
    setNavHeight();
    window.addEventListener("resize", setNavHeight);
    return () => window.removeEventListener("resize", setNavHeight);
  }, [showAnnouncement, isMenuOpen, isScrolled]);

  const navLinks = [
    { path: "/", label: "HOME" },
    { path: "/about", label: "ABOUT" },
    { path: "/gurudev", label: "GURUDEV" },
    { path: "/activities", label: "ACTIVITIES" },
    { path: "/events", label: "EVENTS" },
    { path: "/gallery", label: "GALLERY" },
    { path: "/testimonials", label: "TESTIMONIALS" },
    { path: "/contact", label: "CONTACT" },
  ];

  return (
    <nav
      ref={navRef}
      className={`fixed left-0 right-0 z-50 bg-amber-50/95 backdrop-blur-sm shadow-lg transition-transform duration-300 ${
        isScrolled ? "-translate-y-full" : "translate-y-0"
      }`}
      style={{ top: "0" }}
    >
      {/* Top Bar - Social Media, Heading & Action Buttons */}
      <div className="bg-amber-50/90 border-b border-amber-200/30">
        <div className="max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 relative">
          <div className="hidden xl:flex justify-between items-center h-24 py-8">
            {/* Social Media Icons */}
            <div className="flex items-center space-x-4">
              <a
                href="https://www.facebook.com/SwamiHarichaitanyanandS/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border-2 border-amber-400 rounded-md text-amber-500 hover:bg-amber-400 hover:text-white transition-all duration-300 group"
                aria-label="Facebook"
              >
                <svg
                  className="w-4.5 h-4.5 group-hover:text-white transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@shrigurudevashram"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border-2 border-amber-400 rounded-md text-amber-500 hover:bg-amber-400 hover:text-white transition-all duration-300 group"
                aria-label="YouTube"
              >
                <svg
                  className="w-4.5 h-4.5 group-hover:text-white transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/swami_harichaitanyaji_/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border-2 border-amber-400 rounded-md text-amber-500 hover:bg-amber-400 hover:text-white transition-all duration-300 group"
                aria-label="Instagram"
              >
                <svg
                  className="w-4.5 h-4.5 group-hover:text-white transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://x.com/Harichaitanyaji"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border-2 border-amber-400 rounded-md text-amber-500 hover:bg-amber-400 hover:text-white transition-all duration-300 group"
                aria-label="Twitter/X"
              >
                <svg
                  className="w-4.5 h-4.5 group-hover:text-white transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
            {/* Logo */}
            <div className="flex justify-center flex-1 xl:ml-24">
              <Link
                to="/"
                className="group transition-transform duration-300 hover:scale-105"
              >
                <img
                  src="/assets/Logo.png"
                  alt="Gurudev Ashram Logo"
                  className="h-16 md:h-20 lg:h-24 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="hidden ml-6 sm:flex items-center space-x-3">
              <Link
                to="/donate"
                className="px-4 py-2 border-2 border-amber-400 rounded-md text-amber-600 text-sm font-semibold hover:bg-amber-400 hover:text-white transition-all duration-300 flex items-center space-x-2 shadow-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Quick Donate</span>
              </Link>
              <Link
                to="/shop"
                className="px-4 py-2 border-2 border-amber-400 rounded-md text-amber-600 text-sm font-semibold hover:bg-amber-400 hover:text-white transition-all duration-300 flex items-center space-x-2 relative shadow-sm"
              >
                <span>Shop</span>
                {getCartItemCount() > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getCartItemCount()}
                  </span>
                )}
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 border-2 border-amber-400 rounded-md text-amber-600 text-sm font-semibold hover:bg-amber-400 hover:text-white transition-all duration-300 flex items-center space-x-2 shadow-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar - Logo & Navigation */}
      <div className="bg-amber-50/95 border-b border-amber-200/40">
        <div className="max-w-1xl px-8 sm:px-12 lg:px-16 xl:mx-40">
          {/* Mobile row with centered heading+logo block and airy spacing */}
          <div className="flex xl:hidden items-center justify-between py-3 px-3 gap-3">
            <div className="flex flex-col items-center justify-center gap-1">
              <p className="text-sm font-semibold text-amber-700 leading-tight text-center">
                श्री गुरुदेव आश्रम
              </p>
              <Link to="/" className="flex items-center justify-center">
                <img
                  src="/assets/Logo.png"
                  alt="Gurudev Ashram Logo"
                  className="h-12 w-auto object-contain"
                />
              </Link>
            </div>
            <div className="flex items-center pr-2">
              {/* Compact donate button for extra-small screens */}
              <Link
                to="/donate"
                className="sm:hidden px-2.5 py-1 border-2 border-amber-400 rounded-md text-amber-700 text-xs font-semibold hover:bg-amber-100 shadow-sm flex-shrink-0"
              >
                Donate
              </Link>
              {/* Full actions shown from sm and up */}
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to="/donate"
                  className="px-3 py-1.5 border-2 border-amber-400 rounded-md text-amber-700 text-sm font-semibold hover:bg-amber-100 shadow-sm"
                >
                  Donate
                </Link>
                <Link
                  to="/shop"
                  className="px-3 py-1.5 border-2 border-amber-400 rounded-md text-amber-700 text-sm font-semibold hover:bg-amber-100 relative shadow-sm"
                >
                  Shop
                  {getCartItemCount() > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-[11px] rounded-full w-5 h-5 inline-flex items-center justify-center">
                      {getCartItemCount()}
                    </span>
                  )}
                </Link>
                <Link
                  to="/login"
                  className="px-3 py-1.5 border-2 border-amber-400 rounded-md text-amber-700 text-sm font-semibold hover:bg-amber-100 shadow-sm"
                >
                  Login
                </Link>
              </div>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="ml-2 p-2 rounded-md text-amber-700 hover:bg-amber-100 transition-colors flex-shrink-0"
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                <svg
                  className="h-7 w-7"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop Navigation - Centered Layout (Grid for perfect centering) */}
          <div className="hidden xl:flex justify-between items-center py-5 relative">
            {/* Desktop Navigation - Left Side */}
            <div className="flex items-center justify-between space-x-6">
              {navLinks.slice(0, 4).map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-3 text-base font-medium uppercase tracking-wider transition-all duration-300 relative group ${
                    isActive(link.path)
                      ? "text-amber-700"
                      : "text-gray-600 hover:text-amber-600"
                  }`}
                >
                  {link.label}
                  {isActive(link.path) && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-1 bg-amber-500 rounded-full transform transition-all duration-300"></span>
                  )}
                  <span className="absolute -bottom-0.5 left-0 right-0 h-1 bg-amber-300 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
              ))}
            </div>

            {/* Center Title */}
            <div className="text-center justify-self-center">
              <h1
                className="text-base md:text-lg text-gray-700 font-semibold tracking-wide leading-tight whitespace-nowrap text-center"
                style={{ fontFamily: "sans-serif" }}
              >
                श्री गुरुदेव आश्रम,
                <br></br>पळसखेड (सपकाळ)
              </h1>
            </div>
            {/* Desktop Navigation - Right Side */}
            <div className="flex items-center space-x-6">
              {navLinks.slice(4).map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-3 text-base font-medium uppercase tracking-wider transition-all duration-300 relative group ${
                    isActive(link.path)
                      ? "text-amber-700"
                      : "text-gray-600 hover:text-amber-600"
                  }`}
                >
                  {link.label}
                  {isActive(link.path) && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-1 bg-amber-500 rounded-full transform transition-all duration-300"></span>
                  )}
                  <span className="absolute -bottom-0.5 left-0 right-0 h-1 bg-amber-300 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="xl:hidden bg-amber-50/95 border-t border-amber-200/30 animate-slideDown">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 rounded-md text-base font-semibold uppercase tracking-wide transition-all duration-300 ${
                  isActive(link.path)
                    ? "bg-amber-100 text-amber-700"
                    : "text-gray-600 hover:bg-amber-100 hover:text-amber-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-amber-200 space-y-2">
              <Link
                to="/shop"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3.5 bg-amber-500 text-white rounded-md text-center font-semibold hover:bg-amber-600 transition-colors relative"
              >
                Shop
                {getCartItemCount() > 0 && (
                  <span className="ml-2 bg-white text-amber-600 text-xs rounded-full px-2 py-0.5">
                    {getCartItemCount()}
                  </span>
                )}
              </Link>
              <Link
                to="/cart"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3.5 bg-amber-400 text-white rounded-md text-center font-semibold hover:bg-amber-500 transition-colors relative"
              >
                Cart {getCartItemCount() > 0 && `(${getCartItemCount()})`}
              </Link>
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3.5 border border-amber-300 text-amber-700 rounded-md text-center font-semibold hover:bg-amber-100 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
      {showAnnouncement && <AnnouncementBanner announcements={announcements} />}
    </nav>
  );
};

export default Navbar;
