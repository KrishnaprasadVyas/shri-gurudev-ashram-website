import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = ({ behavior = "smooth" }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, [pathname, behavior]);

  return null;
};

export default ScrollToTop;
