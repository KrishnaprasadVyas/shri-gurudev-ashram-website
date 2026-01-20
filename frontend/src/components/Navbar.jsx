import { useState, useEffect, useRef } from "react";
import AnnouncementBanner from "./AnnouncementBanner";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ showAnnouncement = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAboutDropdownOpen, setIsAboutDropdownOpen] = useState(false);
  const navRef = useRef(null);
  const profileRef = useRef(null);
  const aboutRef = useRef(null);
  const location = useLocation();
  const { getCartItemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  const isAdmin = user?.role === "WEBSITE_ADMIN" || user?.role === "SYSTEM_ADMIN";

  const isActive = (path) => location.pathname === path;

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (aboutRef.current && !aboutRef.current.contains(event.target)) {
        setIsAboutDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    { path: "/about", label: "ABOUT", hasDropdown: true },
    { path: "/gurudev", label: "GURUDEV" },
    { path: "/activities", label: "ACTIVITIES" },
    { path: "/events", label: "EVENTS" },
    { path: "/gallery", label: "GALLERY" },
    { path: "/testimonials", label: "TESTIMONIALS" },
    { path: "/contact", label: "CONTACT" },
  ];

  // About submenu items
  const aboutSubMenu = [
    { path: "/about", label: "Shri Gurudev Ashram", icon: "home" },
    { path: "#", label: "Shanti Ashram", icon: "external", isExternal: true },
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
                to="/donate?quick=true"
                className="px-4 py-2 border-2 border-amber-400 rounded-md text-amber-600 text-sm font-semibold hover:bg-amber-400 hover:text-white transition-all duration-300 flex items-center space-x-2 shadow-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
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

              {/* Auth Button / Profile Dropdown */}
              {isAuthenticated ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
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
                    <span>{user?.fullName || "My Account"}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isProfileOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-amber-200 rounded-lg shadow-lg py-2 z-50 animate-fadeIn">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                            />
                          </svg>
                          Dashboard
                        </Link>
                      )}
                      <Link
                        to="/my-donations"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        My Donations
                      </Link>
                      <hr className="my-2 border-amber-100" />
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
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
              )}
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
                {isAuthenticated ? (
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="px-3 py-1.5 border-2 border-amber-400 rounded-md text-amber-700 text-sm font-semibold hover:bg-amber-100 shadow-sm flex items-center space-x-1"
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
                    <span>{user?.fullName?.split(" ")[0] || "Account"}</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="px-3 py-1.5 border-2 border-amber-400 rounded-md text-amber-700 text-sm font-semibold hover:bg-amber-100 shadow-sm"
                  >
                    Login
                  </Link>
                )}
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
                link.hasDropdown ? (
                  <div key={link.path} className="relative" ref={aboutRef}>
                    <button
                      onClick={() => setIsAboutDropdownOpen(!isAboutDropdownOpen)}
                      onMouseEnter={() => setIsAboutDropdownOpen(true)}
                      className={`px-4 py-3 text-base font-medium uppercase tracking-wider transition-all duration-300 relative group flex items-center gap-1 ${
                        isActive(link.path) || isAboutDropdownOpen
                          ? "text-amber-700"
                          : "text-gray-600 hover:text-amber-600"
                      }`}
                    >
                      {link.label}
                      <svg className={`w-4 h-4 transition-transform duration-200 ${isAboutDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {(isActive(link.path)) && (
                        <span className="absolute -bottom-0.5 left-0 right-0 h-1 bg-amber-500 rounded-full transform transition-all duration-300"></span>
                      )}
                      <span className="absolute -bottom-0.5 left-0 right-0 h-1 bg-amber-300 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    </button>
                    {/* About Dropdown Menu */}
                    {isAboutDropdownOpen && (
                      <div 
                        className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-amber-100 py-2 z-50 animate-slideDown"
                        onMouseLeave={() => setIsAboutDropdownOpen(false)}
                      >
                        {aboutSubMenu.map((item) => (
                          item.isExternal ? (
                            <a
                              key={item.label}
                              href={item.path}
                              onClick={() => setIsAboutDropdownOpen(false)}
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                            >
                              <svg className="w-5 h-5 mr-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span>{item.label}</span>
                              <span className="ml-auto text-xs text-gray-400">Coming Soon</span>
                            </a>
                          ) : (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsAboutDropdownOpen(false)}
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                            >
                              <svg className="w-5 h-5 mr-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                              <span>{item.label}</span>
                            </Link>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
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
                )
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
              link.hasDropdown ? (
                <div key={link.path} className="space-y-1">
                  <button
                    onClick={() => setIsAboutDropdownOpen(!isAboutDropdownOpen)}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-md text-base font-semibold uppercase tracking-wide transition-all duration-300 ${
                      isActive(link.path)
                        ? "bg-amber-100 text-amber-700"
                        : "text-gray-600 hover:bg-amber-100 hover:text-amber-600"
                    }`}
                  >
                    {link.label}
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isAboutDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isAboutDropdownOpen && (
                    <div className="pl-4 space-y-1">
                      {aboutSubMenu.map((item) => (
                        item.isExternal ? (
                          <a
                            key={item.label}
                            href={item.path}
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-amber-100 hover:text-amber-600 rounded-md"
                          >
                            <svg className="w-4 h-4 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {item.label}
                            <span className="ml-auto text-xs text-gray-400">Soon</span>
                          </a>
                        ) : (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-amber-100 hover:text-amber-600 rounded-md"
                          >
                            <svg className="w-4 h-4 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {item.label}
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ) : (
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
              )
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

              {/* Auth Section for Mobile */}
              {isAuthenticated ? (
                <>
                  <div className="pt-2 border-t border-amber-200">
                    <p className="px-4 py-2 text-sm text-gray-500">
                      Signed in as{" "}
                      <span className="font-semibold text-amber-700">
                        {user?.fullName || user?.mobile}
                      </span>
                    </p>
                  </div>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-4 py-3.5 bg-amber-600 text-white rounded-md font-semibold hover:bg-amber-700 transition-colors"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to="/my-donations"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-4 py-3.5 border border-amber-300 text-amber-700 rounded-md font-semibold hover:bg-amber-100 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    My Donations
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center justify-center w-full px-4 py-3.5 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3.5 border border-amber-300 text-amber-700 rounded-md text-center font-semibold hover:bg-amber-100 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      {showAnnouncement && <AnnouncementBanner />}
    </nav>
  );
};

export default Navbar;
