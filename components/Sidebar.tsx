import React from 'react';
import { NAV_ITEMS } from '../constants';
import { NavSection } from '../types';

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onNavigate }) => {
  return (
    <aside className="w-20 lg:w-64 flex-shrink-0 flex flex-col gap-2 p-4 h-full">
      <div className="mb-8 pl-2 lg:pl-4 pt-2">
        <h1 className="hidden lg:block text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-violet-500 to-purple-600 tracking-tight">
          Keeper<span className="font-light text-amber-400">2026</span>
        </h1>
        <div className="lg:hidden w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-200">K</div>
      </div>

      <nav className="space-y-2 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                isActive 
                  ? 'bg-white shadow-lg shadow-amber-100/50 text-slate-800 translate-x-1' 
                  : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${isActive ? item.color.bg + ' ' + item.color.text : 'bg-transparent group-hover:bg-white/50'}`}>
                <Icon size={20} />
              </div>
              <span className={`hidden lg:block font-medium ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${item.color.bg.replace('bg-', 'bg-opacity-100 bg-')}`} />
              )}
            </button>
          );
        })}
      </nav>

      <div className="glass-panel p-4 rounded-2xl mt-auto border-amber-100/50">
        <div className="text-xs text-amber-600/60 mb-1 tracking-widest font-semibold">CURRENT DATE</div>
        <div className="text-sm font-mono text-slate-600">
            May 12, 2026
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;