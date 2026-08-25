// src/components/ProtectedRoute.jsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const {
    isAuthenticated,
    isReady,
    isLoading,
    user,
  } = useAuth();

  // ========================================
  // AUTH CHECK LOADING
  // ========================================
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ========================================
  // WAIT FOR PROFILE
  // ========================================
  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600">
          Loading profile...
        </div>
      </div>
    );
  }

  // ========================================
  // NOT AUTHENTICATED
  // ========================================
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  // ========================================
  // ADMIN IS NOT ALLOWED ON USER SIDE
  // ========================================
  if (
    user?.role &&
    String(user.role).trim().toLowerCase() === "admin"
  ) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  // ========================================
  // USER AUTHENTICATED
  // ========================================
  return children;
};

export default ProtectedRoute;