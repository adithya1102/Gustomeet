import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Ensure this points to your client file
import { MapPin, Users, Star, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// ==========================================
// 1. CALENDAR PICKER COMPONENT (Popup)
// ==========================================
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function CalendarPicker({ selectedDate, onSelectDate }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(selectedDate || new Date(today.getFullYear(), today.getMonth(), 1));

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  const isSameDay = (a, b) => a && b && a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const isPast = (d) => d < today;

  return (
    <div className="bg-[#142a1c] border border-[#2a4a34] rounded-xl p-4 w-72 shadow-2xl absolute top-full left-0 mt-2 z-50">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg text-[#7fbd9a] hover:bg-[#0d1f15] transition-colors"><ChevronLeft size={18} /></button>
        <span className="text-white text-sm font-medium">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg text-[#7fbd9a] hover:bg-[#0d1f15] transition-colors"><ChevronRight size={18} /></button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => <div key={d} className="text-center text-[11px] text-[#7fbd9a] py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
          const past = isPast(date);
          const isToday = isSameDay(date, today);
          const isSel = isSameDay(date, selectedDate);

          return (
            <button
              key={day}
              disabled={past}
              onClick={() => onSelectDate(date)}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-all mx-0.5 
                ${isSel ? "bg-[#4ade80] text-[#0a1a0e] font-medium" : isToday ? "border border-[#4ade80] text-[#4ade80]" : past ? "text-[#2a4a34] cursor-not-allowed" : "text-gray-300 hover:bg-[#0d1f15] cursor-pointer"}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 2. TIME SLOT PICKER COMPONENT (Popup)
// ==========================================
const BASE_SLOTS = [
  "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", 
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", 
  "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"
];
const DURATIONS = [1, 2, 3, 4];

function TimeSlotPicker({ bookedSlots, selSlot, setSelSlot, selDur, setSelDur, onClose }) {
  const slots = BASE_SLOTS.map(time => ({
    time,
    occupied: bookedSlots.includes(time)
  }));

  return (
    <div className="bg-[#142a1c] border border-[#2a4a34] rounded-xl p-5 w-80 shadow-2xl absolute top-full right-0 mt-2 z-50">
      <div className="flex gap-4 mb-4 justify-center">
        <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-[#4ade80]" /> Available</span>
        <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-[#f87171]" /> Occupied</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 max-h-48 overflow-y-auto scrollbar-hide pr-1">
        {slots.map((slot) => {
          const isSel = selSlot === slot.time;
          return (
            <button
              key={slot.time}
              disabled={slot.occupied}
              onClick={() => setSelSlot(slot.time)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left w-full transition-all text-xs
                ${slot.occupied ? "bg-[#2a1315] border-[#f87171]/50 cursor-not-allowed opacity-60" 
                : isSel ? "bg-[#0a2e12] border-[#4ade80]" : "bg-[#0d1f15] border-[#2a4a34] cursor-pointer hover:border-[#4ade80]/50"}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${slot.occupied ? "bg-[#f87171]" : "bg-[#4ade80]"} ${isSel ? "ring-2 ring-white" : ""}`} />
              <span className={slot.occupied ? "text-[#f87171]" : isSel ? "text-[#4ade80]" : "text-gray-300"}>{slot.time}</span>
            </button>
          );
        })}
      </div>

      {selSlot && (
        <div className="border-t border-[#2a4a34] pt-4 mt-2">
          <p className="text-[10px] text-[#7fbd9a] mb-2 uppercase tracking-wide">Duration</p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => { setSelDur(d); onClose(); }}
                className={`flex-1 py-1.5 rounded-lg text-xs border transition-all
                  ${selDur === d ? "bg-[#4ade80] text-[#0a1a0e] border-[#4ade80]" : "bg-[#0d1f15] text-gray-300 border-[#2a4a34] hover:border-[#4ade80]/50"}`}
              >
                {d}hr
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. MAIN DETAILS PAGE
// ==========================================
export default function DetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking State
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [bookedSlots, setBookedSlots] = useState([]);
  
  // Popup Management
  const [activePopup, setActivePopup] = useState(null); // 'date' | 'time' | null
  const dropdownRef = useRef(null);

  // Fetch Space Details
  useEffect(() => {
    const fetchDetails = async () => {
      const { data, error } = await supabase
        .from('terraces')
        .select(`*, terrace_rates ( rate, duration_type ), terrace_permissions ( * ), terrace_images ( image_url )`)
        .eq('id', id)
        .single();
      if (!error) setSpace(data);
      setLoading(false);
    };
    fetchDetails();
  }, [id]);

  // Fetch Booked Slots when Date Changes
  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchBookings = async () => {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('bookings')
        .select('start_time') // Only need start time for UI disabling
        .eq('terrace_id', id)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());

      if (!error && data) {
        const formattedOccupiedSlots = data.map(booking => {
          const dateObj = new Date(booking.start_time);
          return dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); 
        });
        setBookedSlots(formattedOccupiedSlots);
      }
    };
    fetchBookings();
  }, [selectedDate, id]);

  // Close dropdowns if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActivePopup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReserve = () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select a date and time first!");
      return;
    }
    // Proceed to checkout/Razorpay
    alert(`Processing Reservation for ${selectedDate.toDateString()} at ${selectedTime} for ${selectedDuration} hours.`);
  };

  if (loading) return <div className="min-h-screen bg-[#0e1a12] text-white pl-64 pt-20 text-center">Loading details...</div>;
  if (!space) return <div className="min-h-screen bg-[#0e1a12] text-white pl-64 pt-20 text-center">Space not found.</div>;

  const rate = space.terrace_rates?.[0]?.rate || 0;
  const permissions = space.terrace_permissions?.[0] || {};
  const images = space.terrace_images || [];
  const totalPrice = rate * selectedDuration;

  return (
    <div className="min-h-screen bg-[#0e1a12] flex font-sans">
      
      {/* Assuming Sidebar is outside your routing or handled by a layout wrapper. 
          If you don't have a Sidebar component, just remove this line. */}
      {/* <Sidebar /> */}

      <main className="flex-1 ml-0 lg:ml-64 p-8 lg:p-12 text-white max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-semibold mb-2">{space.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1 font-medium"><Star size={16} className="text-yellow-500 fill-yellow-500" /> 4.9</span>
              <span className="underline cursor-pointer">11 Reviews</span>
              <span className="flex items-center gap-1"><MapPin size={16}/> {space.address_line}, {space.city}</span>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] mb-12 rounded-2xl overflow-hidden">
          <div className="col-span-2 row-span-2 bg-[#1e3a28]">
             {images[0] ? <img src={images[0].image_url} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">⛰️</div>}
          </div>
          <div className="col-span-1 row-span-1 bg-[#2a3f32]">{images[1] && <img src={images[1].image_url} alt="Gallery 1" className="w-full h-full object-cover" />}</div>
          <div className="col-span-1 row-span-1 bg-[#1e3a28]">{images[2] && <img src={images[2].image_url} alt="Gallery 2" className="w-full h-full object-cover" />}</div>
          <div className="col-span-2 row-span-1 bg-[#2a3f32]">{images[3] && <img src={images[3].image_url} alt="Gallery 3" className="w-full h-full object-cover" />}</div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-2">Entire Space hosted by Gusto</h2>
            <p className="text-gray-400 mb-6 flex items-center gap-2"><Users size={18} /> Up to {space.max_capacity} guests</p>
            <div className="w-full h-px bg-[#1e3a28] mb-8" />
            <h3 className="text-xl font-medium mb-4">About this space</h3>
            <p className="text-gray-300 leading-relaxed mb-8">{space.description}</p>
            <div className="w-full h-px bg-[#1e3a28] mb-8" />
            <h3 className="text-xl font-medium mb-4">House Rules</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${permissions.allow_alcohol ? 'border-green-900/50 text-green-400' : 'border-red-900/30 text-red-400'}`}>
                {permissions.allow_alcohol ? <CheckCircle2 size={18} /> : <XCircle size={18} />} <span className="text-sm">Alcohol</span>
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${permissions.allow_smoking ? 'border-green-900/50 text-green-400' : 'border-red-900/30 text-red-400'}`}>
                {permissions.allow_smoking ? <CheckCircle2 size={18} /> : <XCircle size={18} />} <span className="text-sm">Smoking</span>
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${permissions.allow_loud_music ? 'border-green-900/50 text-green-400' : 'border-red-900/30 text-red-400'}`}>
                {permissions.allow_loud_music ? <CheckCircle2 size={18} /> : <XCircle size={18} />} <span className="text-sm">Loud Music</span>
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${permissions.allow_outside_food ? 'border-green-900/50 text-green-400' : 'border-red-900/30 text-red-400'}`}>
                {permissions.allow_outside_food ? <CheckCircle2 size={18} /> : <XCircle size={18} />} <span className="text-sm">Outside Food</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Card */}
          <div className="w-full lg:w-[400px]">
            <div className="sticky top-8 bg-[#141f17] border border-[#1e3a28] rounded-2xl p-6 shadow-2xl">
              <div className="mb-6">
                <span className="text-2xl font-semibold text-[#4ade80]">₹{rate}</span>
                <span className="text-gray-400"> / hr</span>
              </div>

              {/* Popups Container */}
              <div className="relative border border-[#1e3a28] rounded-xl mb-4" ref={dropdownRef}>
                <div className="flex">
                  <div 
                    onClick={() => setActivePopup(activePopup === 'date' ? null : 'date')}
                    className={`flex-1 p-3 border-r border-[#1e3a28] hover:bg-[#1e3a28] transition-colors cursor-pointer rounded-l-xl ${activePopup === 'date' ? 'ring-2 ring-[#4ade80]' : ''}`}
                  >
                    <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Date</span>
                    <span className={`text-sm ${selectedDate ? 'text-white' : 'text-gray-500'}`}>
                      {selectedDate ? selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Add date'}
                    </span>
                  </div>

                  <div 
                    onClick={() => {
                      if (!selectedDate) alert("Please select a date first!");
                      else setActivePopup(activePopup === 'time' ? null : 'time');
                    }}
                    className={`flex-1 p-3 hover:bg-[#1e3a28] transition-colors cursor-pointer rounded-r-xl ${activePopup === 'time' ? 'ring-2 ring-[#4ade80]' : ''}`}
                  >
                    <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Time</span>
                    <span className={`text-sm ${selectedTime ? 'text-white' : 'text-gray-500'}`}>
                      {selectedTime ? `${selectedTime} (${selectedDuration}hr)` : 'Select slot'}
                    </span>
                  </div>
                </div>

                {activePopup === 'date' && (
                  <CalendarPicker 
                    selectedDate={selectedDate} 
                    onSelectDate={(date) => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                      setActivePopup('time');
                    }} 
                  />
                )}
                
                {activePopup === 'time' && (
                  <TimeSlotPicker 
                    bookedSlots={bookedSlots}
                    selSlot={selectedTime} 
                    setSelSlot={setSelectedTime} 
                    selDur={selectedDuration}
                    setSelDur={setSelectedDuration}
                    onClose={() => setActivePopup(null)}
                  />
                )}
              </div>

              {/* Price Calculation display */}
              {selectedTime && (
                <div className="flex justify-between text-sm text-gray-300 mb-4 px-1">
                  <span>₹{rate} × {selectedDuration} hour{selectedDuration > 1 ? 's' : ''}</span>
                  <span className="text-white font-medium">₹{totalPrice}</span>
                </div>
              )}

              {/* Primary Action */}
              <button 
                onClick={handleReserve} 
                className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-[#0e1a12] font-semibold text-lg rounded-xl py-4 transition-colors mb-4"
              >
                Reserve
              </button>
              
              <p className="text-center text-sm text-gray-400 mb-6">
                You won't be charged yet
              </p>

              {/* Secondary Action: Map Location */}
              {/* Note: This assumes your Supabase table has geo_lat and geo_lng. If not, fallback to just a map link using the city */}
              <a 
                href={space.geo_lat && space.geo_lng ? `https://www.google.com/maps/search/?api=1&query=${space.geo_lat},${space.geo_lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(space.address_line + ', ' + space.city)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-transparent border border-[#2a4a34] hover:border-[#4ade80] text-gray-200 font-semibold text-lg rounded-xl py-4 transition-colors group"
              >
                <MapPin size={20} className="text-[#4ade80] group-hover:scale-110 transition-transform" />
                View on Map
              </a>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}