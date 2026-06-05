import React, { useState, useEffect, useRef } from 'react';
import { Bell, Settings, Search, Coins, Sparkles, Menu, X } from 'lucide-react';

interface TopbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  robux: number;
  userName: string;
  avatarColor: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleMobileMenu?: () => void;
  onOpenNotifications?: () => void;
  currentUser?: any;
  onSignIn?: () => void;
  onSignOut?: () => void;
  games?: any[];
  onPlayGame?: (game: any) => void;
}

export default function Topbar({
  activeTab,
  setActiveTab,
  robux,
  userName,
  avatarColor,
  searchQuery,
  setSearchQuery,
  toggleMobileMenu,
  onOpenNotifications,
  currentUser,
  onSignIn,
  onSignOut,
  games = [],
  onPlayGame
}: TopbarProps) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showRobuxMenu, setShowRobuxMenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        const activeEl = document.activeElement;
        const isInput = activeEl && (
          activeEl.tagName === 'INPUT' || 
          activeEl.tagName === 'TEXTAREA' || 
          (activeEl as HTMLElement).isContentEditable
        );
        if (!isInput) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter games based on search query matching title or category
  const filteredGames = games && searchQuery.trim()
    ? games.filter(g => 
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.category && g.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Formatting Robux with commas, e.g., 14,500
  const formattedRobux = robux.toLocaleString();

  return (
    <header className="fixed top-0 left-0 right-0 h-12 bg-[#232527] border-b border-[#393B3D] z-40 flex items-center justify-between px-3 text-white select-none font-sans overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-none md:overflow-visible">
      {/* Left side: Mobile Toggle, Logo, Shortcuts */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Mobile Hamburger menu */}
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden p-1.5 hover:bg-[#323436] rounded text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>

        {/* Brand Logo - Beautiful Realistic Bird Icon + Voxel text */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          {/* Realistic but small bird shape - flying swallow silhouette */}
          <div className="relative w-8 h-8 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <svg 
              viewBox="0 0 24 24" 
              className="w-7 h-7 text-white fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C11.5 3.5 10 5.5 8 6C6 6.5 4 6 2 5C4 7 6.5 8.5 9 9C8 11 6.5 13 4 14.5C6.5 14 9 12.5 11 11C11.5 13 12 16 12 19C12 16 12.5 13 13 11C15 12.5 17.5 14 20 14.5C17.5 13 16 11 15 9C17.5 8.5 20 7 22 5C20 6 18 6.5 16 6C14 5.5 12.5 3.5 12 2Z" />
            </svg>
          </div>
          <span className="font-display font-extrabold text-lg tracking-wider text-white hidden sm:inline-block">
            VOXEL
          </span>
        </div>
      </div>

      {/* Central Search Bar */}
      <div className="flex-1 max-w-md mx-3 md:mx-6 relative shrink-0 min-w-[140px]">
        <div className="relative flex items-center w-full">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search experiences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Delay hides list slightly so click on dropdown can register
              setTimeout(() => setIsFocused(false), 200);
            }}
            className="w-full bg-[#111214] placeholder-gray-500 text-white text-sm pl-9 pr-8 py-1 rounded border border-[#393B3D] focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/30 transition-all font-sans"
          />
          <Search size={16} className="absolute left-3 text-gray-500 pointer-events-none" />
          {!searchQuery && !isFocused && (
            <kbd className="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono text-gray-500 bg-[#1e2022] rounded border border-[#393B3D]/80 select-none pointer-events-none shadow-sm hidden sm:inline-block">
              /
            </kbd>
          )}
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-gray-500 hover:text-gray-300 p-1 rounded-full cursor-pointer hover:bg-[#323436]"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Floating Live Search Dropdown */}
        {isFocused && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#232527] border border-[#393B3D] rounded-md shadow-2xl z-50 overflow-hidden font-sans max-h-96 flex flex-col">
            {filteredGames.length > 0 ? (
              <>
                <div className="px-3 py-1.5 bg-[#191B1D] text-[10px] text-gray-400 font-semibold tracking-wider uppercase border-b border-[#393B3D]">
                  Matching Experiences ({filteredGames.length})
                </div>
                <div className="overflow-y-auto divide-y divide-[#393B3D]/50">
                  {filteredGames.slice(0, 5).map((game) => (
                    <div
                      key={game.id}
                      onMouseDown={() => {
                        onPlayGame?.(game);
                        setIsFocused(false);
                      }}
                      className="flex items-center gap-3 p-2.5 hover:bg-[#323436] transition-colors cursor-pointer group"
                    >
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        className="w-10 h-10 rounded object-cover ring-1 ring-white/10 group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-200 group-hover:text-[#4f46e5] transition-colors truncate">
                          {game.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                          <span className="bg-[#111214] px-1.5 py-0.5 rounded text-[9px] text-emerald-400 font-semibold uppercase">
                            {game.category}
                          </span>
                          <span>by {game.creator}</span>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-emerald-400 font-medium">
                        <span className="flex items-center gap-0.5 justify-end">
                          🟢 {game.activePlayers.toLocaleString()}
                        </span>
                        <span className="text-gray-500 block text-[9px] mt-0.5">
                          👍 {game.upvoteRatio}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onMouseDown={() => {
                    setActiveTab('discover');
                    setIsFocused(false);
                  }}
                  className="w-full text-center py-2 bg-[#323436] hover:bg-[#393B3D] text-[11px] font-bold text-gray-300 hover:text-white transition-colors border-t border-[#393B3D] flex items-center justify-center gap-1.5"
                >
                  <Search size={12} />
                  <span>See all results in Discover tab</span>
                </button>
              </>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-400 font-semibold">No experiences found</p>
                <p className="text-[10px] text-gray-500 mt-1">Try another title, category, or creator name.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: Robux, Profile, Notifications, Settings */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Robux Account Status Indicator */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowRobuxMenu(!showRobuxMenu);
              setShowSettingsMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111214] border border-[#393B3D] hover:bg-[#323436] transition-colors cursor-pointer text-amber-500 font-mono text-xs font-bold"
            title="Buy or manage Robux"
          >
            {/* Custom SVG Robux Coin sign */}
            <svg viewBox="0 0 100 100" className="w-4 h-4 fill-amber-500">
              <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" />
              <polygon points="50,15 80,30 80,70 50,85 20,70 20,30" className="fill-amber-600" />
              <rect x="36" y="36" width="28" height="28" className="fill-amber-300" rx="4" />
            </svg>
            <span className="text-gray-200">{formattedRobux}</span>
          </button>

          {/* Mini Robux Dropdown Panel */}
          {showRobuxMenu && (
            <div className="absolute right-0 mt-2.5 w-60 bg-[#232527] border border-[#393B3D] rounded-md shadow-xl p-3 z-50 text-gray-200 animate-fadeIn text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-[#393B3D] mb-2">
                <span className="text-gray-400 font-semibold">Robux Balance</span>
                <span className="text-amber-500 font-bold font-mono">{formattedRobux} R$</span>
              </div>
              <div className="space-y-1 text-xs">
                <button 
                  onClick={() => { alert("This would launch a secure payment gateway in a production environment!"); setShowRobuxMenu(false); }}
                  className="w-full text-left py-2 px-2 hover:bg-[#323436] rounded flex justify-between items-center text-amber-400 font-semibold cursor-pointer"
                >
                  <span>Buy 400 Robux</span>
                  <span className="bg-[#111214] border border-amber-500/20 px-1.5 py-0.5 rounded text-white font-mono">$4.99</span>
                </button>
                <button 
                  onClick={() => { alert("Premium subscription allows earning 450 Robux monthly!"); setShowRobuxMenu(false); }}
                  className="w-full text-left py-2 px-2 hover:bg-[#323436] rounded flex justify-between items-center text-rose-400 font-semibold cursor-pointer"
                >
                  <span className="flex items-center gap-1"><Sparkles size={12} /> Buy Premium</span>
                  <span className="bg-[#111214] border border-rose-500/20 px-1.5 py-0.5 rounded text-white font-mono">$5.99/mo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile indicator (Small round avatar matching current look) */}
        {currentUser ? (
          <button 
            onClick={() => setActiveTab('avatar')}
            className="flex items-center gap-2 cursor-pointer group"
            title="Customize Avatar"
          >
            <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${avatarColor} flex items-center justify-center text-gray-950 font-bold text-xs ring-1 ring-[#393B3D] group-hover:ring-white transition-all`}>
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-gray-300 group-hover:text-white hidden xl:inline-block transition-colors">
              {userName}
            </span>
          </button>
        ) : (
          <button 
            onClick={onSignIn}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer active:scale-95 duration-100 uppercase tracking-wide"
            title="Connect Google profile"
          >
            Sign In 🟢
          </button>
        )}

        {/* Help divider line */}
        <div className="w-px h-6 bg-[#393B3D]" />

        {/* Notification Bell */}
        <button 
          onClick={onOpenNotifications}
          className="relative p-1.5 text-gray-400 hover:text-white hover:bg-[#323436] rounded cursor-pointer transition-colors"
          title="Notifications"
        >
          <Bell size={18} />
          {/* Active notification indicator */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full" />
        </button>

        {/* Settings Gear */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowSettingsMenu(!showSettingsMenu);
              setShowRobuxMenu(false);
            }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#323436] rounded cursor-pointer transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>

          {/* Settings Dropdown Panel */}
          {showSettingsMenu && (
            <div className="absolute right-0 mt-2.5 w-48 bg-[#232527] border border-[#393B3D] rounded-md shadow-xl py-1 z-50 text-gray-200 text-sm">
              <div className="px-3 py-1.5 text-xs text-gray-400 border-b border-[#393B3D] font-semibold">
                Control panel
              </div>
              <button 
                onClick={() => { alert("Mock Settings: Light/Dark theme configuration, account safety."); setShowSettingsMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#323436] transition-colors cursor-pointer text-xs animate-fadeIn"
              >
                Account Settings
              </button>
              <button 
                onClick={() => { alert("Mock Quick Help: Support codes, forums, creator docs."); setShowSettingsMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#323436] transition-colors cursor-pointer text-xs animate-fadeIn"
              >
                Help & Guidelines
              </button>
              
              <div className="border-t border-[#393B3D] my-1"></div>
              
              {currentUser ? (
                <button 
                  onClick={() => { onSignOut?.(); setShowSettingsMenu(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer text-xs font-semibold"
                >
                  Disconnect Profile (Sign Out)
                </button>
              ) : (
                <button 
                  onClick={() => { onSignIn?.(); setShowSettingsMenu(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors cursor-pointer text-xs font-semibold"
                >
                  Sign In with Google
                </button>
              )}

              <div className="border-t border-[#393B3D] my-1"></div>
              <div className="px-3 py-1.5 text-[10px] text-gray-500 font-mono">
                Voxel Portal v1.02
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
