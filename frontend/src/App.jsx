import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { GalleryProvider } from "./context/GalleryContext";
import { EventsProvider } from "./context/EventsContext";
import { ActivitiesProvider } from "./context/ActivitiesContext";
import { AnnouncementProvider } from "./context/AnnouncementContext";
import { DonationsProvider } from "./context/DonationsContext";
import MainLayout from "./layouts/MainLayout";
import ScrollToTop from "./components/ScrollToTop";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Gurudev from "./pages/Gurudev";
import Activities from "./pages/Activities";
import Events from "./pages/Events";
import Gallery from "./pages/Gallery";
import Testimonials from "./pages/Testimonials";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ActivityDetail from "./pages/ActivityDetail";
import AdminLogin from "./pages/admin/AdminLogin";

// Admin Pages
import AdminLayout from "./layouts/AdminLayout";
import AdminHome from "./pages/admin/AdminHome";
import WebsiteAdmin from "./pages/admin/WebsiteAdmin";
import WebsiteAdminLayout from "./layouts/WebsiteAdminLayout";
import GalleryManager from "./pages/admin/GalleryManager";
import EventsManager from "./pages/admin/EventsManager";
import ActivitiesManager from "./pages/admin/ActivitiesManager";
import AnnouncementBannerManager from "./pages/admin/AnnouncementBannerManager";
import SystemAdmin from "./pages/admin/SystemAdmin";
import SystemAdminLayout from "./layouts/SystemAdminLayout";
import SystemOverview from "./pages/admin/SystemOverview";
import DonationsView from "./pages/admin/DonationsView";
import DonorsView from "./pages/admin/DonorsView";
import ReportsView from "./pages/admin/ReportsView";
import ExportsView from "./pages/admin/ExportsView";

// Donation Module
import DonationPage from "./modules/donation/DonationPage";
import MyDonations from "./pages/MyDonations";

// E-commerce Module
import ShopPage from "./modules/ecommerce/ShopPage";
import ProductDetailPage from "./modules/ecommerce/ProductDetailPage";
import CartPage from "./modules/ecommerce/CartPage";
import CheckoutPage from "./modules/ecommerce/CheckoutPage";
import OrderConfirmationPage from "./modules/ecommerce/OrderConfirmationPage";
import OrderTrackingPage from "./modules/ecommerce/OrderTrackingPage";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <CartProvider>
        <GalleryProvider>
          <EventsProvider>
            <ActivitiesProvider>
              <AnnouncementProvider>
                <DonationsProvider>
                  <Routes>
                    <Route path="/" element={<MainLayout />}>
                      {/* Main Pages */}
                      <Route index element={<Home />} />
                      <Route path="about" element={<About />} />
                      <Route path="gurudev" element={<Gurudev />} />
                      <Route path="activities" element={<Activities />} />
                      <Route
                        path="activities/:id"
                        element={<ActivityDetail />}
                      />
                      <Route path="events" element={<Events />} />
                      <Route path="gallery" element={<Gallery />} />
                      <Route path="testimonials" element={<Testimonials />} />
                      <Route path="contact" element={<Contact />} />
                      <Route path="login" element={<Login />} />
                      <Route path="login/admin" element={<AdminLogin />} />
                      <Route path="signup" element={<Signup />} />

                      {/* Donation Module */}
                      <Route path="donate" element={<DonationPage />} />
                      <Route path="my-donations" element={<MyDonations />} />

                      {/* E-commerce Module */}
                      <Route path="shop" element={<ShopPage />} />
                      <Route path="shop/:id" element={<ProductDetailPage />} />
                      <Route path="cart" element={<CartPage />} />
                      <Route path="checkout" element={<CheckoutPage />} />
                      <Route
                        path="order-confirmation/:orderId"
                        element={<OrderConfirmationPage />}
                      />
                      <Route
                        path="track-order/:orderId"
                        element={<OrderTrackingPage />}
                      />
                      <Route
                        path="track-order"
                        element={<OrderTrackingPage />}
                      />
                    </Route>

                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminHome />} />
                      <Route path="website" element={<WebsiteAdminLayout />}>
                        <Route index element={<GalleryManager />} />
                        <Route path="gallery" element={<GalleryManager />} />
                        <Route path="events" element={<EventsManager />} />
                        <Route
                          path="activities"
                          element={<ActivitiesManager />}
                        />
                        <Route
                          path="announcement"
                          element={<AnnouncementBannerManager />}
                        />
                      </Route>
                      <Route path="system" element={<SystemAdminLayout />}>
                        <Route index element={<SystemOverview />} />
                        <Route path="overview" element={<SystemOverview />} />
                        <Route path="donations" element={<DonationsView />} />
                        <Route path="donors" element={<DonorsView />} />
                        <Route path="reports" element={<ReportsView />} />
                        <Route path="exports" element={<ExportsView />} />
                      </Route>
                    </Route>
                  </Routes>
                </DonationsProvider>
              </AnnouncementProvider>
            </ActivitiesProvider>
          </EventsProvider>
        </GalleryProvider>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
