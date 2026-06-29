import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Home, IndianRupee, MapPin, Users, CheckSquare, Loader2, ArrowRight } from 'lucide-react';

const PURPOSES = [
  { label: 'Party', value: 'PARTY' },
  { label: 'Casual Meetup', value: 'CASUAL_MEETUP' },
  { label: 'Dance Practice', value: 'DANCE_PRACTICE' },
  { label: 'Flash Mob', value: 'FLASH_MOB' },
  { label: 'Community Connect', value: 'COMMUNITY_CONNECT' },
  { label: 'Personal Time', value: 'PERSONAL_TIME' },
  { label: 'Tuition', value: 'TUITION' },
  { label: 'Indoor Sports', value: 'SPORTS_INDOOR' },
  { label: 'Music Concert', value: 'MUSIC_CONCERT' },
  { label: 'Other', value: 'OTHER' },
];

const RULES = [
  { key: 'allow_alcohol', label: 'Allow Alcohol' },
  { key: 'allow_smoking', label: 'Allow Smoking' },
  { key: 'allow_loud_music', label: 'Allow Loud Music' },
  { key: 'allow_outside_food', label: 'Allow Outside Food', default: true },
  { key: 'allow_couples', label: 'Allow Couples', default: true },
  { key: 'allow_overnight', label: 'Allow Overnight' },
];

