import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import History from "./pages/History";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function Background() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 bg-mesh" />
      <div className="pointer-events-none fixed inset-0 hero-glow" />
      <div className="pointer-events-none fixed -left-32 top-1/4 h-96 w-96 rounded-full bg-emerald/10 blur-[120px]" />
      <div className="pointer-events-none fixed -right-32 top-1/3 h-80 w-80 rounded-full bg-gold/10 blur-[100px]" />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="relative min-h-screen">
        <Background />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </AuthProvider>
  );
}
