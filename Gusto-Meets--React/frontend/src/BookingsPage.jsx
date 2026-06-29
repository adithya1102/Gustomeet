import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, HelpCircle, Loader2, RefreshCw, XCircle, Trash } from 'lucide-react';

const STATUS_BADGES = {
  PENDING_PAYMENT: { text: 'Pending Payment', style: 'bg-[#FFFBEB] text-[#D97706] border-[#F59E0B]/20' },
  CONFIRMED: { text: 'Confirmed', style: 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20' },
  ACTIVE: { text: 'In Progress', style: 'bg-[#F5F3FF] text-[#7C3AED] border-[#7C3AED]/20' },
  COMPLETED: { text: 'Completed', style: 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]' },
  CANCELLED: { text: 'Cancelled', style: 'bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]/20' },
};

export default function BookingsPage() {
  const navigate = useNavigate();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (!u) setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchBookings = async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      // 1. Fetch user row in Supabase users table
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUser.uid)
        .maybeSingle();

      if (userError || !userRow) {
        console.error("User row fetch error:", userError);
        setLoading(false);
        return;
      }

      // 2. Fetch bookings for guest
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          terraces (
            id,
            title,
            city,
            area,
            address_line,
            max_capacity,
            photos
          )
        `)
        .eq('guest_id', userRow.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firebaseUser) {
      fetchBookings();
    }
  }, [firebaseUser]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setCancelingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;

      // Update state locally
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setCancelingId(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
          <p className="text-[#6B7280] text-sm mb-4">You need to be logged in to view your bookings.</p>
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

  const activeBookings = bookings.filter(b => ['PENDING_PAYMENT', 'CONFIRMED', 'ACTIVE'].includes(b.status));
  const pastBookings = bookings.filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status));

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[#111827]">
            My Bookings
          </h1>
          <button
            onClick={fetchBookings}
            className="p-2 border border-[#E5E7EB] rounded-xl hover:bg-white text-[#6B7280] hover:text-[#111827] transition-all bg-[#F9FAFB]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center bg-white border border-[#E5E7EB] rounded-3xl py-16 px-4 shadow-sm">
            <Calendar className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#111827] mb-1">No bookings yet</h3>
            <p className="text-[#6B7280] text-sm max-w-sm mx-auto mb-6">
              Book a terrace or creative rooftop space for your next event or content shoot!
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-sm rounded-xl px-6 py-3 transition-colors"
            >
              Browse Spaces
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Active Bookings Section */}
            {activeBookings.length > 0 && (
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold text-[#111827] mb-4">
                  Upcoming & Active
                </h2>
                <div className="space-y-4">
                  {activeBookings.map(b => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      onCancel={handleCancelBooking}
                      canceling={cancelingId === b.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Bookings Section */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold text-[#111827] mb-4">
                  Past Bookings
                </h2>
                <div className="space-y-4">
                  {pastBookings.map(b => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      onCancel={handleCancelBooking}
                      canceling={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking, formatDate, formatTime, onCancel, canceling }) {
  const t = booking.terraces || {};
  const coverImage = (t.photos && Array.isArray(t.photos) && t.photos[0]) || '';
  const badge = STATUS_BADGES[booking.status] || { text: booking.status, style: 'bg-gray-100 text-gray-800' };

  return (
    <div className="bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row">
      {/* Thumbnail */}
      <div className="w-full sm:w-48 h-48 sm:h-auto bg-[#F3F4F6] relative shrink-0">
        {coverImage ? (
          <img src={coverImage} alt={t.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-[#9CA3AF]">
            🏞️
          </div>
        )}
        <div className={`absolute top-3 left-3 px-2.5 py-1 border rounded-md text-xs font-semibold ${badge.style}`}>
          {badge.text}
        </div>
      </div>

      {/* Info */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-bold text-base text-[#111827]">{t.title || 'Terrace'}</h3>
              <p className="text-xs text-[#6B7280] mt-0.5 flex items-center gap-1">
                <MapPin size={12} className="text-[#9CA3AF]" />
                {t.area && `${t.area}, `}{t.city || 'Chennai'}
              </p>
            </div>
            <div className="text-right sm:text-right">
              <span className="text-[#111827] font-bold text-base">₹{booking.total_charged}</span>
              <p className="text-[10px] text-[#9CA3AF]">Total Paid</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-4 my-4 pt-4 border-t border-[#F3F4F6]">
            <div className="flex items-center gap-2 text-xs text-[#111827]">
              <Calendar size={14} className="text-[#6B7280]" />
              <span>{formatDate(booking.start_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#111827]">
              <Clock size={14} className="text-[#6B7280]" />
              <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)} ({booking.duration_units} hrs)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#111827]">
              <Users size={14} className="text-[#6B7280]" />
              <span>{booking.guest_count} guests</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#111827]">
              <HelpCircle size={14} className="text-[#6B7280]" />
              <span className="capitalize">{booking.purpose?.toLowerCase().replace('_', ' ') || 'Event'}</span>
            </div>
          </div>
        </div>

        {/* Action area */}
        {['PENDING_PAYMENT', 'CONFIRMED'].includes(booking.status) && (
          <div className="pt-4 border-t border-[#F3F4F6] flex justify-end">
            <button
              onClick={() => onCancel(booking.id)}
              disabled={canceling}
              className="text-[#EF4444] hover:bg-[#FEF2F2] border border-transparent hover:border-[#EF4444]/20 font-semibold text-xs rounded-xl px-4 py-2 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {canceling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Canceling...
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  Cancel Reservation
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