export default function HostPage() {
  const navigate = useNavigate();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Chennai');
  const [addressLine, setAddressLine] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(12);
  const [rate, setRate] = useState('');
  const [photosStr, setPhotosStr] = useState('');

  // Checkboxes
  const [allowedPurposes, setAllowedPurposes] = useState([]);
  const [houseRules, setHouseRules] = useState(
    RULES.reduce((acc, rule) => {
      acc[rule.key] = rule.default || false;
      return acc;
    }, {})
  );

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
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('firebase_uid', firebaseUser.uid)
          .maybeSingle();
        if (data) setProfile(data);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [firebaseUser]);

  const handlePurposeChange = (value) => {
    if (allowedPurposes.includes(value)) {
      setAllowedPurposes(prev => prev.filter(v => v !== value));
    } else {
      setAllowedPurposes(prev => [...prev, value]);
    }
  };

  const handleRuleChange = (key) => {
    setHouseRules(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile) return;
    if (allowedPurposes.length === 0) {
      alert("Please select at least one allowed purpose/activity!");
      return;
    }

    setSubmitting(true);
    try {
      const parsedPhotos = photosStr
        ? photosStr.split(',').map(p => p.trim()).filter(p => p.length > 0)
        : ['https://placehold.co/800x600/10B981/fff?text=New+Terrace'];

      // 1. Insert into terraces
      const { data: terrace, error: terraceError } = await supabase
        .from('terraces')
        .insert({
          host_id: profile.id,
          title: title,
          description: description,
          area: area,
          city: city,
          address_line: addressLine,
          max_capacity: parseInt(maxCapacity),
          photos: parsedPhotos,
          access_category: 'PRIVATE_STAIRCASE',
          verification: 'VERIFIED', // Auto-verify for easy demo/testing purposes
          is_active: true, // Make active immediately
          creator_ready: allowedPurposes.includes('PHOTOGRAPHY') || allowedPurposes.includes('REELS_CONTENT')
        })
        .select()
        .single();

      if (terraceError) throw terraceError;
      const terraceId = terrace.id;

      // 2. Insert into terrace_permissions
      const { error: permissionsError } = await supabase
        .from('terrace_permissions')
        .insert({
          terrace_id: terraceId,
          allow_alcohol: houseRules.allow_alcohol,
          allow_smoking: houseRules.allow_smoking,
          allow_loud_music: houseRules.allow_loud_music,
          allow_outside_food: houseRules.allow_outside_food,
          allow_couples: houseRules.allow_couples,
          allow_overnight: houseRules.allow_overnight,
          allowed_purposes: allowedPurposes
        });

      if (permissionsError) throw permissionsError;

      // 3. Insert into terrace_rates
      const { error: ratesError } = await supabase
        .from('terrace_rates')
        .insert({
          terrace_id: terraceId,
          duration_type: 'HOURLY',
          rate: parseFloat(rate),
          is_active: true
        });

      if (ratesError) throw ratesError;

      // 4. Insert cover image in terrace_images
      if (parsedPhotos.length > 0) {
        await supabase
          .from('terrace_images')
          .insert({
            terrace_id: terraceId,
            image_path: 'cover_image',
            image_url: parsedPhotos[0],
            is_cover: true,
            display_order: 1
          });
      }

      alert("Space listed successfully! It is now active and browseable.");
      navigate('/');
    } catch (err) {
      console.error("Listing creation failed:", err);
      alert("Failed to submit listing. Please verify inputs.");
    } finally {
      setSubmitting(false);
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
          <h2 className="text-lg font-semibold text-[#111827] mb-2">Host with Gusto</h2>
          <p className="text-[#6B7280] text-sm mb-4">Please log in first to set up your host profile and list your terrace.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-sm rounded-xl px-6 py-2.5 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-10 shadow-sm">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl font-bold text-[#111827]">
            List Your Terrace Space
          </h1>
          <p className="text-[#6B7280] text-sm mt-1.5">
            Share your rooftop, loft or outdoor area and start earning hourly bookings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General details */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[#111827] border-b border-[#F3F4F6] pb-2">
              1. Space Information
            </h3>

            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Nungambakkam Rooftop Terrace — Skyline View"
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#D1FAE5] transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Description</label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your space, amenities, parking availability, seating configuration, and details..."
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#D1FAE5] transition-all outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">Area / Locality</label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Velachery"
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#D1FAE5] transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">City</label>
                <input
                  type="text"
                  required
                  disabled
                  value={city}
                  className="w-full bg-[#F3F4F6] border border-[#E5E7EB] text-[#6B7280] cursor-not-allowed rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Full Address</label>
              <input
                type="text"
                required
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="e.g. 14, 3rd Cross Street, Vijaya Nagar, Chennai - 600042"
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#D1FAE5] transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">Hourly Rate (INR)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9CA3AF]">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="e.g. 800"
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pl-8 pr-4 py-3 text-sm text-[#111827] focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#D1FAE5] transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">Maximum Capacity (Guests)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9CA3AF]">
                    <Users size={16} />
                  </span>
                  <input
                    type="number"
                    required
                    min={2}
                    max={50}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-3 text-sm text-[#111827] focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#D1FAE5] transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Photos (Comma Separated URLs)</label>
              <input
                type="text"
                value={photosStr}
                onChange={(e) => setPhotosStr(e.target.value)}
                placeholder="URL1, URL2, URL3"
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#D1FAE5] transition-all outline-none"
              />
              <span className="text-[11px] text-[#9CA3AF] mt-1 block">Leave empty to use sample placeholder images.</span>
            </div>
          </div>

          {/* Allowed Purposes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#111827] border-b border-[#F3F4F6] pb-2">
              2. Allowed Purposes / Activities
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PURPOSES.map(p => {
                const checked = allowedPurposes.includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handlePurposeChange(p.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      checked
                        ? 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]'
                        : 'bg-white text-[#111827] border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }`}
                  >
                    <CheckSquare size={16} className={checked ? 'text-[#10B981]' : 'text-gray-300'} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* House Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#111827] border-b border-[#F3F4F6] pb-2">
              3. House Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RULES.map(r => {
                const checked = houseRules[r.key];
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => handleRuleChange(r.key)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      checked
                        ? 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]'
                        : 'bg-white text-[#111827] border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }`}
                  >
                    <CheckSquare size={16} className={checked ? 'text-[#10B981]' : 'text-gray-300'} />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-[#F3F4F6] flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm rounded-xl px-6 py-3.5 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Listing Space...
                </>
              ) : (
                <>
                  Submit & List Space
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
