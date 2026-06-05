import { Game, Friend, ShopItem, Message, Trade, UserExperience } from './types';

export const CURRENT_USER = {
  name: "GamerProX",
  username: "@GamerProX_Studio",
  robux: 14500,
  avatarColor: "from-amber-400 to-orange-500",
  skinColor: "#ffe0b2",
  equippedItems: ["1", "5"] // Fedora of Legend, Voxel Red Cap
};

export const MOCK_GAMES: Game[] = [
  {
    id: "g1",
    title: "Blox Royale Battles",
    thumbnail: "from-rose-500 via-red-600 to-orange-600",
    upvoteRatio: 94,
    activePlayers: 45200,
    creator: "RedShift Games",
    description: "Battle it out in this epic high-intensity arena fight. Unlock standard weapons, level up your avatar, and rule the blocks!",
    category: "Action",
    visits: 12500000,
    createdAt: "2024-01-12"
  },
  {
    id: "g2",
    title: "Brookhaven Neighborhood RP",
    thumbnail: "from-blue-500 via-indigo-600 to-purple-600",
    upvoteRatio: 89,
    activePlayers: 128400,
    creator: "Wolfpaq Studios",
    description: "A place to roleplay with like-minded people. Own and live in amazing houses, drive cool vehicles and explore the city.",
    category: "Roleplay",
    visits: 420000000,
    createdAt: "2020-04-20"
  },
  {
    id: "g3",
    title: "Natural Calamity Survival",
    thumbnail: "from-amber-500 via-orange-600 to-amber-700",
    upvoteRatio: 91,
    activePlayers: 18900,
    creator: "Stickmasterluke",
    description: "Quick! Get to high ground! Natural Calamity Survival challenges you to survive a randomized series of meteor strikes, volcanic floods, and tsunamis.",
    category: "Survival",
    visits: 89000000,
    createdAt: "2018-09-05"
  },
  {
    id: "g4",
    title: "Speed Run Legends IV",
    thumbnail: "from-emerald-400 via-teal-500 to-cyan-600",
    upvoteRatio: 95,
    activePlayers: 11400,
    creator: "Vurse Technologies",
    description: "Speed through 30 unique, mind-bending neon dimensions. Precise platforming skills and rapid reaction times are key to top leaderboard status.",
    category: "Obby",
    visits: 34000000,
    createdAt: "2021-11-30"
  },
  {
    id: "g5",
    title: "Adopt a Pixel Pet",
    thumbnail: "from-fuchsia-400 via-pink-500 to-rose-500",
    upvoteRatio: 87,
    activePlayers: 82100,
    creator: "DreamCraft",
    description: "Adopt, design, and raise cute pixelated companion pets. Construct your dream house, play mini-games, and trade mystical artifacts with fellow collectors.",
    category: "Simulation",
    visits: 180000000,
    createdAt: "2022-07-15"
  },
  {
    id: "g6",
    title: "Mega Obby Mastery",
    thumbnail: "from-teal-400 via-emerald-500 to-green-600",
    upvoteRatio: 92,
    activePlayers: 9300,
    creator: "Vurse Technologies",
    description: "Conquer over 150 meticulously constructed obstacles. Run, jump, and dive over hot neon lasers to collect badges and special trails.",
    category: "Obby",
    visits: 14500005,
    createdAt: "2023-05-18"
  },
  {
    id: "g7",
    title: "Saber Arena Simulator",
    thumbnail: "from-purple-500 via-violet-600 to-blue-600",
    upvoteRatio: 90,
    activePlayers: 14200,
    creator: "RedShift Games",
    description: "Train to wield powerful cosmic energy swords. Unlock legendary blade colors, clash in public arenas, and defeat titan NPC bosses.",
    category: "Fighting",
    visits: 22000000,
    createdAt: "2023-08-22"
  },
  {
    id: "g8",
    title: "Island Tycoon Builder",
    thumbnail: "from-sky-400 via-blue-500 to-indigo-600",
    upvoteRatio: 88,
    activePlayers: 29505,
    creator: "RedShift Games",
    description: "Claim your own tropical island. Set up automated cash miners, expand your base, construct customized helipads and build a magnificent castle.",
    category: "Tycoon",
    visits: 47000000,
    createdAt: "2022-12-01"
  },
  {
    id: "g9",
    title: "Blocky Bird 2D",
    thumbnail: "from-yellow-400 via-orange-500 to-amber-500",
    upvoteRatio: 96,
    activePlayers: 4800,
    creator: "NoCodeMakers",
    description: "Flap through green pipes in this ultra-addictive, retro, physics-based 2D side scroller!",
    category: "Arcade",
    visits: 2300000,
    createdAt: "2025-09-10",
    is2D: true
  },
  {
    id: "g10",
    title: "Pixel Platformer",
    thumbnail: "from-sky-400 via-emerald-500 to-indigo-600",
    upvoteRatio: 92,
    activePlayers: 3101,
    creator: "NoCodeMakers",
    description: "Help Pixel Boy collect golden coins, leap over lava spikes, and escape the level safely in this 2D platformer.",
    category: "Adventure",
    visits: 1200000,
    createdAt: "2025-10-15",
    is2D: true
  },
  {
    id: "g11",
    title: "Retro Snake 2D",
    thumbnail: "from-green-400 via-emerald-600 to-teal-700",
    upvoteRatio: 89,
    activePlayers: 1500,
    creator: "NoCodeMakers",
    description: "A classic snake gameplay: guide the blocky snake to consume pixel apples without crashing into walls or yourself!",
    category: "Retro",
    visits: 890000,
    createdAt: "2025-11-01",
    is2D: true
  },
  {
    id: "g12",
    title: "Cosmic Blaster 2D",
    thumbnail: "from-purple-600 via-pink-600 to-rose-700",
    upvoteRatio: 94,
    activePlayers: 5400,
    creator: "NoCodeMakers",
    description: "An action-packed arcade space survival shooter. Destroy tumbling asteroids and dodge enemy blasters!",
    category: "Arcade",
    visits: 1750000,
    createdAt: "2025-11-20",
    is2D: true
  },
  {
    id: "g13",
    title: "Vibe Sandbox 3D [Test Bed]",
    thumbnail: "from-indigo-500 via-purple-600 to-pink-500",
    upvoteRatio: 98,
    activePlayers: 13500,
    creator: "BloxEngine Systems",
    description: "The official 3D test arena! Guide your customized R6 block avatar model across floating obby steps, avoid the bottom lava, and gather golden stars in a real-time third person space. Fully supports all custom hats, accessories, and skins!",
    category: "Sandbox",
    visits: 9500000,
    createdAt: "2026-05-25",
    is2D: false
  },
  {
    id: "g_s1",
    title: "Flappy Balloon 2D",
    thumbnail: "from-amber-400 via-orange-500 to-red-500",
    upvoteRatio: 96,
    activePlayers: 12000,
    creator: "MicroDevs Studio",
    description: "Launch your red balloon and guide it between shifting concrete spikes! Highly responsive, instant load times, under 1 Megabyte.",
    category: "Arcade",
    visits: 950000,
    createdAt: "2026-01-10",
    is2D: true,
    isShort: true,
    sizeMB: 0.8,
    rating: 4.8,
    ratingCount: 145
  },
  {
    id: "g_s2",
    title: "Pixel Dodge R6",
    thumbnail: "from-teal-500 via-emerald-600 to-indigo-700",
    upvoteRatio: 91,
    activePlayers: 8500,
    creator: "TinyArcade",
    description: "Move your block avatar left and right to dodge high speed tumbling neon pillars. Instant loading, perfect for visual speed tests!",
    category: "Action",
    visits: 890000,
    createdAt: "2026-02-14",
    is2D: true,
    isShort: true,
    sizeMB: 1.2,
    rating: 4.3,
    ratingCount: 92
  },
  {
    id: "g_s3",
    title: "Box Physics Sandbox",
    thumbnail: "from-sky-500 via-cyan-600 to-blue-700",
    upvoteRatio: 94,
    activePlayers: 21500,
    creator: "LegoSimulators",
    description: "A compact 3D environment with zero high-res asset drag. Stack floating platform blocks, leap over glowing hot lava, and collect golden keys instantly.",
    category: "Sandbox",
    visits: 2100000,
    createdAt: "2026-03-01",
    is2D: false,
    isShort: true,
    sizeMB: 2.1,
    rating: 4.6,
    ratingCount: 180
  },
  {
    id: "g_s4",
    title: "Micro Snake Adventure",
    thumbnail: "from-green-500 via-emerald-500 to-sky-600",
    upvoteRatio: 89,
    activePlayers: 4200,
    creator: "CodeShred",
    description: "An incredibly optimized retro snake game. Consume golden blocks to increase in length and break global score registers.",
    category: "Retro",
    visits: 430000,
    createdAt: "2026-03-20",
    is2D: true,
    isShort: true,
    sizeMB: 0.6,
    rating: 4.1,
    ratingCount: 64
  },
  {
    id: "g_s5",
    title: "Speed Clicker 2D",
    thumbnail: "from-purple-500 via-pink-600 to-rose-500",
    upvoteRatio: 88,
    activePlayers: 3400,
    creator: "RapidByte",
    description: "Test your clicking speed and reflexes per second in this neon rapid action grid! Extremely compact memory footprints.",
    category: "Arcade",
    visits: 320000,
    createdAt: "2026-04-05",
    is2D: true,
    isShort: true,
    sizeMB: 0.4,
    rating: 4.0,
    ratingCount: 50
  },
  {
    id: "g_s6",
    title: "Neon Brick Smasher",
    thumbnail: "from-indigo-600 via-purple-700 to-pink-700",
    upvoteRatio: 93,
    activePlayers: 11000,
    creator: "RetroLover",
    description: "Classical arcade bricks-smashing client optimized with zero external sound files. Loaded instantly in any screen size.",
    category: "Arcade",
    visits: 1200000,
    createdAt: "2026-04-12",
    is2D: true,
    isShort: true,
    sizeMB: 1.5,
    rating: 4.5,
    ratingCount: 118
  }
];

