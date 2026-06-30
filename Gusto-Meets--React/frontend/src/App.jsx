import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import LoginPage from './LoginPage';
// Make sure these paths match exactly how you named your config files!
import { auth } from "./firebase";
import { supabase } from './supabaseClient';

// Import your pages
import HomePage from './HomePage';
import DetailsPage from './DetailsPage';
// import LoginPage from './LoginPage'; // Uncomment if you have a separate login page component

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // This listens for Firebase login/logout events
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      
      console.log("Auth State Changed! User is:", firebaseUser?.email || "None");
      setCurrentUser(firebaseUser);

      // === NEW SUPABASE SYNC LOGIC ===
      if (firebaseUser) {
        const { error } = await supabase
          .from('authenticated_users')
          .upsert(
            { 
              firebase_uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'GUEST'
            }, 
            { 
              onConflict: 'firebase_uid', 
              ignoreDuplicates: true // Will safely ignore if they already exist
            }
          );

        if (error) {
          console.error("🔴 Error syncing user to Supabase:", error);
        } else {
          console.log("🍏 User successfully synced to Supabase with UID!");
        }
      }
      // ===============================

      setIsAuthLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Show a dark loading screen while Firebase figures out who the user is
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0e1a12] flex items-center justify-center text-[#4ade80]">
        Loading Gusto Meets...
      </div>
    );
  }

  return (
    
      <Routes>
        {/* Protected Routes: Only show if currentUser exists, otherwise redirect */}
        <Route 
          path="/" 
          element={currentUser ? <HomePage /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/space/:id" 
          element={currentUser ? <DetailsPage /> : <Navigate to="/login" />} 
        />
        
        <Route path="/login" element={<LoginPage />} /> 
      </Routes>
  );
}
