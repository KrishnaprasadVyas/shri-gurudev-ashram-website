import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
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
import ActivityDetail from "./pages/ActivityDetail";

// Donation Module
import DonationPage from "./modules/donation/DonationPage";

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
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Main Pages */}
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="gurudev" element={<Gurudev />} />
            <Route path="activities" element={<Activities />} />
            <Route path="activities/:id" element={<ActivityDetail />} />
            <Route path="events" element={<Events />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Login />} />

            {/* Donation Module */}
            <Route path="donate" element={<DonationPage />} />

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
            <Route path="track-order" element={<OrderTrackingPage />} />
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
