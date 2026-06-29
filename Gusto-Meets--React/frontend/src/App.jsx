import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.js";
import { supabase } from "./supabaseClient.js";

// Pages
import LoginPage from "./LoginPage.jsx";
import HomePage from "./HomePage.jsx";
import DetailsPage from "./DetailsPage.jsx";
import Navbar from "./Navbar.jsx";
import ProfilePage from "./ProfilePage.jsx";
import BookingsPage from "./BookingsPage.jsx";
import HostPage from "./HostPage.jsx";

// Protected route wrapper
const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

async function syncSupabaseUser(currentUser) {
  if (!currentUser) return;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', currentUser.uid)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error("Error checking Supabase user:", error);
      return;
    }

    if (!data) {
      // Create user row
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          firebase_uid: currentUser.uid,
          phone_number: currentUser.phoneNumber || currentUser.email || currentUser.uid,
          full_name: currentUser.displayName || 'Gusto User',
          google_email: currentUser.email || null,
          profile_photo_url: currentUser.photoURL || null,
          role: 'GUEST',
          active_role: 'GUEST',
          wallet_balance: 5000.00 // Start with 5000 rupees to test reservation flow
        });

      if (insertError) {
        console.error("Error creating Supabase user:", insertError);
      } else {
        console.log("Supabase user created successfully!");
      }
    }
  } catch (err) {
    console.error("Failed to sync user to Supabase:", err);
  }
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        syncSupabaseUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isLoginPage = location.pathname === "/login";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-small.png" alt="Gusto Meets" className="w-12 h-12 rounded-xl object-cover animate-pulse" />
          <p className="text-[#6B7280] text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {!isLoginPage && <Navbar />}
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute user={user}>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/space/:id"
          element={
            <ProtectedRoute user={user}>
              <DetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute user={user}>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/host"
          element={
            <ProtectedRoute user={user}>
              <HostPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
