import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          // Interceptor handles any 401s and attempts silent refresh in the background
          const response = await api.get('/auth/profile');
          if (response.data && response.data.user) {
            setUser(response.data.user);
            setToken(localStorage.getItem("token")); // Can be updated by interceptor during initial load
            localStorage.setItem("user", JSON.stringify(response.data.user)); 
          }
        }
      } catch (error) {
        console.error("Auth validation failed:", error);
        // Interceptor cleans up localStorage if refresh completely fails
        if (!localStorage.getItem("token")) {
          setUser(null);
          setToken(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      // Hit backend to rotate out the refresh token from MongoDB and clear HttpOnly cookie
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Logout API failed, continuing client cleanup", err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, logout, loading,
      isAuthenticated: !!token,
      isStudent: user?.userType === "student",
      isOrganization: user?.userType === "organization",
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
