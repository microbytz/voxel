import React, { useState } from 'react';
import { ShopItem } from '../types';
import { ThumbsUp, Sparkles, Coins, CheckCircle, Flame, UserCheck, ShieldClose, TrendingUp, TrendingDown, ArrowRight, X } from 'lucide-react';

// Live Fluctuating Price Chart for Limited Items using smooth SVG mappings
function QuickPriceChart({ history, price }: { history?: number[], price: number }) {
  const chartHistory = history && history.length > 0 ? history : [price, price];
  
  if (chartHistory.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-zinc-500 font-mono italic">
        Gathering stock metrics...
      </div>
    );
  }

  const padding = 20;
  const height = 120;
  const width = 320;
  
  const minVal = Math.min(...chartHistory) * 0.98; // 2% buffer bottom
  const maxVal = Math.max(...chartHistory) * 1.02; // 2% buffer top
  const valRange = maxVal - minVal || 1;

  const points = chartHistory.map((val, idx) => {
    const x = padding + (idx / (chartHistory.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - minVal) / valRange) * (height - padding * 2);
    return { x, y, value: val };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Gradient path
  const areaPoints = [
    `${points[0].x},${height - padding}`,
    ...points.map(p => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${height - padding}`
  ].join(' ');

  const priceDiff = chartHistory[chartHistory.length - 1] - chartHistory[chartHistory.length - 2];
  const isUp = priceDiff >= 0;
  const strokeColor = isUp ? '#10b981' : '#f43f5e'; // emerald or rose
  const gradientId = `chart-gradient-${Math.floor(Math.random() * 10000)}`;

  return (
    <div className="bg-[#111214] border border-[#393B3D] p-3.5 rounded-lg space-y-2">
      <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-400">
        <span>MARKET TREND TIMELINE</span>
        <span className={`flex items-center gap-1 font-bold ${isUp ? 'text-emerald-400' : 'text-rose-500'}`}>
          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {isUp ? 'SURGING DEMAND (+)' : 'MARKET CORRECTION (-)'}
        </span>
      </div>
      
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1f2022" strokeWidth={1} strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1f2022" strokeWidth={1} strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#393b3d" strokeWidth={1} />

          {/* Area Under Curve */}
          <polygon points={areaPoints} fill={`url(#${gradientId})`} />

          {/* Line Path */}
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
            points={polylinePoints}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p, idx) => {
            const isLast = idx === points.length - 1;
            return (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r={isLast ? 4 : 2}
                fill={isLast ? '#ffffff' : strokeColor}
                stroke={strokeColor}
                strokeWidth={isLast ? 2 : 1}
              />
            );
          })}
        </svg>
      </div>

      <div className="flex justify-between text-[9px] font-mono text-zinc-500">
        <span>{chartHistory.length} ticks ago</span>
        <span className="text-white">Current Val: <b className="font-bold">{chartHistory[chartHistory.length - 1]?.toLocaleString()} R$</b></span>
      </div>
    </div>
  );
}

interface AvatarCustomizerProps {
  userName: string;
  robux: number;
  setRobux: (val: number | ((prev: number) => number)) => void;
  shopItems: ShopItem[];
  setShopItems: (items: ShopItem[] | ((prev: ShopItem[]) => ShopItem[])) => void;
  equippedItems: string[];
  setEquippedItems: (items: string[] | ((prev: string[]) => string[])) => void;
  skinColor: string;
  setSkinColor: (color: string) => void;
  avatarColor: string;
  setAvatarColor: (color: string) => void;
}

