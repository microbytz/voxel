import React, { useState } from 'react';
import { Game } from '../types';
import { 
  Play, 
  ThumbsUp, 
  Users, 
  Zap, 
  Search, 
  SlidersHorizontal, 
  Star,
  Cpu, 
  HardDrive, 
  Gauge, 
  BookOpen,
  Trophy,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface ShortGamesProps {
  games: Game[];
  onPlayGame: (game: Game) => void;
}

export default function ShortGames({ games, onPlayGame }: ShortGamesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sizeFilter, setSizeFilter] = useState<'all' | 'under1' | 'under2'>('all');

  // Filter only games configured with isShort: true (or fallbacks)
  const shortGames = games.filter(g => g.isShort);

  const categories = ['All', 'Arcade', 'Action', 'Sandbox', 'Retro'];

  const filteredGames = shortGames.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.creator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || game.category.toLowerCase() === selectedCategory.toLowerCase();
    
    const size = game.sizeMB || 1.0;
    const matchesSize = sizeFilter === 'all' || 
                        (sizeFilter === 'under1' && size <= 1.0) ||
                        (sizeFilter === 'under2' && size <= 2.0);

    return matchesSearch && matchesCategory && matchesSize;
  });

  const avgSize = (shortGames.reduce((acc, g) => acc + (g.sizeMB || 1.0), 0) / (shortGames.length || 1)).toFixed(1);
  const totalVisits = shortGames.reduce((acc, g) => acc + g.visits, 0);

  return (
    <div className="w-full text-gray-200 p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-[#1e1b4b] border border-indigo-500/20 rounded-xl p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider font-mono">
              <Zap size={14} className="fill-indigo-300" /> Instant Loading Technology
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">
              Instant-Play Microgames Hub
            </h1>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Highly optimized arcade engines built with minimal bundle sizes under 2 Megabytes! Play instantly with zero loading times, light system load, and real-time canvas rendering.
            </p>
          </div>
          
          {/* Diagnostic Stats Display */}
          <div className="bg-black/40 border border-white/10 rounded-lg p-4 grid grid-cols-2 gap-4 divide-x divide-white/10 min-w-[240px]">
            <div className="text-center px-2">
              <div className="text-xs text-indigo-300 flex items-center justify-center gap-1 font-semibold">
                <HardDrive size={12} /> Avg Size
              </div>
              <div className="text-xl font-mono font-bold text-white mt-1">~{avgSize} MB</div>
              <div className="text-[10px] text-gray-400 mt-1">Ultralight</div>
            </div>
            <div className="text-center px-2">
              <div className="text-xs text-yellow-500 flex items-center justify-center gap-1 font-semibold">
                <Gauge size={12} /> Boot Speed
              </div>
              <div className="text-xl font-mono font-bold text-white mt-1">&lt; 150ms</div>
              <div className="text-[10px] text-gray-400 mt-1">Instant Direct</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Optimization Specs Info Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1e2022] border border-[#2d3032] rounded-lg p-4 flex gap-3 items-start">
          <div className="bg-indigo-500/10 p-2.5 rounded text-indigo-400">
            <Cpu size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider">Zero Asset Load Delay</h3>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Runs directly via custom lightweight programmatic canvases. Responsive gameplay loops built natively without heavy texture spreadsheets.</p>
          </div>
        </div>

        <div className="bg-[#1e2022] border border-[#2d3032] rounded-lg p-4 flex gap-3 items-start">
          <div className="bg-emerald-500/10 p-2.5 rounded text-emerald-400">
            <Trophy size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider">Automated Highscore Registry</h3>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Leverages fully sandboxed local-storage registers to synchronize your high scores instantly. Offline survival is saved perpetually.</p>
          </div>
        </div>

        <div className="bg-[#1e2022] border border-[#2d3032] rounded-lg p-4 flex gap-3 items-start">
          <div className="bg-orange-500/10 p-2.5 rounded text-orange-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider">Perfect Mobile Rendering</h3>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Adaptive viewport scaling guarantees responsive touchscreen button matrices and dynamic canvas layouts on all devices.</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-[#232527] border border-[#393B3D] p-4 rounded-lg space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search microgames by keywords or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18191a] border border-[#393B3D] hover:border-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none transition-all"
            />
          </div>

          {/* Size Filter Dropdowns */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
              <SlidersHorizontal size={12} /> Size:
            </span>
            <div className="flex bg-[#18191a] border border-[#393B3D] rounded p-0.5">
              <button
                onClick={() => setSizeFilter('all')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  sizeFilter === 'all' ? 'bg-[#393B3D] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSizeFilter('under1')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  sizeFilter === 'under1' ? 'bg-[#393B3D] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                &lt; 1 MB
              </button>
              <button
                onClick={() => setSizeFilter('under2')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  sizeFilter === 'under2' ? 'bg-[#393B3D] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                &lt; 2 MB
              </button>
            </div>
          </div>

        </div>

        {/* Categories Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#18191a] hover:bg-[#2c2d2e] text-gray-400 hover:text-white border border-[#393B3D]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Games Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game, idx) => {
            const size = game.sizeMB || 1.0;
            const rating = game.rating || 4.5;
            const count = game.ratingCount || 75;

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                onClick={() => onPlayGame(game)}
                className="group relative bg-[#232527] border border-[#393B3D] hover:border-indigo-500 rounded-lg overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-md hover:shadow-indigo-500/10 cursor-pointer"
                id={`microgame-card-${game.id}`}
              >
                {/* Image / Header Gradient */}
                <div className={`h-36 bg-gradient-to-br ${game.thumbnail} relative flex items-center justify-center p-4 border-b border-white/5`}>
                  <div className="absolute inset-0 roblox-grid opacity-15" />
                  
                  {/* Floating badging */}
                  <div className="absolute top-2 left-2 flex gap-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/60 px-2 py-0.5 rounded-sm">
                      {game.category}
                    </span>
                    <span className="text-[10px] font-semibold text-white bg-indigo-600/90 border border-indigo-400/20 px-2 py-0.5 rounded-sm flex items-center gap-0.5">
                      <Zap size={9} className="fill-white animate-pulse" /> INSTANT
                    </span>
                  </div>

                  <span className="text-4xl transform group-hover:scale-120 group-hover:rotate-6 transition-all duration-300 drop-shadow-md">🎮</span>
                  
                  {/* Disk size badge bottom-right */}
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-mono font-bold text-gray-200 bg-black/75 border border-white/10 px-2 py-0.5 rounded">
                    <HardDrive size={10} /> {size} MB
                  </span>
                </div>

                {/* Info and Action Area */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-white truncate group-hover:text-indigo-300 transition-colors">
                      {game.title.slice(0, 35)}
                    </h3>
                    <p className="text-xs text-gray-400">
                      by {game.creator}
                    </p>
                    <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed mt-2 pt-2 border-t border-[#393B3D]">
                      {game.description.slice(0, 160)}
                    </p>
                  </div>

                  {/* Quality metrics */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs text-gray-400 bg-black/20 p-2 rounded border border-[#2d3032]">
                      <div className="flex items-center gap-1 font-semibold text-amber-400">
                        <Star size={12} className="fill-amber-400" />
                        <span>{rating.toFixed(1)}</span>
                        <span className="text-gray-500 font-normal">({count})</span>
                      </div>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Users size={11} className="text-indigo-400" />
                        <span className="font-mono text-gray-200">{(game.activePlayers / 1000).toFixed(1)}k live</span>
                      </span>
                      <span className="text-gray-500">|</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <ThumbsUp size={11} className="text-green-500" />
                        <span className="font-mono text-gray-200">{game.upvoteRatio}%</span>
                      </span>
                    </div>

                    {/* Launch play action */}
                    <button
                      onClick={() => onPlayGame(game)}
                      className="w-full bg-[#18191a] border border-indigo-500/30 hover:bg-indigo-600 hover:border-indigo-500 text-white font-bold py-2 rounded text-sm flex items-center justify-center gap-2 group/btn cursor-pointer transition-all duration-200 shadow-sm"
                      id={`play-btn-${game.id}`}
                    >
                      <Play size={14} className="fill-white group-hover/btn:translate-x-0.5 transition-transform" />
                      <span>Instant Launch</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4 bg-[#232527] border border-[#393B3D] rounded-lg">
          <p className="text-gray-400 font-semibold text-sm">No microgames match your current criteria.</p>
          <button 
            onClick={() => { setSelectedCategory('All'); setSizeFilter('all'); setSearchQuery(''); }}
            className="text-xs bg-[#393B3D] text-white font-bold hover:bg-indigo-600 px-4 py-2 rounded cursor-pointer transition-colors"
          >
            Clear Search Filters
          </button>
        </div>
      )}

      {/* 5. Performance Insights Banner */}
      <div className="bg-[#18191a] border border-[#393B3D] rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-3 items-center">
          <div className="bg-indigo-600/10 p-2.5 rounded-full text-indigo-400">
            <BookOpen size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Browser Local Highscore Persistence Enabled</h4>
            <p className="text-xs text-gray-400 mt-1">Highscores achieved in Flappy Balloon, Pixel Dodge, or retro microgames sync securely to local records.</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 text-xs px-3 py-1.5 rounded text-gray-300 font-semibold font-mono">
          STORAGE STATUS: persistent ✔
        </div>
      </div>
    </div>
  );
}
