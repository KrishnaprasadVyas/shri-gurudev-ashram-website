import { Link, useLocation } from "react-router-dom";

const HeartIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
  </svg>
);

const FloatingDonateButton = () => {
  const location = useLocation();
  
  // Hide on donation page since user is already there
  if (location.pathname === "/donate") {
    return null;
  }

  return (
    <Link
      to="/donate"
      className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      aria-label="Donate Now"
    >
      <HeartIcon className="w-5 h-5 animate-pulse" />
      <span className="font-semibold">Donate</span>
      
      {/* Ripple effect ring */}
      <span className="absolute inset-0 rounded-full bg-orange-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
      
      {/* Ping animation for attention */}
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
      </span>
    </Link>
  );
};

export default FloatingDonateButton;