export default function AvatarCustomizer({
  userName,
  robux,
  setRobux,
  shopItems,
  setShopItems,
  equippedItems,
  setEquippedItems,
  skinColor,
  setSkinColor,
  avatarColor,
  setAvatarColor
}: AvatarCustomizerProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Clothing' | 'Accessories' | 'Faces' | 'Body' | 'UGC Lab'>('All');
  const [promoCode, setPromoCode] = useState("");
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>([]);
  const [selectedShopItem, setSelectedShopItem] = useState<ShopItem | null>(null);

  // States for Roblox UGC Custom Designer Lab
  const [ugcItemName, setUgcItemName] = useState("");
  const [ugcItemDesc, setUgcItemDesc] = useState("");
  const [ugcItemCategory, setUgcItemCategory] = useState<'Accessories' | 'Clothing' | 'Faces'>('Accessories');
  const [ugcItemPrice, setUgcItemPrice] = useState<number>(350);
  const [ugcItemEmoji, setUgcItemEmoji] = useState("👑");
  const [ugcItemColor, setUgcItemColor] = useState("from-amber-400 via-orange-500 to-red-500 border-amber-400 shadow-amber-900/45");
  const [ugcIsLimited, setUgcIsLimited] = useState(false);
  const [ugcSupply, setUgcSupply] = useState(100);
  const [ugcSuccessNotice, setUgcSuccessNotice] = useState<string | null>(null);

  const handleBuyItemInModal = (item: ShopItem) => {
    if (item.purchased) return;
    if (item.isLimited && item.supply !== undefined && item.supply <= 0) {
      alert("❌ This limited-edition item is fully sold out from the primary store! Use peer-to-peer Trades to acquire it.");
      return;
    }
    if (robux >= item.price) {
      setRobux(prev => prev - item.price);
      setShopItems(prev => prev.map(s => {
        if (s.id === item.id) {
          const currentSupply = s.supply;
          const nextSupply = currentSupply !== undefined ? Math.max(0, currentSupply - 1) : undefined;
          const serial = s.maxSupply && nextSupply !== undefined ? s.maxSupply - nextSupply : undefined;
          return { ...s, purchased: true, supply: nextSupply, serialNumber: serial };
        }
        return s;
      }));
      // Assign serial number locally for this session
      setSelectedShopItem(prev => prev ? { ...prev, purchased: true, serialNumber: item.maxSupply && item.supply !== undefined ? (item.maxSupply - item.supply + 1) : 1 } : null);
      alert(`🎉 Congratulations! You purchased "${item.name}"!\nSerial Number: #${item.maxSupply && item.supply !== undefined ? (item.maxSupply - item.supply + 1) : 1}`);
    } else {
      alert("❌ Insufficient Robux! You can use code ROBUX500, BUILDERMAN or SPARKLES to load free Robux!");
    }
  };

  const handleEquipItemInModal = (item: ShopItem) => {
    const isEquipped = equippedItems.includes(item.id);
    if (isEquipped) {
      if (item.category === 'Faces' && equippedItems.filter(id => {
        const matched = shopItems.find(s => s.id === id);
        return matched?.category === 'Faces';
      }).length <= 1) {
        alert("You must have at least one facial expression equipped!");
        return;
      }
      setEquippedItems(prev => prev.filter(id => id !== item.id));
    } else {
      setEquippedItems(prev => {
        let updated = [...prev];
        if (item.category === 'Faces') {
          updated = updated.filter(id => shopItems.find(s => s.id === id)?.category !== 'Faces');
        }
        if (item.category === 'Clothing') {
          updated = updated.filter(id => shopItems.find(s => s.id === id)?.category !== 'Clothing');
        }
        return [...updated, item.id];
      });
    }
  };

  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoCode.trim().toUpperCase();
    if (!cleanCode) return;

    if (redeemedCodes.includes(cleanCode)) {
      alert(`The promo code "${cleanCode}" has already been redeemed.`);
      return;
    }

    let rewardRobux = 0;
    let message = "";

    switch (cleanCode) {
      case "ROBUX500":
        rewardRobux = 500;
        message = "🎉 Code Redeemed! +500 R$ has been added to your balance.";
        break;
      case "BUILDERMAN":
        rewardRobux = 1000;
        message = "🛠️ Builderman's Blessing: +1000 R$ credited successfully!";
        break;
      case "SPARKLES":
        rewardRobux = 2500;
        message = "✨ Cosmic Spark: +2500 R$ loaded with extreme brilliance!";
        break;
      case "NOOB":
        rewardRobux = 100;
        message = "🟢 Noob Starter Bonus: +100 R$ loaded!";
        break;
      default:
        alert("❌ Invalid promo code! Try using codes like ROBUX500, BUILDERMAN, or SPARKLES.");
        return;
    }

    setRobux(prev => prev + rewardRobux);
    setRedeemedCodes(prev => [...prev, cleanCode]);
    setPromoCode("");
    alert(message);
  };

  // Multi-colored presets for customizer skin colors
  const skinPresets = [
    { name: "Classic Yellow", hex: "#fcd34d", gradient: "from-amber-400 to-yellow-500" },
    { name: "Skins Beige", hex: "#ffe0b2", gradient: "from-orange-200 to-amber-100" },
    { name: "Blox Cyan", hex: "#22d3ee", gradient: "from-cyan-400 to-blue-500" },
    { name: "Noob Green", hex: "#4ade80", gradient: "from-green-400 to-emerald-500" },
    { name: "Core Crimson", hex: "#f87171", gradient: "from-red-400 to-rose-500" }
  ];

  // Filters
  const displayedItems = shopItems.filter(item => {
    return activeTab === 'All' || item.category === activeTab;
  });

  const limitedItems = shopItems.filter(item => item.isLimited);

  const getFluctuation = (history?: number[]) => {
    if (!history || history.length < 2) return { amt: '0.0', isUp: true };
    const latest = history[history.length - 1];
    const prev = history[history.length - 2];
    const diff = latest - prev;
    const pct = ((diff / prev) * 100).toFixed(1);
    return { amt: (diff >= 0 ? '+' : '') + pct, isUp: diff >= 0 };
  };

  // Equip / Purchase Handler
  const handleItemClick = (item: ShopItem) => {
    setSelectedShopItem(item);
  };

  const [previewMode, setPreviewMode] = useState<'2D' | '3D'>('3D');
  const [rotY, setRotY] = useState<number>(0.6);
  const [rotX, setRotX] = useState<number>(0.15);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = React.useRef<boolean>(false);
  const lastMouseRef = React.useRef({ x: 0, y: 0 });

  // Get flat solid colors from Tailwind gradients for 3D body parts
  const getTorsoColorHex = () => {
    if (avatarColor.includes('amber')) return '#f59e0b';
    if (avatarColor.includes('orange')) return '#d97706';
    if (avatarColor.includes('cyan')) return '#06b6d4';
    if (avatarColor.includes('green')) return '#10b981';
    if (avatarColor.includes('red')) return '#f43f5e';
    if (avatarColor.includes('rose')) return '#e11d48';
    if (avatarColor.includes('indigo')) return '#4f46e5';
    if (avatarColor.includes('emerald')) return '#059669';
    return '#f59e0b'; // default R$ Amber
  };

  const getSkinColorHex = () => {
    return skinColor || '#ffe0b2';
  };

  // Extract avatar character specifications for rendering
  const equippedHatsAndGear = shopItems.filter(s => equippedItems.includes(s.id) && s.category !== 'Faces');
  const equippedFace = shopItems.find(s => equippedItems.includes(s.id) && s.category === 'Faces') || { id: '7', name: 'Smile', category: 'Faces', imageUrl: "🙂", color: "", purchased: true, price: 0 };

  // Real-time 3D Preview Engine
  React.useEffect(() => {
    if (previewMode !== '3D' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let autoSpinAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw light wireframe room grid in the background
      ctx.strokeStyle = '#2d2f31';
      ctx.lineWidth = 1;
      
      const gridY = -1.2;
      const gridSize = 4;
      const divisions = 8;
      const projectPoint = (x: number, y: number, z: number) => {
        // Rotations
        const currentRotY = rotY + autoSpinAngle;
        const cosY = Math.cos(currentRotY);
        const sinY = Math.sin(currentRotY);
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);

        // Transform around center
        let rx = x * cosY - z * sinY;
        let rz = x * sinY + z * cosY;

        let ry = y * cosX - rz * sinX;
        let rz2 = y * sinX + rz * cosX;

        const camDist = 7.0; // zoom level
        const focal = 216; // 20% bigger projection scaling (180 * 1.2)
        const finalZ = rz2 + camDist;
        const scale = focal / Math.max(0.1, finalZ);

        return {
          x: canvas.width / 2 + rx * scale,
          y: canvas.height / 2 + 15 - ry * scale, // offset slightly lower
          z: finalZ,
          scale
        };
      };

      // Draw Grid Lines
      for (let i = -divisions; i <= divisions; i++) {
        const coord = (i / divisions) * gridSize;
        // Lines parallel to Z
        const p1 = projectPoint(-gridSize, gridY, coord);
        const p2 = projectPoint(gridSize, gridY, coord);
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        // Lines parallel to X
        const p3 = projectPoint(coord, gridY, -gridSize);
        const p4 = projectPoint(coord, gridY, gridSize);
        if (p3 && p4) {
          ctx.beginPath();
          ctx.moveTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.stroke();
        }
      }

      // Definition of cuboids to draw (Painter's algorithm sorting)
      interface Cuboid {
        cx: number; cy: number; cz: number;
        w: number; h: number; d: number;
        color: string;
        faceSymbol?: string;
        isLimb?: boolean;
        isHeadPart?: boolean;
      }

      const cuboids: Cuboid[] = [];

      // Character body colors
      const skinColorHex = getSkinColorHex();
      const torsoColorHex = getTorsoColorHex();

      // Basic R6 block parts
      // Torso
      cuboids.push({ cx: 0, cy: 0.2, cz: 0, w: 1.2, h: 1.4, d: 0.6, color: torsoColorHex });
      // Head
      cuboids.push({ cx: 0, cy: 1.2, cz: 0, w: 0.7, h: 0.6, d: 0.7, color: skinColorHex, faceSymbol: equippedFace.imageUrl, isHeadPart: true });
      // Left Arm
      cuboids.push({ cx: -0.9, cy: 0.2, cz: 0, w: 0.45, h: 1.4, d: 0.45, color: skinColorHex, isLimb: true });
      // Right Arm
      cuboids.push({ cx: 0.9, cy: 0.2, cz: 0, w: 0.45, h: 1.4, d: 0.45, color: skinColorHex, isLimb: true });
      // Left Leg
      cuboids.push({ cx: -0.32, cy: -0.7, cz: 0, w: 0.48, h: 1.4, d: 0.48, color: '#334155', isLimb: true }); // Indigo jeans legs
      // Right Leg
      cuboids.push({ cx: 0.32, cy: -0.7, cz: 0, w: 0.48, h: 1.4, d: 0.48, color: '#334155', isLimb: true });

      // Equipped Accessory Cuboids
      equippedItems.forEach(itemId => {
        if (itemId === "1") {
          // Fedora of Legend 🎩
          cuboids.push({ cx: 0, cy: 1.5, cz: 0, w: 1.1, h: 0.05, d: 1.1, color: '#18181b', isHeadPart: true }); // Fedora Brim
          cuboids.push({ cx: 0, cy: 1.7, cz: 0, w: 0.6, h: 0.35, d: 0.6, color: '#27272a', isHeadPart: true }); // Crown
          cuboids.push({ cx: 0, cy: 1.58, cz: 0, w: 0.61, h: 0.08, d: 0.61, color: '#dc2626', isHeadPart: true }); // Red Ribbon
        }
        if (itemId === "5") {
          // Baseball cap 🧢
          cuboids.push({ cx: 0, cy: 1.58, cz: 0, w: 0.72, h: 0.2, d: 0.72, color: '#dc2626', isHeadPart: true }); // Red dome
          cuboids.push({ cx: 0, cy: 1.52, cz: -0.4, w: 0.65, h: 0.04, d: 0.3, color: '#dc2626', isHeadPart: true }); // Cap brim
        }
        if (itemId === "3") {
          // Epic Gamer Neon Visor 🕶️
          cuboids.push({ cx: 0, cy: 1.25, cz: -0.4, w: 0.75, h: 0.18, d: 0.1, color: '#06b6d4', isHeadPart: true }); // Glass cyan visor
        }
        if (itemId === "6") {
          // Sapphire Pauldrons 🛡️ (Blue blocks on shoulder)
          cuboids.push({ cx: -0.9, cy: 0.8, cz: 0, w: 0.55, h: 0.3, d: 0.55, color: '#2563eb' });
          cuboids.push({ cx: 0.9, cy: 0.8, cz: 0, w: 0.55, h: 0.3, d: 0.55, color: '#2563eb' });
        }
        if (itemId === "4") {
          // Cybernetic Wingpack 🦋 (Symmetrical glowing wing blocks on back)
          cuboids.push({ cx: -1.1, cy: 0.5, cz: 0.4, w: 1.4, h: 0.3, d: 0.1, color: '#8b5cf6' }); // Purple wings
          cuboids.push({ cx: 1.1, cy: 0.5, cz: 0.4, w: 1.4, h: 0.3, d: 0.1, color: '#8b5cf6' });
        }
        if (itemId === "8") {
          // Fiery Sword of Telamon ⚔️ (Strapped on back)
          cuboids.push({ cx: 0.4, cy: 0.2, cz: 0.55, w: 0.12, h: 2.1, d: 0.12, color: '#f97316' }); // Orange fire blade
          cuboids.push({ cx: 0.4, cy: -0.65, cz: 0.55, w: 0.4, h: 0.12, d: 0.3, color: '#9a3412' }); // Dark gold crossguard
        }
        if (itemId === "2") {
          // Valkyrie Helm (Golden Wings on head) 🪶
          cuboids.push({ cx: -0.4, cy: 1.35, cz: 0, w: 0.1, h: 0.5, d: 0.35, color: '#eab308', isHeadPart: true }); // Wing left
          cuboids.push({ cx: 0.4, cy: 1.35, cz: 0, w: 0.1, h: 0.5, d: 0.35, color: '#eab308', isHeadPart: true }); // Wing right
        }
        if (itemId === "9") {
          // Beard 🧔
          cuboids.push({ cx: 0, cy: 1.05, cz: -0.36, w: 0.5, h: 0.2, d: 0.1, color: '#44403c', isHeadPart: true }); // Stone grey beard base
        }
      });

      // Render Cuboids (Painter's Algorithm Sorting)
      // Standard R6 block rotation point transformations
      const resolvedCuboids = cuboids.map(cub => {
        // Average Z depth of the cuboid center to resolve draw sorting
        const projCenter = projectPoint(cub.cx, cub.cy, cub.cz);
        return {
          ...cub,
          avgZ: projCenter ? projCenter.z : 9999
        };
      });

      // Sort back to front (highest z first)
      resolvedCuboids.sort((a, b) => b.avgZ - a.avgZ);

      // Shadow shift helper
      const getShadedColor = (hex: string, percent: number) => {
        let f = parseInt(hex.replace('#', ''), 16),
            t = percent < 0 ? 0 : 255,
            p = percent < 0 ? percent * -1 : percent,
            R = f >> 16,
            G = (f >> 8) & 0x00FF,
            B = f & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((t - R) * (p / 100)) + R) * 0x10000 + (Math.round((t - G) * (p / 100)) + G) * 0x100 + (Math.round((t - B) * (p / 100)) + B)).toString(16).slice(1);
      };

      // Dynamic look/scanning head rotations (avatar head shouldn't be ideal & frozen!)
      const headRotY = Math.sin(Date.now() * 0.0022) * 0.42;
      const headRotX = Math.cos(Date.now() * 0.0031) * 0.12;

      interface GlobalFaceCustomizer {
        p1: { x: number; y: number; z: number; scale: number };
        p2: { x: number; y: number; z: number; scale: number };
        p3: { x: number; y: number; z: number; scale: number };
        p4: { x: number; y: number; z: number; scale: number };
        color: string;
        shadow: number;
        avgZ: number;
        faceSymbol?: string;
        isFront?: boolean;
      }

      const globalFaces: GlobalFaceCustomizer[] = [];

      resolvedCuboids.forEach(cub => {
        const x0 = cub.cx - cub.w / 2; const x1 = cub.cx + cub.w / 2;
        const y0 = cub.cy - cub.h / 2; const y1 = cub.cy + cub.h / 2;
        const z0 = cub.cz - cub.d / 2; const z1 = cub.cz + cub.d / 2;

        let cubVertices = [
          { x: x0, y: y0, z: z0 }, // 0
          { x: x1, y: y0, z: z0 }, // 1
          { x: x1, y: y1, z: z0 }, // 2
          { x: x0, y: y1, z: z0 }, // 3
          { x: x0, y: y0, z: z1 }, // 4
          { x: x1, y: y0, z: z1 }, // 5
          { x: x1, y: y1, z: z1 }, // 6
          { x: x0, y: y1, z: z1 }  // 7
        ];

        // Process head part rotation around head anchor: (0, 1.2, 0)
        if (cub.isHeadPart) {
          cubVertices = cubVertices.map(v => {
            let tx = v.x;
            let ty = v.y - 1.2;
            let tz = v.z;

            // X-axis tilt (pitch)
            const cosH_X = Math.cos(headRotX);
            const sinH_X = Math.sin(headRotX);
            let ty1 = ty * cosH_X - tz * sinH_X;
            let tz1 = ty * sinH_X + tz * cosH_X;

            // Y-axis yaw
            const cosH_Y = Math.cos(headRotY);
            const sinH_Y = Math.sin(headRotY);
            let tx2 = tx * cosH_Y - tz1 * sinH_Y;
            let tz2 = tx * sinH_Y + tz1 * cosH_Y;

            return {
              x: tx2,
              y: ty1 + 1.2,
              z: tz2
            };
          });
        }

        const projectedVerts = cubVertices.map(v => projectPoint(v.x, v.y, v.z));

        // Face topology references
        const faces = [
          { indices: [0, 1, 2, 3], shadow: -15, isFront: true }, // Front (has smile!)
          { indices: [4, 5, 6, 7], shadow: 10, isFront: false }, // Back
          { indices: [1, 5, 6, 2], shadow: -5, isFront: false },  // Right
          { indices: [0, 4, 7, 3], shadow: -25, isFront: false }, // Left
          { indices: [0, 1, 5, 4], shadow: -35, isFront: false }, // Bottom
          { indices: [3, 2, 6, 7], shadow: 15, isFront: false }   // Top
        ];

        faces.forEach(face => {
          const p1 = projectedVerts[face.indices[0]];
          const p2 = projectedVerts[face.indices[1]];
          const p3 = projectedVerts[face.indices[2]];
          const p4 = projectedVerts[face.indices[3]];

          if (p1 && p2 && p3 && p4) {
            const avgZ = (p1.z + p2.z + p3.z + p4.z) / 4;
            globalFaces.push({
              p1, p2, p3, p4,
              color: cub.color,
              shadow: face.shadow,
              avgZ,
              faceSymbol: face.isFront ? cub.faceSymbol : undefined,
              isFront: face.isFront
            });
          }
        });
      });

      // Sort ALL individual faces across any body parts from back to front globally (lowest avgZ last)
      globalFaces.sort((a, b) => b.avgZ - a.avgZ);

      // Now draw them
      globalFaces.forEach(face => {
        ctx.beginPath();
        ctx.moveTo(face.p1.x, face.p1.y);
        ctx.lineTo(face.p2.x, face.p2.y);
        ctx.lineTo(face.p3.x, face.p3.y);
        ctx.lineTo(face.p4.x, face.p4.y);
        ctx.closePath();

        ctx.fillStyle = getShadedColor(face.color, face.shadow);
        ctx.fill();
        
        ctx.strokeStyle = getShadedColor(face.color, face.shadow - 12);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw smile/expression on facing surfaces
        if (face.isFront && face.faceSymbol) {
          const winding = (face.p2.x - face.p1.x) * (face.p3.y - face.p1.y) - (face.p2.y - face.p1.y) * (face.p3.x - face.p1.x);
          if (winding > 0) {
            const fx = (face.p1.x + face.p2.x + face.p3.x + face.p4.x) / 4;
            const fy = (face.p1.y + face.p2.y + face.p3.y + face.p4.y) / 4;
            ctx.save();
            ctx.fillStyle = '#000000';
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(face.faceSymbol, fx, fy);
            ctx.restore();
          }
        }
      });

      // Show instruction in the 3D studio orbit canvas
      ctx.save();
      ctx.fillStyle = '#71717a';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText("3D CANVAS ACTIVE - DRAG TO ROTATE MODEL", canvas.width / 2, 18);
      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [previewMode, rotY, rotX, skinColor, avatarColor, equippedItems]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    
    setRotY(prev => prev + dx * 0.015);
    setRotX(prev => Math.max(-0.6, Math.min(0.6, prev + dy * 0.015)));
    
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };


  return (
    <div className="w-full text-gray-200 p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans animate-fadeIn select-none">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-3 border-b border-[#393B3D]">
        <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
          🧑‍🎨 Avatar Customizer Shop
        </h2>
        <span className="text-xs bg-[#111214] px-3 py-1 border border-[#393B3D] rounded text-white font-mono font-bold">
          Budget: {robux.toLocaleString()} R$
        </span>
      </div>

      {/* THE TRADING FLOOR: LIVE LIMITEDS STOCK TICKER */}
      <div className="bg-[#111214] border border-[#393B3D] rounded p-3 select-none relative shadow-inner space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider text-gray-400 border-b border-[#393B3D]/30 pb-1.5">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            THE TRADING FLOOR: LIVE ASSET TICKER
          </span>
          <span className="text-zinc-500 uppercase">Fluctuating Simulated Value</span>
        </div>
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
          {limitedItems.map(item => {
            const fluc = getFluctuation(item.priceHistory);
            return (
              <div 
                key={item.id} 
                className="flex items-center gap-2 px-3 py-1.5 bg-[#232527] hover:bg-[#2d2f32] active:scale-95 border border-[#393B3D] hover:border-gray-500 transition-all rounded cursor-pointer shrink-0"
                onClick={() => setSelectedShopItem(item)}
              >
                <span className="text-base">{item.imageUrl}</span>
                <div className="flex flex-col text-[11px] min-w-[100px]">
                  <span className="font-bold text-white truncate max-w-[110px]">{item.name.replace(' (Limited-U)', '')}</span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-mono text-amber-500 font-extrabold">{item.price.toLocaleString()} R$</span>
                    <span className={`font-mono font-bold ${fluc.isUp ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {fluc.isUp ? '▲' : '▼'}{fluc.amt}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: 2D or 3D Preview Box (4 columns) */}
        <div className="lg:col-span-4 bg-[#232527] border border-[#393B3D] rounded p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-col space-y-2 border-b border-[#393B3D] pb-3">
            <div className="text-center font-display font-bold text-xs text-gray-400 uppercase tracking-wider">
              Avatar Preview Room
            </div>
            {/* 2D / 3D Segment Toggle */}
            <div className="grid grid-cols-2 gap-1 bg-[#111214] p-1 rounded border border-[#393B3D]">
              <button
                type="button"
                onClick={() => setPreviewMode('2D')}
                className={`py-1 rounded text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  previewMode === '2D'
                    ? 'bg-[#393B3D] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                💾 2D Section
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('3D')}
                className={`py-1 rounded text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  previewMode === '3D'
                    ? 'bg-[#393B3D] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ✨ 3D Section
              </button>
            </div>
          </div>

          {previewMode === '2D' ? (
            /* Interactive Block-Stylized Human Render (Section 1) */
            <div className="relative h-64 bg-[#111214] border border-[#393B3D] rounded flex flex-col justify-center items-center overflow-hidden">
              <div className="absolute inset-0 roblox-grid opacity-15" />
              
              {/* The constructed character model */}
              <div className="relative flex flex-col items-center pt-1.5 origin-center transition-transform duration-350" style={{ transform: 'scale(1.2)' }}>
                {/* Floating Head block */}
                <div 
                  className="w-16 h-16 rounded-md relative flex items-center justify-center shadow-lg transition-colors border border-white/5"
                  style={{ backgroundColor: skinColor }}
                >
                  {/* Embedded expression face symbol */}
                  <span className="text-3xl filter drop-shadow absolute">{equippedFace.imageUrl}</span>

                  {/* Hat placement */}
                  {equippedHatsAndGear.map((hat, idx) => (
                    <span 
                      key={hat.id} 
                      className="text-4xl absolute -top-5 z-20 filter drop-shadow-md animate-bounce"
                      style={{ animationDelay: `${idx * 150}ms`, animationDuration: '3s' }}
                    >
                      {hat.imageUrl}
                    </span>
                  ))}
                </div>

                {/* Shoulders / Torso block */}
                <div 
                  className={`w-28 h-20 rounded-t-lg mt-1 w-full bg-gradient-to-tr ${avatarColor} relative flex items-center justify-center border border-white/5`}
                >
                  {/* Shirt Badge representation */}
                  <div className="bg-black/40 border border-white/10 px-2.5 py-1 text-[9px] font-bold text-white uppercase tracking-widest rounded-full scale-90">
                    {userName.substring(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* Legs block (simulated blocky feet) */}
                <div className="flex gap-2 w-24 h-12 mt-1">
                  <div className="flex-1 bg-zinc-700/85 rounded-b" />
                  <div className="flex-1 bg-zinc-700/85 rounded-b" />
                </div>
              </div>

              {/* Quick specifications label */}
              <span className="absolute bottom-3 text-[9px] text-zinc-500 font-mono tracking-widest uppercase">
                FLAT 2D CANVAS ACTIVE
              </span>
            </div>
          ) : (
            /* Rotating Orbital R6 3D Canvas Visualizer (Section 2) */
            <div className="flex flex-col space-y-2">
              <div className="relative h-64 bg-[#111214] border border-[#393B3D] rounded overflow-hidden flex items-center justify-center cursor-move">
                <div className="absolute inset-0 roblox-grid opacity-10 pointer-events-none" />
                <canvas
                  id="avatar_3d_canvas"
                  ref={canvasRef}
                  width={240}
                  height={240}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  className="w-full h-full block bg-transparent"
                />

                {/* Quick reset option */}
                <button
                  type="button"
                  onClick={() => {
                    setRotY(0.6);
                    setRotX(0.15);
                  }}
                  className="absolute bottom-2 right-2 p-1.5 px-2 bg-[#232527]/90 active:bg-zinc-800 border border-[#393B3D] text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 hover:text-white rounded shadow-md cursor-pointer transition-colors"
                >
                  Reset Angle
                </button>
              </div>

              {/* Manual rotation sliders */}
              <div className="space-y-1.5 text-xs text-zinc-400 font-mono">
                <div className="flex justify-between items-center">
                  <span>Orbit Angle:</span>
                  <span className="text-white font-bold">{(Math.round(rotY * 57.29) % 360)}°</span>
                </div>
                <input 
                  type="range"
                  min="-3.14"
                  max="3.14" 
                  step="0.05"
                  value={rotY}
                  onChange={(e) => setRotY(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-[#111214] rounded-lg border-none h-1.5 cursor-pointer appearance-none"
                />
              </div>
            </div>
          )}

          {/* Skin Selection panel */}
          <div className="space-y-2 pt-2 border-t border-[#393B3D]">
            <span className="block text-xs font-semibold text-gray-400">Select Skin Base:</span>
            <div className="flex gap-2 justify-between">
              {skinPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setSkinColor(preset.hex);
                    setAvatarColor(preset.gradient);
                  }}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-transform border ${
                    skinColor === preset.hex 
                      ? 'scale-110 ring-2 ring-white border-transparent shadow' 
                      : 'border-[#393B3D] hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* Promo Code Redeemer Panel */}
          <div className="space-y-2.5 pt-3.5 border-t border-[#393B3D] font-sans">
            <span className="block text-xs font-semibold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              🎁 Promo Code Hub
            </span>
            <form onSubmit={handleRedeemCode} className="flex gap-1.5">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 min-w-0 bg-[#111214] border border-[#393B3D] focus:border-amber-500 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-100 outline-none transition-all placeholder-zinc-600 uppercase"
                placeholder="PROMO CODE"
                maxLength={20}
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 text-xs font-bold font-sans transition-all cursor-pointer shadow-md shrink-0"
              >
                Redeem
              </button>
            </form>
            <p className="text-[9px] text-[#34d399] font-mono leading-relaxed bg-[#111214]/60 p-2 rounded border border-[#393B3D]/30">
              Try code <span className="font-bold underline text-white">ROBUX500</span>, <span className="font-bold underline text-white">BUILDERMAN</span>, or <span className="font-bold underline text-white">SPARKLES</span>!
            </p>
          </div>
        </div>

        {/* Right Section: Shop and Inventory Tabs (8 columns) */}
        <div className="lg:col-span-8 bg-[#232527] border border-[#393B3D] rounded p-5 flex flex-col space-y-4">
          
          {/* Menu Type Selector */}
          <div className="flex gap-2 border-b border-[#393B3D] pb-2 overflow-x-auto">
            {(['All', 'Accessories', 'Clothing', 'Faces', 'Body', 'UGC Lab'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-3.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 ${
                  activeTab === type
                    ? type === 'UGC Lab'
                      ? 'bg-amber-500 border border-amber-400 text-black font-black shadow-lg shadow-amber-500/10'
                      : 'bg-[#393B3D] border border-white/20 text-white'
                    : type === 'UGC Lab'
                      ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-[#323436]'
                }`}
              >
                {type === 'UGC Lab' ? '✨ UGC Designer' : type}
              </button>
            ))}
          </div>

          {/* Grid display items */}
          {activeTab === 'UGC Lab' ? (
            /* UGC Designer Workspace module */
            <div className="bg-[#111214] border border-[#393B3D] rounded-xl p-4 md:p-5 text-gray-200 space-y-5 animate-fadeIn">
              {/* Top description */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#303336] pb-3.5">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-mono font-black text-amber-400 tracking-widest block">UGC Custom Design Lab</span>
                  <h3 className="text-sm font-black text-white">Create & Sell Custom Catalog Accessories</h3>
                  <p className="text-[11px] text-gray-400">Design custom items, establish pricing, and watch public NPCs organically buy your UGC on the Marketplace Catalog!</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded px-2.5 py-1 text-right shrink-0">
                  <span className="text-[8px] text-amber-450 font-mono block uppercase">Your commission share:</span>
                  <span className="text-xs font-mono font-bold text-amber-300">70% Payout 💰</span>
                </div>
              </div>

              {ugcSuccessNotice && (
                <div className="bg-emerald-950/25 border border-emerald-500/30 rounded-lg p-2.5 text-emerald-300 text-xs flex justify-between items-center font-sans">
                  <span>{ugcSuccessNotice}</span>
                  <button onClick={() => setUgcSuccessNotice(null)} className="text-emerald-500 hover:text-white font-mono cursor-pointer text-sm font-extrabold ml-2">✕</button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Visual Thumbnail Preview (5 cols) */}
                <div className="md:col-span-5 flex flex-col items-center space-y-3 bg-[#16171a] p-4 rounded-xl border border-white/[0.02]">
                  <span className="text-[9px] font-mono font-black text-gray-400 tracking-wider">MARTEKPLACE CATALOG THUMBNAIL</span>
                  
                  {/* Item card */}
                  <div className="w-full max-w-[170px] bg-[#111214] border-2 border-[#393b3d] rounded-xl p-3.5 text-center flex flex-col justify-between relative shadow-2xl">
                    <div className={`aspect-square w-full rounded bg-gradient-to-br ${ugcItemColor} flex items-center justify-center text-5xl relative border border-white/5`}>
                      {ugcItemEmoji}
                      {ugcIsLimited && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-emerald-600/95 text-[7.5px] font-black text-white rounded border border-emerald-400/20 uppercase tracking-widest">
                          Limited-U
                        </span>
                      )}
                    </div>

                    <div className="mt-3.5 space-y-1">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-amber-400 block font-mono">
                        {ugcItemCategory}
                      </span>
                      <h4 className="font-extrabold text-[11px] text-white truncate max-w-[130px] mx-auto">
                        {ugcItemName || "UGC Custom Item"}
                      </h4>
                      {ugcIsLimited && (
                        <div className="text-[8px] text-emerald-400 font-mono font-black flex justify-between items-center bg-emerald-950/30 px-1 py-0.5 rounded border border-emerald-500/10 max-w-[120px] mx-auto">
                          <span>SUPPLY:</span>
                          <span>{ugcSupply} / {ugcSupply}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-center gap-1 text-[11px] font-black text-[#55ffa5] font-mono select-none pt-0.5">
                        <span>🪙</span>
                        <span>{ugcItemPrice.toLocaleString()} R$</span>
                      </div>
                    </div>
                  </div>
                  
                  <span className="text-[9px] text-gray-500 font-sans italic text-center max-w-[160px] leading-relaxed">Your custom item will render dynamically everywhere inside the Roblox catalog.</span>
                </div>

                {/* Form Controls (7 cols) */}
                <div className="md:col-span-7 space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono font-extrabold text-gray-400 tracking-wider">Item Name</label>
                    <input 
                      type="text" 
                      value={ugcItemName}
                      onChange={e => setUgcItemName(e.target.value)}
                      placeholder="e.g., Crown of Cosmic Light, Cyberpunk Neon Visor"
                      maxLength={32}
                      className="w-full bg-[#1c1d1f] border border-[#393b3d] rounded px-3 py-1.5 text-xs font-sans text-white focus:border-amber-450 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-mono font-extrabold text-gray-400 tracking-wider">Category</label>
                      <select 
                        value={ugcItemCategory}
                        onChange={e => setUgcItemCategory(e.target.value as any)}
                        className="w-full bg-[#1c1d1f] border border-[#393b3d] rounded px-2 py-1.5 text-xs font-sans text-white focus:border-amber-450 outline-none cursor-pointer"
                      >
                        <option value="Accessories">Accessories 👑</option>
                        <option value="Clothing">Clothing 🧣</option>
                        <option value="Faces">Faces 😊</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-mono font-extrabold text-[#55ffa5] tracking-wider">Price (R$)</label>
                      <input 
                        type="number" 
                        value={ugcItemPrice}
                        onChange={e => setUgcItemPrice(Math.max(10, Math.min(1000000, Number(e.target.value))))}
                        className="w-full bg-[#1c1d1f] border border-[#393b3d] rounded px-3 py-1.5 text-xs font-mono text-white focus:border-amber-450 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Pick Item Icon / Emoji */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono font-extrabold text-gray-400 tracking-wider">Design Icon (Emoji)</label>
                    <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                      {["👑", "🪐", "🚀", "⚡", "💎", "🐉", "😈", "🎩", "🧢", "🎒", "🧣", "🕶️", "👓", "🛡️", "🔥", "🐱", "🍩", "💖", "🍕"].map(emoji => (
                        <button 
                          key={emoji}
                          onClick={() => setUgcItemEmoji(emoji)}
                          className={`w-8.5 h-8.5 rounded bg-[#1c1d1f] hover:bg-[#323436] flex items-center justify-center text-lg shrink-0 cursor-pointer border transition ${
                            ugcItemEmoji === emoji ? 'border-amber-500 bg-amber-500/10' : 'border-white/5'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pick Backdrop Theme Gradient */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono font-extrabold text-gray-400 tracking-wider">Thumbnail Gradient Backdrop</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { name: "Gold Aura", class: "from-amber-400 via-orange-500 to-red-500 border-amber-400 shadow-amber-900/40" },
                        { name: "Dark Void", class: "from-gray-900 via-purple-950 to-black border-purple-600 shadow-purple-900/40" },
                        { name: "Glitch Neon", class: "from-blue-500 via-indigo-600 to-teal-400 border-indigo-400 shadow-indigo-900/30" },
                        { name: "Inferno", class: "from-red-600 via-orange-500 to-yellow-600 border-red-500 shadow-red-950/45" },
                        { name: "Emerald", class: "from-emerald-400 via-teal-600 to-cyan-700 border-emerald-400 shadow-emerald-950/35" },
                        { name: "Pastel Wave", class: "from-pink-400 via-purple-400 to-indigo-400 border-pink-300 shadow-pink-900/20" }
                      ].map(theme => (
                        <button 
                          key={theme.name}
                          onClick={() => setUgcItemColor(theme.class)}
                          className={`p-1.5 rounded text-[9px] text-center font-bold text-white bg-[#1c1d1f] hover:bg-neutral-800 cursor-pointer border transition flex flex-col items-center gap-1 ${
                            ugcItemColor === theme.class ? 'border-amber-500 text-white' : 'border-white/5 text-gray-400'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${theme.class}`} />
                          <span className="truncate max-w-[55px]">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Limited Edition Selection */}
                  <div className="bg-[#18191b] p-3 rounded-lg space-y-3 border border-[#2c2e30]">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-extrabold block text-white">Limited Edition (Limited-U)</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Enforce a rigid supply ceiling. Highly attracts bids!</span>
                      </div>
                      <button 
                        onClick={() => setUgcIsLimited(!ugcIsLimited)}
                        className={`w-9 h-6 rounded-full flex items-center p-1 cursor-pointer transition ${
                          ugcIsLimited ? 'bg-emerald-500 justify-end' : 'bg-zinc-700 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                      </button>
                    </div>

                    {ugcIsLimited && (
                      <div className="flex items-center gap-2.5 animate-fadeIn">
                        <span className="text-[10px] font-mono text-gray-400 whitespace-nowrap">Initial Market Stock:</span>
                        <input 
                          type="number" 
                          value={ugcSupply}
                          onChange={e => setUgcSupply(Math.max(5, Math.min(2500, Number(e.target.value))))}
                          className="w-20 bg-[#111214] border border-[#393b3d] rounded px-2 py-0.5 text-xs font-mono text-[#55ffa5] outline-none"
                        />
                        <span className="text-[9.5px] text-gray-500 font-sans">(5 to 2,500 units ceiling)</span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      if (!ugcItemName.trim()) {
                        alert("⚠️ Please designate a custom name for your masterfully designed UGC item first!");
                        return;
                      }
                      
                      const newId = `ugc_${Date.now()}`;
                      const formattedName = ugcItemName.trim() + (ugcItemName.toUpperCase().includes("UGC") ? "" : " (UGC)");
                      
                      const newShopItem: ShopItem = {
                        id: newId,
                        name: formattedName,
                        price: ugcItemPrice,
                        category: ugcItemCategory,
                        imageUrl: ugcItemEmoji,
                        color: ugcItemColor,
                        purchased: true, // Auto purchased / locked by the designer!
                        isLimited: ugcIsLimited,
                        supply: ugcIsLimited ? ugcSupply : undefined,
                        maxSupply: ugcIsLimited ? ugcSupply : undefined,
                        priceHistory: [ugcItemPrice],
                        originalPrice: ugcItemPrice,
                        isCreatorItem: true,
                        creatorName: userName,
                        salesCount: 0,
                        earnings: 0
                      };

                      // Click sound pitch
                      try {
                        const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const osc1 = ac.createOscillator();
                        const osc2 = ac.createOscillator();
                        const gn = ac.createGain();
                        
                        osc1.frequency.setValueAtTime(587.33, ac.currentTime); // D5
                        osc2.frequency.setValueAtTime(880.00, ac.currentTime); // A5
                        osc1.connect(gn);
                        osc2.connect(gn);
                        gn.connect(ac.destination);
                        
                        gn.gain.setValueAtTime(0.04, ac.currentTime);
                        gn.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
                        osc1.start();
                        osc2.start();
                        osc1.stop(ac.currentTime + 0.35);
                        osc2.stop(ac.currentTime + 0.35);
                      } catch(e){}

                      setShopItems(prev => [newShopItem, ...prev]);
                      // Auto equip
                      setEquippedItems(prev => [...prev, newId]);
                      
                      setUgcSuccessNotice(`🎉 Successfully uploaded custom UGC "${formattedName}"! The item was automatically added to your inventory/equipped and is now live on the simulated marketplace.`);
                      
                      // Clear form
                      setUgcItemName("");
                      setUgcItemPrice(350);
                      setTimeout(() => setUgcSuccessNotice(null), 8000);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-black text-xs uppercase tracking-widest rounded transition-all cursor-pointer shadow hover:shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    🚀 Publish Item to Roblox Catalog
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'Body' ? (
            /* Customizing body parts info */
            <div className="py-14 text-center bg-[#111214] border border-[#393B3D] rounded space-y-2">
              <span className="text-3xl block">🧍</span>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Select from skin presets on the left panel. Customized 3D physics scale proportions can be configured inside Game Studio workspace parameters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[360px] pr-2">
              {displayedItems.map((item) => {
                const isEquipped = equippedItems.includes(item.id);
                const isLtd = item.isLimited;
                const isSoldOut = isLtd && item.supply !== undefined && item.supply <= 0;
                
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3 relative rounded border flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] ${
                      isEquipped
                        ? 'bg-[#323436] border-white shadow-md'
                        : item.purchased
                          ? 'bg-[#111214]/85 border-[#393B3D] hover:border-gray-400'
                          : isLtd
                            ? 'bg-[#111214] border-emerald-500/80 hover:border-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.2)] font-sans'
                            : 'bg-[#111214] border-[#393B3D] opacity-90 hover:opacity-100 hover:border-gray-400'
                    }`}
                  >
                    {/* Item Avatar Graphic thumbnail */}
                    <div className={`aspect-square w-full rounded bg-gradient-to-br ${item.color} flex items-center justify-center text-4xl border border-white/5 relative`}>
                      {item.imageUrl}
                      
                      {/* LTD badge */}
                      {isLtd && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-emerald-600/90 text-[8px] font-black text-white rounded border border-emerald-400/30 uppercase tracking-wider select-none leading-none">
                          Limited
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      <h4 className="font-semibold text-xs text-white truncate" title={item.name}>
                        {item.name}
                      </h4>
                      
                      {/* Supply indicator */}
                      {isLtd && !item.purchased && (
                        <div className="text-[9px] text-emerald-400 font-mono font-bold flex justify-between items-center bg-emerald-950/20 px-1 py-0.5 rounded border border-emerald-500/10">
                          <span>SUPPLY:</span>
                          <span>{isSoldOut ? "SOLD OUT" : `${item.supply} / ${item.maxSupply}`}</span>
                        </div>
                      )}

                      {isLtd && item.purchased && (
                        <div className="text-[9px] text-zinc-400 font-mono flex justify-between items-center bg-zinc-900/30 px-1 py-0.5 rounded border border-zinc-800/40">
                          <span>SERIAL:</span>
                          <span className="text-white font-bold">#{item.serialNumber || (item.id === 'L1' ? '42' : item.id === 'L2' ? '12' : '3')}</span>
                        </div>
                      )}
                      
                      {/* Price / Equipped label */}
                      <div className="flex justify-between items-center text-[10px] font-bold pt-0.5">
                        <span className="text-gray-400 uppercase tracking-wide">
                          {item.category}
                        </span>

                        {isEquipped ? (
                          <span className="text-white font-bold flex items-center gap-0.5 uppercase tracking-wide text-[9px] bg-[#393B3D]/80 px-1.5 py-0.5 rounded">
                            Equipped
                          </span>
                        ) : item.purchased ? (
                          <span className="text-emerald-400 flex items-center gap-0.5 uppercase tracking-wider text-[9px] bg-emerald-950/40 px-1.5 py-0.5 rounded font-black border border-emerald-500/10">
                            Owned
                          </span>
                        ) : isSoldOut ? (
                          <span className="text-red-400 font-black text-[9px] bg-red-950/30 px-1.5 py-0.5 rounded border border-red-500/15">
                            SOLD OUT
                          </span>
                        ) : (
                          <span className="text-amber-500 flex items-center gap-0.5 font-extrabold bg-amber-500/5 px-1 py-0.5 rounded">
                            <span className="font-mono">{item.price.toLocaleString()}</span> R$
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Absolute Badges */}
                    {!item.purchased && !isSoldOut && (
                       <span className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] flex items-center gap-0.5 uppercase tracking-widest leading-none font-bold ${isLtd ? 'bg-emerald-500 text-neutral-950 shadow-sm' : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'}`}>
                        <Coins size={8} /> {isLtd ? 'Acquire' : 'Buy'}
                      </span>
                    )}
                    {isSoldOut && !item.purchased && (
                       <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-[8px] text-red-400 uppercase tracking-wider leading-none font-semibold">
                        Trade Only
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Stats banner */}
          <div className="bg-[#111214] border border-[#393B3D] rounded p-3.5 text-xs text-gray-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-white" />
              <span>Equips are loaded automatically in active games! Try re-playing a course with new hats.</span>
            </div>
            
            <button 
              onClick={() => {
                // Wipe non-essentials
                setEquippedItems(["5", "7"]); // Red cap + original smile
                alert("Reset equipped accessories to platform default!");
              }}
              className="text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-white hover:underline cursor-pointer font-sans"
            >
              Reset Outfits
            </button>
          </div>

        </div>

      </div>

      {/* ITEM CORE DETAILS & STOCK DRIFT CHART MODAL */}
      {selectedShopItem && (() => {
        const activeItem = shopItems.find(i => i.id === selectedShopItem.id) || selectedShopItem;
        const isEquipped = equippedItems.includes(activeItem.id);
        const isLtd = activeItem.isLimited;
        const isSoldOut = isLtd && activeItem.supply !== undefined && activeItem.supply <= 0;
        
        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
            <div className="bg-[#232527] border border-[#393B3D] max-w-sm w-full rounded-2xl p-6 shadow-2xl relative space-y-5 overflow-y-auto max-h-[90vh]">
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedShopItem(null)}
                className="absolute top-4 right-4 p-2 hover:bg-[#323436] text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Close modal"
              >
                <X size={18} />
              </button>

              {/* Title Header */}
              <div className="space-y-1 pr-8">
                <div className="flex items-center gap-1.5">
                  {isLtd && (
                    <span className="px-2 py-0.5 bg-emerald-600 border border-emerald-400/20 text-white text-[9px] font-black uppercase rounded tracking-wider">
                      ★ Limited-U
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none">
                    Asset Details · {activeItem.category}
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white font-sans leading-snug">
                  {activeItem.name}
                </h3>
              </div>

              {/* Graphical Box */}
              <div className={`aspect-square w-40 h-40 mx-auto rounded-3xl bg-gradient-to-br ${activeItem.color} flex items-center justify-center text-7xl shadow-lg border border-white/10 relative`}>
                <span>{activeItem.imageUrl}</span>
              </div>

              {/* Information Rows */}
              <div className="space-y-3.5 pt-1">
                {isLtd && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#111214] border border-[#393B3D] p-3 rounded-lg text-center">
                      <span className="block text-[9px] text-zinc-400 font-mono tracking-wider uppercase font-bold">Original Value</span>
                      <span className="text-zinc-300 text-sm font-black font-mono">{(activeItem.originalPrice || 10000).toLocaleString()} R$</span>
                    </div>
                    <div className="bg-[#111214] border border-[#393B3D] p-3 rounded-lg text-center">
                      <span className="block text-[9px] text-[#22c55e] font-mono tracking-wider uppercase font-bold">Current Drift</span>
                      <span className="text-amber-500 text-sm font-black font-mono">{activeItem.price.toLocaleString()} R$</span>
                    </div>
                  </div>
                )}

                {/* Simulated Stock Ticker fluctuation price chart */}
                {isLtd && (
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-mono font-bold text-gray-400">STOCK VALUE DOCK (RANDOM WALK):</span>
                    <QuickPriceChart history={activeItem.priceHistory} price={activeItem.price} />
                  </div>
                )}

                {/* Supply Status */}
                {isLtd && (
                  <div className="bg-[#111214] border border-[#393B3D] px-4 py-2.5 rounded-lg flex items-center justify-between text-xs font-sans">
                    <div className="space-y-0.5">
                      <span className="block text-[9px] text-[#a1a1aa] font-mono leading-none">PRIMARY COPIES</span>
                      <span className="font-bold text-white font-mono">{isSoldOut ? "0 Left" : `${activeItem.supply} / ${activeItem.maxSupply}`}</span>
                    </div>
                    <div>
                      {isSoldOut ? (
                        <span className="px-2 py-1 bg-red-950/40 text-red-400 border border-red-500/10 text-[9px] uppercase font-bold rounded">
                          Distribution Completed
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 text-[9px] uppercase font-bold rounded">
                          Available First-Hand
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {!isLtd && (
                  <div className="bg-[#111214] border border-[#393B3D] p-4 rounded-xl text-center space-y-1">
                    <span className="block text-xs uppercase tracking-wider font-extrabold text-[#f59e0b] font-mono">Catalog Listing Price</span>
                    <span className="text-2xl font-black font-mono text-white">
                      {activeItem.price === 0 ? "FREE" : `${activeItem.price.toLocaleString()} R$`}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions Button Panel */}
              <div className="space-y-2 pt-2 border-t border-[#393B3D]/30 font-sans">
                {activeItem.purchased ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEquipItemInModal(activeItem)}
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow transition ${
                        isEquipped 
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-white' 
                          : 'bg-white hover:bg-gray-100 text-black'
                      }`}
                    >
                      {isEquipped ? 'Unequip from Avatar' : 'Equip on Avatar'}
                    </button>
                    <button
                      onClick={() => setSelectedShopItem(null)}
                      className="px-4 py-3 bg-[#111214] hover:bg-zinc-800 border border-[#393B3D] text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Close View
                    </button>
                  </div>
                ) : isSoldOut ? (
                  <div className="space-y-4">
                    <p className="text-[11px] text-zinc-400 leading-normal text-center">
                      ⚠️ Original mint copies of this Limited-edition accessory are fully exhausted from the catalog shop.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          alert("Redirecting to Trades console! Barter with elite creators to obtain this item.");
                          setSelectedShopItem(null);
                        }}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white uppercase text-xs tracking-wider font-black rounded-xl cursor-pointer hover:from-emerald-500 hover:to-emerald-600 shadow-md transition"
                      >
                        Enter Trading Floor Queue 🔁
                      </button>
                      <button
                        onClick={() => setSelectedShopItem(null)}
                        className="px-4 py-3 bg-[#111214] hover:bg-zinc-800 border border-[#393B3D] text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 font-sans">
                    <button
                      onClick={() => handleBuyItemInModal(activeItem)}
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 uppercase text-xs tracking-widest font-black rounded-xl cursor-pointer shadow transition-all duration-150"
                    >
                      Buy Item ({activeItem.price.toLocaleString()} R$)
                    </button>
                    <button
                      onClick={() => setSelectedShopItem(null)}
                      className="px-4 py-3 bg-[#111214] hover:bg-zinc-800 border border-[#393B3D] text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
