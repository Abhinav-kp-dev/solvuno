import React, { useState } from 'react';
import { Home, Map, PlusCircle, BarChart2, User, Settings as SettingsIcon, LogOut, Bell, Sun, Moon, ShoppingBag } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const NAV_ITEMS = [
  { view: 'community', icon: Home, label: 'Feed' },
  { view: 'map', icon: Map, label: 'Map' },
  { view: 'report', icon: PlusCircle, label: 'Report', accent: true },
  { view: 'shop', icon: ShoppingBag, label: 'Shop' },
  { view: 'inbox', icon: Bell, label: 'Inbox' },
  { view: 'dashboard', icon: BarChart2, label: 'Insights' },
  { view: 'profile', icon: User, label: 'Profile' },
  { view: 'settings', icon: SettingsIcon, label: 'Settings' },
] as const;

export default function Sidebar() {
  const { currentView, setCurrentView, logout, issues, globalUnreadDMs, isDarkMode, toggleTheme } = useAppContext();
  const [hovered, setHovered] = useState<string | null>(null);

  const criticalCount = issues.filter(i => i.status === 'active' && (i.severityScore || 0) >= 7).length;

  return (
    <nav className="fixed top-0 left-0 h-screen w-20 md:w-72 bg-white dark:bg-[#121212] border-r border-civic-border flex flex-col justify-between py-8 px-4 z-[500]">
      
      {/* Brand / Logo Area */}
      <div className="flex justify-center md:justify-start items-center mb-8 md:px-4">
        <img src="/logo1.png" alt="Logo" className="w-8 h-8 object-contain" />
      </div>

      <div className="flex flex-col gap-4 items-center md:items-start w-full flex-1">
      {NAV_ITEMS.map((item) => {
        const { view, icon: Icon, label } = item;
        const accent = 'accent' in item ? item.accent : false;
        const active = currentView === view;
        return (
          <button
            key={view}
            onClick={() => setCurrentView(view as any)}
            onMouseEnter={() => setHovered(view)}
            onMouseLeave={() => setHovered(null)}
            className={`relative flex items-center justify-center md:justify-start gap-4 px-3.5 py-3 rounded-xl transition-all duration-200 w-full group ${
              active
                ? accent
                  ? 'bg-civic-accent2 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/20'
                  : 'bg-civic-ink dark:bg-zinc-800 text-white'
                : 'text-civic-muted hover:text-civic-ink dark:hover:text-white hover:bg-civic-bg dark:hover:bg-zinc-800/50'
            }`}
            title={label}
          >
            <div className="relative flex-shrink-0">
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {view === 'community' && criticalCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white font-mono text-[0.4rem] flex items-center justify-center font-bold">
                  {criticalCount}
                </span>
              )}
              {view === 'inbox' && globalUnreadDMs > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-1 bg-civic-accent rounded-full text-white font-mono text-[0.45rem] flex items-center justify-center font-bold">
                  {globalUnreadDMs > 99 ? '99+' : globalUnreadDMs}
                </span>
              )}
            </div>
            <span className="hidden md:block font-mono text-[0.8rem] tracking-wide">
              {label}
            </span>
          </button>
        );
      })}
      </div>

      <div className="w-full h-px bg-civic-border dark:bg-zinc-800 my-4" />

      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={logout}
          className="flex items-center justify-center md:justify-start gap-4 px-3.5 py-3 rounded-xl text-civic-muted hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 w-full"
          title="Sign Out"
        >
          <LogOut size={20} strokeWidth={2} />
          <span className="hidden md:block font-mono text-[0.8rem] tracking-wide">exit</span>
        </button>

        <button
          onClick={toggleTheme}
          className="flex items-center justify-center md:justify-start gap-4 px-3.5 py-3 rounded-xl text-civic-muted hover:text-civic-ink dark:hover:text-white hover:bg-civic-bg dark:hover:bg-zinc-800/50 transition-all duration-200 w-full"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
          <span className="hidden md:block font-mono text-[0.8rem] tracking-wide">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>
    </nav>
  );
}
