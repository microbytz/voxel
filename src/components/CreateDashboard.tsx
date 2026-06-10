import React, { useState, useEffect } from 'react';
import { UserExperience, MonetizationItem } from '../types';
import { 
  Plus, 
  Hammer, 
  Eye, 
  Globe, 
  Lock, 
  Settings, 
  Play, 
  Layout, 
  Folder, 
  Flame, 
  Code,
  Laptop,
  CheckCircle,
  X,
  FileText,
  MousePointer,
  RotateCcw,
  Sparkles,
  Coins,
  DollarSign,
  Award,
  Trash2,
  TrendingUp,
  ArrowUpRight,
  HelpCircle,
  Rocket
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface CreateDashboardProps {
  experiences: UserExperience[];
  setExperiences: (exps: UserExperience[] | ((prev: UserExperience[]) => UserExperience[])) => void;
  onLaunchMockStudio: () => void;
  onLaunchMock2DStudio: () => void;
  devRobux: number;
  setDevRobux: React.Dispatch<React.SetStateAction<number>>;
  devexUSD: number;
  setDevexUSD: React.Dispatch<React.SetStateAction<number>>;
  creatorPoints: number;
  setCreatorPoints: React.Dispatch<React.SetStateAction<number>>;
}

// Preset Emojis for Gamepasses / Products
const MONETIZATION_EMOJIS = ["🚀", "✨", "🤖", "⚡", "🪙", "👑", "🛡️", "🎩", "🧬", "🔮", "🍕", "💖"];

export default function CreateDashboard({
  experiences,
  setExperiences,
  onLaunchMockStudio,
  onLaunchMock2DStudio,
  devRobux,
  setDevRobux,
  devexUSD,
  setDevexUSD,
  creatorPoints,
  setCreatorPoints
}: CreateDashboardProps) {
  // Navigation tabs inside Developer Portal
  const [activeTab, setActiveTab] = useState<'creations' | 'monetization' | 'devex' | 'analytics'>('creations');
  const [analyticsSelectedExpId, setAnalyticsSelectedExpId] = useState<string>('all');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    // Simulate initial cloud data/experience loading delay
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Experience creation states
  const [showNewExpModal, setShowNewExpModal] = useState(false);
  const [modalMode, setModalMode] = useState<'pathway' | 'create3d' | 'create2d'>('pathway');
  const [expName, setExpName] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expTemplate, setExpTemplate] = useState<string>("Baseplate");
  const [expTemplate2D, setExpTemplate2D] = useState<string>("Blank Stage");

  // Game Monetization configuration states
  const [selectedExpId, setSelectedExpId] = useState<string>(experiences[0]?.id || "");
  const [monetizationType, setMonetizationType] = useState<'Gamepass' | 'DevProduct'>('Gamepass');
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState<number>(100);
  const [itemEmoji, setItemEmoji] = useState("🚀");
  const [itemDesc, setItemDesc] = useState("");

  const selectedExp = experiences.find(e => e.id === selectedExpId);

  // DevEx Cashout feedback states
  const [cashoutAmount, setCashoutAmount] = useState<number>(10000); // Default 10k Dev Robux
  const [cashoutNotice, setCashoutNotice] = useState<string | null>(null);

  // Deploy feedback states
  const [deployToast, setDeployToast] = useState<{ show: boolean; title: string } | null>(null);

  const handleQuickDeploy = (exp: UserExperience) => {
    // Set Status to Public
    setExperiences(prev => prev.map(e => e.id === exp.id ? { ...e, status: 'Public' } : e));
    
    // Play sweet synth chords
    triggerAudioTick(523.25, 0.1, 'sine'); // C5
    setTimeout(() => triggerAudioTick(659.25, 0.1, 'sine'), 80); // E5
    setTimeout(() => triggerAudioTick(783.99, 0.25, 'sine'), 160); // G5

    // Show toast notification
    setDeployToast({
      show: true,
      title: `"${exp.title}" has been successfully deployed to Public status! Passive visitors will now begin to gather and trigger randomized store sales.`
    });

    // Auto-hide toast after 5s
    setTimeout(() => {
      setDeployToast(null);
    }, 5000);
  };

  // Open creation modal
  const openNewExperienceModal = () => {
    setModalMode('pathway');
    setExpName("");
    setExpDesc("");
    setShowNewExpModal(true);
  };

  // Sound generator
  const triggerAudioTick = (freq: number, dur: number, type: OscillatorType = 'sine') => {
    try {
      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      gain.gain.setValueAtTime(0.05, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur);
    } catch (e) {}
  };
 
  // Map monthly visitors and revenue trends dynamically for the user's active experiences
  const getMonthlyDataForExperiences = (selectedId: string | 'all', experiencesList: UserExperience[]) => {
    const months = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const ratios = [0.12, 0.18, 0.10, 0.15, 0.25, 0.20]; // distributed ratios that sum to 1.0 (100%)

    const exps = selectedId === 'all' 
      ? experiencesList 
      : experiencesList.filter(e => e.id === selectedId);

    return months.map((month, idx) => {
      let visits = 0;
      let revenue = 0;
      let gamepassesRevenue = 0;
      let devProductsRevenue = 0;

      exps.forEach(exp => {
        const gpRev = (exp.gamepasses || []).reduce((sum, gp) => sum + gp.revenue, 0);
        const dpRev = (exp.devProducts || []).reduce((sum, dp) => sum + dp.revenue, 0);
        const totalRev = gpRev + dpRev;

        // Use a deterministic shift based on the title length to add natural variation curves to every game
        const hash = exp.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 1;
        const shift = ((hash + idx) % 5) - 2; // -2 to +2 variation bounds
        const variationRatio = Math.max(0.02, ratios[idx] + shift * 0.015);

        visits += Math.round(exp.visits * variationRatio);
        revenue += Math.round(totalRev * variationRatio);
        gamepassesRevenue += Math.round(gpRev * variationRatio);
        devProductsRevenue += Math.round(dpRev * variationRatio);
      });

      return {
        name: month,
        Visits: visits,
        Revenue: revenue,
        Gamepasses: gamepassesRevenue,
        DevProducts: devProductsRevenue
      };
    });
  };

  const getBarChartData = (experiencesList: UserExperience[]) => {
    return experiencesList.map(exp => {
      const gpRev = (exp.gamepasses || []).reduce((sum, gp) => sum + gp.revenue, 0);
      const dpRev = (exp.devProducts || []).reduce((sum, dp) => sum + dp.revenue, 0);
      return {
        name: exp.title.length > 14 ? exp.title.substring(0, 14) + '...' : exp.title,
        Visits: exp.visits,
        Revenue: gpRev + dpRev,
        Gamepasses: gpRev,
        DevProducts: dpRev
      };
    });
  };

  // Beautiful Dark Mode Glassmorphic Tooltip for Recharts components
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div id="recharts-custom-tooltip" className="bg-[#111214]/95 backdrop-blur-md border border-[#393B3D] p-3 rounded-lg shadow-2xl text-[11px] font-mono leading-relaxed text-zinc-300">
          <p className="text-white font-extrabold pb-1 border-b border-zinc-800 mb-1.5 font-sans tracking-wide uppercase text-[10px] text-zinc-400">
            {label} Breakdown
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2.5 justify-between">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-zinc-400 font-sans mr-2 shrink-0">{entry.name}:</span>
              <span className="text-white font-black font-mono ml-auto">
                {entry.name.includes("Revenue") || entry.name.toLowerCase().includes("gamepass") || entry.name.toLowerCase().includes("devproduct")
                   ? `${entry.value.toLocaleString()} R$` 
                   : entry.value.toLocaleString()
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Submit 3D
  const createExperience3D = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName.trim()) return;

    const newExp: UserExperience = {
      id: `e${Date.now()}`,
      title: expName,
      description: expDesc || `A customized 3D block universe built from ${expTemplate} preset.`,
      status: 'Private',
      lastUpdated: 'Just now',
      visits: 0,
      createdDate: new Date().toISOString().split('T')[0],
      is2D: false,
      gamepasses: [],
      devProducts: []
    };

    setExperiences(prev => [newExp, ...prev]);
    setSelectedExpId(newExp.id);
    setShowNewExpModal(false);
    triggerAudioTick(580, 0.12, 'sine');
    
    setTimeout(() => {
      onLaunchMockStudio();
    }, 300);
  };

  // Submit 2D
  const createExperience2D = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName.trim()) return;

    const newExp: UserExperience = {
      id: `e${Date.now()}`,
      title: expName,
      description: expDesc || `A Scratch-style 2D experience running on standard ${expTemplate2D} stage.`,
      status: 'Private',
      lastUpdated: 'Just now',
      visits: 0,
      createdDate: new Date().toISOString().split('T')[0],
      is2D: true,
      gamepasses: [],
      devProducts: []
    };

    setExperiences(prev => [newExp, ...prev]);
    setSelectedExpId(newExp.id);
    setShowNewExpModal(false);
    triggerAudioTick(620, 0.12, 'triangle');
    
    setTimeout(() => {
      onLaunchMock2DStudio();
    }, 300);
  };

  // Attach gamepass/developer product logic
  const handleAddMonetizationItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpId) {
      alert("Please select or build an experience first!");
      return;
    }
    if (!itemName.trim()) return;
    if (itemPrice < 10) {
      alert("Minimum price for developer items is 10 Robux.");
      return;
    }

    const newItem: MonetizationItem = {
      id: `${monetizationType === 'Gamepass' ? 'gp' : 'dp'}_${Date.now()}`,
      name: itemName,
      description: itemDesc || "Simulated utility in-game item.",
      price: itemPrice,
      type: monetizationType,
      sales: 0,
      revenue: 0,
      emoji: itemEmoji
    };

    setExperiences(prev => prev.map(exp => {
      if (exp.id === selectedExpId) {
        if (monetizationType === 'Gamepass') {
          const currentList = exp.gamepasses || [];
          return { ...exp, gamepasses: [...currentList, newItem] };
        } else {
          const currentList = exp.devProducts || [];
          return { ...exp, devProducts: [...currentList, newItem] };
        }
      }
      return exp;
    }));

    setItemName("");
    setItemDesc("");
    setItemPrice(100);
    triggerAudioTick(800, 0.15, 'sine');
    alert(`Successfully added ${monetizationType} "${newItem.name}" to "${selectedExp?.title}"! It will be listed in the game shop instantly.`);
  };

  const handleDeleteMonetizationItem = (itemId: string, type: 'Gamepass' | 'DevProduct') => {
    setExperiences(prev => prev.map(exp => {
      if (exp.id === selectedExpId) {
        if (type === 'Gamepass') {
          return { ...exp, gamepasses: (exp.gamepasses || []).filter(item => item.id !== itemId) };
        } else {
          return { ...exp, devProducts: (exp.devProducts || []).filter(item => item.id !== itemId) };
        }
      }
      return exp;
    }));
    triggerAudioTick(300, 0.1, 'sawtooth');
  };

  // Payout / DevEx Logic
  const handleProcessCashout = (amount: number) => {
    if (devRobux < amount) {
      alert("Insufficient Developer Robux balance to cash out this sum! Publish your games, add gamepasses, and collect simulated revenue.");
      return;
    }

    const usdRedeemed = (amount / 10000) * 35.00; // Rate: 10,000 Dev Robux = $35.00 USD
    const pointsRewarded = Math.floor(amount / 500); // 1 Creator Point per 500 Dev R$ cashed out

    // Perform state changes
    setDevRobux(prev => {
      const next = prev - amount;
      localStorage.setItem('devRobux', next.toString());
      return next;
    });

    setDevexUSD(prev => {
      const next = prev + usdRedeemed;
      localStorage.setItem('devexUSD', next.toString());
      return next;
    });

    setCreatorPoints(prev => {
      const next = prev + pointsRewarded;
      localStorage.setItem('creatorPoints', next.toString());
      return next;
    });

    // Sound register
    triggerAudioTick(523.25, 0.1, 'sine'); // C5
    setTimeout(() => triggerAudioTick(659.25, 0.1, 'sine'), 100); // E5
    setTimeout(() => triggerAudioTick(783.99, 0.25, 'sine'), 200); // G5

    setCashoutNotice(`🎉 Successfully completed DevEx: Exchanged ${amount.toLocaleString()} Developer Robux for $${usdRedeemed.toFixed(2)} USD! Got +${pointsRewarded} Creator Points!`);
    setTimeout(() => setCashoutNotice(null), 8000);
  };

  // Determine Rank Name and progress
  const getRankName = (points: number) => {
    if (points < 100) return { name: "Novice Builder 🛠️", color: "text-amber-500", bg: "bg-amber-550/10", border: "border-amber-500/20", limit: 100 };
    if (points < 300) return { name: "Silver Scripter 📜", color: "text-gray-300", bg: "bg-gray-500/10", border: "border-gray-500/20", limit: 300 };
    if (points < 700) return { name: "Gold Game-Director 🎬", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", limit: 700 };
    if (points < 1500) return { name: "Master Architect 🏰", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", limit: 1500 };
    return { name: "Voxel Creator Legend 👑", color: "text-cyan-400 font-extrabold animate-pulse", bg: "bg-cyan-500/10", border: "border-cyan-500/30", limit: 9999 };
  };

  const currentRank = getRankName(creatorPoints);

  // Active User Name
  const activeName = "GamerProX";

  // Build the live sorted Leaderboard
  const leaderboardData = [
    { name: "David.Baszucki", username: "@DavidBaszucki", avatar: "bg-red-500", points: 15200, badge: "Developer King 👑" },
    { name: "Wolfpaq Studios", username: "@Wolfpaq", avatar: "bg-emerald-500", points: 8400, badge: "Brookhaven Architect" },
    { name: "DreamCraft", username: "@AdoptMeDev", avatar: "bg-pink-500", points: 7500, badge: "Master of Pets" },
    { name: "Stickmasterluke", username: "@Stickmaster", avatar: "bg-orange-500", points: 4900, badge: "Disaster Expert" },
    { name: "Shedletsky", username: "@Shedletsky", avatar: "bg-yellow-500", points: 3100, badge: "Chicken Baron" },
    { name: activeName, username: "@GamerProX_Studio", avatar: "bg-cyan-500 animate-pulse border-2 border-white", points: creatorPoints, badge: currentRank.name, isUser: true },
    { name: "Loleris", username: "@Loleris", avatar: "bg-indigo-500", points: 60, badge: "Mad Scriptor" }
  ].sort((a, b) => b.points - a.points);

  return (
    <div className="w-full text-gray-200 p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans animate-fadeIn">
      
      {/* Deploy success toast notification */}
      {deployToast && (
        <div className="fixed top-6 right-6 z-100 max-w-sm bg-[#1b1c1e] border-2 border-emerald-500 rounded-xl p-4.5 shadow-2xl flex items-start gap-3.5 text-xs leading-relaxed text-zinc-200 animate-slideDown">
          <span className="text-xl shrink-0 animate-bounce">🚀</span>
          <div className="flex-1 space-y-0.5">
            <span className="font-black text-emerald-450 block uppercase tracking-wider text-[10px]">Deploy Successful!</span>
            <p className="text-[11px] text-zinc-300 leading-normal">{deployToast.title}</p>
          </div>
          <button 
            onClick={() => setDeployToast(null)} 
            className="text-gray-500 hover:text-white shrink-0 p-1 hover:bg-zinc-805 rounded transition cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Dynamic DevEx Banner info */}
      {cashoutNotice && (
        <div className="bg-emerald-950/45 border-2 border-emerald-500 text-emerald-300 px-4 py-3.5 rounded-lg flex items-start gap-3 mt-1 text-xs font-semibold shadow-lg animate-slideDown">
          <span className="text-xl leading-none">💰</span>
          <p className="flex-1 leading-relaxed">{cashoutNotice}</p>
          <button onClick={() => setCashoutNotice(null)} className="text-emerald-400 hover:text-white shrink-0">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Tab Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-3 border-b border-[#393B3D] gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
              🛠️ Creator Hub Dashboard
            </h2>
            <div className="bg-[#111214] border border-[#393B3D] px-2.5 py-1 rounded flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
              <Coins size={11} className="text-amber-500 animate-pulse" />
              <span>Simulated Earnings:</span>
              <span className="text-emerald-400 font-mono font-black">{devRobux.toLocaleString()} Dev R$</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Build games, configure passes, trigger simulated revenue loops, and process virtual cash-outs.
          </p>
        </div>

        {/* Triple Tab sub-navigation toggle */}
        <div className="flex items-center bg-[#111214] border border-[#393B3D] p-1 rounded-lg gap-1 self-start lg:self-auto shrink-0 select-none">
          <button
            onClick={() => setActiveTab('creations')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'creations' 
                ? 'bg-[#232527] text-white border border-[#393B3D] shadow-inner' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Laptop size={13} /> My Experiences
          </button>
          <button
            onClick={() => {
              setActiveTab('monetization');
              // Select first game if not designated
              if (!selectedExpId && experiences.length > 0) {
                setSelectedExpId(experiences[0].id);
              }
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'monetization' 
                ? 'bg-[#232527] text-white border border-[#393B3D] shadow-inner' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Coins size={13} className="text-amber-500" /> Game Monetization
          </button>
          <button
            onClick={() => setActiveTab('devex')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'devex' 
                ? 'bg-[#232527] text-white border border-[#393B3D] shadow-inner' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Award size={13} className="text-cyan-405" /> DevEx & Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-[#232527] text-white border border-[#393B3D] shadow-inner' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp size={13} className="text-emerald-400" /> Analytics Dashboard
          </button>
        </div>
      </div>

      {/* TAB 1: CREATIONS GRID VIEW */}
      {activeTab === 'creations' && (
        isInitializing ? (
          <>
            {/* Quick Stats banner Loading Skeleton */}
            <div className="bg-[#232527] border border-cyan-500/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-pulse">
              <div className="space-y-2 flex-1 w-full sm:w-auto">
                <div className="h-4 bg-cyan-500/25 rounded w-1/4 min-w-[140px]" />
                <div className="h-3 bg-zinc-700/60 rounded w-2/3" />
              </div>
              <div className="h-8.5 bg-zinc-700 rounded w-full sm:w-36 shrink-0" />
            </div>

            {/* Experiences lists loading skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="bg-[#232527] border border-[#393B3D]/30 rounded p-5 flex flex-col justify-between gap-5 animate-pulse"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="w-9 h-9 rounded bg-[#111214] border border-zinc-800" />
                      <div className="w-16 h-5 bg-zinc-800/60 rounded" />
                    </div>
                    <div className="space-y-2 mt-1">
                      <div className="h-4 bg-zinc-800/80 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-zinc-800/50 rounded w-full" />
                      <div className="h-3 bg-zinc-800/35 rounded w-5/6" />
                    </div>
                  </div>

                  <div className="border-t border-[#393B3D]/30 pt-4 space-y-3.5 mt-2">
                    <div className="flex justify-between">
                      <div className="h-3 bg-zinc-800 rounded w-1/3" />
                      <div className="h-3 bg-zinc-800 rounded w-1/4" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-zinc-800/50 rounded flex-1" />
                      <div className="w-8 h-8 bg-zinc-800/50 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Creation developer suite skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 animate-pulse">
              <div className="bg-[#232527] border border-[#393B3D]/40 p-5 rounded-lg flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-indigo-500/20 rounded animate-pulse" />
                    <div className="h-4 bg-zinc-700 rounded w-1/3" />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="h-3 bg-zinc-700/80 rounded w-full" />
                    <div className="h-3 bg-zinc-700/80 rounded w-5/6" />
                  </div>
                </div>
                <div className="h-8 bg-zinc-700 rounded w-32" />
              </div>

              <div className="bg-[#232527] border border-cyan-500/10 p-5 rounded-lg flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-cyan-500/20 rounded animate-pulse" />
                    <div className="h-4 bg-zinc-700 rounded w-1/3" />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="h-3 bg-zinc-700/80 rounded w-full" />
                    <div className="h-3 bg-zinc-700/80 rounded w-4/5" />
                  </div>
                </div>
                <div className="h-8 bg-zinc-700 rounded w-32" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Quick Stats banner */}
            <div className="bg-[#232527] border border-cyan-500/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-0.5 text-xs">
                <span className="font-extrabold uppercase text-cyan-400 tracking-wider text-[10px]">Developer Traffic Monitor</span>
                <p className="text-gray-400">Your published experiences collect constant visitors which trigger randomized item store sales!</p>
              </div>
              <button
                onClick={openNewExperienceModal}
                className="px-4 py-2 rounded bg-white hover:bg-gray-200 text-black font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5 transform active:scale-95 transition-all w-full sm:w-auto text-center justify-center"
              >
                <Plus size={15} /> Create New Experience
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {experiences.map((exp) => {
                const passCount = (exp.gamepasses || []).length;
                const prodCount = (exp.devProducts || []).length;
                const hasMonetization = passCount + prodCount > 0;

                return (
                  <div
                    key={exp.id}
                    className={`bg-[#232527] border rounded p-5 flex flex-col justify-between hover:border-gray-500 transition-colors ${exp.is2D ? 'border-cyan-500/20' : 'border-[#393B3D]'}`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`p-2 rounded bg-[#111214] border flex items-center justify-center ${exp.is2D ? 'border-cyan-500/30 text-cyan-400' : 'border-[#393B3D] text-white'}`}>
                          {exp.is2D ? <Code size={18} /> : <Folder size={18} />}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            exp.is2D 
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {exp.is2D ? '2D Block' : '3D Mesh'}
                          </span>

                          {/* Public vs Private Status Indicator tag */}
                          <button
                            onClick={() => {
                              const nextStatus = exp.status === 'Public' ? 'Private' : 'Public';
                              setExperiences(prev => prev.map(e => e.id === exp.id ? { ...e, status: nextStatus } : e));
                            }}
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide cursor-pointer select-none transition-all ${
                              exp.status === 'Public'
                                ? 'bg-green-600/25 text-green-400 border border-green-500/30'
                                : 'bg-[#111214] text-gray-400 border border-[#393B3D]'
                            }`}
                            title="Toggle Status (Game must be Public to generate passive Dev Robux)"
                          >
                            {exp.status === 'Public' ? (
                              <>
                                <Globe size={9} /> Public
                              </>
                            ) : (
                              <>
                                <Lock size={9} /> Private
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-white truncate mt-1">
                          {exp.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1 h-8 line-clamp-2 leading-relaxed">
                          {exp.description}
                        </p>
                      </div>

                      {/* Displays total items attached */}
                      <div className="pt-1.5">
                        {hasMonetization ? (
                          <div className="flex items-center gap-2 text-[9px] font-mono text-emerald-400 font-bold bg-[#111214] px-2 py-1 rounded inline-flex border border-emerald-500/20">
                            <Coins size={10} />
                            <span>Stores Configured: {passCount} Gamepasses, {prodCount} DevProducts</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[9px] font-mono text-amber-500 font-bold bg-[#111214] px-2 py-1 rounded inline-flex border border-amber-500/10">
                            <span>⚠️ No active monetization assets</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Metrics stats */}
                    <div className="border-t border-[#393B3D] pt-3.5 mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-500">
                        <div>
                          Visits: <span className="text-gray-300 font-bold">{exp.visits.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          Updated: <span className="text-gray-300">{exp.lastUpdated}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={exp.is2D ? onLaunchMock2DStudio : onLaunchMockStudio}
                          className={`flex-1 px-3 py-1.5 bg-[#111214] hover:bg-[#323436] text-[11px] font-semibold rounded text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${exp.is2D ? 'border-cyan-500/30' : 'border-[#393B3D]'}`}
                        >
                          <Hammer size={12} className={exp.is2D ? "text-cyan-400" : "text-white"} /> Boot Studio
                        </button>

                        <button
                          onClick={() => {
                            setSelectedExpId(exp.id);
                            setActiveTab('monetization');
                          }}
                          className="p-1 px-2.5 bg-[#2a2d30] border border-[#393B3D] hover:bg-[#35393d] rounded text-white text-xs cursor-pointer flex items-center justify-center group"
                          title="Configure Store Passes"
                        >
                          <Settings size={13} className="text-gray-400 group-hover:text-white transition" />
                        </button>
                      </div>

                      {exp.status === 'Private' ? (
                        <button
                          onClick={() => handleQuickDeploy(exp)}
                          className="w-full py-1.5 px-3 bg-[#111214] hover:bg-[#202224] border border-emerald-505/30 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Rocket size={12} className="text-emerald-400 animate-pulse" /> Rocket Deploy Public
                        </button>
                      ) : (
                        <div className="w-full py-1.5 px-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-[10px] font-black rounded flex items-center justify-center gap-1 cursor-default font-mono">
                          <span>🟢 ACTIVE & PUBLIC</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Creation studio triggers guides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="bg-[#232527] border border-[#393B3D] p-5 rounded-lg flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5 font-display">
                    <Code size={16} className="text-indigo-400" /> 3D Spatial Vector Compiler
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Design multi-plane obstacle courses, set materials to neon glow, apply gravity simulation parameters, and check vertex bounds. Compiled with Three.js web engine bootloader.
                  </p>
                </div>
                <button
                  onClick={onLaunchMockStudio}
                  className="px-4 py-2 bg-[#111214] hover:bg-[#323436] text-white border border-[#393B3D] text-xs font-semibold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start"
                >
                  <Laptop size={14} /> Open Empty 3D Baseplate
                </button>
              </div>

              <div className="bg-[#232527] border border-cyan-500/20 p-5 rounded-lg flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5 font-display">
                    <Sparkles size={16} className="text-cyan-400 animate-pulse" /> 2D Scratch Arcade Studio
                  </h4>
                  <p className="text-xs text-gray-455 leading-relaxed">
                    Snap block-assemblies into chains to program character costumes, motion coordinates, and AABB coordinate boundaries without text code syntax. Fast compilation with 2D HTML5 canvas.
                  </p>
                </div>
                <button
                  onClick={onLaunchMock2DStudio}
                  className="px-4 py-2 bg-[#111214] hover:bg-[#323436] text-cyan-400 border border-cyan-500/30 text-xs font-semibold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start hover:border-cyan-400"
                >
                  <Code size={14} /> Launch 2D Sandbox
                </button>
              </div>
            </div>
          </>
        )
      )}

      {/* TAB 2: MONETIZATION STORES PANEL */}
      {activeTab === 'monetization' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Block - Configure Target Selector and Creator Form */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Target game selection dropdown */}
            <div className="bg-[#232527] border border-[#393B3D] rounded-xl p-4.5 space-y-2">
              <label className="block text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Select experience to monetize</label>
              <select
                value={selectedExpId}
                onChange={(e) => setSelectedExpId(e.target.value)}
                className="w-full bg-[#111214] text-white text-xs rounded border border-[#393B3D] p-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer text-gray-200"
              >
                {experiences.map(exp => (
                  <option key={exp.id} value={exp.id}>
                    {exp.title} ({exp.status === 'Public' ? '🟢 Public' : '🔒 Private'})
                  </option>
                ))}
              </select>
              {selectedExp && selectedExp.status === 'Private' && (
                <p className="text-[10px] text-amber-500 font-medium leading-relaxed mt-1 flex items-center gap-1">
                  ⚠️ Note: Private games do not collect simulated public sales. Go to creations tab and toggle "Public" to earn developer Robux!
                </p>
              )}
            </div>

            {/* 2. Item Creation Form */}
            <div className="bg-[#232527] border border-[#393B3D] rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-black uppercase text-cyan-400 tracking-widest pb-2 border-b border-[#393B3D]">
                ✨ Create Store Merchandise
              </h3>

              <form onSubmit={handleAddMonetizationItem} className="space-y-3">
                {/* Type Selection */}
                <div className="space-y-1">
                  <span className="block text-[9px] uppercase font-bold text-gray-450 tracking-wider">Asset Product Type</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMonetizationType('Gamepass')}
                      className={`py-1.5 rounded text-xs font-bold transition border ${
                        monetizationType === 'Gamepass' 
                          ? 'bg-amber-550/15 border-amber-500 text-amber-400' 
                          : 'bg-[#111214] border-[#393B3D] text-gray-400 hover:text-white'
                      }`}
                    >
                      🎟️ Gamepass (1x Buy)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonetizationType('DevProduct')}
                      className={`py-1.5 rounded text-xs font-bold transition border ${
                        monetizationType === 'DevProduct' 
                          ? 'bg-indigo-550/15 border-indigo-505 text-indigo-400' 
                          : 'bg-[#111214] border-[#393B3D] text-gray-400 hover:text-white'
                      }`}
                    >
                      📦 Dev Product (Repeat)
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1 leading-relaxed">
                    {monetizationType === 'Gamepass' 
                      ? 'Gamepasses grant permanent items, badges, or special gravity parameters inside the game simulation.' 
                      : 'Developer products can be bought multiple times (e.g. instantly spawning coin tokens, health respawns).'}
                  </p>
                </div>

                {/* Item Name */}
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase font-bold text-gray-450 tracking-wider">Merchandise Title</label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    maxLength={32}
                    placeholder="e.g. Magic Gravity Wand, Admin Access"
                    className="w-full bg-[#111214] border border-[#393B3D] rounded text-white text-xs p-2 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                {/* Grid inputs for Price & Emoji */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Price */}
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-gray-450 tracking-wider">Price (Robux R$)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={10000}
                      value={itemPrice}
                      onChange={(e) => setItemPrice(parseInt(e.target.value, 10) || 10)}
                      className="w-full bg-[#111214] border border-[#393B3D] rounded text-white font-mono font-bold text-xs p-2 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Chosen Emoji Selector */}
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-gray-450 tracking-wider">Merch Icon Emoji</label>
                    <select
                      value={itemEmoji}
                      onChange={(e) => setItemEmoji(e.target.value)}
                      className="w-full bg-[#111214] border border-[#393B3D] rounded text-white text-xs p-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      {MONETIZATION_EMOJIS.map(em => (
                        <option key={em} value={em}>{em}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Emoji visual picker strip */}
                <div className="flex gap-1.5 flex-wrap pt-0.5">
                  {MONETIZATION_EMOJIS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setItemEmoji(em)}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs transition border select-none ${
                        itemEmoji === em ? 'bg-cyan-550/15 border-cyan-500' : 'bg-[#111214] border-[#393B3D] hover:bg-[#202224]'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase font-bold text-gray-455 tracking-wider">Description Benefits</label>
                  <input
                    type="text"
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    maxLength={100}
                    placeholder="Short summary of what it unlocks in game..."
                    className="w-full bg-[#111214] border border-[#393B3D] rounded text-white text-xs p-2 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!selectedExpId}
                  className="w-full py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:from-zinc-800 disabled:to-zinc-800 text-zinc-950 font-extrabold rounded text-xs tracking-wider transition-all cursor-pointer shadow-md transform active:scale-[0.98] mt-2"
                >
                  Confirm Asset Allocation
                </button>
              </form>
            </div>
          </div>

          {/* Right Block - active catalog list display for this game */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#232527] border border-[#393B3D] rounded-xl p-5 md:p-6 space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-[#393B3D]">
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-gray-200 tracking-wider">
                    🛒 Store Asset Manifest: <span className="text-white normal-case">{selectedExp?.title || "Choose Experience"}</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Below is the published in-simulation catalog of game items available to mock buyers.</p>
                </div>
                <span className="text-[10px] font-semibold bg-[#111214] px-2 py-1 rounded text-cyan-405 border border-[#393B3D]/30">
                  Total Items: {((selectedExp?.gamepasses || []).length + (selectedExp?.devProducts || []).length)}
                </span>
              </div>

              {selectedExp ? (
                <div className="space-y-5">
                  {/* Gamepass Subsection */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">🎟️ Gamepasses (Permanent upgrades)</span>
                    {(selectedExp.gamepasses || []).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedExp.gamepasses?.map(gp => (
                          <div key={gp.id} className="bg-[#111214] border border-[#393B3D] rounded-lg p-3.5 flex flex-col justify-between hover:border-gray-500 transition relative">
                            {/* Trash button */}
                            <button
                              onClick={() => handleDeleteMonetizationItem(gp.id, 'Gamepass')}
                              className="absolute top-2.5 right-2.5 text-gray-500 hover:text-red-400 p-1 rounded hover:bg-[#202224] transition-all"
                              title="Delete Item"
                            >
                              <Trash2 size={12} />
                            </button>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl bg-[#1c1d20] p-1.5 rounded">{gp.emoji}</span>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-xs text-white truncate max-w-[140px]">{gp.name}</h4>
                                  <span className="text-[9px] bg-amber-500/10 text-amber-400 font-extrabold px-1.5 py-0.2 rounded uppercase block w-fit mt-0.5">Pass</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-550 line-clamp-2 h-7 leading-normal">{gp.description}</p>
                            </div>

                            <div className="border-t border-[#393B3D]/50 pt-2 text-[10px] font-mono space-y-1 mt-3">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Price:</span>
                                <span className="text-[#34d399] font-bold">{gp.price} R$</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Sim Sales:</span>
                                <span className="text-gray-200 font-bold">{gp.sales.toLocaleString()} bought</span>
                              </div>
                              <div className="flex justify-between bg-emerald-950/20 text-[10px] py-0.5 px-1.5 rounded mt-1.5 text-emerald-400 font-bold">
                                <span>Revenue:</span>
                                <span>{gp.revenue.toLocaleString()} R$</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-[#111214] rounded-lg text-[11px] text-gray-500 italic border border-[#393B3D]/30">
                        No gamepasses configured for this experience. Fill out the creator form on the left to allocate one!
                      </div>
                    )}
                  </div>

                  {/* DevProduct Subsection */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">📦 Dev Products (Consumables)</span>
                    {(selectedExp.devProducts || []).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedExp.devProducts?.map(dp => (
                          <div key={dp.id} className="bg-[#111214] border border-[#393B3D] rounded-lg p-3.5 flex flex-col justify-between hover:border-gray-500 transition relative">
                            {/* Trash button */}
                            <button
                              onClick={() => handleDeleteMonetizationItem(dp.id, 'DevProduct')}
                              className="absolute top-2.5 right-2.5 text-gray-500 hover:text-red-400 p-1 rounded hover:bg-[#202224] transition-all"
                              title="Delete Item"
                            >
                              <Trash2 size={12} />
                            </button>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl bg-[#1c1d20] p-1.5 rounded">{dp.emoji}</span>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-xs text-white truncate max-w-[140px]">{dp.name}</h4>
                                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-1.5 py-0.2 rounded uppercase block w-fit mt-0.5">Product</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-550 line-clamp-2 h-7 leading-normal">{dp.description}</p>
                            </div>

                            <div className="border-t border-[#393B3D]/50 pt-2 text-[10px] font-mono space-y-1 mt-3">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Price:</span>
                                <span className="text-[#34d399] font-bold">{dp.price} R$</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Sim Sales:</span>
                                <span className="text-gray-200 font-bold">{dp.sales.toLocaleString()} bought</span>
                              </div>
                              <div className="flex justify-between bg-emerald-950/20 text-[10px] py-0.5 px-1.5 rounded mt-1.5 text-emerald-400 font-bold">
                                <span>Revenue:</span>
                                <span>{dp.revenue.toLocaleString()} R$</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-[#111214] rounded-lg text-[11px] text-gray-500 italic border border-[#393B3D]/30">
                        No developer products configured for this experience. Fill out the creator form on the left to allocate one!
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 text-xs">
                  Please select or build your first game experience to inspect the storefront asset catalog.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEVEX PAYOUT & LEADERBOARDS */}
      {activeTab === 'devex' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column A: Cash out counter */}
          <div className="lg:col-span-7 bg-[#232527] border border-[#393B3D] rounded-xl p-5 md:p-6 space-y-6">
            <div className="pb-3 border-b border-[#393B3D]">
              <h3 className="text-sm font-black uppercase text-cyan-400 tracking-wider flex items-center gap-2">
                💳 Developer Exchange (DevEx) Portal
              </h3>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                Exchange your generated "Developer Robux" cache for mock USD currency. Check your commercial success and unlock elite badges.
              </p>
            </div>

            {/* Simulated Rate Indicator Visual */}
            <div className="bg-[#111214] border border-[#393B3D] rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left select-none">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none block font-mono">Simulated Cash-out Rate</span>
                <span className="text-xl font-bold text-white flex items-center justify-center md:justify-start gap-1">
                  10,000 Dev R$ <ArrowUpRight className="text-gray-500" size={16} /> <span className="text-[#34d399] font-black">$35.00 USD</span>
                </span>
                <span className="text-[9px] text-[#34d399] block font-mono">Immediate mock bank transfers backed by Voxel Escrow.</span>
              </div>
              <div className="bg-[#1d1f22] border border-[#393B3D] p-3 rounded-lg text-center shrink-0">
                <span className="text-[9px] block text-gray-405 uppercase font-bold tracking-wider mb-0.5">Developer Balance</span>
                <span className="text-lg font-black text-[#58a6ff] font-mono block leading-none">{devRobux.toLocaleString()} R$</span>
              </div>
            </div>

            {/* Exchange presets selection */}
            <div className="space-y-3.5">
              <label className="block text-[10px] font-mono font-bold text-gray-450 uppercase tracking-wider">Configure cashout quantity</label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1000, 10000, 50000, 100000].map((preset) => {
                  const valUSD = (preset / 10000) * 35.00;
                  const canAfford = devRobux >= preset;
                  return (
                    <button
                      key={preset}
                      onClick={() => {
                        setCashoutAmount(preset);
                        triggerAudioTick(450, 0.05, 'sine');
                      }}
                      className={`p-3 rounded-lg border text-center transition flex flex-col items-center justify-center cursor-pointer select-none ${
                        cashoutAmount === preset 
                          ? 'border-[#34d399] bg-[#0c1e18]' 
                          : 'border-[#393B3D] bg-[#111214] hover:bg-[#1c1d1f]'
                      }`}
                    >
                      <span className="text-xs font-black font-mono text-white tracking-tight">{preset.toLocaleString()} R$</span>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold mt-1">${valUSD.toFixed(2)} USD</span>
                    </button>
                  );
                })}
              </div>

              {/* Cash out trigger action */}
              <button
                onClick={() => handleProcessCashout(cashoutAmount)}
                disabled={devRobux < 1000}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-zinc-800 disabled:to-zinc-800 text-neutral-950 font-black text-xs uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed mt-2"
              >
                <DollarSign size={14} strokeWidth={2.5} /> Execute DevEx Transfer
              </button>

              <button
                onClick={() => {
                  // Cash out all increments of 1000 Dev Robux
                  const maxAffordable = Math.floor(devRobux / 1000) * 1000;
                  if (maxAffordable < 1000) {
                    alert("Minimum cash out is 1,000 Dev Robux!");
                    return;
                  }
                  handleProcessCashout(maxAffordable);
                }}
                disabled={devRobux < 1000}
                className="w-full py-1.5 hover:bg-[#323436] rounded border border-[#393B3D] text-[10px] font-extrabold text-amber-500 hover:text-amber-400 font-mono transition uppercase cursor-pointer"
              >
                💸 Sweep & Cash Out All Multiples Of 1,000 R$
              </button>
            </div>

            {/* User Cumulative Stats */}
            <div className="bg-[#111214] border border-[#393B3D] rounded-xl p-4 md:p-5 space-y-4">
              <span className="block text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest pb-1.5 border-b border-[#303336]">Current Developer Status Ledger</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stat USD */}
                <div className="p-3 bg-slate-900/35 border border-[#393B3D]/50 rounded-lg text-center md:text-left">
                  <span className="text-[9px] font-medium text-gray-400 uppercase block tracking-wider font-mono">Redeemed Earnings</span>
                  <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">${devexUSD.toFixed(2)} USD</span>
                </div>

                {/* Stat ScorePoints */}
                <div className="p-3 bg-slate-900/35 border border-[#393B3D]/50 rounded-lg text-center md:text-left">
                  <span className="text-[9px] font-medium text-gray-400 uppercase block tracking-wider font-mono">Creator Score</span>
                  <span className="text-lg font-black text-amber-500 font-mono mt-0.5 block">{creatorPoints} XP</span>
                </div>

                {/* Rank Level Display */}
                <div className="p-3 bg-slate-900/35 border border-[#393B3D]/50 rounded-lg text-center md:text-left">
                  <span className="text-[9px] font-medium text-gray-400 uppercase block tracking-wider font-mono">Dev Badge Rating</span>
                  <span className={`text-[11px] font-black tracking-wide mt-1.5 block ${currentRank.color}`}>{currentRank.name}</span>
                </div>
              </div>

              {/* Progress Bar to Next Rank */}
              <div className="space-y-1 px-1">
                <div className="flex justify-between items-center text-[9px] font-mono text-gray-400">
                  <span>Badge Experience Progress</span>
                  <span>{creatorPoints} XP / {currentRank.limit} XP</span>
                </div>
                <div className="w-full bg-[#1e2022] h-2 rounded-full overflow-hidden border border-[#303336]/40 select-none">
                  <div 
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (creatorPoints / currentRank.limit) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column B: Dynamic Leaderboard */}
          <div className="lg:col-span-5 bg-[#232527] border border-[#393B3D] rounded-xl p-5 md:p-6 space-y-5">
            <div className="pb-2 border-b border-[#393B3D]">
              <h3 className="text-sm font-black uppercase text-[#ff8c00] tracking-wider flex items-center gap-1.5 font-display">
                🏆 Global Creator Leaderboard
              </h3>
              <p className="text-[10px] text-gray-404 mt-1">
                Ranked dynamically by total Developer Creator Badge XP. Cash out larger pools of Developer Robux to climb high on the leaderboard!
              </p>
            </div>

            <div className="space-y-2">
              {leaderboardData.map((dev, idx) => {
                const isUser = dev.isUser;
                const position = idx + 1;
                return (
                  <div
                    key={dev.name}
                    className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${
                      isUser 
                        ? 'border-cyan-500 bg-cyan-950/20 shadow-inner' 
                        : 'border-[#393B3D] bg-[#111214] hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Position medallion */}
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 font-mono ${
                        position === 1 ? 'bg-amber-500 text-zinc-950' : 
                        position === 2 ? 'bg-gray-300 text-zinc-950' :
                        position === 3 ? 'bg-amber-705 text-white' : 'text-gray-500 border border-[#393B3D]/50 bg-[#1c1d20]'
                      }`}>
                        {position}
                      </span>

                      {/* Mascot avatar circle */}
                      <div className={`w-8 h-8 rounded-full ${dev.avatar} flex items-center justify-center text-xs font-black capitalize shrink-0 shadow-inner`}>
                        {dev.name.substring(0, 2).toUpperCase()}
                      </div>

                      {/* Label block */}
                      <div className="min-w-0">
                        <span className={`text-xs font-black block leading-tight ${isUser ? 'text-cyan-400' : 'text-zinc-100'}`}>
                          {dev.name}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono">{dev.username}</span>
                      </div>
                    </div>

                    {/* XP Score bubble */}
                    <div className="text-right">
                      <span className="text-xs font-black font-mono block leading-tight text-white">{dev.points.toLocaleString()} XP</span>
                      <span className={`text-[8px] font-extrabold uppercase tracking-wide block ${isUser ? 'text-cyan-405' : 'text-[#ffad33]'}`}>
                        {dev.badge.replace(/📜|🛠️|🎬|🏰|👑/g, '')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (() => {
        const totalVisitsCount = experiences.reduce((sum, e) => sum + e.visits, 0);
        const totalRevenueCount = experiences.reduce((sum, e) => {
          const gpRev = (e.gamepasses || []).reduce((s, item) => s + item.revenue, 0);
          const dpRev = (e.devProducts || []).reduce((s, item) => s + item.revenue, 0);
          return sum + gpRev + dpRev;
        }, 0);
        const totalActivePasses = experiences.reduce((sum, e) => sum + (e.gamepasses || []).length + (e.devProducts || []).length, 0);
        const monetaryYield = totalVisitsCount > 0 ? (totalRevenueCount / totalVisitsCount).toFixed(2) : "0.00";

        const activeMonthlyData = getMonthlyDataForExperiences(analyticsSelectedExpId, experiences);

        const gpTotal = experiences.reduce((sum, e) => sum + (e.gamepasses || []).reduce((s, item) => s + item.revenue, 0), 0);
        const dpTotal = experiences.reduce((sum, e) => sum + (e.devProducts || []).reduce((s, item) => s + item.revenue, 0), 0);
        
        const pieData = [
          { name: 'Gamepasses Revenue', value: gpTotal || 1 },
          { name: 'Dev Products Revenue', value: dpTotal || 0 }
        ];
        const PIE_COLORS = ['#fbbf24', '#818cf8']; // Amber-400 / Indigo-400

        return (
          <div id="analytics-suite-view" className="space-y-6 animate-fadeIn pb-12">
            
            {/* Quick Summary Cards (4 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Visits */}
              <div id="analytics-card-visits" className="bg-[#232527] border border-[#393B3D] p-4.5 rounded-xl flex items-center justify-between shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Total Game Traffic</span>
                  <p className="text-xl font-black text-white font-mono">{totalVisitsCount.toLocaleString()}</p>
                  <span className="text-[9px] text-[#34d399] flex items-center gap-1 font-semibold">
                    <ArrowUpRight size={12} /> Trailing Visits
                  </span>
                </div>
                <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
                  <Eye size={20} />
                </div>
              </div>

              {/* Card 2: Total Revenue */}
              <div id="analytics-card-revenue" className="bg-[#232527] border border-[#393B3D] p-4.5 rounded-xl flex items-center justify-between shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Gross Earnings (R$)</span>
                  <p className="text-xl font-black text-amber-400 font-mono">{totalRevenueCount.toLocaleString()} R$</p>
                  <span className="text-[9px] text-amber-500 flex items-center gap-1 font-semibold font-mono">
                    <Coins size={12} /> Store sales totals
                  </span>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                  <Coins size={20} />
                </div>
              </div>

              {/* Card 3: Monetization Yield */}
              <div id="analytics-card-yield" className="bg-[#232527] border border-[#393B3D] p-4.5 rounded-xl flex items-center justify-between shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono font-mono">Monetization Efficiency</span>
                  <p className="text-xl font-black text-emerald-400 font-mono">{monetaryYield} R$</p>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <TrendingUp size={12} /> Robux Per Game Visitor
                  </span>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                  <DollarSign size={20} />
                </div>
              </div>

              {/* Card 4: Storefront Integrity */}
              <div id="analytics-card-items" className="bg-[#232527] border border-[#393B3D] p-4.5 rounded-xl flex items-center justify-between shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono font-mono">Merchandise Assets</span>
                  <p className="text-xl font-black text-zinc-200 font-mono">{totalActivePasses} Items</p>
                  <span className="text-[9px] text-zinc-400 flex items-center gap-1 font-semibold">
                    <Award size={12} /> Active Passes & Products
                  </span>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                  <Laptop size={20} />
                </div>
              </div>

            </div>

            {/* Split row: Main Trends (8/12) | Monetization Shares (4/12) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Filter Selector & Monthly Charts (8/12) */}
              <div className="lg:col-span-8 bg-[#232527] border border-[#393B3D] rounded-xl p-5 md:p-6 space-y-6 shadow-xl">
                
                {/* Header Filter Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#323436] gap-3">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      📈 Traffic & Monetization Payout Trends
                    </h3>
                    <p className="text-[10px] text-gray-400 leading-normal">
                      Deep-dive into month-by-month visitor footfall and product sales over the trailing 6 months.
                    </p>
                  </div>

                  {/* Filter dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider font-mono">Filter Experience:</span>
                    <select
                      value={analyticsSelectedExpId}
                      onChange={(e) => setAnalyticsSelectedExpId(e.target.value)}
                      className="bg-[#111214] border border-[#393B3D] rounded text-white text-xs px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer min-w-[150px] font-semibold text-gray-300"
                    >
                      <option value="all">📂 Combined experiences</option>
                      {experiences.map(exp => (
                        <option key={exp.id} value={exp.id}>
                          🎮 {exp.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subcharts Grid (Side-by-Side: Visits vs Revenue) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* CHART 1: Monthly Traffic */}
                  <div className="space-y-2 bg-[#111214]/40 border border-[#393B3D]/30 p-3.5 rounded-xl">
                    <div className="flex justify-between items-center pb-2 border-b border-[#1c1d1f]">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">Monthly Visits (Traffic Volume)</span>
                      <span className="text-[9px] bg-cyan-950/40 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/20 font-bold font-mono">
                        {activeMonthlyData.reduce((acc, m) => acc + m.Visits, 0).toLocaleString()} Total
                      </span>
                    </div>
                    <div className="h-64 pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={activeMonthlyData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2c2e" horizontal={true} vertical={false} />
                          <XAxis dataKey="name" stroke="#686f75" fontSize={10} />
                          <YAxis stroke="#686f75" fontSize={10} />
                          <Tooltip content={<CustomChartTooltip />} />
                          <Area type="monotone" dataKey="Visits" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVisits)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* CHART 2: Monthly Commercial Robux */}
                  <div className="space-y-2 bg-[#111214]/40 border border-[#393B3D]/30 p-3.5 rounded-xl">
                    <div className="flex justify-between items-center pb-2 border-b border-[#1c1d1f]">
                      <span className="text-[10px] font-bold text-emerald-405 uppercase tracking-wider font-mono">Monthly Revenue Earned (R$)</span>
                      <span className="text-[9px] bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/20 font-bold font-mono">
                        {activeMonthlyData.reduce((acc, m) => acc + m.Revenue, 0).toLocaleString()} R$ Total
                      </span>
                    </div>
                    <div className="h-64 pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={activeMonthlyData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2c2e" horizontal={true} vertical={false} />
                          <XAxis dataKey="name" stroke="#686f75" fontSize={10} />
                          <YAxis stroke="#686f75" fontSize={10} />
                          <Tooltip content={<CustomChartTooltip />} />
                          <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32}>
                            {activeMonthlyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#34d399'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* CHART 3: Cumulative Multi-Series (Product Category Breakdown across Months) */}
                <div className="bg-[#111214]/40 border border-[#393B3D]/30 p-4.5 rounded-xl space-y-3.5">
                  <div className="flex justify-between items-center pb-1 border-b border-[#1c1d1f]">
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      🛍️ Stream Demographics: Gamepasses vs Consumables
                    </span>
                    <span className="text-[9px] text-[#818cf8] font-bold font-mono">Segment Distribution</span>
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={activeMonthlyData}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2c2e" horizontal={true} vertical={false} />
                        <XAxis dataKey="name" stroke="#686f75" fontSize={10} />
                        <YAxis stroke="#686f75" fontSize={10} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10, marginTop: 5 }} />
                        <Line type="monotone" dataKey="Gamepasses" name="Gamepasses (R$)" stroke="#fbbf24" strokeWidth={2.5} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="DevProducts" name="Dev Products (R$)" stroke="#818cf8" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Right Column: Monetization Donut Breakdown & Fleet Rankings (4/12) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Donut Chart Block */}
                <div className="bg-[#232527] border border-[#393B3D] rounded-xl p-5 space-y-4 shadow-xl">
                  <div>
                    <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                      🛍️ Revenue Stream Breakdown
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">
                      Compare lifetime earnings contribution of permanent Gamepasses vs consumable Developer Products.
                    </p>
                  </div>

                  <div className="h-56 relative flex items-center justify-center">
                    {/* Ring total overlay */}
                    <div className="absolute text-center select-none">
                      <span className="text-[9px] block text-zinc-500 uppercase font-black tracking-widest font-mono">Total Earned</span>
                      <span className="text-sm font-black text-white font-mono">{(gpTotal + dpTotal).toLocaleString()} R$</span>
                      <span className="text-[8px] text-emerald-400 block mt-0.5 font-bold uppercase font-mono">Secured</span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legends rows custom */}
                  <div className="space-y-2 border-t border-[#323436] pt-3.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded bg-[#fbbf24] shrink-0" />
                        <span className="text-gray-400">Gamepass Store</span>
                      </div>
                      <span className="text-white font-bold font-mono">{gpTotal.toLocaleString()} R$</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded bg-[#818cf8] shrink-0" />
                        <span className="text-gray-400">Consumables Store</span>
                      </div>
                      <span className="text-white font-bold font-mono">{dpTotal.toLocaleString()} R$</span>
                    </div>
                  </div>
                </div>

                {/* Fleet rankings matrix */}
                <div className="bg-[#232527] border border-[#393B3D] rounded-xl p-5 space-y-4 shadow-xl">
                  <div>
                    <h3 className="font-bold text-xs text-zinc-200 uppercase tracking-widest">
                      🏆 Efficiency Matrix Leaderboard
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                      Your experiences ordered by simulated profit, with relative traffic conversion.
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-1">
                    {experiences.map((exp, rankIndex) => {
                      const expGP = (exp.gamepasses || []).reduce((s, gp) => s + gp.revenue, 0);
                      const expDP = (exp.devProducts || []).reduce((s, dp) => s + dp.revenue, 0);
                      const totalGameRevenue = expGP + expDP;

                      const contributionPct = totalRevenueCount > 0 
                        ? (totalGameRevenue / totalRevenueCount) * 100 
                        : 0;

                      return (
                        <div key={exp.id} className="space-y-1.5 p-2 bg-[#111214]/50 rounded-lg hover:bg-[#111214] transition">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0">
                              <span className="text-[9px] font-mono text-[#58a6ff] mr-1">#{rankIndex + 1}</span>
                              <span className="text-[11px] font-bold text-white truncate inline-block max-w-[155px] align-bottom">
                                {exp.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                              {totalGameRevenue.toLocaleString()} R$
                            </span>
                          </div>

                          {/* Stat items */}
                          <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                            <span>Visits: <strong className="text-zinc-400">{exp.visits.toLocaleString()}</strong></span>
                            <span>Share: <strong className="text-zinc-400">{contributionPct.toFixed(1)}%</strong></span>
                          </div>

                          {/* Custom visual progress bar */}
                          <div className="w-full bg-[#202224] h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full bg-gradient-to-r ${
                                rankIndex % 3 === 0 
                                  ? 'from-amber-500 to-yellow-400' 
                                  : rankIndex % 3 === 1 
                                    ? 'from-cyan-500 to-teal-400' 
                                    : 'from-indigo-500 to-purple-400'
                              }`} 
                              style={{ width: `${Math.min(100, Math.max(5, contributionPct))}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

          </div>
        );
      })()}

      {/* NEW EXPERIENCE MODAL */}
      {showNewExpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          
          {/* STEP 1: PATHWAY SELECTOR */}
          {modalMode === 'pathway' && (
            <div className="bg-[#232527] border border-[#393B3D] rounded-xl w-full max-w-2xl p-6 shadow-2xl relative space-y-6 animate-zoomIn my-auto">
              <button
                type="button"
                onClick={() => setShowNewExpModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-1">
                <h3 className="font-display font-black text-xl text-white uppercase tracking-wide">
                  Choose Studio Pathway
                </h3>
                <p className="text-xs text-gray-400">
                  Select how you want to build and compile your new gaming experience.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Pathway A: 3D Studio */}
                <div 
                  onClick={() => setModalMode('create3d')}
                  className="bg-[#111214] border border-[#393B3D] hover:border-indigo-500 p-5 rounded-lg flex flex-col justify-between gap-4 cursor-pointer group transition-all duration-205 hover:-translate-y-0.5"
                >
                  <div className="space-y-2">
                    <span className="text-2xl">🧱</span>
                    <h4 className="font-bold text-sm text-zinc-100 group-hover:text-white flex items-center justify-between">
                      Option A: Launch 3D Studio 
                      <span className="text-[10px] bg-indigo-500/15 text-indigo-400 font-bold px-2 py-0.5 rounded">Three.js</span>
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Build full 3D interactive environments. Configure isometric perspectives, light systems, lava hazard volumes, and physical properties.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 group-hover:text-white flex items-center gap-1 pt-2">
                    Proceed to 3D templates <Play size={10} className="fill-current text-indigo-400" />
                  </span>
                </div>

                {/* Pathway B: 2D Arcade Studio */}
                <div 
                  onClick={() => setModalMode('create2d')}
                  className="bg-[#111214] border border-cyan-500/20 hover:border-cyan-400 p-5 rounded-lg flex flex-col justify-between gap-4 cursor-pointer group transition-all duration-205 hover:-translate-y-0.5"
                >
                  <div className="space-y-2">
                    <span className="text-2xl animate-pulse">👾</span>
                    <h4 className="font-bold text-sm text-cyan-400 flex items-center justify-between">
                      Option B: Launch 2D Arcade Studio
                      <span className="text-[10px] bg-cyan-500/15 text-cyan-400 font-bold px-2 py-0.5 rounded">No-Code</span>
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Build Scratch-inspired 2D arcade coordinates. Drag colored logic blocks representing motion, events, repeat loops, and image switch costumes.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 group-hover:text-cyan-400 flex items-center gap-1 pt-2">
                    Proceed to 2D workspace <Play size={10} className="fill-current text-cyan-400" />
                  </span>
                </div>
              </div>

              <div className="text-center pt-2 border-t border-[#393B3D]">
                <button
                  type="button"
                  onClick={() => setShowNewExpModal(false)}
                  className="px-4 py-1.5 bg-[#111214] hover:bg-[#323436] text-zinc-400 hover:text-white rounded text-xs transition-colors cursor-pointer"
                >
                  Cancel and Return
                </button>
              </div>
            </div>
          )}

          {/* STEP 2A: CREATE 3D EXPERIENCE FORM */}
          {modalMode === 'create3d' && (
            <form 
              onSubmit={createExperience3D}
              className="bg-[#232527] border border-[#393B3D] rounded-xl w-full max-w-md p-6 shadow-2xl relative space-y-4 animate-zoomIn my-auto"
            >
              <button
                type="button"
                onClick={() => setModalMode('pathway')}
                className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>

              <h3 className="font-display font-black text-lg text-white flex items-center gap-1.5">
                🧱 Compile New 3D Experience
              </h3>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Experience name * (Max 35 chars)</label>
                  <input
                    type="text"
                    required
                    maxLength={35}
                    placeholder="e.g. Obby Jump Ultimate"
                    value={expName}
                    onChange={(e) => setExpName(e.target.value)}
                    className="w-full bg-[#111214] text-white rounded p-2 border border-[#393B3D] focus:outline-none focus:border-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Short Description (Max 160 chars)</label>
                  <textarea
                    placeholder="Describe your 3D world parameters..."
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    maxLength={160}
                    rows={3}
                    className="w-full bg-[#111214] text-white rounded p-2 border border-[#393B3D] focus:outline-none focus:border-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Map Template base</label>
                  <select
                    value={expTemplate}
                    onChange={(e) => setExpTemplate(e.target.value)}
                    className="w-full bg-[#111214] text-white rounded p-2 border border-[#393B3D] focus:outline-none focus:border-white cursor-pointer"
                  >
                    <option value="Baseplate">Default 2026 Grid Baseplate</option>
                    <option value="Desert Sandbox">Desert Arena Baseplate</option>
                    <option value="Rainbow Obby">Rainbow 150-Level Obby Template</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-3 border-t border-[#393B3D]">
                <button
                  type="button"
                  onClick={() => setModalMode('pathway')}
                  className="px-3 py-1.5 rounded hover:bg-[#323436] text-gray-400 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  ← Back to Pathways
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewExpModal(false)}
                    className="px-3 py-1.5 rounded hover:bg-[#323436] text-gray-400 hover:text-white text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-1.5 bg-white hover:bg-gray-200 text-black font-bold rounded text-xs transition-transform transform active:scale-95 cursor-pointer"
                  >
                    Build 3D Studio
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STEP 2B: CREATE 2D EXPERIENCE FORM */}
          {modalMode === 'create2d' && (
            <form 
              onSubmit={createExperience2D}
              className="bg-[#232527] border border-cyan-500/20 rounded-xl w-full max-w-md p-6 shadow-2xl relative space-y-4 animate-zoomIn my-auto"
            >
              <button
                type="button"
                onClick={() => setModalMode('pathway')}
                className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>

              <h3 className="font-display font-black text-lg text-cyan-400 flex items-center gap-1.5">
                👾 Compile New 2D Scratch Game
              </h3>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Game Title Name * (Max 35 chars)</label>
                  <input
                    type="text"
                    required
                    maxLength={35}
                    placeholder="e.g. Blocky Bird Adventure"
                    value={expName}
                    onChange={(e) => setExpName(e.target.value)}
                    className="w-full bg-[#111214] text-white rounded p-2 border border-[#393B3D] focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Objective Description (Max 160 chars)</label>
                  <textarea
                    placeholder="Describe how the visual blocks run on green flag..."
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    maxLength={160}
                    rows={3}
                    className="w-full bg-[#111214] text-white rounded p-2 border border-[#393B3D] focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Preset Sprite Stage Template</label>
                  <select
                    value={expTemplate2D}
                    onChange={(e) => setExpTemplate2D(e.target.value)}
                    className="w-full bg-[#111214] text-white rounded p-2 border border-[#393B3D] focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Blank Stage">Blank Stage (Place custom Sprites)</option>
                    <option value="Flappy Course">Flappy Bird Side-Scroller</option>
                    <option value="Snake Arena">Pixel Snake retro field</option>
                    <option value="Space Blaster">Galactic shooter backdrop</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-3 border-t border-[#393B3D]">
                <button
                  type="button"
                  onClick={() => setModalMode('pathway')}
                  className="px-3 py-1.5 rounded hover:bg-[#323436] text-gray-400 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  ← Back to Pathways
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewExpModal(false)}
                    className="px-3 py-1.5 rounded hover:bg-[#323436] text-gray-400 hover:text-white text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded text-xs transition-transform transform active:scale-95 cursor-pointer"
                  >
                    Build 2D Arcade Studio
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      )}

    </div>
  );
}
