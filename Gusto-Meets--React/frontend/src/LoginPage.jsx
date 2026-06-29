import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, ArrowRight } from "lucide-react";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "./firebase.js";

function LoginPage() {
  const [phone, setPhone] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/");
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Login failed:", error);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handlePhoneLogin = () => {
    console.log("Phone login attempted with:", phone);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img 
            src="/logo.png" 
            alt="Gusto Meets" 
            className="w-20 h-20 rounded-3xl object-cover mb-4 shadow-sm"
          />
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#111827]">
            gusto meets
          </h1>
          <p className="text-[#6B7280] text-sm mt-1.5 text-center">
            Book unique terraces and creative spaces for your next gathering.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-[#111827] text-lg font-semibold mb-1">Welcome back</h2>
          <p className="text-[#6B7280] text-sm mb-6">Enter your details to continue.</p>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#111827] text-sm font-semibold rounded-xl py-3.5 transition-all disabled:opacity-50"
          >
            {loadingGoogle ? (
              <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#10B981] rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-[#9CA3AF] text-xs font-medium">or</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          {/* Phone Input */}
          <div className="mb-4">
            <label className="text-[#111827] text-sm font-medium mb-2 block">Phone number</label>
            <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-3 gap-2 focus-within:border-[#10B981] focus-within:ring-2 focus-within:ring-[#D1FAE5] transition-all">
              <Phone size={18} className="text-[#6B7280]" />
              <span className="text-[#111827] text-sm font-medium select-none">+91</span>
              <input
                type="tel"
                maxLength={10}
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="bg-transparent text-[#111827] text-sm flex-1 outline-none placeholder:text-[#9CA3AF]"
              />
            </div>
          </div>

          {/* Sign In Button */}
          <button
            onClick={handlePhoneLogin}
            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-sm rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors"
          >
            Get OTP <ArrowRight size={16} />
          </button>

          {/* Terms */}
          <p className="text-center text-[#9CA3AF] text-xs mt-5 leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[#9CA3AF] text-xs mt-6">
          © 2025 Gusto Meets. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
