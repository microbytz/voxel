import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  RotateCcw, 
  File, 
  Hammer, 
  Plus, 
  Play, 
  FolderTree, 
  Settings2, 
  Sparkles,
  Info,
  Sliders,
  Trash2,
  Lock,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Save
} from 'lucide-react';

interface Part {
  id: string;
  name: string;
  type: 'Block' | 'Sphere' | 'Cylinder' | 'CustomSculpt';
  x: number;
  y: number;
  z: number;
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  color: string;
  material: 'Plastic' | 'Neon' | 'Wood' | 'Metal';
  anchored: boolean;
  castShadow: boolean;
  rotation?: number;
  // Custom sculpting geometry properties
  sculptShape?: 'Sphere' | 'Plane' | 'Torus' | 'Dome';
  sculptHeights?: number[][];
  sculptShader?: 'Solid' | 'Wireframe' | 'Normal' | 'Clay';
  sculptColor?: string;
  sculptResolution?: number;
  sculptTexture?: 'none' | 'stone' | 'sand' | 'metal' | 'wood' | 'brick' | 'grid';
  // Special Playable Block Mechanics (kid-friendly interactive behaviors)
  specialBehavior?: 'none' | 'respawn_star' | 'lava_melt' | 'spiky_ouch' | 'ghost_illusion' | 'heart_healer' | 'bounce_pad' | 'speed_boost' | 'candy_coin' | 'dimension_rift_portal' | 'moving_hazard' | 'moving_platform' | 'linked_teleporter' | 'low_gravity_moon' | 'high_gravity_mud' | 'shrink_ray' | 'grow_ray' | 'point_drainer' | 'mystery_dice';
  targetPartId?: string;
  scriptCode?: string;
  scriptRules?: any[];
  customTextureId?: string;
  textureRotation?: number;
}

interface StudioMockProps {
  onClose: () => void;
  onLaunchGame?: (game: any) => void;
}

// Specialty Block configs - kids friendly metadata
const SPECIAL_BLOCKS = {
  respawn_star: {
    behavior: 'respawn_star' as const,
    name: '⭐ Respawn Star',
    emoji: '⭐',
    defaultColor: '#ec4899',
    defaultMaterial: 'Neon' as const,
    desc: 'Touch to save your checkpoint progress so you respawn here!'
  },
  lava_melt: {
    behavior: 'lava_melt' as const,
    name: '🔥 Lava Melt Block',
    emoji: '🔥',
    defaultColor: '#ea580c',
    defaultMaterial: 'Neon' as const,
    desc: 'Danger! Step on this block and you will instantly melt!'
  },
  spiky_ouch: {
    behavior: 'spiky_ouch' as const,
    name: '🌵 Spiky Ouch Pad',
    emoji: '🌵',
    defaultColor: '#a855f7',
    defaultMaterial: 'Plastic' as const,
    desc: 'Cactus spikes! Deals damage over time when you step on it.'
  },
  ghost_illusion: {
    behavior: 'ghost_illusion' as const,
    name: '👻 Ghostly Illusion',
    emoji: '👻',
    defaultColor: '#38bdf8',
    defaultMaterial: 'Plastic' as const,
    desc: 'Looks totally solid, but players fall right through it!'
  },
  heart_healer: {
    behavior: 'heart_healer' as const,
    name: '❤️ Magic Heart Healer',
    emoji: '❤️',
    defaultColor: '#10b981',
    defaultMaterial: 'Neon' as const,
    desc: 'Regain full health instantly when you touch it!'
  },
  bounce_pad: {
    behavior: 'bounce_pad' as const,
    name: '🚀 Bounce Pad Trampoline',
    emoji: '🚀',
    defaultColor: '#2563eb',
    defaultMaterial: 'Metal' as const,
    desc: 'Yippee! Launches players high in the air with a giant spring!'
  },
  speed_boost: {
    behavior: 'speed_boost' as const,
    name: '⚡ Speed Booster Pad',
    emoji: '⚡',
    defaultColor: '#eab308',
    defaultMaterial: 'Metal' as const,
    desc: 'Gives player super speed to slide across the baseplate!'
  },
  candy_coin: {
    behavior: 'candy_coin' as const,
    name: '🪙 Gold Candy Coin',
    emoji: '🪙',
    defaultColor: '#fbbf24',
    defaultMaterial: 'Neon' as const,
    desc: 'Shiny! Collect this delicious coin to earn +10 points!'
  },
  dimension_rift_portal: {
    behavior: 'dimension_rift_portal' as const,
    name: '🌀 Dimension Rift Portal',
    emoji: '🌀',
    defaultColor: '#6366f1',
    defaultMaterial: 'Neon' as const,
    desc: 'Touch to instantly toggle the universe between 3D Isometric view and locked 2D Side-Scrolling view!'
  },
  moving_hazard: {
    behavior: 'moving_hazard' as const,
    name: '👾 Patrolling Spiky Hazard',
    emoji: '👾',
    defaultColor: '#dc2626',
    defaultMaterial: 'Metal' as const,
    desc: 'Patrols back and forth smoothly! Deals -20HP damage on overlap.'
  },
  moving_platform: {
    behavior: 'moving_platform' as const,
    name: '🚃 Moving Platform Lift',
    emoji: '🚃',
    defaultColor: '#06b6d4',
    defaultMaterial: 'Metal' as const,
    desc: 'Slides left/right smoothly! Integrates momentum so player can stand and ride!'
  },
  linked_teleporter: {
    behavior: 'linked_teleporter' as const,
    name: '☄️ Coordinate Linked Teleporter',
    emoji: '☄️',
    defaultColor: '#a855f7',
    defaultMaterial: 'Neon' as const,
    desc: 'Step into this portal to warp instantly to linked target destination part!'
  },
  low_gravity_moon: {
    behavior: 'low_gravity_moon' as const,
    name: '☁️ Anti-Gravity Moon Block',
    emoji: '☁️',
    defaultColor: '#a5f3fc',
    defaultMaterial: 'Neon' as const,
    desc: 'Low gravity! Step on this to Float extremely high and slow like an astronaut!'
  },
  high_gravity_mud: {
    behavior: 'high_gravity_mud' as const,
    name: '🟫 Heavy mud trap',
    emoji: '🟫',
    defaultColor: '#78350f',
    defaultMaterial: 'Plastic' as const,
    desc: 'Ultra heavy gravity mud! Sticky block makes you waddle slow and jump tiny.'
  },
  shrink_ray: {
    behavior: 'shrink_ray' as const,
    name: '🧪 Scale Shrink Potion',
    emoji: '🧪',
    defaultColor: '#10b981',
    defaultMaterial: 'Neon' as const,
    desc: 'Micro-size! Shrinks the player down to 0.45x scale so you can fit through narrow gates.'
  },
  grow_ray: {
    behavior: 'grow_ray' as const,
    name: '💊 Colossus Growth Fluid',
    emoji: '💊',
    defaultColor: '#f43f5e',
    defaultMaterial: 'Neon' as const,
    desc: 'Mega-size! Grows the player up to 2.2x giant scale.'
  },
  point_drainer: {
    behavior: 'point_drainer' as const,
    name: '💀 Points Drainer Pad',
    emoji: '💀',
    defaultColor: '#451a03',
    defaultMaterial: 'Metal' as const,
    desc: 'Watch out! Overlapping this glowing trap drains -15 score points.'
  },
  mystery_dice: {
    behavior: 'mystery_dice' as const,
    name: '🎲 Random Mystery Dice',
    emoji: '🎲',
    defaultColor: '#ec4899',
    defaultMaterial: 'Plastic' as const,
    desc: 'Magical gamble! Awards Speed Boost, Rocket Launch, Max Healed or +50 Points!'
  }
};

// 3D MODEL PRESETS & TEMPLATES FOR MODELING CAD LIBRARY
const PRESET_TEMPLATES = [
  {
    id: 'castle',
    name: '🏰 Castle Fortress & Moat',
    desc: 'An epic medieval castle fortress with protective towers, a neon lava moat, bounce tramp trampolines, and hidden treasure coins!',
    parts: [
      { id: 'bp_c1', name: 'Baseplate_Grid', type: 'Block', x: 0, y: -2, z: 0, sizeX: 80, sizeY: 2, sizeZ: 80, color: '#1f2937', material: 'Plastic' as const, anchored: true, castShadow: false, rotation: 0 },
      { id: 'bp_c2', name: 'Lava Moat West', type: 'Block', x: -20, y: -0.5, z: 0, sizeX: 10, sizeY: 1.5, sizeZ: 50, color: '#f97316', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'lava_melt' as const },
      { id: 'bp_c3', name: 'Lava Moat East', type: 'Block', x: 20, y: -0.5, z: 0, sizeX: 10, sizeY: 1.5, sizeZ: 50, color: '#f97316', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'lava_melt' as const },
      { id: 'bp_c4', name: 'Left Tower Base', type: 'Cylinder', x: -14, y: 5, z: -15, sizeX: 8, sizeY: 12, sizeZ: 8, color: '#4b5563', material: 'Metal' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_c5', name: 'Right Tower Base', type: 'Cylinder', x: 14, y: 5, z: -15, sizeX: 8, sizeY: 12, sizeZ: 8, color: '#4b5563', material: 'Metal' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_c6', name: 'Left Castle Wall', type: 'Block', x: -15, y: 3, z: 5, sizeX: 4, sizeY: 8, sizeZ: 30, color: '#374151', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_c7', name: 'Right Castle Wall', type: 'Block', x: 15, y: 3, z: 5, sizeX: 4, sizeY: 8, sizeZ: 30, color: '#374151', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_c8', name: 'Castle Drawbridge', type: 'Block', x: 0, y: 0.5, z: -10, sizeX: 12, sizeY: 1, sizeZ: 15, color: '#78350f', material: 'Wood' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_c9', name: 'Throne Platform', type: 'Block', x: 0, y: 4, z: 18, sizeX: 15, sizeY: 2, sizeZ: 12, color: '#1e3a8a', material: 'Metal' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_c10', name: 'Bouncy Trampoline', type: 'Block', x: 0, y: 1, z: -25, sizeX: 6, sizeY: 1.5, sizeZ: 6, color: '#3b82f6', material: 'Metal' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'bounce_pad' as const, scriptCode: "WHEN Player Touches Self THEN\n    LAUNCH Player WITH FORCE 20\n    ALERT MSG \"Launched by High Springs!\"\n    PLAY SOUND COIN\nEND" },
      { id: 'bp_c11', name: 'Floating Gold Coin 1', type: 'Sphere', x: 0, y: 15, z: -25, sizeX: 2, sizeY: 2, sizeZ: 2, color: '#fbbf24', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'candy_coin' as const },
      { id: 'bp_c12', name: 'Floating Gold Coin 2', type: 'Sphere', x: -14, y: 13, z: -15, sizeX: 2, sizeY: 2, sizeZ: 2, color: '#fbbf24', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'candy_coin' as const, scriptCode: "WHEN Player Interacts with NPC THEN\n    NPC DIALOGUE Bob SAYS \"Ahoy, traveler! Welcome to the Castle! Jump on the blue trampoline to grab castle gold!\"\n    PLAY SOUND CHEER\nEND" },
      { id: 'bp_c13', name: 'Floating Gold Coin 3', type: 'Sphere', x: 14, y: 13, z: -15, sizeX: 2, sizeY: 2, sizeZ: 2, color: '#fbbf24', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'candy_coin' as const },
      { id: 'bp_c14', name: 'Castle Spawnpoint', type: 'Block', x: 0, y: 1, z: -5, sizeX: 6, sizeY: 1, sizeZ: 6, color: '#e11d48', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0 },
    ]
  },
  {
    id: 'obby',
    name: '🏃 Neon Laser Obstacle Course (Obby)',
    desc: 'An extreme vertical platforming obby! Leap over glowing red lasers, climb gravity grids and spring high on trampolines!',
    parts: [
      { id: 'bp_o1', name: 'Obby Entry Spawn', type: 'Block', x: 0, y: 0.5, z: 30, sizeX: 8, sizeY: 1, sizeZ: 8, color: '#f43f5e', material: 'Neon' as const, anchored: true, castShadow: false, rotation: 0 },
      { id: 'bp_o2', name: 'Checkpoint Star', type: 'Block', x: 0, y: 1, z: 15, sizeX: 4, sizeY: 1, sizeZ: 4, color: '#ec4899', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'respawn_star' as const },
      { id: 'bp_o3', name: 'Lava Beam 1', type: 'Block', x: 0, y: 2, z: 5, sizeX: 12, sizeY: 1.5, sizeZ: 3, color: '#ef4444', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'lava_melt' as const },
      { id: 'bp_o4', name: 'Rest Platform A', type: 'Block', x: 0, y: 3, z: -5, sizeX: 6, sizeY: 1.5, sizeZ: 6, color: '#374151', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_o5', name: 'Ghost Step Right', type: 'Block', x: 8, y: 6, z: -12, sizeX: 4, sizeY: 1, sizeZ: 4, color: '#38bdf8', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'ghost_illusion' as const },
      { id: 'bp_o6', name: 'Ghost Step Left', type: 'Block', x: -8, y: 9, z: -12, sizeX: 4, sizeY: 1, sizeZ: 4, color: '#38bdf8', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'ghost_illusion' as const },
      { id: 'bp_o7', name: 'Middle Landing', type: 'Block', x: 0, y: 11, z: -20, sizeX: 6, sizeY: 1.5, sizeZ: 6, color: '#10b981', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'heart_healer' as const },
      { id: 'bp_o8', name: 'Spiky Pad Left', type: 'Block', x: -6, y: 13, z: -30, sizeX: 4, sizeY: 1, sizeZ: 4, color: '#a855f7', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'spiky_ouch' as const },
      { id: 'bp_o9', name: 'Spiky Pad Right', type: 'Block', x: 6, y: 15, z: -30, sizeX: 4, sizeY: 1, sizeZ: 4, color: '#a855f7', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'spiky_ouch' as const },
      { id: 'bp_o10', name: 'Super Spring', type: 'Block', x: 0, y: 17, z: -38, sizeX: 5, sizeY: 1, sizeZ: 5, color: '#2563eb', material: 'Metal' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'bounce_pad' as const },
      { id: 'bp_o11', name: 'Victory High Platform', type: 'Block', x: 0, y: 32, z: -38, sizeX: 8, sizeY: 1.5, sizeZ: 8, color: '#ea580c', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_o12', name: 'MEGA GOLD COIN', type: 'Sphere', x: 0, y: 35, z: -38, sizeX: 4, sizeY: 4, sizeZ: 4, color: '#fbbf24', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'candy_coin' as const },
    ]
  },
  {
    id: 'space',
    name: '🌌 Neon Cosmic Outpost',
    desc: 'Welcome to the futuristic alien moon sci-fi playground! Slide around at supersonic speed with energy slides!',
    parts: [
      { id: 'bp_s1', name: 'Lunar Surface Plate', type: 'Block', x: 0, y: -2, z: 0, sizeX: 80, sizeY: 2, sizeZ: 80, color: '#0f172a', material: 'Plastic' as const, anchored: true, castShadow: false, rotation: 0 },
      { id: 'bp_s2', name: 'Neon Warp Ring base', type: 'Cylinder', x: 0, y: 1, z: 0, sizeX: 16, sizeY: 2, sizeZ: 16, color: '#06b6d4', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_s3', name: 'Outpost Tower A', type: 'Cylinder', x: -22, y: 8, z: -20, sizeX: 8, sizeY: 18, sizeZ: 8, color: '#334155', material: 'Metal' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_s4', name: 'Outpost Tower B', type: 'Cylinder', x: 22, y: 8, z: 20, sizeX: 8, sizeY: 18, sizeZ: 8, color: '#334155', material: 'Metal' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_s5', name: 'Speed Runner Left', type: 'Block', x: -16, y: 0.2, z: 0, sizeX: 4, sizeY: 0.5, sizeZ: 40, color: '#eab308', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'speed_boost' as const },
      { id: 'bp_s6', name: 'Speed Runner Right', type: 'Block', x: 16, y: 0.2, z: 0, sizeX: 4, sizeY: 0.5, sizeZ: 40, color: '#eab308', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'speed_boost' as const },
      { id: 'bp_s7', name: 'Super Coin 1', type: 'Sphere', x: -16, y: 4, z: -10, sizeX: 2, sizeY: 2, sizeZ: 2, color: '#fbbf24', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'candy_coin' as const },
      { id: 'bp_s8', name: 'Super Coin 2', type: 'Sphere', x: 16, y: 4, z: 10, sizeX: 2, sizeY: 2, sizeZ: 2, color: '#fbbf24', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'candy_coin' as const },
      { id: 'bp_s9', name: 'Gravity Pad', type: 'Block', x: 0, y: 1, z: -25, sizeX: 6, sizeY: 1.5, sizeZ: 6, color: '#2563eb', material: 'Metal' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'bounce_pad' as const },
      { id: 'bp_s10', name: 'Command Center Deck', type: 'Block', x: 0, y: 14, z: -20, sizeX: 20, sizeY: 2, sizeZ: 20, color: '#1e293b', material: 'Metal' as const, anchored: true, castShadow: true, rotation: 0 },
    ]
  },
  {
    id: 'hybrid_rift',
    name: '🌀 Dimension Rift 2.5D Hybrid',
    desc: 'Mind bending! Run through a 3D isometric city, step on glowing rift gates to collapse the universe into 2D locked side scrolling action!',
    parts: [
      { id: 'bp_h1', name: 'Baseplate Grid', type: 'Block', x: 0, y: -2, z: 0, sizeX: 80, sizeY: 2, sizeZ: 80, color: '#111827', material: 'Plastic' as const, anchored: true, castShadow: false, rotation: 0 },
      { id: 'bp_h2', name: 'Start Portal Gate', type: 'Block', x: 0, y: 1.5, z: 12, sizeX: 5, sizeY: 3, sizeZ: 5, color: '#4338ca', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'dimension_rift_portal' as const },
      { id: 'bp_h3', name: 'Dungeon Block A', type: 'Block', x: -10, y: 3, z: 0, sizeX: 8, sizeY: 2, sizeZ: 6, color: '#312e81', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_h4', name: 'Lava Gap Hazard', type: 'Block', x: -18, y: -0.5, z: 0, sizeX: 8, sizeY: 1.5, sizeZ: 6, color: '#f43f5e', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'lava_melt' as const },
      { id: 'bp_h5', name: 'Dungeon Block B', type: 'Block', x: -26, y: 3, z: 0, sizeX: 8, sizeY: 2, sizeZ: 6, color: '#312e81', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_h6', name: 'Spring Board Launcher', type: 'Block', x: -26, y: 4.5, z: 0, sizeX: 4, sizeY: 1, sizeZ: 4, color: '#2563eb', material: 'Metal' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'bounce_pad' as const },
      { id: 'bp_h7', name: 'High Sky Block C', type: 'Block', x: -14, y: 10, z: 0, sizeX: 8, sizeY: 2, sizeZ: 6, color: '#4338ca', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_h8', name: 'Victory Sky Coin', type: 'Sphere', x: -14, y: 14, z: 0, sizeX: 3, sizeY: 3, sizeZ: 3, color: '#fbbf24', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'candy_coin' as const },
      { id: 'bp_h9', name: 'Exit Portal Gate', type: 'Block', x: -14, y: 12, z: 0, sizeX: 5, sizeY: 3, sizeZ: 5, color: '#6366f1', material: 'Neon' as const, anchored: true, castShadow: true, rotation: 0, specialBehavior: 'dimension_rift_portal' as const },
      { id: 'bp_h10', name: 'Background Tower West', type: 'Cylinder', x: -24, y: 12, z: -25, sizeX: 10, sizeY: 24, sizeZ: 10, color: '#1f2937', material: 'Metal' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_h11', name: 'Background Tower East', type: 'Cylinder', x: 24, y: 16, z: -25, sizeX: 8, sizeY: 32, sizeZ: 8, color: '#1f2937', material: 'Metal' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_h12', name: 'City Center Tower', type: 'Block', x: 0, y: 8, z: -30, sizeX: 14, sizeY: 16, sizeZ: 14, color: '#111827', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_h13', name: 'Foreground Block Left', type: 'Block', x: -30, y: 5, z: 25, sizeX: 12, sizeY: 10, sizeZ: 12, color: '#1e1b4b', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0 },
      { id: 'bp_h14', name: 'Foreground Block Right', type: 'Block', x: 30, y: 7, z: 25, sizeX: 10, sizeY: 14, sizeZ: 10, color: '#1e1b4b', material: 'Plastic' as const, anchored: true, castShadow: true, rotation: 0 }
    ]
  }
];

// --- RENDER UTILITIES FOR CUSTOM PIXEL TEXTURE SYSTEM ---
const generatePresetGrid = (type: 'grass' | 'brick' | 'lava' | 'star'): string[][] => {
  const grid = Array(16).fill(null).map(() => Array(16).fill('#1e1b4b'));
  if (type === 'grass') {
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const isBlade = (r + c) % 3 === 0 || r < 3 || (r > 12 && c % 4 === 0);
        grid[r][c] = isBlade ? '#22c55e' : '#166534';
      }
    }
  } else if (type === 'brick') {
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const isLine = r % 4 === 0 || (r < 4 && c % 8 === 0) || (r >= 4 && r < 8 && (c + 4) % 8 === 0) || (r >= 8 && r < 12 && c % 8 === 0) || (r >= 12 && (c + 4) % 8 === 0);
        grid[r][c] = isLine ? '#450a0a' : '#b91c1c';
      }
    }
  } else if (type === 'lava') {
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const isOrange = Math.sin(r/1.5) * Math.cos(c/1.5) > -0.2;
        grid[r][c] = isOrange ? '#f97316' : '#991b1b';
      }
    }
  } else if (type === 'star') {
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const isCore = Math.abs(r - 8) + Math.abs(c - 8) < 5;
        grid[r][c] = isCore ? '#eab308' : '#312e81';
      }
    }
  }
  return grid;
};

const exportGridToDataURL = (grid: string[][]): string => {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      ctx.fillStyle = grid[r][c] || '#ffffff';
      ctx.fillRect(c, r, 1, 1);
    }
  }
  return canvas.toDataURL();
};

const floodFillGrid = (grid: string[][], startR: number, startC: number, targetColor: string, replacementColor: string): string[][] => {
  if (targetColor === replacementColor) return grid;
  const nextGrid = grid.map(row => [...row]);
  const queue: [number, number][] = [[startR, startC]];
  const R = grid.length;
  const C = grid[0].length;
  
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (nextGrid[r][c] !== targetColor) continue;
    nextGrid[r][c] = replacementColor;
    
    if (r > 0 && nextGrid[r-1][c] === targetColor) queue.push([r-1, c]);
    if (r < R - 1 && nextGrid[r+1][c] === targetColor) queue.push([r+1, c]);
    if (c > 0 && nextGrid[r][c-1] === targetColor) queue.push([r, c-1]);
    if (c < C - 1 && nextGrid[r][c+1] === targetColor) queue.push([r, c+1]);
  }
  return nextGrid;
};

