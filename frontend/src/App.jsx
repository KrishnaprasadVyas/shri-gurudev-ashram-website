import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { GalleryProvider } from "./context/GalleryContext";
import { EventsProvider } from "./context/EventsContext";
import { ActivitiesProvider } from "./context/ActivitiesContext";
import { AnnouncementProvider } from "./context/AnnouncementContext";
import { DonationsProvider } from "./context/DonationsContext";
import MainLayout from "./layouts/MainLayout";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ErrorBoundary from "./components/ErrorBoundary";

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
import ActivityDetail from "./pages/ActivityDetail";

// Admin Pages
import AdminLayout from "./layouts/AdminLayout";
import AdminHome from "./pages/admin/AdminHome";
import WebsiteAdmin from "./pages/admin/WebsiteAdmin";
import WebsiteAdminLayout from "./layouts/WebsiteAdminLayout";
import GalleryManager from "./pages/admin/GalleryManager";
import EventsManager from "./pages/admin/EventsManager";
import ActivitiesManager from "./pages/admin/ActivitiesManager";
import AnnouncementBannerManager from "./pages/admin/AnnouncementBannerManager";
import TestimonialsManager from "./pages/admin/TestimonialsManager";
import SystemAdmin from "./pages/admin/SystemAdmin";
import SystemAdminLayout from "./layouts/SystemAdminLayout";
import SystemOverview from "./pages/admin/SystemOverview";
import DonationsView from "./pages/admin/DonationsView";
import DonorsView from "./pages/admin/DonorsView";
import ReportsView from "./pages/admin/ReportsView";
import ExportsView from "./pages/admin/ExportsView";
import CashDonationForm from "./pages/admin/CashDonationForm";

// Donation Module
import DonationPage from "./modules/donation/DonationPage";
import MyDonations from "./pages/MyDonations";

// E-commerce Module (disabled)
import ShopComingSoon from "./pages/ShopComingSoon";

// Email Verification
import VerifyEmail from "./pages/VerifyEmail";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
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

                        {/* Email Verification - public route */}
                        <Route path="verify-email" element={<VerifyEmail />} />

                        {/* Donation Module */}
                        <Route path="donate" element={<DonationPage />} />
                        <Route
                          path="my-donations"
                          element={
                            <ProtectedRoute>
                              <MyDonations />
                            </ProtectedRoute>
                          }
                        />

                        {/* E-commerce Module (coming soon) */}
                        <Route path="shop/*" element={<ShopComingSoon />} />
                        <Route path="cart" element={<ShopComingSoon />} />
                        <Route path="checkout" element={<ShopComingSoon />} />
                        <Route
                          path="order-confirmation/:orderId"
                          element={<ShopComingSoon />}
                        />
                        <Route
                          path="track-order/:orderId"
                          element={<ShopComingSoon />}
                        />
                        <Route
                          path="track-order"
                          element={<ShopComingSoon />}
                        />
                      </Route>

                      {/* Admin Routes - Protected */}
                      <Route
                        path="/admin"
                        element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        }
                      >
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
                          <Route
                            path="testimonials"
                            element={<TestimonialsManager />}
                          />
                        </Route>
                        <Route
                          path="system"
                          element={
                            <AdminRoute requiredRole="SYSTEM_ADMIN">
                              <SystemAdminLayout />
                            </AdminRoute>
                          }
                        >
                          <Route index element={<SystemOverview />} />
                          <Route path="overview" element={<SystemOverview />} />
                          <Route path="donations" element={<DonationsView />} />
                          <Route path="donors" element={<DonorsView />} />
                          <Route path="reports" element={<ReportsView />} />
                          <Route path="exports" element={<ExportsView />} />
                          <Route
                            path="cash-donation"
                            element={<CashDonationForm />}
                          />
                        </Route>
                      </Route>
                    </Routes>
                  </DonationsProvider>
                </AnnouncementProvider>
              </ActivitiesProvider>
            </EventsProvider>
          </GalleryProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
