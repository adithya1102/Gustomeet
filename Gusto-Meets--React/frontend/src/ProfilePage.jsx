import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { User, Mail, Phone, Wallet, Briefcase, FileText, Check, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (!u) setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('firebase_uid', firebaseUser.uid)
          .maybeSingle();

        if (data) {
          setProfile(data);
          setFullName(data.full_name || '');
          setPhone(data.phone_number || '');
          setBio(data.bio || '');
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [firebaseUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone_number: phone,
          bio: bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(prev => ({
        ...prev,
        full_name: fullName,
        phone_number: phone,
        bio: bio
      }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#10B981] animate-spin" />
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <div className="text-center bg-white border border-[#E5E7EB] rounded-2xl p-8 max-w-sm w-full shadow-sm">
          <h2 className="text-lg font-semibold text-[#111827] mb-2">Please log in</h2>
          <p className="text-[#6B7280] text-sm mb-4">You need to be logged in to view your profile settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[#111827] mb-8">
          Profile Settings
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar / Cards */}
          <div className="md:col-span-1 space-y-6">
            {/* User Info Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 text-center shadow-sm">
              <div className="relative w-24 h-24 mx-auto mb-4">
                {profile?.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={fullName}
                    className="w-full h-full rounded-full object-cover border-2 border-[#10B981]"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#10B981] text-white flex items-center justify-center text-3xl font-bold">
                    {fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-lg text-[#111827] truncate">{fullName || 'Gusto User'}</h3>
              <p className="text-xs text-[#6B7280] mt-0.5 truncate">{profile?.google_email}</p>
              
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#10B981] text-xs font-semibold uppercase tracking-wider">
                {profile?.role || 'GUEST'}
              </div>
            </div>

            {/* Wallet Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-[#6B7280]">Wallet Balance</span>
                <Wallet className="w-5 h-5 text-[#10B981]" />
              </div>
              <div className="text-2xl font-bold text-[#111827]">
                ₹{profile?.wallet_balance?.toLocaleString('en-IN') || '0.00'}
              </div>
              <p className="text-xs text-[#9CA3AF] mt-2">
                Use your wallet credits for bookings and quick slot reservations.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSave} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9CA3AF]">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-3 text-sm text-[#111827] focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#D1FAE5] transition-all outline-none"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email Field - Disabled */}
              <div>
                <label className="block text-sm font-semibold text-[#6B7280] mb-2">
                  Email Address (Linked via Google)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9CA3AF]">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    disabled
                    value={profile?.google_email || ''}
                    className="w-full bg-[#F3F4F6] border border-[#E5E7EB] text-[#6B7280] rounded-xl pl-10 pr-4 py-3 text-sm cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9CA3AF]">
                    <Phone size={18} />
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-3 text-sm text-[#111827] focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#D1FAE5] transition-all outline-none"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Bio Field */}
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Bio / Host Info
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#D1FAE5] transition-all outline-none resize-none"
                    placeholder="Tell us about yourself or details that hosts/guests should know..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t border-[#F3F4F6]">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-sm rounded-xl px-6 py-3 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : success ? (
                    <>
                      <Check className="w-4 h-4" />
                      Saved!
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
