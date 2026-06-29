import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Search, MapPin, Bell, Menu, X, User, Calendar, Heart, LogOut, Settings, Home, ChevronDown } from 'lucide-react';

export default function Navbar({ onSearchFocus }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setMenuOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'My Bookings', icon: Calendar, path: '/bookings' },
    { name: 'Saved', icon: Heart, path: '/saved' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
      {/* Main navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => navigate('/')}
          >
            <img 
              src="/logo-small.png" 
              alt="Gusto Meets" 
              className="w-9 h-9 rounded-xl object-cover"
            />
            <span className="font-[family-name:var(--font-heading)] font-bold text-xl text-[#111827] hidden sm:block">
              gusto meets
            </span>
          </div>

          {/* Center Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div 
              className="w-full flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 gap-3 hover:border-[#10B981] hover:shadow-sm transition-all cursor-pointer"
              onClick={onSearchFocus || (() => {})}
            >
              <Search className="w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search terraces, lofts..."
                value={searchQuery}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setSearchParams({ ...Object.fromEntries(searchParams), search: val });
                  } else {
                    const copy = Object.fromEntries(searchParams);
                    delete copy.search;
                    setSearchParams(copy);
                  }
                  if (location.pathname !== '/') {
                    navigate(`/?search=${encodeURIComponent(val)}`);
                  }
                }}
                className="bg-transparent text-sm outline-none w-full text-[#111827] placeholder:text-[#9CA3AF]"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Host button - desktop */}
            <button 
              onClick={() => navigate('/host')}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors"
            >
              Host & Earn
            </button>

            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white" />
            </button>

            {/* User Menu / Avatar */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl border border-[#E5E7EB] hover:shadow-sm transition-all"
                >
                  <Menu className="w-4 h-4 text-[#6B7280] ml-2" />
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-semibold">
                      {user.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl border border-[#E5E7EB] shadow-xl z-50 py-2 overflow-hidden">
                      <div className="px-4 py-3 border-b border-[#F3F4F6]">
                        <p className="text-sm font-semibold text-[#111827] truncate">{user.displayName || 'User'}</p>
                        <p className="text-xs text-[#6B7280] truncate">{user.email}</p>
                      </div>
                      {navLinks.map((link) => (
                        <button
                          key={link.name}
                          onClick={() => { navigate(link.path); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#111827] hover:bg-[#F9FAFB] transition-colors"
                        >
                          <link.icon className="w-4 h-4 text-[#6B7280]" />
                          {link.name}
                        </button>
                      ))}
                      <div className="border-t border-[#F3F4F6] my-1" />
                      <button
                        onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#111827] hover:bg-[#F9FAFB] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#6B7280]" />
                        Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-xl bg-[#10B981] text-white text-sm font-semibold hover:bg-[#059669] transition-colors"
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
