import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { supabase } from './supabaseClient'; 
import { Search, MapPin, Users, PlusCircle, ChevronDown, Check,Star} from 'lucide-react'; 

// Pre-defined cities based on your UI reference
const CITIES = ["Chennai", "Bangalore", "Mumbai", "Delhi", "Hyderabad"];

// Categories mapped directly to your terrace_permissions schema
const CATEGORIES = [
  { id: 'all', label: "All Spaces" },
  { id: 'couples', label: "Couples Allowed" },
  { id: 'party', label: "Party Friendly" },
  { id: 'alcohol', label: "BYOB Allowed" },
  { id: 'overnight', label: "Overnight Stays" }
];

export default function HomePage() {
  const navigate = useNavigate();
  
  // Data State
  const [allSpaces, setAllSpaces] = useState([]);
  const [displayedSpaces, setDisplayedSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Chennai');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // UI State
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch all active spaces on load
  useEffect(() => {
    const fetchSpaces = async () => {
      const { data, error } = await supabase
        .from('terraces')
        .select(`
          id, title, city, address_line, max_capacity,
          terrace_rates ( rate ),
          terrace_images ( image_url, is_cover ),
          terrace_permissions ( allow_couples, allow_loud_music, allow_alcohol, allow_overnight )
        `)
        .eq('is_active', true);

      if (error) {
        console.error("Error fetching spaces:", error);
      } else {
        setAllSpaces(data || []);
      }
      setLoading(false);
    };

    fetchSpaces();
  }, []);

  // Filter Engine: Runs whenever data, search, city, or category changes
  useEffect(() => {
    let filtered = [...allSpaces];

    // 1. Filter by City
    if (selectedCity) {
      filtered = filtered.filter(space => 
        space.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    // 2. Filter by Search Query (Title or Address)
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(space => 
        space.title?.toLowerCase().includes(lowerQuery) || 
        space.address_line?.toLowerCase().includes(lowerQuery)
      );
    }

    // 3. Filter by Schema Category (Permissions)
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(space => {
        const perms = space.terrace_permissions?.[0] || {};
        switch (selectedCategory) {
          case 'couples': return perms.allow_couples === true;
          case 'party': return perms.allow_loud_music === true;
          case 'alcohol': return perms.allow_alcohol === true;
          case 'overnight': return perms.allow_overnight === true;
          default: return true;
        }
      });
    }

    setDisplayedSpaces(filtered);
  }, [allSpaces, searchQuery, selectedCity, selectedCategory]);

  // Handle clicking outside the location dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLocationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#0e1a12] flex font-sans">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 lg:p-12 text-white">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-1 text-white tracking-tight">Explore Terraces</h1>
            <p className="text-[#9ca89e] text-sm">Find the perfect urban oasis for your next event.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* List Your Terrace Button */}
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2e5a38] text-[#4ade80] hover:bg-[#1e3a28] transition-colors text-sm font-medium">
              <PlusCircle size={16} />
              List Your Terrace
            </button>

            {/* Location Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a28] hover:bg-[#2a4f32] text-gray-200 transition-colors text-sm font-medium border border-[#2e5a38]"
              >
                {selectedCity}
                <ChevronDown size={16} className={`transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isLocationOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#141f17] border border-[#2e5a38] rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7c6e]">Select City</span>
                  </div>
                  {CITIES.map(city => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setIsLocationOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#1e3a28] flex items-center justify-between transition-colors"
                    >
                      <span className={selectedCity === city ? "text-[#4ade80]" : "text-gray-300"}>{city}</span>
                      {selectedCity === city && <Check size={14} className="text-[#4ade80]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wide Search Bar */}
        <div className="bg-[#141f17] border border-[#1e3a28] rounded-xl flex items-center p-3.5 mb-6 shadow-sm w-full transition-colors focus-within:border-[#4ade80]">
          <Search className="text-[#6b7c6e] w-5 h-5 ml-2 mr-3" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search spaces by name, landmark, or area..." 
            className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-[#6b7c6e]"
          />
        </div>

        {/* Dynamic Categories / Filters */}
        <div className="flex gap-3 mb-10 overflow-x-auto scrollbar-hide pb-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button 
                key={cat.id} 
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-[#4ade80] text-[#0e1a12] border border-[#4ade80]' 
                    : 'bg-[#141f17] border border-[#1e3a28] text-gray-300 hover:border-[#4ade80]/50 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Grid Display */}
        {loading ? (
          <div className="text-[#6b7c6e] flex items-center justify-center py-20">Loading spaces...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            
            {displayedSpaces.length === 0 ? (
              <div className="col-span-full py-20 text-center border border-dashed border-[#1e3a28] rounded-2xl bg-[#141f17]/50">
                <p className="text-gray-400">No spaces found matching your search in {selectedCity}.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} 
                  className="mt-4 text-[#4ade80] text-sm hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              displayedSpaces.map((space) => {
                const rate = space.terrace_rates?.[0]?.rate || "N/A";
                // Try to find the cover image, otherwise just use the first image in the array
                const coverImage = space.terrace_images?.find(img => img.is_cover)?.image_url 
                                || space.terrace_images?.[0]?.image_url;

                return (
                  <div 
                    key={space.id} 
                    onClick={() => navigate(`/space/${space.id}`)}
                    className="group cursor-pointer flex flex-col"
                  >
                    {/* Image Card */}
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-[#1e3a28] border border-[#1e3a28] group-hover:border-[#4ade80]/50 transition-colors">
                      <button className="absolute top-3 right-3 p-2 bg-black/30 backdrop-blur-md hover:bg-black/60 rounded-full z-10 text-white transition-all">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                      </button>
                      {coverImage ? (
                        <img src={coverImage} alt={space.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#2a4f32] text-5xl group-hover:scale-105 transition-transform duration-700">⛰️</div>
                      )}
                    </div>
                    
                    {/* Info Section */}
                    <div className="flex justify-between items-start">
                      <div className="pr-4">
                        <h3 className="font-semibold text-base truncate text-gray-100">{space.city}, India</h3>
                        <p className="text-[#9ca89e] text-sm mt-0.5 truncate">{space.title}</p>
                        <p className="text-[#6b7c6e] text-xs mt-1 flex items-center gap-1">
                          <Users size={12} /> Up to {space.max_capacity} guests
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm shrink-0">
                        <Star size={14} className="text-[#4ade80] fill-[#4ade80]" />
                        <span className="text-gray-200">4.9</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-[#4ade80] font-semibold">₹{rate}</span>
                      <span className="text-[#6b7c6e] text-sm"> / hr</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}