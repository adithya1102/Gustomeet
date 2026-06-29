import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Search, SlidersHorizontal, MapPin, Users, Star, Heart, Loader2 } from 'lucide-react';
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

const PURPOSES = [
  { label: 'All', value: null },
  { label: 'Party', value: 'PARTY' },
  { label: 'Meetups', value: 'CASUAL_MEETUP' },
  { label: 'Dance', value: 'DANCE_PRACTICE' },
  { label: 'Flash Mob', value: 'FLASH_MOB' },
  { label: 'Community', value: 'COMMUNITY_CONNECT' },
  { label: 'Personal Time', value: 'PERSONAL_TIME' },
  { label: 'Tuition', value: 'TUITION' },
  { label: 'Indoor Sports', value: 'SPORTS_INDOOR' },
  { label: 'Concert', value: 'MUSIC_CONCERT' },
  { label: 'Other', value: 'OTHER' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const selectedPurpose = searchParams.get('purpose') || null;
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u?.displayName) setUserName(u.displayName.split(' ')[0]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchSpaces = async () => {
      setLoading(true);
      let query = supabase
        .from('terraces')
        .select(`
          id, title, city, area, address_line, max_capacity, creator_ready,
          terrace_rates ( rate ),
          terrace_images ( image_url ),
          terrace_permissions ( allowed_purposes )
        `)
        .eq('is_active', true);

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching spaces:", error);
      } else {
        let filtered = data || [];

        // Filter by selected purpose chip
        if (selectedPurpose) {
          filtered = filtered.filter(space => {
            const permissions = space.terrace_permissions;
            const allowed = (Array.isArray(permissions) ? permissions[0] : permissions)?.allowed_purposes || [];
            return allowed.includes(selectedPurpose);
          });
        }

        // Filter by search query
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          filtered = filtered.filter(space => {
            return (
              (space.title && space.title.toLowerCase().includes(lowerQuery)) ||
              (space.city && space.city.toLowerCase().includes(lowerQuery)) ||
              (space.area && space.area.toLowerCase().includes(lowerQuery)) ||
              (space.address_line && space.address_line.toLowerCase().includes(lowerQuery))
            );
          });
        }

        setSpaces(filtered);
      }
      setLoading(false);
    };

    fetchSpaces();
  }, [selectedPurpose, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Hero / Top Section */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl font-bold text-[#111827]">
                {userName ? `${greeting}, ${userName}` : 'Find your space'}
              </h1>
              <div className="flex items-center gap-1.5 mt-2 text-[#6B7280] text-sm cursor-pointer hover:text-[#10B981] transition-colors w-fit">
                <MapPin size={14} />
                <span>Chennai</span>
                <span className="text-[#9CA3AF]">▾</span>
              </div>
            </div>

            {/* Mobile Search Trigger */}
            <button 
              onClick={() => setSearchOpen(true)}
              className="md:hidden flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#6B7280]"
            >
              <Search size={16} />
              Search terraces...
            </button>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 scrollbar-hide">
            {PURPOSES.map((p) => {
              const isSelected = selectedPurpose === p.value;
              return (
                <button
                  key={p.label}
                  onClick={() => {
                    const newParams = { ...Object.fromEntries(searchParams) };
                    if (p.value) {
                      newParams.purpose = p.value;
                    } else {
                      delete newParams.purpose;
                    }
                    setSearchParams(newParams);
                  }}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    isSelected
                      ? 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]'
                      : 'bg-white text-[#111827] border-[#E5E7EB] hover:border-[#D1D5DB]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
            <button className="shrink-0 p-2 rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#111827] transition-all">
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSearchOpen(false)} className="p-2 -ml-2 text-[#6B7280]">
                <span className="text-2xl">←</span>
              </button>
              <input 
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setSearchParams({ ...Object.fromEntries(searchParams), search: val });
                  } else {
                    const copy = Object.fromEntries(searchParams);
                    delete copy.search;
                    setSearchParams(copy);
                  }
                }}
                placeholder="Search terraces, lofts..."
                className="flex-1 text-lg outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[#F3F4F6]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[#F3F4F6] rounded w-3/4" />
                  <div className="h-3 bg-[#F3F4F6] rounded w-1/2" />
                  <div className="h-3 bg-[#F3F4F6] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : spaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-[#9CA3AF]" />
            </div>
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[#111827] mb-1">
              No spaces available
            </h3>
            <p className="text-[#6B7280] text-sm max-w-xs">
              Try adjusting your filters or check back later for new listings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {spaces.map((space) => {
              const rate = space.terrace_rates?.[0]?.rate;
              const coverImage = space.terrace_images?.[0]?.image_url;

              return (
                <div
                  key={space.id}
                  onClick={() => navigate(`/space/${space.id}`)}
                  className="group cursor-pointer bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#D1D5DB] transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-[#F3F4F6] overflow-hidden">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={space.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl text-[#D1D5DB]">
                        🏞️
                      </div>
                    )}
                    
                    {/* Creator Ready Badge */}
                    {space.creator_ready && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#10B981] text-white text-xs font-semibold rounded-md">
                        Creator Ready
                      </div>
                    )}
                    
                    {/* Favorite Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-[#6B7280] hover:text-[#EF4444] hover:bg-white transition-all"
                    >
                      <Heart size={16} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[#111827] text-sm truncate">
                          {space.title}
                        </h3>
                        <p className="text-[#6B7280] text-xs mt-0.5 truncate">
                          {space.area}{space.city ? `, ${space.city}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star size={13} className="text-[#F59E0B] fill-[#F59E0B]" />
                        <span className="text-xs font-medium text-[#111827]">4.8</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-2 text-[#9CA3AF] text-xs">
                      <Users size={12} />
                      <span>Up to {space.max_capacity} guests</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[#111827] font-bold text-sm">
                          {rate ? `₹${rate}` : 'N/A'}
                        </span>
                        <span className="text-[#6B7280] text-xs">/ hr</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
