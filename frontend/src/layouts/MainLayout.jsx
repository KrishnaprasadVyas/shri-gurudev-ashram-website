import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingDonateButton from "../components/FloatingDonateButton";

const MainLayout = () => {
  const location = useLocation();
  const showAnnouncement = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showAnnouncement={showAnnouncement} />
      <main className="grow" style={{ paddingTop: 'var(--app-nav-height, 120px)' }}>
        <Outlet />
      </main>
      <Footer />
      <FloatingDonateButton />
    </div>
  );
};

export default MainLayout;
