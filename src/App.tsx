import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import RestaurantMenu from "./pages/RestaurantMenu";
import ResetPassword from "./pages/ResetPassword";
import InviteSignUp from "./pages/InviteSignUp";
import { CartProvider } from "@/context/CardContext";
import CheckoutPage from "./pages/CheckoutPage"; // importe o componente

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/invite-signup" element={<InviteSignUp />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/:restaurantSlug" element={<RestaurantMenu />} />
            <Route
              path="/:restaurantSlug/:tableToken"
              element={<RestaurantMenu />}
            />
            <Route path="*" element={<NotFound />} />
            <Route
              path="/checkout/:restaurantSlug/:tableToken"
              element={<CheckoutPage />}
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
