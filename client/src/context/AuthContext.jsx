import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";
import { clearToken, getToken, setToken } from "../utils/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem("token");

    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
