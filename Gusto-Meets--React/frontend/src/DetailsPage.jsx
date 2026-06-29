import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';
import {
  MapPin, Users, Star, CheckCircle2, XCircle, Heart, Share,
  ChevronLeft, Info, Shield, Sparkles, Wine, Cigarette, Music, UtensilsCrossed, HeartHandshake
} from 'lucide-react';

const RULE_ICONS = {
  allow_alcohol: Wine,
  allow_smoking: Cigarette,
  allow_loud_music: Music,
  allow_outside_food: UtensilsCrossed,
  allow_couples: HeartHandshake,
};

const RULE_LABELS = {
  allow_alcohol: 'Alcohol',
  allow_smoking: 'Smoking',
  allow_loud_music: 'Loud Music',
  allow_outside_food: 'Outside Food',
  allow_couples: 'Couples',
};

export default function DetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [liked, setLiked] = useState(false);

  // Booking states
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedPurpose, setSelectedPurpose] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('firebase_uid', u.uid)
          .maybeSingle();
        if (data) setUserProfile(data);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      const { data, error } = await supabase
        .from('terraces')
        .select(`
          *,
          terrace_rates ( rate, duration_type ),
          terrace_permissions ( * ),
          terrace_images ( image_url ),
          terrace_light_data ( * )
        `)
        .eq('id', id)
        .single();

      if (!error) setSpace(data);
      setLoading(false);
    };
    fetchDetails();
  }, [id]);

  useEffect(() => {
    if (!space) return;

    const fetchSlots = async () => {
      try {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch bookings
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('start_time, end_time, status')
          .eq('terrace_id', id)
          .in('status', ['CONFIRMED', 'ACTIVE'])
          .gte('start_time', startOfDay.toISOString())
          .lt('start_time', endOfDay.toISOString());

        // Fetch holds
        const { data: holdsData } = await supabase
          .from('slot_holds')
          .select('start_time, end_time, status')
          .eq('terrace_id', id)
          .eq('status', 'ACTIVE')
          .gte('held_until', new Date().toISOString());

        const newSlots = [];
        const now = new Date();

        // 7 AM to 8 PM, step 2 hours
        for (let hour = 7; hour <= 19; hour += 2) {
          const slotStart = new Date(selectedDate);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(selectedDate);
          slotEnd.setHours(hour + 2, 0, 0, 0);

          // 1. Cutoff if slot starts within 3 hours from now
          const cutoffTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
          if (slotStart < cutoffTime) {
            newSlots.push({ start: slotStart, end: slotEnd, label: `${hour}:00 - ${hour+2}:00`, status: 'cutoff' });
            continue;
          }

          let isBooked = false;
          let isBuffer = false;
          let isHeld = false;

          const overlaps = (s1, e1, s2, e2) => s1 < e2 && e1 > s2;

          if (bookingsData) {
            for (const b of bookingsData) {
              const bStart = new Date(b.start_time);
              const bEnd = new Date(b.end_time);
              const bufferEnd = new Date(bEnd.getTime() + 45 * 60 * 1000); // 45 min buffer

              if (overlaps(slotStart, slotEnd, bStart, bEnd)) {
                isBooked = true;
                break;
              }
              if (overlaps(slotStart, slotEnd, bEnd, bufferEnd)) {
                isBuffer = true;
              }
            }
          }

          if (!isBooked && holdsData) {
            for (const h of holdsData) {
              const hStart = new Date(h.start_time);
              const hEnd = new Date(h.end_time);
              if (overlaps(slotStart, slotEnd, hStart, hEnd)) {
                isHeld = true;
                break;
              }
            }
          }

          const statusVal = isBooked
            ? 'booked'
            : isBuffer
              ? 'buffer'
              : isHeld
                ? 'active'
                : 'available';

          newSlots.push({
            start: slotStart,
            end: slotEnd,
            label: `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'} - ${(hour + 2) % 12 || 12} ${(hour + 2) >= 12 ? 'PM' : 'AM'}`,
            status: statusVal
          });
        }
        setSlots(newSlots);
        setSelectedSlot(null);
      } catch (err) {
        console.error("Error loading slots:", err);
      }
    };

    fetchSlots();
  }, [space, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#10B981] rounded-full animate-spin" />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#111827]">Space not found</h2>
          <button onClick={() => navigate('/')} className="mt-4 text-[#10B981] hover:underline text-sm">
            Go back home
          </button>
        </div>
      </div>
    );
  }

  const rate = space.terrace_rates?.[0]?.rate || 0;
  const rawPermissions = space.terrace_permissions;
  const permissions = (Array.isArray(rawPermissions) ? rawPermissions[0] : rawPermissions) || {};
  const rawLight = space.terrace_light_data;
  const lightData = (Array.isArray(rawLight) ? rawLight[0] : rawLight) || null;
  const images = space.terrace_images?.map(i => i.image_url) || [];

  const mainImage = images[0];
  const sideImages = images.slice(1, 5);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb & Actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] text-sm font-medium transition-colors"
          >
            <ChevronLeft size={18} />
            Back to listings
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                liked 
                  ? 'border-[#EF4444] text-[#EF4444] bg-[#FEF2F2]' 
                  : 'border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]'
              }`}
            >
              <Heart size={16} className={liked ? 'fill-[#EF4444]' : ''} />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] text-[#111827] text-sm font-medium hover:bg-[#F9FAFB] transition-all">
              <Share size={16} />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl font-bold text-[#111827] mb-2">
          {space.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B7280] mb-6">
          <span className="flex items-center gap-1 font-medium text-[#111827]">
            <Star size={16} className="text-[#F59E0B] fill-[#F59E0B]" /> 4.9
          </span>
          <span className="underline cursor-pointer text-[#111827]">11 reviews</span>
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {space.address_line}, {space.city}
          </span>
        </div>

        {/* Photo Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-2xl overflow-hidden mb-8 h-[300px] sm:h-[400px]">
          <div className="relative bg-[#F3F4F6] cursor-pointer group">
            {mainImage ? (
              <img src={mainImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🏞️</div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-2">
            {sideImages.map((img, i) => (
              <div key={i} className="relative bg-[#F3F4F6] cursor-pointer group overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
            ))}
            {sideImages.length < 4 &&
              [...Array(4 - sideImages.length)].map((_, i) => (
                <div key={`empty-${i}`} className="bg-[#F3F4F6] flex items-center justify-center text-3xl text-[#D1D5DB]">
                  🏞️
                </div>
              ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="flex-1 min-w-0">
            {/* Host Info */}
            <div className="flex items-center gap-4 pb-6 border-b border-[#E5E7EB]">
              <div className="w-12 h-12 rounded-full bg-[#10B981] text-white flex items-center justify-center font-semibold text-lg">
                G
              </div>
              <div>
                <h2 className="font-semibold text-[#111827]">Entire space hosted by Gusto</h2>
                <p className="text-sm text-[#6B7280]">Up to {space.max_capacity} guests</p>
              </div>
            </div>

            {/* Description */}
            <div className="py-6 border-b border-[#E5E7EB]">
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[#111827] mb-3">
                About this space
              </h3>
              <p className="text-[#6B7280] leading-relaxed text-sm">
                {space.description || "A beautiful open terrace perfect for your next gathering, photoshoot, or intimate event. Enjoy the city views with all the amenities you need for a memorable experience."}
              </p>
            </div>

            {/* Light Data / Golden Hour */}
            {lightData && (
              <div className="py-6 border-b border-[#E5E7EB]">
                <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[#111827] mb-3">
                  Golden Hour & Light Details
                </h3>
                <div className="bg-[#ECFDF5] border border-[#10B981]/10 rounded-xl p-4 flex items-start gap-3">
                  <Sparkles className="text-[#10B981] shrink-0 mt-0.5" size={18} />
                  <div className="text-sm text-[#065F46]">
                    <p className="font-semibold">Best shoot period: {lightData.best_shoot_period || 'Afternoon'}</p>
                    <p className="text-xs text-[#047857] mt-1">
                      Golden hour starts at {lightData.golden_hour_start || '05:00 PM'} and ends at {lightData.golden_hour_end || '06:00 PM'}. Optimal lighting for portrait shoots and cinematic reels.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Amenities */}
            <div className="py-6 border-b border-[#E5E7EB]">
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[#111827] mb-4">
                What this place offers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {space.amenities && space.amenities.map ? (
                  space.amenities.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-[#111827]">
                      <Sparkles size={18} className="text-[#6B7280]" />
                      {a}
                    </div>
                  ))
                ) : (
                  ['High-speed WiFi', 'Sound system', 'Power backup', 'Restrooms', 'Parking available', 'Catering options'].map((a, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-[#111827]">
                      <Sparkles size={18} className="text-[#6B7280]" />
                      {a}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* House Rules */}
            <div className="py-6 border-b border-[#E5E7EB]">
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[#111827] mb-4">
                House rules
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(RULE_LABELS).map(([key, label]) => {
                  const allowed = permissions[key] ?? true;
                  const Icon = RULE_ICONS[key] || Info;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
                        allowed
                          ? 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20'
                          : 'bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]/20'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{label}</span>
                      {allowed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews */}
            <div className="py-6">
              <div className="flex items-center gap-2 mb-4">
                <Star size={20} className="text-[#F59E0B] fill-[#F59E0B]" />
                <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[#111827]">
                  4.9 · 11 reviews
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((r) => (
                  <div key={r} className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center text-xs font-semibold text-[#6B7280]">
                        U{r}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#111827]">User {r}</p>
                        <p className="text-xs text-[#9CA3AF]">March 2025</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#6B7280]">
                      Amazing space! Perfect for our photoshoot. The lighting was great and the host was very accommodating.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="sticky top-24 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
              <div className="mb-5 flex justify-between items-baseline">
                <div>
                  <span className="text-2xl font-bold text-[#111827]">₹{rate}</span>
                  <span className="text-[#6B7280] text-sm"> / hour</span>
                </div>
                {userProfile && (
                  <span className="text-xs font-semibold text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full">
                    Bal: ₹{userProfile.wallet_balance}
                  </span>
                )}
              </div>

              {/* Booking Form */}
              <div className="space-y-4 mb-5">
                {/* Date Input */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9CA3AF] mb-1">Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#10B981]"
                  />
                </div>

                {/* Time Slots Grid */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9CA3AF] mb-1.5">Available Slots (2 hrs)</label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-[#E5E7EB] rounded-xl p-2 bg-[#F9FAFB]">
                    {slots.map((s, idx) => {
                      const isSelected = selectedSlot === idx;
                      const isDisabled = s.status !== 'available';
                      
                      let btnStyle = "bg-white border-[#E5E7EB] text-[#111827]";
                      let statusText = "";
                      
                      if (s.status === 'booked' || s.status === 'buffer') {
                        btnStyle = "bg-[#FEF2F2] border-transparent text-[#EF4444] opacity-60 cursor-not-allowed";
                        statusText = " (Booked)";
                      } else if (s.status === 'active') {
                        btnStyle = "bg-[#FFFBEB] border-transparent text-[#D97706] opacity-60 cursor-not-allowed";
                        statusText = " (Held)";
                      } else if (s.status === 'cutoff') {
                        btnStyle = "bg-gray-100 border-transparent text-gray-400 cursor-not-allowed";
                        statusText = " (Passed)";
                      } else if (isSelected) {
                        btnStyle = "bg-[#ECFDF5] border-[#10B981] text-[#10B981] font-semibold";
                      }
                      
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedSlot(idx)}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg border transition-all ${btnStyle}`}
                        >
                          {s.label}{statusText}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Purpose Selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9CA3AF] mb-1">Purpose / Activity</label>
                  <select
                    value={selectedPurpose}
                    onChange={(e) => setSelectedPurpose(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#10B981]"
                  >
                    <option value="">-- Choose Purpose --</option>
                    {(permissions.allowed_purposes || ['PARTY', 'CASUAL_MEETUP', 'OTHER']).map(p => (
                      <option key={p} value={p}>{p.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Guest Count */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#9CA3AF] mb-1">Guests (Max {space.max_capacity})</label>
                  <input
                    type="number"
                    min={1}
                    max={space.max_capacity}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.min(space.max_capacity, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              {selectedSlot !== null && selectedPurpose && (
                <>
                  <button
                    onClick={async () => {
                      if (!firebaseUser) {
                        navigate('/login');
                        return;
                      }
                      if (selectedSlot === null) return;
                      
                      const timeCost = rate * 2;
                      const cleaningFee = 150;
                      const platformFee = Math.round(timeCost * 0.18);
                      const totalCharged = timeCost + cleaningFee + platformFee;

                      if (!userProfile) {
                        alert("Checking user profile...");
                        return;
                      }
                      
                      if (userProfile.wallet_balance < totalCharged) {
                        alert(`Insufficient wallet balance! Booking costs ₹${totalCharged} but your balance is ₹${userProfile.wallet_balance}. Please add credits in Profile.`);
                        return;
                      }

                      setReserving(true);
                      try {
                        const slot = slots[selectedSlot];
                        
                        // Deduct wallet balance
                        const { error: balanceError } = await supabase
                          .from('users')
                          .update({ wallet_balance: userProfile.wallet_balance - totalCharged })
                          .eq('id', userProfile.id);

                        if (balanceError) throw balanceError;

                        // Create booking
                        const { error: bookingError } = await supabase
                          .from('bookings')
                          .insert({
                            guest_id: userProfile.id,
                            terrace_id: id,
                            duration_type: 'HOURLY',
                            start_time: slot.start.toISOString(),
                            end_time: slot.end.toISOString(),
                            purpose: selectedPurpose,
                            guest_count: guestCount,
                            status: 'CONFIRMED',
                            duration_units: 2,
                            rate_per_unit: rate,
                            total_time_cost: timeCost,
                            platform_fee: platformFee,
                            total_charged: totalCharged,
                            cleaning_fee: cleaningFee
                          });

                        if (bookingError) throw bookingError;

                        alert("Reservation complete!");
                        navigate('/bookings');
                      } catch (err) {
                        console.error(err);
                        alert("Booking failed. Please try again.");
                      } finally {
                        setReserving(false);
                      }
                    }}
                    disabled={reserving}
                    className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-base rounded-xl py-3.5 transition-colors shadow-sm shadow-[#10B981]/20 flex items-center justify-center gap-2"
                  >
                    {reserving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Reserving...
                      </>
                    ) : (
                      "Reserve"
                    )}
                  </button>
                  <p className="text-center text-[#9CA3AF] text-xs mt-3">Charges will be deducted from your wallet balance</p>

                  {/* Price Breakdown */}
                  <div className="mt-5 pt-5 border-t border-[#F3F4F6] space-y-2">
                    <div className="flex justify-between text-sm text-[#6B7280]">
                      <span>₹{rate} × 2 hrs</span>
                      <span>₹{rate * 2}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#6B7280]">
                      <span>Cleaning fee</span>
                      <span>₹150</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#6B7280]">
                      <span>Platform fee (18%)</span>
                      <span>₹{Math.round(rate * 2 * 0.18)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-[#111827] pt-2 border-t border-[#F3F4F6]">
                      <span>Total</span>
                      <span>₹{rate * 2 + 150 + Math.round(rate * 2 * 0.18)}</span>
                    </div>
                  </div>
                </>
              )}

              {selectedSlot === null && (
                <div className="text-center text-sm text-[#6B7280] py-4 bg-gray-50 border border-dashed border-[#E5E7EB] rounded-xl">
                  Please select an available date and time slot to reserve the space.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
