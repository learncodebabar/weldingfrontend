import React from "react";
import { Navigate } from "react-router-dom";

// PrivateRoute component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    // If no token, redirect to login
    return <Navigate to="/" replace />;
  }

  // If token exists, render the child component
  return children;
};

export default PrivateRoute;
