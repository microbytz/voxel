import React, { useState, useEffect, useRef } from 'react';
import { Game, Friend, ShopItem } from '../types';
import { 
  Play, 
  Sparkles, 
  Star, 
  Users, 
  ThumbsUp, 
  ChevronRight, 
  UserPlus, 
  ShieldCheck,
  Heart,
  Repeat,
  MessageSquare,
  Send,
  Shield,
  Swords,
  Trash2,
  Globe,
  Lock,
  ArrowUpRight,
  HelpCircle,
  Clock,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  userName: string;
  avatarColor: string;
  friends: Friend[];
  continuePlaying: Game[];
  recommendedGames: Game[];
  onPlayGame: (game: Game) => void;
  onFriendClick: (friend: Friend) => void;
  onNavigateToTab: (tab: string) => void;
  games2D?: Game[];
  activeTab?: string;
  onAddFriend?: (friend: Friend) => void;
  blockedUsers?: string[];
  onToggleBlock?: (name: string) => void;
  games?: Game[];
  robux?: number;
  setRobux?: (val: number | ((prev: number) => number)) => void;
  shopItems?: ShopItem[];
  setShopItems?: React.Dispatch<React.SetStateAction<ShopItem[]>>;
  equippedItems?: string[];
  setEquippedItems?: React.Dispatch<React.SetStateAction<string[]>>;
  currentUser?: any;
  onOpenFollowUs?: () => void;
}

interface BloxiterPost {
  id: string;
  author: string;
  username: string;
  avatarColor: string;
  content: string;
  likes: number;
  retweets: number;
  time: string;
  isBot: boolean;
  likedByUser?: boolean;
  retweetedByUser?: boolean;
  replies?: BloxiterReply[];
  createdAt?: number;
}

interface BloxiterReply {
  id: string;
  author: string;
  username: string;
  avatarColor: string;
  content: string;
  time: string;
  createdAt?: number;
}

interface GroupWallMessage {
  id: string;
  author: string;
  username: string;
  avatarColor: string;
  content: string;
  time: string;
  createdAt?: number;
}

// Preset Groups/Clans List
const VOXEL_GROUPS = [
  {
    id: "g1",
    name: "The Voxelian Christians",
    emblem: "🕊️",
    colorClass: "border-pink-500 text-pink-400 bg-pink-500/10",
    description: "The largest faith-based community on Voxel. Promoting kindness, unity, and collaborative obby building.",
    members: 185600,
    founded: 2011,
    bannerGradient: "from-pink-950/40 to-[#232527]"
  },
  {
    id: "g2",
    name: "Redcliff Kingdom",
    emblem: "🛡️",
    colorClass: "border-red-500 text-red-400 bg-red-500/10",
    description: "The legendary holy knights of Redcliff. Master the high-tensile sword-fighting mechanics at the crossroads.",
    members: 320400,
    founded: 2009,
    bannerGradient: "from-red-950/40 to-[#232527]"
  },
  {
    id: "g3",
    name: "The Korblox Empire",
    emblem: "💀",
    colorClass: "border-sky-500 text-sky-400 bg-sky-500/10",
    description: "Ancient undead mages and frost wardens. Dominate spatial battlegrounds and stack winter-themed badges.",
    members: 290100,
    founded: 2010,
    bannerGradient: "from-sky-950/40 to-[#232527]"
  },
  {
    id: "g4",
    name: "Team Domino",
    emblem: "🟥",
    colorClass: "border-[#e11d48] text-rose-400 bg-rose-500/10",
    description: "A vintage collective of physics builders, Domino Crown flexing champions, and nostalgic developers.",
    members: 85200,
    founded: 2008,
    bannerGradient: "from-rose-950/40 to-[#232527]"
  },
  {
    id: "g5",
    name: "Trade Hangout LLC",
    emblem: "💎",
    colorClass: "border-emerald-500 text-emerald-400 bg-emerald-500/10",
    description: "The supreme guild of RAP calculators. Buy, sell, and auction limited items with zero mock commissions.",
    members: 420900,
    founded: 2012,
    bannerGradient: "from-emerald-950/40 to-[#232527]"
  }
];

const INITIAL_POSTS: BloxiterPost[] = [
  {
    id: "p1",
    author: "Builderman",
    username: "@builderman",
    avatarColor: "bg-red-500",
    content: "Working on the 2026 Core Engine patches with the engineering team. Added custom client-side lighting shaders! Let me know if you run into any rendering stud glitches in the studio. 🛡️💻",
    likes: 840,
    retweets: 154,
    time: "24m ago",
    isBot: true,
    createdAt: Date.now() - 24 * 60 * 1000,
    replies: [
      { id: "r1", author: "Telamon", username: "@telamon", avatarColor: "bg-orange-500", content: "Can we get bigger physics bounds? My giant boulders keep falling into the sky void", time: "20m ago", createdAt: Date.now() - 20 * 60 * 1000 }
    ]
  },
  {
    id: "p2",
    author: "Shedletsky",
    username: "@shedletsky",
    avatarColor: "bg-yellow-500",
    content: "Fun fact: Chickens run exactly 1.7x faster than default avatars. I am planning a total chicken invasion for the next Heights map update. Be prepared! 🐔⚔️",
    likes: 1242,
    retweets: 380,
    time: "1h ago",
    isBot: true,
    createdAt: Date.now() - 60 * 60 * 1000,
    replies: []
  },
  {
    id: "p3",
    author: "David.Baszucki",
    username: "@davidbaszucki",
    avatarColor: "bg-blue-600",
    content: "The simulated game ecosystem is thriving. Over 50 active developer groups have now integrated our DevEx exchange system. Keep building grand worlds! 📈💰",
    likes: 2100,
    retweets: 432,
    time: "4h ago",
    isBot: true,
    createdAt: Date.now() - 4 * 60 * 60 * 1000,
    replies: []
  },
  {
    id: "p4",
    author: "Linkmon99",
    username: "@linkmon99",
    avatarColor: "bg-purple-500",
    content: "Just traded my retro Domino Crown for 2 legendary visors and a vintage sword skin. Did I take an epic W or a massive L on RAP value? Let me know below! 🟥🏆",
    likes: 672,
    retweets: 45,
    time: "5h ago",
    isBot: true,
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
    replies: [
      { id: "r2", author: "Shedletsky", username: "@shedletsky", avatarColor: "bg-yellow-500", content: "L. Crown is infinite flexing material. Visors are temporary.", time: "4h ago", createdAt: Date.now() - 4 * 60 * 60 * 1000 }
    ]
  },
  {
    id: "p_old_saved",
    author: "Telamon",
    username: "@telamon",
    avatarColor: "bg-orange-500",
    content: "Vintage 2007 physics Bloxite server cluster benchmark completed with zero stud drift! This post stays since it has 520 likes! 🚀💎",
    likes: 520,
    retweets: 120,
    time: "10m ago",
    isBot: true,
    createdAt: Date.now() - 300 * 24 * 60 * 60 * 1000, // 10 months ago (older than 6 months, popular)
    replies: []
  },
  {
    id: "p_old_deleted",
    author: "UnpopularNoob",
    username: "@unpopular_noob",
    avatarColor: "bg-gray-400",
    content: "This is a low-quality spam post from 8 months ago that has only 5 likes. It should be automatically cleaned by the network protocol retention filter!",
    likes: 5,
    retweets: 0,
    time: "8m ago",
    isBot: true,
    createdAt: Date.now() - 240 * 24 * 60 * 60 * 1000, // 8 months ago (older than 6 months, unpopular)
    replies: []
  }
];

export interface StreakReward {
  day: number;
  robux: number;
  item: {
    id: string;
    name: string;
    imageUrl: string;
    category: 'Accessories' | 'Clothing' | 'Gear' | 'Faces';
    color: string;
  } | null;
}

export const STREAK_REWARDS: StreakReward[] = [
  { day: 1, robux: 50, item: null },
  { day: 2, robux: 100, item: null },
  { day: 3, robux: 150, item: null },
  { day: 4, robux: 200, item: { id: "streak_visor", name: "Cosmic Streak Visor 🌌", imageUrl: "🌌", category: "Accessories", color: "from-cyan-400 via-blue-600 to-indigo-800 border-cyan-400 shadow-cyan-900/30" } },
  { day: 5, robux: 250, item: null },
  { day: 6, robux: 300, item: null },
  { day: 7, robux: 500, item: { id: "streak_crown", name: "Ultimate Developer Crown 👑", imageUrl: "👑", category: "Accessories", color: "from-amber-400 via-yellow-500 to-orange-600 border-amber-300 shadow-amber-900/40" } },
];

