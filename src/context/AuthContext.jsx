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
        // Generate a unique tab identifier
        const tabId = sessionStorage.getItem('tabId') || Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('tabId', tabId);
        
        // Check if this is a refresh (not a new browser session)
        const isRefresh = sessionStorage.getItem('isRefresh');
        if (isRefresh) {
          // This is a refresh, don't clear authentication
          sessionStorage.removeItem('isRefresh');
        }

        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          // Verify token is still valid by making a test request
          try {
            // Add timeout to prevent hanging
            const profilePromise = api.get('/auth/profile');
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout')), 5000)
            );

            const response = await Promise.race([profilePromise, timeoutPromise]);
            if (response.data && response.data.user) {
              // Check if the user type matches the current route
              const currentPath = window.location.pathname;
              const userType = response.data.user.userType;
              
              // Only validate user type for specific dashboard routes
              if (currentPath.includes('/student/dashboard') && userType === 'organization') {
                console.log('User type mismatch: organization on student dashboard, clearing auth');
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setUser(null);
                setToken(null);
                return;
              }
              
              if (currentPath.includes('/organization/dashboard') && userType === 'student') {
                console.log('User type mismatch: student on organization dashboard, clearing auth');
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setUser(null);
                setToken(null);
                return;
              }
              
              setUser(response.data.user);
              setToken(storedToken);
              console.log('User authenticated from stored data:', userType);
            } else {
              throw new Error('Invalid user data');
            }
          } catch (error) {
            console.log('Token validation failed, trying fallback method');
            // Fallback: try to parse stored user data if profile endpoint fails
            try {
              const parsedUser = JSON.parse(storedUser);
              if (parsedUser && parsedUser.id) {
                // Check user type against current route
                const currentPath = window.location.pathname;
                const userType = parsedUser.userType;
                
                if (currentPath.includes('/student/dashboard') && userType === 'organization') {
                  console.log('User type mismatch in fallback: organization on student dashboard');
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  setUser(null);
                  setToken(null);
                  return;
                }
                
                if (currentPath.includes('/organization/dashboard') && userType === 'student') {
                  console.log('User type mismatch in fallback: student on organization dashboard');
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  setUser(null);
                  setToken(null);
                  return;
                }
                
                console.log('Using stored user data as fallback:', userType);
                setUser(parsedUser);
                setToken(storedToken);
              } else {
                throw new Error('Invalid stored user data');
              }
            } catch (parseError) {
              console.log('Fallback failed, clearing storage');
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              setUser(null);
              setToken(null);
            }
          }
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set flag to detect refresh vs browser close
    const handleBeforeUnload = (e) => {
      // Set a flag to indicate this might be a refresh
      sessionStorage.setItem('isRefresh', 'true');
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Listen for storage changes (cross-tab communication)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        // Only clear auth if it was explicitly cleared by another tab
        // Don't clear on refresh or normal operations
        if (!e.newValue && e.oldValue) {
          // Check if this is a deliberate logout (not a refresh)
          const wasDeliberateLogout = sessionStorage.getItem('deliberateLogout');
          if (wasDeliberateLogout) {
            console.log('Auth cleared by another tab logout, clearing this tab too');
            setUser(null);
            setToken(null);
            sessionStorage.removeItem('deliberateLogout');
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Add visibility change listener to detect actual browser close
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Set a timeout to clear auth if page doesn't become visible again
        // This helps distinguish between refresh and actual browser close
        setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            // Page is still hidden, likely browser was closed
            // Only clear if this is not a refresh
            const isRefresh = sessionStorage.getItem('isRefresh');
            if (!isRefresh) {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
            }
          }
        }, 2000); // 2 second delay to be more conservative
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = (userData, authToken) => {
    console.log('Logging in user:', userData, 'Token:', authToken);
    setUser(userData);
    setToken(authToken);
    // Store token for current session only
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    // Don't set headers here - let the interceptor handle it
  };

  const logout = () => {
    // Set flag to indicate this is a deliberate logout
    sessionStorage.setItem('deliberateLogout', 'true');
    
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear any remaining authentication data
    console.log('User logged out - authentication cleared');
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
