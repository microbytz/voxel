import React, { useState, useEffect, useRef } from 'react';
import { Game } from '../types';
import { 
  Play, 
  ThumbsUp, 
  ThumbsDown, 
  Users, 
  Calendar, 
  Eye, 
  Award, 
  X, 
  Maximize2, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface DiscoverProps {
  games: Game[];
  searchQuery: string;
  onPlayGame: (game: Game) => void;
  activeGame: Game | null;
  setActiveGame: (game: Game | null) => void;
}

export default function Discover({ 
  games, 
  searchQuery, 
  onPlayGame,
  activeGame,
  setActiveGame
}: DiscoverProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'Popularity' | 'Newest' | 'Highest Rated'>('Popularity');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Roblox Categories
  const categories = ['All', 'Action', 'Roleplay', 'Survival', 'Obby', 'Simulation'];

  // Combine parent search and dropdown filter
  const filteredGames = games.filter(game => {
    const matchesCategory = selectedCategory === 'All' || game.category === selectedCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.creator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort games based on the selected sorting option
  const sortedAndFilteredGames = [...filteredGames].sort((a, b) => {
    if (sortBy === 'Popularity') {
      return b.activePlayers - a.activePlayers;
    } else if (sortBy === 'Newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'Highest Rated') {
      return b.upvoteRatio - a.upvoteRatio;
    }
    return 0;
  });

  return (
    <div className="w-full text-gray-200 p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans animate-fadeIn">
      {/* Category Selection Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
          🗺️ Explore Experiences
        </h2>
        <span className="text-xs text-gray-400 font-mono">
          Showing {sortedAndFilteredGames.length} games
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#393B3D]">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#393B3D] text-white border border-white/20'
                  : 'bg-[#232527] hover:bg-[#323436] text-gray-400 hover:text-white border border-[#393B3D]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Custom Sorting Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0 z-20" ref={dropdownRef}>
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider font-mono">Sort:</span>
          <div className="relative">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="bg-[#232527] hover:bg-[#323436] text-white text-xs font-semibold py-1.5 px-3 rounded border border-[#393B3D] hover:border-gray-500 focus:outline-none flex items-center justify-between gap-2 min-w-[140px] cursor-pointer transition-all"
            >
              <span>
                {sortBy === 'Popularity' ? '🔥 Popularity' : sortBy === 'Newest' ? '✨ Newest' : '⭐ Highest Rated'}
              </span>
              <svg 
                className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isSortOpen && (
              <div className="absolute right-0 mt-1 w-[150px] rounded bg-[#232527] border border-[#393B3D] shadow-xl overflow-hidden z-30">
                {[
                  { value: 'Popularity', label: '🔥 Popularity' },
                  { value: 'Newest', label: '✨ Newest' },
                  { value: 'Highest Rated', label: '⭐ Highest Rated' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as any);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold cursor-pointer transition-colors block ${
                      sortBy === option.value
                        ? 'bg-[#393B3D] text-white'
                        : 'text-gray-300 hover:bg-[#323436] hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Results */}
      {sortedAndFilteredGames.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedAndFilteredGames.map((game) => (
            <div
              key={game.id}
              onClick={() => setActiveGame(game)}
              className="group relative bg-[#232527] border border-[#393B3D] hover:border-gray-500 rounded p-3 transition-all cursor-pointer"
            >
              {/* Cover Gradient Graphic */}
              <div className={`aspect-video w-full rounded bg-gradient-to-br ${game.thumbnail} relative flex items-center justify-center p-3 overflow-hidden border border-white/5`}>
                <div className="absolute inset-0 roblox-grid opacity-15" />
                <span className="text-3xl group-hover:scale-110 transition-transform">🎮</span>
                <span className="absolute top-2 left-2 text-[10px] font-bold tracking-wider uppercase text-white bg-black/60 px-2 py-0.5 rounded">
                  {game.category}
                </span>
              </div>

              {/* Title & Stats */}
              <div className="mt-3 space-y-1.5">
                <h3 className="font-bold text-sm text-white group-hover:text-white truncate">
                  {game.title.slice(0, 35)}
                </h3>
                <p className="text-[11px] text-gray-400 truncate">
                  By {game.creator}
                </p>

                <div className="flex justify-between items-center text-[10px] font-semibold text-gray-400 pt-2 border-t border-[#393B3D]">
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={10} className="text-green-500" fill="currentColor" /> {game.upvoteRatio}%
                  </span>
                  <span className="flex items-center gap-1 font-mono text-gray-300">
                    <Users size={10} className="text-gray-400" /> {(game.activePlayers/1000).toFixed(1)}k Playing
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-3 bg-[#232527] border border-[#393B3D] rounded">
          <p className="text-gray-400 font-semibold">No experiences match your query.</p>
          <button 
            onClick={() => { setSelectedCategory('All'); setSortBy('Popularity'); }}
            className="text-xs text-white font-bold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
