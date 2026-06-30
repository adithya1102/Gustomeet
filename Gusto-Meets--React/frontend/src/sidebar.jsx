import React from 'react';
import { Home, Calendar, User, LogOut, Settings, MapPin } from 'lucide-react';

export default function Sidebar() {
  const activePath = "/";

  const navItems = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'My Bookings', icon: Calendar, path: '/bookings' },
    { name: 'Saved Spaces', icon: MapPin, path: '/saved' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <aside className="w-64 h-screen bg-[#0e1a12] border-r border-[#1e3a28] flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3 border-b border-[#1e3a28]">
        <div className="w-8 h-8 rounded bg-[#1e3a28] flex items-center justify-center border border-[#2e5a38]">
          <span className="text-[#4ade80] font-bold text-xs tracking-tight">GM</span>
        </div>
        <h1 className="text-[#4ade80] text-xl font-semibold tracking-tight">Gusto Meets</h1>
      </div>

      <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;
          return (
            <button
              key={item.name}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${
                isActive ? 'bg-[#1e3a28] text-[#4ade80]' : 'text-[#9ca89e] hover:bg-[#141f17] hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? "text-[#4ade80]" : "text-[#6b7c6e]"} />
              <span className="font-medium text-sm">{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1e3a28]">
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left text-[#9ca89e] hover:bg-[#141f17] hover:text-white mb-1">
          <Settings size={20} className="text-[#6b7c6e]" />
          <span className="font-medium text-sm">Settings</span>
        </button>
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left text-red-400 hover:bg-[#2a1717] hover:text-red-300">
          <LogOut size={20} />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}