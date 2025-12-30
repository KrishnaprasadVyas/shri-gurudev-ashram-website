import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AnnouncementBanner from "../components/AnnouncementBanner";
import { announcements } from "../data/dummyData";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBanner announcements={announcements} />
      <Navbar />
      <main className="grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