export const MOCK_FRIENDS: Friend[] = [
  {
    id: "f1",
    name: "Builderman",
    username: "@builderman",
    avatarColor: "bg-red-500",
    isOnline: true,
    status: "Busy coding Voxel Studio...",
    activeGameId: "g4"
  },
  {
    id: "f2",
    name: "Shedletsky",
    username: "@Shedletsky",
    avatarColor: "bg-yellow-500",
    isOnline: true,
    status: "Buying giant fried chicken parts",
    activeGameId: "g1"
  },
  {
    id: "f3",
    name: "Telamon",
    username: "@Telamon",
    avatarColor: "bg-purple-500",
    isOnline: false,
    status: "Testing sword fight mechanics",
    lastOnline: "2 hours ago"
  },
  {
    id: "f4",
    name: "David.Baszucki",
    username: "@DavidBaszucki",
    avatarColor: "bg-gray-400",
    isOnline: true,
    status: "Reviewing community content creators",
    activeGameId: "g2"
  },
  {
    id: "f5",
    name: "Noob_Master99",
    username: "@noob_master99",
    avatarColor: "bg-green-500",
    isOnline: true,
    status: "Stuck on level 48 of Obby",
    activeGameId: "g3"
  },
  {
    id: "f6",
    name: "Guest 3001",
    username: "@Guest3001",
    avatarColor: "bg-cyan-500",
    isOnline: false,
    status: "Shh, I'm a stealth guest!",
    lastOnline: "1 day ago"
  },
  {
    id: "f7",
    name: "CreeperDestroyer",
    username: "@creeper_dest",
    avatarColor: "bg-amber-500",
    isOnline: true,
    status: "Let's play Saber Arena Simulator!",
    activeGameId: "g1"
  }
];

