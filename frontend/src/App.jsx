import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Import Pages
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EditorPage from './pages/EditorPage.jsx';
import CommunityFeed from './pages/CommunityFeed.jsx';
import BlogDetails from './pages/BlogDetails.jsx';
import UserProfile from './pages/UserProfile.jsx';

// Configure Axios Defaults
axios.defaults.withCredentials = true;

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('empathwrite_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  // Axios interceptor to catch 401s (token expired or unauthorized)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('empathwrite_user');
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      setUser(data.user);
      localStorage.setItem('empathwrite_user', JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to authenticate user'
      };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/signup', { name, email, password });
      setUser(data.user);
      localStorage.setItem('empathwrite_user', JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/guest');
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('empathwrite_user', JSON.stringify(data.user));
      }
      return { success: true };
    } catch (error) {
      console.error('Guest login failed:', error);
      alert('Failed to initialize guest session.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (!user?.isGuest) await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error on backend:', err.message);
    } finally {
      setUser(null);
      localStorage.removeItem('empathwrite_user');
    }
  };

  const updateProfileInState = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('empathwrite_user', JSON.stringify(updatedUser));
  };

  const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    if (!user) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loginAsGuest, updateProfileInState, loading }}>
      <BrowserRouter>
        <Routes>
          {/* Public Views */}
          <Route path="/" element={<CommunityFeed />} />
          <Route path="/blog/:blogId" element={<BlogDetails />} />
          <Route path="/user/:userId" element={<UserProfile />} />

          {/* Auth Views */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Creator Workspace Views */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/editor/:id" 
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