export default function Dashboard({
  userName,
  avatarColor,
  friends,
  continuePlaying,
  recommendedGames,
  onPlayGame,
  onFriendClick,
  onNavigateToTab,
  games2D = [],
  activeTab = 'home',
  onAddFriend,
  blockedUsers = [],
  onToggleBlock,
  games = [],
  robux = 0,
  setRobux,
  shopItems = [],
  setShopItems,
  equippedItems = [],
  setEquippedItems,
  currentUser,
  onOpenFollowUs
}: DashboardProps) {
  
  // Audio oscillator helper
  const playFeedPitch = (freq: number, dur: number, type: OscillatorType = 'sine') => {
    try {
      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      gain.gain.setValueAtTime(0.04, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur);
    } catch (e) {}
  };

  // Daily Streak States
  const [streakCount, setStreakCount] = useState<number>(() => {
    return Number(localStorage.getItem('blox_streak_count') || '0');
  });

  const [lastClaimedDate, setLastClaimedDate] = useState<string>(() => {
    return localStorage.getItem('blox_streak_last_claimed_date') || '';
  });

  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const [showStreakModal, setShowStreakModal] = useState<boolean>(false);
  
  const [claimCelebration, setClaimCelebration] = useState<{
    show: boolean;
    dayNum: number;
    robuxAmt: number;
    itemName: string | null;
    itemEmoji: string | null;
  } | null>(null);

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const msDiff = midnight.getTime() - now.getTime();
      const hrs = Math.floor(msDiff / (1000 * 60 * 60));
      const mins = Math.floor((msDiff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((msDiff % (1000 * 60)) / 1000);
      setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClaimReward = () => {
    const todayStr = new Date().toDateString();
    if (lastClaimedDate === todayStr) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    let newStreak = 1;
    if (lastClaimedDate === yesterdayStr) {
      newStreak = (streakCount % 7) + 1;
    } else {
      newStreak = 1;
    }

    const targetReward = STREAK_REWARDS.find(r => r.day === newStreak);
    if (!targetReward) return;

    const robuxReward = targetReward.robux;
    if (setRobux) {
      setRobux(prev => prev + robuxReward);
    }

    let rewardedItemName: string | null = null;
    let rewardedItemEmoji: string | null = null;

    if (targetReward.item && setShopItems) {
      const rewardItem = targetReward.item;
      rewardedItemName = rewardItem.name;
      rewardedItemEmoji = rewardItem.imageUrl;

      setShopItems(prevItems => {
        const exists = prevItems.some(item => item.id === rewardItem.id);
        if (exists) {
          return prevItems.map(item => item.id === rewardItem.id ? { ...item, purchased: true } : item);
        } else {
          const newItem: ShopItem = {
            id: rewardItem.id,
            name: rewardItem.name,
            price: 0,
            category: rewardItem.category,
            imageUrl: rewardItem.imageUrl,
            color: rewardItem.color,
            purchased: true,
            isLimited: true,
            supply: 1,
            maxSupply: 1,
            originalPrice: 0,
            priceHistory: [0]
          };
          return [...prevItems, newItem];
        }
      });

      if (setEquippedItems) {
        setEquippedItems(prev => {
          if (!prev.includes(rewardItem.id)) {
            return [...prev, rewardItem.id];
          }
          return prev;
        });
      }
    }

    setStreakCount(newStreak);
    setLastClaimedDate(todayStr);
    localStorage.setItem('blox_streak_count', newStreak.toString());
    localStorage.setItem('blox_streak_last_claimed_date', todayStr);

    playFeedPitch(523.25, 0.12, 'triangle');
    setTimeout(() => playFeedPitch(659.25, 0.12, 'triangle'), 100);
    setTimeout(() => playFeedPitch(783.99, 0.12, 'triangle'), 200);
    setTimeout(() => playFeedPitch(1046.50, 0.35, 'sine'), 300);

    setClaimCelebration({
      show: true,
      dayNum: newStreak,
      robuxAmt: robuxReward,
      itemName: rewardedItemName,
      itemEmoji: rewardedItemEmoji,
    });
  };

  // Profile banner customization state (Classic, Redcliff Crimson, Korblox Blue, Gold, Retro)
  const [bannerSkin, setBannerSkin] = useState<string>(() => {
    return localStorage.getItem('profile_banner_skin') || 'classic';
  });

  useEffect(() => {
    localStorage.setItem('profile_banner_skin', bannerSkin);
  }, [bannerSkin]);

  // Social Panel Tab toggle
  const [socialTab, setSocialTab] = useState<'feed' | 'clans'>('feed');

  // Currently selected friend for profile interaction details overlay
  const [selectedProfileFriend, setSelectedProfileFriend] = useState<Friend | null>(null);

  // Separate like counts mapping and liked list
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    const cached = localStorage.getItem('bloxiter_like_counts');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return {};
  });

  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>(() => {
    const cached = localStorage.getItem('bloxiter_liked_posts');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return {};
  });

  // Pagination current visible posts count
  const [visibleCount, setVisibleCount] = useState<number>(5);

  // Bloxiter Feed States
  const [posts, setPosts] = useState<BloxiterPost[]>(() => {
    const cached = localStorage.getItem('bloxiter_posts');
    let loadedPosts: BloxiterPost[];
    if (cached) {
      try { 
        loadedPosts = JSON.parse(cached); 
      } catch (e) {
        loadedPosts = INITIAL_POSTS;
      }
    } else {
      loadedPosts = INITIAL_POSTS;
    }

    // Read stored like counts so retention filter has latest counts
    let localLikeCounts: Record<string, number> = {};
    const cachedCounts = localStorage.getItem('bloxiter_like_counts');
    if (cachedCounts) {
      try { localLikeCounts = JSON.parse(cachedCounts); } catch (e) {}
    }

    // Apply retention cleanup logic: Delete posts older than 6 months (180 days) unless popular (500+ likes)
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sixMonthsMs = 180 * oneDayMs;
    const now = Date.now();

    const filtered = loadedPosts.filter(p => {
      if (!p.createdAt) return true;
      const ageMs = now - p.createdAt;
      if (ageMs > sixMonthsMs) {
        const storedLikes = localLikeCounts[p.id] !== undefined ? localLikeCounts[p.id] : p.likes;
        // Keep only if popular (e.g. >= 500 likes)
        return storedLikes >= 500;
      }
      return true;
    });

    return filtered;
  });

  const [statusText, setStatusText] = useState("");
  const [postingActive, setPostingActive] = useState(false);

  useEffect(() => {
    localStorage.setItem('bloxiter_like_counts', JSON.stringify(likeCounts));
  }, [likeCounts]);

  useEffect(() => {
    localStorage.setItem('bloxiter_liked_posts', JSON.stringify(likedPosts));
  }, [likedPosts]);

  useEffect(() => {
    localStorage.setItem('bloxiter_posts', JSON.stringify(posts));
  }, [posts]);

  // Clans Memberships States
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>(() => {
    const cached = localStorage.getItem('user_joined_groups');
    return cached ? JSON.parse(cached) : ["g1"]; // Default joins TRC
  });

  useEffect(() => {
    localStorage.setItem('user_joined_groups', JSON.stringify(joinedGroupIds));
  }, [joinedGroupIds]);

  // Active Wall Chat selection (selects the first joined group ID)
  const [activeWallGroupId, setActiveWallGroupId] = useState<string>(() => {
    return joinedGroupIds[0] || "g1";
  });

  // Clan Wall Messages Scrolling Ref
  const clansScrollRef = useRef<HTMLDivElement | null>(null);

  // Automatically sync/update the wall selection when joined groups change
  useEffect(() => {
    if (joinedGroupIds.length > 0 && !joinedGroupIds.includes(activeWallGroupId)) {
      setActiveWallGroupId(joinedGroupIds[0]);
    }
  }, [joinedGroupIds]);

  // Group Walls Message States
  const [groupWalls, setGroupWalls] = useState<Record<string, GroupWallMessage[]>>(() => {
    const cached = localStorage.getItem('group_wall_messages');
    let loaded: Record<string, GroupWallMessage[]> | null = null;
    if (cached) {
      try { loaded = JSON.parse(cached); } catch (e) {}
    }
    
    const defaults = {
      "g1": [
        { id: "w1", author: "SisterAmelia", username: "@amelia", avatarColor: "bg-pink-600", content: "Welcome to our sanctuary! Remember to treat players with kindness and help newbies learn the mechanics. 🕊️", time: "2h ago", createdAt: Date.now() - 2 * 60 * 60 * 1000 },
        { id: "w2", author: "FaithBuilder", username: "@faith", avatarColor: "bg-blue-500", content: "The Sunday meeting hall is under major expansion, if you want to help lay studs let me know.", time: "5h ago", createdAt: Date.now() - 5 * 60 * 60 * 1000 }
      ],
      "g2": [
        { id: "w3", author: "General Redcliff", username: "@red_gen", avatarColor: "bg-red-700", content: "Shield drills at 6 PM UTC! Everyone bring standard iron swords to the practice arena. 🛡️⚔️", time: "1h ago", createdAt: Date.now() - 1 * 60 * 60 * 1000 },
        { id: "w4", author: "SirLancelot", username: "@lancelot", avatarColor: "bg-slate-400", content: "Korblox is planning a raid on the outer walls! Double down defense guys.", time: "3h ago", createdAt: Date.now() - 3 * 60 * 60 * 1000 }
      ],
      "g3": [
        { id: "w5", author: "IceWizard", username: "@icewiz", avatarColor: "bg-sky-500", content: "Gather the frosted gems from the caves of sorrow. The power of the bone staff is near. 💀🧊", time: "40m ago", createdAt: Date.now() - 40 * 60 * 1000 },
        { id: "w6", author: "BoneCollector", username: "@bones", avatarColor: "bg-gray-700", content: "We completely crushed the Redcliff knights in the Crossroads yesterday!", time: "3h ago", createdAt: Date.now() - 3 * 60 * 60 * 1000 }
      ],
      "g4": [
        { id: "w7", author: "DominoMaster", username: "@dominant", avatarColor: "bg-[#e11d48]", content: "Just completed a 10,000 chain domino block fall! It literally crashed the studio compiler but it was epic.", time: "30m ago", createdAt: Date.now() - 30 * 60 * 1000 },
        { id: "w8", author: "BrickLover77", username: "@brick_luvr", avatarColor: "bg-yellow-600", content: "Classic studs from 2008 are way better than modern mesh parts. Physics feel heavier.", time: "2h ago", createdAt: Date.now() - 2 * 60 * 60 * 1000 }
      ],
      "g5": [
        { id: "w9", author: "RAPGod", username: "@rapgod", avatarColor: "bg-purple-600", content: "High demands on Sparkle Fedoras right now. Do not accept anything below 15% overpay! 💎📈", time: "15m ago", createdAt: Date.now() - 15 * 60 * 1000 },
        { id: "w10", author: "SniperX", username: "@sniper_trade", avatarColor: "bg-indigo-650", content: "Just snagged a sapphire visor for only 400 Robux! Massive deal.", time: "2h ago", createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000 }
      ]
    };

    const target = loaded || defaults;
    
    // Auto purge aged-out messages on initial load
    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const cleaned: Record<string, GroupWallMessage[]> = {};
    for (const [gId, msgs] of Object.entries(target)) {
      const messageList = msgs as GroupWallMessage[];
      cleaned[gId] = messageList.filter(m => {
        const creation = m.createdAt || now;
        return (now - creation) < FIFTEEN_DAYS_MS;
      });
    }
    return cleaned;
  });

  const [wallText, setWallText] = useState("");

  const [playerSearchText, setPlayerSearchText] = useState("");
  const [friendRequestStatuses, setFriendRequestStatuses] = useState<Record<string, 'none' | 'sending' | 'accepted'>>({});

  // Clean offline list of searchable community members
  const COMMUNITY_PLAYERS = [
    { name: 'Telamon', username: '@telamon', avatarColor: 'bg-yellow-500', status: 'SHEDLETSKY IS MY COMPANION', isOnline: true },
    { name: 'ErikCassel', username: '@erik.cassel', avatarColor: 'bg-indigo-600', status: 'Designing the next stud block.', isOnline: false },
    { name: '1337_killa', username: '@killa', avatarColor: 'bg-emerald-500', status: 'Crossroads champion undefeated', isOnline: true },
    { name: 'SwordFightKing', username: '@sword_king', avatarColor: 'bg-slate-600', status: 'Join Redcliff knights today!', isOnline: true },
    { name: 'BluesteelLord', username: '@bluesteel', avatarColor: 'bg-cyan-500', status: 'Buying sparkle fedora for RAP price.', isOnline: true },
    { name: 'WackyWizard', username: '@wacky_wiz', avatarColor: 'bg-purple-600', status: 'Drinking gravity potions non-stop.', isOnline: true },
    { name: 'Loleris', username: '@loleris', avatarColor: 'bg-[#e11d48]', status: 'Mad Games is in development.', isOnline: false },
    { name: 'ClassicBrick', username: '@oldschool', avatarColor: 'bg-amber-600', status: '2008 physics retro champion', isOnline: false },
    { name: 'g00by', username: '@gooby', avatarColor: 'bg-pink-500', status: 'hahaha noobs', isOnline: true },
    { name: 'Minish', username: '@minish_dev', avatarColor: 'bg-rose-600', status: 'Writing cool Lua shaders.', isOnline: true }
  ];

  const handleSendFriendRequest = (player: { name: string; username: string; avatarColor: string; status: string; isOnline: boolean }) => {
    if (friendRequestStatuses[player.name] && friendRequestStatuses[player.name] !== 'none') return;
    
    playFeedPitch(700, 0.08, 'sine');
    
    setFriendRequestStatuses(prev => ({
      ...prev,
      [player.name]: 'sending'
    }));

    setTimeout(() => {
      setFriendRequestStatuses(prev => ({
        ...prev,
        [player.name]: 'accepted'
      }));

      // Play double-beep classic friends chiming sequence
      playFeedPitch(880, 0.1, 'sine');
      setTimeout(() => playFeedPitch(1100, 0.15, 'sine'), 105);

      const newFriend: Friend = {
        id: `friend_${Date.now()}_${player.name}`,
        name: player.name,
        username: player.username,
        avatarColor: player.avatarColor,
        isOnline: player.isOnline,
        status: player.status
      };
      
      onAddFriend?.(newFriend);
    }, 2800);
  };

  const getSearchResults = () => {
    if (!playerSearchText.trim()) return [];
    
    const queryStr = playerSearchText.toLowerCase();
    
    // Exclude players that are already in the friend list
    const currentFriendNames = friends.map(f => f.name.toLowerCase());
    
    const matches = COMMUNITY_PLAYERS.filter(p => {
      const alreadyFriend = currentFriendNames.includes(p.name.toLowerCase());
      if (alreadyFriend) return false;
      return p.name.toLowerCase().includes(queryStr) || p.username.toLowerCase().includes(queryStr);
    });

    if (matches.length === 0 && playerSearchText.trim().length >= 2) {
      const rawName = playerSearchText.replace(/[^a-zA-Z0-9_]/g, '');
      const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      
      const alreadyFriendObj = friends.find(f => f.name.toLowerCase() === cleanName.toLowerCase());
      if (alreadyFriendObj) return [];

      if (cleanName.length >= 2) {
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-pink-500', 'bg-amber-500', 'bg-cyan-500', 'bg-purple-500', 'bg-zinc-500', 'bg-sky-500', 'bg-orange-500'];
        const charSum = cleanName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const chosenColor = colors[charSum % colors.length];

        return [{
          name: cleanName,
          username: `@${cleanName.toLowerCase()}`,
          avatarColor: chosenColor,
          status: 'Simulating active player...',
          isOnline: true
        }];
      }
    }

    return matches;
  };

  useEffect(() => {
    localStorage.setItem('group_wall_messages', JSON.stringify(groupWalls));
  }, [groupWalls]);

  // Auto scroll effect when walls list updates, active wall group changes, or switching tab
  useEffect(() => {
    if (clansScrollRef.current) {
      clansScrollRef.current.scrollTop = clansScrollRef.current.scrollHeight;
    }
  }, [groupWalls, activeWallGroupId, socialTab]);

  // Periodic passive bot chats inside walls to make it look alive! Plus background aging cleanup routine (every 60s)
  useEffect(() => {
    const chatTicker = setInterval(() => {
      if (joinedGroupIds.length === 0) return;
      // Pick random group that user is in
      const randomGroupId = joinedGroupIds[Math.floor(Math.random() * joinedGroupIds.length)];
      
      let randomAvatars = ["bg-orange-600", "bg-yellow-600", "bg-emerald-600", "bg-indigo-600", "bg-rose-600"];
      let chosenAvColor = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];
      
      let botsMock: Record<string, {name: string, texts: string[]}[]> = {
        "g1": [
          { name: "ObbyPreacher", texts: ["God bless this build layout!", "Working on a collaborative Noah's Ark obby.", "Please thumbs up the group hub page!"] },
          { name: "GraceBuilder", texts: ["Happy Thursday everyone!", "Let's host a friendly sword scrimmage on the server today 🕊️"] }
        ],
        "g2": [
          { name: "SquireToby", texts: ["My claymore has been sharpened!", "The crossroads is safe under our perimeter patrol.", "For Redcliff glory!"] },
          { name: "ShieldMaiden", texts: ["Defense drills start in ten minutes.", "Watch out for Korblox ice magic!"] }
        ],
        "g3": [
          { name: "ShadowLich", texts: ["The winter shadows are expanding. 💀", "Death wardens are elite developers.", "Join us in defeating the Redcliff army!"] },
          { name: "GraveDigger", texts: ["Just collected 20 frozen bones to synthesize the dark skull visor."] }
        ],
        "g4": [
          { name: "RetroGuy08", texts: ["Studs are life.", "Classic sound effects (oof!) are superior.", "Domino chain reactor completed!"] },
          { name: "CornerStacker", texts: ["No union parts! Only beautiful clean brick primitives."] }
        ],
        "g5": [
          { name: "RAPTycoon", texts: ["Trading my Valkyrie helmet, RAP is matching high demands right now.", "Check out my catalog trade proposal!", "Never sell cheap! ⭐"] }
        ]
      };

      const candidates = botsMock[randomGroupId];
      if (!candidates) return;
      const chosenBot = candidates[Math.floor(Math.random() * candidates.length)];
      const text = chosenBot.texts[Math.floor(Math.random() * chosenBot.texts.length)];

      const randomMsgId = "w_pass_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      const newMsgObj: GroupWallMessage = {
        id: randomMsgId,
        author: chosenBot.name,
        username: `@${chosenBot.name.toLowerCase()}`,
        avatarColor: chosenAvColor,
        content: text,
        time: "Just now",
        createdAt: Date.now()
      };

      setGroupWalls(prev => ({
        ...prev,
        [randomGroupId]: [...(prev[randomGroupId] || []), newMsgObj].slice(-25) // Keep last 25 message limit
      }));

    }, 38000); // Trigger a passive wall chat every 38 seconds

    // Periodic 15-day message cleanup timer check (runs every 60 seconds)
    const cleanupTicker = setInterval(() => {
      const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      setGroupWalls(prev => {
        let changed = false;
        const updated: Record<string, GroupWallMessage[]> = {};
        for (const [gId, msgs] of Object.entries(prev)) {
          const messageList = msgs as GroupWallMessage[];
          const filtered = messageList.filter(m => {
            const creation = m.createdAt || now;
            const isAlive = (now - creation) < FIFTEEN_DAYS_MS;
            if (!isAlive) changed = true;
            return isAlive;
          });
          updated[gId] = filtered;
        }
        return changed ? updated : prev;
      });
    }, 60000);

    return () => {
      clearInterval(chatTicker);
      clearInterval(cleanupTicker);
    };
  }, [joinedGroupIds]);

  // Online friends calculation
  const unblockedFriends = friends.filter(f => !blockedUsers.some(blockedName => blockedName.toLowerCase() === f.name.toLowerCase()));
  const onlineFriends = unblockedFriends.filter(f => f.isOnline);

  // Profile banner background gradients mapping
  const bannerSkinMap: Record<string, { bg: string, ring: string, badge: string, label: string }> = {
    classic: { 
      bg: "bg-[#232527] border-[#393B3D]", 
      ring: "ring-[#393B3D]", 
      badge: "bg-gray-500/10 text-gray-350 border-gray-500/20",
      label: "Classic Charcoal"
    },
    redcliff: { 
      bg: "bg-gradient-to-r from-red-950/75 via-red-900/40 to-[#232527] border-red-500/40 shadow-xl shadow-red-950/15", 
      ring: "ring-red-500/40", 
      badge: "bg-red-500/15 text-red-400 border-red-500/30",
      label: "Redcliff Crimson Knight"
    },
    korblox: { 
      bg: "bg-gradient-to-r from-sky-950/75 via-cyan-900/40 to-[#232527] border-sky-500/40 shadow-xl shadow-sky-950/15", 
      ring: "ring-sky-500/40", 
      badge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      label: "Korblox Frost Warden"
    },
    golden: { 
      bg: "bg-gradient-to-r from-amber-950/75 via-yellow-905 mt-1 to-[#232527] border-yellow-500/40 shadow-xl shadow-yellow-950/15", 
      ring: "ring-yellow-500/50", 
      badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
      label: "Tycoon Gold King"
    },
    retro: { 
      bg: "bg-gradient-to-r from-emerald-950/75 via-teal-900/40 to-[#232527] border-emerald-500/40 shadow-xl shadow-emerald-950/15", 
      ring: "ring-emerald-500/40", 
      badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      label: "Nostalgic Brick Creator"
    }
  };

  const selectedBannerStyle = bannerSkinMap[bannerSkin] || bannerSkinMap.classic;

  // Handles custom Bloxiter Status Publication & Simulated Bot Conversational Replies
  const handlePostStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusText.trim()) return;

    setPostingActive(true);
    playFeedPitch(640, 0.08, 'sine');

    const userPostObj: BloxiterPost = {
      id: "up_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
      author: userName,
      username: "@GamerProX_Studio",
      avatarColor: "bg-cyan-500 border-2 border-white",
      content: statusText,
      likes: 0,
      retweets: 0,
      time: "Just now",
      isBot: false,
      replies: [],
      createdAt: Date.now()
    };

    // Prepend user status
    setPosts(prev => [userPostObj, ...prev]);
    const promptText = statusText;
    setStatusText("");
    setPostingActive(false);

    // Bot Auto-Reply Chat Logic
    setTimeout(() => {
      const contentLower = promptText.toLowerCase();
      let repliers = [
        { name: "Builderman", user: "@builderman", color: "bg-red-500" },
        { name: "Shedletsky", user: "@shedletsky", color: "bg-yellow-500" },
        { name: "Telamon", user: "@telamon", color: "bg-orange-500" },
        { name: "David.Baszucki", user: "@davidbaszucki", color: "bg-blue-600" },
        { name: "Linkmon99", user: "@linkmon99", color: "bg-purple-500" },
        { name: "Loleris", user: "@loleris", color: "bg-indigo-500" }
      ];

      let chosenBot = repliers[Math.floor(Math.random() * repliers.length)];
      let replyText = "";

      // Matching keyword logic
      if (contentLower.includes("robux") || contentLower.includes("money") || contentLower.includes("rich") || contentLower.includes("devex") || contentLower.includes("usd")) {
        if (Math.random() > 0.5) {
          chosenBot = repliers.find(b => b.name === "David.Baszucki") || chosenBot;
          replyText = "Our simulated DevEx platform appreciates your dedication! Your virtual ledger is looking extremely robust. Keep publishing those obbys! 📈💸";
        } else {
          chosenBot = repliers.find(b => b.name === "Linkmon99") || chosenBot;
          replyText = "Wanna trade? I can offer permanent visors and limited gear bundles in exchange for RAP valuation items. Direct message me! 💎🔁";
        }
      } else if (contentLower.includes("chicken") || contentLower.includes("food") || contentLower.includes("hungry") || contentLower.includes("cluck") || contentLower.includes("wings")) {
        chosenBot = repliers.find(b => b.name === "Shedletsky") || chosenBot;
        replyText = "Amazing logic! High-tensile chickens run exactly 1.7x faster than default avatars. Launching a major chicken baseplate update soon! 🐔🍴";
      } else if (contentLower.includes("code") || contentLower.includes("physics") || contentLower.includes("glitch") || contentLower.includes("bug") || contentLower.includes("crash") || contentLower.includes("error") || contentLower.includes("lag")) {
        if (Math.random() > 0.4) {
          chosenBot = repliers.find(b => b.name === "Builderman") || chosenBot;
          replyText = "I have entered this status into the engine ticket system. Stud coordinates should automatically snap back inside base bounds. 🛠️📡";
        } else {
          chosenBot = repliers.find(b => b.name === "Loleris") || chosenBot;
          replyText = "Classic compilation error. Clear your client parameters module, restructure nested triggers, and run code. Simple clean script! 🤓📜";
        }
      } else if (contentLower.includes("sword") || contentLower.includes("kingdom") || contentLower.includes("fight") || contentLower.includes("clan") || contentLower.includes("guild") || contentLower.includes("redcliff") || contentLower.includes("korblox")) {
        if (Math.random() > 0.5) {
          chosenBot = repliers.find(b => b.name === "Telamon") || chosenBot;
          replyText = "A massive crusade is brewing! Gear up with standard Redcliff steel shields. The Korblox skeleton generals shall be defeated! ⚔️🏰";
        } else {
          chosenBot = repliers.find(b => b.name === "Builderman") || chosenBot;
          replyText = "Clans represent the highest tier of community collaboration. Join historical guilds above and showcase your custom badge insignia! 🕊️💀";
        }
      } else {
        const defaultPhrases = [
          "Superb update! Retweeting this to the simulated developer wire channel. 👍✨",
          "Excellent thought! My module scripts captured this status update. Keep testing the limits!",
          "I agree! Though I'm currently distracted trying to clear out a 500 stud domino physics grid.",
          "Awesome point. Are you planning to add three-dimensional vector lights to your active baseplate? 🚀"
        ];
        replyText = defaultPhrases[Math.floor(Math.random() * defaultPhrases.length)];
      }

      const botReply: BloxiterReply = {
        id: "rep_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
        author: chosenBot.name,
        username: chosenBot.user,
        avatarColor: chosenBot.color,
        content: replyText,
        time: "Just now",
        createdAt: Date.now()
      };

      // Append bot reply to user post
      setPosts(prev => prev.map(p => {
        if (p.id === userPostObj.id) {
          return {
            ...p,
            replies: [...(p.replies || []), botReply]
          };
        }
        return p;
      }));

      // Play neat sound notification beep
      playFeedPitch(880, 0.1, 'sine');
      setTimeout(() => playFeedPitch(1100, 0.14, 'sine'), 100);

    }, 1500);
  };

  // Like status updater
  const handleLikePost = (postId: string) => {
    playFeedPitch(750, 0.05, 'triangle');
    const postObj = posts.find(p => p.id === postId);
    if (!postObj) return;

    const currentlyLiked = likedPosts[postId] !== undefined ? likedPosts[postId] : !!postObj.likedByUser;
    const currentLikesCount = likeCounts[postId] !== undefined ? likeCounts[postId] : postObj.likes;

    const nextLiked = !currentlyLiked;
    const nextLikesCount = nextLiked ? currentLikesCount + 1 : currentLikesCount - 1;

    setLikedPosts(prev => ({ ...prev, [postId]: nextLiked }));
    setLikeCounts(prev => ({ ...prev, [postId]: nextLikesCount }));

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likedByUser: nextLiked,
          likes: nextLikesCount
        };
      }
      return p;
    }));
  };

  // Retweet status updater
  const handleRetweetPost = (postId: string) => {
    playFeedPitch(600, 0.06, 'sine');
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const retweeted = !p.retweetedByUser;
        return {
          ...p,
          retweetedByUser: retweeted,
          retweets: retweeted ? p.retweets + 1 : p.retweets - 1
        };
      }
      return p;
    }));
  };

  // Group Joining Action
  const toggleGroupJoin = (groupId: string) => {
    playFeedPitch(587.33, 0.08, 'sine'); // D5
    let grp = VOXEL_GROUPS.find(g => g.id === groupId);
    if (!grp) return;

    if (joinedGroupIds.includes(groupId)) {
      // Leave group query
      setJoinedGroupIds(prev => prev.filter(id => id !== groupId));
    } else {
      // Join group query
      setJoinedGroupIds(prev => [...prev, groupId]);
      // Play a beautiful chord
      setTimeout(() => playFeedPitch(783.99, 0.15, 'sine'), 120); // G5
      alert(`🎉 Congratulations! You have officially joined "${grp.name}"! Group custom badge "${grp.emblem}" is now unlocked on your profile banner. You can inspect and post inside their exclusive Group Wall Chat below!`);
    }
  };

  // Post to group wall
  const handlePostToGroupWall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallText.trim()) return;

    playFeedPitch(640, 0.05, 'sine');
    const userMsg: GroupWallMessage = {
      id: "wm_user_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
      author: userName,
      username: "@GamerProX_Studio",
      avatarColor: "bg-cyan-500",
      content: wallText,
      time: "Just now",
      createdAt: Date.now()
    };

    const targetGroupId = activeWallGroupId;
    const writtenText = wallText;

    setGroupWalls(prev => ({
      ...prev,
      [targetGroupId]: [...(prev[targetGroupId] || []), userMsg]
    }));

    setWallText("");

    // Bot Group Response Logic
    setTimeout(() => {
      let botName = "ObbyManager";
      let botAv = "bg-rose-500";
      let replyContent = "";

      if (targetGroupId === "g1") {
        botName = "SisterAmelia";
        botAv = "bg-pink-600";
        replyContent = `Amen to that, @GamerProX_Studio! We are planning a massive Christian-themed spatial baseplate workshop soon. Stop by! 🕊️`;
      } else if (targetGroupId === "g2") {
        botName = "General Redcliff";
        botAv = "bg-red-700";
        replyContent = `Extremely honorable stance, comrade @GamerProX_Studio! Keep those sword skills sharp. The knights represent supreme spatial order. ⚔️🛡️`;
      } else if (targetGroupId === "g3") {
        botName = "IceWizard";
        botAv = "bg-sky-500";
        replyContent = `The skeletal ice legions monitor your words, @GamerProX_Studio. A worthy assessment of winter tactics. 🧊💀`;
      } else if (targetGroupId === "g4") {
        botName = "DominoMaster";
        botAv = "bg-[#e11d48]";
        replyContent = `Brilliant vector physics logic! Let us assemble 500 red brick pillars next to test the server crash margins. 🟥`;
      } else if (targetGroupId === "g5") {
        botName = "RAPGod";
        botAv = "bg-purple-600";
        replyContent = `No lowball offers in the group wall, @GamerProX_Studio! Though I completely support this. Keep tracking RAP value variables! 💎📈`;
      }

      const botWallMsg: GroupWallMessage = {
        id: "wm_bot_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
        author: botName,
        username: `@${botName.toLowerCase()}`,
        avatarColor: botAv,
        content: replyContent,
        time: "Just now",
        createdAt: Date.now()
      };

      setGroupWalls(prev => ({
        ...prev,
        [targetGroupId]: [...(prev[targetGroupId] || []), botWallMsg]
      }));

      playFeedPitch(520, 0.08, 'triangle');
    }, 1800);
  };

  const selectedGroupIdForWall = activeWallGroupId;
  const activeWallList = groupWalls[selectedGroupIdForWall] || [];
  const selectedGroupObj = VOXEL_GROUPS.find(g => g.id === selectedGroupIdForWall);

  if (activeTab === 'bloxiter') {
    const getPostLikes = (post: BloxiterPost) => {
      return likeCounts[post.id] !== undefined ? likeCounts[post.id] : post.likes;
    };

    const isPostLiked = (post: BloxiterPost) => {
      return likedPosts[post.id] !== undefined ? likedPosts[post.id] : !!post.likedByUser;
    };

    const sortedPosts = [...posts].sort((a, b) => {
      const timeA = a.createdAt || 0;
      const timeB = b.createdAt || 0;
      return timeB - timeA;
    });

    const filteredSortedPosts = sortedPosts.filter(post => {
      return !blockedUsers.some(bu => bu.toLowerCase() === post.author.toLowerCase());
    });

    const paginatedPosts = filteredSortedPosts.slice(0, visibleCount);

    return (
      <div className="w-full text-gray-200 p-4 md:p-6 font-sans max-w-4xl mx-auto animate-fadeIn select-none space-y-5">
        <div className="pb-1">
          <h2 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
            🐦 Bloxiter Developer Feed
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Keep up with recent developer achievements, check client status updates, and read automatic reports of sandbox marketplace server sales.
          </p>
        </div>

        <div className="bg-[#232527] border border-[#393B3D] rounded-xl overflow-hidden flex flex-col h-[740px] shadow-xl">
          <div className="flex-1 flex flex-col h-full min-h-0 bg-[#232527]">
            
            {/* Status poster area */}
            <div className="p-4 border-b border-[#303336] bg-[#1d1f21]/40 shrink-0">
              <form onSubmit={handlePostStatus} className="space-y-3">
                <div className="flex gap-3">
                  <div className={`w-8.5 h-8.5 rounded-full bg-gradient-to-tr ${avatarColor} flex items-center justify-center text-gray-950 font-display font-black text-xs shrink-0 select-none shadow mr-0.5`}>
                    {userName.substring(0, 2).toUpperCase()}
                  </div>
                  <textarea
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    placeholder="What are your building plans today?..."
                    maxLength={300}
                    rows={2}
                    className="w-full bg-black/30 border border-[#393B3D] rounded-lg text-xs p-2.5 text-white focus:outline-none focus:border-cyan-500 placeholder-gray-500 resize-none transition-all leading-relaxed"
                  />
                </div>
                
                <div className="flex justify-between items-center pl-11">
                  <span className="text-[10px] text-gray-500 font-mono">
                    {statusText.length}/300 characters
                  </span>
                  <button
                    type="submit"
                    disabled={postingActive || !statusText.trim()}
                    className="px-3.5 py-1.5 bg-cyan-550 hover:bg-cyan-500 disabled:bg-neutral-800 text-neutral-900 disabled:text-gray-500 font-extrabold rounded-lg text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow self-end"
                  >
                    <Send size={11} fill="currentColor" />
                    Bloxite!
                  </button>
                </div>
              </form>
            </div>

            {/* Scrolling feeds list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              
              {/* Optional note about retention system active */}
              <div className="bg-cyan-950/20 border border-cyan-800/30 rounded-lg p-2.5 text-center text-[10px] font-bold text-cyan-400 font-mono tracking-wide mb-1 leading-normal">
                🛡️ Feed Retention protocol active: old posts (less than 500 likes) auto-deleted after 6 months to minimize baseplate database overhead.
              </div>

              {paginatedPosts.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs font-mono">
                  Nothing to show on your developer feed yet!
                </div>
              ) : (
                paginatedPosts.map((post) => {
                  const currentLikes = getPostLikes(post);
                  const currentLikedObj = isPostLiked(post);
                  return (
                    <div key={post.id} className="border-b border-[#303336]/65 pb-3.5 last:border-0 last:pb-0 font-sans space-y-2">
                      <div className="flex items-start gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${post.avatarColor} text-gray-900 font-bold text-xs flex items-center justify-center shrink-0 shadow select-none`}>
                          {post.author.substring(0, 2).toUpperCase()}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-white hover:underline cursor-default">{post.author}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{post.username}</span>
                            <span className="text-gray-650 text-[10px] select-none">·</span>
                            <span className="text-[9px] text-gray-450 font-mono flex items-center gap-1.5 bg-black/10 px-1.5 py-0.5 rounded leading-none">
                              <Clock size={10} className="text-gray-500" />
                              <span>{post.time}</span>
                              {post.createdAt && (
                                <>
                                  <span className="text-gray-600 select-none">•</span>
                                  <span>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                </>
                              )}
                            </span>
                          </div>

                          <p className="text-xs text-gray-300 leading-relaxed font-sans pt-1 break-words">
                            {post.content}
                          </p>

                          <div className="flex items-center gap-4.5 pt-2 text-[10px] text-gray-500 font-mono select-none">
                            <button 
                              onClick={() => handleLikePost(post.id)}
                              className={`flex items-center gap-1 transition ${currentLikedObj ? 'text-red-400' : 'hover:text-red-400'}`}
                              title="Like post"
                            >
                              <Heart size={11} fill={currentLikedObj ? "currentColor" : "none"} className={currentLikedObj ? "scale-110" : ""} />
                              <span>{currentLikes}</span>
                            </button>
                            
                            <button 
                              onClick={() => handleRetweetPost(post.id)}
                              className={`flex items-center gap-1 transition ${post.retweetedByUser ? 'text-green-400' : 'hover:text-green-400'}`}
                              title="Retweet status"
                            >
                              <Repeat size={11} className={post.retweetedByUser ? "scale-110" : ""} />
                              <span>{post.retweets}</span>
                            </button>

                            <span className="text-[9px] text-gray-550 hidden sm:inline-block">
                              {post.isBot ? "📡 Community Bot" : "🛠️ Local Dev Client"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Replies thread */}
                      {post.replies && post.replies.length > 0 && (
                        <div className="pl-6 pt-1 space-y-2 border-l border-[#393B3D] ml-4 mt-1.5">
                          {post.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2 text-xs leading-relaxed">
                              <div className={`w-6 h-6 rounded-full ${reply.avatarColor} text-gray-900 font-extrabold text-[9px] flex items-center justify-center shrink-0 shadow`}>
                                {reply.author.substring(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-gray-200 text-[11px]">{reply.author}</span>
                                  <span className="text-[10px] text-gray-500 font-mono">{reply.username}</span>
                                  <span className="text-[9px] text-gray-450 font-mono ml-auto flex items-center gap-1.5 bg-black/10 px-1 py-0.5 rounded leading-none">
                                    <span>{reply.time}</span>
                                    {reply.createdAt && (
                                      <>
                                        <span className="text-gray-600 select-none">•</span>
                                        <span>{new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                      </>
                                    )}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-300 leading-normal font-sans pt-0.5 break-words">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Pagination controls */}
              {filteredSortedPosts.length > visibleCount && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVisibleCount(prev => prev + 5);
                      playFeedPitch(550, 0.08, 'sine');
                    }}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-[#393B3D] rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer text-center"
                  >
                    Load More Posts ({filteredSortedPosts.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'clans') {
    return (
      <div className="w-full text-gray-200 p-4 md:p-6 font-sans max-w-7xl mx-auto animate-fadeIn select-none space-y-5">
        <div className="pb-1">
          <h2 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
            🛡️ Developer Clans & Guilds
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Participate in specialized sword organizations, coordinate massive virtual raids, and write in absolute secrecy on Group Wall discussion boards.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Available Clans column selection */}
          <div className="lg:col-span-5 bg-[#232527] border border-[#393B3D] rounded-xl p-4 flex flex-col shadow-xl h-[700px]">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-[#ff8c00] mb-3.5 flex items-center gap-1 shrink-0 select-none">
              <Swords size={12} /> Historic Sword Clans & communities
            </h4>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
              {VOXEL_GROUPS.map((grp) => {
                const isJoined = joinedGroupIds.includes(grp.id);
                return (
                  <div 
                    key={grp.id} 
                    className="bg-black/35 border border-[#303336] rounded-lg p-3 flex items-center justify-between gap-3 text-xs transition hover:border-[#424446]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base select-none leading-none">{grp.emblem}</span>
                        <h5 className="font-bold text-white text-xs truncate leading-none">{grp.name}</h5>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed mt-1.5" title={grp.description}>
                        {grp.description}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className="text-[10px] font-mono text-gray-500 font-medium font-bold">{(grp.members / 1000).toFixed(0)}k members</span>
                      <button
                        onClick={() => toggleGroupJoin(grp.id)}
                        className={`px-3 py-1 rounded text-[10px] font-extrabold uppercase tracking-wide transition transform active:scale-95 cursor-pointer ${
                          isJoined
                            ? 'bg-neutral-800 text-red-400 hover:bg-neutral-700/80 hover:text-red-300'
                            : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                        }`}
                      >
                        {isJoined ? 'Leave' : 'Join'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Wall content panel */}
          <div className="lg:col-span-7 bg-[#232527] border border-[#393B3D] rounded-xl overflow-hidden flex flex-col h-[700px] shadow-xl">
            <div className="p-3.5 border-b border-[#303336] bg-[#131416]/40 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest select-none">🛡️ Active Group Wall Messages</span>
              
              {joinedGroupIds.length > 0 ? (
                <select
                  value={activeWallGroupId}
                  onChange={(e) => {
                    setActiveWallGroupId(e.target.value);
                    playFeedPitch(500, 0.05);
                  }}
                  className="bg-black/45 border border-[#393B3D] text-white text-[10px] font-extrabold rounded px-2.5 py-1.5 cursor-pointer focus:outline-none"
                >
                  {joinedGroupIds.map(gId => {
                    const grp = VOXEL_GROUPS.find(g => g.id === gId);
                    return grp ? <option key={gId} value={gId}>{grp.emblem} {grp.name}</option> : null;
                  })}
                </select>
              ) : (
                <span className="text-[10px] font-bold text-amber-500">No active clan walls</span>
              )}
            </div>

            {/* Message scrolling walls history */}
            <div ref={clansScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar min-h-0">
              {joinedGroupIds.length > 0 && selectedGroupObj ? (
                activeWallList.length > 0 ? (
                  activeWallList.filter(msg => !blockedUsers.some(bu => bu.toLowerCase() === msg.author.toLowerCase())).map((msg) => (
                    <div key={msg.id} className="text-xs space-y-1 bg-black/15 p-2.5 px-3.5 rounded-lg border border-[#303336]/40 leading-relaxed font-sans max-w-[90%] last:mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`w-4.5 h-4.5 rounded-full ${msg.avatarColor} text-gray-900 font-black text-[9px] flex items-center justify-center shrink-0`}>
                          {msg.author.substring(0, 1).toUpperCase()}
                        </div>
                        <span className="font-extrabold text-white text-[11px]">{msg.author}</span>
                        <span className="text-[9px] text-gray-500 font-mono">{msg.username}</span>
                        <span className="text-[9px] text-gray-455 ml-auto font-mono flex items-center gap-1.5 bg-black/10 px-1.5 py-0.5 rounded leading-none shrink-0">
                          <span>{msg.time}</span>
                          {msg.createdAt && (
                            <>
                              <span className="text-[#303336] select-none">•</span>
                              <span className="text-gray-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-gray-300 text-[11px] break-words leading-relaxed pl-1.5">
                        {msg.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-gray-500 text-[11px] italic h-full flex flex-col justify-center select-none leading-relaxed">
                    No posts on this wall yet. Be the first to publish of your achievements to other members!
                  </div>
                )
              ) : (
                <div className="text-center py-12 px-6 h-full flex flex-col justify-center items-center gap-3 select-none text-center">
                  <span className="text-4xl filter opacity-40">🏰</span>
                  <p className="leading-relaxed font-semibold max-w-xs text-xs text-gray-400">
                    ⚠️ You aren't signed up in any developer groups or sword clans. Join a clan on the left to unlock and participate in their exclusive Group Wall Chats!
                  </p>
                </div>
              )}
            </div>

            {/* Post message to Group Wall inputs */}
            {joinedGroupIds.length > 0 && selectedGroupObj && (
              <div className="p-3.5 border-t border-[#303336] bg-[#111214]/60 shrink-0">
                <form onSubmit={handlePostToGroupWall} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={wallText}
                    onChange={(e) => setWallText(e.target.value)}
                    maxLength={80}
                    placeholder={`Write on ${selectedGroupObj.name.split(" ")[0]} wall...`}
                    className="flex-1 bg-black/40 border border-[#393B3D] text-xs px-3.5 rounded-lg focus:outline-none focus:border-cyan-500 text-white leading-none h-9"
                  />
                  <button
                    type="submit"
                    disabled={!wallText.trim()}
                    className="px-4.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-neutral-800 text-white disabled:text-gray-500 font-extrabold text-xs rounded-lg transition-colors cursor-pointer h-9"
                  >
                    Post Wall
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-gray-200 p-4 md:p-6 font-sans max-w-7xl mx-auto animate-fadeIn select-none">
      
      {/* TWO COLUMN HOME SYSTEM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Hero, Friends, Studio, Play & Recommended (col-span-12) */}
        <div className="lg:col-span-12 space-y-7">
          
          {/* 1. Welcoming Hero Banner / Custom Profile Banner with customizable theme picker */}
          <section className={`relative overflow-hidden rounded-xl border p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-350 min-h-[140px] max-w-4xl mx-auto w-full ${selectedBannerStyle.bg}`}>
            {/* Subtle grid pattern background */}
            <div className="absolute inset-0 roblox-grid opacity-15 pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left z-10 w-full sm:w-auto">
              {/* Circular big animated avatar thumbnail with customized glowing theme ring */}
              <div className="relative group shrink-0">
                <div className={`w-20 h-20 md:w-22 md:h-22 rounded-full bg-gradient-to-tr ${avatarColor} flex items-center justify-center text-gray-950 font-display font-black text-2xl md:text-3xl shadow-2xl ring-4 ${selectedBannerStyle.ring} group-hover:scale-105 transition-all duration-300`}>
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <span className="absolute bottom-1 right-1 w-4.5 h-4.5 bg-green-500 rounded-full border-4 border-[#232527]" />
              </div>

              <div className="space-y-1.5 min-w-0">
                <h1 className="text-xl md:text-2xl font-display font-extrabold tracking-tight text-white flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  Hello, {userName}! <span className="animate-bounce">👋</span>
                </h1>
                
                <p className="text-gray-400 text-xs max-w-sm line-clamp-2 md:line-clamp-none">
                  Customize your layout, manage active sword clans, and build immersive virtual economies.
                </p>

                {/* Banner Status Row: display active rank & unlocked badges/groups */}
                <div className="pt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2 select-none">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[9px] font-sans font-extrabold bg-black/40 border border-white/5 text-emerald-400 uppercase tracking-wider">
                    🔒 Premium Developer
                  </span>

                  <button
                    onClick={() => {
                      playFeedPitch(600, 0.05);
                      setShowStreakModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[9px] font-sans font-extrabold bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/30 hover:border-amber-450 text-amber-300 uppercase tracking-wider transition-all duration-155 cursor-pointer animate-pulse"
                    title="Unlock daily Robux and items! Click to check check-in rewards"
                  >
                    🔥 {streakCount}-Day Streak {lastClaimedDate === new Date().toDateString() ? '✓' : 'Claim! 🎁'}
                  </button>

                  {/* Joined Group Badges on our custom profile banner! */}
                  {joinedGroupIds.length > 0 ? (
                    joinedGroupIds.map(gId => {
                      const grp = VOXEL_GROUPS.find(g => g.id === gId);
                      if (!grp) return null;
                      return (
                        <span 
                          key={gId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] bg-black/60 text-white font-bold border border-white/10 shadow-sm"
                          title={`${grp.name}`}
                        >
                          <span className="filter drop-shadow-sm select-none">{grp.emblem}</span>
                          <span className="text-[8px] uppercase tracking-wider text-gray-300 hidden sm:inline">{grp.name.split(" ")[0]}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[9px] font-bold text-amber-500 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                      ⚠️ Join clans to display badges on profile banner
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Create game call-to-action button */}
            <div className="relative flex flex-col items-center sm:items-end shrink-0 w-full md:w-auto z-10 gap-2">
              <button
                onClick={() => onNavigateToTab('create')}
                className="px-4 py-2 rounded bg-white text-black hover:bg-gray-200 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 group transform active:scale-95 w-full sm:w-auto text-center"
              >
                <Sparkles size={13} className="text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
                Launch Developer Suite
              </button>
              {onOpenFollowUs && (
                <button
                  type="button"
                  onClick={() => {
                    playFeedPitch(600, 0.05);
                    onOpenFollowUs();
                  }}
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-505 hover:bg-indigo-500 focus:bg-indigo-500 border border-[#0e0c80] hover:border-indigo-400 text-white text-[10px] font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 group transform active:scale-95 w-full sm:w-auto text-center"
                >
                  📢 Follow Us & Feedback
                </button>
              )}

              {/* Custom interactive color skin palette selectors */}
              <div className="flex items-center gap-1.5 bg-black/55 border border-[#393B3D] px-2 py-1 rounded text-[10px] text-gray-300 select-none">
                <span className="font-semibold text-gray-400">Banner Skin:</span>
                {[
                  { id: 'classic', icon: '♣️', color: 'bg-zinc-600' },
                  { id: 'redcliff', icon: '🛡️', color: 'bg-red-600' },
                  { id: 'korblox', icon: '💀', color: 'bg-sky-500' },
                  { id: 'golden', icon: '👑', color: 'bg-amber-500' },
                  { id: 'retro', icon: '🟥', color: 'bg-emerald-600' }
                ].map(skinItem => (
                  <button
                    key={skinItem.id}
                    onClick={() => {
                      setBannerSkin(skinItem.id);
                      playFeedPitch(550, 0.04);
                    }}
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] transition hover:scale-110 active:scale-95 border ${
                      bannerSkin === skinItem.id ? 'border-white ring-1 ring-white/50' : 'border-transparent'
                    } ${skinItem.color}`}
                    title={`Unlock and display the ${skinItem.id} profile theme`}
                  >
                    <span className="opacity-0 group-hover:opacity-100">{skinItem.icon}</span>
                  </button>
                ))}
              </div>

              <span className="text-[9px] font-mono text-gray-500 mt-1 hover:text-gray-400 cursor-default select-none tracking-wider hidden md:block">Theme: {selectedBannerStyle.label}</span>
            </div>
          </section>

          {/* COMPACT DAILY STREAK MINI-CARD (Takes minimal vertical space but highly polished!) */}
          <section 
            onClick={() => {
              playFeedPitch(600, 0.05);
              setShowStreakModal(true);
            }}
            className="group bg-gradient-to-r from-amber-950/20 via-[#1b1c1e] to-black/30 border border-amber-500/15 hover:border-amber-400/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer transition-all duration-200 select-none shadow hover:shadow-lg shadow-amber-950/5 hover:shadow-amber-500/5 text-gray-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg animate-bounce shrink-0" style={{ animationDuration: '3s' }}>
                🎁
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Daily Login Gift</h3>
                  <span className="bg-amber-500/15 text-amber-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                    {streakCount}-Day Streak Active
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">
                  {lastClaimedDate === new Date().toDateString() 
                    ? `Awesome! Today's reward is already claimed. Check back tomorrow for your next bonus!` 
                    : "Claim today's check-in bonus! Unlock free Robux and premium limited clothing."
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
              {lastClaimedDate !== new Date().toDateString() && (
                <span className="text-[9.5px] font-mono text-gray-400 bg-black/40 border border-white/5 py-1 px-2 rounded-md">
                  Time left: {timeLeft || '--:--:--'}
                </span>
              )}
              <button 
                className={`px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition transform active:scale-95 whitespace-nowrap ${
                  lastClaimedDate === new Date().toDateString() 
                    ? 'bg-neutral-850 text-gray-400 border border-neutral-800' 
                    : 'bg-amber-500 hover:bg-amber-400 text-black hover:shadow'
                }`}
              >
                {lastClaimedDate === new Date().toDateString() ? 'View Streaks' : 'Claim Reward 🎁'}
              </button>
            </div>
          </section>

          {/* 2. Interactive Scrolling Friends Panel */}
          <section className="bg-[#232527]/40 border border-[#393B3D]/80 rounded-xl p-4.5 space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-sm font-black uppercase text-gray-200 tracking-wider flex items-center gap-1.5">
                👥 Friend Network
                <span className="bg-[#111214] border border-[#393B3D] text-[10px] font-mono font-bold text-green-400 px-2 py-0.5 rounded">
                  {onlineFriends.length} Online
                </span>
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x scroll-smooth custom-scrollbar">
              {unblockedFriends.length === 0 ? (
                <div className="flex-1 py-4 px-5 bg-[#111214]/60 border border-dashed border-[#303336] rounded-xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left select-none">
                  <div className="text-3xl">🕵️‍♀️</div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400">Your Friend Network is Empty</h4>
                    <p className="text-[11px] text-gray-400 max-w-xl leading-relaxed">
                      You haven player connections yet! Scroll down to the <strong className="text-zinc-300">Find Players & Send Friend Requests</strong> widget to connect with other developers instantly.
                    </p>
                  </div>
                </div>
              ) : (
                unblockedFriends.map((friend) => {
                  const playingGame = friend.activeGameId ? games.find(g => g.id === friend.activeGameId) : undefined;
                  return (
                    <div 
                      key={friend.id}
                      onClick={() => {
                        playFeedPitch(500, 0.08);
                        setSelectedProfileFriend(friend);
                      }}
                      className="flex-none w-26 snap-start text-center cursor-pointer group bg-[#111214]/90 hover:bg-[#202224] border border-[#303336] p-2 py-3 rounded-lg transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative mx-auto mb-2 select-none">
                          <div className={`w-11 h-11 rounded-full ${friend.avatarColor} mx-auto flex items-center justify-center font-bold text-gray-950 ring-2 ring-[#393B3D]/50 group-hover:ring-white group-hover:scale-105 transition-all shadow`}>
                            {friend.name.substring(0, 2).toUpperCase()}
                          </div>
                          
                          <span className={`absolute bottom-0 right-5 w-3 h-3 rounded-full border-2 border-[#111214] ${
                            friend.isOnline ? (playingGame ? 'bg-amber-400' : 'bg-green-500') : 'bg-gray-500'
                          }`} title={friend.isOnline ? (playingGame ? 'Playing a game' : 'Online') : 'Offline'} />
                        </div>

                        <div className="font-extrabold text-[11px] text-gray-205 truncate px-0.5" title={friend.name}>
                          {friend.name}
                        </div>
                        
                        {playingGame ? (
                          <div className="text-[8.5px] text-amber-400 font-bold truncate h-3 mt-0.5 flex items-center justify-center gap-0.5" title={`Playing ${playingGame.title}`}>
                            <span className="shrink-0">🎮</span>
                            <span className="truncate">{playingGame.title}</span>
                          </div>
                        ) : (
                          <div className="text-[9px] text-gray-455 truncate h-3 mt-0.5" title={friend.status}>
                            {friend.status}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-[#303336]/40 shrink-0">
                        <span className="text-[9.5px] font-black uppercase text-cyan-400 tracking-wider group-hover:text-cyan-300">
                          Interact
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Find guilds button */}
              <div 
                onClick={() => setSocialTab('clans')}
                className="flex-none w-26 snap-start flex flex-col justify-center items-center py-4 border border-dashed border-[#393B3D] rounded-lg hover:border-gray-400 hover:bg-[#202224] cursor-pointer text-gray-500 hover:text-gray-300 transition-all text-center"
              >
                <UserPlus size={16} className="mb-1.5 text-gray-450" />
                <span className="text-[9px] font-bold uppercase tracking-wider block">Join Guild</span>
              </div>
            </div>
          </section>

          {/* Blocked Users Registry */}
          {blockedUsers.length > 0 && (
            <section className="bg-[#2a1b1b]/35 border border-red-900/35 rounded-xl p-4.5 space-y-2.5 animate-fadeIn">
              <h3 className="text-xs font-black uppercase text-red-300 tracking-wider flex items-center gap-1.5 select-none font-mono">
                🚫 Blocked Players Registry ({blockedUsers.length})
              </h3>
              <p className="text-[11px] text-gray-450 leading-relaxed font-sans">
                You have blocked or ignored these players. They cannot message you, they are unfriended from your social circles, and their feed posts are completely suppressed.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {blockedUsers.map(name => {
                  const fr = friends.find(f => f.name.toLowerCase() === name.toLowerCase());
                  const avatarCol = fr?.avatarColor || "bg-zinc-700";
                  return (
                    <div key={name} className="flex items-center gap-2 bg-black/40 border border-red-500/10 rounded-lg p-1.5 px-3">
                      <div className={`w-4 h-4 rounded-[3px] ${avatarCol} flex items-center justify-center text-gray-950 font-black text-[9px] select-none`}>
                        {name.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-gray-200 select-all font-sans">{name}</span>
                      <button
                        type="button"
                        onClick={() => onToggleBlock && onToggleBlock(name)}
                        className="ml-2 text-[8px] text-red-400 hover:text-red-200 bg-red-950/25 hover:bg-red-950/65 px-2 py-0.5 rounded border border-red-500/20 cursor-pointer uppercase font-black transition-all"
                      >
                        Unblock
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. Continue Playing Segment */}
          <section className="space-y-3.5 pt-0.5">
            <h2 className="text-sm font-black uppercase text-gray-300 tracking-wider flex items-center gap-1.5">
              ⏳ Continued Sandbox Sessions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {continuePlaying.map((game) => (
                <GameCard key={game.id} game={game} onPlay={onPlayGame} />
              ))}
            </div>
          </section>

          {/* SEARCH PLAYERS SECTION */}
          <section className="bg-[#232527]/40 border border-[#393B3D]/80 rounded-xl p-4.5 space-y-3.5">
            <div>
              <h2 className="text-sm font-black uppercase text-gray-100 tracking-wider flex items-center gap-1.5 select-none">
                🔍 Find Players & Send Friend Requests
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">
                Search the local player database or type any username to dynamically discover and connect.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={playerSearchText}
                onChange={(e) => setPlayerSearchText(e.target.value)}
                placeholder="Search usernames (e.g. Telamon, WackyWizard, or type anything...)"
                className="flex-1 bg-black/40 border border-[#393B3D] text-xs px-3.5 rounded-lg focus:outline-none focus:border-cyan-500 text-white placeholder-gray-500 h-9"
              />
              {playerSearchText && (
                <button
                  type="button"
                  onClick={() => {
                    setPlayerSearchText("");
                    playFeedPitch(400, 0.05);
                  }}
                  className="px-3 bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Results Grid / List */}
            {playerSearchText.trim() ? (
              <div className="bg-[#111214]/50 border border-[#303336] rounded-lg p-3 space-y-2">
                <span className="text-[9px] font-bold text-gray-450 uppercase tracking-wider block px-1">
                  Found Players ({getSearchResults().length})
                </span>
                
                {getSearchResults().length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getSearchResults().map((player) => {
                      const reqStatus = friendRequestStatuses[player.name] || 'none';
                      return (
                        <div 
                          key={player.name}
                          className="flex items-center justify-between bg-black/30 border border-[#393B3D] rounded-lg p-2.5 hover:bg-black/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`relative w-9 h-9 rounded-full ${player.avatarColor} flex items-center justify-center text-gray-950 font-extrabold text-xs shrink-0 shadow-sm`}>
                              {player.name.substring(0, 2).toUpperCase()}
                              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black ${
                                player.isOnline ? 'bg-green-500' : 'bg-gray-500'
                              }`} />
                            </div>
                            
                            <div className="min-w-0">
                              <h3 className="font-extrabold text-xs text-white truncate leading-tight">{player.name}</h3>
                              <p className="text-[9px] text-[#8a8d90] truncate leading-none mt-0.5">{player.username}</p>
                              <p className="text-[8px] text-gray-500 italic mt-1 font-sans truncate pr-1 max-w-[120px] sm:max-w-[180px]" title={player.status}>
                                {player.status}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={reqStatus !== 'none'}
                            onClick={() => handleSendFriendRequest(player)}
                            className={`px-3 py-1.5 rounded text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                              reqStatus === 'none' 
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-95'
                                : reqStatus === 'sending'
                                ? 'bg-amber-600/20 border border-amber-500/35 text-amber-300 animate-pulse cursor-not-allowed'
                                : 'bg-green-600/20 border border-green-500/35 text-green-400 cursor-not-allowed'
                            }`}
                          >
                            {reqStatus === 'none' && 'Send Request'}
                            {reqStatus === 'sending' && 'Pending...'}
                            {reqStatus === 'accepted' && '✓ Friends!'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-xs italic">
                    Already friends with this gamer! Search another name.
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                {COMMUNITY_PLAYERS.filter(cp => !friends.some(f => f.name.toLowerCase() === cp.name.toLowerCase())).slice(0, 5).map(player => (
                  <div 
                    key={player.name}
                    className="bg-black/25 border border-[#303336]/60 rounded-lg p-2.5 text-center flex flex-col items-center gap-1.5"
                  >
                    <div className={`w-8 h-8 rounded-full ${player.avatarColor} flex items-center justify-center font-bold text-gray-950 text-[10px] shadow-sm`}>
                      {player.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-[10px] font-black text-gray-200 truncate max-w-full">{player.name}</div>
                    <button
                      type="button"
                      onClick={() => {
                        setPlayerSearchText(player.name);
                        playFeedPitch(550, 0.05);
                      }}
                      className="text-[9px] font-bold text-indigo-400 hover:text-indigo-200 bg-indigo-500/5 hover:bg-indigo-500/10 px-2 py-0.5 rounded transition-all"
                    >
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4. Featured 2D Arcade Space */}
          <section className="space-y-3.5 pt-0.5">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-sm font-black uppercase text-gray-200 tracking-wider flex items-center gap-1.5">
                👾 Scratch-Style 2D Hub
                <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border border-cyan-500/20">
                  Arcade Sandbox
                </span>
              </h2>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 snap-x scroll-smooth custom-scrollbar">
              {games2D.map((game) => (
                <div key={game.id} className="flex-none w-52 snap-start">
                  <GameCard game={game} onPlay={onPlayGame} />
                </div>
              ))}
            </div>
          </section>

          {/* 5. Recommended 3D Experiences */}
          <section className="space-y-3.5 pt-0.5">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-300">
              ✨ recommended global placements
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
              {recommendedGames.map((game) => (
                <GameCard key={game.id} game={game} onPlay={onPlayGame} />
              ))}
            </div>
          </section>

        </div>

      </div>

      {/* FRIEND DYNAMIC OPTIONS OVERLAY MODAL */}
      <AnimatePresence>
        {selectedProfileFriend && (() => {
          const playingGame = selectedProfileFriend.activeGameId ? games.find(g => g.id === selectedProfileFriend.activeGameId) : undefined;
          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                playFeedPitch(350, 0.05);
                setSelectedProfileFriend(null);
              }}
              className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-[1000] cursor-pointer"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-[#1c1d1f] border border-[#484a4c] rounded-xl shadow-2xl p-5 overflow-hidden text-center cursor-default relative text-white"
              >
                {/* Close Button top-right */}
                <button 
                  onClick={() => {
                    playFeedPitch(350, 0.05);
                    setSelectedProfileFriend(null);
                  }}
                  className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-center"
                >
                  <X size={16} />
                </button>

                {/* Profile Header Block */}
                <div className="mt-2 flex flex-col items-center">
                  <div className="relative mb-3 select-none">
                    {/* Big beautiful avatar bubble */}
                    <div className={`w-20 h-20 rounded-full font-black text-3xl text-gray-950 ${selectedProfileFriend.avatarColor} flex items-center justify-center shadow-lg ring-4 ring-[#393B3D]/85`}>
                      {selectedProfileFriend.name.substring(0, 2).toUpperCase()}
                    </div>
                    {/* Status dot in container body */}
                    <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[#1c1d1f] ${
                      selectedProfileFriend.isOnline ? (playingGame ? 'bg-amber-400' : 'bg-green-500') : 'bg-gray-500'
                    }`} />
                  </div>

                  {/* Names titles */}
                  <h3 className="text-lg font-black tracking-tight text-white mb-0.5">{selectedProfileFriend.name}</h3>
                  <p className="text-xs text-gray-400 font-mono">{selectedProfileFriend.username}</p>
                  
                  {/* Presence Status Badging */}
                  <div className="mt-2.5">
                    {selectedProfileFriend.isOnline ? (
                      playingGame ? (
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          🎮 playing right now
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          🟢 Online
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-500/10 border border-gray-500/20 text-gray-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        ⚪ Offline
                      </span>
                    )}
                  </div>
                </div>

                {/* Friend Active Status Bio Quote block statement */}
                <div className="mt-4 p-3 bg-black/25 border border-[#303336]/60 rounded-lg text-xs italic text-gray-300 font-sans max-h-16 overflow-y-auto">
                  "{selectedProfileFriend.status}"
                </div>

                {/* Live Game Status Section inside profile */}
                {playingGame && (
                  <div className="mt-4 p-3.5 bg-gradient-to-r from-emerald-950/20 to-emerald-950/40 border border-emerald-900/30 rounded-xl text-left">
                    <div className="text-[10px] uppercase font-black tracking-wider text-emerald-400 mb-1 flex items-center gap-1 select-none">
                      <span>🕹️</span> active virtual session
                    </div>
                    <div className="font-bold text-xs text-white truncate">{playingGame.title}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 font-sans">By {playingGame.creator}</div>
                  </div>
                )}

                {/* Interactive Action Commands Group items */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {/* Option 1: Chat Button element */}
                  <button
                    onClick={() => {
                      playFeedPitch(500, 0.05);
                      setSelectedProfileFriend(null);
                      onFriendClick(selectedProfileFriend);
                    }}
                    className="w-full bg-[#323436] hover:bg-[#3f4143] text-white border border-[#4e5154] font-black text-xs uppercase tracking-widest py-3 px-2.5 rounded-lg active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <MessageSquare size={16} className="text-cyan-400 shrink-0" />
                    <span>Chat Message</span>
                  </button>

                  {/* Option 2: Join Button element */}
                  {playingGame ? (
                    <button
                      onClick={() => {
                        playFeedPitch(550, 0.08);
                        setTimeout(() => playFeedPitch(850, 0.12), 80);
                        setSelectedProfileFriend(null);
                        onPlayGame(playingGame);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest py-3 px-2.5 rounded-lg active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-emerald-500/25 border border-emerald-400/25"
                    >
                      <Play size={16} fill="currentColor" stroke="none" className="shrink-0 text-white animate-pulse" />
                      <span>Join Game</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-zinc-800/40 text-gray-500 font-black text-xs uppercase tracking-widest py-3 px-2.5 rounded-lg cursor-not-allowed text-center flex flex-col items-center justify-center gap-1.5 border border-[#303336]"
                      title="Friend is not currently playing any experience."
                    >
                      <Lock size={16} className="text-gray-600 shrink-0" />
                      <span>Can't Join</span>
                    </button>
                  )}
                </div>

                {/* Additional Cancel helper */}
                <div className="mt-4">
                  <button 
                    onClick={() => {
                      playFeedPitch(350, 0.05);
                      setSelectedProfileFriend(null);
                    }}
                    className="text-[10px] uppercase font-bold tracking-wider text-gray-500 hover:text-gray-300 underline cursor-pointer"
                  >
                    Close Profile Overview
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {showStreakModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[1500] select-none cursor-pointer"
            onClick={() => {
              playFeedPitch(350, 0.05);
              setShowStreakModal(false);
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#1c1d1f] border border-amber-500/25 rounded-2xl p-5 md:p-6 max-w-2xl w-full relative text-gray-200 cursor-default space-y-5 shadow-2xl shadow-amber-500/5 overflow-y-auto max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => {
                    playFeedPitch(350, 0.05);
                    setShowStreakModal(false);
                  }}
                  className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Title & Stats */}
              <div className="space-y-1 pr-10">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-spin" style={{ animationDuration: '6s' }}>🔥</span>
                  <h2 className="text-base font-black uppercase text-amber-400 tracking-wider">
                    Daily Check-In Rewards
                  </h2>
                  <span className="bg-amber-500/10 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/20 shadow-sm">
                    {streakCount} Day Streak
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Earn free Robux and unlock limited-edition items by logging in consecutive days. Keep the hot streak alive!
                </p>
              </div>

              {/* 7 Day progress tracker grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-1.5">
                {STREAK_REWARDS.map((reward) => {
                  const todayStr = new Date().toDateString();
                  const claimedToday = lastClaimedDate === todayStr;
                  
                  let isClaimed = false;
                  let isActive = false;

                  if (claimedToday) {
                    isClaimed = reward.day <= streakCount;
                  } else {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toDateString();
                    if (lastClaimedDate === yesterdayStr || lastClaimedDate === '') {
                      isClaimed = reward.day < (lastClaimedDate ? streakCount + 1 : 1);
                    } else {
                      isClaimed = false;
                    }
                  }

                  if (!claimedToday) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toDateString();
                    
                    let nextEligibleDay = 1;
                    if (lastClaimedDate === yesterdayStr) {
                      nextEligibleDay = (streakCount % 7) + 1;
                    }
                    isActive = reward.day === nextEligibleDay;
                  }

                  return (
                    <div 
                      key={reward.day}
                      className={`relative rounded-xl border p-3 flex flex-col justify-between items-center text-center transition-all ${
                        isClaimed 
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-900/10' 
                          : isActive 
                            ? 'bg-amber-950/25 border-amber-400 ring-1 ring-amber-400/40 text-amber-100 shadow-md scale-[1.03]' 
                            : 'bg-black/35 border-[#2b2d2f] text-gray-500'
                      }`}
                    >
                      {/* Day count */}
                      <span className={`text-[9.5px] font-black uppercase tracking-wider block ${
                        isActive ? 'text-amber-400 animate-pulse' : isClaimed ? 'text-emerald-400' : 'text-gray-550'
                      }`}>
                        Day {reward.day}
                      </span>

                      {/* Reward Icon */}
                      <div className="my-2.5 relative flex items-center justify-center">
                        <span className={`text-2xl select-none filter drop-shadow ${
                          isActive ? 'animate-bounce' : isClaimed ? 'opacity-90' : 'opacity-40'
                        }`} style={{ animationDuration: '2s' }}>
                          {reward.item ? reward.item.imageUrl : '🪙'}
                        </span>
                        
                        {isClaimed && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border border-[#161718] flex items-center justify-center text-white text-[8px] font-bold select-none shadow">
                            ✓
                          </div>
                        )}
                      </div>

                      {/* Reward Name & Details */}
                      <div className="space-y-0.5">
                        <span className={`text-[10px] font-mono font-black block ${
                          isClaimed ? 'text-emerald-400' : isActive ? 'text-white' : 'text-gray-500'
                        }`}>
                          {reward.robux > 0 ? `+${reward.robux} R$` : ''}
                        </span>
                        {reward.item && (
                          <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1 py-0.5 rounded-xs border block truncate max-w-[80px] ${
                            reward.day === 7 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold' 
                              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-bold'
                          }`}>
                            {reward.day === 7 ? 'Crown' : 'Visor'}
                          </span>
                        )}
                      </div>

                      {/* Glow flash indicator */}
                      {isActive && (
                        <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explaining Loot Details */}
              <div className="bg-[#101112] border border-[#2d2f31] rounded-xl p-3.5 space-y-2 text-xs">
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest block">🎁 Consecutive Milestones:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-400 font-sans">
                  <div className="flex items-start gap-2 bg-black/25 p-2 rounded border border-white/[0.02]">
                    <span className="text-lg">🌌</span>
                    <div>
                      <strong className="text-gray-200">Day 4: Cosmic Streak Visor</strong>
                      <p className="text-[10px] text-gray-500 mt-0.5">Special designer neon visor item equipped instantly on claim.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-black/25 p-2 rounded border border-white/[0.02]">
                    <span className="text-lg">👑</span>
                    <div>
                      <strong className="text-gray-200">Day 7: Ultimate Developer Crown</strong>
                      <p className="text-[10px] text-gray-500 mt-0.5">Strong developer crown badge reflecting true platform dedication.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Countdown & Claim ribbon */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 border-t border-[#303336] pt-4 mt-1">
                <div className="text-xs text-center sm:text-left space-y-0.5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black flex items-center justify-center sm:justify-start gap-1">
                    <Clock size={11} className="text-amber-505 text-amber-405 animate-pulse text-amber-400" />
                    <span>Next Reward Countdown</span>
                  </div>
                  <div className="font-mono text-amber-400 font-extrabold text-xs tracking-wide">
                    {lastClaimedDate === new Date().toDateString() 
                      ? `New Gift Available In: ${timeLeft}`
                      : 'Gift Ready to Claim Right Now!'
                    }
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      playFeedPitch(350, 0.05);
                      setShowStreakModal(false);
                    }}
                    className="px-4 py-2.5 rounded border border-[#393B3D] text-[11px] font-bold hover:bg-[#323436] hover:text-white uppercase tracking-wider transition cursor-pointer text-center flex-1 sm:flex-none"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => {
                      playFeedPitch(550, 0.04);
                      handleClaimReward();
                    }}
                    disabled={lastClaimedDate === new Date().toDateString()}
                    className={`px-5 py-2.5 rounded text-[11px] uppercase font-black tracking-widest transition-all cursor-pointer transform active:scale-95 text-center flex-1 sm:flex-none ${
                      lastClaimedDate === new Date().toDateString()
                        ? 'bg-zinc-900 border border-[#2b2d2f] text-zinc-650 cursor-not-allowed text-gray-500'
                        : 'bg-amber-500 text-black hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/15'
                    }`}
                  >
                    {lastClaimedDate === new Date().toDateString() ? 'Claimed ✓' : 'Claim Daily Gift 🎁'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {claimCelebration && claimCelebration.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[2000] select-none cursor-default"
            onClick={() => setClaimCelebration(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-[#1b1c1e] border border-amber-500/35 rounded-2xl p-6 max-w-sm w-full relative text-center space-y-5 shadow-2xl shadow-amber-500/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setClaimCelebration(null)} 
                  className="text-gray-400 hover:text-white p-1 cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Big reward flash */}
              <div className="space-y-2 pt-2">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-5xl animate-bounce" style={{ animationDuration: '3s' }}>
                  🎉
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">
                  Daily Reward Claimed!
                </h3>
                <p className="text-xs text-gray-400">
                  Consecutive streak is now <span className="text-amber-400 font-bold font-mono text-sm px-1.5 py-0.5 rounded bg-amber-500/10">Day {claimCelebration.dayNum}</span>!
                </p>
              </div>

              {/* Gift specs */}
              <div className="bg-black/45 border border-[#303336] rounded-xl p-4.5 space-y-3">
                <span className="text-xs text-gray-400 block uppercase tracking-wider font-extrabold select-none">Your Loot Unlocked:</span>
                
                <div className="flex flex-col items-center justify-center gap-2">
                  {claimCelebration.robuxAmt > 0 && (
                    <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full text-amber-300 font-mono font-black text-xs shadow-sm">
                      🪙 +{claimCelebration.robuxAmt} Robux
                    </div>
                  )}

                  {claimCelebration.itemName && (
                    <div className="mt-2 text-center space-y-2">
                      <div className="text-4xl filter drop-shadow-md select-none">{claimCelebration.itemEmoji}</div>
                      <div className="text-xs text-amber-300 font-black tracking-wide leading-snug">{claimCelebration.itemName}</div>
                      <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-0.5 rounded font-black uppercase tracking-widest">
                        ⚔️ Added & Equipped
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setClaimCelebration(null)}
                className="w-full py-3.5 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs uppercase font-black tracking-widest transition-all cursor-pointer shadow-lg hover:shadow-amber-500/20 active:scale-98"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Sub Component: Game Render Card
function GameCard({ game, onPlay }: { game: Game; onPlay: (game: Game) => void; key?: React.Key }) {
  return (
    <div 
      onClick={() => onPlay(game)}
      className="group relative bg-[#232527] border border-[#393B3D] hover:border-gray-500 hover:bg-[#323436] rounded p-3 overflow-hidden shadow cursor-pointer transition-all duration-200"
    >
      {/* Dynamic Cover Thumbnail */}
      <div className={`aspect-square w-full rounded bg-gradient-to-br ${game.thumbnail} relative flex items-center justify-center p-4 border border-white/5`}>
        {/* Subtle grid pattern inside */}
        <div className="absolute inset-0 roblox-grid opacity-10" />
        
        {/* Play Icon floating overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 rounded">
          <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow transform scale-90 group-hover:scale-100 transition-transform duration-200">
            <Play fill="currentColor" size={20} className="ml-1 text-black" />
          </div>
        </div>

        {/* Absolute category badge */}
        <span className="absolute top-2 left-2 text-[10px] font-bold tracking-wider uppercase text-white bg-black/60 px-2 py-0.5 rounded">
          {game.category}
        </span>

        {/* 2D badge indicator if the game starts in a 2D viewport */}
        {game.is2D && (
          <span className="absolute top-2 right-2 text-[9px] font-bold tracking-widest uppercase text-[#06b6d4] bg-cyan-950/90 border border-cyan-500/50 px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-10">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
            2D
          </span>
        )}

        {/* Dynamic visual graphics inside the cover */}
        <div className="text-center">
          <span className="text-3xl md:text-4xl filter drop-shadow font-bold select-none text-white opacity-80 group-hover:opacity-100 transition-opacity">
            🎮
          </span>
        </div>
      </div>

      {/* Meta Specs */}
      <div className="mt-3 space-y-1.5">
        <h3 className="font-semibold text-xs md:text-sm text-white group-hover:text-white truncate" title={game.title}>
          {game.title.slice(0, 35)}
        </h3>
        
        <div className="flex justify-between items-center text-[11px] text-gray-400 font-sans">
          {/* Thumb rating */}
          <div className="flex items-center gap-1">
            <ThumbsUp size={11} className="text-green-500" fill="currentColor" />
            <span className="font-semibold text-gray-300">{game.upvoteRatio}%</span>
          </div>

          {/* Active Player count */}
          <div className="flex items-center gap-1 font-mono">
            <Users size={11} className="text-gray-400" />
            <span>{(game.activePlayers / 1000).toFixed(1)}k active</span>
          </div>
        </div>
        
        {/* Creator tagline */}
        <div className="text-[10px] text-gray-400 truncate pt-0.5 border-t border-[#393B3D]">
          By {game.creator}
        </div>
      </div>
    </div>
  );
}