export const MOCK_SHOP_ITEMS: ShopItem[] = [
  {
    id: "L1",
    name: "Neon Dominus (Limited-U)",
    price: 15400,
    category: "Accessories",
    imageUrl: "🪐",
    color: "from-cyan-400 via-blue-600 to-indigo-800 border-cyan-400 shadow-cyan-900/30",
    purchased: false,
    isLimited: true,
    supply: 42,
    maxSupply: 100,
    priceHistory: [11000, 12500, 11800, 13400, 15400],
    originalPrice: 10000
  },
  {
    id: "L2",
    name: "Void Emperor Crown (Limited-U)",
    price: 6800,
    category: "Accessories",
    imageUrl: "👑",
    color: "from-purple-900 to-neutral-900 border-purple-500 shadow-purple-900/30",
    purchased: false,
    isLimited: true,
    supply: 112,
    maxSupply: 250,
    priceHistory: [4500, 5200, 4900, 5800, 6800],
    originalPrice: 4000
  },
  {
    id: "L3",
    name: "Rainbow Antlers (Limited-U)",
    price: 24500,
    category: "Accessories",
    imageUrl: "🦌",
    color: "from-rose-500 via-yellow-500 via-teal-500 to-purple-600 border-rose-300 shadow-rose-900/30",
    purchased: false,
    isLimited: true,
    supply: 18,
    maxSupply: 50,
    priceHistory: [18000, 19500, 22000, 20500, 24500],
    originalPrice: 15000
  },
  {
    id: "1",
    name: "Fedora of Legend",
    price: 350,
    category: "Accessories",
    imageUrl: "🎩",
    color: "from-zinc-800 to-zinc-900 border-zinc-700",
    purchased: true
  },
  {
    id: "2",
    name: "Valkyrie Helm (Golden Edition)",
    price: 12500,
    category: "Accessories",
    imageUrl: "🪶",
    color: "from-amber-400 to-yellow-500 border-amber-300",
    purchased: false
  },
  {
    id: "3",
    name: "Epic Gamer Neon Visor",
    price: 120,
    category: "Gear",
    imageUrl: "🕶️",
    color: "from-cyan-400 to-blue-500 border-cyan-300",
    purchased: false
  },
  {
    id: "4",
    name: "Cybernetic Wingpack",
    price: 850,
    category: "Accessories",
    imageUrl: "🦋",
    color: "from-indigo-500 to-purple-600 border-indigo-400",
    purchased: false
  },
  {
    id: "5",
    name: "Voxel Red Baseball Cap",
    price: 15,
    category: "Clothing",
    imageUrl: "🧢",
    color: "from-red-500 to-rose-600 border-red-400",
    purchased: true
  },
  {
    id: "6",
    name: "Sapphire Pauldrons",
    price: 450,
    category: "Accessories",
    imageUrl: "🛡️",
    color: "from-blue-500 to-cyan-500 border-blue-400",
    purchased: false
  },
  {
    id: "7",
    name: "The Original Smile Face",
    price: 0,
    category: "Faces",
    imageUrl: "🙂",
    color: "from-yellow-400 to-amber-400 border-yellow-300",
    purchased: true
  },
  {
    id: "8",
    name: "Fiery Sword of Telamon",
    price: 4500,
    category: "Gear",
    imageUrl: "⚔️",
    color: "from-orange-500 to-red-600 border-orange-400",
    purchased: false
  },
  {
    id: "9",
    name: "Oof Beard Outfit",
    price: 150,
    category: "Clothing",
    imageUrl: "🧔",
    color: "from-neutral-700 to-neutral-800 border-neutral-600",
    purchased: false
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: "m1",
    sender: "Builderman",
    username: "@builderman",
    senderColor: "bg-red-500",
    timestamp: "10:32 AM",
    unread: true,
    messages: [
      {
        senderName: "Builderman",
        text: "Hi there! Welcome to the Voxel Web Platform. We are hard at work cooking up the new browser-based 3D Voxel Studio.",
        time: "10:30 AM"
      },
      {
        senderName: "Builderman",
        text: "You can click on the 'Create' tab right now to view your personal developments and test out our Three.js Engine bootloader!",
        time: "10:32 AM"
      }
    ]
  },
  {
    id: "m2",
    sender: "Shedletsky",
    username: "@Shedletsky",
    senderColor: "bg-yellow-500",
    timestamp: "Yesterday",
    unread: false,
    messages: [
      {
        senderName: "Shedletsky",
        text: "Yo! Did you see the new Golden Valkyrie Helm in the Avatar Shop? It looks legendary.",
        time: "Yesterday, 3:15 PM"
      },
      {
        senderName: "GamerProX",
        text: "Yeah, it costs 12,500 Robux though! Need to save up.",
        time: "Yesterday, 3:20 PM"
      },
      {
        senderName: "Shedletsky",
        text: "Let me know if you want to trade any items, I'm open to swap some cool hats.",
        time: "Yesterday, 3:25 PM"
      }
    ]
  },
  {
    id: "m3",
    sender: "David.Baszucki",
    username: "@DavidBaszucki",
    senderColor: "bg-gray-400",
    timestamp: "May 21",
    unread: false,
    messages: [
      {
        senderName: "David.Baszucki",
        text: "Thank you for being an active contributor to the platform! Your feedback on developer tools is extremely useful for us.",
        time: "May 21, 9:00 AM"
      }
    ]
  }
];