export default function StudioMock({ onClose, onLaunchGame }: StudioMockProps) {
  const [booting, setBooting] = useState(true);
  const [bootLog, setBootLog] = useState("");
  const [bootStep, setBootStep] = useState(0);
  const [isHybrid2DMode, setIsHybrid2DMode] = useState<boolean>(false);
  
  // Studio Interactive pieces
  const [parts, setParts] = useState<Part[]>([
    { id: 'p1', name: 'Baseplate_Grid', type: 'Block', x: 0, y: -2, z: 0, sizeX: 80, sizeY: 2, sizeZ: 80, color: '#374151', material: 'Plastic', anchored: true, castShadow: false, rotation: 0 },
    { id: 'p2', name: 'Epic_Spawn_Block', type: 'Block', x: 0, y: 1, z: 10, sizeX: 8, sizeY: 2, sizeZ: 8, color: '#f43f5e', material: 'Neon', anchored: true, castShadow: true, rotation: 0 },
    { id: 'p3', name: 'Lava_Sphere_Trap', type: 'Sphere', x: 12, y: 3, z: 10, sizeX: 6, sizeY: 6, sizeZ: 6, color: '#f59e0b', material: 'Neon', anchored: false, castShadow: true, rotation: 0 }
  ]);
  const [selectedPartId, setSelectedPartId] = useState<string>('p2');
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>(['p2']);
  const [activeTool, setActiveTool] = useState<'Select' | 'Move' | 'Rotate' | 'Scale' | 'Sculpt'>('Move');

  // SAFE CUSTOM REACTION STATES FOR IFRAME COMPATIBILITY (AVOIDS PROMPT/CONFIRM WINDOW BLOCKS)
  const [renamingPartId, setRenamingPartId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [deletingPartId, setDeletingPartId] = useState<string | null>(null);

  // --- 3D INTERACTIVE SCULPTING SYSTEM STATES & GEOMETRY HELPERS ---
  const [sculptShape, setSculptShape] = useState<'Sphere' | 'Plane' | 'Torus' | 'Dome'>('Sphere');
  const [sculptTool, setSculptTool] = useState<'Draw' | 'ClayStrips' | 'Grab' | 'Smooth'>('Draw');
  const [brushSize, setBrushSize] = useState<number>(30); // Radius in viewport pixels
  const [brushStrength, setBrushStrength] = useState<number>(15);
  const [brushMode, setBrushMode] = useState<'Add' | 'Subtract'>('Add');
  const [sculptShader, setSculptShader] = useState<'Solid' | 'Wireframe' | 'Normal' | 'Clay'>('Clay');
  const [sculptColor, setSculptColor] = useState<string>('#b45309'); // terracotta clay accent
  const [sculptResolution, setSculptResolution] = useState<number>(20); // 20x20 mesh is lightning fast & smooth
  const [activeSculptTexture, setActiveSculptTexture] = useState<'none' | 'stone' | 'sand' | 'metal' | 'wood' | 'brick' | 'grid'>('none');
  
  const createInitialHeightArray = (res: number) => {
    const arr: number[][] = [];
    for (let i = 0; i < res; i++) {
      arr.push(new Array(res).fill(0));
    }
    return arr;
  };

  const [sculptHeights, setSculptHeights] = useState<number[][]>(() => createInitialHeightArray(20));
  
  // Orbit Camera rotations for sculpt canvas
  const [sculptRotX, setSculptRotX] = useState<number>(-0.45); // Pitch (tilt up/down)
  const [sculptRotY, setSculptRotY] = useState<number>(0.65);  // Yaw (pan around)

  // continuous stroke dragging state
  const [isSculptingStroke, setIsSculptingStroke] = useState(false);
  const [brushCenter, setBrushCenter] = useState<{ x: number; y: number } | null>(null);

  // Grab specific dragging history
  const [grabStartPoint, setGrabStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [grabStartHeights, setGrabStartHeights] = useState<number[][] | null>(null);

  // Undo / Redo history registers
  const [sculptUndoStack, setSculptUndoStack] = useState<number[][][]>([]);
  const [sculptRedoStack, setSculptRedoStack] = useState<number[][][]>([]);

  // Orbit drag tracking on viewport background
  const [isOrbitDragging, setIsOrbitDragging] = useState(false);
  const [orbitStartPoint, setOrbitStartPoint] = useState<{ x: number; y: number; rx: number; ry: number; } | null>(null);

  // --- ASSET SYSTEM STATE VARIABLES FOR 3D MODELS ---
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newModelName, setNewModelName] = useState('My Epic Assembly');
  const [savedModels, setSavedModels] = useState<{ id: string; name: string; date: string; parts: Part[] }[]>([]);
  const [saveStatusMsg, setSaveStatusMsg] = useState<string | null>(null);
  const [assetPendingDeleteId, setAssetPendingDeleteId] = useState<string | null>(null);

  // --- CUSTOM TEXTURE SYSTEM STATE VARIABLES ---
  interface CustomTexture {
    id: string;
    name: string;
    dataUrl: string;
    type: 'imported' | 'drawn' | 'preset';
    createdAt: string;
    customGrid?: string[][]; // Holds 16x16 pixels color grid if drawn
  }

  const [showTextureModal, setShowTextureModal] = useState(false);
  const [textureModeScope, setTextureModeScope] = useState<'block' | 'pack'>('block');
  const [textureActiveSubTab, setTextureActiveSubTab] = useState<'hub' | 'draw' | 'import'>('hub');
  
  const [customTextures, setCustomTextures] = useState<CustomTexture[]>(() => {
    try {
      const stored = localStorage.getItem('blox_custom_textures');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Could not parse stored textures:", e);
    }
    
    // Seed default stylish game backgrounds/faces
    const defaults: CustomTexture[] = [
      {
        id: 'pres_grass',
        name: '🍀 Retro Grass',
        dataUrl: '',
        type: 'preset',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pres_brick',
        name: '🧱 Ruby Brick',
        dataUrl: '',
        type: 'preset',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pres_lava',
        name: '🌋 Solar Magma',
        dataUrl: '',
        type: 'preset',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pres_star',
        name: '⭐ Cyber Nebulae',
        dataUrl: '',
        type: 'preset',
        createdAt: new Date().toISOString()
      }
    ];

    // Generate canvas urls for defaults dynamically
    defaults.forEach(item => {
      const gType = item.id.replace('pres_', '') as 'grass' | 'brick' | 'lava' | 'star';
      const grid = generatePresetGrid(gType);
      item.dataUrl = exportGridToDataURL(grid);
      item.customGrid = grid;
    });

    return defaults;
  });

  const saveCustomTextures = (list: CustomTexture[]) => {
    setCustomTextures(list);
    try {
      localStorage.setItem('blox_custom_textures', JSON.stringify(list));
    } catch (e) {
      console.error("Local storage save failed", e);
    }
  };

  // Drawing designer state
  const [drawGrid, setDrawGrid] = useState<string[][]>(() => 
    Array(16).fill(null).map(() => Array(16).fill('#1e1b4b'))
  );
  const [drawingTextureName, setDrawingTextureName] = useState('My Drawn Block');
  const [paintColor, setPaintColor] = useState('#eab308');
  const [drawingTool, setDrawingTool] = useState<'brush' | 'bucket' | 'eraser'>('brush');
  const [brushPixelSize, setBrushPixelSize] = useState<number>(1);
  const [isMousePainting, setIsMousePainting] = useState(false);
  const [editingTextureId, setEditingTextureId] = useState<string | null>(null);

  // File Import state
  const [importedFileName, setImportedFileName] = useState('My Gallery Map');
  const [importedDataUrl, setImportedDataUrl] = useState<string | null>(null);

  // Load custom models from localStorage on component mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('studio_3d_saved_models_v1');
      if (stored) {
        setSavedModels(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Local storage lookup failed", e);
    }
  }, []);

  const saveCurrentSceneAsAsset = () => {
    const trimmedName = newModelName.trim() || 'My Custom Model';
    const newModel = {
      id: `model_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: trimmedName,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      parts: JSON.parse(JSON.stringify(parts)) // clone current workspace parts array
    };
    
    const updated = [newModel, ...savedModels];
    setSavedModels(updated);
    try {
      localStorage.setItem('studio_3d_saved_models_v1', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    
    // Play sound and trigger feedback notification
    triggerBeep(650, 0.15);
    setSaveStatusMsg(`Saved! "${trimmedName}" is now in your browser Asset Library.`);
    setTimeout(() => setSaveStatusMsg(null), 4000);
  };

  const deleteCustomSavedModel = (id: string) => {
    const updated = savedModels.filter(m => m.id !== id);
    setSavedModels(updated);
    try {
      localStorage.setItem('studio_3d_saved_models_v1', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    setAssetPendingDeleteId(null);
    triggerBeep(300, 0.1);
  };

  const loadAssetIntoWorkspace = (modelParts: Part[], replaceMode: boolean) => {
    triggerBeep(500, 0.12);
    if (replaceMode) {
      // Direct replace
      setParts(JSON.parse(JSON.stringify(modelParts)));
      if (modelParts.length > 0) {
        setSelectedPartId(modelParts[0].id);
        setSelectedPartIds([modelParts[0].id]);
      }
    } else {
      // Append mode - generate unique IDs to prevent conflict issues
      const mergedPartData = modelParts.map((item, idx) => {
        if (item.id === 'p1') return null; // Safe guard: skip duplicate baseplate/ground structure
        return {
          ...item,
          id: `app_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 9)}`,
          x: item.x + 4, // displace slightly so they do not stack exactly on each other
          z: item.z + 4
        };
      }).filter(Boolean) as Part[];

      setParts(prev => [...prev, ...mergedPartData]);
    }
    setShowAssetModal(false);
  };

  const saveUndoState = (currentHeights: number[][]) => {
    const snapshot = currentHeights.map(row => [...row]);
    setSculptUndoStack(prev => [...prev, snapshot].slice(-20)); // Limit history to last 20 operations
    setSculptRedoStack([]);
  };

  const handleSculptUndo = () => {
    if (sculptUndoStack.length === 0) return;
    triggerBeep(320, 0.08);
    const prev = sculptUndoStack[sculptUndoStack.length - 1];
    setSculptRedoStack(stack => [...stack, sculptHeights.map(row => [...row])]);
    setSculptHeights(prev);
    setSculptUndoStack(stack => stack.slice(0, stack.length - 1));
  };

  const handleSculptRedo = () => {
    if (sculptRedoStack.length === 0) return;
    triggerBeep(450, 0.08);
    const next = sculptRedoStack[sculptRedoStack.length - 1];
    setSculptUndoStack(stack => [...stack, sculptHeights.map(row => [...row])]);
    setSculptHeights(next);
    setSculptRedoStack(stack => stack.slice(0, stack.length - 1));
  };

  const handleSculptReset = () => {
    triggerBeep(260, 0.15);
    saveUndoState(sculptHeights);
    setSculptHeights(createInitialHeightArray(sculptResolution));
  };

  const playSculptSfx = () => {
    const freq = 110 + Math.random() * 45;
    triggerBeep(freq, 0.03); // Softer and clicker tactile feel for Clay manipulation
  };

  // Convert shape to 3D point indices
  const get3DVertex = (i: number, j: number, heights: number[][], shape: 'Sphere' | 'Plane' | 'Torus' | 'Dome', res: number) => {
    const val = heights[i]?.[j] || 0;
    let x = 0, y = 0, z = 0;

    switch (shape) {
      case 'Sphere': {
        const theta = (i / (res - 1)) * Math.PI; // 0 to pi
        const phi = (j / (res - 1)) * 2 * Math.PI; // 0 to 2pi
        const r = 45 + val;
        x = r * Math.sin(theta) * Math.cos(phi);
        y = r * Math.cos(theta);
        z = r * Math.sin(theta) * Math.sin(phi);
        break;
      }
      case 'Plane': {
        x = (j - res / 2) * 6;
        z = (i - res / 2) * 6;
        y = -18 + val;
        break;
      }
      case 'Torus': {
        const theta = (i / (res - 1)) * 2 * Math.PI;
        const phi = (j / (res - 1)) * 2 * Math.PI;
        const R = 38; 
        const r = 13 + val; 
        x = (R + r * Math.cos(theta)) * Math.cos(phi);
        y = r * Math.sin(theta);
        z = (R + r * Math.cos(theta)) * Math.sin(phi);
        break;
      }
      case 'Dome': {
        const theta = (i / (res - 1)) * (Math.PI / 2); // Hemispherical
        const phi = (j / (res - 1)) * 2 * Math.PI;
        const r = 45 + val;
        x = r * Math.sin(theta) * Math.cos(phi);
        y = r * Math.cos(theta) - 22;
        z = r * Math.sin(theta) * Math.sin(phi);
        break;
      }
    }
    return { x, y, z };
  };

  const rotateCoordinate = (x: number, y: number, z: number, rx: number, ry: number) => {
    // Yaw
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // Pitch
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    return { x: x1, y: y2, z: z2 };
  };

  const project3D = (x: number, y: number, z: number, rx: number, ry: number) => {
    const rot = rotateCoordinate(x, y, z, rx, ry);
    return {
      px: 200 + rot.x,
      py: 120 - rot.y,
      z: rot.z
    };
  };

  const getPolygonColor = (
    pts: { x: number; y: number; z: number }[],
    baseColor: string,
    shader: 'Solid' | 'Wireframe' | 'Normal' | 'Clay',
    avgHeight: number
  ) => {
    if (shader === 'Wireframe') return 'none';
    if (shader === 'Normal') {
      const scaleRange = 24;
      const t = Math.max(0, Math.min(1, (avgHeight + 12) / scaleRange));
      if (t < 0.33) {
        const f = t / 0.33;
        return `rgb(6, ${Math.round(f * 180 + 30)}, ${Math.round((1 - f) * 160 + 90)})`; // cyans to deep blues
      } else if (t < 0.66) {
        const f = (t - 0.33) / 0.33;
        return `rgb(${Math.round(f * 200)}, 220, 30)`; // greens to yellows
      } else {
        const f = (t - 0.66) / 0.34;
        return `rgb(244, ${Math.round((1 - f) * 180 + 20)}, 30)`; // orange-red peaks
      }
    }

    // Flat lit shading
    const pA = pts[0];
    const pB = pts[1];
    const pC = pts[2];

    const v1 = { x: pB.x - pA.x, y: pB.y - pA.y, z: pB.z - pA.z };
    const v2 = { x: pC.x - pA.x, y: pC.y - pA.y, z: pC.z - pA.z };

    const nx = v1.y * v2.z - v1.z * v2.y;
    const ny = v1.z * v2.x - v1.x * v2.z;
    const nz = v1.x * v2.y - v1.y * v2.x;

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    const unitN = { x: nx / len, y: ny / len, z: nz / len };

    const light = { x: 0.4, y: 0.8, z: -0.45 };
    const lightLen = Math.sqrt(light.x ** 2 + light.y ** 2 + light.z ** 2);
    const unitL = { x: light.x / lightLen, y: light.y / lightLen, z: light.z / lightLen };

    const dot = unitN.x * unitL.x + unitN.y * unitL.y + unitN.z * unitL.z;
    const factor = Math.max(0.18, Math.min(1.0, 0.4 + 0.6 * dot));

    let hex = baseColor.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;

    return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
  };

  const bakeAndInsertSculptedPart = () => {
    triggerBeep(880, 0.12);
    const id = `sculpt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newPart: Part = {
      id,
      name: `Sculpted_${sculptShape}_${parts.length}`,
      type: 'CustomSculpt',
      x: Math.floor(Math.random() * 8) - 4,
      y: 4,
      z: Math.floor(Math.random() * 8) - 4,
      sizeX: 6,
      sizeY: 6,
      sizeZ: 6,
      color: sculptColor,
      material: 'Metal',
      anchored: true,
      castShadow: true,
      sculptShape,
      sculptHeights: sculptHeights.map(row => [...row]),
      sculptShader,
      sculptColor,
      sculptResolution,
      sculptTexture: activeSculptTexture
    };

    setParts(prev => [...prev, newPart]);
    setSelectedPartId(id);
    setSelectedPartIds([id]);
    setActiveTool('Move'); // Switch immediately so they can adjust its 3D position
  };
  const [testMode, setTestMode] = useState<'Edit' | 'Play' | 'Pause'>('Edit');
  const [isImmersivePlayTest, setIsImmersivePlayTest] = useState<boolean>(false);
  
  // Immersive 3D Space & Interactive Free-look Camera States
  const [cameraMode, setCameraMode] = useState<'Isometric' | '1st' | '3rd'>('Isometric');
  const [playerYaw, setPlayerYaw] = useState<number>(0); 
  const [freeLookYaw, setFreeLookYaw] = useState<number>(0); 
  const [freeLookPitch, setFreeLookPitch] = useState<number>(0); 
  const [isDraggingFreeLook, setIsDraggingFreeLook] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Free look pointer event handlers for camera movement & head rotation
  const handleViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (testMode === 'Play') {
      setIsDraggingFreeLook(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    } else {
      if (e.button === 0) { 
        const isClickOnPartOrGizmo = (e.target as HTMLElement).closest('.part-g') || (e.target as HTMLElement).closest('.gizmo-control');
        if (!isClickOnPartOrGizmo) {
          setIsDraggingFreeLook(true);
          dragStartRef.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }
      }
    }
  };

  const handleViewportPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingFreeLook) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    const sensitivity = 0.42; 
    
    if (testMode === 'Play' && cameraMode === '1st') {
      setPlayerYaw(prev => prev + dx * sensitivity);
    } else {
      setFreeLookYaw(prev => prev + dx * sensitivity);
    }
    setFreeLookPitch(prev => Math.max(-65, Math.min(65, prev - dy * sensitivity)));
    
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleViewportPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingFreeLook) {
      setIsDraggingFreeLook(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };
  
  // Interactive Kids Game Simulation and Physics States
  const [playerPos, setPlayerPos] = useState<{x: number; y: number; z: number}>({ x: 0, y: 1.5, z: 10 });
  const [playerVel, setPlayerVel] = useState<{x: number; y: number; z: number}>({ x: 0, y: 0, z: 0 });
  const [playerHealth, setPlayerHealth] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [activeCheckpointId, setActiveCheckpointId] = useState<string | null>(null);
  const [collectedCoinIds, setCollectedCoinIds] = useState<Set<string>>(() => new Set());
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});
  const [touchDpad, setTouchDpad] = useState({ up: false, down: false, left: false, right: false, jump: false });
  
  // Custom interactive expansion particle effect states
  const [doubleJumpParticles, setDoubleJumpParticles] = useState<Array<{ id: number; x: number; y: number; z: number; size: number }>>([]);
  const [dashParticles, setDashParticles] = useState<Array<{ id: number; x: number; y: number; z: number; size: number; color: string }>>([]);

  // Visual transient feed effects
  const [deathFlag, setDeathFlag] = useState(false);
  const [healedFlag, setHealedFlag] = useState(false);
  const [checkpointFlag, setCheckpointFlag] = useState(false);
  const [ouchFlag, setOuchFlag] = useState(false);
  
  // Custom interactive scripting & visual block states (Option A & C)
  const [showScriptEditor, setShowScriptEditor] = useState<boolean>(false);
  const [scriptEditorTab, setScriptEditorTab] = useState<'junior' | 'pro'>('junior');
  const [gameLogs, setGameLogs] = useState<string[]>([
    '🚀 Voxel Event Console active. Ready for simulation...',
    '👉 Touch or interact with scripted parts to trigger custom logic!'
  ]);
  const [activeDialogue, setActiveDialogue] = useState<{ speaker: string; text: string } | null>(null);
  const [customSpeedBoost, setCustomSpeedBoost] = useState<number>(1.0);
  const [playerScale, setPlayerScale] = useState<number>(1.0);

  // Script rule builder UI states (for visual junior mode)
  const [juniorTrigger, setJuniorTrigger] = useState<string>('player_touches_self');
  const [juniorActions, setJuniorActions] = useState<{ type: string; val: string }[]>([
    { type: 'give_points', val: '50' },
    { type: 'play_sound', val: 'COIN' }
  ]);
  const [proCode, setProCode] = useState<string>('');

  const scriptCooldownsRef = useRef<Record<string, number>>({});
  
  // Mid-air physics gesture refs to track edge-triggering keyboard clicks
  const lastSpacePressedRef = useRef<boolean>(false);
  const canDoubleJumpRef = useRef<boolean>(true);
  const lastShiftPressedRef = useRef<boolean>(false);
  const canDashRef = useRef<boolean>(true);

  const generateCodeFromJuniorFields = (trigger: string, actions: { type: string; val: string }[]): string => {
    let triggerStr = "Player Touches Self";
    if (trigger === 'player_touches_checkpoint') triggerStr = "Player Touches Checkpoint";
    if (trigger === 'player_interacts_npc') triggerStr = "Player Interacts with NPC";
    if (trigger === 'self_collides_lava') triggerStr = "Self Collides with Lava";
    if (trigger === 'player_clicks_part') triggerStr = "Player Clicks This Block";
    if (trigger === 'player_double_jumps') triggerStr = "Player Double Jumps Near This";
    if (trigger === 'player_dashes') triggerStr = "Player Dashes Near This";
    if (trigger === 'game_loaded') triggerStr = "Game Simulation Loaded";
    if (trigger === 'player_falls_void') triggerStr = "Player Falls in Void";
    if (trigger === 'player_hp_low') triggerStr = "Player HP drops below 25%";
    if (trigger === 'player_gains_points') triggerStr = "Player Gains Score Points";
    if (trigger === 'player_drowns_mud') triggerStr = "Player Drowns in Heavy Mud";
    if (trigger === 'player_shrinks_mini') triggerStr = "Player Shrinks to Micro Size";
    if (trigger === 'player_grows_colossus') triggerStr = "Player Grows to Giant Size";
    
    let code = `WHEN ${triggerStr} THEN\n`;
    
    actions.forEach(act => {
      if (act.type === 'give_robux') {
        code += `    GIVE Player ${act.val || '10'} Robux\n`;
      } else if (act.type === 'give_points') {
        code += `    GIVE Player ${act.val || '10'} Points\n`;
      } else if (act.type === 'take_health') {
        code += `    TAKE Player ${act.val || '15'} Health\n`;
      } else if (act.type === 'destroy_self') {
        code += `    DESTROY Self\n`;
      } else if (act.type === 'teleport_spawn') {
        code += `    TELEPORT Player TO SPAWN\n`;
      } else if (act.type === 'bounce_air') {
        code += `    LAUNCH Player WITH FORCE ${act.val || '15'}\n`;
      } else if (act.type === 'speed_boost') {
        code += `    SPEED UP Player TO ${act.val || '30'}\n`;
      } else if (act.type === 'color_shimmer') {
        code += `    SET COLOR OF Self TO ${act.val || '#10b981'}\n`;
      } else if (act.type === 'play_sound') {
        code += `    PLAY SOUND ${act.val || 'COIN'}\n`;
      } else if (act.type === 'alert_msg') {
        code += `    ALERT MSG "${act.val || 'Action Triggered!'}"\n`;
      } else if (act.type === 'npc_dialogue') {
        code += `    NPC DIALOGUE Says "${act.val || 'Welcome!'}"\n`;
      }
    });
    
    code += "END";
    return code;
  };

  const executePartScript = (part: Part, trigger: string) => {
    if (!part.scriptCode) return;
    
    const lines = part.scriptCode
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));
      
    let active = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const upperLine = line.toUpperCase();
      
      // Match trigger conditions
      if (upperLine.startsWith('WHEN ')) {
        const conditionStr = line.substring(5).toLowerCase();
        const thenIndex = conditionStr.toUpperCase().indexOf('THEN');
        let triggerCond = conditionStr;
        if (thenIndex !== -1) {
          triggerCond = conditionStr.substring(0, thenIndex).trim();
        }
        
        // Match conditions
        let triggered = false;
        if (trigger === 'player_touches_self' && (triggerCond.includes('player touches self') || triggerCond.includes('player_touches_self') || triggerCond.includes('touches self'))) {
          triggered = true;
        } else if (trigger === 'player_touches_checkpoint' && (triggerCond.includes('touches checkpoint') || triggerCond.includes('player touches checkpoint'))) {
          triggered = true;
        } else if (trigger === 'player_interacts_npc' && (triggerCond.includes('interacts') || triggerCond.includes('interact') || triggerCond.includes('player interacts NPC') || triggerCond.includes('with npc'))) {
          triggered = true;
        } else if (trigger === 'self_collides_lava' && (triggerCond.includes('collides with lava') || triggerCond.includes('collides_lava'))) {
          triggered = true;
        } else if (trigger === 'player_clicks_part' && (triggerCond.includes('clicks this block') || triggerCond.includes('player_clicks_part') || triggerCond.includes('clicks'))) {
          triggered = true;
        } else if (trigger === 'player_double_jumps' && (triggerCond.includes('double jumps') || triggerCond.includes('double_jumps') || triggerCond.includes('jumps near'))) {
          triggered = true;
        } else if (trigger === 'player_dashes' && (triggerCond.includes('dashes') || triggerCond.includes('player_dashes') || triggerCond.includes('dash'))) {
          triggered = true;
        } else if (trigger === 'game_loaded' && (triggerCond.includes('game simulation loaded') || triggerCond.includes('game_loaded') || triggerCond.includes('game loads'))) {
          triggered = true;
        }
        
        if (triggered) {
          active = true;
        }
        continue;
      }
      
      if (upperLine === 'END') {
        active = false;
        continue;
      }
      
      if (active) {
        // Execute command lines
        
        // 1. GIVE Player X Robux / Points
        if (upperLine.includes('GIVE PLAYER')) {
          const words = line.split(/\s+/);
          const numIndex = words.findIndex(w => !isNaN(parseInt(w)));
          if (numIndex !== -1) {
            const amt = parseInt(words[numIndex]);
            setScore(s => s + amt);
            setHealedFlag(true);
            setTimeout(() => setHealedFlag(false), 850);
            
            if (upperLine.includes('ROBUX')) {
              setGameLogs(g => [...g.slice(-15), `🪙 [onTouch]: GIVE Player ${amt} Robux (Highscore updated!)`]);
            } else {
              setGameLogs(g => [...g.slice(-15), `🌟 [onTouch]: GIVE Player ${amt} Points/XP!`]);
            }
          }
        }
        
        // 2. TAKE Player X Health / Health ouch
        else if (upperLine.includes('TAKE PLAYER') || upperLine.includes('DAMAGE PLAYER')) {
          const words = line.split(/\s+/);
          const numIndex = words.findIndex(w => !isNaN(parseInt(w)));
          if (numIndex !== -1) {
            const amt = parseInt(words[numIndex]);
            setPlayerHealth(h => Math.max(0, h - amt));
            setOuchFlag(true);
            triggerBeep(180, 0.25);
            setTimeout(() => setOuchFlag(false), 500);
            setGameLogs(g => [...g.slice(-15), `💥 [onTouch]: DAMAGE Player -${amt} HP!`]);
          }
        }
        
        // 3. DESTROY Self
        else if (upperLine.includes('DESTROY SELF')) {
          setCollectedCoinIds(prev => {
            const next = new Set(prev);
            next.add(part.id);
            return next;
          });
          triggerBeep(1200, 0.15);
          setGameLogs(g => [...g.slice(-15), `🗑️ [onTouch]: DESTROY block "${part.name}"!`]);
        }
        
        // 4. TELEPORT Player TO Spawn / coordinates
        else if (upperLine.includes('TELEPORT PLAYER')) {
          if (upperLine.includes('SPAWN')) {
            const checkpt = parts.find(p => p.specialBehavior === 'respawn_star' || p.name.toLowerCase().includes('spawn'));
            if (checkpt) {
              setPlayerPos({ x: checkpt.x, y: checkpt.y + 2, z: checkpt.z });
            } else {
              setPlayerPos({ x: 0, y: 1.5, z: 10 });
            }
            setGameLogs(g => [...g.slice(-15), `🌀 [onTouch]: TELEPORTED Player to Spawn checkpoint!`]);
          } else {
            const numbers = line.match(/-?\d+/g);
            if (numbers && numbers.length >= 2) {
              const x = parseFloat(numbers[0]);
              const y = parseFloat(numbers[1]);
              const z = numbers[2] ? parseFloat(numbers[2]) : 0;
              setPlayerPos({ x, y, z });
              setGameLogs(g => [...g.slice(-15), `🌀 [onTouch]: TELEPORTED Player to offset coordinates (${x}, ${y}, ${z})!`]);
            }
          }
          triggerBeep(650, 0.1);
        }
        
        // 5. LAUNCH Player WITH FORCE X
        else if (upperLine.includes('LAUNCH') || upperLine.includes('BOUNCE')) {
          const words = line.split(/\s+/);
          const numIndex = words.findIndex(w => !isNaN(parseInt(w)));
          const force = numIndex !== -1 ? parseInt(words[numIndex]) : 15;
          playerVel.y = force;
          triggerBeep(1100, 0.1);
          setGameLogs(g => [...g.slice(-15), `🚀 [onTouch]: LAUNCHED Player high with force ${force}!`]);
        }
        
        // 6. SPEED UP Player TO X
        else if (upperLine.includes('SPEED UP') || upperLine.includes('SET SPEED')) {
          const words = line.split(/\s+/);
          const numIndex = words.findIndex(w => !isNaN(parseInt(w)));
          const sp = numIndex !== -1 ? parseInt(words[numIndex]) : 30;
          const spMultiplier = sp / 10;
          setCustomSpeedBoost(spMultiplier);
          setGameLogs(g => [...g.slice(-15), `⚡ [onTouch]: SPEED UP active! Speed multiplier set to x${spMultiplier.toFixed(1)} for 3.5s`]);
          triggerBeep(750, 0.1);
          setTimeout(() => {
            setCustomSpeedBoost(1.0);
          }, 3500);
        }
        
        // 7. ALERT MSG Text
        else if (upperLine.includes('ALERT MSG') || upperLine.includes('ALERT ')) {
          let msg = line.substring(line.toUpperCase().indexOf('ALERT') + 5).trim();
          if (msg.toUpperCase().startsWith('MSG')) {
            msg = msg.substring(3).trim();
          }
          msg = msg.replace(/^["'\[]+|["'\]]+$/g, '');
          setGameLogs(g => [...g.slice(-15), `💡 [ALERT]: ${msg}`]);
        }
        
        // 8. NPC DIALOGUE Dialog text
        else if (upperLine.includes('NPC DIALOGUE') || upperLine.includes('DIALOGUE') || upperLine.includes('SAYS')) {
          let speaker = "NPC Bob";
          let says = line;
          const saysIdx = upperLine.indexOf('SAYS');
          if (saysIdx !== -1) {
            speaker = line.substring(0, saysIdx).replace(/NPC DIALOGUE|DIALOGUE/gi, '').trim() || "NPC Bob";
            says = line.substring(saysIdx + 4).trim();
          }
          says = says.replace(/^["'\[]+|["'\]]+$/g, '');
          setGameLogs(g => [...g.slice(-15), `💬 [${speaker}]: "${says}"`]);
          setActiveDialogue({ speaker, text: says });
          setTimeout(() => {
            setActiveDialogue(prev => (prev?.text === says ? null : prev));
          }, 4500);
        }
        
        // 9. SET COLOR OF Self TO Color
        else if (upperLine.includes('SET COLOR')) {
          const colorHex = line.match(/#[a-fA-F0-9]{6}/);
          if (colorHex) {
            setParts(prev => prev.map(p => p.id === part.id ? { ...p, color: colorHex[0] } : p));
            setGameLogs(g => [...g.slice(-15), `🎨 [onTouch]: COLOR SHIFT of block to ${colorHex[0]}!`]);
          } else if (upperLine.includes('GREEN')) {
            setParts(prev => prev.map(p => p.id === part.id ? { ...p, color: '#10b981' } : p));
          } else if (upperLine.includes('RED')) {
            setParts(prev => prev.map(p => p.id === part.id ? { ...p, color: '#f43f5e' } : p));
          } else if (upperLine.includes('BLUE')) {
            setParts(prev => prev.map(p => p.id === part.id ? { ...p, color: '#3b82f6' } : p));
          }
        }
        
        // 10. PLAY SOUND soundname
        else if (upperLine.includes('PLAY SOUND') || upperLine.includes('SOUND')) {
          if (upperLine.includes('EXPLOSION')) {
            triggerBeep(120, 0.4);
            triggerBeep(80, 0.25);
          } else if (upperLine.includes('COIN')) {
            triggerBeep(950, 0.08);
            triggerBeep(1250, 0.12);
          } else if (upperLine.includes('CHEER')) {
            triggerBeep(440, 0.1);
            triggerBeep(554, 0.1);
            triggerBeep(659, 0.15);
            triggerBeep(880, 0.25);
          } else {
            triggerBeep(600, 0.1);
          }
        }
      }
    }
  };
  
  // Left sidebar view navigation
  const [leftSidebarView, setLeftSidebarView] = useState<'hierarchy' | 'toolbox'>('toolbox');

  // Trigger to spawn customized playground piece with predefined specialty behaviors
  const spawnSpecialBlock = (behavior: keyof typeof SPECIAL_BLOCKS) => {
    triggerBeep(800, 0.08);
    const id = `p_sp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const cfg = SPECIAL_BLOCKS[behavior];
    const newPart: Part = {
      id,
      name: `${cfg.name.split(' ').pop()}_${parts.length}`,
      type: behavior === 'candy_coin' ? 'Sphere' : 'Block',
      x: Math.floor(Math.random() * 20) - 10,
      y: 3,
      z: Math.floor(Math.random() * 20) - 10,
      sizeX: behavior === 'candy_coin' ? 3 : 5,
      sizeY: behavior === 'candy_coin' ? 3 : 2,
      sizeZ: behavior === 'candy_coin' ? 3 : 5,
      color: cfg.defaultColor,
      material: cfg.defaultMaterial,
      anchored: true,
      castShadow: true,
      specialBehavior: behavior
    };
    setParts(prev => [...prev, newPart]);
    setSelectedPartId(id);
    setSelectedPartIds([id]);
    setActiveTool('Move'); // Allow adjusting its location immediately
  };

  const [explorerTab, setExplorerTab] = useState<'Workspace' | 'Lighting' | 'StarterGui'>('Workspace');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [rightSidebarOpen, setRightSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [zoom, setZoom] = useState<number>(1.0);
  const [dragState, setDragState] = useState<{
    type: 'Move' | 'Rotate' | 'Scale' | 'Select';
    axis: string;
    startX: number;
    startY: number;
    startValue: number;
    startParts: { id: string; x: number; y: number; z: number; rotation: number; sizeX: number; sizeY: number; sizeZ: number; }[];
    partId: string;
  } | null>(null);

  // Helper to determine if a specific handle/axis is being dragged
  const isDraggingThis = (type: 'Move' | 'Rotate' | 'Scale' | 'Select', axis: string) => {
    return dragState !== null && dragState.type === type && dragState.axis === axis;
  };

  const handlePointerDown = (
    e: React.PointerEvent<SVGCircleElement>,
    type: 'Move' | 'Rotate' | 'Scale' | 'Select',
    axis: string,
    currentValue: number
  ) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    
    const snapshot = parts
      .filter(p => p.id !== 'p1' && selectedPartIds.includes(p.id))
      .map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        z: p.z,
        rotation: p.rotation || 0,
        sizeX: p.sizeX || 4,
        sizeY: p.sizeY || 4,
        sizeZ: p.sizeZ || 4,
      }));

    setDragState({
      type,
      axis,
      startX: e.clientX,
      startY: e.clientY,
      startValue: currentValue,
      startParts: snapshot,
      partId: selectedPartId
    });
    triggerBeep(450, 0.05);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGCircleElement>) => {
    if (!dragState || dragState.partId !== selectedPartId) return;
    e.stopPropagation();

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    setParts(prev => prev.map(p => {
      const startSnap = dragState.startParts.find(sp => sp.id === p.id);
      if (startSnap) {
        if (dragState.type === 'Move') {
          let change = 0;
          if (dragState.axis === 'y') {
            // Dragging up (decreasing clientY) increases Y in our 3D space
            change = -deltaY / (4 * zoom);
          } else if (dragState.axis === 'x') {
            // Dragging right increases X
            change = deltaX / (4 * zoom);
          } else if (dragState.axis === 'z') {
            // Dragging down-left (positive deltaY, negative deltaX) increases Z
            const zProjection = (-deltaX * 2.5 + deltaY * 1.5) / (8.5 * zoom);
            change = zProjection;
          }

          let originalVal = 0;
          if (dragState.axis === 'y') originalVal = startSnap.y;
          else if (dragState.axis === 'x') originalVal = startSnap.x;
          else if (dragState.axis === 'z') originalVal = startSnap.z;

          let newValue = originalVal + change;
          if (!e.shiftKey) {
            newValue = Math.round(newValue * 2) / 2; // Snap to nearest 0.5 studs
          } else {
            newValue = Math.round(newValue * 10) / 10; // Precision 0.1 studs
          }

          if (dragState.axis === 'y') {
            newValue = Math.max(-10, newValue);
          }
          return { ...p, [dragState.axis]: newValue };

        } else if (dragState.type === 'Rotate') {
          // Horizontal dragging controls rotation degrees continuously
          const change = deltaX / zoom;
          let newValue = ((startSnap.rotation + change) % 360 + 360) % 360;
          if (!e.shiftKey) {
            newValue = Math.round(newValue / 15) * 15; // Snaps to standard 15 degree increments
          }
          return { ...p, rotation: newValue };

        } else if (dragState.type === 'Scale' || dragState.type === 'Select') {
          let change = 0;
          if (dragState.axis === 'sizeY') {
            change = -deltaY / (4 * zoom);
          } else if (dragState.axis === 'sizeX') {
            change = deltaX / (4 * zoom);
          } else if (dragState.axis === 'sizeZ') {
            const zProjection = (-deltaX * 2.5 + deltaY * 1.5) / (8.5 * zoom);
            change = zProjection;
          }

          let originalVal = 0;
          if (dragState.axis === 'sizeY') originalVal = startSnap.sizeY;
          else if (dragState.axis === 'sizeX') originalVal = startSnap.sizeX;
          else if (dragState.axis === 'sizeZ') originalVal = startSnap.sizeZ;

          let newValue = originalVal + change;
          if (!e.shiftKey) {
            newValue = Math.max(1, Math.min(50, Math.round(newValue)));
          } else {
            newValue = Math.max(1, Math.min(50, Math.round(newValue * 2) / 2));
          }
          return { ...p, [dragState.axis]: newValue };
        }
      }
      return p;
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<SVGCircleElement>) => {
    if (!dragState) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    setDragState(null);
    triggerBeep(380, 0.05);
  };

  // Launch bootlog timelines
  const compilationLogs = [
    "Checking modern browser WebGL parameters...",
    "Initializing Three.js Perspective Renderer & shadow maps...",
    "Injecting asset directories into local scene graph...",
    "Compiling StarterGui script listeners...",
    "Generating base plate mesh structures...",
    "Connecting Voxel Developer Service sockets... Online!",
    "Ready for logic expansion!"
  ];

  useEffect(() => {
    if (bootStep < compilationLogs.length) {
      setBootLog(compilationLogs[bootStep]);
      const timer = setTimeout(() => {
        setBootStep(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setBooting(false);
    }
  }, [bootStep]);

  // Audio synther for clicks/spawns
  const triggerBeep = (freq: number, dur: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch(e) {}
  };

  const handlePartSelection = (e: React.MouseEvent | React.PointerEvent, id: string) => {
    e.stopPropagation();
    triggerBeep(350, 0.05);
    
    if (testMode === 'Play') {
      const clickedPart = parts.find(p => p.id === id);
      if (clickedPart && clickedPart.scriptCode) {
        executePartScript(clickedPart, 'player_clicks_part');
      }
      return;
    }
    
    if (id === 'p1') {
      setSelectedPartId('p1');
      setSelectedPartIds(['p1']);
      return;
    }

    if (e.shiftKey) {
      setSelectedPartIds(prev => {
        const filtered = prev.filter(x => x !== 'p1');
        const exists = filtered.includes(id);
        let next: string[];
        if (exists) {
          next = filtered.filter(x => x !== id);
        } else {
          next = [...filtered, id];
        }
        
        if (next.length > 0) {
          if (!next.includes(selectedPartId) || selectedPartId === 'p1') {
            setSelectedPartId(next[next.length - 1]);
          }
        } else {
          setSelectedPartId('');
        }
        return next;
      });
    } else {
      setSelectedPartId(id);
      setSelectedPartIds([id]);
    }
  };

  // Add Part Trigger
  const spawnPart = (type: 'Block' | 'Sphere' | 'Cylinder') => {
    triggerBeep(600, 0.1);
    const id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newPart: Part = {
      id,
      name: `Part_${type}_${parts.length}`,
      type,
      x: Math.floor(Math.random() * 10) - 5,
      y: 4,
      z: Math.floor(Math.random() * 10) - 5,
      sizeX: type === 'Block' ? 4 : 3,
      sizeY: type === 'Block' ? 4 : 3,
      sizeZ: type === 'Block' ? 4 : 3,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      material: 'Plastic',
      anchored: true,
      castShadow: true
    };
    setParts(prev => [...prev, newPart]);
    setSelectedPartId(id);
    setSelectedPartIds([id]);
  };

  // Delete Part
  const deletePart = (id: string) => {
    triggerBeep(300, 0.15);
    setParts(prev => prev.filter(p => p.id !== id));
    if (selectedPartId === id) {
      setSelectedPartId('p1');
    }
    setSelectedPartIds(prev => {
      const next = prev.filter(p => p !== id);
      if (next.length === 0) {
        return ['p1'];
      }
      return next;
    });
  };

  // Extract selected Part properties
  const selectedPart = parts.find(p => p.id === selectedPartId) || parts[0];

  const updateProp = (field: keyof Part, value: any) => {
    setParts(prev => prev.map(p => {
      if (field === 'name') {
        if (p.id === selectedPartId) {
          return { ...p, [field]: value };
        }
      } else {
        if (selectedPartIds.includes(p.id)) {
          return { ...p, [field]: value };
        }
      }
      return p;
    }));
  };

  const handleGizmoAction = (tool: 'Move' | 'Rotate' | 'Scale', prop: string, change: number) => {
    if (!selectedPartId) return;
    triggerBeep(420, 0.05);
    setParts(prev => prev.map(p => {
      if (selectedPartIds.includes(p.id) && p.id !== 'p1') {
        if (tool === 'Move') {
          const val = ((p as any)[prop] || 0) + change;
          return { ...p, [prop]: prop === 'y' ? Math.max(-10, val) : val };
        } else if (tool === 'Rotate') {
          const val = (((p.rotation || 0) + change + 360) % 360);
          return { ...p, rotation: val };
        } else if (tool === 'Scale') {
          const val = Math.max(1, Math.min(50, ((p as any)[prop] || 4) + change));
          return { ...p, [prop]: val };
        }
      }
      return p;
    }));
  };

  // Keyboard controls listener for selected part transformation
  useEffect(() => {
    if (booting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (testMode !== 'Edit') return; // Skip so we can control player character in Play mode!
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (!selectedPartId || selectedPartId === 'p1') return;

      const step = e.shiftKey ? 5 : 1;
      
      switch (activeTool) {
        case 'Move': {
          if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            handleGizmoAction('Move', 'z', -step);
          } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            e.preventDefault();
            handleGizmoAction('Move', 'z', step);
          } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            handleGizmoAction('Move', 'x', -step);
          } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            handleGizmoAction('Move', 'x', step);
          } else if (e.key === 'PageUp' || e.key === 'q' || e.key === 'Q') {
            e.preventDefault();
            handleGizmoAction('Move', 'y', step);
          } else if (e.key === 'PageDown' || e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            handleGizmoAction('Move', 'y', -step);
          }
          break;
        }
        case 'Rotate': {
          if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            e.preventDefault();
            handleGizmoAction('Rotate', 'rotation', -15);
          } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            handleGizmoAction('Rotate', 'rotation', 15);
          }
          break;
        }
        case 'Scale': {
          if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            handleGizmoAction('Scale', 'sizeY', step);
          } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            e.preventDefault();
            handleGizmoAction('Scale', 'sizeY', -step);
          } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            handleGizmoAction('Scale', 'sizeX', -step);
          } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            handleGizmoAction('Scale', 'sizeX', step);
          } else if (e.key === 'PageUp' || e.key === 'q' || e.key === 'Q') {
            e.preventDefault();
            handleGizmoAction('Scale', 'sizeZ', step);
          } else if (e.key === 'PageDown' || e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            handleGizmoAction('Scale', 'sizeZ', -step);
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [booting, activeTool, selectedPartId, testMode]);

  const lastSpikeDamageTime = useRef<number>(0);

  // Keyboard multi-key pressed states tracker
  useEffect(() => {
    if (testMode !== 'Play') {
      setPressedKeys({});
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      setPressedKeys(prev => ({ ...prev, [k]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      setPressedKeys(prev => ({ ...prev, [k]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [testMode]);

  // Game physics and interactive block triggers loop
  useEffect(() => {
    if (testMode !== 'Play') return;

    let timer = setInterval(() => {
      // Precalculate dynamic moving platforms and patrolling hazard coordinate offsets
      const dynamicParts = parts.map(p => {
        if (p.specialBehavior === 'moving_hazard') {
          // Patrol side-to-side on X-axis (sinusoidal motion!)
          const slowSineX = Math.sin(Date.now() * 0.0018) * 8.0;
          return { ...p, x: p.x + slowSineX };
        }
        if (p.specialBehavior === 'moving_platform') {
          // Patrol side-to-side on X or Z based on size
          const useZ = (p.sizeZ || 4) > (p.sizeX || 4);
          const slowSine = Math.sin(Date.now() * 0.0012) * 6.0;
          if (useZ) {
            return { ...p, z: p.z + slowSine };
          } else {
            return { ...p, x: p.x + slowSine };
          }
        }
        return p;
      });

      // Track edge triggers for spaces and shift key to support Air Dashing / Double Jumps
      const spaceCurrentlyPressed = !!(pressedKeys['space'] || pressedKeys[' '] || touchDpad.jump);
      const spaceJustPressed = spaceCurrentlyPressed && !lastSpacePressedRef.current;
      lastSpacePressedRef.current = spaceCurrentlyPressed;

      const shiftCurrentlyPressed = !!pressedKeys['shift'];
      const shiftJustPressed = shiftCurrentlyPressed && !lastShiftPressedRef.current;
      lastShiftPressedRef.current = shiftCurrentlyPressed;

      // Update particle lifespans
      setDoubleJumpParticles(prev => prev.map(p => ({ ...p, size: p.size + 0.35 })).filter(p => p.size < 6.0));
      setDashParticles(prev => prev.map(p => ({ ...p, size: p.size + 0.45 })).filter(p => p.size < 6.5));

      // 1. Calculate direction vector of movement relative to camera orientation
      let dx = 0;
      let dz = 0;
      if (pressedKeys['w'] || pressedKeys['arrowup']) dz -= 1;
      if (pressedKeys['s'] || pressedKeys['arrowdown']) dz += 1;
      if (pressedKeys['a'] || pressedKeys['arrowleft']) dx -= 1;
      if (pressedKeys['d'] || pressedKeys['arrowright']) dx += 1;

      // check virtual buttons inside dpad
      if (touchDpad.up) dz -= 1;
      if (touchDpad.down) dz += 1;
      if (touchDpad.left) dx -= 1;
      if (touchDpad.right) dx += 1;

      let moveX = dx;
      let moveZ = isHybrid2DMode ? 0 : dz;

      if (isHybrid2DMode) {
        playerPos.z = 0;
      }

      // Handle interactive trigger E key press (using pressedKeys tracker!)
      if (pressedKeys['e'] || pressedKeys['E']) {
        const closestPart = dynamicParts.find(p => {
          if (!p.scriptCode) return false;
          const dxVal = p.x - playerPos.x;
          const dyVal = p.y - playerPos.y;
          const dzVal = p.z - playerPos.z;
          const dist = Math.sqrt(dxVal*dxVal + dyVal*dyVal + dzVal*dzVal);
          return dist <= 6.5;
        });
        if (closestPart) {
          const now = Date.now();
          const lastTime = scriptCooldownsRef.current[`interact_${closestPart.id}`] || 0;
          if (now - lastTime > 1000) { // 1s cooldown for npc talks
            scriptCooldownsRef.current[`interact_${closestPart.id}`] = now;
            executePartScript(closestPart, 'player_interacts_npc');
          }
        }
        // Consume / turn off e key immediately so it doesn't repeatedly fire dialogues in a tight loop!
        pressedKeys['e'] = false;
        pressedKeys['E'] = false;
      }

      if (cameraMode !== 'Isometric' && !isHybrid2DMode) {
        const yawRad = (playerYaw + freeLookYaw) * Math.PI / 180;
        const cosY = Math.cos(yawRad);
        const sinY = Math.sin(yawRad);

        // Calculate horizontal direction component
        const moveForwardX = sinY * (-dz);
        const moveForwardZ = cosY * (-dz);
        const moveRightX = cosY * dx;
        const moveRightZ = -sinY * dx;

        moveX = moveForwardX + moveRightX;
        moveZ = moveForwardZ + moveRightZ;

        const mag = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (mag > 0.01) {
          moveX = moveX / mag;
          moveZ = moveZ / mag;
          
          if (cameraMode === '3rd') {
            const targetAngle = Math.atan2(moveX, moveZ) * 180 / Math.PI;
            setPlayerYaw(targetAngle);
          }
        }
      }

      let currentSpeed = 1.25;
      let onSpeedBoost = false;
      let onBouncePad = false;
      let onLava = false;
      let onSpiky = false;
      let onHealer = false;
      let onLowGravity = false;
      let onHighGravity = false;
      let onShrink = false;
      let onGrow = false;
      let onPointDrainer = false;
      let onMysteryDice = false;
      let onCheckpointBlock: Part | null = null;
      let standingOnSomething = false;

      // Check support from floor baseplate
      const baseplateTop = -1; // -2 + 2/2
      if (Math.abs(playerPos.x) <= 40 && Math.abs(playerPos.z) <= 40) {
        if (playerPos.y - 1.5 >= baseplateTop - 0.25 && playerPos.y - 1.5 <= baseplateTop + 0.5) {
          standingOnSomething = true;
          playerPos.y = baseplateTop + 1.5; // snap feet to floor
          playerVel.y = 0;
        }
      }

      // Read overlap collision states & support platforms
      dynamicParts.forEach(p => {
        if (p.name === 'Baseplate_Grid') return;
        if (p.specialBehavior === 'ghost_illusion') return; // ignore ghost platform collision
        if (p.specialBehavior === 'moving_hazard') return;

        const hHalfX = (p.sizeX || 4) / 2;
        const hHalfY = (p.sizeY || 4) / 2;
        const hHalfZ = (p.sizeZ || 4) / 2;

        const pMinX = p.x - hHalfX;
        const pMaxX = p.x + hHalfX;
        const pMinY = p.y - hHalfY;
        const pMaxY = p.y + hHalfY;
        const pMinZ = p.z - hHalfZ;
        const pMaxZ = p.z + hHalfZ;

        // check horizontal bounding overlap
        const playerXZBuffer = 0.85;
        const overlapX = playerPos.x + playerXZBuffer >= pMinX && playerPos.x - playerXZBuffer <= pMaxX;
        const overlapZ = playerPos.z + playerXZBuffer >= pMinZ && playerPos.z - playerXZBuffer <= pMaxZ;

        if (overlapX && overlapZ) {
          // Custom scripts event trigger: player_touches_self
          if (p.scriptCode) {
            const overlapY = playerPos.y + 1.5 >= pMinY && playerPos.y - 1.5 <= pMaxY;
            if (overlapY) {
              const now = Date.now();
              const lastTime = scriptCooldownsRef.current[p.id] || 0;
              if (now - lastTime > 1200) { // 1.2s debounce per part script
                scriptCooldownsRef.current[p.id] = now;
                executePartScript(p, 'player_touches_self');
              }
            }
          }

          // Check vertical grounding on top surface of part
          const feetY = playerPos.y - 1.5;
          const pTopY = pMaxY;
          const margin = 0.45;
          if (feetY >= pTopY - margin && feetY <= pTopY + margin + 0.35 && playerVel.y <= 0.1) {
            standingOnSomething = true;
            playerPos.y = pTopY + 1.5; // snap feet to top surface
            playerVel.y = 0;

            if (p.specialBehavior === 'speed_boost') onSpeedBoost = true;
            if (p.specialBehavior === 'bounce_pad') onBouncePad = true;
            if (p.specialBehavior === 'lava_melt') onLava = true;
            if (p.specialBehavior === 'spiky_ouch') onSpiky = true;
            if (p.specialBehavior === 'heart_healer') onHealer = true;
            if (p.specialBehavior === 'respawn_star') onCheckpointBlock = p;
            if (p.specialBehavior === 'low_gravity_moon') onLowGravity = true;
            if (p.specialBehavior === 'high_gravity_mud') onHighGravity = true;
            if (p.specialBehavior === 'shrink_ray') onShrink = true;
            if (p.specialBehavior === 'grow_ray') onGrow = true;
            if (p.specialBehavior === 'point_drainer') onPointDrainer = true;
            if (p.specialBehavior === 'mystery_dice') onMysteryDice = true;

            if (p.specialBehavior === 'moving_platform') {
              // Smooth ride along platform! Calculate instantaneous difference delta
              const useZ = (p.sizeZ || 4) > (p.sizeX || 4);
              const slowSineNow = Math.sin(Date.now() * 0.0012) * 6.0;
              const slowSinePrev = Math.sin((Date.now() - 30) * 0.0012) * 6.0;
              const delta = slowSineNow - slowSinePrev;
              if (useZ) {
                playerPos.z += delta;
              } else {
                playerPos.x += delta;
              }
            }
          }

          // generic intersection detection for body overlap triggers
          const overlapY = playerPos.y + 1.5 >= pMinY && playerPos.y - 1.5 <= pMaxY;
          if (overlapY) {
            if (p.specialBehavior === 'lava_melt') onLava = true;
            if (p.specialBehavior === 'spiky_ouch') onSpiky = true;
            if (p.specialBehavior === 'heart_healer') onHealer = true;
            if (p.specialBehavior === 'respawn_star') onCheckpointBlock = p;
            if (p.specialBehavior === 'speed_boost') onSpeedBoost = true;
            if (p.specialBehavior === 'bounce_pad') onBouncePad = true;
            if (p.specialBehavior === 'low_gravity_moon') onLowGravity = true;
            if (p.specialBehavior === 'high_gravity_mud') onHighGravity = true;
            if (p.specialBehavior === 'shrink_ray') onShrink = true;
            if (p.specialBehavior === 'grow_ray') onGrow = true;
            if (p.specialBehavior === 'point_drainer') onPointDrainer = true;
            if (p.specialBehavior === 'mystery_dice') onMysteryDice = true;

            if (p.specialBehavior === 'candy_coin') {
              // Collect sweet coin!
              if (!collectedCoinIds.has(p.id)) {
                setCollectedCoinIds(prev => {
                  const next = new Set(prev);
                  next.add(p.id);
                  return next;
                });
                setScore(s => s + 10);
                triggerBeep(950, 0.08); // high ascending collectible chime
                triggerBeep(1350, 0.12);
              }
            }

            if (p.specialBehavior === 'dimension_rift_portal') {
              const now = Date.now();
              const cooldownKey = `rift_portal_${p.id}`;
              const lastRiftTime = scriptCooldownsRef.current[cooldownKey] || 0;
              if (now - lastRiftTime > 2000) { // 2s cooldown
                scriptCooldownsRef.current[cooldownKey] = now;
                setIsHybrid2DMode(curr => {
                  const val = !curr;
                  setGameLogs(g => [...g.slice(-15), `🌀 [Dimension Shift]: Perspective shifted to ${val ? '2D Locked Arcade Side-Scroller' : '3D Angled Baseplate Orbit'}!`]);
                  return val;
                });
                triggerBeep(600, 0.08);
                triggerBeep(900, 0.12);
              }
            }

            if (p.specialBehavior === 'linked_teleporter' && p.targetPartId) {
              const now = Date.now();
              const cooldownKey = `teleport_${p.id}`;
              const lastTeleportTime = scriptCooldownsRef.current[cooldownKey] || 0;
              if (now - lastTeleportTime > 2500) { // 2.5s teleport debounce cooldowed
                const targetPart = parts.find(tp => tp.id === p.targetPartId);
                if (targetPart) {
                  scriptCooldownsRef.current[cooldownKey] = now;
                  scriptCooldownsRef.current[`teleport_${targetPart.id}`] = now;
                  playerPos.x = targetPart.x;
                  playerPos.y = targetPart.y + (targetPart.sizeY || 4) / 2 + 1.2;
                  playerPos.z = targetPart.z;
                  triggerBeep(700, 0.06);
                  triggerBeep(1000, 0.08);
                  triggerBeep(1300, 0.12);
                  setGameLogs(g => [...g.slice(-15), `☄️ [Quantum Warp]: Teleported smoothly to linked destination "${targetPart.name}"!`]);
                  playerVel.x = 0;
                  playerVel.y = 0;
                  playerVel.z = 0;
                }
              }
            }
          }
        }
      });

      // Patrolling damage triggers check
      dynamicParts.forEach(p => {
        if (p.specialBehavior !== 'moving_hazard') return;
        const hHalfX = (p.sizeX || 4) / 2;
        const hHalfY = (p.sizeY || 4) / 2;
        const hHalfZ = (p.sizeZ || 4) / 2;

        const pMinX = p.x - hHalfX;
        const pMaxX = p.x + hHalfX;
        const pMinY = p.y - hHalfY;
        const pMaxY = p.y + hHalfY;
        const pMinZ = p.z - hHalfZ;
        const pMaxZ = p.z + hHalfZ;

        const overlapY = playerPos.y + 1.2 >= pMinY && playerPos.y - 1.2 <= pMaxY;
        const overlapX = playerPos.x + 0.95 >= pMinX && playerPos.x - 0.95 <= pMaxX;
        const overlapZ = playerPos.z + 0.95 >= pMinZ && playerPos.z - 0.95 <= pMaxZ;

        if (overlapX && overlapZ && overlapY) {
          const t = Date.now();
          const pCoolKey = `hazard_dmg_${p.id}`;
          const lastDmg = scriptCooldownsRef.current[pCoolKey] || 0;
          if (t - lastDmg > 800) {
            scriptCooldownsRef.current[pCoolKey] = t;
            setPlayerHealth(h => {
              const nextH = Math.max(0, h - 20);
              if (nextH <= 0) {
                setTimeout(() => triggerDieAndRespawn(), 10);
              } else {
                triggerBeep(180, 0.2); // deep hazard buzzer
                setOuchFlag(true);
                setTimeout(() => setOuchFlag(false), 200);
              }
              return nextH;
            });
            // Apply high-impact push-away knockback velocity!
            const kDirX = playerPos.x - p.x > 0 ? 1 : -1;
            const kDirZ = playerPos.z - p.z > 0 ? 1 : -1;
            playerVel.x = kDirX * 10;
            playerVel.z = kDirZ * 10;
            playerVel.y = 4.5; // lifter pop
            standingOnSomething = false;
            setGameLogs(g => [...g.slice(-15), `💥 [Hazard Collision]: Damage -20HP from Patrolling Hazard!`]);
          }
        }
      });

      // Reset Double Jump and Dash when on the ground
      if (standingOnSomething) {
        canDoubleJumpRef.current = true;
        canDashRef.current = true;
      }

      // Character Action - Jump / Double Jump / Dash
      if (spaceJustPressed) {
        const jumpVel = onLowGravity ? 13.0 : onHighGravity ? 4.5 : 10.5;
        if (standingOnSomething) {
          playerVel.y = jumpVel;
          standingOnSomething = false;
          triggerBeep(520, 0.08); // Jumpy ascending tone!
        } else if (canDoubleJumpRef.current) {
          playerVel.y = jumpVel; // Double jump!
          canDoubleJumpRef.current = false;
          triggerBeep(640, 0.08);
          triggerBeep(880, 0.12);
          // Spawn particles
          setDoubleJumpParticles(prev => [
            ...prev,
            { id: Date.now(), x: playerPos.x, y: playerPos.y - 1.2, z: playerPos.z, size: 1.5 }
          ]);
          // Trigger double-jump scripts for parts in range (e.g. 15.0 units)
          parts.forEach(p => {
            if (p.scriptCode) {
              const dxVal = p.x - playerPos.x;
              const dyVal = p.y - playerPos.y;
              const dzVal = p.z - playerPos.z;
              const dist = Math.sqrt(dxVal*dxVal + dyVal*dyVal + dzVal*dzVal);
              if (dist <= 15.0) {
                executePartScript(p, 'player_double_jumps');
              }
            }
          });
        }
      }

      if (shiftJustPressed && canDashRef.current && !standingOnSomething) {
        // Dash momentum boost!
        const mag = Math.sqrt(moveX * moveX + moveZ * moveZ);
        let dashDirX = 0;
        let dashDirZ = 0;
        if (mag > 0.05) {
          dashDirX = moveX / mag;
          dashDirZ = moveZ / mag;
        } else {
          // Dash in direction player is looking (Yaw orientation)
          const rad = (playerYaw) * Math.PI / 180;
          dashDirX = Math.sin(rad);
          dashDirZ = Math.cos(rad);
        }
        playerVel.x = dashDirX * 14;
        playerVel.z = dashDirZ * 14;
        playerVel.y = 3.0; // small upward glide boost
        canDashRef.current = false;
        triggerBeep(800, 0.05);
        triggerBeep(1200, 0.10);
        // Spawn dash particle trails
        setDashParticles(prev => [
          ...prev,
          { id: Date.now(), x: playerPos.x, y: playerPos.y, z: playerPos.z, size: 2.0, color: '#f43f5e' }
        ]);
        setGameLogs(g => [...g.slice(-15), `💨 [Dash Mechanics]: Air-dashed forward with neon momentum trails!`]);
        
        // Trigger dash scripts for parts in range (e.g. 15.0 units)
        parts.forEach(p => {
          if (p.scriptCode) {
            const dxVal = p.x - playerPos.x;
            const dyVal = p.y - playerPos.y;
            const dzVal = p.z - playerPos.z;
            const dist = Math.sqrt(dxVal*dxVal + dyVal*dyVal + dzVal*dzVal);
            if (dist <= 15.0) {
              executePartScript(p, 'player_dashes');
            }
          }
        });
      }

      if (onBouncePad) {
        playerVel.y = 15.5; // Mega jump boot!
        standingOnSomething = false;
        triggerBeep(420, 0.05);
        triggerBeep(1200, 0.18); // Trampoline launch whistle
      }

      // Apply horizontal speed alterations
      if (onSpeedBoost) {
        currentSpeed = 3.6; // Mega slide speed multiplier!
      } else if (onHighGravity) {
        currentSpeed = 0.55; // Walk extremely slowly in mud
      } else if (customSpeedBoost > 1.0) {
        currentSpeed = 1.25 * customSpeedBoost;
      }

      // Calculate translation
      let walk = currentSpeed;
      if (moveX !== 0 && moveZ !== 0) walk *= 0.7071; // preserve circle velocity walking magnitude
      
      let nextX = playerPos.x + moveX * walk * 0.45 + playerVel.x * 0.12;
      let nextZ = playerPos.z + moveZ * walk * 0.45 + playerVel.z * 0.12;

      // Decay dash speed velocities back to rest
      playerVel.x *= 0.82;
      playerVel.z *= 0.82;

      // Handle horizontal pushbacks relative to solid walls
      let blockX = false;
      let blockZ = false;

      dynamicParts.forEach(p => {
        if (p.name === 'Baseplate_Grid') return;
        if (p.specialBehavior === 'ghost_illusion' || p.specialBehavior === 'candy_coin') return;

        const hHalfX = (p.sizeX || 4) / 2;
        const hHalfY = (p.sizeY || 4) / 2;
        const hHalfZ = (p.sizeZ || 4) / 2;

        const pMinX = p.x - hHalfX;
        const pMaxX = p.x + hHalfX;
        const pMinY = p.y - hHalfY;
        const pMaxY = p.y + hHalfY;
        const pMinZ = p.z - hHalfZ;
        const pMaxZ = p.z + hHalfZ;

        // Check if player's head/torso overlaps vertical levels of part
        const overlapY = playerPos.y + 1.2 >= pMinY && playerPos.y - 1.2 <= pMaxY;
        if (!overlapY) return;

        const overlapNextX = nextX + 0.8 >= pMinX && nextX - 0.8 <= pMaxX;
        const overlapCurrX = playerPos.x + 0.8 >= pMinX && playerPos.x - 0.8 <= pMaxX;
        
        const overlapNextZ = nextZ + 0.8 >= pMinZ && nextZ - 0.8 <= pMaxZ;
        const overlapCurrZ = playerPos.z + 0.8 >= pMinZ && playerPos.z - 0.8 <= pMaxZ;

        if (overlapNextX && overlapCurrZ) blockX = true;
        if (overlapNextZ && overlapCurrX) blockZ = true;
      });

      if (!blockX) playerPos.x = nextX;
      if (!blockZ) playerPos.z = nextZ;

      // Apply Vertical gravity displacement
      if (!standingOnSomething) {
        let gravityFactor = 0.65;
        if (onLowGravity) gravityFactor = 0.16;      // Float on Moon block!
        else if (onHighGravity) gravityFactor = 1.35; // Heavy weight in Mud!
        playerVel.y -= gravityFactor; // Gravity factor
        playerVel.y = Math.max(-14, playerVel.y); // Terminal speed caps
        playerPos.y += playerVel.y * 0.14;
      } else {
        playerVel.y = 0;
      }

      // Overlap specialty trigger effects outcomes
      if (onLava) {
        // Instant melt!
        setPlayerHealth(0);
        triggerDieAndRespawn();
      } else if (onSpiky) {
        // Cactus prickly harm over time (cooldown)
        const t = Date.now();
        if (t - lastSpikeDamageTime.current > 750) {
          lastSpikeDamageTime.current = t;
          setPlayerHealth(h => {
             const nextH = Math.max(0, h - 20);
             if (nextH <= 0) {
               setTimeout(() => triggerDieAndRespawn(), 10);
             } else {
               triggerBeep(220, 0.15); // Ouch buzz sound!
               setOuchFlag(true);
               setTimeout(() => setOuchFlag(false), 200);
             }
             return nextH;
          });
        }
      }

      if (onHealer && playerHealth < 100) {
        setPlayerHealth(100);
        setHealedFlag(true);
        triggerBeep(520, 0.08); // upbeat sparkle chime
        triggerBeep(780, 0.12);
        setTimeout(() => setHealedFlag(false), 900);
      }

      if (onCheckpointBlock && activeCheckpointId !== onCheckpointBlock.id) {
        setActiveCheckpointId(onCheckpointBlock.id);
        setCheckpointFlag(true);
        triggerBeep(640, 0.08); // celestial active bell note
        triggerBeep(840, 0.06);
        triggerBeep(1040, 0.14);
        setTimeout(() => setCheckpointFlag(false), 1100);
      }

      if (onShrink && playerScale !== 0.45) {
        setPlayerScale(0.45);
        triggerBeep(300, 0.05);
        triggerBeep(600, 0.05);
        setGameLogs(g => [...g.slice(-15), '🧪 [Shrink Ray Activated]: Mini-sized player! You can fit through tiny corridors now!']);
      }

      if (onGrow && playerScale !== 2.2) {
        setPlayerScale(2.2);
        triggerBeep(800, 0.05);
        triggerBeep(400, 0.05);
        setGameLogs(g => [...g.slice(-15), '💊 [Giant Potion Consumed]: Mega-sized colossus player! Climb huge gaps!']);
      }

      if (onPointDrainer) {
        const t = Date.now();
        const lastDrainTime = scriptCooldownsRef.current['point_drain_cooldown'] || 0;
        if (t - lastDrainTime > 1500) {
          scriptCooldownsRef.current['point_drain_cooldown'] = t;
          setScore(s => Math.max(0, s - 15));
          triggerBeep(180, 0.15); // ouch bad buzz sound
          setOuchFlag(true);
          setTimeout(() => setOuchFlag(false), 200);
          setGameLogs(g => [...g.slice(-15), '💀 [Score Drained]: Touched a Point Drainer Block! Lost 15 points!']);
        }
      }

      if (onMysteryDice) {
        const t = Date.now();
        const lastDiceTime = scriptCooldownsRef.current['dice_cooldown'] || 0;
        if (t - lastDiceTime > 3000) {
          scriptCooldownsRef.current['dice_cooldown'] = t;
          // Choose random effect
          const effects = ['speed', 'launch', 'heal', 'points', 'shrink', 'grow'];
          const chosen = effects[Math.floor(Math.random() * effects.length)];
          triggerBeep(450, 0.05);
          triggerBeep(650, 0.05);
          triggerBeep(850, 0.1);
          if (chosen === 'speed') {
            setGameLogs(g => [...g.slice(-15), '🎲 [Mystery Dice]: Got Speed Boost effect for 3 seconds!']);
            setCustomSpeedBoost(2.5);
            setTimeout(() => setCustomSpeedBoost(1.0), 3000);
          } else if (chosen === 'launch') {
            setGameLogs(g => [...g.slice(-15), '🎲 [Mystery Dice]: Rocket Launch activation! Wheee!']);
            playerVel.y = 16.0;
            standingOnSomething = false;
          } else if (chosen === 'heal') {
            setGameLogs(g => [...g.slice(-15), '🎲 [Mystery Dice]: Magical Healing recovery! +100% HEALTH!']);
            setPlayerHealth(100);
            setHealedFlag(true);
            setTimeout(() => setHealedFlag(false), 800);
          } else if (chosen === 'points') {
            setGameLogs(g => [...g.slice(-15), '🎲 [Mystery Dice]: Jackpot! Won +50 Gold points!']);
            setScore(s => s + 50);
          } else if (chosen === 'shrink') {
            setGameLogs(g => [...g.slice(-15), '🎲 [Mystery Dice]: Shrunk to microscopic size!']);
            setPlayerScale(0.45);
          } else if (chosen === 'grow') {
            setGameLogs(g => [...g.slice(-15), '🎲 [Mystery Dice]: Turned into a skyscraper giant!']);
            setPlayerScale(2.2);
          }
        }
      }

      // Void death falls (fell off workspace edge into black vacuum)
      if (playerPos.y < -25) {
        triggerDieAndRespawn();
      }

      // Push final coordinates update to visual nodes
      setPlayerPos({ x: playerPos.x, y: playerPos.y, z: playerPos.z });
      setPlayerVel({ x: playerVel.x, y: playerVel.y, z: playerVel.z });
    }, 30);

    return () => clearInterval(timer);
  }, [testMode, pressedKeys, parts, activeCheckpointId, collectedCoinIds, playerPos, playerVel, playerHealth, touchDpad, cameraMode, playerYaw, freeLookYaw, freeLookPitch, playerScale, customSpeedBoost]);

  // Player respawn execution
  const triggerDieAndRespawn = () => {
    setDeathFlag(true);
    triggerBeep(190, 0.2);
    triggerBeep(130, 0.4); // Sad retro death chime
    setPlayerHealth(100);
    setPlayerScale(1.0);
    
    // Find designated respawn coordinates
    let destination = { x: 0, y: 1.5, z: 10 };
    const baseSpawn = parts.find(p => p.id === 'p2' || p.name === 'Epic_Spawn_Block');
    if (baseSpawn) {
      destination = { x: baseSpawn.x, y: baseSpawn.y + (baseSpawn.sizeY / 2) + 1.5, z: baseSpawn.z };
    }

    if (activeCheckpointId) {
      const activeStarCp = parts.find(p => p.id === activeCheckpointId);
      if (activeStarCp) {
        destination = { x: activeStarCp.x, y: activeStarCp.y + (activeStarCp.sizeY / 2) + 1.5, z: activeStarCp.z };
      }
    }

    setPlayerPos(destination);
    setPlayerVel({ x: 0, y: 0, z: 0 });
    setTimeout(() => setDeathFlag(false), 800);
  };

  if (booting) {
    return (
      <div className="fixed inset-0 bg-[#191B1D] z-50 flex items-center justify-center p-4">
        <div className="bg-[#232527] border border-[#393B3D] rounded w-full max-w-md p-6 shadow-2xl relative text-center space-y-6">
          <div className="flex flex-col items-center">
            {/* Spinning visual block */}
            <div className="w-16 h-16 bg-neutral-700 rounded flex items-center justify-center border-2 border-white animate-spin shadow-xl">
              <span className="text-xl">🛠️</span>
            </div>
            
            <h3 className="font-display font-black text-lg text-white mt-4 uppercase">
              STUDIO COMPILER ENGINE
            </h3>
            <p className="text-[11px] text-zinc-400 font-mono tracking-widest uppercase">
              Loading Component 3D Workspace
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-[#111214] h-1.5 rounded-full overflow-hidden border border-[#393B3D]">
              <div 
                className="bg-white h-full transition-all duration-500" 
                style={{ width: `${(bootStep / compilationLogs.length) * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-400 font-mono text-center">
              {bootLog}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Painting handlers for 16x16 pixel editor
  const handleCellPaint = (rIndex: number, cIndex: number) => {
    const colorToApply = drawingTool === 'eraser' ? '#1e1b4b' : paintColor;
    setDrawGrid(prev => {
      const next = prev.map((row, r) => {
        if (r !== rIndex) return row;
        return row.map((cell, c) => {
          if (c !== cIndex) return cell;
          return colorToApply;
        });
      });
      return next;
    });
  };

  const handleCellClick = (r: number, c: number) => {
    const originColor = drawGrid[r][c];
    const replacementColor = drawingTool === 'eraser' ? '#1e1b4b' : paintColor;
    
    if (drawingTool === 'bucket') {
      triggerBeep(380, 0.05);
      const filled = floodFillGrid(drawGrid, r, c, originColor, replacementColor);
      setDrawGrid(filled);
    } else {
      handleCellPaint(r, c);
    }
  };

  const handleTextureImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportedFileName(file.name.replace(/\.[^/.]+$/, ""));
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImportedDataUrl(event.target.result as string);
        triggerBeep(520, 0.1);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-[#191B1D] z-50 flex flex-col font-sans select-none text-gray-200">
      
      {/* Hidden global SVG defining the tiling textures used inside isometric quad renderer */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <pattern id="tex-stone" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0,20 L15,10 L30,22 L40,15 M20,0 L15,10 L25,30 L20,40 M0,35 L12,38 L22,30 L40,35 M5,10 h0.1 M25,8 h0.1 M35,28 h0.1 M10,25 h0.1 M32,5 h0.1" 
                  stroke="rgba(0,0,0,0.35)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1 1" fill="none" />
            <path d="M0,20 L15,10 L30,22 L40,15 M20,0 L15,10 L25,30 L20,40" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" fill="none" />
          </pattern>
          <pattern id="tex-sand" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="3" r="1.2" fill="rgba(0,0,0,0.25)" />
            <circle cx="12" cy="4" r="1" fill="rgba(255,255,255,0.2)" />
            <circle cx="6" cy="11" r="1.2" fill="rgba(0,0,0,0.2)" />
            <circle cx="16" cy="15" r="1" fill="rgba(255,255,255,0.15)" />
            <circle cx="9" cy="17" r="0.8" fill="rgba(0,0,0,0.3)" />
            <circle cx="17" cy="8" r="1" fill="rgba(0,0,0,0.15)" />
          </pattern>
          <pattern id="tex-metal" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M0,15 L30,15 M15,0 L15,30" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
            <path d="M5,5 L10,10 M20,20 L25,25" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx="7.5" cy="7.5" r="1.5" fill="rgba(0,0,0,0.5)" />
            <circle cx="22.5" cy="22.5" r="1.5" fill="rgba(0,0,0,0.5)" />
            <circle cx="22.5" cy="7.5" r="1.5" fill="rgba(255,255,255,0.25)" />
            <circle cx="7.5" cy="22.5" r="1.5" fill="rgba(255,255,255,0.25)" />
          </pattern>
          <pattern id="tex-wood" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 0,10 Q 15,15 25,12 T 50,15 M 0,25 Q 12,20 25,27 T 50,22 M 0,40 Q 20,35 30,42 T 50,38 Q 40,48 50,48" 
                  stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" fill="none" />
            <path d="M 0,8 Q 15,13 25,10 T 50,13 M 0,23 Q 12,18 25,25 T 50,20" 
                  stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" fill="none" />
          </pattern>
          <pattern id="tex-brick" width="40" height="20" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="40" height="20" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" />
            <line x1="20" y1="0" x2="20" y2="10" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" />
            <line x1="0" y1="10" x2="40" y2="10" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" />
            <line x1="0" y1="10" x2="0" y2="20" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" />
            <line x1="40" y1="10" x2="40" y2="20" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" />
            <line x1="10" y1="10" x2="10" y2="20" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" />
            <line x1="30" y1="10" x2="30" y2="20" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" />
          </pattern>
          <pattern id="tex-grid" width="15" height="15" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="15" height="15" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
            <rect x="0" y="0" width="15" height="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          </pattern>
          {customTextures.map((tex) => (
            <pattern key={`us_pattern_${tex.id}`} id={`tex-${tex.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <image href={tex.dataUrl} width="24" height="24" x="0" y="0" preserveAspectRatio="none" />
            </pattern>
          ))}
          {/* Create dynamic patterns for each individual part with applied textures to support custom rotation angles */}
          {parts.filter(p => p.customTextureId).map((p) => {
            const tex = customTextures.find(t => t.id === p.customTextureId);
            if (!tex) return null;
            return (
              <pattern 
                key={`tex-part-${p.id}-${p.customTextureId}`} 
                id={`tex-${p.id}-${p.customTextureId}`} 
                width="24" 
                height="24" 
                patternUnits="userSpaceOnUse"
                patternTransform={`rotate(${p.textureRotation || 0}, 12, 12)`}
              >
                <image href={tex.dataUrl} width="24" height="24" x="0" y="0" preserveAspectRatio="none" />
              </pattern>
            );
          })}
        </defs>
      </svg>
      
      {/* 1. TOP RIBBON BAR MENU */}
      {!isImmersivePlayTest && (
        <div className="h-14 bg-[#232527] border-b border-[#393B3D] flex flex-col justify-between px-3 overflow-hidden">
          {/* Ribbon Actions */}
          <div className="flex items-center justify-between h-full gap-4 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-zinc-700/80 scrollbar-track-transparent">
          <div className="flex items-center gap-2 shrink-0">
            {/* Logo slanted icon block */}
            <div className="w-6 h-6 bg-zinc-700 border border-zinc-600 rounded flex items-center justify-center font-bold text-xs shadow shrink-0 text-white">
              V
            </div>
            <span className="text-xs font-bold text-gray-300 font-display hidden sm:inline truncate">Voxel Studio (WebGL Mock)</span>
          </div>

          {/* EDITOR TOOLS MODE */}
          <div className="flex items-center gap-1 bg-[#111214] p-1 rounded border border-[#393B3D] shrink-0 font-sans">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-2 border-r border-[#393B3D] hidden md:inline">Tools:</span>
            <button 
              onClick={() => { setActiveTool('Select'); triggerBeep(450, 0.08); }}
              className={`p-1 px-2 text-xs font-semibold rounded cursor-pointer flex items-center gap-1 transition-all shrink-0 ${
                activeTool === 'Select' ? 'bg-[#393B3D] border border-white/20 text-white font-bold shadow' : 'text-zinc-400 hover:bg-[#323436] hover:text-white'
              }`}
            >
              🎯 <span className="hidden xs:inline">Select</span>
            </button>
            <button 
              onClick={() => { setActiveTool('Move'); triggerBeep(450, 0.08); }}
              className={`p-1 px-2 text-xs font-semibold rounded cursor-pointer flex items-center gap-1 transition-all shrink-0 ${
                activeTool === 'Move' ? 'bg-[#393B3D] border border-white/20 text-white font-bold shadow' : 'text-zinc-400 hover:bg-[#323436] hover:text-white'
              }`}
            >
              ↕️ <span className="hidden xs:inline">Move</span>
            </button>
            <button 
              onClick={() => { setActiveTool('Rotate'); triggerBeep(450, 0.08); }}
              className={`p-1 px-2 text-xs font-semibold rounded cursor-pointer flex items-center gap-1 transition-all shrink-0 ${
                activeTool === 'Rotate' ? 'bg-[#393B3D] border border-white/20 text-white font-bold shadow' : 'text-zinc-400 hover:bg-[#323436] hover:text-white'
              }`}
            >
              🔄 <span className="hidden xs:inline">Rotate</span>
            </button>
            <button 
              onClick={() => { setActiveTool('Scale'); triggerBeep(450, 0.08); }}
              className={`p-1 px-2 text-xs font-semibold rounded cursor-pointer flex items-center gap-1 transition-all shrink-0 ${
                activeTool === 'Scale' ? 'bg-[#393B3D] border border-white/20 text-white font-bold shadow' : 'text-zinc-400 hover:bg-[#323436] hover:text-white'
              }`}
            >
              📐 <span className="hidden xs:inline">Scale</span>
            </button>
            <button 
              onClick={() => { setActiveTool('Sculpt'); triggerBeep(450, 0.08); }}
              className={`p-1 px-2 text-xs font-semibold rounded cursor-pointer flex items-center gap-1 transition-all shrink-0 ${
                activeTool === 'Sculpt' ? 'bg-[#1e293b] border border-cyan-500/50 text-cyan-400 font-bold shadow' : 'text-zinc-400 hover:bg-[#323436] hover:text-white'
              }`}
            >
              🎨 <span className="hidden xs:inline">Sculpt</span>
            </button>
          </div>

          {/* INSERT TOOLS */}
          <div className="flex items-center gap-1 bg-[#111214] p-1 rounded border border-[#393B3D] shrink-0">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-2 border-r border-[#393B3D] hidden md:inline">Insert:</span>
            <button 
              onClick={() => spawnPart('Block')}
              className="p-1 px-2 hover:bg-[#323436] text-xs font-semibold rounded text-white cursor-pointer flex items-center gap-1 border border-[#393B3D] shrink-0"
              title="Add Cube"
            >
              🟥 <span className="hidden sm:inline">Cube</span>
            </button>
            <button 
              onClick={() => spawnPart('Sphere')}
              className="p-1 px-2 hover:bg-[#323436] text-xs font-semibold rounded text-white cursor-pointer flex items-center gap-1 border border-[#393B3D] shrink-0"
              title="Add Sphere"
            >
              🟡 <span className="hidden sm:inline">Sphere</span>
            </button>
            <button 
              onClick={() => spawnPart('Cylinder')}
              className="p-1 px-2 hover:bg-[#323436] text-xs font-semibold rounded text-white cursor-pointer flex items-center gap-1 border border-[#393B3D] shrink-0"
              title="Add Cylinder"
            >
              🟢 <span className="hidden sm:inline">Cylinder</span>
            </button>
            <button 
              onClick={() => {
                triggerBeep(450, 0.15);
                setTextureModeScope(selectedPartId ? 'block' : 'pack');
                setTextureActiveSubTab('hub');
                setShowTextureModal(true);
              }}
              className="p-1 px-2.5 bg-gradient-to-r from-cyan-950 to-teal-950 hover:from-cyan-900 hover:to-teal-900 text-cyan-300 hover:text-white text-xs font-bold rounded cursor-pointer flex items-center gap-1 border border-cyan-500/35 shrink-0"
              title="Implement custom textures or design texture packs in browser"
            >
              🎨 <span>Implement Texture</span>
            </button>
          </div>

          {/* SIMULATION TEST CONTROLS */}
          <div className="flex items-center gap-1 bg-[#111214] p-1 rounded border border-[#393B3D] shrink-0">
            <button 
              onClick={() => { 
                setTestMode('Play'); 
                triggerBeep(450, 0.15); 
                // Position player on top of Epic_Spawn_Block if editing
                const baseSpawn = parts.find(p => p.id === 'p1' || p.name === 'Epic_Spawn_Block' || p.id === 'p2');
                const startPos = baseSpawn 
                  ? { x: baseSpawn.x, y: baseSpawn.y + (baseSpawn.sizeY / 2) + 1.5, z: baseSpawn.z } 
                  : { x: 0, y: 1.5, z: 10 };
                setPlayerPos(startPos);
                setPlayerVel({ x: 0, y: 0, z: 0 });
                setPlayerHealth(100);
                setScore(0);
                setActiveCheckpointId(null);
                setCollectedCoinIds(new Set());

                // Trigger game loaded script conditions
                setTimeout(() => {
                  parts.forEach(p => {
                    if (p.scriptCode) {
                      executePartScript(p, 'game_loaded');
                    }
                  });
                }, 100);
              }}
              className={`p-1 px-1.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                testMode === 'Play' && !isImmersivePlayTest ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-zinc-800 text-gray-400'
              }`}
              title="Play Simulation"
            >
              <Play size={10} /> <span className="hidden sm:inline">Play</span>
            </button>
            <button 
              onClick={() => { setTestMode('Pause'); triggerBeep(350, 0.1); }}
              className={`p-1 px-1.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                testMode === 'Pause' ? 'bg-amber-600 text-white font-bold' : 'hover:bg-zinc-800 text-gray-400'
              }`}
              title="Pause Simulation"
            >
              <Pause size={10} /> <span className="hidden sm:inline">Pause</span>
            </button>
            <button 
              onClick={() => { 
                setTestMode('Edit'); 
                setIsImmersivePlayTest(false);
                triggerBeep(250, 0.15); 
                // Reset positions, score, and collected state
                setPlayerHealth(100);
                setScore(0);
                setCollectedCoinIds(new Set());
                setActiveCheckpointId(null);
              }}
              className={`p-1 px-1.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                testMode === 'Edit' ? 'bg-[#393B3D] border border-white/20 text-white font-bold' : 'hover:bg-zinc-800 text-gray-400'
              }`}
              title="Stop Simulation"
            >
              <Square size={10} /> <span className="hidden sm:inline">Stop</span>
            </button>

            <div className="w-[1px] h-4 bg-[#393B3D] mx-1 shrink-0" />

            <button 
              onClick={() => { 
                setTestMode('Play'); 
                setIsImmersivePlayTest(true);
                triggerBeep(550, 0.2); 
                // Position player
                const baseSpawn = parts.find(p => p.id === 'p1' || p.name === 'Epic_Spawn_Block' || p.id === 'p2');
                const startPos = baseSpawn 
                  ? { x: baseSpawn.x, y: baseSpawn.y + (baseSpawn.sizeY / 2) + 1.5, z: baseSpawn.z } 
                  : { x: 0, y: 1.5, z: 10 };
                setPlayerPos(startPos);
                setPlayerVel({ x: 0, y: 0, z: 0 });
                setPlayerHealth(100);
                setScore(0);
                setActiveCheckpointId(null);
                setCollectedCoinIds(new Set());

                // Trigger game loaded script conditions
                setTimeout(() => {
                  parts.forEach(p => {
                    if (p.scriptCode) {
                      executePartScript(p, 'game_loaded');
                    }
                  });
                }, 100);
              }}
              className={`p-1 px-2.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.35)] animate-pulse shrink-0 ${
                isImmersivePlayTest ? 'ring-2 ring-emerald-400 font-black' : ''
              }`}
              title="Immersive playtest with joysticks controls, hiding grids and sidebars!"
            >
              <span>Start Test ✅</span>
            </button>
          </div>

          {onLaunchGame && (
            <button
              onClick={() => {
                triggerBeep(650, 0.25);
                onLaunchGame({
                  id: 'voxel-3d-active-place',
                  title: newModelName || 'My Custom Voxel 3D World',
                  thumbnail: 'from-amber-500 via-orange-600 to-red-600',
                  upvoteRatio: 100,
                  activePlayers: 1,
                  creator: 'GamerProX',
                  description: 'A custom, fully-simulated 3D blockbuster adventure built inside Voxel Studio!',
                  category: 'Obby',
                  visits: 12,
                  createdAt: new Date().toISOString().split('T')[0],
                  is2D: false,
                  isShort: false,
                  parts: parts
                });
              }}
              className="p-1 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-[10px] uppercase tracking-wider rounded-md transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.35)] flex items-center gap-1.5 shrink-0 select-none animate-pulse hover:animate-none"
              title="Launch this custom world in the high-fidelity Multi-player Game Client!"
            >
              🚀 <span>Launch Game</span>
            </button>
          )}

          {/* 3D MODEL SAVE/LOAD ASSET LIBRARY BUTTON */}
          <button
            onClick={() => { setShowAssetModal(true); triggerBeep(450, 0.1); }}
            className="p-1 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-md border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Open 3D Model Asset Library to save and reload creations"
          >
            <span>📂 Asset Library</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 px-2.5 bg-white hover:bg-gray-200 text-black font-bold text-xs rounded transition-colors flex items-center gap-1 cursor-pointer shrink-0"
          >
            <X size={14} /> <span className="hidden sm:inline">Exit IDE Studio</span><span className="sm:hidden">Exit</span>
          </button>
        </div>
      </div>
      )}

      {/* 2. SPLIT INTERFACE: Explorer (Left) | Canvas Render (Center) | Properties (Right) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Explorer Scene Graph Tree (3 columns) */}
        {!isImmersivePlayTest && (
          <aside className={`bg-[#232527] flex flex-col justify-between select-none transition-all duration-300 z-[60] lg:relative absolute left-0 top-0 bottom-0 border-[#393B3D] ${
            leftSidebarOpen ? 'w-60 border-r shadow-2xl' : 'w-0 overflow-hidden border-none'
          }`}>
          <div>
            <div className="px-3.5 py-2 border-b border-[#393B3D] text-[10px] font-bold uppercase tracking-widest text-white flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <FolderTree size={12} /> Explorer SceneGraph
              </span>
              <button 
                onClick={() => { setLeftSidebarOpen(false); triggerBeep(420, 0.05); }}
                className="lg:hidden p-1 hover:bg-[#323436] rounded text-zinc-400 hover:text-white"
                title="Collapse Sidebar"
              >
                <X size={14} />
              </button>
            </div>

            {/* Visual Tab Controls */}
            <div className="grid grid-cols-2 text-center border-b border-[#393B3D] bg-[#111214]/50">
              <button
                onClick={() => { setLeftSidebarView('toolbox'); triggerBeep(400, 0.05); }}
                className={`py-2 text-[10px] font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  leftSidebarView === 'toolbox'
                    ? 'border-emerald-500 text-white bg-emerald-950/20'
                    : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/10'
                }`}
              >
                🎮 Sandbox blocks
              </button>
              <button
                onClick={() => { setLeftSidebarView('hierarchy'); triggerBeep(400, 0.05); }}
                className={`py-2 text-[10px] font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  leftSidebarView === 'hierarchy'
                    ? 'border-cyan-500 text-white bg-cyan-950/20'
                    : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/10'
                }`}
              >
                🌲 Workspace Tree
              </button>
            </div>

            <div className="font-sans">
              {leftSidebarView === 'toolbox' ? (
                /* Kids Sandbox Action blocks catalog */
                <div className="p-2 space-y-1.5 overflow-y-auto max-h-[460px] custom-scrollbar">
                  <span className="px-1 text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold mb-1">
                    🔮 Spawner Playground
                  </span>
                  {Object.entries(SPECIAL_BLOCKS).map(([key, item]) => (
                    <button
                      key={key}
                      onClick={() => spawnSpecialBlock(key as any)}
                      className="w-full p-2 rounded-lg bg-[#1a1b1d] hover:bg-[#323436]/60 border border-zinc-800 hover:border-emerald-500/50 text-left transition-all active:scale-[0.98] group flex gap-2 items-start cursor-pointer"
                      title={item.desc}
                    >
                      <div className="text-xl p-1 bg-[#232527] border border-zinc-700/60 rounded-lg group-hover:scale-110 transition-transform shadow-inner shrink-0">
                        {item.emoji}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center justify-between gap-1 w-full">
                          <span>{item.name}</span>
                          <span className="text-[8px] bg-[#111214] border border-zinc-800 text-zinc-500 group-hover:text-emerald-300 group-hover:border-emerald-500/35 px-1 rounded font-mono">
                            + ADD
                          </span>
                        </div>
                        <p className="text-[10px] leading-tight text-zinc-400">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* Standard hierarchy explorer listing */
                <div className="p-2 space-y-3">
                  <div className="space-y-1 text-xs">
                    {/* Workspace node */}
                    <div className="font-semibold text-white flex items-center gap-1.5 px-2 py-1 rounded bg-[#111214] border border-[#393B3D]">
                      📁 Workspace
                    </div>
                    
                    {/* Child parts nodes */}
                    <div className="pl-6 space-y-0.5">
                      {parts.map((part) => (
                        <button
                          key={part.id}
                          onClick={(e) => handlePartSelection(e, part.id)}
                          className={`w-full text-left px-2.5 py-1 rounded select-none truncate flex items-center justify-between text-[11px] font-mono group cursor-pointer ${
                            selectedPartIds.includes(part.id) 
                              ? 'bg-[#393B3D] border border-white/20 text-white font-bold' 
                              : 'text-zinc-400 hover:bg-[#323436]/50 hover:text-white'
                          }`}
                        >
                          <span className="truncate flex items-center gap-1">
                            {part.specialBehavior && part.specialBehavior !== 'none' ? (
                              <span>{SPECIAL_BLOCKS[part.specialBehavior]?.emoji || '🔮'}</span>
                            ) : (
                              <span>{part.type === 'Block' ? '🟥' : part.type === 'Cylinder' ? '🟢' : '🟡'}</span>
                            )}
                            <span className="truncate">{part.name}</span>
                          </span>
                          {part.id !== 'p1' && (
                            <Trash2 
                              size={11} 
                              onClick={(e) => { e.stopPropagation(); deletePart(part.id); }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity"
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="pl-3 py-1 space-y-1 pt-1 text-zinc-500">
                      <div className="px-2 py-0.5 hover:text-gray-300 transition-colors">📂 Players</div>
                      <div className="px-2 py-0.5 hover:text-gray-300 transition-colors">📂 Lighting</div>
                      <div className="px-2 py-0.5 hover:text-gray-300 transition-colors">📂 StarterGui</div>
                      <div className="px-2 py-0.5 hover:text-gray-300 transition-colors">📂 ReplicatedStorage</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-[#111214] border-t border-[#393B3D] text-[10px] text-gray-500 space-y-2">
            <div className="flex gap-1.5 items-center">
              <Info size={12} className="text-gray-400" />
              <span>Studio environment is compiled and ready for Three.js full engine code injection.</span>
            </div>
          </div>
        </aside>
        )}

        {/* Center Panel: Perspective Viewport Grid Render */}
        <main className={`flex-1 bg-black relative flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${
          isImmersivePlayTest ? 'p-0' : 'p-3 md:p-4'
        }`}>
          {/* Spatial Grid rendering */}
          {!isImmersivePlayTest && (
            <div className="absolute inset-0 roblox-grid opacity-20" />
          )}

          {/* Collapse/Expand Left Sidebar Trigger */}
          {!isImmersivePlayTest && (
            <button 
              onClick={() => { setLeftSidebarOpen(!leftSidebarOpen); triggerBeep(420, 0.05); }}
              className={`absolute left-4 top-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md select-none ${
                leftSidebarOpen 
                  ? 'lg:flex hidden bg-[#232527] text-zinc-300 border-[#393B3D] hover:bg-[#323436] hover:text-white' 
                  : 'flex bg-emerald-600 text-white border-emerald-400 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.45)] scale-105'
              }`}
              title={leftSidebarOpen ? "Collapse Left Explorer" : "Expand Left Explorer"}
            >
              {leftSidebarOpen ? <ChevronLeft size={14} className="text-zinc-400" /> : <ChevronRight size={14} className="text-white animate-pulse" />}
              <span>{leftSidebarOpen ? "Explorer" : "Open Explorer"}</span>
            </button>
          )}

          {/* Collapse/Expand Right Sidebar Trigger */}
          {!isImmersivePlayTest && (
            <button 
              onClick={() => { setRightSidebarOpen(!rightSidebarOpen); triggerBeep(420, 0.05); }}
              className={`absolute right-4 top-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md select-none ${
                rightSidebarOpen 
                  ? 'lg:flex hidden bg-[#232527] text-zinc-300 border-[#393B3D] hover:bg-[#323436] hover:text-white' 
                  : 'flex bg-emerald-600 text-white border-emerald-400 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.45)] scale-105'
              }`}
              title={rightSidebarOpen ? "Collapse Right Properties" : "Expand Right Properties"}
            >
              <span>{rightSidebarOpen ? "Properties" : "Open Properties"}</span>
              {rightSidebarOpen ? <ChevronRight size={14} className="text-zinc-400" /> : <ChevronLeft size={14} className="text-white animate-pulse" />}
            </button>
          )}

          {/* Perspective styled 3D mock objects using SVG */}
          <div 
            onPointerDown={handleViewportPointerDown}
            onPointerMove={handleViewportPointerMove}
            onPointerUp={handleViewportPointerUp}
            onPointerCancel={handleViewportPointerUp}
            className={`relative w-full h-full flex-1 bg-[#111214] flex items-center justify-center transition-all duration-300 animate-fade-in touch-none select-none ${
              isImmersivePlayTest ? 'max-w-none max-h-none border-none rounded-none shadow-none' : 'max-w-[100%] max-h-[98%] border border-[#393B3D] rounded-xl shadow-2xl'
            }`}
          >
            
             {/* Immersive Camera Angle / Orbit Dock */}
             <div className="absolute top-14 left-3 bg-[#18191e]/95 border border-[#393B3D] rounded-xl p-2.5 flex flex-col gap-1.5 z-40 shadow-2xl backdrop-blur-md select-none pointer-events-auto min-w-[155px]">
               {testMode === 'Play' || testMode === 'Pause' ? (
                 <>
                   <span className="text-[8px] text-zinc-400 font-extrabold tracking-wider uppercase font-mono px-1 block mb-0.5">🎥 PLAY CAMERA:</span>
                   <div className="flex items-center gap-1">
                     {(['Isometric', '3rd', '1st'] as const).map(mode => (
                       <button
                         key={mode}
                         onClick={() => {
                           setCameraMode(mode);
                           triggerBeep(450 + (mode === '1st' ? 70 : mode === '3rd' ? 40 : 0), 0.05);
                           setFreeLookYaw(0);
                           setFreeLookPitch(0);
                         }}
                         className={`px-2 py-1.5 rounded-lg text-[9px] font-bold tracking-tight transition-all cursor-pointer ${
                           cameraMode === mode
                             ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                             : 'bg-[#232527] text-zinc-400 hover:text-white hover:bg-[#323436]'
                         }`}
                       >
                         {mode === 'Isometric' ? '📐 Iso' : mode === '3rd' ? '👤 3rd' : '👁️ 1st'}
                       </button>
                     ))}
                   </div>
                   
                   {/* Reset Head Drag Look Angle button */}
                   {(freeLookYaw !== 0 || freeLookPitch !== 0 || playerYaw !== 0) && (
                     <button
                       onClick={() => {
                         setFreeLookYaw(0);
                         setFreeLookPitch(0);
                         setPlayerYaw(0);
                         triggerBeep(320, 0.05);
                       }}
                       className="flex items-center justify-center gap-1.5 mt-0.5 w-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 text-[9px] font-mono py-1 rounded-md border border-zinc-700 transition-all cursor-pointer"
                     >
                       <RotateCcw size={9} /> Reset Head Look ({Math.round(freeLookYaw || playerYaw)}°, {Math.round(freeLookPitch)}°)
                     </button>
                   )}

                   {/* Free-look drag helper guide */}
                   <div className="text-[8px] text-zinc-500 font-mono text-center pt-1 border-t border-zinc-800/60">
                     💡 <span className="text-zinc-400">Drag viewport area</span> to rotate view!
                   </div>
                 </>
               ) : (
                 <>
                   <span className="text-[8px] text-zinc-400 font-extrabold tracking-wider uppercase font-mono px-1 block mb-0.5">🌐 PREVIEW ORBIT CAM:</span>
                   
                   <div className="bg-[#111214] border border-zinc-800/60 rounded-lg p-1.5 space-y-1">
                     <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                       <span>Pivot:</span>
                       <span className="text-cyan-400 font-bold truncate max-w-[85px]" title={selectedPart ? selectedPart.name : 'Origin (0,0,0)'}>
                         {selectedPart ? selectedPart.name : 'Origin (0,0)'}
                       </span>
                     </div>
                     <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                       <span>Angles:</span>
                       <span className="text-zinc-300">
                         Y: {Math.round(-30 + freeLookYaw)}° / P: {Math.round(30 + freeLookPitch)}°
                       </span>
                     </div>
                   </div>

                   {(freeLookYaw !== 0 || freeLookPitch !== 0) && (
                     <button
                       onClick={() => {
                         setFreeLookYaw(0);
                         setFreeLookPitch(0);
                         triggerBeep(320, 0.05);
                       }}
                       className="flex items-center justify-center gap-1.5 mt-0.5 w-full bg-zinc-800/80 hover:bg-zinc-700/80 text-cyan-400 border border-zinc-700 text-[9.5px] font-mono py-1 rounded-md transition-all cursor-pointer font-bold"
                     >
                       <RotateCcw size={9} /> Reset Orbit Angle
                     </button>
                   )}

                   <div className="text-[8px] text-zinc-500 font-mono text-center pt-1 border-t border-zinc-800/60">
                     🖱️ <span className="text-zinc-400">Drag viewport</span> to Orbit 360°!
                   </div>
                 </>
               )}
             </div>

            {/* Zoom Controls HUD */}
                {/* Dimension Rift manual perspective button */}
                <div className="absolute top-14 left-[175px] bg-[#18191e]/95 border border-[#393B3D] rounded-lg p-1.5 flex items-center gap-2 z-40 shadow-lg backdrop-blur-md">
                  <button
                    onClick={() => {
                      setIsHybrid2DMode(curr => {
                        const val = !curr;
                        setGameLogs(g => [...g.slice(-15), `🌀 [Perspective Shift]: World shifted to ${val ? '2D Locked Platformer Rift' : '3D Free Open World'}!`]);
                        return val;
                      });
                      triggerBeep(700, 0.08);
                      triggerBeep(1000, 0.12);
                    }}
                    className={`flex items-center justify-center gap-1.5 text-[9px] font-bold px-2 py-1.5 rounded-md border transition-all cursor-pointer select-none ${
                      isHybrid2DMode 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]' 
                        : 'bg-[#232527] border-[#393B3D] text-zinc-300 hover:bg-zinc-800'
                    }`}
                    title="Toggle hybrid visual dimension plane (3D blocks vs 2D orthographic platforms)"
                  >
                    <span>🌀 {isHybrid2DMode ? '2D Rift Mode' : '3D World Mode'}</span>
                  </button>
                </div>

            <div className="absolute top-14 right-3 bg-[#232527] border border-[#393B3D] rounded-lg p-1.5 flex items-center gap-2 text-[10px] font-mono text-white select-none z-40 shadow-lg">
              <button
                onClick={() => { setZoom(prev => Math.max(0.4, prev - 0.15)); triggerBeep(400, 0.05); }}
                className="p-1 hover:bg-[#323436] rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="min-w-[40px] text-center font-bold text-emerald-400">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => { setZoom(prev => Math.min(3.0, prev + 0.15)); triggerBeep(480, 0.05); }}
                className="p-1 hover:bg-[#323436] rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <div className="w-[1px] h-4 bg-[#393B3D]" />
              <button
                onClick={() => { setZoom(1.0); triggerBeep(440, 0.05); }}
                className="px-1.5 py-0.5 hover:bg-[#323436] rounded text-zinc-400 hover:text-white transition-colors cursor-pointer text-[9px] uppercase font-bold"
                title="Reset Zoom"
              >
                Reset
              </button>
            </div>

            {/* Simulated 3D projection sandbox vector box with endless grid look */}
            {activeTool === 'Sculpt' ? (
              <div id="sculpting-studio-workbench" className="w-full h-full flex flex-col lg:flex-row relative z-10 select-none overflow-hidden items-stretch p-2 gap-3 bg-zinc-950/40 animate-fade-in">
                {/* Viewport Canvas (Col 1) */}
                <div className="flex-1 min-h-[195px] bg-[#141517] border border-[#2e3032] rounded-lg relative flex flex-col overflow-hidden">
                  
                  {/* Viewport Header */}
                  <div className="px-3 py-1.5 border-b border-[#2a2c2e] bg-[#111214] flex justify-between items-center">
                    <span className="text-[10px] font-bold text-cyan-400 font-mono flex items-center gap-1">
                      📹 SCULPT VIEW - 3D SOLID MODELER
                    </span>
                    <div className="flex gap-1 items-center">
                      <span className="text-[9px] text-zinc-500 font-mono mr-1">Camera Orbit:</span>
                      <button 
                        onClick={() => setSculptRotY(y => y - 0.25)} 
                        className="px-1.5 py-0.5 text-[10px] bg-[#222325] hover:bg-neutral-800 text-zinc-300 font-bold rounded cursor-pointer select-none"
                        title="Rotate Left"
                      >
                        ◀
                      </button>
                      <button 
                        onClick={() => setSculptRotY(y => y + 0.25)} 
                        className="px-1.5 py-0.5 text-[10px] bg-[#222325] hover:bg-neutral-800 text-zinc-300 font-bold rounded cursor-pointer select-none"
                        title="Rotate Right"
                      >
                        ▶
                      </button>
                      <button 
                        onClick={() => setSculptRotX(x => Math.max(-1.4, Math.min(1.4, x + 0.2)))} 
                        className="px-1.5 py-0.5 text-[10px] bg-[#222325] hover:bg-neutral-800 text-zinc-300 font-bold rounded cursor-pointer select-none"
                        title="Rotate Up"
                      >
                        ▲
                      </button>
                      <button 
                        onClick={() => setSculptRotX(x => Math.max(-1.4, Math.min(1.4, x - 0.2)))} 
                        className="px-1.5 py-0.5 text-[10px] bg-[#222325] hover:bg-neutral-800 text-zinc-300 font-bold rounded cursor-pointer select-none"
                        title="Rotate Down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  {/* SVG 3D rasterization viewport */}
                  <svg 
                    viewBox="0 0 400 240" 
                    className="w-full h-full bg-[#16171a] cursor-crosshair select-none"
                    onPointerDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const mx = ((e.clientX - rect.left) / rect.width) * 400;
                      const my = ((e.clientY - rect.top) / rect.height) * 240;
                      setIsSculptingStroke(true);
                      saveUndoState(sculptHeights);
                      if (sculptTool === 'Grab') {
                        setGrabStartPoint({ x: mx, y: my });
                        setGrabStartHeights(sculptHeights.map(row => [...row]));
                      } else {
                        // Apply immediate point deformation for Draw/Clay/Smooth on mouse-down
                        const nextHeights = sculptHeights.map(row => [...row]);
                        let changed = false;
                        for (let i = 0; i < sculptResolution; i++) {
                          for (let j = 0; j < sculptResolution; j++) {
                            const v3d = get3DVertex(i, j, sculptHeights, sculptShape, sculptResolution);
                            const proj = project3D(v3d.x, v3d.y, v3d.z, sculptRotX, sculptRotY);
                            const dist = Math.sqrt((proj.px - mx) ** 2 + (proj.py - my) ** 2);
                            if (dist <= brushSize) {
                              changed = true;
                              const f = 1 - dist / brushSize;
                              const dir = brushMode === 'Add' ? 1 : -1;
                              const amt = brushStrength * f * 0.15;
                              if (sculptTool === 'Draw') {
                                nextHeights[i][j] = Math.max(-25, Math.min(25, nextHeights[i][j] + amt * dir));
                              } else if (sculptTool === 'ClayStrips') {
                                const flatCell = f > 0.25 ? 0.8 : f * 3;
                                nextHeights[i][j] = Math.max(-25, Math.min(25, nextHeights[i][j] + amt * flatCell * dir * 1.25));
                              } else if (sculptTool === 'Smooth') {
                                let sum = 0, count = 0;
                                const ds = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                                ds.forEach(([di, dj]) => {
                                  const ni = i + di;
                                  const nj = j + dj;
                                  if (ni >= 0 && ni < sculptResolution && nj >= 0 && nj < sculptResolution) {
                                    sum += sculptHeights[ni][nj];
                                    count++;
                                  }
                                });
                                if (count > 0) {
                                  const avg = sum / count;
                                  const blend = f * (brushStrength / 100) * 0.8;
                                  nextHeights[i][j] = sculptHeights[i][j] * (1 - blend) + avg * blend;
                                }
                              }
                            }
                          }
                        }
                        if (changed) {
                          setSculptHeights(nextHeights);
                          playSculptSfx();
                        }
                      }
                    }}
                    onPointerMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const mx = ((e.clientX - rect.left) / rect.width) * 400;
                      const my = ((e.clientY - rect.top) / rect.height) * 240;
                      
                      setBrushCenter({ x: mx, y: my });

                      if (!isSculptingStroke) return;

                      setSculptHeights(prevHeights => {
                        const nextHeights = prevHeights.map(row => [...row]);
                        let changed = false;

                        for (let i = 0; i < sculptResolution; i++) {
                          for (let j = 0; j < sculptResolution; j++) {
                            const v3d = get3DVertex(i, j, prevHeights, sculptShape, sculptResolution);
                            const proj = project3D(v3d.x, v3d.y, v3d.z, sculptRotX, sculptRotY);
                            const dist = Math.sqrt((proj.px - mx) ** 2 + (proj.py - my) ** 2);

                            if (dist <= brushSize) {
                              changed = true;
                              const f = 1 - dist / brushSize;
                              const dir = brushMode === 'Add' ? 1 : -1;
                              const amt = brushStrength * f * 0.15;

                              if (sculptTool === 'Draw') {
                                nextHeights[i][j] = Math.max(-25, Math.min(25, prevHeights[i][j] + amt * dir));
                              } else if (sculptTool === 'ClayStrips') {
                                const flatCell = f > 0.25 ? 0.8 : f * 3;
                                nextHeights[i][j] = Math.max(-25, Math.min(25, prevHeights[i][j] + amt * flatCell * dir * 1.25));
                              } else if (sculptTool === 'Smooth') {
                                let sum = 0, count = 0;
                                const ds = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                                ds.forEach(([di, dj]) => {
                                  const ni = i + di;
                                  const nj = j + dj;
                                  if (ni >= 0 && ni < sculptResolution && nj >= 0 && nj < sculptResolution) {
                                    sum += prevHeights[ni][nj];
                                    count++;
                                  }
                                });
                                if (count > 0) {
                                  const avg = sum / count;
                                  const blend = f * (brushStrength / 100) * 0.85;
                                  nextHeights[i][j] = prevHeights[i][j] * (1 - blend) + avg * blend;
                                }
                              } else if (sculptTool === 'Grab' && grabStartPoint && grabStartHeights) {
                                const dragDx = mx - grabStartPoint.x;
                                const dragDy = my - grabStartPoint.y;
                                const strengthAmt = (brushStrength / 35);
                                const pull = (dragDx - dragDy) * strengthAmt * f * 0.1;
                                nextHeights[i][j] = Math.max(-25, Math.min(25, grabStartHeights[i][j] + pull));
                              }
                            }
                          }
                        }

                        if (changed && Math.random() < 0.12) {
                          playSculptSfx();
                        }
                        
                        return nextHeights;
                      });
                    }}
                    onPointerUp={() => {
                      setIsSculptingStroke(false);
                      setGrabStartHeights(null);
                    }}
                    onPointerCancel={() => {
                      setIsSculptingStroke(false);
                      setGrabStartHeights(null);
                    }}
                  >
                    {/* Render the rotated sorting polygons */}
                    {(() => {
                      const polygonsToRender: { points: string; fill: string; depth: number; avgHeight: number; }[] = [];
                      
                      for (let i = 0; i < sculptResolution - 1; i++) {
                        for (let j = 0; j < sculptResolution - 1; j++) {
                          const coords = [
                            { r: i, c: j },
                            { r: i, c: j + 1 },
                            { r: i + 1, c: j + 1 },
                            { r: i + 1, c: j }
                          ];
                          
                          const ptsProjection = coords.map(c => {
                            const v3d = get3DVertex(c.r, c.c, sculptHeights, sculptShape, sculptResolution);
                            const proj = project3D(v3d.x, v3d.y, v3d.z, sculptRotX, sculptRotY);
                            return { px: proj.px, py: proj.py, z: proj.z, original: v3d };
                          });
                          
                          const avgDepth = ptsProjection.reduce((sum, p) => sum + p.z, 0) / 4;
                          const pointsStr = ptsProjection.map(p => `${p.px},${p.py}`).join(' ');
                          const avgHeight = coords.reduce((sum, c) => sum + (sculptHeights[c.r]?.[c.c] || 0), 0) / 4;
                          
                          const fillClr = getPolygonColor(
                            ptsProjection.map(p => p.original),
                            sculptColor,
                            sculptShader,
                            avgHeight
                          );
                          
                          polygonsToRender.push({
                            points: pointsStr,
                            fill: fillClr,
                            depth: avgDepth,
                            avgHeight
                          });
                        }
                      }
                      
                      // Painter's algorithm sort
                      polygonsToRender.sort((a, b) => b.depth - a.depth);
                      
                      return (
                        <g>
                          {polygonsToRender.map((poly, idx) => {
                            const hasTexture = activeSculptTexture && activeSculptTexture !== 'none';
                            return (
                              <g key={`sculpt-poly-g-${idx}`}>
                                <polygon
                                  points={poly.points}
                                  fill={poly.fill}
                                  stroke={sculptShader === 'Wireframe' ? sculptColor : 'rgba(0,0,0,0.18)'}
                                  strokeWidth={sculptShader === 'Wireframe' ? '0.6' : '0.15'}
                                />
                                {hasTexture && sculptShader !== 'Wireframe' && (
                                  <polygon
                                    points={poly.points}
                                    fill={`url(#tex-${activeSculptTexture})`}
                                    opacity="0.32"
                                    pointerEvents="none"
                                  />
                                )}
                              </g>
                            );
                          })}
                        </g>
                      );
                    })()}

                    {/* Interactive overlay brush cursor indicator follows the pointer */}
                    {brushCenter && (
                      <circle
                        cx={brushCenter.x}
                        cy={brushCenter.y}
                        r={brushSize}
                        stroke="#06b6d4"
                        strokeWidth="1"
                        strokeDasharray="3 2"
                        className="pointer-events-none"
                        fill="rgba(6, 182, 212, 0.08)"
                      />
                    )}
                  </svg>

                  {/* Orientation compass in viewport corner */}
                  <div className="absolute bottom-2 left-2 flex flex-col font-mono text-[8px] text-zinc-500 bg-zinc-950/80 px-2.5 py-1.5 rounded border border-[#2e3032] leading-relaxed">
                    <span className="text-[9px] text-zinc-300 font-bold mb-0.5">🎮 Studio Gizmo</span>
                    <span>Shape: {sculptShape}</span>
                    <span>Shader: {sculptShader}</span>
                    <span>Camera Angle X: {Math.round(sculptRotX * 57.29)}°</span>
                    <span>Camera Angle Y: {Math.round(sculptRotY * 57.29)}°</span>
                  </div>

                  {/* Background rotating drag instruction indicator */}
                  <div className="absolute bottom-2 right-2 text-zinc-500 text-[8px] font-mono select-none px-2 py-1 bg-zinc-950/40 rounded">
                    [Drag sliders or click headers to Orbit shape]
                  </div>
                </div>

                {/* Sculpt Settings sidebar controls (Col 2) */}
                <div className="w-full lg:w-[220px] shrink-0 flex flex-col p-3 bg-[#17181a] border border-[#2a2c2e] rounded-lg justify-between select-none space-y-3 shrink-1 font-sans overflow-y-auto max-h-[100%]">
                  
                  {/* Part 1: Shape Base Preset */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">1. Clay Base Shape</span>
                    <div className="grid grid-cols-4 gap-1">
                      {(['Sphere', 'Plane', 'Torus', 'Dome'] as const).map(shape => (
                        <button
                          key={shape}
                          onClick={() => {
                            setSculptShape(shape);
                            triggerBeep(320, 0.05);
                            setSculptHeights(createInitialHeightArray(sculptResolution));
                            setSculptUndoStack([]);
                            setSculptRedoStack([]);
                          }}
                          className={`p-1 py-1.5 text-[10px] rounded border font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                            sculptShape === shape
                              ? 'bg-[#1e293b] border-cyan-500/50 text-cyan-400 font-bold font-mono'
                              : 'bg-[#222325] border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                          title={`Initialize starting shape as ${shape}`}
                        >
                          <span className="text-xs">{shape === 'Sphere' ? '🔴' : shape === 'Plane' ? '⏹️' : shape === 'Torus' ? '🍩' : '⛺'}</span>
                          <span>{shape}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Part 2: Brush Tools Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">2. Deform Brush Tool</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['Draw', 'ClayStrips', 'Grab', 'Smooth'] as const).map(tool => (
                        <button
                          key={tool}
                          onClick={() => { setSculptTool(tool); triggerBeep(400, 0.05); }}
                          className={`p-1.5 text-[10px] rounded border transition-all flex flex-col font-semibold cursor-pointer ${
                            sculptTool === tool
                              ? 'bg-amber-950/20 border-amber-500/50 text-amber-400 font-bold font-mono'
                              : 'bg-[#222325] border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          <span className="font-mono">{tool === 'Draw' ? '🎨 Draw' : tool === 'ClayStrips' ? '🟫 Clay' : tool === 'Grab' ? '↔️ Grab' : '✨ Smooth'}</span>
                        </button>
                      ))}
                    </div>
                    {/* Tool Descriptions */}
                    <p className="text-[9px] text-zinc-400 leading-normal px-1 py-0.5 border-l border-zinc-700 font-mono">
                      {sculptTool === 'Draw' && "Smooth Draw: Raises or lowers surface material seamlessly based on strength falloff."}
                      {sculptTool === 'ClayStrips' && "Clay Strips: Adds uniform flat brick-like ridges for hard geometry sculpting."}
                      {sculptTool === 'Grab' && "Grab Stretch: Selects vertices and stretches them out based on mouse displacement."}
                      {sculptTool === 'Smooth' && "Surface Smooth: Relaxes sharp edges/valleys, polishing the model surface."}
                    </p>
                  </div>

                  {/* Part 3: Sizing / Strength sliders */}
                  <div className="space-y-1.5 leading-none">
                    <div className="flex justify-between items-center text-[10px] uppercase text-zinc-500 font-bold">
                      <span>Brush Size</span>
                      <span className="text-cyan-400 font-mono">{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="75"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer h-1 bg-[#222325] rounded-lg"
                    />

                    <div className="flex justify-between items-center text-[10px] uppercase text-zinc-500 font-bold mt-2">
                      <span>Brush Strength</span>
                      <span className="text-amber-500 font-mono">{brushStrength}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={brushStrength}
                      onChange={(e) => setBrushStrength(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-1 bg-[#222325] rounded-lg"
                    />

                    {/* Raise vs Lower Mode toggle */}
                    {sculptTool !== 'Smooth' && (
                      <div className="grid grid-cols-2 gap-1 mt-2.5">
                        <button
                          onClick={() => { setBrushMode('Add'); triggerBeep(450, 0.04); }}
                          className={`p-1 rounded text-[10px] border transition-all font-semibold cursor-pointer ${
                            brushMode === 'Add'
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                              : 'bg-[#222325] border-transparent text-zinc-500'
                          }`}
                        >
                          ➕ Add Vol
                        </button>
                        <button
                          onClick={() => { setBrushMode('Subtract'); triggerBeep(400, 0.04); }}
                          className={`p-1 rounded text-[10px] border transition-all font-semibold cursor-pointer ${
                            brushMode === 'Subtract'
                              ? 'bg-rose-950/20 border-rose-500/40 text-rose-400'
                              : 'bg-[#222325] border-transparent text-zinc-500'
                          }`}
                        >
                          ➖ Carve
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Part 4: Shader & Color Selector */}
                  <div className="space-y-1.5 pt-1 font-sans">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">3. Cosmetic Shader</span>
                    <div className="grid grid-cols-4 gap-0.5">
                      {(['Clay', 'Solid', 'Normal', 'Wireframe'] as const).map(sh => (
                        <button
                          key={sh}
                          onClick={() => { setSculptShader(sh); triggerBeep(330, 0.05); }}
                          className={`py-1 rounded text-[9px] cursor-pointer transition-all border font-semibold ${
                            sculptShader === sh
                              ? 'bg-neutral-800 border-zinc-500 text-white font-bold bg-[#333]'
                              : 'bg-[#222325] border-transparent text-zinc-500 hover:text-zinc-300'
                          }`}
                          title={`Display shader: ${sh}`}
                        >
                          {sh}
                        </button>
                      ))}
                    </div>

                    {sculptShader !== 'Normal' && (
                      <div className="flex gap-1 items-center justify-between pt-1">
                        <span className="text-[9px] text-zinc-500 font-mono">Clay Theme:</span>
                        <div className="flex gap-1">
                          {['#b45309', '#374151', '#064e3b', '#e2e8f0'].map(col => (
                            <button
                              key={col}
                              onClick={() => { setSculptColor(col); triggerBeep(300, 0.04); }}
                              style={{ backgroundColor: col }}
                              className={`w-3.5 h-3.5 rounded-full border cursor-pointer hover:scale-110 transition-transform ${
                                sculptColor === col ? 'border-sky-400 ring-2 ring-sky-500/35' : 'border-neutral-900'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Part 4.5: Tiled Material Texture */}
                  <div className="space-y-1.5 pt-1.5 border-t border-zinc-800">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">4. Tiled Texture</span>
                    <select
                      value={activeSculptTexture}
                      onChange={(e) => {
                        setActiveSculptTexture(e.target.value as any);
                        triggerBeep(360, 0.05);
                      }}
                      className="w-full bg-[#222325] text-zinc-300 text-[10.5px] p-1.5 rounded border border-zinc-700/50 font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="none">None (Smooth Matte)</option>
                      <option value="stone">🪨 Stone Paving</option>
                      <option value="sand">🏜️ Desert Sand</option>
                      <option value="metal">⚙️ Metal Grid Plate</option>
                      <option value="wood">🪵 Oak Wood Grain</option>
                      <option value="brick">🧱 Brick Masonry</option>
                      <option value="grid">🌐 Tech Mesh Grid</option>
                    </select>
                  </div>

                  {/* Part 5: Undo, Redo, Reset operations */}
                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-zinc-800">
                    <button
                      onClick={handleSculptUndo}
                      disabled={sculptUndoStack.length === 0}
                      className="p-1 rounded cursor-pointer text-[9px] bg-[#222325] hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 disabled:pointer-events-none hover:text-white transition-colors"
                      title="Undo previous brushstroke"
                    >
                      ↩️ Undo
                    </button>
                    <button
                      onClick={handleSculptRedo}
                      disabled={sculptRedoStack.length === 0}
                      className="p-1 rounded cursor-pointer text-[9px] bg-[#222325] hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 disabled:pointer-events-none hover:text-white transition-colors"
                      title="Redo next brushstroke"
                    >
                      ↪️ Redo
                    </button>
                    <button
                      onClick={handleSculptReset}
                      className="p-1 rounded cursor-pointer text-[9px] bg-red-950/20 hover:bg-red-900/35 border border-red-900/40 text-red-100 transition-colors"
                      title="Reset Heights Array"
                    >
                      💥 Reset
                    </button>
                  </div>

                  {/* Part 6: Spawn physical item action */}
                  <button
                    onClick={bakeAndInsertSculptedPart}
                    className="w-full text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 rounded-lg text-[11px] font-bold cursor-pointer transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:scale-[1.02] flex items-center justify-center gap-1.5"
                    title="Compile sculpting mesh geometry and spawn customized 3D object inside main workspace world!"
                  >
                    🛠️ Bake & Insert Model
                  </button>
                  
                </div>
              </div>
            ) : ((() => {
              // Unified 3D Coordinate perspective projection helper
              const isPristineIso = testMode !== 'Edit' && cameraMode === 'Isometric' && freeLookYaw === 0 && freeLookPitch === 0;

              let camX = 0;
              let camY = 0;
              let camZ = 0;
              let yawRad = 0;
              let pitchRad = 0;

              if (!isPristineIso) {
                if (cameraMode === '1st') {
                  camX = playerPos.x;
                  camY = playerPos.y + 1.25;
                  camZ = playerPos.z;
                  yawRad = (playerYaw + freeLookYaw) * Math.PI / 180;
                  pitchRad = (freeLookPitch) * Math.PI / 180;
                } else if (cameraMode === '3rd') {
                  const dist = 14; 
                  yawRad = (playerYaw + freeLookYaw) * Math.PI / 180;
                  pitchRad = (20 + freeLookPitch) * Math.PI / 180;
                  
                  camX = playerPos.x - dist * Math.sin(yawRad) * Math.cos(pitchRad);
                  camZ = playerPos.z - dist * Math.cos(yawRad) * Math.cos(pitchRad);
                  camY = playerPos.y + 2.0 + dist * Math.sin(pitchRad);
                } else {
                  // Isometric with Free-look: Orbit around player position (Play Mode) or selected part (Edit Mode)
                  const targetX = testMode === 'Play' ? playerPos.x : (selectedPart ? selectedPart.x : 0);
                  const targetY = testMode === 'Play' ? playerPos.y : (selectedPart ? selectedPart.y : 1.5);
                  const targetZ = testMode === 'Play' ? playerPos.z : (selectedPart ? selectedPart.z : 0);
                  const dist = 38;
                  yawRad = (-30 + freeLookYaw) * Math.PI / 180;
                  pitchRad = (30 + freeLookPitch) * Math.PI / 180;
                  
                  camX = targetX - dist * Math.sin(yawRad) * Math.cos(pitchRad);
                  camZ = targetZ - dist * Math.cos(yawRad) * Math.cos(pitchRad);
                  camY = targetY + dist * Math.sin(pitchRad);
                }
              }

              const cosY = Math.cos(yawRad);
              const sinY = Math.sin(yawRad);
              const cosX = Math.cos(pitchRad);
              const sinX = Math.sin(pitchRad);

              const project3D = (x: number, y: number, z: number) => {
                if (isHybrid2DMode) {
                  const xCenter = testMode === 'Play' ? playerPos.x : (selectedPart ? selectedPart.x : 0);
                  const yCenter = testMode === 'Play' ? playerPos.y : (selectedPart ? selectedPart.y : 6);
                  return {
                    x: 200 + (x - xCenter) * 11,
                    y: 130 - (y - yCenter) * 11,
                    depth: z,
                    scale: 1.1,
                    clipped: false
                  };
                }

                // If we are in traditional isometric and free-look is at 0, keep pristine matches
                if (isPristineIso) {
                  return {
                    x: 200 + (x * 5) - (z * 2.5),
                    y: 190 - (y * 5) + (z * 1.5),
                    depth: z,
                    scale: 1,
                    clipped: false
                  };
                }

                // Camera relative offset
                const dx = x - camX;
                const dy = y - camY;
                const dz = z - camZ;

                // Spin around Y axis (Yaw)
                const rx = dx * cosY - dz * sinY;
                const rz = dx * sinY + dz * cosY;

                // Spin around X axis (Pitch)
                const ry = dy * cosX + rz * sinX;
                const rz2 = -dy * sinX + rz * cosX;

                const nearClipping = 0.5;
                if (rz2 < nearClipping) {
                  return { x: -9999, y: -9999, depth: -9999, scale: 0.1, clipped: true };
                }

                const perspectiveScale = 220 / rz2;
                return {
                  x: 200 + rx * perspectiveScale,
                  y: 120 - ry * perspectiveScale,
                  depth: rz2,
                  scale: perspectiveScale / 10,
                  clipped: false
                };
              };

              const render3DLine = (
                x1: number, y1: number, z1: number,
                x2: number, y2: number, z2: number
              ) => {
                if (isHybrid2DMode) {
                  const xCenter = testMode === 'Play' ? playerPos.x : (selectedPart ? selectedPart.x : 0);
                  const yCenter = testMode === 'Play' ? playerPos.y : (selectedPart ? selectedPart.y : 6);
                  return {
                    p1: { x: 200 + (x1 - xCenter) * 11, y: 130 - (y1 - yCenter) * 11 },
                    p2: { x: 200 + (x2 - xCenter) * 11, y: 130 - (y2 - yCenter) * 11 },
                    visible: true
                  };
                }

                if (isPristineIso) {
                  return {
                    p1: { x: 200 + (x1 * 5) - (z1 * 2.5), y: 190 - (y1 * 5) + (z1 * 1.5) },
                    p2: { x: 200 + (x2 * 5) - (z2 * 2.5), y: 190 - (y2 * 5) + (z2 * 1.5) },
                    visible: true
                  };
                }

                // Camera relative offset for Pt1
                const dx1 = x1 - camX;
                const dy1 = y1 - camY;
                const dz1 = z1 - camZ;
                const rx1 = dx1 * cosY - dz1 * sinY;
                const rz1_pre = dx1 * sinY + dz1 * cosY;
                const ry1 = dy1 * cosX + rz1_pre * sinX;
                const rz1 = -dy1 * sinX + rz1_pre * cosX;

                // Camera relative offset for Pt2
                const dx2 = x2 - camX;
                const dy2 = y2 - camY;
                const dz2 = z2 - camZ;
                const rx2 = dx2 * cosY - dz2 * sinY;
                const rz2_pre = dx2 * sinY + dz2 * cosY;
                const ry2 = dy2 * cosX + rz2_pre * sinX;
                const rz2 = -dy2 * sinX + rz2_pre * cosX;

                const near = 0.5;

                // If both are completely behind camera plane
                if (rz1 < near && rz2 < near) {
                  return { p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 }, visible: false };
                }

                let finalRx1 = rx1;
                let finalRy1 = ry1;
                let finalRz1 = rz1;
                let finalRx2 = rx2;
                let finalRy2 = ry2;
                let finalRz2 = rz2;

                // Clip point 1
                if (rz1 < near) {
                  const t = (near - rz1) / (rz2 - rz1);
                  finalRx1 = rx1 + t * (rx2 - rx1);
                  finalRy1 = ry1 + t * (ry2 - ry1);
                  finalRz1 = near;
                }

                // Clip point 2
                if (rz2 < near) {
                  const t = (near - rz1) / (rz2 - rz1);
                  finalRx2 = rx1 + t * (rx2 - rx1);
                  finalRy2 = ry1 + t * (ry2 - ry1);
                  finalRz2 = near;
                }

                const scale1 = 220 / finalRz1;
                const scale2 = 220 / finalRz2;

                return {
                  p1: { x: 200 + finalRx1 * scale1, y: 120 - finalRy1 * scale1 },
                  p2: { x: 200 + finalRx2 * scale2, y: 120 - finalRy2 * scale2 },
                  visible: true
                };
              };

              // Resolve real-time dynamic moving platform coordinates for smooth rendering!
              const actualParts = parts.map(p => {
                if (testMode === 'Play') {
                  if (p.specialBehavior === 'moving_hazard') {
                    const slowSineX = Math.sin(Date.now() * 0.0018) * 8.0;
                    return { ...p, x: p.x + slowSineX };
                  }
                  if (p.specialBehavior === 'moving_platform') {
                    const useZ = (p.sizeZ || 4) > (p.sizeX || 4);
                    const slowSine = Math.sin(Date.now() * 0.0012) * 6.0;
                    if (useZ) {
                      return { ...p, z: p.z + slowSine };
                    } else {
                      return { ...p, x: p.x + slowSine };
                    }
                  }
                }
                return p;
              });

              const sortedParts = actualParts.map(p => {
                const proj = project3D(p.x, p.y, p.z);
                return { part: p, proj };
              });

              // Sort by depth of projection descending (painter sorting algorithm)
              sortedParts.sort((a, b) => b.proj.depth - a.proj.depth);

              return (
                <svg viewBox="0 0 400 240" className="w-full h-full fill-none overflow-visible">
                  <defs>
                    <filter id="gizmo-shadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.85" />
                    </filter>
                  </defs>
                  
                  <g transform={`scale(${zoom})`} style={{ transformOrigin: '200px 120px', transition: 'transform 0.15s ease-out' }}>
                    
                    {/* ENDLESS PERSPECTIVE GROUND GRID SYSTEM (Y = 0 Floor Plane) */}
                    <g id="3d-modeling-grid" className="opacity-90">
                      {/* 1. Grid Lines Parallel to X-Axis (constant Z) */}
                      {Array.from({ length: 61 }).map((_, index) => {
                        const zVal = (index - 30) * 10; // -300 to 300
                        const xStart = -300;
                        const xEnd = 300;
                        
                        const line = render3DLine(xStart, 0, zVal, xEnd, 0, zVal);
                        
                        if (!line.visible) return null;

                        const isCenter = zVal === 0;
                        const distanceFromCenter = Math.abs(index - 30);
                        const opacity = Math.max(0.06, 0.55 - distanceFromCenter * 0.02);

                        return (
                          <line 
                            key={`grid-x-line-${index}`} 
                            x1={line.p1.x} 
                            y1={line.p1.y} 
                            x2={line.p2.x} 
                            y2={line.p2.y} 
                            stroke={isCenter ? '#ef4444' : '#71717a'} 
                            strokeWidth={isCenter ? '2.0' : '0.8'} 
                            opacity={isCenter ? 0.95 : opacity}
                          />
                        );
                      })}

                      {/* 2. Grid Lines Parallel to Z-Axis (constant X) */}
                      {Array.from({ length: 61 }).map((_, index) => {
                        const xVal = (index - 30) * 10; // -300 to 300
                        const zStart = -300;
                        const zEnd = 300;
                        
                        const line = render3DLine(xVal, 0, zStart, xVal, 0, zEnd);
                        
                        if (!line.visible) return null;

                        const isCenter = xVal === 0;
                        const distanceFromCenter = Math.abs(index - 30);
                        const opacity = Math.max(0.06, 0.55 - distanceFromCenter * 0.02);

                        return (
                          <line 
                            key={`grid-z-line-${index}`} 
                            x1={line.p1.x} 
                            y1={line.p1.y} 
                            x2={line.p2.x} 
                            y2={line.p2.y} 
                            stroke={isCenter ? '#3b82f6' : '#71717a'} 
                            strokeWidth={isCenter ? '2.0' : '0.8'} 
                            opacity={isCenter ? 0.95 : opacity}
                          />
                        );
                      })}

                      {/* 3. Vertical Y-Axis Ascent Guide at Origin Center (0, 0, 0) */}
                      {(() => {
                        const line = render3DLine(0, 0, 0, 0, 30, 0);
                        if (!line.visible) return null;
                        return (
                          <line x1={line.p1.x} y1={line.p1.y} x2={line.p2.x} y2={line.p2.y} stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                        );
                      })()}

                      {/* Axis Cardinal Direction Labels */}
                      {(() => {
                        const ptY = project3D(0, 32, 0);
                        const ptX_pos = project3D(41, 0, 0);
                        const ptX_neg = project3D(-41, 0, 0);
                        const ptZ_pos = project3D(0, 0, 41);
                        const ptZ_neg = project3D(0, 0, -41);

                        return (
                          <g opacity="0.75" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                            {!ptY.clipped && <text x={ptY.x} y={ptY.y} fill="#10b981" textAnchor="middle">Y Axis (Up)</text>}
                            {!ptX_pos.clipped && <text x={ptX_pos.x} y={ptX_pos.y} fill="#ef4444" textAnchor="start">+X (Right)</text>}
                            {!ptX_neg.clipped && <text x={ptX_neg.x} y={ptX_neg.y} fill="#991b1b" textAnchor="end">-X (Left)</text>}
                            {!ptZ_pos.clipped && <text x={ptZ_pos.x} y={ptZ_pos.y} fill="#3b82f6" textAnchor="middle">+Z (Forward)</text>}
                            {!ptZ_neg.clipped && <text x={ptZ_neg.x} y={ptZ_neg.y} fill="#1e3a8a" textAnchor="middle">-Z (Backward)</text>}
                          </g>
                        );
                      })()}
                    </g>
                    
                    {/* Dynamic projections of parts based on position */}
                    {sortedParts.map(({ part: p, proj }) => {
                      // Skip rendering candy coin if collected during simulation play mode
                      if (testMode === 'Play' && p.specialBehavior === 'candy_coin' && collectedCoinIds.has(p.id)) {
                        return null;
                      }

                      if (proj.clipped) return null;

                      // Apply gorgeous 3D isometric perspective projection
                      const centerX = proj.x;
                      const centerY = proj.y;
                      const isSelected = selectedPartIds.includes(p.id);
                      const isPrimarySelected = selectedPartId === p.id;

                      if (p.name === 'Baseplate_Grid') {
                        // Wide baseplate grid is represented visually by our endless grid backdrop
                        return null;
                      }

                      const sizeX = p.sizeX || 4;
                      const sizeY = p.sizeY || 4;
                      const sizeZ = p.sizeZ || 4;

                      const isPerspectiveMode = testMode === 'Edit' || cameraMode !== 'Isometric' || freeLookYaw !== 0 || freeLookPitch !== 0;
                      // Mode Scale Correction avoids discontinuous shrinkage jumps when activating free-look or choosing cameras
                      const activeCamMode = testMode === 'Edit' ? 'Isometric' : cameraMode;
                      const modeScaleCorrection = activeCamMode === 'Isometric' ? 1.727 : activeCamMode === '3rd' ? 1.1 : 1.0;
                      const scFactor = isPerspectiveMode ? (proj.scale * modeScaleCorrection) : 1.0;

                const angleRad = ((p.rotation || 0) * Math.PI) / 180;
                const cosRot = Math.cos(angleRad);
                const sinRot = Math.sin(angleRad);
                const hasBlockOr3DRotation = p.type === 'Block' || p.type === 'Cylinder' || p.type === 'CustomSculpt';

                return (
                  <g 
                    key={p.id} 
                    className="cursor-pointer part-g"
                    onClick={(e) => handlePartSelection(e, p.id)}
                    transform={`rotate(${hasBlockOr3DRotation ? 0 : (p.rotation || 0)}, ${centerX}, ${centerY})`}
                  >
                    {/* Element Render Cylinder/Sphere vs Block */}
                    {p.type === 'Block' ? (
                      /* Styled isometric cube projection scaled by sizeX, sizeY, sizeZ */
                      (() => {
                        const dx = sizeX / 2;
                        const dy = sizeY / 2;
                        const dz = sizeZ / 2;

                        const localVertices = [
                          { x: -dx, y: -dy, z: -dz }, // 0
                          { x:  dx, y: -dy, z: -dz }, // 1
                          { x:  dx, y: -dy, z:  dz }, // 2
                          { x: -dx, y: -dy, z:  dz }, // 3
                          { x: -dx, y:  dy, z: -dz }, // 4
                          { x:  dx, y:  dy, z: -dz }, // 5
                          { x:  dx, y:  dy, z:  dz }, // 6
                          { x: -dx, y:  dy, z:  dz }, // 7
                        ];

                        const rotatedVertices = localVertices.map(v => ({
                          x: v.x * cosRot - v.z * sinRot,
                          y: v.y,
                          z: v.x * sinRot + v.z * cosRot
                        }));

                        const worldVertices = rotatedVertices.map(v => ({
                          x: p.x + v.x,
                          y: p.y + v.y,
                          z: p.z + v.z
                        }));

                        const projectedVertices = worldVertices.map(wv => project3D(wv.x, wv.y, wv.z));

                        const faces = [
                          { name: 'Top',    indices: [4, 5, 6, 7], normalDefault: { x:  0, y:  1, z:  0 } },
                          { name: 'Bottom', indices: [0, 3, 2, 1], normalDefault: { x:  0, y: -1, z:  0 } },
                          { name: 'Front',  indices: [3, 2, 6, 7], normalDefault: { x:  0, y:  0, z:  1 } },
                          { name: 'Back',   indices: [0, 1, 5, 4], normalDefault: { x:  0, y:  0, z: -1 } },
                          { name: 'Left',   indices: [0, 3, 7, 4], normalDefault: { x: -1, y:  0, z:  0 } },
                          { name: 'Right',  indices: [1, 2, 6, 5], normalDefault: { x:  1, y:  0, z:  0 } }
                        ];

                        const rotatedFaces = faces.map(f => {
                          const nd = f.normalDefault;
                          const nx = nd.x * cosRot - nd.z * sinRot;
                          const ny = nd.y;
                          const nz = nd.x * sinRot + nd.z * cosRot;
                          return {
                            ...f,
                            normal: { x: nx, y: ny, z: nz }
                          };
                        });

                        const facesWithData = rotatedFaces.map(f => {
                          const projA = projectedVertices[f.indices[0]];
                          const projB = projectedVertices[f.indices[1]];
                          const projC = projectedVertices[f.indices[2]];
                          const projD = projectedVertices[f.indices[3]];

                          const avgDepth = (projA.depth + projB.depth + projC.depth + projD.depth) / 4;
                          const isClipped = projA.clipped || projB.clipped || projC.clipped || projD.clipped;

                          // Dynamic light source shining from top-right-front: normal normalized to {0.4, 0.8, 0.4}
                          const dot = f.normal.x * 0.4 + f.normal.y * 0.8 + f.normal.z * 0.4;
                          const intensity = 0.55 + 0.45 * Math.max(0, dot);

                          return {
                            ...f,
                            avgDepth,
                            isClipped,
                            intensity,
                            pointsStr: `${projA.x},${projA.y} ${projB.x},${projB.y} ${projC.x},${projC.y} ${projD.x},${projD.y}`
                          };
                        });

                        const renderableFaces = facesWithData
                          .filter(f => !f.isClipped)
                          .sort((a, b) => b.avgDepth - a.avgDepth);

                        return (
                          <g>
                            {renderableFaces.map((f, fIdx) => {
                              const showShading = p.material !== 'Neon';
                              const shadowOpacity = showShading ? Math.max(0, 0.45 - (f.intensity - 0.55) * 0.7) : 0;

                              let texOpacity = "0.7";
                              if (f.name === 'Top') texOpacity = "0.82";
                              else if (f.name === 'Left') texOpacity = "0.65";
                              else if (f.name === 'Right') texOpacity = "0.52";

                              return (
                                <g key={`face-${p.id}-${f.name}-${fIdx}`}>
                                  {/* Base color polygon */}
                                  <polygon
                                    points={f.pointsStr}
                                    fill={p.color}
                                    stroke={isSelected ? 'white' : 'rgba(255,255,255,0.1)'}
                                    strokeWidth={isSelected ? '2' : '0.5'}
                                  />
                                  {/* Shadow shading overlay */}
                                  {shadowOpacity > 0 && (
                                    <polygon
                                      points={f.pointsStr}
                                      fill="#000000"
                                      opacity={shadowOpacity}
                                      pointerEvents="none"
                                    />
                                  )}
                                  {/* Custom applied texture overlay */}
                                  {p.customTextureId && (
                                    <polygon
                                      points={f.pointsStr}
                                      fill={`url(#tex-${p.id}-${p.customTextureId})`}
                                      opacity={texOpacity}
                                      pointerEvents="none"
                                    />
                                  )}
                                </g>
                              );
                            })}
                          </g>
                        );
                      })()
                    ) : p.type === 'Cylinder' ? (
                      /* Styled isometric cylinder projection with 3D orientation */
                      (() => {
                        const topCenter = project3D(p.x, p.y + sizeY / 2, p.z);
                        const bottomCenter = project3D(p.x, p.y - sizeY / 2, p.z);
                        if (topCenter.clipped || bottomCenter.clipped) return null;

                        const rx = sizeX * 2.8 * (topCenter.scale || scFactor);
                        const ry = sizeZ * 1.4 * (topCenter.scale || scFactor);
                        const h = Math.max(2, bottomCenter.y - topCenter.y);

                        const cxTop = topCenter.x;
                        const cyTop = topCenter.y;
                        const cxBottom = bottomCenter.x;
                        const cyBottom = bottomCenter.y;

                        return (
                          <g>
                            {/* Bottom face */}
                            <ellipse cx={cxBottom} cy={cyBottom} rx={rx} ry={ry} fill={p.color} opacity="0.7" />
                            {p.customTextureId && (
                              <ellipse cx={cxBottom} cy={cyBottom} rx={rx} ry={ry} fill={`url(#tex-${p.id}-${p.customTextureId})`} opacity="0.65" pointerEvents="none" />
                            )}
                            {/* Side body path */}
                            <path 
                              d={`M ${cxTop - rx} ${cyTop} L ${cxBottom - rx} ${cyBottom} A ${rx} ${ry} 0 0 0 ${cxBottom + rx} ${cyBottom} L ${cxTop + rx} ${cyTop} A ${rx} ${ry} 0 0 1 ${cxTop - rx} ${cyTop}`} 
                              fill={p.color} 
                              opacity="0.85" 
                            />
                            {p.customTextureId && (
                              <path 
                                d={`M ${cxTop - rx} ${cyTop} L ${cxBottom - rx} ${cyBottom} A ${rx} ${ry} 0 0 0 ${cxBottom + rx} ${cyBottom} L ${cxTop + rx} ${cyTop} A ${rx} ${ry} 0 0 1 ${cxTop - rx} ${cyTop}`} 
                                fill={`url(#tex-${p.id}-${p.customTextureId})`} 
                                opacity="0.65" 
                                pointerEvents="none" 
                              />
                            )}
                            {/* Top face */}
                            <ellipse 
                              cx={cxTop} 
                              cy={cyTop} 
                              rx={rx} 
                              ry={ry} 
                              fill={p.color} 
                              stroke={isSelected ? 'white' : 'rgba(255,255,255,0.1)'} 
                              strokeWidth={isSelected ? '2' : '0.5'} 
                            />
                            {p.customTextureId && (
                              <ellipse 
                                cx={cxTop} 
                                cy={cyTop} 
                                rx={rx} 
                                ry={ry} 
                                fill={`url(#tex-${p.id}-${p.customTextureId})`} 
                                opacity="0.82"
                                pointerEvents="none"
                              />
                            )}
                          </g>
                        );
                      })()
                    ) : p.type === 'CustomSculpt' ? (
                      /* Display miniature sculpted model with real-time 3D camera projections */
                      (() => {
                        const hHeights = p.sculptHeights || [];
                        const hShape = p.sculptShape || 'Sphere';
                        const hRes = p.sculptResolution || 20;
                        const hColor = p.sculptColor || p.color;
                        const hShader = p.sculptShader || 'Clay';
                        
                        if (hHeights.length === 0) return null;

                        const polygonsToRender: { points: string; fill: string; depth: number; }[] = [];
                        const scale = (p.sizeX || 6) * 0.14;
                        const stepSz = hRes > 12 ? 2 : 1; 

                        for (let i = 0; i < hRes - stepSz; i += stepSz) {
                          for (let j = 0; j < hRes - stepSz; j += stepSz) {
                            const indices = [
                              { r: i, c: j },
                              { r: i, c: j + stepSz },
                              { r: i + stepSz, c: j + stepSz },
                              { r: i + stepSz, c: j }
                            ];
                            
                            let polyClipped = false;
                            const corners = indices.map(idx => {
                              const v3d = get3DVertex(idx.r, idx.c, hHeights, hShape, hRes);
                              
                              const rotatedX = (v3d.x * scale) * cosRot - (v3d.z * scale) * sinRot;
                              const rotatedZ = (v3d.x * scale) * sinRot + (v3d.z * scale) * cosRot;

                              const worldX = p.x + rotatedX;
                              const worldY = p.y + (v3d.y * scale);
                              const worldZ = p.z + rotatedZ;

                              const projVert = project3D(worldX, worldY, worldZ);
                              if (projVert.clipped) polyClipped = true;
                              
                              return { px: projVert.x, py: projVert.y, z: projVert.depth };
                            });

                            if (polyClipped) continue;
                            
                            const avgZ = corners.reduce((sum, pt) => sum + pt.z, 0) / 4;
                            const ptsStr = corners.map(pt => `${pt.px},${pt.py}`).join(' ');
                            const avgHeight = indices.reduce((sum, idx) => sum + (hHeights[idx.r]?.[idx.c] || 0), 0) / 4;
                            
                            const flat3DVertices = indices.map(idx => {
                              const v3d = get3DVertex(idx.r, idx.c, hHeights, hShape, hRes);
                              return { x: v3d.x * scale, y: v3d.y * scale, z: v3d.z * scale };
                            });
                            
                            const fillClr = getPolygonColor(flat3DVertices, hColor, hShader, avgHeight);
                            
                            polygonsToRender.push({
                              points: ptsStr,
                              fill: fillClr,
                              depth: avgZ
                            });
                          }
                        }
                        
                        polygonsToRender.sort((a, b) => b.depth - a.depth);
                        
                        return (
                          <g>
                            {polygonsToRender.map((poly, idx) => {
                              const hasTexture = p.sculptTexture && p.sculptTexture !== 'none';
                              return (
                                <g key={`poly-g-${p.id}-${idx}`}>
                                  <polygon
                                    points={poly.points}
                                    fill={poly.fill}
                                    stroke={isSelected ? 'white' : hShader === 'Wireframe' ? hColor : 'rgba(0,0,0,0.18)'}
                                    strokeWidth={isSelected ? '0.7' : hShader === 'Wireframe' ? '0.4' : '0.15'}
                                    opacity="0.95"
                                  />
                                  {hasTexture && hShader !== 'Wireframe' && (
                                    <polygon
                                      points={poly.points}
                                      fill={`url(#tex-${p.sculptTexture})`}
                                      opacity="0.32"
                                      pointerEvents="none"
                                    />
                                  )}
                                </g>
                              );
                            })}
                          </g>
                        );
                      })()
                    ) : (
                      /* Styled sphere projection scaling with perspective scale factor */
                      (() => {
                        const r = Math.max(5, sizeX * 3.5 * scFactor);
                        return (
                          <g>
                            <circle 
                              cx={centerX} 
                              cy={centerY + 4} 
                              r={r} 
                              fill={`url(#glowGrad_${p.id})`}
                              stroke={isSelected ? 'white' : 'rgba(255,255,255,0.1)'}
                              strokeWidth={isSelected ? '2' : '0.5'}
                            />
                            <defs>
                               <radialGradient id={`glowGrad_${p.id}`} cx="30%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                                <stop offset="35%" stopColor={p.color} />
                                <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
                              </radialGradient>
                            </defs>
                          </g>
                        );
                      })()
                    )}

                    {/* SPECIAL BLOCK PLAYGROUND GRAPHICS & SKINS */}
                    {p.specialBehavior && p.specialBehavior !== 'none' && (
                      <g style={{ pointerEvents: 'none' }}>
                        {/* 1. Respawners stars and active green checkpoints */}
                        {p.specialBehavior === 'respawn_star' && (
                          <g>
                            <circle cx={centerX} cy={centerY} r={8 + sizeX * 1.5} fill="none" stroke={activeCheckpointId === p.id ? "#10b981" : "#ec4899"} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
                            <rect x={centerX - 1.5} y={centerY - 35} width="3" height="35" fill="url(#checkpointPole)" opacity="0.6" />
                            <text x={centerX} y={centerY - 36} textAnchor="middle" fontSize="13px" className="animate-bounce" pointerEvents="none">
                              {activeCheckpointId === p.id ? "🏁" : "⭐"}
                            </text>
                            {activeCheckpointId === p.id && (
                              <text x={centerX} y={centerY - 52} textAnchor="middle" fontSize="7.5px" fontWeight="black" fill="#10b981" letterSpacing="0.1em" className="animate-pulse">
                                SAVED
                              </text>
                            )}
                            <defs>
                              <linearGradient id="checkpointPole" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={activeCheckpointId === p.id ? "#10b981" : "#ec4899"} stopOpacity="1" />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
                              </linearGradient>
                            </defs>
                          </g>
                        )}

                        {/* 2. Hot Lava Melt Block */}
                        {p.specialBehavior === 'lava_melt' && (
                          <g>
                            <ellipse cx={centerX} cy={centerY} rx={sizeX * 3.8} ry={sizeZ * 2.4} fill="none" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" className="animate-ping" opacity="0.32" />
                            <text x={centerX} y={centerY - (sizeY * 4.5) - 4} textAnchor="middle" fontSize="12px" className="animate-bounce" pointerEvents="none">🔥</text>
                          </g>
                        )}

                        {/* 3. Spiky Ouch Pad */}
                        {p.specialBehavior === 'spiky_ouch' && (
                          <g>
                            <ellipse cx={centerX} cy={centerY} rx={sizeX * 3.8} ry={sizeZ * 2.4} fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="1 1" opacity="0.5" />
                            <text x={centerX} y={centerY - (sizeY * 4.5) - 4} textAnchor="middle" fontSize="11px" className="animate-pulse" pointerEvents="none">🌵</text>
                          </g>
                        )}

                        {/* 4. Ghostly Illusion */}
                        {p.specialBehavior === 'ghost_illusion' && (
                          <g>
                            <text x={centerX} y={centerY - (sizeY * 4.5) - 4} textAnchor="middle" fontSize="12px" pointerEvents="none" className="opacity-80">👻</text>
                          </g>
                        )}

                        {/* 5. Magic Heart Healer */}
                        {p.specialBehavior === 'heart_healer' && (
                          <g>
                            <circle cx={centerX} cy={centerY} r={10 + sizeX * 1.5} fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" className="animate-pulse" opacity="0.6" />
                            <text x={centerX} y={centerY - (sizeY * 4.5) - 6} textAnchor="middle" fontSize="13px" className="animate-bounce" pointerEvents="none">❤️</text>
                          </g>
                        )}

                        {/* 6. Bounce Pad elastic trampoline */}
                        {p.specialBehavior === 'bounce_pad' && (
                          <g>
                            <path d={`M ${centerX - 7} ${centerY - 6} Q ${centerX} ${centerY - 16} ${centerX + 7} ${centerY - 6}`} fill="none" stroke="#3b82f6" strokeWidth="2" className="animate-pulse" />
                            <text x={centerX} y={centerY - (sizeY * 4.5) - 4} textAnchor="middle" fontSize="12px" className="animate-bounce" pointerEvents="none">🚀</text>
                          </g>
                        )}

                        {/* 7. Speed Boost chevrons */}
                        {p.specialBehavior === 'speed_boost' && (
                          <g>
                            <ellipse cx={centerX} cy={centerY} rx={sizeX * 3.8} ry={sizeZ * 2.4} fill="none" stroke="#eab308" strokeWidth="1" strokeDasharray="3 1" className="animate-pulse" />
                            <text x={centerX} y={centerY - (sizeY * 4.5) - 4} textAnchor="middle" fontSize="12px" className="animate-pulse" pointerEvents="none">⚡</text>
                          </g>
                        )}

                        {/* 8. Gold Candy Coin */}
                        {p.specialBehavior === 'candy_coin' && (
                          <g>
                            <circle cx={centerX} cy={centerY - 10} r="12" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="3 3" className="animate-pulse" opacity="0.8" />
                            <circle cx={centerX} cy={centerY - 10} r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                            <circle cx={centerX} cy={centerY - 10} r="4" fill="#fbbf24" />
                            <text x={centerX} y={centerY - 10} textAnchor="middle" fontSize="6px" fontWeight="black" fill="#b45309" pointerEvents="none">🪙</text>
                          </g>
                        )}

                        {/* 9. Dimension Rift Portal */}
                        {p.specialBehavior === 'dimension_rift_portal' && (
                          <g>
                            <circle cx={centerX} cy={centerY} r={14 + sizeX * 1.5} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="4 2" className="animate-spin" style={{ transformOrigin: `${centerX}px ${centerY}px`, animationDuration: '4s' }} opacity="0.8" />
                            <ellipse cx={centerX} cy={centerY} rx={sizeX * 4} ry={sizeZ * 2.5} fill="rgba(99, 102, 241, 0.15)" stroke="#a5b4fc" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
                            <text x={centerX} y={centerY - (sizeY * 4.5) - 6} textAnchor="middle" fontSize="14px" className="animate-bounce" pointerEvents="none">🌀</text>
                            <text x={centerX} y={centerY + 16} textAnchor="middle" fontSize="6.5px" fontWeight="black" fill="#a5b4fc" letterSpacing="0.05em" className="animate-pulse font-mono">RIFT PORTAL</text>
                          </g>
                        )}

                        {/* 10. Anti-Gravity Moon Block */}
                        {p.specialBehavior === 'low_gravity_moon' && (
                          <g>
                            <circle cx={centerX} cy={centerY} r={12 + sizeX * 1.5} fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="4 4" className="animate-pulse" opacity="0.75" />
                            <text x={centerX} y={centerY - (sizeY * 4.5) - 4} textAnchor="middle" fontSize="13px" className="animate-bounce" pointerEvents="none">☁️</text>
                          </g>
                        )}

                        {/* 11. High Gravity Mud Trap */}
                        {p.specialBehavior === 'high_gravity_mud' && (
                          <g>
                            <ellipse cx={centerX} cy={centerY} rx={sizeX * 3.6} ry={sizeZ * 2.2} fill="none" stroke="#78350f" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                            <text x={centerX} y={centerY - (sizeY * 4.5) - 4} textAnchor="middle" fontSize="12px" pointerEvents="none">🟫</text>
                          </g>
                        )}

                        {/* 12. Scale Shrink Ray */}
                        {p.specialBehavior === 'shrink_ray' && (
                          <g>
                            <ellipse cx={centerX} cy={centerY} rx={8 + sizeX * 1.2} ry={6 + sizeZ * 1.2} fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" className="animate-pulse" opacity="0.7" />
                            <text x={centerX} y={centerY - (sizeY * 4.5) - 5} textAnchor="middle" fontSize="12px" className="animate-pulse" pointerEvents="none">🧪</text>
                          </g>
                        )}

                        {/* 13. Giant Grow Ray */}
                        {p.specialBehavior === 'grow_ray' && (
                          <g>
                            <ellipse cx={centerX} cy={centerY} rx={14 + sizeX * 1.5} ry={10 + sizeZ * 1.5} fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" className="animate-pulse" opacity="0.7" />
                            <text x={centerX} y={centerY - (sizeY * 4.5) - 5} textAnchor="middle" fontSize="12px" className="animate-bounce" pointerEvents="none">💊</text>
                          </g>
                        )}

                        {/* 14. Points Drainer Pad */}
                        {p.specialBehavior === 'point_drainer' && (
                          <g>
                            <ellipse cx={centerX} cy={centerY} rx={sizeX * 3.8} ry={sizeZ * 2.4} fill="none" stroke="#7c2d12" strokeWidth="1" strokeDasharray="1 1" opacity="0.8" />
                            <text x={centerX} y={centerY - (sizeY * 4.5) - 4} textAnchor="middle" fontSize="12px" className="animate-pulse" pointerEvents="none">💀</text>
                          </g>
                        )}

                        {/* 15. Random Mystery Dice */}
                        {p.specialBehavior === 'mystery_dice' && (
                          <g>
                            <circle cx={centerX} cy={centerY} r={12 + sizeX * 1.2} fill="none" stroke="#ec4899" strokeWidth="1.2" strokeDasharray="2 4" className="animate-spin" style={{ transformOrigin: `${centerX}px ${centerY}px`, animationDuration: '6s' }} opacity="0.8" />
                            <text x={centerX} y={centerY - (sizeY * 4.5) - 5} textAnchor="middle" fontSize="13px" className="animate-bounce" pointerEvents="none">🎲</text>
                          </g>
                        )}
                      </g>
                    )}

                    {/* Direct Interactive Vector Gizmos overlays on primary selection */}
                    {isPrimarySelected && (
                      <g filter="url(#gizmo-shadow)" className="gizmo-control">
                        {/* 1. INTERACTIVE TRANSLATION/MOVE GIZMO */}
                        {activeTool === 'Move' && (() => {
                          const renderArrow = (
                            cx: number, 
                            cy: number, 
                            angleRad: number, 
                            colorLight: string, 
                            colorDark: string, 
                            isDragging: boolean
                          ) => {
                            const H = 16 * scFactor * (isDragging ? 1.35 : 1.0);
                            const W = 11 * scFactor * (isDragging ? 1.35 : 1.0);
                            const ux = Math.cos(angleRad);
                            const uy = Math.sin(angleRad);
                            const bx = cx - ux * H;
                            const by = cy - uy * H;
                            const px = -uy;
                            const py = ux;
                            const lx = bx + px * (W / 2);
                            const ly = by + py * (W / 2);
                            const rx = bx - px * (W / 2);
                            const ry = by - py * (W / 2);

                            return (
                              <g style={{ pointerEvents: 'none' }}>
                                {/* Left side face of 3D cone (Light facet) */}
                                <polygon 
                                  points={`${cx},${cy} ${lx},${ly} ${bx},${by}`} 
                                  fill={colorLight} 
                                  stroke={colorLight}
                                  strokeWidth="0.5"
                                />
                                {/* Right side face of 3D cone (Dark facet) */}
                                <polygon 
                                  points={`${cx},${cy} ${rx},${ry} ${bx},${by}`} 
                                  fill={colorDark} 
                                  stroke={colorDark}
                                  strokeWidth="0.5"
                                />
                              </g>
                            );
                          };

                          const tipY_up = centerY - (35 + sizeY * 1.5) * scFactor;
                          const tipY_down = centerY + (25 + sizeY * 1.5) * scFactor;
                          const tipX_right = centerX + (35 + sizeX * 1.5) * scFactor;
                          const tipX_left = centerX - (35 + sizeX * 1.5) * scFactor;
                          const tipX_fwd = centerX - (25 + sizeZ * 1.5) * scFactor;
                          const tipY_fwd = centerY + (18 + sizeZ * 1.2) * scFactor;
                          const tipX_bwd = centerX + (25 + sizeZ * 1.5) * scFactor;
                          const tipY_bwd = centerY - (18 + sizeZ * 1.2) * scFactor;

                          return (
                            <g>
                              {/* Y-Axis (Green Vertical) Up and Down Lines */}
                              <line x1={centerX} y1={centerY} x2={centerX} y2={tipY_up} stroke="#10b981" strokeWidth="2" strokeDasharray="1 1" />
                              <line x1={centerX} y1={centerY} x2={centerX} y2={tipY_down} stroke="#065f46" strokeWidth="1.5" strokeDasharray="1 1" />

                              {/* X-Axis (Red Horizontal) Left and Right Lines */}
                              <line x1={centerX} y1={centerY} x2={tipX_right} y2={centerY} stroke="#f87171" strokeWidth="2" strokeDasharray="1 1" />
                              <line x1={centerX} y1={centerY} x2={tipX_left} y2={centerY} stroke="#991b1b" strokeWidth="1.5" strokeDasharray="1 1" />

                              {/* Z-Axis (Blue Oblique Depth) Forward and Backward Lines */}
                              <line x1={centerX} y1={centerY} x2={tipX_fwd} y2={tipY_fwd} stroke="#60a5fa" strokeWidth="2" strokeDasharray="1 1" />
                              <line x1={centerX} y1={centerY} x2={tipX_bwd} y2={tipY_bwd} stroke="#1e3a8a" strokeWidth="1.5" strokeDasharray="1 1" />

                              {/* Move Up Globe (+Y) */}
                              <g>
                                {renderArrow(
                                  centerX, 
                                  tipY_up, 
                                  -Math.PI / 2, 
                                  isDraggingThis('Move', 'y') ? '#34d399' : '#10b981', 
                                  isDraggingThis('Move', 'y') ? '#10b981' : '#059669', 
                                  isDraggingThis('Move', 'y')
                                )}
                                <circle 
                                  cx={centerX} 
                                  cy={tipY_up} 
                                  r={(isDraggingThis('Move', 'y') ? 14 : 10) * Math.max(0.65, scFactor)} 
                                  fill="transparent" 
                                  className="cursor-pointer touch-none"
                                  onClick={(e) => { e.stopPropagation(); handleGizmoAction('Move', 'y', 2); }}
                                  onPointerDown={(e) => handlePointerDown(e, 'Move', 'y', p.y)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                >
                                  <title>Drag vertically or Click to Move Up (+2 Studs Y)</title>
                                </circle>
                              </g>

                              {/* Move Down Globe (-Y) */}
                              <g>
                                {renderArrow(
                                  centerX, 
                                  tipY_down, 
                                  Math.PI / 2, 
                                  isDraggingThis('Move', 'y') ? '#10b981' : '#059669', 
                                  isDraggingThis('Move', 'y') ? '#047857' : '#064e3b', 
                                  isDraggingThis('Move', 'y')
                                )}
                                <circle 
                                  cx={centerX} 
                                  cy={tipY_down} 
                                  r={(isDraggingThis('Move', 'y') ? 14 : 10) * Math.max(0.65, scFactor)} 
                                  fill="transparent" 
                                  className="cursor-pointer touch-none"
                                  onClick={(e) => { e.stopPropagation(); handleGizmoAction('Move', 'y', -2); }}
                                  onPointerDown={(e) => handlePointerDown(e, 'Move', 'y', p.y)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                >
                                  <title>Drag vertically or Click to Move Down (-2 Studs Y)</title>
                                </circle>
                              </g>

                              {/* Move Right Globe (+X) */}
                              <g>
                                {renderArrow(
                                  tipX_right, 
                                  centerY, 
                                  0, 
                                  isDraggingThis('Move', 'x') ? '#fca5a5' : '#f87171', 
                                  isDraggingThis('Move', 'x') ? '#ef4444' : '#b91c1c', 
                                  isDraggingThis('Move', 'x')
                                )}
                                <circle 
                                  cx={tipX_right} 
                                  cy={centerY} 
                                  r={(isDraggingThis('Move', 'x') ? 14 : 10) * Math.max(0.65, scFactor)} 
                                  fill="transparent" 
                                  className="cursor-pointer touch-none"
                                  onClick={(e) => { e.stopPropagation(); handleGizmoAction('Move', 'x', 2); }}
                                  onPointerDown={(e) => handlePointerDown(e, 'Move', 'x', p.x)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                >
                                  <title>Drag horizontally or Click to Move Right (+2 Studs X)</title>
                                </circle>
                              </g>

                              {/* Move Left Globe (-X) */}
                              <g>
                                {renderArrow(
                                  tipX_left, 
                                  centerY, 
                                  Math.PI, 
                                  isDraggingThis('Move', 'x') ? '#ef4444' : '#b91c1c', 
                                  isDraggingThis('Move', 'x') ? '#dc2626' : '#7f1d1d', 
                                  isDraggingThis('Move', 'x')
                                )}
                                <circle 
                                  cx={tipX_left} 
                                  cy={centerY} 
                                  r={(isDraggingThis('Move', 'x') ? 14 : 10) * Math.max(0.65, scFactor)} 
                                  fill="transparent" 
                                  className="cursor-pointer touch-none"
                                  onClick={(e) => { e.stopPropagation(); handleGizmoAction('Move', 'x', -2); }}
                                  onPointerDown={(e) => handlePointerDown(e, 'Move', 'x', p.x)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                >
                                  <title>Drag horizontally or Click to Move Left (-2 Studs X)</title>
                                </circle>
                              </g>

                              {/* Move Forward Globe (+Z) */}
                              <g>
                                {renderArrow(
                                  tipX_fwd, 
                                  tipY_fwd, 
                                  Math.atan2(tipY_fwd - centerY, tipX_fwd - centerX), 
                                  isDraggingThis('Move', 'z') ? '#93c5fd' : '#60a5fa', 
                                  isDraggingThis('Move', 'z') ? '#3b82f6' : '#1d4ed8', 
                                  isDraggingThis('Move', 'z')
                                )}
                                <circle 
                                  cx={tipX_fwd} 
                                  cy={tipY_fwd} 
                                  r={(isDraggingThis('Move', 'z') ? 14 : 10) * Math.max(0.65, scFactor)} 
                                  fill="transparent" 
                                  className="cursor-pointer touch-none"
                                  onClick={(e) => { e.stopPropagation(); handleGizmoAction('Move', 'z', 2); }}
                                  onPointerDown={(e) => handlePointerDown(e, 'Move', 'z', p.z)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                >
                                  <title>Drag diagonally or Click to Move Forward (+2 Studs Z)</title>
                                </circle>
                              </g>

                              {/* Move Backward Globe (-Z) */}
                              <g>
                                {renderArrow(
                                  tipX_bwd, 
                                  tipY_bwd, 
                                  Math.atan2(tipY_bwd - centerY, tipX_bwd - centerX), 
                                  isDraggingThis('Move', 'z') ? '#3b82f6' : '#1d4ed8', 
                                  isDraggingThis('Move', 'z') ? '#2563eb' : '#172554', 
                                  isDraggingThis('Move', 'z')
                                )}
                                <circle 
                                  cx={tipX_bwd} 
                                  cy={tipY_bwd} 
                                  r={(isDraggingThis('Move', 'z') ? 14 : 10) * Math.max(0.65, scFactor)} 
                                  fill="transparent" 
                                  className="cursor-pointer touch-none"
                                  onClick={(e) => { e.stopPropagation(); handleGizmoAction('Move', 'z', -2); }}
                                  onPointerDown={(e) => handlePointerDown(e, 'Move', 'z', p.z)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                >
                                  <title>Drag diagonally or Click to Move Backward (-2 Studs Z)</title>
                                </circle>
                              </g>
                            </g>
                          );
                        })()}

                        {/* 2. INTERACTIVE ROTATION GIZMO (Orbit rings and cardinal rotation buttons) */}
                        {activeTool === 'Rotate' && (() => {
                          const yawRx = (23 + sizeX * 2.6) * scFactor;
                          const yawRy = (12 + sizeZ * 1.6) * scFactor;

                          return (
                            <g>
                              {/* Red Ring (Vertical Pitch - YZ-plane) */}
                              <ellipse 
                                cx={centerX} 
                                cy={centerY} 
                                rx={(14 + sizeZ * 2.1) * scFactor} 
                                ry={(25 + sizeY * 2.5) * scFactor} 
                                transform={`rotate(-30, ${centerX}, ${centerY})`} 
                                stroke="#ef4444" 
                                strokeWidth="1.5" 
                                fill="none" 
                                className="opacity-75" 
                              />

                              {/* Blue Ring (Vertical Roll - XY-plane) */}
                              <ellipse 
                                cx={centerX} 
                                cy={centerY} 
                                rx={(14 + sizeX * 2.1) * scFactor} 
                                ry={(25 + sizeY * 2.5) * scFactor} 
                                transform={`rotate(30, ${centerX}, ${centerY})`} 
                                stroke="#3b82f6" 
                                strokeWidth="1.5" 
                                fill="none" 
                                className="opacity-75" 
                              />

                              {/* Green Ring (Horizontal Yaw - XZ-plane) */}
                              <ellipse 
                                cx={centerX} 
                                cy={centerY} 
                                rx={yawRx} 
                                ry={yawRy} 
                                stroke="#10b981" 
                                strokeWidth="1.8" 
                                fill="none" 
                                className="opacity-80" 
                              />

                              {/* Outer dash perimeter ring (Yellow space) */}
                              <circle 
                                cx={centerX} 
                                cy={centerY} 
                                r={(28 + Math.max(sizeX, sizeY, sizeZ) * 2.6) * scFactor} 
                                stroke="#f59e0b" 
                                strokeWidth="1" 
                                strokeDasharray="3 3" 
                                fill="none" 
                                className="opacity-45" 
                              />

                              <circle cx={centerX} cy={centerY} r="2.5" fill="#f59e0b" />

                              {/* Right CW Handle (+15°) */}
                              <g>
                                <circle 
                                  cx={centerX + yawRx} 
                                  cy={centerY} 
                                  r={(isDraggingThis('Rotate', 'rotation') ? 11 : 8) * Math.max(0.65, scFactor)} 
                                  fill="#f59e0b" 
                                  stroke="white" 
                                  strokeWidth="1.5"
                                  className="cursor-pointer transition-all duration-150 hover:brightness-125 touch-none"
                                  onPointerDown={(e) => handlePointerDown(e, 'Rotate', 'rotation', p.rotation || 0)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                />
                                <circle 
                                  cx={centerX + yawRx} 
                                  cy={centerY} 
                                  r={4 * Math.max(0.65, scFactor)} 
                                  fill="#fef08a" 
                                  pointerEvents="none"
                                />
                              </g>

                              {/* Left CCW Handle (-15°) */}
                              <g>
                                <circle 
                                  cx={centerX - yawRx} 
                                  cy={centerY} 
                                  r={(isDraggingThis('Rotate', 'rotation') ? 11 : 8) * Math.max(0.65, scFactor)} 
                                  fill="#d97706" 
                                  stroke="white" 
                                  strokeWidth="1.5"
                                  className="cursor-pointer transition-all duration-150 hover:brightness-125 touch-none"
                                  onPointerDown={(e) => handlePointerDown(e, 'Rotate', 'rotation', p.rotation || 0)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                />
                                <circle 
                                  cx={centerX - yawRx} 
                                  cy={centerY} 
                                  r={4 * Math.max(0.65, scFactor)} 
                                  fill="#fef08a" 
                                  pointerEvents="none"
                                />
                              </g>

                              {/* Bottom Macro CW Handle (+90°) */}
                              <g>
                                <circle 
                                  cx={centerX} 
                                  cy={centerY + yawRy} 
                                  r={(isDraggingThis('Rotate', 'rotation') ? 10 : 7) * Math.max(0.65, scFactor)} 
                                  fill="#b45309" 
                                  stroke="white" 
                                  strokeWidth="1.5"
                                  className="cursor-pointer transition-all duration-150 hover:brightness-125 touch-none"
                                  onPointerDown={(e) => handlePointerDown(e, 'Rotate', 'rotation', p.rotation || 0)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                />
                                <circle 
                                  cx={centerX} 
                                  cy={centerY + yawRy} 
                                  r={3 * Math.max(0.65, scFactor)} 
                                  fill="#fef08a" 
                                  pointerEvents="none"
                                />
                              </g>

                              {/* Top Macro CCW Handle (-90°) */}
                              <g>
                                <circle 
                                  cx={centerX} 
                                  cy={centerY - yawRy} 
                                  r={(isDraggingThis('Rotate', 'rotation') ? 10 : 7) * Math.max(0.65, scFactor)} 
                                  fill="#78350f" 
                                  stroke="white" 
                                  strokeWidth="1.5"
                                  className="cursor-pointer transition-all duration-150 hover:brightness-125 touch-none"
                                  onPointerDown={(e) => handlePointerDown(e, 'Rotate', 'rotation', p.rotation || 0)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                />
                                <circle 
                                  cx={centerX} 
                                  cy={centerY - yawRy} 
                                  r={3 * Math.max(0.65, scFactor)} 
                                  fill="#fef08a" 
                                  pointerEvents="none"
                                />
                              </g>

                              {/* Current rotation position node indicator */}
                              <circle 
                                cx={centerX + yawRx * Math.cos((p.rotation || 0) * Math.PI / 180)} 
                                cy={centerY + yawRy * Math.sin((p.rotation || 0) * Math.PI / 180)} 
                                r={4.5 * Math.max(0.65, scFactor)} 
                                fill="#fef08a" 
                                stroke="#d97706" 
                                strokeWidth={1} 
                              />
                            </g>
                          );
                        })()}

                        {/* 3. INTERACTIVE BOUNDING-BOX SCALE GIZMO */}
                        {activeTool === 'Scale' && (() => {
                          const renderCube = (
                            cx: number, 
                            cy: number, 
                            colorLight: string, 
                            colorMedium: string, 
                            colorDark: string, 
                            isDragging: boolean
                          ) => {
                            const S = 5.5 * Math.max(0.65, scFactor) * (isDragging ? 1.35 : 1.0);
                            
                            // Isometric projected cube vertices
                            const t1_x = cx;
                            const t1_y = cy - S;
                            
                            const t2_x = cx + S * 1.0;
                            const t2_y = cy - S * 0.5;
                            
                            const t3_x = cx;
                            const t3_y = cy;
                            
                            const t4_x = cx - S * 1.0;
                            const t4_y = cy - S * 0.5;
                            
                            const b2_x = cx + S * 1.0;
                            const b2_y = cy + S * 0.5;
                            
                            const b3_x = cx;
                            const b3_y = cy + S;
                            
                            const b4_x = cx - S * 1.0;
                            const b4_y = cy + S * 0.5;

                            return (
                              <g style={{ pointerEvents: 'none' }}>
                                {/* Top Face */}
                                <polygon 
                                  points={`${t1_x},${t1_y} ${t2_x},${t2_y} ${t3_x},${t3_y} ${t4_x},${t4_y}`} 
                                  fill={colorLight} 
                                  stroke={colorLight}
                                  strokeWidth="0.5"
                                />
                                {/* Left Face */}
                                <polygon 
                                  points={`${t4_x},${t4_y} ${t3_x},${t3_y} ${b3_x},${b3_y} ${b4_x},${b4_y}`} 
                                  fill={colorMedium} 
                                  stroke={colorMedium}
                                  strokeWidth="0.5"
                                />
                                {/* Right Face */}
                                <polygon 
                                  points={`${t3_x},${t3_y} ${t2_x},${t2_y} ${b2_x},${b2_y} ${b3_x},${b3_y}`} 
                                  fill={colorDark} 
                                  stroke={colorDark}
                                  strokeWidth="0.5"
                                />
                              </g>
                            );
                          };

                          const scaleY_up_y = centerY - (sizeZ * 2.2 * scFactor) - 6 * scFactor;
                          const scaleY_down_y = centerY + (sizeY * 4.5 * scFactor) + 6 * scFactor;
                          const scaleX_right_x = centerX + (sizeX * 3.5 * scFactor) + 6 * scFactor;
                          const scaleX_right_y = centerY + (sizeY * 2.2 * scFactor);
                          const scaleX_left_x = centerX - (sizeX * 3.5 * scFactor) - 6 * scFactor;
                          const scaleX_left_y = centerY + (sizeY * 2.2 * scFactor);
                          const scaleZ_fwd_x = centerX + 20 * scFactor;
                          const scaleZ_fwd_y = centerY - (sizeZ * 2.2 * scFactor) - 10 * scFactor;
                          const scaleZ_bwd_x = centerX - 20 * scFactor;
                          const scaleZ_bwd_y = centerY + (sizeY * 4.5 * scFactor) + 10 * scFactor;

                          return (
                            <g>
                              {/* Cyan bounding boundary container */}
                              <rect 
                                x={centerX - (sizeX * 3.5 * scFactor) - 3 * scFactor} 
                                y={centerY - (sizeZ * 2.2 * scFactor) - 3 * scFactor} 
                                width={(sizeX * 7 * scFactor) + 6 * scFactor} 
                                height={(sizeY * 4.5 * scFactor) + (sizeZ * 2.2 * scFactor) + 6 * scFactor} 
                                stroke="#22d3ee" 
                                strokeWidth="1" 
                                strokeDasharray="2 2" 
                                fill="none" 
                                className="opacity-35" 
                              />

                              {/* SOLID SCALE AXES LINES */}
                              {/* Y-Axes (Green Height Scale Lines) */}
                              <line x1={centerX} y1={centerY} x2={centerX} y2={scaleY_up_y} stroke="#10b981" strokeWidth="2" strokeDasharray="1 1" />
                              <line x1={centerX} y1={centerY} x2={centerX} y2={scaleY_down_y} stroke="#065f46" strokeWidth="1.5" strokeDasharray="1 1" />

                              {/* X-Axes (Red Width Scale Lines) */}
                              <line x1={centerX} y1={centerY} x2={scaleX_right_x} y2={scaleX_right_y} stroke="#f87171" strokeWidth="2" strokeDasharray="1 1" />
                              <line x1={centerX} y1={centerY} x2={scaleX_left_x} y2={scaleX_left_y} stroke="#991b1b" strokeWidth="1.5" strokeDasharray="1 1" />

                              {/* Z-Axes (Blue Depth Scale Lines) */}
                              <line x1={centerX} y1={centerY} x2={scaleZ_fwd_x} y2={scaleZ_fwd_y} stroke="#60a5fa" strokeWidth="2" strokeDasharray="1 1" />
                              <line x1={centerX} y1={centerY} x2={scaleZ_bwd_x} y2={scaleZ_bwd_y} stroke="#1e3a8a" strokeWidth="1.5" strokeDasharray="1 1" />

                              {/* Grow Height Up Green (+Y Cube) */}
                              <g>
                                {renderCube(
                                  centerX, 
                                  scaleY_up_y, 
                                  isDraggingThis('Scale', 'sizeY') ? '#6ee7b7' : '#34d399', 
                                  isDraggingThis('Scale', 'sizeY') ? '#34d399' : '#10b981', 
                                  isDraggingThis('Scale', 'sizeY') ? '#10b981' : '#059669', 
                                  isDraggingThis('Scale', 'sizeY')
                                )}
                                <circle 
                                  cx={centerX} 
                                  cy={scaleY_up_y} 
                                  r={(isDraggingThis('Scale', 'sizeY') ? 14 : 10) * Math.max(0.65, scFactor)} 
                                  fill="transparent" 
                                  className="cursor-pointer touch-none"
                                  onClick={(e) => { e.stopPropagation(); handleGizmoAction('Scale', 'sizeY', 1); }}
                                  onPointerDown={(e) => handlePointerDown(e, 'Scale', 'sizeY', p.sizeY)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                >
                                  <title>Drag vertically or Click to Scale Height Up (+Y)</title>
                                </circle>
                              </g>

                              {/* Shrink Height Down Green (-Y Cube) */}
                              <g>
                                {renderCube(
                                  centerX, 
                                  scaleY_down_y, 
                                  isDraggingThis('Scale', 'sizeY') ? '#10b981' : '#059669', 
                                  isDraggingThis('Scale', 'sizeY') ? '#059669' : '#047857', 
                                  isDraggingThis('Scale', 'sizeY') ? '#047857' : '#064e3b', 
                                  isDraggingThis('Scale', 'sizeY')
                                )}
                                <circle 
                                  cx={centerX} 
                                  cy={scaleY_down_y} 
                                  r={(isDraggingThis('Scale', 'sizeY') ? 14 : 10) * Math.max(0.65, scFactor)} 
                                  fill="transparent" 
                                  className="cursor-pointer touch-none"
                                  onClick={(e) => { e.stopPropagation(); handleGizmoAction('Scale', 'sizeY', -1); }}
                                  onPointerDown={(e) => handlePointerDown(e, 'Scale', 'sizeY', p.sizeY)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                >
                                  <title>Drag vertically or Click to Scale Height Down (-Y)</title>
                                </circle>
                              </g>

                              {/* Grow Width Right Red (+X Cube) */}
                              <g>
                                {renderCube(
                                  scaleX_right_x, 
                                  scaleX_right_y, 
                                  isDraggingThis('Scale', 'sizeX') ? '#fca5a5' : '#f87171', 
                                  isDraggingThis('Scale', 'sizeX') ? '#f87171' : '#ef4444', 
                                  isDraggingThis('Scale', 'sizeX') ? '#ef4444' : '#b91c1c', 
                                  isDraggingThis('Scale', 'sizeX')
                                )}
                                <circle 
                                  cx={scaleX_right_x} 
                                  cy={scaleX_right_y} 
                                  r={(isDraggingThis('Scale', 'sizeX') ? 14 : 10) * Math.max(0.65, scFactor)} 
                                  fill="transparent" 
                                  className="cursor-pointer touch-none"
                                  onClick={(e) => { e.stopPropagation(); handleGizmoAction('Scale', 'sizeX', 1); }}
                                  onPointerDown={(e) => handlePointerDown(e, 'Scale', 'sizeX', p.sizeX)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                >
                                  <title>Drag horizontally or Click to Scale Width Expand (+X)</title>
                                </circle>
                              </g>

                              {/* Shrink Width Left Red (-X Cube) */}
                              <g>
                                {renderCube(
                                  scaleX_left_x, 
                                  scaleX_left_y, 
                                  isDraggingThis('Scale', 'sizeX') ? '#ef4444' : '#b91c1c', 
                                  isDraggingThis('Scale', 'sizeX') ? '#b91c1c' : '#dc2626', 
                                  isDraggingThis('Scale', 'sizeX') ? '#dc2626' : '#7f1d1d', 
                                  isDraggingThis('Scale', 'sizeX')
                                )}
                                <circle 
                                  cx={scaleX_left_x} 
                                  cy={scaleX_left_y} 
                                  r={(isDraggingThis('Scale', 'sizeX') ? 14 : 10) * Math.max(0.65, scFactor)} 
                                  fill="transparent" 
                                  className="cursor-pointer touch-none"
                                  onClick={(e) => { e.stopPropagation(); handleGizmoAction('Scale', 'sizeX', -1); }}
                                  onPointerDown={(e) => handlePointerDown(e, 'Scale', 'sizeX', p.sizeX)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                >
                                  <title>Drag horizontally or Click to Scale Width Narrow (-X)</title>
                                </circle>
                              </g>

                              {/* Grow Depth Blue (+Z Cube) */}
                              <g>
                                {renderCube(
                                  scaleZ_fwd_x, 
                                  scaleZ_fwd_y, 
                                  isDraggingThis('Scale', 'sizeZ') ? '#93c5fd' : '#60a5fa', 
                                  isDraggingThis('Scale', 'sizeZ') ? '#60a5fa' : '#3b82f6', 
                                  isDraggingThis('Scale', 'sizeZ') ? '#3b82f6' : '#1d4ed8', 
                                  isDraggingThis('Scale', 'sizeZ')
                                )}
                                <circle 
                                  cx={scaleZ_fwd_x} 
                                  cy={scaleZ_fwd_y} 
                                  r={(isDraggingThis('Scale', 'sizeZ') ? 14 : 10) * Math.max(0.65, scFactor)} 
                                  fill="transparent" 
                                  className="cursor-pointer touch-none"
                                  onClick={(e) => { e.stopPropagation(); handleGizmoAction('Scale', 'sizeZ', 1); }}
                                  onPointerDown={(e) => handlePointerDown(e, 'Scale', 'sizeZ', p.sizeZ)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                >
                                  <title>Drag diagonally or Click to Scale Depth Expand (+Z)</title>
                                </circle>
                              </g>

                              {/* Shrink Depth Blue (-Z Cube) */}
                              <g>
                                {renderCube(
                                  scaleZ_bwd_x, 
                                  scaleZ_bwd_y, 
                                  isDraggingThis('Scale', 'sizeZ') ? '#3b82f6' : '#1d4ed8', 
                                  isDraggingThis('Scale', 'sizeZ') ? '#1d4ed8' : '#2563eb', 
                                  isDraggingThis('Scale', 'sizeZ') ? '#2563eb' : '#172554', 
                                  isDraggingThis('Scale', 'sizeZ')
                                )}
                                <circle 
                                  cx={scaleZ_bwd_x} 
                                  cy={scaleZ_bwd_y} 
                                  r={(isDraggingThis('Scale', 'sizeZ') ? 14 : 10) * Math.max(0.65, scFactor)} 
                                  fill="transparent" 
                                  className="cursor-pointer touch-none"
                                  onClick={(e) => { e.stopPropagation(); handleGizmoAction('Scale', 'sizeZ', -1); }}
                                  onPointerDown={(e) => handlePointerDown(e, 'Scale', 'sizeZ', p.sizeZ)}
                                  onPointerMove={handlePointerMove}
                                  onPointerUp={handlePointerUp}
                                  onPointerCancel={handlePointerUp}
                                >
                                  <title>Drag diagonally or Click to Scale Depth Shrink (-Z)</title>
                                </circle>
                              </g>
                            </g>
                          );
                        })()}

                        {/* 4. SELECT GIZMO (Polished 3D bounding box selection outline) */}
                        {activeTool === 'Select' && (() => {
                          const rectX = centerX - (sizeX * 3.5 * scFactor) - 6 * scFactor;
                          const rectY = centerY - (sizeZ * 2.2 * scFactor) - 6 * scFactor;
                          const rectW = (sizeX * 7 * scFactor) + 12 * scFactor;
                          const rectH = (sizeY * 4.5 * scFactor) + (sizeZ * 2.2 * scFactor) + 12 * scFactor;

                          return (
                            <g>
                              {/* 1. Translucent cyan fill inside the selection box to make the part pop */}
                              <rect 
                                x={rectX} 
                                y={rectY} 
                                width={rectW} 
                                height={rectH} 
                                fill="rgba(6, 182, 212, 0.05)"
                                rx="2"
                              />

                              {/* 2. Professional bright cyan dashed selection outline */}
                              <rect 
                                x={rectX} 
                                y={rectY} 
                                width={rectW} 
                                height={rectH} 
                                stroke="#22d3ee" 
                                strokeWidth="1.5" 
                                strokeDasharray="3 3" 
                                fill="none" 
                                rx="2"
                              />

                              {/* 3. Corner visual brackets to look like premium 3D modeling selection overlay */}
                              {/* Top-Left Bracket */}
                              <path d={`M ${rectX} ${rectY + 10} L ${rectX} ${rectY} L ${rectX + 10} ${rectY}`} stroke="#06b6d4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                              {/* Top-Right Bracket */}
                              <path d={`M ${rectX + rectW - 10} ${rectY} L ${rectX + rectW} ${rectY} L ${rectX + rectW} ${rectY + 10}`} stroke="#06b6d4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                              {/* Bottom-Left Bracket */}
                              <path d={`M ${rectX} ${rectY + rectH - 10} L ${rectX} ${rectY + rectH} L ${rectX + 10} ${rectY + rectH}`} stroke="#06b6d4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                              {/* Bottom-Right Bracket */}
                              <path d={`M ${rectX + rectW - 10} ${rectY + rectH} L ${rectX + rectW} ${rectY + rectH} L ${rectX + rectW} ${rectY + rectH - 10}`} stroke="#06b6d4" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                              {/* 4. Part name and dimensions label at the top center of selection */}
                              <g transform={`translate(${centerX}, ${rectY - 6})`}>
                                <rect 
                                  x={-selectedPart.name.length * 3.5 - 14} 
                                  y="-12" 
                                  width={selectedPart.name.length * 7 + 28} 
                                  height="16" 
                                  fill="#1e293b" 
                                  rx="3" 
                                  stroke="#22d3ee" 
                                  strokeWidth="1" 
                                />
                                <text 
                                  fill="#22d3ee" 
                                  fontSize="9" 
                                  fontWeight="bold" 
                                  fontFamily="monospace" 
                                  textAnchor="middle" 
                                  y="-1"
                                >
                                  ✨ {selectedPart.name}
                                </text>
                              </g>
                            </g>
                          );
                        })()}
                      </g>
                    )}
                  </g>
                );
              })}

              {/* INTERACTIVE ISOMETRIC CHARACTER AVATAR */}
              {(testMode === 'Play' || testMode === 'Pause') && (() => {
                // Project 3D coordinates to SVG screen mapping
                const proj = project3D(playerPos.x, playerPos.y, playerPos.z);
                if (proj.clipped) return null;
                if (cameraMode === '1st') return null; // Hide in first person view

                const pCenterX = proj.x;
                const pCenterY = proj.y;
                const isPerspectiveMode = testMode === 'Edit' || cameraMode !== 'Isometric' || freeLookYaw !== 0 || freeLookPitch !== 0;
                const activeCamMode = testMode === 'Edit' ? 'Isometric' : cameraMode;
                const modeScaleCorrection = activeCamMode === 'Isometric' ? 1.727 : activeCamMode === '3rd' ? 1.1 : 1.0;
                const pScale = (isPerspectiveMode ? (proj.scale * modeScaleCorrection) : 1.0) * playerScale;
                
                // Leg coordinate offset triggers for happy waddling walking animation
                const isWalking = pressedKeys['w'] || pressedKeys['s'] || pressedKeys['a'] || pressedKeys['d'] ||
                                  touchDpad.up || touchDpad.down || touchDpad.left || touchDpad.right;
                const legWaddle = isWalking ? Math.sin(Date.now() * 0.018) * 3 : 0;
                
                return (
                  <g 
                    className="player-avatar-group transition-all duration-75"
                    transform={`translate(${pCenterX}, ${pCenterY}) scale(${pScale}) translate(${-pCenterX}, ${-pCenterY})`}
                  >
                    {/* Shadow underneath */}
                    <ellipse cx={pCenterX} cy={pCenterY + 4} rx="8" ry="4" fill="rgba(0,0,0,0.5)" />
                    
                    {/* Leg 1 */}
                    <rect x={pCenterX - 3} y={pCenterY - 2 + legWaddle} width="2.5" height="4.5" fill="#1e3a8a" rx="1" />
                    
                    {/* Leg 2 */}
                    <rect x={pCenterX + 0.5} y={pCenterY - 2 - legWaddle} width="2.5" height="4.5" fill="#1e3a8a" rx="1" />
                    
                    {/* Torso/Shirt */}
                    <rect x={pCenterX - 5.5} y={pCenterY - 8.5} width="11" height="7" fill={ouchFlag ? "#ef4444" : "#10b981"} rx="1.5" stroke="#ffffff" strokeWidth="0.5" />
                    <text x={pCenterX} y={pCenterY - 4} textAnchor="middle" fontSize="6px" fontWeight="black" fill="#ffffff" pointerEvents="none">R</text>
                    
                    {/* Head */}
                    <circle cx={pCenterX} cy={pCenterY - 12.5} r="4.5" fill="#fbcfe8" stroke="#db2777" strokeWidth="0.5" />
                    
                    {/* Happy face eyes & cheeks */}
                    <circle cx={pCenterX - 1.5} cy={pCenterY - 13.5} r="0.6" fill="#000000" />
                    <circle cx={pCenterX + 1.5} cy={pCenterY - 13.5} r="0.6" fill="#000000" />
                    <path d={`M ${pCenterX - 1.8} ${pCenterY - 11.5} Q ${pCenterX} ${pCenterY - 10} ${pCenterX + 1.8} ${pCenterY - 11.5}`} fill="none" stroke="#000000" strokeWidth="0.6" />
                    
                    {/* Cute Cap/Hat */}
                    <path d={`M ${pCenterX - 5} ${pCenterY - 14.5} Q ${pCenterX} ${pCenterY - 18} ${pCenterX + 5} ${pCenterY - 14.5}`} fill="#ef4444" />
                    <rect x={pCenterX - 5} y={pCenterY - 15.2} width="10" height="1" fill="#fbbf24" rx="0.5" />
                    <rect x={pCenterX - 2.5} y={pCenterY - 16.5} width="5" height="1.5" fill="#ef4444" rx="0.5" />
                    
                    {/* Transient Visual Feed Effects floaters */}
                    {ouchFlag && (
                      <g className="animate-bounce">
                        <text x={pCenterX} y={pCenterY - 26} textAnchor="middle" fontSize="9px" fontWeight="bold" fill="#ef4444" stroke="#000" strokeWidth="0.1">💥 OUCH!</text>
                      </g>
                    )}
                    {healedFlag && (
                      <g className="animate-pulse">
                        <text x={pCenterX} y={pCenterY - 26} textAnchor="middle" fontSize="9px" fontWeight="bold" fill="#10b981" stroke="#000" strokeWidth="0.1">✨ HEALED!</text>
                      </g>
                    )}
                    {checkpointFlag && (
                      <g className="animate-bounce">
                        <text x={pCenterX} y={pCenterY - 26} textAnchor="middle" fontSize="8.5px" fontWeight="bold" fill="#ec4899" stroke="#000" strokeWidth="0.1">⭐ SAVED check!</text>
                      </g>
                    )}
                    {deathFlag && (
                      <g className="animate-ping">
                        <ellipse cx={pCenterX} cy={pCenterY} rx="12" ry="6" fill="rgba(239,68,68,0.4)" stroke="#ef4444" />
                      </g>
                    )}
                    
                    {/* Floating HP Green health bar */}
                    <g transform={`translate(${pCenterX - 10}, ${pCenterY - 22})`}>
                      <rect width="20" height="2.5" fill="#334155" rx="0.5" />
                      <rect width={(playerHealth / 100) * 20} height="2.5" fill={playerHealth > 40 ? "#10b981" : "#ef4444"} rx="0.5" />
                    </g>
                  </g>
                );
              })()}

              {/* DYNAMIC PLAYER ACTION PARTICLES TRAIL */}
              {doubleJumpParticles.map(pt => {
                const proj = project3D(pt.x, pt.y, pt.z);
                if (proj.clipped) return null;
                return (
                  <circle
                    key={`dj-part-${pt.id}`}
                    cx={proj.x}
                    cy={proj.y}
                    r={pt.size * 5}
                    fill="none"
                    stroke="#e0f2fe"
                    strokeWidth="1.5"
                    opacity={(6.0 - pt.size) / 6.0}
                    pointerEvents="none"
                  />
                );
              })}

              {dashParticles.map(pt => {
                const proj = project3D(pt.x, pt.y, pt.z);
                if (proj.clipped) return null;
                return (
                  <g key={`dash-part-${pt.id}`} pointerEvents="none">
                    <circle
                      cx={proj.x}
                      cy={proj.y}
                      r={pt.size * 6}
                      fill="none"
                      stroke={pt.color || "#ef4444"}
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                      opacity={(6.5 - pt.size) / 6.5}
                    />
                    <circle
                      cx={proj.x}
                      cy={proj.y}
                      r={pt.size * 2.5}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="0.8"
                      opacity={(6.5 - pt.size) / 10.0}
                    />
                  </g>
                );
              })}

              {/* TELEPORTER VECTOR LINKS */}
              {parts.map(p => {
                if (p.specialBehavior !== 'linked_teleporter' || !p.targetPartId) return null;
                const dest = parts.find(d => d.id === p.targetPartId);
                if (!dest) return null;

                const startProj = project3D(p.x, p.y, p.z);
                const destProj = project3D(dest.x, dest.y, dest.z);

                if (startProj.clipped || destProj.clipped) return null;

                // Draw a sleek dotted cyber link path
                return (
                  <g key={`telelink-${p.id}`} pointerEvents="none">
                    <line
                      x1={startProj.x}
                      y1={startProj.y}
                      x2={destProj.x}
                      y2={destProj.y}
                      stroke="#ec4899"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                      opacity={testMode === 'Edit' ? 0.8 : 0.4}
                    />
                    {/* Pulsing indicator node along path */}
                    <circle
                      cx={startProj.x + (destProj.x - startProj.x) * ((Date.now() % 2000) / 2000)}
                      cy={startProj.y + (destProj.y - startProj.y) * ((Date.now() % 2000) / 2000)}
                      r="3"
                      fill="#f472b6"
                      className="animate-pulse"
                    />
                  </g>
                );
              })}
              </g>
            </svg>
            );
            })())}

            {/* SIMULATOR PLAY HUD OVERLAY DURING GAMEPLAY */}
            {(testMode === 'Play' || testMode === 'Pause') && (
              <div className="absolute inset-0 bg-[#090a0f]/40 pointer-events-none flex flex-col justify-between p-4 z-40 select-none animate-fade-in font-sans">
                {/* 1. Header: Score & Health */}
                <div className="flex justify-between items-start pointer-events-auto">
                  {/* Left Head: Health indicators */}
                  <div className="bg-[#18191e]/95 border border-[#393B3D] px-3.5 py-2 rounded-xl flex items-center gap-3.5 shadow-2xl backdrop-blur-md">
                    <div className="text-xl animate-pulse">❤️</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest font-mono">Kid Health HP</span>
                        <span className="text-xs font-black text-rose-500 font-mono">{playerHealth} / 100</span>
                      </div>
                      <div className="w-28 h-2 bg-zinc-800 rounded-full overflow-hidden mt-1 border border-zinc-700/60 flex">
                        <div 
                          className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 transition-all duration-100" 
                          style={{ width: `${playerHealth}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Head: Score gold points */}
                  <div className="bg-[#18191e]/95 border border-[#393B3D] px-4 py-2 rounded-xl flex items-center gap-3 shadow-2xl backdrop-blur-md">
                    <div className="text-xl animate-bounce">🪙</div>
                    <div className="text-right">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block font-mono">Collected Points</span>
                      <span className="text-sm font-black text-amber-400 font-mono">+{score} XP</span>
                    </div>
                  </div>
                </div>

                {/* 2. Middle: Game state flags banner for kids or Paused Banner */}
                <div className="text-center">
                  {playerHealth <= 0 && (
                    <div className="inline-block bg-red-950/90 border-2 border-red-500 px-6 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-bounce text-white font-extrabold text-sm pointer-events-auto cursor-pointer" onClick={() => triggerDieAndRespawn()}>
                      💥 DEFEATED! Click to Respawn Star 🏁
                    </div>
                  )}

                  {testMode === 'Pause' && (
                    <div className="inline-block bg-[#1a1b1e]/95 border border-amber-500/80 px-7 py-4 rounded-3xl shadow-[0_10px_35px_rgba(245,158,11,0.25)] animate-fade-in text-white pointer-events-auto max-w-xs mx-auto">
                      <div className="text-3xl mb-1.5 select-none animate-pulse">⏸️</div>
                      <div className="text-xs font-black uppercase text-amber-400 tracking-wider">Simulation Paused</div>
                      <p className="text-[9px] text-zinc-400 leading-normal mt-1">
                        Game physics frozen. Click <strong className="text-emerald-400 font-bold">🟢 Play</strong> in the ribbon menu above to resume, or click <strong className="text-zinc-300 font-bold">Stop</strong> to edit!
                      </p>
                    </div>
                  )}
                </div>

                {/* Visual Dialogue comic-speech-bubble */}
                {activeDialogue && (
                  <div className="absolute bottom-40 left-1/2 -translate-x-1/2 max-w-sm w-[90%] bg-zinc-950/95 border-2 border-cyan-400 p-3 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] pointer-events-auto animate-bounce text-center z-50">
                    <span className="block text-[10px] uppercase font-black tracking-wider text-cyan-400 font-mono">
                      🗣️ {activeDialogue.speaker} SAYS:
                    </span>
                    <p className="text-xs text-white font-bold font-sans mt-0.5 leading-snug">
                      "{activeDialogue.text}"
                    </p>
                  </div>
                )}

                {/* Floating Action Hint Button for Kids E Key / Touch Click */}
                {(() => {
                  const closestPart = parts.find(p => {
                    if (!p.scriptCode) return false;
                    const dxVal = p.x - playerPos.x;
                    const dyVal = p.y - playerPos.y;
                    const dzVal = p.z - playerPos.z;
                    const dist = Math.sqrt(dxVal*dxVal + dyVal*dyVal + dzVal*dzVal);
                    return dist <= 6.5 && p.scriptCode.toLowerCase().includes('interact');
                  });
                  if (!closestPart) return null;
                  return (
                    <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-auto">
                      <button
                        onClick={() => {
                          const now = Date.now();
                          scriptCooldownsRef.current[`interact_${closestPart.id}`] = now;
                          executePartScript(closestPart, 'player_interacts_npc');
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/50 rounded-full font-black text-xs text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all text-center uppercase tracking-wider flex items-center gap-1.5 cursor-pointer leading-none"
                      >
                        <span className="animate-pulse">🎯</span> 
                        <span>INTERACT WITH {closestPart.name}</span>
                        <span className="bg-zinc-950/40 px-1 py-0.5 rounded text-[9px] font-mono border border-white/20">Press E</span>
                      </button>
                    </div>
                  );
                })()}

                {/* 3. Footer controls guides and on-screen virtual controller D-pad */}
                <div className="flex justify-between items-end w-full pointer-events-auto">
                  <div className="flex flex-col sm:flex-row gap-2 items-end max-w-[65%]">
                    {/* 📊 SANDBOX CODE CONSOLE (OUTPUT) */}
                    <div className="bg-[#111214]/95 border border-zinc-800/80 p-3 rounded-xl text-[10px] text-zinc-300 font-mono w-full sm:w-80 h-32 flex flex-col justify-between shadow-2xl backdrop-blur-md">
                      <div className="flex justify-between items-center text-[9px] font-bold text-cyan-400 border-b border-zinc-800 pb-1.5 mb-1.5 select-none">
                        <span className="flex items-center gap-1">📊 SANDBOX CODE CONSOLE OUTPUT</span>
                        <button 
                          onClick={() => {
                            setGameLogs(['🧹 Console cleared.']);
                            triggerBeep(300, 0.05);
                          }}
                          className="text-[8px] text-zinc-500 hover:text-white transition-colors bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800/80 cursor-pointer"
                        >
                          CLEAR
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-left select-text scrollbar-thin">
                        {gameLogs.map((log, i) => {
                          let textClass = "text-zinc-300";
                          if (log.includes("[ALERT]")) textClass = "text-amber-400 font-bold";
                          else if (log.includes("[onTouch]")) textClass = "text-emerald-400 font-medium";
                          else if (log.includes("SAYS") || log.includes("Bob")) textClass = "text-sky-300 font-semibold";
                          else if (log.includes("[ALERT]:") || log.includes("💡")) textClass = "text-amber-400";
                          else if (log.includes("GIVE") || log.includes("Robux") || log.includes("Points")) textClass = "text-emerald-400 font-bold";
                          else if (log.includes("Damage") || log.includes("DAMAGE")) textClass = "text-rose-400 font-bold animate-pulse";
                          return (
                            <div key={i} className={`leading-normal break-words ${textClass}`}>
                              {log}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Keyboard Guide label */}
                    <div className="hidden lg:block bg-[#111214]/90 border border-zinc-800 p-2.5 rounded-lg text-[9.5px] text-zinc-400 space-y-1 font-mono max-w-[170px]">
                      <span className="text-[9px] font-bold text-white uppercase block mb-1">🎮 Keyboard controls:</span>
                      <div>● <kbd className="bg-zinc-800 px-1 py-0.2 rounded border border-zinc-700 font-bold text-white">W/A/S/D</kbd> or <kbd className="bg-zinc-800 px-1 py-0.2 rounded border border-zinc-700 font-bold text-white">🔀 Arrows</kbd></div>
                      <div>● <kbd className="bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-700 font-bold text-white">Spacebar</kbd> to Jump!</div>
                      <div>● Press <kbd className="bg-emerald-800 px-1 py-0.2 rounded border border-emerald-600 font-extrabold text-white animate-pulse">E</kbd> near scripted blocks!</div>
                    </div>
                  </div>

                  {/* Virtual Dpad for Kids (Touch / Click mouse controls) */}
                  <div className="bg-[#111214]/95 border border-[#393B3D] p-2 rounded-2xl flex items-center gap-4 shadow-2xl backdrop-blur-md">
                    {/* D-pad Arrows Grid */}
                    <div className="grid grid-cols-3 gap-0.5 w-[85px] h-[85px] select-none">
                      <div />
                      <button
                        onPointerDown={() => setTouchDpad(prev => ({ ...prev, up: true }))}
                        onPointerUp={() => setTouchDpad(prev => ({ ...prev, up: false }))}
                        onPointerLeave={() => setTouchDpad(prev => ({ ...prev, up: false }))}
                        className={`border border-zinc-700 rounded-lg flex items-center justify-center text-xs font-bold active:scale-95 transition-all cursor-pointer ${
                          touchDpad.up ? 'bg-emerald-600 text-white shadow-inner scale-95' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                        title="Walk Backwards"
                      >
                        ▲
                      </button>
                      <div />

                      <button
                        onPointerDown={() => setTouchDpad(prev => ({ ...prev, left: true }))}
                        onPointerUp={() => setTouchDpad(prev => ({ ...prev, left: false }))}
                        onPointerLeave={() => setTouchDpad(prev => ({ ...prev, left: false }))}
                        className={`border border-zinc-700 rounded-lg flex items-center justify-center text-xs font-bold active:scale-95 transition-all cursor-pointer ${
                          touchDpad.left ? 'bg-emerald-600 text-white shadow-inner scale-95' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                        title="Walk Left"
                      >
                        ◀
                      </button>
                      <div className="bg-zinc-900 rounded-lg flex items-center justify-center text-[7px] text-zinc-600 font-bold uppercase">
                        Pad
                      </div>
                      <button
                        onPointerDown={() => setTouchDpad(prev => ({ ...prev, right: true }))}
                        onPointerUp={() => setTouchDpad(prev => ({ ...prev, right: false }))}
                        onPointerLeave={() => setTouchDpad(prev => ({ ...prev, right: false }))}
                        className={`border border-zinc-700 rounded-lg flex items-center justify-center text-xs font-bold active:scale-95 transition-all cursor-pointer ${
                          touchDpad.right ? 'bg-emerald-600 text-white shadow-inner scale-95' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                        title="Walk Right"
                      >
                        ▶
                      </button>

                      <div />
                      <button
                        onPointerDown={() => setTouchDpad(prev => ({ ...prev, down: true }))}
                        onPointerUp={() => setTouchDpad(prev => ({ ...prev, down: false }))}
                        onPointerLeave={() => setTouchDpad(prev => ({ ...prev, down: false }))}
                        className={`border border-zinc-700 rounded-lg flex items-center justify-center text-xs font-bold active:scale-95 transition-all cursor-pointer ${
                          touchDpad.down ? 'bg-emerald-600 text-white shadow-inner scale-95' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                        title="Walk Forwards"
                      >
                        ▼
                      </button>
                      <div />
                    </div>

                    {/* Big Action Jump Trigger */}
                    <button
                      onPointerDown={() => setTouchDpad(prev => ({ ...prev, jump: true }))}
                      onPointerUp={() => setTouchDpad(prev => ({ ...prev, jump: false }))}
                      onPointerLeave={() => setTouchDpad(prev => ({ ...prev, jump: false }))}
                      className={`h-[85px] w-[50px] border border-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all select-none cursor-pointer ${
                        touchDpad.jump 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-95' 
                          : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40'
                      }`}
                      title="Super Jump!"
                    >
                      <span className="text-lg">🦘</span>
                      <span className="text-[8px] font-black uppercase tracking-wider font-mono">Jump</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Grid Helper metadata guidelines */}
            {!isImmersivePlayTest && (
              <div className="absolute bottom-3 right-3 text-right">
                <span className="text-[9px] text-gray-500 font-mono tracking-widest block uppercase">
                  Render Context: Canvas-2D Vector Map
                </span>
              </div>
            )}
            
            {/* Top warning overlay banner */}
            {!isImmersivePlayTest && (
              <div className="absolute inset-x-0 top-0 bg-[#111214] border-b border-[#393B3D] py-1.5 px-4 text-center text-[10px] text-gray-300 font-semibold font-mono tracking-wider">
                🛠️ MOCK PREVIEW LOADED ACTIVE ● COMPONENT 2 READY FOR INTEGRATION
              </div>
            )}

            {/* FLOATING STOP PLAYTEST WINDOW FOR IMMERSIVE TEST MODE */}
            {isImmersivePlayTest && (
              <div className="absolute top-4 left-4 z-50 select-none pointer-events-auto flex items-center gap-3 bg-[#111214]/95 border border-amber-500/80 px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider font-mono">
                  🔴 Immersive Test Live
                </span>
                <button
                  onClick={() => {
                    setTestMode('Edit');
                    setIsImmersivePlayTest(false);
                    triggerBeep(250, 0.15);
                    // Reset positions, score, and collected state
                    setPlayerHealth(100);
                    setScore(0);
                    setCollectedCoinIds(new Set());
                    setActiveCheckpointId(null);
                  }}
                  className="bg-red-500 hover:bg-red-600 active:scale-95 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer pointer-events-auto border border-red-400 shadow-md transition-all font-sans"
                >
                  🛑 Stop Test Mode ✅
                </button>
              </div>
            )}

          </div>

          {/* Viewport Floating Transform Utility HUD */}
          {!isImmersivePlayTest && testMode === 'Edit' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#232527]/95 border border-[#393B3D] p-2 rounded flex flex-col items-center gap-1.5 shadow-2xl select-none max-w-sm w-[94%] z-20 font-sans backdrop-blur-sm">
            <div className="flex justify-between items-center w-full px-1 gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1 font-mono">
                🔧 ACTIVE GIZMO: {activeTool}{selectedPartIds.length > 1 ? ` (${selectedPartIds.length} Parts Loaded)` : ''}
              </span>
              <span className="text-[8px] text-emerald-400 font-mono">
                [Shift-Click Canvas or Explorer for Multi-Select]
              </span>
            </div>
            
            {!selectedPart || selectedPart.id === 'p1' ? (
              <p className="text-[10px] text-zinc-400 text-center py-1">
                Select a part from explorer to begin transformations.
              </p>
            ) : (
              <div className="flex gap-2 w-full justify-center">
                {activeTool === 'Select' && (
                  <p className="text-[10px] text-zinc-300 text-center py-1 font-mono">
                    Selected: <strong className="text-white">{selectedPart.name}</strong>. Toggle ribbon tools to edit.
                  </p>
                )}
                {activeTool === 'Move' && (
                  <div className="grid grid-cols-6 gap-1 w-full text-center">
                    <button 
                      onClick={() => handleGizmoAction('Move', 'x', -1)}
                      className="bg-[#111214] hover:bg-neutral-800 text-white border border-[#393B3D] p-1 rounded text-[10px] cursor-pointer font-bold font-mono transition-colors"
                      title="Move Left (-X)"
                    >
                      ◀ X
                    </button>
                    <button 
                      onClick={() => handleGizmoAction('Move', 'x', 1)}
                      className="bg-[#111214] hover:bg-neutral-800 text-white border border-[#393B3D] p-1 rounded text-[10px] cursor-pointer font-bold font-mono transition-colors"
                      title="Move Right (+X)"
                    >
                      X ▶
                    </button>
                    <button 
                      onClick={() => handleGizmoAction('Move', 'y', -1)}
                      className="bg-[#111214] hover:bg-red-950/40 text-white border border-[#393B3D] p-1 rounded text-[10px] cursor-pointer font-bold font-mono transition-colors"
                      title="Move Down (-Y)"
                    >
                      ▼ Y
                    </button>
                    <button 
                      onClick={() => handleGizmoAction('Move', 'y', 1)}
                      className="bg-[#111214] hover:bg-emerald-950/40 text-white border border-[#393B3D] p-1 rounded text-[10px] cursor-pointer font-bold font-mono transition-colors"
                      title="Move Up (+Y)"
                    >
                      ▲ Y
                    </button>
                    <button 
                      onClick={() => handleGizmoAction('Move', 'z', -1)}
                      className="bg-[#111214] hover:bg-blue-950/40 text-white border border-[#393B3D] p-1 rounded text-[10px] cursor-pointer font-bold font-mono transition-colors"
                      title="Move Forward (-Z)"
                    >
                      ▲ Z
                    </button>
                    <button 
                      onClick={() => handleGizmoAction('Move', 'z', 1)}
                      className="bg-[#111214] hover:bg-blue-950/40 text-white border border-[#393B3D] p-1 rounded text-[10px] cursor-pointer font-bold font-mono transition-colors"
                      title="Move Backward (+Z)"
                    >
                      ▼ Z
                    </button>
                  </div>
                )}
                {activeTool === 'Rotate' && (
                  <div className="flex gap-1.5 w-full justify-between items-center text-[10px] font-bold font-mono">
                    <button 
                      onClick={() => handleGizmoAction('Rotate', 'rotation', -90)}
                      className="flex-1 bg-[#111214] hover:bg-neutral-800 text-white border border-[#393B3D] p-1 rounded cursor-pointer transition-colors"
                    >
                      -90°
                    </button>
                    <button 
                      onClick={() => handleGizmoAction('Rotate', 'rotation', -15)}
                      className="flex-1 bg-[#111214] hover:bg-neutral-800 text-white border border-[#393B3D] p-1 rounded cursor-pointer transition-colors"
                    >
                      -15°
                    </button>
                    <div className="px-3 text-emerald-400 bg-[#111214] border border-[#393B3D] rounded py-1 min-w-[55px] text-center">
                      {(selectedPart.rotation || 0)}°
                    </div>
                    <button 
                      onClick={() => handleGizmoAction('Rotate', 'rotation', 15)}
                      className="flex-1 bg-[#111214] hover:bg-neutral-800 text-white border border-[#393B3D] p-1 rounded cursor-pointer transition-colors"
                    >
                      +15°
                    </button>
                    <button 
                      onClick={() => handleGizmoAction('Rotate', 'rotation', 90)}
                      className="flex-1 bg-[#111214] hover:bg-neutral-800 text-white border border-[#393B3D] p-1 rounded cursor-pointer transition-colors"
                    >
                      +90°
                    </button>
                  </div>
                )}
                {activeTool === 'Scale' && (
                  <div className="grid grid-cols-6 gap-1 w-full text-center">
                    <button 
                      onClick={() => handleGizmoAction('Scale', 'sizeX', -1)}
                      className="bg-[#111214] hover:bg-neutral-800 text-white border border-[#393B3D] p-1 rounded text-[9px] cursor-pointer font-semibold font-mono transition-colors"
                      title="Scale Width X (-)"
                    >
                      - W
                    </button>
                    <button 
                      onClick={() => handleGizmoAction('Scale', 'sizeX', 1)}
                      className="bg-[#111214] hover:bg-neutral-800 text-white border border-[#393B3D] p-1 rounded text-[9px] cursor-pointer font-semibold font-mono transition-colors"
                      title="Scale Width X (+)"
                    >
                      + W
                    </button>
                    <button 
                      onClick={() => handleGizmoAction('Scale', 'sizeY', -1)}
                      className="bg-[#111214] hover:bg-neutral-800 text-white border border-[#393B3D] p-1 rounded text-[9px] cursor-pointer font-semibold font-semibold font-mono transition-colors"
                      title="Scale Height Y (-)"
                    >
                      - H
                    </button>
                    <button 
                      onClick={() => handleGizmoAction('Scale', 'sizeY', 1)}
                      className="bg-[#111214] hover:bg-neutral-800 text-white border border-[#393B3D] p-1 rounded text-[9px] cursor-pointer font-semibold font-mono transition-colors"
                      title="Scale Height Y (+)"
                    >
                      + H
                    </button>
                    <button 
                      onClick={() => handleGizmoAction('Scale', 'sizeZ', -1)}
                      className="bg-[#111214] hover:bg-neutral-800 text-white border border-[#393B3D] p-1 rounded text-[9px] cursor-pointer font-semibold font-mono transition-colors"
                      title="Scale Depth Z (-)"
                    >
                      - D
                    </button>
                    <button 
                      onClick={() => handleGizmoAction('Scale', 'sizeZ', 1)}
                      className="bg-[#111214] hover:bg-neutral-800 text-white border border-[#393B3D] p-1 rounded text-[9px] cursor-pointer font-semibold font-mono transition-colors"
                      title="Scale Depth Z (+)"
                    >
                      + D
                    </button>
                  </div>
                )}
                 {/* ✏️ Rename and 🗑️ Delete Gizmo block controls */}
                 {selectedPart && (
                   <div className="flex border-t border-zinc-800/80 pt-1.5 mt-1.5 justify-between items-center w-full gap-2 px-1">
                     {renamingPartId === selectedPart.id ? (
                       <div className="flex items-center gap-1.5 w-full bg-[#18191e] border border-[#393B3D] px-1.5 py-0.5 rounded">
                         <input
                           type="text"
                           value={renameValue}
                           onChange={(e) => setRenameValue(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               if (renameValue.trim() !== '') {
                                 updateProp('name', renameValue.trim());
                                 triggerBeep(450, 0.08);
                               }
                               setRenamingPartId(null);
                             } else if (e.key === 'Escape') {
                               setRenamingPartId(null);
                             }
                           }}
                           className="bg-transparent border-none text-white text-[10px] w-full focus:outline-none placeholder-zinc-500"
                           autoFocus
                         />
                         <button
                           onClick={() => {
                             if (renameValue.trim() !== '') {
                               updateProp('name', renameValue.trim());
                               triggerBeep(450, 0.08);
                             }
                             setRenamingPartId(null);
                           }}
                           className="text-emerald-400 hover:text-emerald-300 text-[10px] px-1 font-bold cursor-pointer"
                           title="Save Name"
                         >
                           ✓
                         </button>
                         <button
                           onClick={() => setRenamingPartId(null)}
                           className="text-rose-400 hover:text-rose-300 text-[10px] px-1 font-bold cursor-pointer"
                           title="Cancel"
                         >
                           ✗
                         </button>
                       </div>
                     ) : deletingPartId === selectedPart.id ? (
                       <div className="flex items-center justify-between w-full bg-red-950/40 border border-red-900/40 px-1.5 py-0.5 rounded gap-1.5">
                         <span className="text-[9px] font-bold text-red-300 uppercase tracking-wider truncate">Confirm Delete?</span>
                         <div className="flex items-center gap-1 shrink-0">
                           <button
                             onClick={() => {
                               deletePart(selectedPart.id);
                               setDeletingPartId(null);
                             }}
                             className="bg-red-600 hover:bg-red-500 text-white rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase cursor-pointer"
                           >
                             Yes, Delete
                           </button>
                           <button
                             onClick={() => setDeletingPartId(null)}
                             className="bg-[#2a2b2d] hover:bg-[#323436] text-zinc-300 rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase cursor-pointer"
                           >
                             Cancel
                           </button>
                         </div>
                       </div>
                     ) : (
                       <>
                         <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono truncate">
                           <span>Part:</span>
                           <strong className="text-white truncate max-w-[80px]">{selectedPart.name}</strong>
                         </div>
                         <div className="flex items-center gap-1.5 shrink-0">
                           <button
                             onClick={() => {
                               setRenamingPartId(selectedPart.id);
                               setRenameValue(selectedPart.name);
                               setDeletingPartId(null);
                             }}
                             className="bg-[#2a2b2d] hover:bg-[#323436] hover:text-white text-zinc-300 border border-[#393B3D] px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                             title="Rename this part"
                           >
                             ✏️ Rename
                           </button>
                           {selectedPart.id !== 'p1' && (
                             <button
                               onClick={() => {
                                 setDeletingPartId(selectedPart.id);
                                 setRenamingPartId(null);
                               }}
                               className="bg-red-950/60 hover:bg-red-900/60 hover:text-red-100 text-red-300 border border-red-900/60 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                               title="Delete selected part"
                             >
                               🗑️ Delete
                             </button>
                           )}
                         </div>
                       </>
                     )}
                   </div>
                 )}
              </div>
            )}
          </div>
          )}
        </main>

        {/* Right Side: Properties contextual explorer page (3 columns) */}
        {!isImmersivePlayTest && (
          <aside className={`bg-[#232527] flex flex-col justify-between overflow-y-auto transition-all duration-300 z-[60] lg:relative absolute right-0 top-0 bottom-0 border-[#393B3D] ${
            rightSidebarOpen ? 'w-64 border-l shadow-2xl' : 'w-0 overflow-hidden border-none'
          }`}>
          <div>
            <div className="px-3.5 py-2 border-b border-[#393B3D] text-[10px] font-bold uppercase tracking-widest text-[#90929b] flex items-center justify-between gap-1">
              <span className="flex items-center gap-2"><Sliders size={12} /> Part Properties</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {selectedPartIds.length > 1 && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[9px] font-mono text-emerald-400 font-bold tracking-tight animate-pulse shrink-0">
                    {selectedPartIds.length} SELECTED
                  </span>
                )}
                <button 
                  onClick={() => { setRightSidebarOpen(false); triggerBeep(420, 0.05); }}
                  className="lg:hidden p-1 hover:bg-[#323436] rounded text-[#90929b] hover:text-white"
                  title="Collapse Properties"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {selectedPart ? (
              <div className="p-3.5 space-y-3 text-xs">
                {/* ID Name */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 font-display">Target Name</span>
                  <input
                    type="text"
                    value={selectedPart.name}
                    onChange={(e) => updateProp('name', e.target.value)}
                    className="w-full bg-[#111214] text-white p-1.5 rounded border border-[#393B3D] text-xs font-mono font-bold"
                  />
                </div>

                {/* Positions coordinates */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block font-display">Spatial Coordinates</span>
                  
                  <div className="grid grid-cols-3 gap-1 text-[11px] font-mono font-bold">
                    <div className="bg-[#111214] p-1 rounded border border-[#393B3D] flex justify-between px-2">
                      <span className="text-gray-500">X:</span>
                      <input 
                        type="number" 
                        value={selectedPart.x} 
                        onChange={(e) => updateProp('x', parseInt(e.target.value) || 0)}
                        className="w-8 bg-transparent text-right outline-none text-white select-none pointer-events-auto"
                      />
                    </div>
                    <div className="bg-[#111214] p-1 rounded border border-[#393B3D] flex justify-between px-2">
                      <span className="text-gray-500">Y:</span>
                      <input 
                        type="number" 
                        value={selectedPart.y} 
                        onChange={(e) => updateProp('y', parseInt(e.target.value) || 0)}
                        className="w-8 bg-transparent text-right outline-none text-white"
                      />
                    </div>
                    <div className="bg-[#111214] p-1 rounded border border-[#393B3D] flex justify-between px-2">
                      <span className="text-gray-500">Z:</span>
                      <input 
                        type="number" 
                        value={selectedPart.z} 
                        onChange={(e) => updateProp('z', parseInt(e.target.value) || 0)}
                        className="w-8 bg-transparent text-right outline-none text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Y-Axis Rotation Slider */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 font-display">Rotation (Y-Axis)</span>
                  <div className="flex gap-1.5 items-center bg-[#111214] p-1.5 rounded border border-[#393B3D]">
                    <Sliders size={12} className="text-zinc-500" />
                    <input 
                      type="range"
                      min="0"
                      max="359"
                      value={selectedPart.rotation || 0}
                      onChange={(e) => updateProp('rotation', parseInt(e.target.value) || 0)}
                      className="flex-1 accent-white cursor-pointer h-1 rounded"
                    />
                    <input 
                      type="number" 
                      min="0"
                      max="359"
                      value={selectedPart.rotation || 0} 
                      onChange={(e) => updateProp('rotation', Math.max(0, Math.min(359, parseInt(e.target.value) || 0)))}
                      className="w-10 bg-transparent border-0 text-white font-mono text-xs outline-none text-right"
                    />
                  </div>
                </div>

                {/* Size dimensions */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block font-display">Size (Studs)</span>
                  
                  <div className="grid grid-cols-3 gap-1 text-[11px] font-mono font-bold">
                    <div className="bg-[#111214] p-1 rounded border border-[#393B3D] flex justify-between px-2">
                      <span className="text-gray-500">X:</span>
                      <input 
                        type="number" 
                        min="1"
                        max="50"
                        value={selectedPart.sizeX || 4} 
                        onChange={(e) => updateProp('sizeX', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-8 bg-transparent text-right outline-none text-white select-none pointer-events-auto"
                      />
                    </div>
                    <div className="bg-[#111214] p-1 rounded border border-[#393B3D] flex justify-between px-2">
                      <span className="text-gray-500">Y:</span>
                      <input 
                        type="number" 
                        min="1"
                        max="50"
                        value={selectedPart.sizeY || 4} 
                        onChange={(e) => updateProp('sizeY', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-8 bg-transparent text-right outline-none text-white"
                      />
                    </div>
                    <div className="bg-[#111214] p-1 rounded border border-[#393B3D] flex justify-between px-2">
                      <span className="text-gray-500">Z:</span>
                      <input 
                        type="number" 
                        min="1"
                        max="50"
                        value={selectedPart.sizeZ || 4} 
                        onChange={(e) => updateProp('sizeZ', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-8 bg-transparent text-right outline-none text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Hex Input */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 font-display">Rendering Color</span>
                  <div className="flex gap-1.5 items-center bg-[#111214] p-1.5 rounded border border-[#393B3D]">
                    <input
                      type="color"
                      value={selectedPart.color}
                      onChange={(e) => updateProp('color', e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer pointer-events-auto border-0"
                    />
                    <input 
                      type="text" 
                      value={selectedPart.color} 
                      onChange={(e) => updateProp('color', e.target.value)}
                      className="flex-1 bg-transparent border-0 text-white font-mono uppercase font-bold text-xs outline-none"
                    />
                  </div>
                </div>

                {/* material dropdown */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 font-display">Material Face</span>
                  <select
                    value={selectedPart.material}
                    onChange={(e) => updateProp('material', e.target.value)}
                    className="w-full bg-[#111214] text-white p-1.5 rounded border border-[#393B3D] font-bold text-xs"
                  >
                    <option value="Plastic">Plastic</option>
                    <option value="Neon">Neon (Emissive)</option>
                    <option value="Wood">Oak Wood</option>
                    <option value="Metal">Polished Chrome</option>
                  </select>
                </div>

                {/* Block Face Texture custom panel */}
                <div className="space-y-1 pt-1.5 pb-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 font-display block select-none">
                    Block Face Texture
                  </span>
                  
                  {selectedPart.customTextureId ? (
                    <div className="space-y-2 bg-[#111214] p-1.5 rounded border border-cyan-500/40">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 rounded bg-[#2a2c30] border border-zinc-700 flex-shrink-0 overflow-hidden">
                            <img 
                              src={
                                customTextures.find(t => t.id === selectedPart.customTextureId)?.dataUrl || ''
                              } 
                              alt="face tex" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-[10px] text-cyan-400 font-bold truncate">
                            {customTextures.find(t => t.id === selectedPart.customTextureId)?.name || 'Custom Tex'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            updateProp('customTextureId', undefined);
                            triggerBeep(320, 0.05);
                          }}
                          className="text-[9px] font-bold text-red-400 hover:text-red-300 px-1 py-0.5 rounded hover:bg-red-500/10 cursor-pointer"
                          title="Remove custom texture"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Texture Rotation Slider Control */}
                      <div className="pt-1.5 border-t border-zinc-800 space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono">
                          <span>🔄 Texture Rotation</span>
                          <span className="text-cyan-400 font-bold">{selectedPart.textureRotation || 0}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="15"
                          value={selectedPart.textureRotation || 0}
                          onChange={(e) => {
                            updateProp('textureRotation', parseInt(e.target.value, 10));
                          }}
                          className="w-full accent-cyan-500 bg-[#222428] cursor-pointer h-1 rounded-lg select-all"
                        />
                        <div className="flex justify-between text-[7.5px] text-zinc-500 select-none">
                          <span>0°</span>
                          <span>90°</span>
                          <span>180°</span>
                          <span>270°</span>
                          <span>360°</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9.5px] text-zinc-500 italic mb-1 font-display">
                      No custom texture applied.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      triggerBeep(450, 0.1);
                      setTextureModeScope('block');
                      setTextureActiveSubTab('hub');
                      setShowTextureModal(true);
                    }}
                    className="w-full py-1.5 bg-gradient-to-r from-cyan-950/40 to-teal-950/40 hover:from-cyan-900/50 hover:to-teal-900/50 border border-cyan-500/20 hover:border-cyan-400 text-cyan-300 hover:text-white rounded font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    <span>🎨 Implement Texture</span>
                  </button>
                </div>

                {/* INTERACTIVE GAMEPLAY TRIGGER */}
                <div className="space-y-1.5 pt-2 border-t border-[#393B3D]">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 font-display flex items-center gap-1 select-none">
                    🎮 Play Sandbox Action
                  </span>
                  <p className="text-[9.5px] text-[#90929b] font-sans leading-normal">
                    Turn this block into a custom interactive feature! Rule activates on player touch:
                  </p>
                  <select
                    value={selectedPart.specialBehavior || 'none'}
                    onChange={(e) => {
                      const behavior = e.target.value;
                      updateProp('specialBehavior', behavior);
                      // Update color and material to match behavior templates automatically to make it easy for kids!
                      if (behavior !== 'none') {
                        const cfg = SPECIAL_BLOCKS[behavior as keyof typeof SPECIAL_BLOCKS];
                        if (cfg) {
                          updateProp('color', cfg.defaultColor);
                          updateProp('material', cfg.defaultMaterial);
                        }
                      }
                      triggerBeep(380, 0.08);
                    }}
                    className="w-full bg-[#111214] text-white p-1.5 rounded border border-[#393B3D] text-[11px] font-bold font-mono outline-none cursor-pointer"
                  >
                    <option value="none">🧱 Normal Solid Block</option>
                    <option value="respawn_star">⭐ Respawn Star (Save Progress)</option>
                    <option value="lava_melt">🔥 Lava Melt (Defeat Player)</option>
                    <option value="spiky_ouch">🌵 Spiky Ouch (Cactus Damage)</option>
                    <option value="ghost_illusion">👻 Ghost Illusion (Fall-through)</option>
                    <option value="heart_healer">❤️ Heart Healer (Full Restore)</option>
                    <option value="bounce_pad">🚀 Bounce Pad (Super Jump)</option>
                    <option value="speed_boost">⚡ Speed Booster (Slide Fast)</option>
                    <option value="candy_coin">🪙 Gold Candy Coin (+10 Score)</option>
                    <option value="dimension_rift_portal">🌀 Dimension Rift Portal (2.5D Switch)</option>
                    <option value="moving_hazard">💀 Patrolling Hazard Guard</option>
                    <option value="moving_platform">⚙️ Sliding Moving Platform</option>
                    <option value="linked_teleporter">☄️ Linked Quantum Teleporter</option>
                    <option value="low_gravity_moon">☁️ Anti-Gravity Moon Block (Float Mode)</option>
                    <option value="high_gravity_mud">🟫 Heavy mud trap (Slow Mode)</option>
                    <option value="shrink_ray">🧪 Scale Shrink Potion (Mini Mode)</option>
                    <option value="grow_ray">💊 Colossus Growth Fluid (Giant Mode)</option>
                    <option value="point_drainer">💀 Points Drainer Pad (-15 Score)</option>
                    <option value="mystery_dice">🎲 Random Mystery Dice (Magical Roll)</option>
                  </select>

                  {selectedPart.specialBehavior === 'linked_teleporter' && (
                    <div className="space-y-1 pt-1.5 animate-fade-in">
                      <span className="text-[10px] uppercase font-bold text-pink-400 font-display block select-none">Target Teleport Part Link</span>
                      <select
                        value={selectedPart.targetPartId || ''}
                        onChange={(e) => updateProp('targetPartId', e.target.value)}
                        className="w-full bg-[#111214] text-white p-1.5 rounded border border-[#393B3D] text-[11px] font-bold font-mono outline-none cursor-pointer"
                      >
                        <option value="">⚠️ Select Destination...</option>
                        {parts
                          .filter(p => p.id !== selectedPart.id && p.name !== 'Baseplate_Grid')
                          .map(p => (
                            <option key={p.id} value={p.id}>🎯 {p.name} ({p.type})</option>
                          ))}
                      </select>
                      <p className="text-[9px] text-zinc-400 leading-snug">
                        Linking connects this portal with another block. Stepping on this portal warps the player there! For smooth cyclic routes, link both portals together.
                      </p>
                    </div>
                  )}
                </div>

                {/* CUSTOM EVENT SCRIPTING PANEL */}
                <div className="space-y-1.5 pt-2 border-t border-[#393B3D]">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 font-display flex items-center gap-1.5 select-none">
                    📜 Custom Script Engine <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded px-1 text-[8px] font-mono leading-none py-0.5 animate-pulse">PRO</span>
                  </span>
                  <p className="text-[9.5px] text-[#90929b] font-sans leading-normal">
                    Code interactive mechanics using visual blocks or freeform event lines!
                  </p>
                  <button
                    onClick={() => {
                      triggerBeep(450, 0.1);
                      // Set temp states based on selected part script attributes
                      setProCode(selectedPart.scriptCode || '');
                      
                      // If there is existing visual scriptState structured rules, load them
                      if (selectedPart.scriptRules && selectedPart.scriptRules.length > 0) {
                        setJuniorActions(selectedPart.scriptRules);
                      } else {
                        // default action setup
                        setJuniorActions([
                          { type: 'give_points', val: '50' },
                          { type: 'play_sound', val: 'COIN' }
                        ]);
                      }
                      
                      setShowScriptEditor(true);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-cyan-950/50 to-indigo-950/50 hover:from-cyan-900/50 hover:to-indigo-900/50 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md active:scale-[0.98]"
                  >
                    <span>📜 Code Event Script</span>
                  </button>
                  {selectedPart.scriptCode ? (
                    <div className="text-[9px] font-mono text-cyan-400/80 bg-[#111214] p-1.5 rounded border border-cyan-950/50 truncate flex items-center justify-between select-none">
                      <span className="truncate">Active: "{selectedPart.scriptCode.split('\n').filter(l => l.toUpperCase().startsWith('WHEN'))[0] || 'Custom Script'}"</span>
                      <span className="text-emerald-500 animate-pulse font-bold text-[8px] tracking-widest uppercase ml-1 block">LIVE</span>
                    </div>
                  ) : (
                    <div className="text-[9px] italic text-zinc-500 text-center font-display my-1">
                      No script attached. Freebase solid block.
                    </div>
                  )}
                </div>

                {/* Tiled texture panel for custom sculpt objects */}
                {selectedPart.type === 'CustomSculpt' && (
                  <div className="space-y-1 pt-2 border-t border-[#393B3D] animate-fade-in">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 block font-display tracking-wider">
                      Tiled Mesh Texture
                    </span>
                    <p className="text-[9px] text-[#90929b] font-mono leading-normal mb-2">
                      Map a customized physical tile pattern layer directly over this sculpted model's dynamic polygon quads:
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'none', label: '❌ Clean Matte', desc: 'No overlay pattern' },
                        { id: 'stone', label: '🪨 Stone', desc: 'Slate paving lines' },
                        { id: 'sand', label: '🏜️ Sand', desc: 'Granular grains' },
                        { id: 'metal', label: '⚙️ Metal Grid', desc: 'Diamond treads' },
                        { id: 'wood', label: '🪵 Wood Fibers', desc: 'Swirling oak rings' },
                        { id: 'brick', label: '🧱 Brick Bond', desc: 'Masonry joints' },
                        { id: 'grid', label: '🌐 Tech Mesh', desc: 'Millimeter graph' },
                      ].map((tex) => (
                        <button
                          key={tex.id}
                          onClick={() => {
                            updateProp('sculptTexture', tex.id);
                            triggerBeep(380, 0.05);
                          }}
                          className={`p-1.5 rounded border text-[10px] text-left transition-all cursor-pointer ${
                            (selectedPart.sculptTexture || 'none') === tex.id
                              ? 'bg-cyan-950/20 border-cyan-500/50 text-cyan-400 font-bold shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                              : 'bg-[#111214] border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          <div className="font-semibold block truncate leading-none">{tex.label}</div>
                          <div className="text-[8px] text-zinc-500 font-mono truncate mt-0.5 leading-none">{tex.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Anchorage / Shadow state toggles */}
                <div className="space-y-1.5 pt-1.5 border-t border-[#393B3D]">
                  <label className="flex items-center gap-2 text-zinc-400 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={selectedPart.anchored}
                      onChange={(e) => updateProp('anchored', e.target.checked)}
                      className="accent-white"
                    />
                    <span>Anchored (Freeze Physics)</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-400 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={selectedPart.castShadow}
                      onChange={(e) => updateProp('castShadow', e.target.checked)}
                      className="accent-white"
                    />
                    <span>Cast Lighting Shadow</span>
                  </label>
                </div>

                {/* ✏️ Delete Part / Rename Part Buttons inside Properties Panel */}
                <div className="pt-3 border-t border-[#393B3D]">
                  {renamingPartId === selectedPart.id ? (
                    <div className="space-y-1.5 p-2 bg-[#18191e] border border-[#393B3D] rounded">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Rename Object:</div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (renameValue.trim() !== '') {
                                updateProp('name', renameValue.trim());
                                triggerBeep(450, 0.08);
                              }
                              setRenamingPartId(null);
                            } else if (e.key === 'Escape') {
                              setRenamingPartId(null);
                            }
                          }}
                          className="bg-[#111214] border border-[#393B3D] text-white text-xs w-full focus:outline-none px-2 py-1 rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            if (renameValue.trim() !== '') {
                              updateProp('name', renameValue.trim());
                              triggerBeep(450, 0.08);
                            }
                            setRenamingPartId(null);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setRenamingPartId(null)}
                          className="bg-zinc-800 hover:bg-[#323436] text-zinc-400 rounded px-2 py-1 text-xs font-bold cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : deletingPartId === selectedPart.id ? (
                    <div className="space-y-2 p-2 bg-red-950/20 border border-red-900/30 rounded">
                      <div className="text-[10px] font-bold text-red-300 text-center uppercase tracking-wide">Do you really want to delete "{selectedPart.name}"?</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            deletePart(selectedPart.id);
                            setDeletingPartId(null);
                          }}
                          className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded text-[10px] uppercase cursor-pointer transition-colors"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setDeletingPartId(null)}
                          className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold rounded text-[10px] uppercase cursor-pointer transition-colors"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setRenamingPartId(selectedPart.id);
                          setRenameValue(selectedPart.name);
                          setDeletingPartId(null);
                        }}
                        className="py-2 px-3 bg-[#2a2b2d] hover:bg-[#323436] text-white font-bold rounded text-[11px] uppercase tracking-wider select-none cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-95 border border-[#393B3D]"
                        title="Rename this part/gizmo"
                      >
                        ✏️ Rename
                      </button>
                      {selectedPart.id !== 'p1' ? (
                        <button
                          onClick={() => {
                            setDeletingPartId(selectedPart.id);
                            setRenamingPartId(null);
                          }}
                          className="py-2 px-3 bg-red-950/60 hover:bg-red-900/60 text-red-200 font-bold rounded text-[11px] uppercase tracking-wider select-none cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-95 border border-red-900/60"
                          title="Delete this part/gizmo"
                        >
                          🗑️ Delete
                        </button>
                      ) : (
                        <div className="py-2 px-3 bg-zinc-900 text-zinc-600 font-semibold rounded text-[10px] text-center border border-zinc-800 select-none cursor-not-allowed uppercase tracking-wider flex items-center justify-center">
                          🔒 Ground Unit
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-400 text-xs">
                No Workspace element selected.
              </div>
            )}
          </div>

          <div className="p-3 bg-[#111214] border-t border-[#393B3D] text-[10px] text-gray-500 text-center font-mono uppercase tracking-widest font-bold">
            IDE Property Panel
          </div>
        </aside>
        )}

      </div>

      {/* 📜 DYNAMIC EVENT SCRIPT CREATOR MODAL (OPTION A & C INTEGRATED) */}
      {showScriptEditor && (
        <div className="fixed inset-0 bg-[#000000]/85 backdrop-blur-md flex items-center justify-center z-[10000] p-4 font-sans select-none animate-fade-in">
          <div className="w-full max-w-3xl bg-[#1c1d1f] border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Header */}
            <div className="px-5 py-4 bg-[#111214] border-b border-[#393B3D] flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl animate-spin" style={{ animationDuration: '6s' }}>📜</span>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    Custom Lua-like Event Script Creator
                    <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1 py-0.5 rounded font-mono">active: "{selectedPart.name}"</span>
                  </h3>
                  <p className="text-[10px] text-zinc-400">Design custom interactive actions using friendly triggers and instant interpreters</p>
                </div>
              </div>
              <button
                onClick={() => { setShowScriptEditor(false); triggerBeep(350, 0.05); }}
                className="p-1.5 hover:bg-[#2e3033] rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Exit Script Editor"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selector Tabs Option A vs C */}
            <div className="px-5 py-2 bg-[#161719] border-b border-[#393B3D] flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setScriptEditorTab('junior');
                    triggerBeep(400, 0.05);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    scriptEditorTab === 'junior'
                      ? 'bg-emerald-600 font-black text-white shadow-md'
                      : 'bg-[#1e2022] text-zinc-400 hover:text-white hover:bg-[#26282a]'
                  }`}
                >
                  🧩 Junior Rule Builder (Option C)
                </button>
                <button
                  onClick={() => {
                    setScriptEditorTab('pro');
                    // Sync visual settings to raw code representation if pro code is empty or they switch tabs
                    const currentGen = generateCodeFromJuniorFields(juniorTrigger, juniorActions);
                    setProCode(currentGen);
                    triggerBeep(400, 0.05);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    scriptEditorTab === 'pro'
                      ? 'bg-cyan-600 font-black text-white shadow-md'
                      : 'bg-[#1e2022] text-zinc-400 hover:text-white hover:bg-[#26282a]'
                  }`}
                >
                  📝 Pro Event-Code Interpreter (Option A)
                </button>
              </div>

              <span className="text-[10px] font-mono text-zinc-500 select-none">
                Interpreter v1.42.0 • Green Build
              </span>
            </div>

            {/* Main Editor Body */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#141517] pointer-events-auto text-left">
              {scriptEditorTab === 'junior' ? (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-950/25 border border-emerald-800/20 rounded-xl space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-400 font-mono tracking-wider block">How it works</span>
                    <p className="text-[11px] text-zinc-300 leading-normal">
                      The Junior builder writes clean code for you! Pick an event **WHEN** (trigger indicator) and link multiple **THEN** actions. The engine will render a real-time output preview inside the game.
                    </p>
                  </div>

                  {/* 1. Trigger Definition */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-[#90929b] uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      1. Trigger Condition (WHEN)
                    </label>
                    <select
                      value={juniorTrigger}
                      onChange={(e) => {
                        setJuniorTrigger(e.target.value);
                        triggerBeep(420, 0.05);
                      }}
                      className="w-full bg-[#1e2022] text-white p-2.5 rounded-xl border border-zinc-800 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="player_touches_self">👤 Player touches or collides with this Block</option>
                      <option value="player_interacts_npc">🎯 Player approaches and presses "E" (Interact with Block)</option>
                      <option value="player_clicks_part">🖱️ Player left-clicks on this Block in Play-mode</option>
                      <option value="player_touches_checkpoint">🏁 Player touches this Block as a Checkpoint</option>
                      <option value="player_double_jumps">🦘 Player executes a Double Jump near this Block</option>
                      <option value="player_dashes">💨 Player executes an Air-Dash near this Block</option>
                      <option value="game_loaded">🌐 Once the simulation starts (Game Loaded)</option>
                      <option value="self_collides_lava">🔥 This Block collides with physical Lava baseplate</option>
                      <option value="player_falls_void">🌌 Player falls into the Void vacuum</option>
                      <option value="player_hp_low">🚨 Player health falls below 25% (Danger state)</option>
                      <option value="player_gains_points">🪙 Player gains score points/coins</option>
                      <option value="player_drowns_mud">🟫 Player steps in heavy gravity mud block</option>
                      <option value="player_shrinks_mini">🧪 Player shrinks to microscopic scale</option>
                      <option value="player_grows_colossus">💊 Player grows to giant colossus scale</option>
                    </select>
                  </div>

                  {/* 2. Action Series builder */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-[#90929b] uppercase tracking-wide flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        2. Connected Action List (THEN)
                      </label>
                      <button
                        onClick={() => {
                          setJuniorActions(prev => [...prev, { type: 'play_sound', val: 'COIN' }]);
                          triggerBeep(550, 0.05);
                        }}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded text-[10px] font-extrabold tracking-wider transition-all cursor-pointer flex items-center gap-1"
                      >
                        ➕ Add Action Line
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {juniorActions.map((act, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-[#1b1c1e] p-2 rounded-xl border border-zinc-900 group">
                          <span className="text-[10px] font-mono text-zinc-500 select-none px-1">
                            {idx + 1}
                          </span>
                          
                          {/* Pick Action Type */}
                          <select
                            value={act.type}
                            onChange={(e) => {
                              const next = [...juniorActions];
                              next[idx].type = e.target.value;
                              // autofill standard defaults
                              if (e.target.value === 'give_robux' || e.target.value === 'give_points') next[idx].val = '100';
                              else if (e.target.value === 'take_health') next[idx].val = '25';
                              else if (e.target.value === 'bounce_air') next[idx].val = '18';
                              else if (e.target.value === 'speed_boost') next[idx].val = '25';
                              else if (e.target.value === 'play_sound') next[idx].val = 'COIN';
                              else if (e.target.value === 'alert_msg') next[idx].val = 'Block Triggered!';
                              else if (e.target.value === 'npc_dialogue') next[idx].val = 'Welcome, brave adventurer!';
                              else if (e.target.value === 'color_shimmer') next[idx].val = '#10b981';
                              setJuniorActions(next);
                              triggerBeep(410, 0.05);
                            }}
                            className="bg-[#111214] border border-zinc-800 text-white p-1.5 rounded text-xs font-bold outline-none cursor-pointer flex-1"
                          >
                            <option value="give_points">🪙 Give Player Points / Highscore Score</option>
                            <option value="give_robux">💰 Give Player Robux Points</option>
                            <option value="take_health">💥 Take Health (Damage Player)</option>
                            <option value="bounce_air">🚀 Bounce / Spring Launch Player</option>
                            <option value="speed_boost">⚡ Give Speed Booster (Slide Fast)</option>
                            <option value="play_sound">🔊 Play Retro Sound FX</option>
                            <option value="alert_msg">💡 Broadcast On-Screen Log Alert</option>
                            <option value="npc_dialogue">💬 Standalone NPC Dialogue speech bubble</option>
                            <option value="color_shimmer">🎨 Swap Block Color Shimmer</option>
                            <option value="teleport_spawn">🌀 Teleport Player back to Spawn point</option>
                            <option value="destroy_self">🗑️ Destroy Block (Make disappears)</option>
                          </select>

                          {/* Action Value Configuration detail input */}
                          {act.type !== 'teleport_spawn' && act.type !== 'destroy_self' && (
                            <input
                              type="text"
                              value={act.val}
                              placeholder="Value..."
                              onChange={(e) => {
                                const next = [...juniorActions];
                                next[idx].val = e.target.value;
                                setJuniorActions(next);
                              }}
                              className="w-28 sm:w-36 bg-[#111214] text-emerald-400 p-1.5 rounded border border-zinc-800 text-xs font-mono font-bold text-center outline-none"
                            />
                          )}

                          {/* Delete individual action */}
                          <button
                            onClick={() => {
                              setJuniorActions(prev => prev.filter((_, i) => i !== idx));
                              triggerBeep(250, 0.05);
                            }}
                            className="p-1 px-2 text-rose-500 hover:text-white hover:bg-rose-950/40 rounded transition-all cursor-pointer"
                            title="Delete Action Block"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {juniorActions.length === 0 && (
                        <div className="py-8 bg-[#18191a] rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500 italic">
                          No actions added yet. Click "+ Add Action Line" to build sandbox reactions!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Synchronized Script Preview display box */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest font-mono select-none">
                      🔄 Real-time Compiler Output Preview (Option A Sync):
                    </span>
                    <pre className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 text-[10.5px] font-mono text-cyan-400 overflow-x-auto max-h-24 select-text leading-tight opacity-80">
                      {generateCodeFromJuniorFields(juniorTrigger, juniorActions)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 h-full flex flex-col">
                  {/* Pro mode visual workspace */}
                  <div className="p-3 bg-cyan-950/25 border border-cyan-800/20 rounded-xl space-y-1">
                    <span className="text-[10px] font-black uppercase text-cyan-400 font-mono tracking-wider block">PRO FREEFORM CODE COMPILER</span>
                    <p className="text-[11px] text-zinc-300 leading-normal">
                      Write raw event hooks line-by-line! Perfect for complex, dynamic multiplayer worlds. Tap any preset snippet box below to paste an optimized code template instantly.
                    </p>
                  </div>

                  {/* Freeform editor text area with high-contrast text */}
                  <div className="flex-1 flex flex-col space-y-1.5 min-h-[180px]">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-extrabold text-[#90929b] uppercase tracking-wide">
                        📝 SOURCE COMPILER SCREEN:
                      </label>
                      <button
                        onClick={() => {
                          setProCode('');
                          triggerBeep(150, 0.05);
                        }}
                        className="text-[9px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        Reset Workspace
                      </button>
                    </div>
                    <textarea
                      value={proCode}
                      onChange={(e) => setProCode(e.target.value)}
                      placeholder="WHEN Player Touches Self THEN&#10;    GIVE Player 100 Points&#10;    PLAY SOUND COIN&#10;END"
                      className="w-full flex-1 bg-zinc-950 text-emerald-400 p-3 rounded-xl border border-zinc-800 text-xs font-mono outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-40 select-text leading-relaxed"
                    />
                  </div>

                  {/* Quick Code injection snippet boxes for kids */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest font-mono select-none">
                      🚀 One-Tap Interactive Script Blueprints:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setProCode("WHEN Player Touches Self THEN\n    LAUNCH Player WITH FORCE 25\n    PLAY SOUND COIN\n    ALERT MSG \"Launched high by customized jumper trampoline!\"\nEND");
                          triggerBeep(450, 0.1);
                        }}
                        className="p-2 bg-[#1b1c1e] hover:bg-zinc-800/80 border border-zinc-900 rounded-xl text-left hover:border-cyan-500/30 transition-all cursor-pointer select-none"
                      >
                        <span className="text-[11px] font-bold text-cyan-300 block">🚀 Super Spring Launch</span>
                        <span className="text-[9.5px] text-zinc-400 font-mono">Bounces player high into space</span>
                      </button>

                      <button
                        onClick={() => {
                          setProCode("WHEN Player Interacts with NPC THEN\n    NPC DIALOGUE Bob SAYS \"Welcome to Adoption Station! Feed the pets for extra score!\"\n    PLAY SOUND CHEER\nEND");
                          triggerBeep(450, 0.1);
                        }}
                        className="p-2 bg-[#1b1c1e] hover:bg-zinc-800/80 border border-zinc-900 rounded-xl text-left hover:border-cyan-500/30 transition-all cursor-pointer select-none"
                      >
                        <span className="text-[11px] font-bold text-cyan-300 block">💬 NPC Speech Dialogue</span>
                        <span className="text-[9.5px] text-zinc-400 font-mono">Generates customized speech bubble (Bob says)</span>
                      </button>

                      <button
                        onClick={() => {
                          setProCode("WHEN Player Touches Self THEN\n    GIVE Player 250 Robux\n    PLAY SOUND EXPLOSION\n    DESTROY Self\nEND");
                          triggerBeep(450, 0.1);
                        }}
                        className="p-2 bg-[#1b1c1e] hover:bg-zinc-800/80 border border-zinc-900 rounded-xl text-left hover:border-cyan-500/30 transition-all cursor-pointer select-none"
                      >
                        <span className="text-[11px] font-bold text-cyan-300 block">🪙 Disappearing Reward Block</span>
                        <span className="text-[9.5px] text-zinc-400 font-mono">Awards 250 Robux and vanishes</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-5 py-4 bg-[#111214] border-t border-[#393B3D] flex items-center justify-between pointer-events-auto">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    // Quick clear script attached to remove it altogether
                    setParts(prev => prev.map(p => p.id === selectedPartId ? { ...p, scriptCode: undefined, scriptRules: undefined } : p));
                    setShowScriptEditor(false);
                    triggerBeep(300, 0.05);
                  }}
                  className="px-4 py-2 bg-[#1e2022] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Clear Script (Disarm)
                </button>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    setShowScriptEditor(false);
                    triggerBeep(350, 0.05);
                  }}
                  className="px-4 py-2 bg-[#1e2022] hover:bg-[#2e3033] text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Compile & save active code
                    let finalizedCode = '';
                    let finalizedRules: any[] | undefined = undefined;
                    
                    if (scriptEditorTab === 'junior') {
                      finalizedCode = generateCodeFromJuniorFields(juniorTrigger, juniorActions);
                      finalizedRules = juniorActions;
                    } else {
                      finalizedCode = proCode;
                      // Try to parse some rudimentary rule flags if they wrote code
                    }
                    
                    // Bind to current part properties
                    setParts(prev => prev.map(p => {
                      if (p.id === selectedPartId) {
                        return {
                          ...p,
                          scriptCode: finalizedCode,
                          scriptRules: finalizedRules
                        };
                      }
                      return p;
                    }));
                    
                    // Trigger sound & visual confirmation
                    triggerBeep(1100, 0.08);
                    triggerBeep(1400, 0.12);
                    
                    // Add log entry to simulated sandbox console
                    setGameLogs(g => [
                      ...g.slice(-15),
                      `🚀 Compiled & linked interactive script to Block "${selectedPart.name}" successfully!`
                    ]);
                    
                    setShowScriptEditor(false);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wide border border-cyan-400/40"
                >
                  💾 Save & Link Script Block
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3D ASSET LIBRARY MANAGEMENT MODAL */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 text-sans select-none animate-fadeIn font-sans">
          <div className="w-full max-w-2xl bg-[#1c1d1f] border border-[#06b6d4]/40 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col overflow-hidden max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#111214] border-b border-[#393B3D] flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2">
                <span className="text-xl">📂</span>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    3D IDE Asset Library & Scene Manager
                  </h3>
                  <p className="text-[10px] text-zinc-400">Save your custom assemblies or clone professional game-ready template maps</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAssetModal(false); triggerBeep(350, 0.05); }}
                className="p-1.5 hover:bg-[#2e3033] rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Close Asset Library"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#161719] pointer-events-auto">
              
              {/* Notification Banner */}
              {saveStatusMsg && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
                  <span>✅</span> {saveStatusMsg}
                </div>
              )}

              {/* SAVE CURRENT ASSET SECTION */}
              <div className="bg-[#1e2022] p-4 rounded-lg border border-[#393B3D] space-y-3">
                <h4 className="text-[11px] font-black uppercase text-[#06b6d4] tracking-widest font-mono flex items-center gap-1.5">
                  💾 1. Save Workspace State
                </h4>
                <div className="flex gap-2.5">
                  <div className="flex-1">
                    <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold block mb-1">Asset Name</label>
                    <input
                      type="text"
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      className="w-full bg-[#111214] border border-[#393B3D] hover:border-zinc-700 focus:border-cyan-500 text-zinc-200 text-xs px-3 py-2 rounded-md outline-none transition-all placeholder-zinc-500 font-mono"
                      placeholder="e.g. Castle Guard Post"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={saveCurrentSceneAsAsset}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-md border border-cyan-400/40 transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                    >
                      <span>Save Current Scene</span>
                    </button>
                  </div>
                </div>
                <p className="text-[9px] text-zinc-500">
                  This will serialise all {parts.length} parts (including positions, brick materials, physics states, special features, and custom color mappings) into your browser storage so they survive resets.
                </p>
              </div>

              {/* CUSTOM SAVED ASSETS */}
              <div className="space-y-3.5">
                <h4 className="text-[11px] font-black uppercase text-[#06b6d4] tracking-widest font-mono flex items-center gap-1.5 text-zinc-300">
                  📂 2. Your Browser Saved Models ({savedModels.length})
                </h4>
                
                {savedModels.length === 0 ? (
                  <div className="text-center py-7 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-xs bg-[#111214]/40">
                    No custom models saved yet. Create a great shape and type a name above to save your first asset!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 select-none gap-3">
                    {savedModels.map((model) => (
                      <div key={model.id} className="bg-[#1e2022] p-3.5 rounded-lg border border-zinc-800 flex justify-between items-center gap-4 hover:border-zinc-700 transition-colors">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-white">{model.name}</h5>
                          <div className="flex gap-2.5 text-[9px] text-zinc-500 font-mono">
                            <span>Saved: {model.date}</span>
                            <span>•</span>
                            <span className="text-[#06b6d4]">{model.parts?.length || 0} Parts included</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadAssetIntoWorkspace(model.parts, true)}
                            className="px-2.5 py-1.5 bg-[#0f172a] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded font-extrabold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                            title="Replace the entire workspace with this saved design"
                          >
                            📥 Load Map
                          </button>
                          <button
                            onClick={() => loadAssetIntoWorkspace(model.parts, false)}
                            className="px-2.5 py-1.5 bg-[#022c22] hover:bg-[#064e3b] text-emerald-400 hover:text-white border border-emerald-900 rounded font-extrabold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                            title="Insert these parts into your current workspace at displaced positions"
                          >
                            ➕ Merge
                          </button>

                          {assetPendingDeleteId === model.id ? (
                            <div className="flex items-center gap-1 bg-red-950/40 p-1 border border-red-500/20 rounded">
                              <span className="text-[9px] text-red-200 px-1 font-bold">Sure?</span>
                              <button
                                onClick={() => deleteCustomSavedModel(model.id)}
                                className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[8px] font-black cursor-pointer uppercase"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setAssetPendingDeleteId(null)}
                                className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-[8px] font-black cursor-pointer uppercase"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setAssetPendingDeleteId(model.id); triggerBeep(250, 0.05); }}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 rounded border border-transparent hover:border-rose-900/30 transition-colors cursor-pointer"
                              title="Delete model from browser"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* OUT-OF-THE-BOX EXPERT TEMPLATES */}
              <div className="space-y-3.5">
                <h4 className="text-[11px] font-black uppercase text-[#06b6d4] tracking-widest font-mono flex items-center gap-1.5 text-zinc-300">
                  🗺️ 3. Expert Template Baseplates
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {PRESET_TEMPLATES.map((tpl) => (
                    <div key={tpl.id} className="bg-[#1e2022] p-3.5 rounded-lg border border-zinc-800 hover:border-cyan-900/40 flex flex-col justify-between space-y-3 transition-colors">
                      <div className="space-y-1">
                        <h5 className="text-[11px] font-extrabold text-white uppercase tracking-wider">{tpl.name}</h5>
                        <p className="text-[10px] text-zinc-400 leading-relaxed text-wrap">{tpl.desc}</p>
                      </div>
                      <div className="pt-2 flex flex-col gap-1.5">
                        <div className="text-[9px] text-[#06b6d4] font-mono mb-1">{tpl.parts.length} professional elements</div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => loadAssetIntoWorkspace(tpl.parts as Part[], true)}
                            className="flex-1 py-1 bg-[#1e293b] hover:bg-cyan-950 border border-zinc-700 hover:border-cyan-850 hover:text-cyan-400 text-zinc-300 text-[9px] font-black uppercase tracking-wider rounded cursor-pointer transition-colors"
                          >
                            📥 Override
                          </button>
                          <button
                            onClick={() => loadAssetIntoWorkspace(tpl.parts as Part[], false)}
                            className="flex-1 py-1 bg-[#122c22] hover:bg-emerald-950 border border-zinc-700 hover:border-emerald-850 hover:text-emerald-400 text-zinc-300 text-[9px] font-black uppercase tracking-wider rounded cursor-pointer transition-colors"
                          >
                            ➕ Merge
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-[#111214] border-t border-[#393B3D] flex items-center justify-between text-[10px] font-mono text-zinc-500 pointer-events-auto">
              <span>● Local Storage Key: studio_3d_saved_models_v1</span>
              <span>Workspace Parts: {parts.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* WALLED DIGITAL PIXEL TEXTURE MANAGEMENT MODAL */}
      {showTextureModal && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 text-sans select-none animate-fadeIn font-sans pointer-events-auto">
          <div className="w-full max-w-2xl bg-[#1c1d1f] border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col overflow-hidden max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#111214] border-b border-[#393B3D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎨</span>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Block Face Texture Designer
                  </h3>
                  <p className="text-[10px] text-cyan-400">
                    {textureModeScope === 'block' && selectedPartId
                      ? `Implementing custom texture on block: "${parts.find(p => p.id === selectedPartId)?.name}"`
                      : "Create custom style assets stored in your browser's Local Texture Pack"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowTextureModal(false); triggerBeep(350, 0.05); }}
                className="p-1.5 hover:bg-[#2e3033] rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Close Texture Designer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#161719] flex flex-col min-h-0">
              
              {/* HUB TAB */}
              {textureActiveSubTab === 'hub' && (
                <div className="space-y-5 flex-1 flex flex-col min-h-0">
                  {/* Bento Entry Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        triggerBeep(450, 0.08);
                        setDrawGrid(Array(16).fill(null).map(() => Array(16).fill('#1e1b4b')));
                        setDrawingTextureName('My Drawn Block');
                        setEditingTextureId(null);
                        setTextureActiveSubTab('draw');
                      }}
                      className="p-5 bg-gradient-to-br from-[#12242c] to-[#16191c] hover:from-[#162d38] hover:to-[#1a2126] border border-cyan-500/10 hover:border-cyan-400/30 rounded-xl text-left transition-colors cursor-pointer group shadow"
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🎨</div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Make Custom Texture</h4>
                      <p className="text-[10px] text-zinc-400 mt-1">Summon drawing tools with the custom retro pixel-art grid canvas editor</p>
                    </button>

                    <button
                      onClick={() => {
                        triggerBeep(450, 0.08);
                        setImportedDataUrl(null);
                        setTextureActiveSubTab('import');
                      }}
                      className="p-5 bg-gradient-to-br from-[#122c22] to-[#161c19] hover:from-[#15382b] hover:to-[#1a2621] border border-emerald-500/10 hover:border-emerald-400/30 rounded-xl text-left transition-colors cursor-pointer group shadow"
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📥</div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Import Image Asset</h4>
                      <p className="text-[10px] text-zinc-400 mt-1">Import file textures from your local picture gallery to map over standard block models</p>
                    </button>
                  </div>

                  {/* Current block texture rotation settings */}
                  {selectedPartId && (() => {
                    const blockPart = parts.find(p => p.id === selectedPartId);
                    if (blockPart && blockPart.customTextureId) {
                      const activeTex = customTextures.find(t => t.id === blockPart.customTextureId);
                      return (
                        <div className="p-3 bg-gradient-to-r from-cyan-950/20 to-zinc-900 border border-cyan-500/30 rounded-xl space-y-2 mb-2 shrink-0 text-left">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🔄</span>
                              <div>
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Rotate Applied Texture</h4>
                                <p className="text-[9px] text-zinc-400">Rotate the pattern overlay on block: "{blockPart.name}"</p>
                              </div>
                            </div>
                            <span className="bg-[#111214] border border-[#393B3D] text-[10px] font-mono font-bold text-cyan-400 px-2 py-0.5 rounded">
                              {blockPart.textureRotation || 0}° Angle
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {activeTex && (
                              <div className="w-9 h-9 rounded bg-[#2a2c30] border border-cyan-500/40 relative overflow-hidden flex-shrink-0">
                                <img 
                                  src={activeTex.dataUrl} 
                                  alt="applied" 
                                  className="w-full h-full object-cover"
                                  style={{ transform: `rotate(${blockPart.textureRotation || 0}deg)`, transition: 'transform 0.1s ease-out' }}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <div className="flex-1 space-y-1">
                              <input
                                type="range"
                                min="0"
                                max="360"
                                step="15"
                                value={blockPart.textureRotation || 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setParts(prev => prev.map(p => p.id === selectedPartId ? { ...p, textureRotation: val } : p));
                                }}
                                className="w-full h-1 bg-[#111214] rounded-lg cursor-pointer accent-cyan-500"
                              />
                              <div className="flex justify-between text-[8px] text-zinc-500 font-mono">
                                <span>0° (Default)</span>
                                <span>90°</span>
                                <span>180°</span>
                                <span>270°</span>
                                <span>360°</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* HEADER TITLE FOR PACK */}
                  <div className="border-t border-zinc-800 pt-4 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <h4 className="text-[10px] font-black uppercase text-zinc-300 tracking-widest font-mono flex items-center gap-1.5 font-bold">
                        📦 My Texture Pack (Stored in Browser)
                      </h4>
                      <span className="text-[9px] text-[#06b6d4] font-mono font-bold bg-[#06b6d4]/10 px-2 py-0.5 rounded-full">
                        {customTextures.length} textures loaded
                      </span>
                    </div>

                    {/* Scrollable grid of items */}
                    {customTextures.length === 0 ? (
                      <div className="text-center py-10 bg-[#1e2022] rounded-lg border border-dashed border-zinc-800 text-zinc-500 text-xs">
                        No custom textures built. Design or import templates to get started!
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-y-auto max-h-[300px] pr-1.5 scrollbar-thin">
                        {customTextures.map((tex) => {
                          const isAppliedOnCurrent = selectedPartId && parts.find(p => p.id === selectedPartId)?.customTextureId === tex.id;
                          return (
                            <div 
                              key={tex.id}
                              className={`bg-[#1e2022] rounded-lg border p-2 flex flex-col justify-between space-y-2 transition-all ${
                                isAppliedOnCurrent ? 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.15)] bg-slate-900/40' : 'border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className="space-y-1.5">
                                {/* Thumbnail preview box */}
                                <div className="aspect-square w-full rounded bg-[#2a2c30] border border-zinc-700 overflow-hidden relative group/thumb">
                                  <img 
                                    src={tex.dataUrl} 
                                    alt={tex.name} 
                                    className="w-full h-full object-cover select-none"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-[9px] uppercase font-bold text-wrap text-center px-1 text-white">
                                      {tex.type === 'preset' ? 'System Preset' : tex.type === 'drawn' ? 'Hand Drawn' : 'Gallery file'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-[11px] font-extrabold text-white truncate px-1" title={tex.name}>
                                  {tex.name}
                                </div>
                              </div>

                              <div className="pt-1.5 border-t border-zinc-800 flex flex-col gap-1 shrink-0">
                                {selectedPartId && (
                                  <button
                                    onClick={() => {
                                      updateProp('customTextureId', tex.id);
                                      triggerBeep(650, 0.15);
                                      setShowTextureModal(false);
                                    }}
                                    className={`w-full py-1 rounded text-[9px] uppercase font-sans font-black tracking-wider transition-all cursor-pointer ${
                                      isAppliedOnCurrent
                                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 cursor-default'
                                        : 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/30'
                                    }`}
                                  >
                                    {isAppliedOnCurrent ? '✓ Active Item' : '🧱 Implement'}
                                  </button>
                                )}

                                <div className="flex gap-1.5 justify-end">
                                  {tex.type === 'drawn' && tex.customGrid && (
                                    <button
                                      onClick={() => {
                                        triggerBeep(420, 0.08);
                                        setDrawGrid(tex.customGrid!);
                                        setDrawingTextureName(tex.name);
                                        setEditingTextureId(tex.id);
                                        setTextureActiveSubTab('draw');
                                      }}
                                      className="p-1 px-2 flex-grow bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[9px] font-bold cursor-pointer transition-colors text-center"
                                      title="Resume painting this dynamic pixel art template"
                                    >
                                      Paint
                                    </button>
                                  )}
                                  {tex.type !== 'preset' && (
                                    <button
                                      onClick={() => {
                                        triggerBeep(320, 0.05);
                                        const nextList = customTextures.filter(t => t.id !== tex.id);
                                        saveCustomTextures(nextList);
                                        // Unassign from parts
                                        setParts(prev => prev.map(p => p.customTextureId === tex.id ? { ...p, customTextureId: undefined } : p));
                                      }}
                                      className="p-1 px-[5px] bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-transparent hover:border-red-900/30 rounded text-[9px] font-bold cursor-pointer transition-colors"
                                      title="Delete custom model from block package list"
                                    >
                                      🗑️
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PIXEL DRAWING BOARD SUBTAB */}
              {textureActiveSubTab === 'draw' && (
                <div className="flex-1 flex flex-col md:flex-row gap-5 min-h-0">
                  {/* Drawing Grid Section */}
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <span className="text-[9px] text-[#06b6d4] uppercase font-bold tracking-widest font-mono mb-2">
                      🎨 16x16 Pixel Drawing Board (Drag to Paint)
                    </span>
                    
                    {/* Retro Drawing Box container */}
                    <div 
                      className="aspect-square max-w-[280px] w-full p-2 bg-[#111214] rounded-xl border border-zinc-800 flex items-center justify-center cursor-crosshair relative shadow-inner overflow-hidden select-none"
                      onMouseLeave={() => setIsMousePainting(false)}
                      onMouseUp={() => setIsMousePainting(false)}
                    >
                      <div 
                        className="grid gap-[0.7px] bg-[#222428] w-full h-full aspect-square" 
                        style={{ gridTemplateColumns: 'repeat(16, 1fr)' }}
                      >
                        {drawGrid.map((rowArr, rIndex) => 
                          rowArr.map((cellClr, cIndex) => (
                            <div
                              key={`dw_cell_${rIndex}_${cIndex}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setIsMousePainting(true);
                                handleCellClick(rIndex, cIndex);
                              }}
                              onMouseEnter={(e) => {
                                if (isMousePainting) {
                                  e.preventDefault();
                                  handleCellPaint(rIndex, cIndex);
                                }
                              }}
                              className="aspect-square w-full select-none transition-colors border-[0.1px] border-[#393B3D]/10"
                              style={{ backgroundColor: cellClr }}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    {/* Paint tool state line indicators */}
                    <div className="text-[9px] text-zinc-400 mt-2 font-mono flex gap-3 text-center">
                      <span>Click to apply tool</span>
                      <span>•</span>
                      <span className="text-[#06b6d4]">Active color: {paintColor}</span>
                    </div>
                  </div>

                  {/* Panel parameters section */}
                  <div className="w-full md:w-64 space-y-4 shrink-0 flex flex-col h-full overflow-y-auto">
                    {/* Label setting input */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold block">Texture File Name</label>
                      <input
                        type="text"
                        value={drawingTextureName}
                        onChange={(e) => setDrawingTextureName(e.target.value)}
                        className="w-full bg-[#111214] border border-[#393B3D] focus:border-cyan-500 text-zinc-100 text-xs px-2.5 py-1.5 rounded outline-none font-mono font-bold"
                        placeholder="e.g. Grass Top Pixel"
                      />
                    </div>

                    {/* Tool choosing element */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold block">Active Painting Tool</label>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={() => { setDrawingTool('brush'); triggerBeep(400, 0.05); }}
                          className={`py-1.5 text-[11px] font-bold rounded border cursor-pointer transition-all ${
                            drawingTool === 'brush'
                              ? 'bg-cyan-900 border-cyan-400 text-white font-black'
                              : 'bg-[#111214] border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          🖌️ Brush
                        </button>
                        <button
                          onClick={() => { setDrawingTool('bucket'); triggerBeep(400, 0.05); }}
                          className={`py-1.5 text-[11px] font-bold rounded border cursor-pointer transition-all ${
                            drawingTool === 'bucket'
                              ? 'bg-cyan-900 border-cyan-400 text-white font-black'
                              : 'bg-[#111214] border-[#393B3D]/80 text-zinc-400 hover:text-white'
                          }`}
                        >
                          🪣 Fill
                        </button>
                        <button
                          onClick={() => { setDrawingTool('eraser'); triggerBeep(400, 0.05); }}
                          className={`py-1.5 text-[11px] font-bold rounded border cursor-pointer transition-all ${
                            drawingTool === 'eraser'
                              ? 'bg-cyan-900 border-cyan-400 text-white font-black'
                              : 'bg-[#111214] border-[#393B3D]/80 text-zinc-400 hover:text-white'
                          }`}
                        >
                          🧹 Eraser
                        </button>
                      </div>
                    </div>

                    {/* Preset starting point templates */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold block">Seed Template Grid</label>
                      <div className="grid grid-cols-2 gap-1">
                        {['grass', 'brick', 'lava', 'star'].map((type) => (
                          <button
                            key={`seed_${type}`}
                            onClick={() => {
                              triggerBeep(380, 0.1);
                              setDrawGrid(generatePresetGrid(type as any));
                            }}
                            className="p-1 px-1.5 text-[10px] text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded border border-zinc-700 text-left cursor-pointer font-bold truncate"
                          >
                            {type === 'grass' ? '🌿 Retro Grass' : type === 'brick' ? '🧱 Ruby Brick' : type === 'lava' ? '🌋 Solar Magma' : '⭐ Cyber Nebulae'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Solid Swatches palette */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold block">Palette Color Selectors</label>
                      <div className="grid grid-cols-5 gap-1.5 bg-[#111214] p-1.5 rounded border border-[#393B3D]">
                        {[
                          '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', 
                          '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#1e1b4b'
                        ].map((swatchClr) => (
                          <button
                            key={`sw_clr_${swatchClr}`}
                            onClick={() => { setPaintColor(swatchClr); triggerBeep(450, 0.05); }}
                            className={`w-full aspect-square rounded-full border cursor-pointer shadow-inner relative flex items-center justify-center transition-all ${
                              paintColor === swatchClr ? 'scale-110 border-white ring-2 ring-cyan-500/60' : 'border-[#393B3D]'
                            }`}
                            style={{ backgroundColor: swatchClr }}
                          >
                            {paintColor === swatchClr && (
                              <span className="text-[8px] font-black pointer-events-none select-none text-white drop-shadow">
                                ✓
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Buttons panel */}
                    <div className="pt-2 border-t border-zinc-800 flex gap-2">
                      <button
                        onClick={() => {
                          triggerBeep(300, 0.08);
                          setTextureActiveSubTab('hub');
                        }}
                        className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-colors text-center"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          triggerBeep(650, 0.18);
                          const exportedUrl = exportGridToDataURL(drawGrid);
                          
                          if (editingTextureId) {
                            // Update existing records
                            const nextList = customTextures.map(t => t.id === editingTextureId ? {
                              ...t,
                              name: drawingTextureName.trim() || 'My Painted Texture',
                              dataUrl: exportedUrl,
                              customGrid: drawGrid
                            } : t);
                            saveCustomTextures(nextList);
                          } else {
                            // Add new
                            const idStr = `us_${Date.now()}`;
                            const newTex: CustomTexture = {
                              id: idStr,
                              name: drawingTextureName.trim() || 'My Painted Texture',
                              dataUrl: exportedUrl,
                              type: 'drawn',
                              createdAt: new Date().toISOString(),
                              customGrid: drawGrid
                            };
                            const nextList = [...customTextures, newTex];
                            saveCustomTextures(nextList);
                            
                            // Direct apply to block if in scope
                            if (textureModeScope === 'block' && selectedPartId) {
                              updateProp('customTextureId', idStr);
                            }
                          }
                          setTextureActiveSubTab('hub');
                        }}
                        className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-wider rounded border border-cyan-400/30 cursor-pointer transition-colors text-center"
                      >
                        Save & Apply
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* IMPORT GALLERY SUBTAB */}
              {textureActiveSubTab === 'import' && (
                <div className="space-y-4 flex flex-col justify-between flex-1">
                  
                  <div className="space-y-4">
                    <span className="text-[9.5px] text-[#06b6d4] uppercase font-bold tracking-widest font-mono block">
                      📥 Choose Local Gallery Image File (.png, .jpg, .webp, .svg)
                    </span>

                    {/* Drag Block selection file trigger */}
                    <div className="flex flex-col items-center justify-center">
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="user_imported_file" 
                        onChange={handleTextureImportChange} 
                        className="hidden" 
                      />
                      <label 
                        htmlFor="user_imported_file"
                        className="w-full max-w-md aspect-video rounded-xl border border-dashed border-[#393B3D] hover:border-cyan-500 bg-[#111214] hover:bg-slate-950/40 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all space-y-2 group shadow-inner"
                      >
                        <span className="text-3xl group-hover:scale-110 transition-transform">📂</span>
                        <div className="text-[11px] font-extrabold text-zinc-300 uppercase tracking-wider">
                          Click to Browse Device Gallery
                        </div>
                        <p className="text-[10px] text-zinc-500 max-w-xs text-center">
                          Files are processed 100% locally in your web browser and saved to your workspace store.
                        </p>
                      </label>
                    </div>

                    {/* Name parameter setter */}
                    {importedDataUrl && (
                      <div className="space-y-3 max-w-md mx-auto p-4 bg-[#1e2022] rounded-lg border border-zinc-800 animate-fadeIn">
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0">
                            <img src={importedDataUrl} alt="imported" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Import Texture Name</label>
                            <input
                              type="text"
                              value={importedFileName}
                              onChange={(e) => setImportedFileName(e.target.value)}
                              className="w-full bg-[#111214] border border-[#393B3D] focus:border-cyan-500 text-zinc-100 text-xs px-2.5 py-1.5 rounded outline-none font-mono font-bold"
                              placeholder="e.g. Brick Wall"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions bar */}
                  <div className="pt-3 border-t border-zinc-800 flex gap-2.5 justify-end">
                    <button
                      onClick={() => {
                        triggerBeep(300, 0.08);
                        setTextureActiveSubTab('hub');
                      }}
                      className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!importedDataUrl}
                      onClick={() => {
                        if (!importedDataUrl) return;
                        triggerBeep(650, 0.18);
                        
                        const idStr = `us_${Date.now()}`;
                        const newTex: CustomTexture = {
                          id: idStr,
                          name: importedFileName.trim() || 'Imported Texture',
                          dataUrl: importedDataUrl,
                          type: 'imported',
                          createdAt: new Date().toISOString()
                        };
                        const nextList = [...customTextures, newTex];
                        saveCustomTextures(nextList);
                        
                        // Direct apply to block if in scope
                        if (textureModeScope === 'block' && selectedPartId) {
                          updateProp('customTextureId', idStr);
                        }
                        
                        setImportedDataUrl(null);
                        setTextureActiveSubTab('hub');
                      }}
                      className={`px-6 py-2 text-[10px] font-black uppercase tracking-wider rounded border cursor-pointer transition-colors ${
                        importedDataUrl
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400/30'
                          : 'bg-zinc-800 text-zinc-600 border-zinc-900 cursor-not-allowed'
                      }`}
                    >
                      Save & Implement
                    </button>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-[#111214] border-t border-[#393B3D] flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>● Storage Key: blox_custom_textures</span>
              <span>Available Textures: {customTextures.length}</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}