export const MOCK_TRADES: Trade[] = [
  {
    id: "t1",
    partner: "Shedletsky",
    partnerAvatarColor: "bg-yellow-500",
    status: "Pending",
    giving: [
      { name: "Fedora of Legend", value: 350 }
    ],
    receiving: [
      { name: "Epic Gamer Neon Visor", value: 120 },
      { name: "Sapphire Pauldrons", value: 450 }
    ],
    valueDifference: 220
  },
  {
    id: "t2",
    partner: "Telamon",
    partnerAvatarColor: "bg-purple-500",
    status: "Completed",
    giving: [
      { name: "Voxel Red Baseball Cap", value: 15 }
    ],
    receiving: [
      { name: "The Original Smile Face", value: 0 }
    ],
    valueDifference: -15
  }
];

export const MOCK_EXPERIENCES: UserExperience[] = [
  {
    id: "e1",
    title: "Obby Land Adventure",
    description: "An ultimate extreme jumping course in the clouds with lava jumps and sliding blocks.",
    status: "Public",
    lastUpdated: "3 days ago",
    visits: 1240,
    createdDate: "2025-11-12",
    gamepasses: [
      { id: "gp1", name: "VIP Gravity Boots", description: "Allows 1.5x jumps inside obby platforms!", price: 250, type: "Gamepass", sales: 12, revenue: 3000, emoji: "🚀" },
      { id: "gp2", name: "Cosmic Star Trails", description: "Emits colorful light sparkles wherever you walk.", price: 100, type: "Gamepass", sales: 24, revenue: 2400, emoji: "✨" }
    ],
    devProducts: [
      { id: "dp1", name: "500 Gold Coins Bundle", description: "Instantly adds 500 currency credits.", price: 50, type: "DevProduct", sales: 40, revenue: 2000, emoji: "🪙" }
    ]
  },
  {
    id: "e2",
    title: "Desert Baseplate Arena",
    description: "A sandbox survival baseplate where players can fight with laser rifles.",
    status: "Private",
    lastUpdated: "5 hours ago",
    visits: 0,
    createdDate: "2026-02-18",
    gamepasses: [],
    devProducts: []
  },
  {
    id: "e3",
    title: "Infinite Tycoon Tycoon",
    description: "Build an epic processing plant that generates infinite bricks.",
    status: "Public",
    lastUpdated: "2 weeks ago",
    visits: 8900,
    createdDate: "2025-05-23",
    gamepasses: [
      { id: "gp3", name: "Auto Collector Robot", description: "Sweeps and pools production drops automatically.", price: 500, type: "Gamepass", sales: 8, revenue: 4000, emoji: "🤖" }
    ],
    devProducts: [
      { id: "dp2", name: "Hyper Engine Boost", description: "Multiplies production speeds by 3x for 5 minutes.", price: 25, type: "DevProduct", sales: 120, revenue: 3000, emoji: "⚡" }
    ]
  }
];
