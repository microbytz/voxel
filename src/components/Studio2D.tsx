import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, X, Plus, Move, Sparkles, RefreshCw, Volume2, Gamepad2, Hammer, Layers, Trash2, ArrowUp, ArrowDown, Check, Save } from 'lucide-react';

interface BlockDefinition {
  id: string;
  text: string;
  category: 'motion' | 'events' | 'control' | 'looks' | 'sound' | 'variables' | 'sensing' | 'operators';
  param?: string | number;
}

interface Sprite {
  id: string;
  name: string;
  emoji: string;
  x: number;
  y: number;
  color: string;
  customPixels?: string[][]; // 2D grid representation of drawn asset
}

function hslToHex(h: number, s: number, l: number): string {
  const normL = l / 100;
  const a = (s * Math.min(normL, 1 - normL)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = normL - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  const cleaned = hex.replace(/^#/, '');
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
  } else {
    return { h: 0, s: 100, l: 50 };
  }
  
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

interface Studio2DProps {
  onClose: () => void;
  onPublish?: (game: {
    id: string;
    title: string;
    thumbnail: string;
    upvoteRatio: number;
    activePlayers: number;
    creator: string;
    description: string;
    category: string;
    visits: number;
    createdAt: string;
    is2D: boolean;
  }) => void;
}

export default function Studio2D({ onClose, onPublish }: Studio2DProps) {
  // Preset list of available Scratch-like block blueprints
  const TOOLBOX_BLOCKS: BlockDefinition[] = [
    // Events
    { id: 'ev_flag', text: 'When 🟢 green flag clicked', category: 'events' },
    { id: 'ev_press', text: 'When SPACE pressed', category: 'events' },
    { id: 'ev_clicked', text: 'When this sprite clicked', category: 'events' },
    { id: 'ev_backdrop', text: 'When backdrop switches to [backdrop]', category: 'events', param: 'Stage1' },
    { id: 'ev_timer', text: 'When [timer] > [10]', category: 'events', param: 10 },
    { id: 'ev_message', text: 'When I receive [message]', category: 'events', param: 'start-broadcast' },
    { id: 'ev_broadcast', text: 'broadcast [message]', category: 'events', param: 'start-broadcast' },
    { id: 'ev_broadcast_and_wait', text: 'broadcast [message] and wait', category: 'events', param: 'start-broadcast' },
    
    // Motion
    { id: 'mo_move', text: 'Move [10] steps', category: 'motion', param: 10 },
    { id: 'mo_turn_right', text: 'Turn ↻ [15] degrees', category: 'motion', param: 15 },
    { id: 'mo_turn_left', text: 'Turn ↺ [15] degrees', category: 'motion', param: 15 },
    { id: 'mo_goto_target', text: 'Go to [random position]', category: 'motion', param: 'random position' },
    { id: 'mo_goto_xy', text: 'Go to x: [0] y: [0]', category: 'motion', param: '0, 0' },
    { id: 'mo_glide_target', text: 'Glide [1] secs to [random position]', category: 'motion', param: 1 },
    { id: 'mo_glide_xy', text: 'Glide [1] secs to x: [0] y: [0]', category: 'motion', param: '1, 10, 10' },
    { id: 'mo_point_dir', text: 'Point in direction [90]°', category: 'motion', param: 90 },
    { id: 'mo_point_towards', text: 'Point towards [mouse-pointer]', category: 'motion', param: 'mouse-pointer' },
    { id: 'mo_change_x', text: 'Change x by [10]', category: 'motion', param: 10 },
    { id: 'mo_change_y', text: 'Change y by [10]', category: 'motion', param: 10 },
    { id: 'mo_set_x', text: 'Set x to [0]', category: 'motion', param: 0 },
    { id: 'mo_set_y', text: 'Set y to [0]', category: 'motion', param: 0 },
    { id: 'mo_bounce', text: 'If on edge, bounce', category: 'motion' },
    { id: 'mo_rot_style', text: 'Set rotation style [all around]', category: 'motion', param: 'all around' },
    
    // Control
    { id: 'co_repeat_start', text: 'repeat [5] times', category: 'control', param: 5 },
    { id: 'co_end_repeat', text: 'end repeat', category: 'control' },
    { id: 'co_forever_start', text: 'repeat infinitely (forever)', category: 'control' },
    { id: 'co_end_forever', text: 'end forever', category: 'control' },
    { id: 'co_if_then_start', text: 'if <condition> then', category: 'control', param: 'timer > 5' },
    { id: 'co_if_else_start', text: 'if <condition> then / else', category: 'control', param: 'my variable > 10' },
    { id: 'co_else_sep', text: 'else', category: 'control' },
    { id: 'co_end_if', text: 'end if', category: 'control' },
    { id: 'co_repeat_until_start', text: 'repeat until <condition>', category: 'control', param: 'counter > 5' },
    { id: 'co_end_repeat_until', text: 'end repeat until', category: 'control' },
    { id: 'co_wait', text: 'Wait [1] seconds', category: 'control', param: 1 },
    { id: 'co_clone_start', text: 'When I start as a clone', category: 'control' },
    { id: 'co_clear_counter', text: 'clear counter', category: 'control' },
    { id: 'co_incr_counter', text: 'incr counter', category: 'control' },
    { id: 'co_reset_timer', text: 'reset timer', category: 'control' },
    { id: 'co_create_clone', text: 'create clone of [myself]', category: 'control', param: 'myself' },
    
    // Looks
    { id: 'lo_say_for', text: 'Say "Hello Pixel!" for [2] secs', category: 'looks', param: 'Hello Pixel!, 2' },
    { id: 'lo_say', text: 'Say "Hello Pixel!"', category: 'looks', param: 'Hello Pixel!' },
    { id: 'lo_think_for', text: 'Think "Hmm..." for [2] secs', category: 'looks', param: 'Hmm..., 2' },
    { id: 'lo_think', text: 'Think "Hmm..."', category: 'looks', param: 'Hmm...' },
    { id: 'lo_switch_costume', text: 'Switch costume to [Scratchy]', category: 'looks', param: '🐱' },
    { id: 'lo_next_costume', text: 'Next costume', category: 'looks' },
    { id: 'lo_switch_backdrop', text: 'Switch backdrop to [stage]', category: 'looks', param: 'Neon Sunset' },
    { id: 'lo_next_backdrop', text: 'Next backdrop', category: 'looks' },
    { id: 'lo_change_effect', text: 'Change [color] effect by [25]', category: 'looks', param: 'color, 25' },
    { id: 'lo_set_effect', text: 'Set [color] effect to [0]', category: 'looks', param: 'color, 0' },
    { id: 'lo_clear_effects', text: 'Clear graphic effects', category: 'looks' },
    { id: 'lo_change_size', text: 'Change size by [10]', category: 'looks', param: 10 },
    { id: 'lo_set_size', text: 'Set size to [100] %', category: 'looks', param: 100 },
    { id: 'lo_go_layer', text: 'Go to [front] layer', category: 'looks', param: 'front' },
    { id: 'lo_go_relative_layers', text: 'Go [forward] [1] layers', category: 'looks', param: 'forward, 1' },
    { id: 'lo_show', text: 'Show sprite', category: 'looks' },
    { id: 'lo_hide', text: 'Hide sprite', category: 'looks' },
    
    // Sound
    { id: 'so_play_until_done', text: 'Play sound "Pop" until done', category: 'sound', param: 'Pop' },
    { id: 'so_start_sound', text: 'Start sound "Laser"', category: 'sound', param: 'Laser' },
    { id: 'so_stop_all', text: 'Stop all sounds', category: 'sound' },
    { id: 'so_change_effect', text: 'Change [pitch] effect by [10]', category: 'sound', param: 'pitch, 10' },
    { id: 'so_set_effect', text: 'Set [pitch] effect to [100]', category: 'sound', param: 'pitch, 100' },
    { id: 'so_clear_effects', text: 'Clear sound effects', category: 'sound' },
    { id: 'so_change_volume', text: 'Change volume by [-10]', category: 'sound', param: -10 },
    { id: 'so_set_volume', text: 'Set volume to [100] %', category: 'sound', param: 100 },

    // Variables & Lists
    { id: 'va_set_var', text: 'set [variable] to ()', category: 'variables', param: 'my variable, 0' },
    { id: 'va_change_var', text: 'change [variable] by ()', category: 'variables', param: 'my variable, 1' },
    { id: 'va_show_var', text: 'show variable ()', category: 'variables', param: 'my variable' },
    { id: 'va_hide_var', text: 'hide variable ()', category: 'variables', param: 'my variable' },
    { id: 'va_add_to_list', text: 'add () to [list]', category: 'variables', param: 'apple, my list' },
    { id: 'va_delete_of_list', text: 'delete () of [list]', category: 'variables', param: '1, my list' },
    { id: 'va_delete_all_list', text: 'delete all of [list]', category: 'variables', param: 'my list' },
    { id: 'va_insert_at_list', text: 'insert () at () of [list]', category: 'variables', param: 'thing, 1, my list' },
    { id: 'va_replace_item_list', text: 'replace item () of [list] with ()', category: 'variables', param: '1, my list, thing' },
    { id: 'va_show_list', text: 'show list ()', category: 'variables', param: 'my list' },
    { id: 'va_hide_list', text: 'hide list ()', category: 'variables', param: 'my list' },
    { id: 'va_reporter_var', text: 'report value of [variable]', category: 'variables', param: 'my variable' },
    { id: 'va_item_list', text: 'item (1) of [list]', category: 'variables', param: '1, my list' },
    { id: 'va_item_index_list', text: 'item # of (apple) in [list]', category: 'variables', param: 'apple, my list' },
    { id: 'va_length_list', text: 'length of [list]', category: 'variables', param: 'my list' },

    // Sensing
    { id: 'se_x_pos', text: 'x position', category: 'sensing' },
    { id: 'se_y_pos', text: 'y position', category: 'sensing' },
    { id: 'se_direction', text: 'direction', category: 'sensing' },
    { id: 'se_costume', text: 'costume [name_or_number]', category: 'sensing', param: 'name' },
    { id: 'se_backdrop', text: 'backdrop [name_or_number]', category: 'sensing', param: 'name' },
    { id: 'se_size', text: 'size', category: 'sensing' },
    { id: 'se_volume', text: 'volume', category: 'sensing' },
    { id: 'se_touching_color', text: 'touching color [color]', category: 'sensing', param: '#ff0000' },
    { id: 'se_touching_target', text: 'touching [mouse-pointer-or-sprite]', category: 'sensing', param: 'mouse-pointer' },
    { id: 'se_distance', text: 'distance to [mouse-pointer-or-sprite]', category: 'sensing', param: 'mouse-pointer' },
    { id: 'se_ask_and_wait', text: 'ask [What is your name?] and wait', category: 'sensing', param: 'What is your name?' },
    { id: 'se_answer', text: 'answer', category: 'sensing' },
    { id: 'se_mouse_x', text: 'mouse x', category: 'sensing' },
    { id: 'se_mouse_y', text: 'mouse y', category: 'sensing' },
    { id: 'se_loudness', text: 'loudness', category: 'sensing' },
    { id: 'se_timer', text: 'timer', category: 'sensing' },
    { id: 'se_property_of', text: '[property] of [Stage_or_Sprite]', category: 'sensing', param: 'x position, Goblin' },
    { id: 'se_current_time', text: 'current [timeunit]', category: 'sensing', param: 'year' },
    { id: 'se_days_since_2000', text: 'days since 2000', category: 'sensing' },
    { id: 'se_username', text: 'username', category: 'sensing' },
    { id: 'se_color_touching_color', text: 'color (color1) is touching (color2)', category: 'sensing', param: '#ff0000, #00ff00' },
    { id: 'se_key_pressed', text: 'key [key] pressed?', category: 'sensing', param: 'space' },
    { id: 'se_mouse_down', text: 'mouse down?', category: 'sensing' },
    { id: 'se_list_contains', text: '[list] contains ()?', category: 'sensing', param: 'my list, apple' },
    { id: 'se_less_than', text: '() < ()', category: 'sensing', param: 'counter < 5' },
    { id: 'se_equal_to', text: '() = ()', category: 'sensing', param: 'counter = 5' },
    { id: 'se_greater_than', text: '() > ()', category: 'sensing', param: 'counter > 5' },
    { id: 'se_and_opt', text: '[] and []', category: 'sensing', param: 'timer > 5 and counter > 2' },
    { id: 'se_or_opt', text: '[] or []', category: 'sensing', param: 'timer > 5 or counter > 2' },
    { id: 'se_not_opt', text: 'not []', category: 'sensing', param: 'not timer > 5' },

    // Control - Stop/Clone Endpoints
    { id: 'co_stop_script', text: 'stop [all]', category: 'control', param: 'all' },
    { id: 'co_delete_clone', text: 'delete this clone', category: 'control' },

    // Operators
    { id: 'op_add', text: '() + ()', category: 'operators', param: '10 + 5' },
    { id: 'op_subtract', text: '() - ()', category: 'operators', param: '10 - 5' },
    { id: 'op_multiply', text: '() * ()', category: 'operators', param: '5 * 4' },
    { id: 'op_divide', text: '() / ()', category: 'operators', param: '10 / 2' },
    { id: 'op_random', text: 'pick random () to ()', category: 'operators', param: '1 to 10' },
    { id: 'op_join', text: 'join () ()', category: 'operators', param: 'apple, banana' },
    { id: 'op_letter_of', text: 'letter () of ()', category: 'operators', param: '1, apple' },
    { id: 'op_length_of', text: 'length of ()', category: 'operators', param: 'apple' },
    { id: 'op_mod', text: '() mod ()', category: 'operators', param: '10 mod 3' },
    { id: 'op_round', text: 'round ()', category: 'operators', param: '3.6' },
    { id: 'op_math_func', text: '[abs] of ()', category: 'operators', param: 'abs, -10' },
  ];

  // Independent block array registry per sprite (Keyed by sprite.id)
  const [spritesWorkspace, setSpritesWorkspace] = useState<{ [spriteId: string]: BlockDefinition[] }>({
    s1: [
      { id: 'wb_1', text: 'When 🟢 green flag clicked', category: 'events' },
      { id: 'wb_2', text: 'Move [10] steps', category: 'motion', param: 20 },
      { id: 'wb_3', text: 'Change color by [25]', category: 'looks', param: 40 },
      { id: 'wb_4', text: 'If on edge, bounce', category: 'motion' },
    ],
    s2: [
      { id: 'wb_2_1', text: 'When 🟢 green flag clicked', category: 'events' },
      { id: 'wb_2_2', text: 'Turn ↻ [15] degrees', category: 'motion', param: 30 },
      { id: 'wb_2_3', text: 'If on edge, bounce', category: 'motion' },
    ],
    s3: [
      { id: 'wb_3_1', text: 'When 🟢 green flag clicked', category: 'events' },
      { id: 'wb_3_2', text: 'Move [10] steps', category: 'motion', param: 15 },
      { id: 'wb_3_3', text: 'Start sound "Laser"', category: 'sound' },
    ]
  });

  // Active Tab for responsive layout on small touch screens
  const [activeTab2D, setActiveTab2D] = useState<'toolbox' | 'workspace' | 'stage'>('stage');

  // Sprite assets list
  const [sprites, setSprites] = useState<Sprite[]>([
    { id: 's1', name: 'Scratchy', emoji: '🐱', x: 20, y: 10, color: 'bg-orange-500' },
    { id: 's2', name: 'Goblin', emoji: '👾', x: -50, y: -40, color: 'bg-green-600' },
    { id: 's3', name: 'Hero Block', emoji: '🛡️', x: 80, y: 50, color: 'bg-cyan-500' },
  ]);
  const [activeSpriteId, setActiveSpriteId] = useState<string>('s1');

  // --- CUSTOM PIXEL ART SPRITE DRAWING CANVAS STATES ---
  const [isDrawingBoardOpen, setIsDrawingBoardOpen] = useState(false);
  const [drawingSpriteId, setDrawingSpriteId] = useState<string | null>(null); // editing a sprite vs creating new
  const [drawingResolution, setDrawingResolution] = useState<number>(16); // 16x16 or 24x24 or 32x32
  const [drawingPixels, setDrawingPixels] = useState<string[][]>(() => 
    Array(16).fill(null).map(() => Array(16).fill('transparent'))
  );
  const [drawingSpriteName, setDrawingSpriteName] = useState('My Custom Sprite');
  const [activeBrushColor, setActiveBrushColor] = useState('#ec4899'); // Pink magenta glow
  const [activeDrawingTool, setActiveDrawingTool] = useState<'Brush' | 'Eraser' | 'Bucket' | 'Marquee'>('Brush');
  const [drawingBrushSize, setDrawingBrushSize] = useState<number>(1); // 1x1, 2x2, or 3x3 brush size
  const [isPointerDrawing, setIsPointerDrawing] = useState(false);

  // Marquee rectangular lasso selection coords
  const [marqueeStart, setMarqueeStart] = useState<{ r: number; c: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ r: number; c: number } | null>(null);
  const [marqueeMovingState, setMarqueeMovingState] = useState<boolean>(false);

  // Undo / Redo stacks
  const [drawingUndoStack, setDrawingUndoStack] = useState<string[][][]>([]);
  const [drawingRedoStack, setDrawingRedoStack] = useState<string[][][]>([]);

  // Interactive color wheel dragging mechanism
  const [isDraggingWheel, setIsDraggingWheel] = useState(false);

  const startWheelDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    setIsDraggingWheel(true);
    updateColorFromCoords(e);
  };

  const moveWheelDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingWheel) return;
    updateColorFromCoords(e);
  };

  const endWheelDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingWheel(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const updateColorFromCoords = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    
    const maxRadius = rect.width / 2 - 2; // small inner offset margin
    const distance = Math.min(maxRadius, Math.sqrt(dx * dx + dy * dy));
    const s = Math.round((distance / maxRadius) * 100);
    const h = Math.round(angle);
    
    const hex = hslToHex(h, s, 50);
    setActiveBrushColor(hex);
  };

  // Push design history snapshot
  const saveDrawingHistory = (currentPixels: string[][]) => {
    const snapshot = currentPixels.map(row => [...row]);
    setDrawingUndoStack(prev => [...prev, snapshot].slice(-15));
    setDrawingRedoStack([]); // clean redo trace
  };

  const undoDrawing = () => {
    if (drawingUndoStack.length === 0) return;
    const prev = drawingUndoStack[drawingUndoStack.length - 1];
    setDrawingRedoStack(stack => [...stack, drawingPixels.map(row => [...row])]);
    setDrawingPixels(prev);
    setDrawingUndoStack(stack => stack.slice(0, stack.length - 1));
    playWebBeep(320, 0.08, 'sine');
  };

  const redoDrawing = () => {
    if (drawingRedoStack.length === 0) return;
    const next = drawingRedoStack[drawingRedoStack.length - 1];
    setDrawingUndoStack(stack => [...stack, drawingPixels.map(row => [...row])]);
    setDrawingPixels(next);
    setDrawingRedoStack(stack => stack.slice(0, stack.length - 1));
    playWebBeep(450, 0.08, 'sine');
  };

  const paintCellAt = (rIdx: number, cIdx: number, isStart: boolean) => {
    if (rIdx < 0 || rIdx >= drawingResolution || cIdx < 0 || cIdx >= drawingResolution) return;

    if (activeDrawingTool === 'Bucket') {
      if (!isStart) return;
      saveDrawingHistory(drawingPixels);
      const gridCopy = drawingPixels.map(row => [...row]);
      const originColor = gridCopy[rIdx][cIdx];
      if (originColor !== activeBrushColor) {
        const fillRoutine = (startR: number, startC: number, replaceColor: string, targetColor: string) => {
          const queueList: [number, number][] = [[startR, startC]];
          while (queueList.length > 0) {
            const [currR, currC] = queueList.shift()!;
            if (currR >= 0 && currR < drawingResolution && currC >= 0 && currC < drawingResolution && gridCopy[currR][currC] === targetColor) {
              gridCopy[currR][currC] = replaceColor;
              queueList.push([currR - 1, currC]);
              queueList.push([currR + 1, currC]);
              queueList.push([currR, currC - 1]);
              queueList.push([currR, currC + 1]);
            }
          }
        };
        fillRoutine(rIdx, cIdx, activeBrushColor, originColor);
        setDrawingPixels(gridCopy);
        playWebBeep(520, 0.05, 'sine');
      }
    } else if (activeDrawingTool === 'Marquee') {
      if (isStart) {
        setMarqueeStart({ r: rIdx, c: cIdx });
        setMarqueeEnd({ r: rIdx, c: cIdx });
      } else {
        setMarqueeEnd({ r: rIdx, c: cIdx });
      }
    } else {
      if (isStart) {
        saveDrawingHistory(drawingPixels);
      }
      const gridCopy = drawingPixels.map(row => [...row]);
      const size = drawingBrushSize;
      let gridChanged = false;
      for (let dr = 0; dr < size; dr++) {
        for (let dc = 0; dc < size; dc++) {
          const tr = rIdx + dr;
          const tc = cIdx + dc;
          if (tr >= 0 && tr < drawingResolution && tc >= 0 && tc < drawingResolution) {
            const targetColor = activeDrawingTool === 'Eraser' ? 'transparent' : activeBrushColor;
            if (gridCopy[tr][tc] !== targetColor) {
              gridCopy[tr][tc] = targetColor;
              gridChanged = true;
            }
          }
        }
      }
      if (gridChanged) {
        setDrawingPixels(gridCopy);
        if (isStart) {
          playWebBeep(650, 0.02, 'sine');
        }
      }
    }
  };

  // Load block lists mapped directly to the currently selected sprite!
  const workspaceBlocks = spritesWorkspace[activeSpriteId] || [];

  // Publishing Pipeline State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [pubTitle, setPubTitle] = useState('My 2D Brick Run');
  const [pubDesc, setPubDesc] = useState('An action-packed 2D arcade physics obby programmed fully with modular scratch-like logic blocks!');
  const [pubCategory, setPubCategory] = useState('Arcade');
  const [isPublished, setIsPublished] = useState(false);

  // Interactive Stage Simulator states
  const [isRunning, setIsRunning] = useState(false);
  const [messageBubble, setMessageBubble] = useState<string | null>(null);
  const [hueRotation, setHueRotation] = useState<number>(0);
  const [bounceCount, setBounceCount] = useState<number>(0);
  const [currentBackdrop, setCurrentBackdrop] = useState<string>('Sage Grid');
  const [backdropsPool] = useState<string[]>(['Sage Grid', 'Neon Sunset', 'Outer Space', 'Castle Room']);

  // Dynamic Variable and List States (Inspired by Scratch orange values & red arrays)
  const [variables, setVariables] = useState<{ [name: string]: number | string }>({ 'my variable': 0 });
  const [visibleVars, setVisibleVars] = useState<{ [name: string]: boolean }>({ 'my variable': true });
  const [scratchLists, setScratchLists] = useState<{ [name: string]: (string | number)[] }>({ 'my list': [] });
  const [visibleLists, setVisibleLists] = useState<{ [name: string]: boolean }>({ 'my list': true });
  const [testCounter, setTestCounter] = useState<number>(0);

  // Scratch Timer management (Drops down to 0 on reset timer)
  const timerStartTime = useRef<number>(Date.now());
  const [timerTick, setTimerTick] = useState<number>(0);

  // Scratch Sensing custom interactive parameters
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const mouseDownRef = useRef<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return;
      }
      keysPressedRef.current[e.key.toLowerCase()] = true;
      keysPressedRef.current['any'] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
      const stillPressed = Object.keys(keysPressedRef.current).some(k => k !== 'any' && keysPressedRef.current[k]);
      keysPressedRef.current['any'] = stillPressed;
    };

    const handleMouseDown = () => {
      mouseDownRef.current = true;
    };

    const handleMouseUp = () => {
      mouseDownRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const [activeAskSpriteId, setActiveAskSpriteId] = useState<string | null>(null);
  const [askQuestion, setAskQuestion] = useState<string | null>(null);
  const [askAnswerInput, setAskAnswerInput] = useState<string>('');
  const [scratchAnswer, setScratchAnswer] = useState<string>('World');
  const [loudness, setLoudness] = useState<number>(0);

  interface LoopStackFrame {
    type: 'repeat' | 'forever' | 'repeat_until';
    startIdx: number;
    endIdx: number;
    remainingCount?: number;
    conditionExpr?: string;
  }

  // Sequential execution pointer registry for sprites to compile blocks step-by-step
  const spriteExecutionState = useRef<{
    [spriteId: string]: {
      currentBlockIdx: number;
      waitTimer: number | null;
      nextBlockAt: number;
      loopStack?: LoopStackFrame[];
    };
  }>({});

  // References and simulation variables
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const physicsState = useRef<{
    [key: string]: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      rotation: number;
      size?: number;
      visible?: boolean;
      costume?: string;
      graphicEffects?: { [effect: string]: number };
      sayBubble?: { text: string; mode: 'say' | 'think'; expiresAt?: number };
      layerIndex?: number;
      volume?: number;
      soundEffects?: { [effect: string]: number };
    };
  }>({
    s1: { x: 0, y: 0, vx: 2, vy: 1.5, rotation: 0, size: 100, visible: true, costume: '🐱', graphicEffects: {}, volume: 100, layerIndex: 0 },
    s2: { x: -80, y: 50, vx: -1.5, vy: 2, rotation: 0, size: 100, visible: true, costume: '👾', graphicEffects: {}, volume: 100, layerIndex: 1 },
    s3: { x: 100, y: -60, vx: 1.5, vy: -1.2, rotation: 0, size: 100, visible: true, costume: '🛡️', graphicEffects: {}, volume: 100, layerIndex: 2 },
  });

  const activeSprite = sprites.find(s => s.id === activeSpriteId) || sprites[0];

  // HTML5 audio beep synthesizers for the scratch program outcomes
  const playWebBeep = (freq: number, dur: number, type: OscillatorType = 'sine') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  };

  // Add block from Toolbox to stacking Workspace list for EXACT active sprite index
  const handleAddBlock = (block: BlockDefinition) => {
    const newWorkspaceBlock: BlockDefinition = {
      ...block,
      id: `wb_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`
    };
    setSpritesWorkspace(prev => ({
      ...prev,
      [activeSpriteId]: [...(prev[activeSpriteId] || []), newWorkspaceBlock]
    }));
    playWebBeep(650, 0.08, 'triangle');
  };

  // Remove block from active Workspace stack
  const handleRemoveBlock = (id: string) => {
    setSpritesWorkspace(prev => ({
      ...prev,
      [activeSpriteId]: (prev[activeSpriteId] || []).filter(b => b.id !== id)
    }));
    playWebBeep(320, 0.12, 'sawtooth');
  };

  // Move visual blocks (Up / Down sequencing reordering)
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const blocks = [...workspaceBlocks];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const swapWith = direction === 'up' ? index - 1 : index + 1;
    const temp = blocks[index];
    blocks[index] = blocks[swapWith];
    blocks[swapWith] = temp;

    setSpritesWorkspace(prev => ({
      ...prev,
      [activeSpriteId]: blocks
    }));
    playWebBeep(450, 0.07, 'sine');
  };

  // Customize parameters dynamically
  const handleModifyParam = (id: string, val: string | number) => {
    setSpritesWorkspace(prev => ({
      ...prev,
      [activeSpriteId]: (prev[activeSpriteId] || []).map(b => b.id === id ? { ...b, param: val } : b)
    }));
  };

  // Clear visual programming stack
  const handleClearStack = () => {
    setSpritesWorkspace(prev => ({
      ...prev,
      [activeSpriteId]: []
    }));
    playWebBeep(205, 0.2, 'sawtooth');
  };

  // Trigger Broadcast dispatch to all active sprites
  const triggerBroadcast = (message: string) => {
    sprites.forEach(sprite => {
      const blocks = spritesWorkspace[sprite.id] || [];
      const index = blocks.findIndex(
        b => b.id.startsWith('ev_message') && String(b.param).trim().toLowerCase() === message.trim().toLowerCase()
      );
      if (index !== -1) {
        spriteExecutionState.current[sprite.id] = {
          currentBlockIdx: index + 1,
          waitTimer: null,
          nextBlockAt: Date.now(),
          loopStack: []
        };
      }
    });
    playWebBeep(450, 0.12, 'triangle');
  };

  // --- SENSING HELPERS ---
  const isTouchingColor = (hex: string, x: number, y: number): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    try {
      const canvasX = Math.round(x + canvas.width / 2);
      const canvasY = Math.round(-y + canvas.height / 2);
      if (canvasX < 0 || canvasX >= canvas.width || canvasY < 0 || canvasY >= canvas.height) {
        return false;
      }
      const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
      
      const cleanHex = hex.trim().replace(/^#/, '');
      const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
      const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
      const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
      
      const dist = Math.sqrt(
        Math.pow(pixel[0] - r, 2) +
        Math.pow(pixel[1] - g, 2) +
        Math.pow(pixel[2] - b, 2)
      );
      // matching threshold tolerance
      return dist < 85;
    } catch (e) {
      return false;
    }
  };

  const isTouchingTarget = (targetName: string, spriteId: string): boolean => {
    const stats = physicsState.current[spriteId];
    if (!stats) return false;
    
    if (targetName.toLowerCase() === 'edge') {
      const boundX = 240 - 16;
      const boundY = 150 - 16;
      return Math.abs(stats.x) >= boundX || Math.abs(stats.y) >= boundY;
    }

    if (targetName.toLowerCase() === 'mouse-pointer' || targetName.toLowerCase() === 'mouse-pointer-or-sprite') {
      const mouseX = mousePosRef.current.x;
      const mouseY = mousePosRef.current.y;
      const dx = stats.x - mouseX;
      const dy = stats.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) < 26;
    }
    
    const targetSprite = sprites.find(s => s.name.toLowerCase() === targetName.toLowerCase() || s.id.toLowerCase() === targetName.toLowerCase());
    if (targetSprite) {
      const targetStats = physicsState.current[targetSprite.id];
      if (targetStats) {
        const dx = stats.x - targetStats.x;
        const dy = stats.y - targetStats.y;
        return Math.sqrt(dx * dx + dy * dy) < 32;
      }
    }
    return false;
  };

  const isKeyPressed = (keyName: string): boolean => {
    const cleanKey = keyName.trim().toLowerCase();
    if (cleanKey === 'space') {
      return !!(keysPressedRef.current[' '] || keysPressedRef.current['space']);
    }
    return !!keysPressedRef.current[cleanKey];
  };

  const isColorTouchingColor = (c1: string, c2: string, spriteId: string): boolean => {
    const sprite = sprites.find(s => s.id === spriteId);
    if (!sprite) return false;
    const stats = physicsState.current[spriteId];
    if (!stats) return false;
    
    const cleanC = c1.trim().toLowerCase().replace(/^#/, '');
    const cleanSpriteColor = sprite.color.trim().toLowerCase().replace(/^#/, '');
    const colorsMatch = cleanC === cleanSpriteColor || cleanC === 'any';
    
    if (colorsMatch) {
      return isTouchingColor(c2, stats.x, stats.y);
    }
    return false;
  };

  const resolvePropertyOf = (prop: string, targetName: string): string | number => {
    const cleanProp = prop.trim().toLowerCase();
    const cleanTarget = targetName.trim().toLowerCase();
    
    if (cleanTarget === 'stage' || cleanTarget === 'stage_or_sprite') {
      if (cleanProp === 'backdrop' || cleanProp === 'backdrop name' || cleanProp === 'backdrop_name') {
        return currentBackdrop;
      }
      if (cleanProp === 'backdrop number' || cleanProp === 'backdrop_number' || cleanProp === 'backdrop index') {
        return backdropsPool.indexOf(currentBackdrop) + 1;
      }
      const matchingVarKey = Object.keys(variables).find(k => k.toLowerCase() === cleanProp);
      if (matchingVarKey) {
        return variables[matchingVarKey];
      }
      return '';
    }
    
    const targetSprite = sprites.find(s => s.name.toLowerCase() === cleanTarget || s.id.toLowerCase() === cleanTarget);
    if (targetSprite) {
      const stats = physicsState.current[targetSprite.id];
      if (stats) {
        if (cleanProp === 'x position' || cleanProp === 'x_pos' || cleanProp === 'x') {
          return Math.round(stats.x);
        }
        if (cleanProp === 'y position' || cleanProp === 'y_pos' || cleanProp === 'y') {
          return Math.round(stats.y);
        }
        if (cleanProp === 'direction' || cleanProp === 'angle') {
          let deg = Math.round(stats.rotation * (180 / Math.PI) + 90);
          deg = ((deg % 360) + 360) % 360;
          return deg;
        }
        if (cleanProp === 'costume' || cleanProp === 'costume name' || cleanProp === 'costume_name' || cleanProp === 'emoji') {
          return stats.costume || targetSprite.emoji;
        }
        if (cleanProp === 'costume number' || cleanProp === 'costume_number') {
          const costumes = ['🐱', '🐕', '🦊', '🦁', '🦖', '🦄', '🍎', '⭐', '🎈'];
          const idx = costumes.indexOf(stats.costume || targetSprite.emoji);
          return idx !== -1 ? idx + 1 : 1;
        }
        if (cleanProp === 'size') {
          return Math.round(stats.size || 100);
        }
        if (cleanProp === 'volume') {
          return Math.round(stats.volume || 100);
        }
      }
    }
    return '';
  };

  const resolveCurrentTime = (unit: string): string | number => {
    const d = new Date();
    const u = unit.trim().toLowerCase();
    if (u.includes('year')) return d.getFullYear();
    if (u.includes('month')) return d.getMonth() + 1;
    if (u.includes('date') || u.includes('day of month')) return d.getDate();
    if (u.includes('day of week') || u.includes('dayofweek')) return d.getDay() + 1;
    if (u.includes('hour')) return d.getHours();
    if (u.includes('minute')) return d.getMinutes();
    if (u.includes('second')) return d.getSeconds();
    return '';
  };

  const resolveDaysSince2000 = (): number => {
    const start = new Date(2000, 0, 1, 0, 0, 0, 0);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const msInDay = 1000 * 60 * 60 * 24;
    return Number((diffMs / msInDay).toFixed(5));
  };

  const resolveUsername = (): string => {
    const email = "pawan.aries.srivastava@gmail.com";
    if (email && email.includes('@')) {
      return email.split('@')[0];
    }
    return 'SuperCoder';
  };

  // Resolves an expression to a value (supports variables, lists, length, indices, timer, and sensing lookups)
  const resolveValueExpression = (valStr: string | number, spriteId: string = 's1'): string | number => {
    let text = String(valStr).trim();
    if (text === '') return '';

    // If it is just a number, return it
    if (!isNaN(Number(text))) return Number(text);

    const lower = text.toLowerCase();

    // --- Expression bracket unwrapping ---
    if ((text.startsWith('(') && text.endsWith(')')) || (text.startsWith('[') && text.endsWith(']'))) {
      const inner = text.substring(1, text.length - 1).trim();
      let balance = 0;
      let ok = true;
      for (let i = 0; i < inner.length; i++) {
        if (inner[i] === '(' || inner[i] === '[') balance++;
        if (inner[i] === ')' || inner[i] === ']') balance--;
        if (balance < 0) { ok = false; break; }
      }
      if (ok && balance === 0) {
        return resolveValueExpression(inner, spriteId);
      }
    }

    // --- Math Operators (+ - * /) ---
    // Use spaces around operators to prevent negative sign clashes
    const addParts = text.split(/\s+\+\s+/);
    if (addParts.length > 1) {
      const lhs = Number(resolveValueExpression(addParts[0], spriteId));
      const rhs = Number(resolveValueExpression(addParts.slice(1).join(' + '), spriteId));
      if (!isNaN(lhs) && !isNaN(rhs)) return lhs + rhs;
    }

    const subParts = text.split(/\s+-\s+/);
    if (subParts.length > 1) {
      const lhs = Number(resolveValueExpression(subParts[0], spriteId));
      const rhs = Number(resolveValueExpression(subParts.slice(1).join(' - '), spriteId));
      if (!isNaN(lhs) && !isNaN(rhs)) return lhs - rhs;
    }

    const mulParts = text.split(/\s+\*\s+/);
    if (mulParts.length > 1) {
      const lhs = Number(resolveValueExpression(mulParts[0], spriteId));
      const rhs = Number(resolveValueExpression(mulParts.slice(1).join(' * '), spriteId));
      if (!isNaN(lhs) && !isNaN(rhs)) return lhs * rhs;
    }

    const divParts = text.split(/\s+\/\s+/);
    if (divParts.length > 1) {
      const lhs = Number(resolveValueExpression(divParts[0], spriteId));
      const rhs = Number(resolveValueExpression(divParts.slice(1).join(' / '), spriteId));
      if (!isNaN(lhs) && !isNaN(rhs) && rhs !== 0) return lhs / rhs;
    }

    // --- Special Math Handlers (pick random, mod, round, log/trig) ---
    const pickRandomMatch = text.match(/pick\s+random\s+(.+?)\s+to\s+(.+)/i);
    if (pickRandomMatch) {
      const rawMin = pickRandomMatch[1].replace(/[\(\)\[\]]/g, '').trim();
      const rawMax = pickRandomMatch[2].replace(/[\(\)\[\]]/g, '').trim();
      const minVal = Number(resolveValueExpression(rawMin, spriteId));
      const maxVal = Number(resolveValueExpression(rawMax, spriteId));
      const min = isNaN(minVal) ? 1 : minVal;
      const max = isNaN(maxVal) ? 10 : maxVal;
      const isFloat = rawMin.includes('.') || rawMax.includes('.') || !Number.isInteger(min) || !Number.isInteger(max);
      if (isFloat) {
        return Math.random() * (max - min) + min;
      } else {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
    }

    const modMatch = text.match(/(.+?)\s+mod\s+(.+)/i);
    if (modMatch) {
      const lhsStr = modMatch[1].trim().replace(/^[\(\)\[\]]/g, '').replace(/[\(\)\[\]]$/g, '').trim();
      const rhsStr = modMatch[2].trim().replace(/^[\(\)\[\]]/g, '').replace(/[\(\)\[\]]$/g, '').trim();
      const lhs = Number(resolveValueExpression(lhsStr, spriteId));
      const rhs = Number(resolveValueExpression(rhsStr, spriteId));
      if (!isNaN(lhs) && !isNaN(rhs) && rhs !== 0) {
        return lhs % rhs;
      }
    }

    const roundMatch = text.match(/round\s+(.+)/i);
    if (roundMatch) {
      const inner = roundMatch[1].trim().replace(/^[\(\)\[\]]/g, '').replace(/[\(\)\[\]]$/g, '').trim();
      const val = Number(resolveValueExpression(inner, spriteId));
      if (!isNaN(val)) {
        return Math.round(val);
      }
    }

    const mathFuncMatch = text.match(/^(abs|floor|ceiling|ceil|sqrt|sin|cos|tan|asin|acos|atan|ln|log|e\^|10\^)\s+of\s+(.+)/i);
    if (mathFuncMatch) {
      const func = mathFuncMatch[1].toLowerCase();
      const inner = mathFuncMatch[2].trim().replace(/^[\(\)\[\]]/g, '').replace(/[\(\)\[\]]$/g, '').trim();
      const val = Number(resolveValueExpression(inner, spriteId));
      if (!isNaN(val)) {
        switch (func) {
          case 'abs': return Math.abs(val);
          case 'floor': return Math.floor(val);
          case 'ceiling':
          case 'ceil': return Math.ceil(val);
          case 'sqrt': return Math.sqrt(val);
          case 'sin': return Math.sin(val * Math.PI / 180);
          case 'cos': return Math.cos(val * Math.PI / 180);
          case 'tan': return Math.tan(val * Math.PI / 180);
          case 'asin': return Math.asin(val) * 180 / Math.PI;
          case 'acos': return Math.acos(val) * 180 / Math.PI;
          case 'atan': return Math.atan(val) * 180 / Math.PI;
          case 'ln': return Math.log(val);
          case 'log': return Math.log10 ? Math.log10(val) : Math.log(val) / Math.LN10;
          case 'e^': return Math.exp(val);
          case '10^': return Math.pow(10, val);
          default: return val;
        }
      }
    }

    // --- String Operators (join, letter of, length of) ---
    const joinMatch = text.match(/join\s+(.+?)\s+(.+)/i);
    if (joinMatch) {
      const arg1 = joinMatch[1].trim().replace(/^[\(\)\[\]"']/g, '').replace(/[\(\)\[\]"']$/g, '');
      const arg2 = joinMatch[2].trim().replace(/^[\(\)\[\]"']/g, '').replace(/[\(\)\[\]"']$/g, '');
      const res1 = resolveValueExpression(arg1, spriteId);
      const res2 = resolveValueExpression(arg2, spriteId);
      return String(res1) + String(res2);
    }

    const letterOfMatch = text.match(/letter\s+(.+?)\s+of\s+(.+)/i);
    if (letterOfMatch) {
      const idxStr = letterOfMatch[1].trim().replace(/^[\(\)\[\]]/g, '').replace(/[\(\)\[\]]$/g, '').trim();
      const stringArg = letterOfMatch[2].trim().replace(/^[\(\)\[\]]/g, '').replace(/[\(\)\[\]]$/g, '').trim();
      const resolvedIndex = parseInt(String(resolveValueExpression(idxStr, spriteId)), 10);
      const resolvedStr = String(resolveValueExpression(stringArg, spriteId));
      if (!isNaN(resolvedIndex) && resolvedIndex >= 1 && resolvedIndex <= resolvedStr.length) {
        return resolvedStr[resolvedIndex - 1];
      }
      return '';
    }

    // Resolve built-in placeholders
    if (lower === 'timer') {
      return Number(((Date.now() - timerStartTime.current) / 1000).toFixed(1));
    }
    if (lower === 'counter') {
      return testCounter;
    }
    if (lower === 'answer') {
      return scratchAnswer;
    }
    if (lower === 'mouse x' || lower === 'mouse_x') {
      return mousePosRef.current.x;
    }
    if (lower === 'mouse y' || lower === 'mouse_y') {
      return mousePosRef.current.y;
    }
    if (lower === 'loudness') {
      return loudness;
    }
    if (lower === 'days since 2000' || lower === 'days_since_2000') {
      return resolveDaysSince2000();
    }
    if (lower === 'username') {
      return resolveUsername();
    }
    if (lower === 'x position' || lower === 'x_position') {
      const stats = physicsState.current[spriteId];
      return stats ? Math.round(stats.x) : 0;
    }
    if (lower === 'y position' || lower === 'y_position') {
      const stats = physicsState.current[spriteId];
      return stats ? Math.round(stats.y) : 0;
    }
    if (lower === 'direction') {
      const stats = physicsState.current[spriteId];
      if (stats) {
        let deg = Math.round(stats.rotation * (180 / Math.PI) + 90);
        deg = ((deg % 360) + 360) % 360;
        return deg;
      }
      return 90;
    }
    if (lower === 'size') {
      const stats = physicsState.current[spriteId];
      return stats ? Math.round(stats.size) : 100;
    }
    if (lower === 'volume') {
      const stats = physicsState.current[spriteId];
      return stats ? Math.round(stats.volume) : 100;
    }
    if (lower === 'costume' || lower === 'costume name' || lower === 'costume_name') {
      const stats = physicsState.current[spriteId];
      if (stats) return stats.costume || '🐱';
      const originalSprite = sprites.find(s => s.id === spriteId);
      return originalSprite ? originalSprite.emoji : '🐱';
    }
    if (lower === 'costume number' || lower === 'costume_number') {
      const stats = physicsState.current[spriteId];
      const activeCostume = stats?.costume || sprites.find(s => s.id === spriteId)?.emoji || '🐱';
      const costumes = ['🐱', '👾', '🛡️', '🦄', '🐼', '🤖', '🦊', '🐸'];
      const idx = costumes.indexOf(activeCostume);
      return idx !== -1 ? idx + 1 : 1;
    }
    if (lower === 'backdrop' || lower === 'backdrop name' || lower === 'backdrop_name') {
      return currentBackdrop;
    }
    if (lower === 'backdrop number' || lower === 'backdrop_number') {
      return backdropsPool.indexOf(currentBackdrop) + 1;
    }

    // Check if it is a exact variable name match
    if (variables[text] !== undefined) {
      return variables[text];
    }

    // Pattern matching: touching color [hex] or touching [mouse-pointer/sprite]
    const touchingColorMatch = text.match(/touching\s+color\s+(.+)/i);
    if (touchingColorMatch) {
      const targetColor = touchingColorMatch[1].trim().replace(/^\[|\]$/g, '').trim();
      const stats = physicsState.current[spriteId];
      if (stats) {
        return isTouchingColor(targetColor, stats.x, stats.y) ? 'true' : 'false';
      }
      return 'false';
    }

    // Pattern matching: color (c1) is touching (c2)
    const colorIsTouchingMatch = text.match(/color\s+(.+?)\s+is\s+touching\s+(.+)/i);
    if (colorIsTouchingMatch) {
      const c1 = colorIsTouchingMatch[1].trim().replace(/^[\(\)\[\]]/g, '').replace(/[\(\)\[\]]$/g, '').trim();
      const c2 = colorIsTouchingMatch[2].trim().replace(/^[\(\)\[\]]/g, '').replace(/[\(\)\[\]]$/g, '').trim();
      return isColorTouchingColor(c1, c2, spriteId) ? 'true' : 'false';
    }

    const touchingMatch = text.match(/touching\s+(.+)/i);
    if (touchingMatch) {
      const target = touchingMatch[1].trim().replace(/^\[|\]$/g, '').trim();
      return isTouchingTarget(target, spriteId) ? 'true' : 'false';
    }

    // Pattern matching: key [space/any/a-z/0-9] pressed
    const keyPressedMatch = text.match(/key\s+(.+?)\s+pressed/i);
    if (keyPressedMatch) {
      const keyName = keyPressedMatch[1].trim().replace(/^[\(\)\[\]]/g, '').replace(/[\(\)\[\]]$/g, '').trim();
      return isKeyPressed(keyName) ? 'true' : 'false';
    }

    // Pattern matching: mouse down
    const mouseDownMatch = text.match(/mouse\s+down/i);
    if (mouseDownMatch) {
      return mouseDownRef.current ? 'true' : 'false';
    }

    // Pattern matching: [list] contains (item)
    const listContainsMatch = text.match(/(.+?)\s+contains\s+(.+)/i);
    if (listContainsMatch) {
      const listName = listContainsMatch[1].trim().replace(/^[\(\)\[\]]/g, '').replace(/[\(\)\[\]]$/g, '').trim();
      const itemVal = listContainsMatch[2].trim().replace(/^[\(\)\[\]]/g, '').replace(/[\(\)\[\]]$/g, '').trim();
      const resolvedList = scratchLists[listName];
      if (resolvedList) {
        const resolvedItem = resolveValueExpression(itemVal, spriteId);
        const exists = resolvedList.some(item => String(item).toLowerCase() === String(resolvedItem).toLowerCase());
        return exists ? 'true' : 'false';
      }
      return 'false';
    }

    // Pattern matching: distance to [target]
    const distMatch = text.match(/distance\s+to\s+(.+)/i);
    if (distMatch) {
      const target = distMatch[1].trim().replace(/^\[|\]$/g, '');
      const stats = physicsState.current[spriteId];
      if (stats) {
        if (target.toLowerCase() === 'mouse-pointer' || target.toLowerCase() === 'mouse-pointer-or-sprite') {
          const dx = stats.x - mousePosRef.current.x;
          const dy = stats.y - mousePosRef.current.y;
          return Math.round(Math.sqrt(dx * dx + dy * dy));
        }
        const targetSprite = sprites.find(s => s.name.toLowerCase() === target.toLowerCase() || s.id.toLowerCase() === target.toLowerCase());
        if (targetSprite) {
          const targetStats = physicsState.current[targetSprite.id];
          if (targetStats) {
            const dx = stats.x - targetStats.x;
            const dy = stats.y - targetStats.y;
            return Math.round(Math.sqrt(dx * dx + dy * dy));
          }
        }
      }
      return 0;
    }

    // Pattern matching: [property] of [Stage_or_Sprite]
    const ofMatch = text.match(/(.+?)\s+of\s+(.+)/i);
    if (ofMatch) {
      const prop = ofMatch[1].trim().replace(/^\[|\]$/g, '');
      const target = ofMatch[2].trim().replace(/^\[|\]$/g, '');
      if (target.toLowerCase() !== text.toLowerCase()) {
        return resolvePropertyOf(prop, target);
      }
    }

    // Pattern matching: current [year/month/date/etc]
    const currentMatch = text.match(/current\s+(.+)/i);
    if (currentMatch) {
      const unit = currentMatch[1].trim().replace(/^\[|\]$/g, '');
      return resolveCurrentTime(unit);
    }

    // Pattern matching: item (idx) of [list] or of (list)
    const itemOfMatch = text.match(/item\s+(.+?)\s+of\s+(.+)/i);
    if (itemOfMatch) {
      const idxStr = itemOfMatch[1].trim();
      const listName = itemOfMatch[2].trim().replace(/^\[|\]$/g, '');
      const resolvedList = scratchLists[listName] || [];
      const resolvedIndex = parseInt(String(resolveValueExpression(idxStr, spriteId)), 10);
      if (!isNaN(resolvedIndex) && resolvedIndex >= 1 && resolvedIndex <= resolvedList.length) {
        return resolvedList[resolvedIndex - 1];
      }
      return '';
    }

    // Pattern matching: item # of (val) in [list]
    const itemNumMatch = text.match(/item\s+#\s+of\s+(.+?)\s+in\s+(.+)/i);
    if (itemNumMatch) {
      const targetVal = itemNumMatch[1].trim().replace(/^\(|\)$/g, '');
      const listName = itemNumMatch[2].trim().replace(/^\[|\]$/g, '');
      const resolvedList = scratchLists[listName] || [];
      const resolvedTarget = String(resolveValueExpression(targetVal, spriteId)).toLowerCase();
      const idx = resolvedList.findIndex(item => String(item).toLowerCase() === resolvedTarget);
      return idx !== -1 ? idx + 1 : 0;
    }

    // Pattern matching: length of [list] or string
    const lenMatch = text.match(/length\s+of\s+(.+)/i);
    if (lenMatch) {
      const listOrStrName = lenMatch[1].trim().replace(/^[\(\)\[\]]/g, '').replace(/[\(\)\[\]]$/g, '').trim();
      if (scratchLists[listOrStrName]) {
        return scratchLists[listOrStrName].length;
      }
      const resolvedValue = String(resolveValueExpression(listOrStrName, spriteId));
      return resolvedValue.length;
    }

    return text;
  };

  // Evaluates boolean condition expressions like standard comparator operators
  const evaluateBooleanExpr = (exprStr: string, spriteId: string = 's1'): boolean => {
    let text = String(exprStr).trim();
    if (text === '') return false;

    // Outer wrapping brackets cleanup for nesting safety
    while (
      (text.startsWith('[') && text.endsWith(']')) ||
      (text.startsWith('(') && text.endsWith(')')) ||
      (text.startsWith('<') && text.endsWith('>'))
    ) {
      text = text.substring(1, text.length - 1).trim();
    }

    if (text === '') return false;

    // Logical operator: OR (lowest precedence)
    if (text.toLowerCase().includes(' or ')) {
      const parts = text.split(/\s+or\s+/i);
      return parts.some(part => evaluateBooleanExpr(part, spriteId));
    }

    // Logical operator: AND
    if (text.toLowerCase().includes(' and ')) {
      const parts = text.split(/\s+and\s+/i);
      return parts.every(part => evaluateBooleanExpr(part, spriteId));
    }

    // Logical operator: NOT
    const notMatch = text.match(/^not\s+(.+)/i);
    if (notMatch) {
      const inner = notMatch[1].trim();
      return !evaluateBooleanExpr(inner, spriteId);
    }

    // Check operator: greater than
    if (text.includes('>')) {
      const parts = text.split('>');
      const lhs = resolveValueExpression(parts[0], spriteId);
      const rhs = resolveValueExpression(parts[1], spriteId);
      if (!isNaN(Number(lhs)) && !isNaN(Number(rhs))) {
        return Number(lhs) > Number(rhs);
      }
      return String(lhs).trim().toLowerCase() > String(rhs).trim().toLowerCase();
    }

    // Check operator: less than
    if (text.includes('<')) {
      const parts = text.split('<');
      const lhs = resolveValueExpression(parts[0], spriteId);
      const rhs = resolveValueExpression(parts[1], spriteId);
      if (!isNaN(Number(lhs)) && !isNaN(Number(rhs))) {
        return Number(lhs) < Number(rhs);
      }
      return String(lhs).trim().toLowerCase() < String(rhs).trim().toLowerCase();
    }

    // Check operator: equal to
    if (text.includes('=')) {
      const parts = text.split('=');
      const lhs = resolveValueExpression(parts[0].replace(/=/g, ''), spriteId);
      const rhs = resolveValueExpression(parts[parts.length - 1], spriteId);
      if (!isNaN(Number(lhs)) && !isNaN(Number(rhs))) {
        return Number(lhs) === Number(rhs);
      }
      return String(lhs).trim().toLowerCase() === String(rhs).trim().toLowerCase();
    }

    // Generic fallback truthy check
    const resolved = resolveValueExpression(text, spriteId);
    return resolved === 'true' || Number(resolved) > 0;
  };

  const formatTextWithPlaceholders = (rawStr: string, spriteId: string = 's1'): string => {
    return rawStr.replace(/\{([^{}]+)\}/g, (_, expr) => {
      return String(resolveValueExpression(expr, spriteId));
    });
  };

  // Compiler instruction virtual executor (Parses block operations in sandbox)
  const executeSingleBlock = (spriteId: string, block: BlockDefinition) => {
    if (!block) return;

    // Control - Stop Script Executor
    if (block.id.includes('co_stop_script')) {
      const opt = String(block.param || 'all').trim();
      const state = spriteExecutionState.current[spriteId];
      if (opt === 'all') {
        handleStopAll();
      } else if (opt === 'this script') {
        if (state) {
          const blocksOfSprite = spritesWorkspace[spriteId] || [];
          state.currentBlockIdx = blocksOfSprite.length;
        }
      } else if (opt === 'other scripts in sprite') {
        const baseId = spriteId.replace('clone_', '');
        Object.keys(spriteExecutionState.current).forEach(id => {
          if (id !== spriteId && (id === baseId || id.startsWith('clone_' + baseId))) {
            delete spriteExecutionState.current[id];
          }
        });
      }
      playWebBeep(180, 0.05, 'sine');
    }

    // Control - Delete This Clone Executor
    if (block.id.includes('co_delete_clone')) {
      if (spriteId.startsWith('clone_')) {
        setSprites(prev => prev.filter(s => s.id !== spriteId));
        setSpritesWorkspace(prev => {
          const updated = { ...prev };
          delete updated[spriteId];
          return updated;
        });
        if (spriteExecutionState.current[spriteId]) {
          delete spriteExecutionState.current[spriteId];
        }
        playWebBeep(220, 0.1, 'sawtooth');
      }
    }

    // 1. Wait command
    if (block.id.startsWith('co_wait')) {
      const secs = parseFloat(String(block.param)) || 1;
      const state = spriteExecutionState.current[spriteId];
      if (state) {
        state.nextBlockAt = Date.now() + secs * 1000;
      }
    }

    // 2. Clear & Incr counter
    if (block.id.startsWith('co_clear_counter')) {
      setTestCounter(0);
      playWebBeep(520, 0.04, 'triangle');
    }
    if (block.id.startsWith('co_incr_counter')) {
      setTestCounter(prev => prev + 1);
      playWebBeep(640, 0.04, 'sine');
    }

    // 3. Reset built-in timer
    if (block.id.startsWith('co_reset_timer')) {
      timerStartTime.current = Date.now();
      playWebBeep(700, 0.05, 'sine');
    }

    // 4. Events Broadcasts
    if (block.id.startsWith('ev_broadcast') && !block.id.includes('wait')) {
      const msg = String(block.param || 'start-broadcast').trim();
      triggerBroadcast(msg);
    }
    if (block.id.startsWith('ev_broadcast_and_wait')) {
      const msg = String(block.param || 'start-broadcast').trim();
      triggerBroadcast(msg);
      // Wait: block sender for 1.2s to visually convey waiting
      const state = spriteExecutionState.current[spriteId];
      if (state) {
        state.nextBlockAt = Date.now() + 1200;
      }
    }

    // 5. Variables initialization and assignment
    if (block.id.startsWith('va_set_var')) {
      const val = String(block.param || 'my variable, 0');
      const firstComma = val.indexOf(',');
      const varName = firstComma !== -1 ? val.substring(0, firstComma).trim() : 'my variable';
      const numVal = firstComma !== -1 ? val.substring(firstComma + 1).trim() : '0';
      const parsedVal = isNaN(Number(numVal)) ? numVal : Number(numVal);
      setVariables(prev => ({ ...prev, [varName]: parsedVal }));
      // Auto-show variable on stage
      setVisibleVars(prev => ({ ...prev, [varName]: true }));
    }

    if (block.id.startsWith('va_change_var')) {
      const val = String(block.param || 'my variable, 1');
      const firstComma = val.indexOf(',');
      const varName = firstComma !== -1 ? val.substring(0, firstComma).trim() : 'my variable';
      const numVal = firstComma !== -1 ? val.substring(firstComma + 1).trim() : '1';
      const floatVal = parseFloat(numVal) || 0;
      setVariables(prev => {
        const oldVal = prev[varName] !== undefined ? prev[varName] : 0;
        const oldNum = typeof oldVal === 'number' ? oldVal : parseFloat(String(oldVal)) || 0;
        return { ...prev, [varName]: oldNum + floatVal };
      });
      setVisibleVars(prev => ({ ...prev, [varName]: true }));
    }

    if (block.id.startsWith('va_show_var')) {
      const varName = String(block.param || 'my variable').trim();
      setVisibleVars(prev => ({ ...prev, [varName]: true }));
    }

    if (block.id.startsWith('va_hide_var')) {
      const varName = String(block.param || 'my variable').trim();
      setVisibleVars(prev => ({ ...prev, [varName]: false }));
    }

    // 6. List Operators
    if (block.id.startsWith('va_add_to_list')) {
      const val = String(block.param || 'apple, my list');
      const firstComma = val.indexOf(',');
      const thing = firstComma !== -1 ? val.substring(0, firstComma).trim() : 'apple';
      const listName = firstComma !== -1 ? val.substring(firstComma + 1).trim() : 'my list';
      setScratchLists(prev => {
        const oldList = prev[listName] || [];
        return { ...prev, [listName]: [...oldList, thing] };
      });
      setVisibleLists(prev => ({ ...prev, [listName]: true }));
    }

    if (block.id.startsWith('va_delete_of_list')) {
      const val = String(block.param || '1, my list');
      const firstComma = val.indexOf(',');
      const idxStr = firstComma !== -1 ? val.substring(0, firstComma).trim() : '1';
      const listName = firstComma !== -1 ? val.substring(firstComma + 1).trim() : 'my list';
      const index = parseInt(idxStr, 10);
      setScratchLists(prev => {
        const oldList = [...(prev[listName] || [])];
        if (!isNaN(index) && index >= 1 && index <= oldList.length) {
          oldList.splice(index - 1, 1);
        }
        return { ...prev, [listName]: oldList };
      });
    }

    if (block.id.startsWith('va_delete_all_list')) {
      const listName = String(block.param || 'my list').trim();
      setScratchLists(prev => ({ ...prev, [listName]: [] }));
    }

    if (block.id.startsWith('va_insert_at_list')) {
      const val = String(block.param || 'thing, 1, my list');
      const parts = val.split(',').map(p => p.trim());
      const thing = parts[0] || 'thing';
      const pos = parseInt(parts[1], 10) || 1;
      const listName = parts[2] || 'my list';
      setScratchLists(prev => {
        const oldList = [...(prev[listName] || [])];
        const insertIdx = Math.max(0, Math.min(oldList.length, pos - 1));
        oldList.splice(insertIdx, 0, thing);
        return { ...prev, [listName]: oldList };
      });
      setVisibleLists(prev => ({ ...prev, [listName]: true }));
    }

    if (block.id.startsWith('va_replace_item_list')) {
      const val = String(block.param || '1, my list, thing');
      const parts = val.split(',').map(p => p.trim());
      const pos = parseInt(parts[0], 10) || 1;
      const listName = parts[1] || 'my list';
      const thing = parts[2] || 'thing';
      setScratchLists(prev => {
        const oldList = [...(prev[listName] || [])];
        if (pos >= 1 && pos <= oldList.length) {
          oldList[pos - 1] = thing;
        }
        return { ...prev, [listName]: oldList };
      });
    }

    if (block.id.startsWith('va_show_list')) {
      const listName = String(block.param || 'my list').trim();
      setVisibleLists(prev => ({ ...prev, [listName]: true }));
    }

    if (block.id.startsWith('va_hide_list')) {
      const listName = String(block.param || 'my list').trim();
      setVisibleLists(prev => ({ ...prev, [listName]: false }));
    }

    // 7. Cloning
    if (block.id.startsWith('co_create_clone')) {
      const targetName = String(block.param || 'myself').trim();
      const cloneSource = targetName === 'myself'
        ? sprites.find(s => s.id === spriteId)
        : sprites.find(s => s.name.toLowerCase() === targetName.toLowerCase() || s.id === targetName);
      
      if (cloneSource) {
        const nextId = `clone_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        const sourceStats = physicsState.current[cloneSource.id] || { x: 0, y: 0, vx: 1, vy: 1, rotation: 0, costume: cloneSource.emoji, visible: true, size: 100, graphicEffects: {}, volume: 100 };
        
        const newSprite: Sprite = {
          id: nextId,
          name: `${cloneSource.name} (Clone)`,
          emoji: sourceStats.costume || cloneSource.emoji,
          x: sourceStats.x + (Math.random() * 30 - 15),
          y: sourceStats.y + (Math.random() * 30 - 15),
          color: cloneSource.color,
        };

        // Copy parent workspace
        setSpritesWorkspace(prev => ({
          ...prev,
          [nextId]: prev[cloneSource.id] ? [...prev[cloneSource.id]] : []
        }));

        // Prep clones physics
        physicsState.current[nextId] = {
          x: newSprite.x,
          y: newSprite.y,
          vx: sourceStats.vx + (Math.random() * 1.0 - 0.5),
          vy: sourceStats.vy + (Math.random() * 1.0 - 0.5),
          rotation: sourceStats.rotation,
          costume: sourceStats.costume,
          visible: sourceStats.visible,
          size: sourceStats.size,
          graphicEffects: { ...(sourceStats.graphicEffects || {}) },
          volume: sourceStats.volume,
          layerIndex: (sourceStats.layerIndex || 0) + 1
        };

        setSprites(prev => [...prev, newSprite]);

        // Find "When I start as a clone" to trigger clone script
        const parentWorkspace = spritesWorkspace[cloneSource.id] || [];
        const cloneStartIdx = parentWorkspace.findIndex(b => b.id.startsWith('co_clone_start'));
        spriteExecutionState.current[nextId] = {
          currentBlockIdx: cloneStartIdx !== -1 ? cloneStartIdx + 1 : 0,
          waitTimer: null,
          nextBlockAt: Date.now(),
          loopStack: []
        };
        playWebBeep(780, 0.12, 'sine');
      }
    }

    // Ensure stats are prep'd
    if (!physicsState.current[spriteId]) {
      physicsState.current[spriteId] = {
        x: 0,
        y: 0,
        vx: 1,
        vy: 1,
        rotation: 0,
        costume: '🐱',
        visible: true,
        size: 100,
        graphicEffects: {},
        volume: 100,
        layerIndex: 0
      };
    }
    const stats = physicsState.current[spriteId];

    // ---- LOOKS COMMAND DEFINITIONS ----
    if (block.id.startsWith('lo_say_for')) {
      const val = String(block.param || 'Hello Pixel!, 2');
      const parts = val.split(',').map(p => p.trim());
      const rawMsg = parts[0] || 'Hello Pixel!';
      const secs = parseFloat(parts[1]) || 2;
      const formatted = formatTextWithPlaceholders(rawMsg);
      stats.sayBubble = { text: formatted, mode: 'say', expiresAt: Date.now() + secs * 1000 };
      
      const state = spriteExecutionState.current[spriteId];
      if (state) {
        state.nextBlockAt = Date.now() + secs * 1000;
      }
    } else if (block.id.startsWith('lo_say')) {
      const rawMsg = String(block.param !== undefined ? block.param : 'Hello Pixel!');
      const formatted = formatTextWithPlaceholders(rawMsg);
      stats.sayBubble = { text: formatted, mode: 'say' };
    } else if (block.id.startsWith('lo_think_for')) {
      const val = String(block.param || 'Hmm..., 2');
      const parts = val.split(',').map(p => p.trim());
      const rawMsg = parts[0] || 'Hmm...';
      const secs = parseFloat(parts[1]) || 2;
      const formatted = formatTextWithPlaceholders(rawMsg);
      stats.sayBubble = { text: formatted, mode: 'think', expiresAt: Date.now() + secs * 1000 };
      
      const state = spriteExecutionState.current[spriteId];
      if (state) {
        state.nextBlockAt = Date.now() + secs * 1000;
      }
    } else if (block.id.startsWith('lo_think')) {
      const rawMsg = String(block.param !== undefined ? block.param : 'Hmm...');
      const formatted = formatTextWithPlaceholders(rawMsg);
      stats.sayBubble = { text: formatted, mode: 'think' };
    }

    if (block.id.startsWith('lo_switch_costume')) {
      stats.costume = String(block.param || '🐱');
    }
    if (block.id.startsWith('lo_next_costume')) {
      const costumes = ['🐱', '🐕', '🦊', '🦁', '🦖', '🦄', '🍎', '⭐', '🎈'];
      const curIdx = costumes.indexOf(stats.costume || '🐱');
      stats.costume = costumes[(curIdx + 1) % costumes.length];
    }
    if (block.id.startsWith('lo_switch_backdrop')) {
      setCurrentBackdrop(String(block.param || 'Sage Grid'));
    }
    if (block.id.startsWith('lo_next_backdrop')) {
      const idx = backdropsPool.indexOf(currentBackdrop);
      setCurrentBackdrop(backdropsPool[(idx + 1) % backdropsPool.length]);
    }
    if (block.id.startsWith('lo_change_effect')) {
      const val = String(block.param || 'color, 25');
      const parts = val.split(',').map(p => p.trim());
      const effName = parts[0] || 'color';
      const effBy = parseFloat(parts[1]) || 25;
      if (!stats.graphicEffects) stats.graphicEffects = {};
      stats.graphicEffects[effName] = (stats.graphicEffects[effName] || 0) + effBy;
      if (effName === 'color') {
        setHueRotation(prev => (prev + effBy) % 360);
      }
    }
    if (block.id.startsWith('lo_set_effect')) {
      const val = String(block.param || 'color, 0');
      const parts = val.split(',').map(p => p.trim());
      const effName = parts[0] || 'color';
      const effTo = parseFloat(parts[1]) || 0;
      if (!stats.graphicEffects) stats.graphicEffects = {};
      stats.graphicEffects[effName] = effTo;
      if (effName === 'color') {
        setHueRotation(effTo % 360);
      }
    }
    if (block.id.startsWith('lo_clear_effects')) {
      stats.graphicEffects = {};
      setHueRotation(0);
      stats.sayBubble = undefined;
    }
    if (block.id.startsWith('lo_change_size')) {
      const amt = parseFloat(String(block.param || 10)) || 10;
      stats.size = Math.max(10, Math.min(400, (stats.size || 100) + amt));
    }
    if (block.id.startsWith('lo_set_size')) {
      const pct = parseFloat(String(block.param || 100)) || 100;
      stats.size = Math.max(10, Math.min(400, pct));
    }
    if (block.id.startsWith('lo_go_layer')) {
      // 'front' / 'back' layer
      const layerDir = String(block.param || 'front');
      stats.layerIndex = layerDir === 'front' ? 999 : -999;
    }
    if (block.id.startsWith('lo_go_relative_layers')) {
      const val = String(block.param || 'forward, 1');
      const parts = val.split(',').map(p => p.trim());
      const relDir = parts[0] || 'forward';
      const count = parseInt(parts[1], 10) || 1;
      stats.layerIndex = (stats.layerIndex || 0) + (relDir === 'forward' ? count : -count);
    }
    if (block.id.startsWith('lo_show')) {
      stats.visible = true;
    }
    if (block.id.startsWith('lo_hide')) {
      stats.visible = false;
    }

    // ---- SOUND COMMAND DEFINITIONS ----
    if (block.id.startsWith('so_play_until_done') || block.id.startsWith('so_start')) {
      // Try to beep!
      const isWait = block.id.startsWith('so_play_until_done');
      playWebBeep(580, 0.35, 'sawtooth');
      if (isWait) {
        const state = spriteExecutionState.current[spriteId];
        if (state) {
          state.nextBlockAt = Date.now() + 350; // pause for length of the beep
        }
      }
    }

    // ---- SENSING COMMANDS ----
    if (block.id.startsWith('se_ask_and_wait')) {
      const q = String(block.param !== undefined ? block.param : 'What is your name?');
      const resolvedQ = formatTextWithPlaceholders(q, spriteId);
      setAskQuestion(resolvedQ);
      setAskAnswerInput('');
      setActiveAskSpriteId(spriteId);
    }
  };

  // Triggers when Green Flag clicked
  const handleGreenFlag = () => {
    setIsRunning(true);
    timerStartTime.current = Date.now();
    playWebBeep(880, 0.15, 'sine');
    setTimeout(() => playWebBeep(1100, 0.25, 'sine'), 100);

    // Reset coordinates, velocities, and effects when starting the simulation
    sprites.forEach(sprite => {
      let startX = sprite.x;
      let startY = sprite.y;
      if (sprite.id === 's1') { startX = 20; startY = 10; }
      else if (sprite.id === 's2') { startX = -50; startY = -40; }
      else if (sprite.id === 's3') { startX = 80; startY = 50; }

      const blocks = spritesWorkspace[sprite.id] || [];
      const hasMotionBlocks = blocks.some(b => b.category === 'motion' || b.id.startsWith('mo_') || b.id.includes('move') || b.text.toLowerCase().includes('move'));

      let initVx = 0;
      let initVy = 0;
      if (hasMotionBlocks) {
        if (sprite.id === 's1') { initVx = 2; initVy = 1.5; }
        else if (sprite.id === 's2') { initVx = -1.5; initVy = 2; }
        else if (sprite.id === 's3') { initVx = 1.5; initVy = -1.2; }
        else { initVx = (Math.random() * 3) - 1.5; initVy = (Math.random() * 3) - 1.5; }
      }

      physicsState.current[sprite.id] = {
        x: startX,
        y: startY,
        vx: initVx,
        vy: initVy,
        rotation: 0,
        size: 100,
        visible: true,
        costume: sprite.emoji,
        graphicEffects: {},
        volume: 100,
        layerIndex: sprite.id === 's1' ? 0 : sprite.id === 's2' ? 1 : 2
      };

      const flagIdx = blocks.findIndex(b => b.id.startsWith('ev_flag'));
      spriteExecutionState.current[sprite.id] = {
        currentBlockIdx: flagIdx !== -1 ? flagIdx + 1 : 0,
        waitTimer: null,
        nextBlockAt: Date.now(),
        loopStack: []
      };
    });

    // Look for sound commands in stack to simulate audios
    workspaceBlocks.forEach(b => {
      if (b.category === 'sound') {
        if (b.id.includes('pop')) playWebBeep(600, 0.15, 'sine');
        else playWebBeep(400, 0.3, 'sawtooth');
      }
      if (b.id.startsWith('lo_say')) {
        setMessageBubble(String(b.param || "Hello Pixel!"));
      }
    });

    // Color triggers
    const colorBlock = workspaceBlocks.find(b => b.category === 'looks' && b.id.includes('color'));
    if (colorBlock) {
      setHueRotation(prev => (prev + Number(colorBlock.param || 25)) % 360);
    }
  };

  // Triggers when Red Octagon stop clicked
  const handleStopAll = () => {
    setIsRunning(false);
    setMessageBubble(null);
    playWebBeep(150, 0.3, 'sine');

    // Fully reset sprite coordinates, effects, and speech bubbles to design state
    sprites.forEach(sprite => {
      let startX = sprite.x;
      let startY = sprite.y;
      if (sprite.id === 's1') { startX = 20; startY = 10; }
      else if (sprite.id === 's2') { startX = -50; startY = -40; }
      else if (sprite.id === 's3') { startX = 80; startY = 50; }

      const blocks = spritesWorkspace[sprite.id] || [];
      const hasMotionBlocks = blocks.some(b => b.category === 'motion' || b.id.startsWith('mo_') || b.id.includes('move') || b.text.toLowerCase().includes('move'));

      let initVx = 0;
      let initVy = 0;
      if (hasMotionBlocks) {
        if (sprite.id === 's1') { initVx = 2; initVy = 1.5; }
        else if (sprite.id === 's2') { initVx = -1.5; initVy = 2; }
        else if (sprite.id === 's3') { initVx = 1.5; initVy = -1.2; }
        else { initVx = (Math.random() * 3) - 1.5; initVy = (Math.random() * 3) - 1.5; }
      }

      physicsState.current[sprite.id] = {
        x: startX,
        y: startY,
        vx: initVx,
        vy: initVy,
        rotation: 0,
        size: 100,
        visible: true,
        costume: sprite.emoji,
        graphicEffects: {},
        volume: 100,
        layerIndex: sprite.id === 's1' ? 0 : sprite.id === 's2' ? 1 : 2
      };

      spriteExecutionState.current[sprite.id] = {
        currentBlockIdx: 0,
        waitTimer: null,
        nextBlockAt: Date.now()
      };
    });

    setHueRotation(0);
    setBounceCount(0);
  };

  const advanceExecution = (spriteId: string, blocks: BlockDefinition[]) => {
    let state = spriteExecutionState.current[spriteId];
    if (!state) {
      state = { currentBlockIdx: 0, waitTimer: null, nextBlockAt: Date.now(), loopStack: [] };
      spriteExecutionState.current[spriteId] = state;
    }
    if (!state.loopStack) {
      state.loopStack = [];
    }

    // Check wait timer
    if (state.nextBlockAt > Date.now()) {
      return;
    }

    // Check if waiting for user input answer response of ask and wait command
    if (activeAskSpriteId) {
      return;
    }

    if (state.currentBlockIdx >= blocks.length) {
      state.currentBlockIdx = 0;
      state.loopStack = [];
      return;
    }

    const block = blocks[state.currentBlockIdx];
    if (!block) return;

    // Helper to find matching end block
    const findEnd = (startIdx: number, startPrefix: string, endPrefix: string) => {
      let level = 1;
      for (let i = startIdx + 1; i < blocks.length; i++) {
        if (blocks[i].id.startsWith(startPrefix)) {
          level++;
        } else if (blocks[i].id.startsWith(endPrefix)) {
          level--;
          if (level === 0) return i;
        }
      }
      return -1;
    };

    const findIfElseBlocks = (startIdx: number) => {
      let level = 1;
      let elseIdx = -1;
      let endIfIdx = -1;
      for (let i = startIdx + 1; i < blocks.length; i++) {
        const id = blocks[i].id;
        if (id.startsWith('co_if_then_start') || id.startsWith('co_if_else_start')) {
          level++;
        } else if (id.startsWith('co_end_if')) {
          level--;
          if (level === 0) {
            endIfIdx = i;
            break;
          }
        } else if (id.startsWith('co_else_sep') && level === 1) {
          elseIdx = i;
        }
      }
      return { elseIdx, endIfIdx };
    };

    // --- 1. Loop and Conditional Executors ---
    if (block.id.startsWith('co_repeat_start')) {
      const endIdx = findEnd(state.currentBlockIdx, 'co_repeat_start', 'co_end_repeat');
      if (endIdx === -1) {
        state.currentBlockIdx += 1;
        return;
      }
      const existingFrameIdx = state.loopStack.findIndex(f => f.startIdx === state.currentBlockIdx);
      if (existingFrameIdx === -1) {
        const countRaw = block.param !== undefined ? block.param : '5';
        const resolvedCount = parseInt(String(resolveValueExpression(String(countRaw))), 10) || 0;
        if (resolvedCount <= 0) {
          state.currentBlockIdx = endIdx + 1;
        } else {
          state.loopStack.push({
            type: 'repeat',
            startIdx: state.currentBlockIdx,
            endIdx,
            remainingCount: resolvedCount
          });
          state.currentBlockIdx += 1;
        }
      } else {
        const frame = state.loopStack[existingFrameIdx];
        if (frame.remainingCount !== undefined && frame.remainingCount > 1) {
          frame.remainingCount -= 1;
          state.currentBlockIdx += 1;
        } else {
          state.loopStack.splice(existingFrameIdx, 1);
          state.currentBlockIdx = endIdx + 1;
        }
      }
      return;
    }

    if (block.id.startsWith('co_end_repeat')) {
      const frame = state.loopStack.find(f => f.endIdx === state.currentBlockIdx);
      if (frame !== undefined) {
        state.currentBlockIdx = frame.startIdx;
      } else {
        state.currentBlockIdx += 1;
      }
      return;
    }

    if (block.id.startsWith('co_forever_start')) {
      const endIdx = findEnd(state.currentBlockIdx, 'co_forever_start', 'co_end_forever');
      if (endIdx === -1) {
        state.currentBlockIdx += 1;
        return;
      }
      const existingFrameIdx = state.loopStack.findIndex(f => f.startIdx === state.currentBlockIdx);
      if (existingFrameIdx === -1) {
        state.loopStack.push({
          type: 'forever',
          startIdx: state.currentBlockIdx,
          endIdx
        });
      }
      state.currentBlockIdx += 1;
      return;
    }

    if (block.id.startsWith('co_end_forever')) {
      const frame = state.loopStack.find(f => f.endIdx === state.currentBlockIdx);
      if (frame !== undefined) {
        state.currentBlockIdx = frame.startIdx;
      } else {
        state.currentBlockIdx += 1;
      }
      return;
    }

    if (block.id.startsWith('co_repeat_until_start')) {
      const endIdx = findEnd(state.currentBlockIdx, 'co_repeat_until_start', 'co_end_repeat_until');
      if (endIdx === -1) {
        state.currentBlockIdx += 1;
        return;
      }
      const isTrue = evaluateBooleanExpr(String(block.param || ''), spriteId);
      if (isTrue) {
        const existingFrameIdx = state.loopStack.findIndex(f => f.startIdx === state.currentBlockIdx);
        if (existingFrameIdx !== -1) {
          state.loopStack.splice(existingFrameIdx, 1);
        }
        state.currentBlockIdx = endIdx + 1;
      } else {
        const existingFrameIdx = state.loopStack.findIndex(f => f.startIdx === state.currentBlockIdx);
        if (existingFrameIdx === -1) {
          state.loopStack.push({
            type: 'repeat_until',
            startIdx: state.currentBlockIdx,
            endIdx,
            conditionExpr: String(block.param || '')
          });
        }
        state.currentBlockIdx += 1;
      }
      return;
    }

    if (block.id.startsWith('co_end_repeat_until')) {
      const frame = state.loopStack.find(f => f.endIdx === state.currentBlockIdx);
      if (frame !== undefined) {
        state.currentBlockIdx = frame.startIdx;
      } else {
        state.currentBlockIdx += 1;
      }
      return;
    }

    if (block.id.startsWith('co_if_then_start')) {
      const endIdx = findEnd(state.currentBlockIdx, 'co_if_then_start', 'co_end_if');
      if (endIdx === -1) {
        state.currentBlockIdx += 1;
        return;
      }
      const isTrue = evaluateBooleanExpr(String(block.param || ''), spriteId);
      if (isTrue) {
        state.currentBlockIdx += 1;
      } else {
        state.currentBlockIdx = endIdx + 1;
      }
      return;
    }

    if (block.id.startsWith('co_if_else_start')) {
      const { elseIdx, endIfIdx } = findIfElseBlocks(state.currentBlockIdx);
      if (endIfIdx === -1) {
        state.currentBlockIdx += 1;
        return;
      }
      const isTrue = evaluateBooleanExpr(String(block.param || ''), spriteId);
      if (isTrue) {
        state.currentBlockIdx += 1;
      } else {
        if (elseIdx !== -1) {
          state.currentBlockIdx = elseIdx + 1;
        } else {
          state.currentBlockIdx = endIfIdx + 1;
        }
      }
      return;
    }

    if (block.id.startsWith('co_else_sep')) {
      let level = 1;
      let endIfIdx = -1;
      for (let i = state.currentBlockIdx + 1; i < blocks.length; i++) {
        const id = blocks[i].id;
        if (id.startsWith('co_if_then_start') || id.startsWith('co_if_else_start')) {
          level++;
        } else if (id.startsWith('co_end_if')) {
          level--;
          if (level === 0) {
            endIfIdx = i;
            break;
          }
        }
      }
      if (endIfIdx !== -1) {
        state.currentBlockIdx = endIfIdx + 1;
      } else {
        state.currentBlockIdx += 1;
      }
      return;
    }

    if (block.id.startsWith('co_end_if')) {
      state.currentBlockIdx += 1;
      return;
    }

    // --- 2. Action Statements (Default fallthrough execution) ---
    executeSingleBlock(spriteId, block);
    state.currentBlockIdx += 1;
  };

  // Real-time micro and loudness simulator logic
  useEffect(() => {
    let animationId: number;
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let localAnalyser: AnalyserNode | null = null;

    const startAudio = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          localAnalyser = analyser;
        }
      } catch (e) {
        // Safe sandbox fallback: no crash, will simulate a natural breathing wave sound hum
      }
    };

    startAudio();

    const loop = () => {
      if (localAnalyser) {
        const arr = new Uint8Array(localAnalyser.frequencyBinCount);
        localAnalyser.getByteFrequencyData(arr);
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
          sum += arr[i];
        }
        const avg = sum / arr.length;
        setLoudness(Math.round(Math.min(100, (avg / 255) * 150)));
      } else {
        // Mock active amplitude variations around 12 to 36 so variables change dynamically on screen
        const mockAmt = Math.round(18 + Math.sin(Date.now() / 150) * 10 + Math.random() * 5);
        setLoudness(mockAmt);
      }
      animationId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animationId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, []);

  // React sequence evaluator tick loop running every 800ms while simulation is active
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      sprites.forEach(sprite => {
        const blocks = spritesWorkspace[sprite.id] || [];
        if (blocks.length === 0) return;

        advanceExecution(sprite.id, blocks);
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isRunning, sprites, spritesWorkspace]);

  // Track workspace changes in real-time to adjust or restart execution index to avoid executing stale deleted indices
  useEffect(() => {
    sprites.forEach(sprite => {
      const blocks = spritesWorkspace[sprite.id] || [];
      const state = spriteExecutionState.current[sprite.id];
      const stats = physicsState.current[sprite.id];

      // Reset execution index to safe bounds inside the new blocks array if index exceeds bounds
      if (state) {
        if (state.currentBlockIdx >= blocks.length) {
          const flagIdx = blocks.findIndex(b => b.id.startsWith('ev_flag'));
          state.currentBlockIdx = flagIdx !== -1 ? flagIdx + 1 : 0;
          state.waitTimer = null;
          state.nextBlockAt = Date.now();
          state.loopStack = [];
        }
      }

      // If motion blocks were completely removed, reset velocities to 0 so it stops immediately
      if (stats) {
        const hasMotionBlocks = blocks.some(b => b.category === 'motion' || b.id.startsWith('mo_') || b.id.includes('move') || b.text.toLowerCase().includes('move'));
        if (!hasMotionBlocks) {
          stats.vx = 0;
          stats.vy = 0;
          stats.rotation = 0;
        } else if (stats.vx === 0 && stats.vy === 0 && isRunning) {
          // Re-initialize velocities if motion blocks were added while running
          if (sprite.id === 's1') { stats.vx = 2; stats.vy = 1.5; }
          else if (sprite.id === 's2') { stats.vx = -1.5; stats.vy = 2; }
          else if (sprite.id === 's3') { stats.vx = 1.5; stats.vy = -1.2; }
          else { stats.vx = 1; stats.vy = 1; }
        }

        // Check if looks / graphic effects are still programmed, clean up if not
        const hasGraphicEffects = blocks.some(b => b.category === 'looks' && (b.id.includes('effect') || b.id.includes('size') || b.id.includes('hide') || b.id.includes('show')));
        if (!hasGraphicEffects) {
          stats.graphicEffects = {};
          stats.size = 100;
          stats.visible = true;
          setHueRotation(0);
        }

        // Check if say bubbles should be cleared if say blocks are deleted
        const hasSayBlocks = blocks.some(b => b.id.startsWith('lo_say') || b.id.startsWith('lo_think') || b.text.toLowerCase().includes('say') || b.text.toLowerCase().includes('think'));
        if (!hasSayBlocks) {
          stats.sayBubble = undefined;
        }
      }
    });
  }, [spritesWorkspace, sprites, isRunning]);

  // Periodic React timer render forced update tick to reflect Scratch timing overlay digits
  useEffect(() => {
    if (!isRunning) return;
    const updateTicker = setInterval(() => {
      setTimerTick(prev => prev + 1);
    }, 100);
    return () => clearInterval(updateTicker);
  }, [isRunning]);

  // Create canvas sprite animation render loops
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseMoveOnCanvas = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      // Convert to Scratch coords center Stage: width 480, height 300
      const x = Math.round((clientX / rect.width) * 480 - 240);
      const y = Math.round(-((clientY / rect.height) * 300 - 150));
      mousePosRef.current = { x, y };
    };
    canvas.addEventListener('mousemove', handleMouseMoveOnCanvas);

    // Fixed Stage bounds equivalent to standard scratch resolutions
    canvas.width = 480;
    canvas.height = 300;

    const render = () => {
      // 1. Render custom backdrops based on currentBackdrop
      if (currentBackdrop === 'Neon Sunset') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#31103f');
        grad.addColorStop(0.5, '#701a75');
        grad.addColorStop(1, '#be123c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.25)';
        ctx.lineWidth = 1;
        // Perspective grids
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, canvas.height / 3);
          ctx.lineTo(x * 1.5 - canvas.width * 0.25, canvas.height);
          ctx.stroke();
        }
        for (let y = canvas.height / 3; y < canvas.height; y += 15) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      } else if (currentBackdrop === 'Outer Space') {
        ctx.fillStyle = '#020205';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 25; i++) {
          const sx = (Math.abs(Math.sin(i * 47)) * canvas.width) % canvas.width;
          const sy = (Math.abs(Math.cos(i * 13)) * canvas.height) % canvas.height;
          const size = Math.abs(Math.sin(i * 9)) * 1.5 + 0.5;
          ctx.fillRect(sx, sy, size, size);
        }
        const grad = ctx.createRadialGradient(canvas.width * 0.8, canvas.height * 0.2, 5, canvas.width * 0.8, canvas.height * 0.2, 80);
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(canvas.width * 0.8, canvas.height * 0.2, 80, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentBackdrop === 'Castle Room') {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#292524';
        for (let y = 0; y < canvas.height; y += 20) {
          const shift = (y % 40 === 0) ? 15 : 0;
          for (let x = -15; x < canvas.width + 15; x += 30) {
            ctx.fillRect(x + shift, y, 28, 18);
          }
        }
      } else {
        // default Sage Grid
        ctx.fillStyle = '#0b0c10';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Bold lines for center Stage Cartesian 0,0
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Render grid labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '8px monospace';
      ctx.fillText('x: 240', canvas.width - 32, canvas.height / 2 - 4);
      ctx.fillText('x: -240', 4, canvas.height / 2 - 4);
      ctx.fillText('y: 150', canvas.width / 2 + 4, 12);
      ctx.fillText('y: -150', canvas.width / 2 + 4, canvas.height - 4);

      // 3. Move and update active coordinates if running, sorted by layers
      const sortedSprites = [...sprites].sort((a, b) => {
        const aLayer = (physicsState.current[a.id]?.layerIndex !== undefined) ? physicsState.current[a.id].layerIndex! : 0;
        const bLayer = (physicsState.current[b.id]?.layerIndex !== undefined) ? physicsState.current[b.id].layerIndex! : 0;
        return aLayer - bLayer;
      });

      sortedSprites.forEach(sprite => {
        const stats = physicsState.current[sprite.id] || { x: 0, y: 0, vx: 1.5, vy: 1.2, rotation: 0, size: 100, visible: true, costume: sprite.emoji, graphicEffects: {}, volume: 100 };
        const spriteBlocks = spritesWorkspace[sprite.id] || [];
        
        // If this sprite has no blocks, ensure it doesn't drift
        if (spriteBlocks.length === 0) {
          stats.vx = 0;
          stats.vy = 0;
        }

        if (isRunning) {
          // Defaults
          let speedFactor = 1.0;
          let movedByBlock = false;

          // 1. Move [10] steps block
          const moveBlock = spriteBlocks.find(b => b.id.includes('mo_move') || b.text.includes('Move'));
          if (moveBlock) {
            movedByBlock = true;
            const steps = Number(moveBlock.param !== undefined ? moveBlock.param : 10);
            stats.x += Math.cos(stats.rotation) * (steps * 0.2);
            stats.y += Math.sin(stats.rotation) * (steps * 0.2);
          }

          // 2. Turn ↻ [15] degrees (clockwise / right)
          const turnRight = spriteBlocks.find(b => b.id.startsWith('mo_turn_right'));
          if (turnRight) {
            const deg = Number(turnRight.param !== undefined ? turnRight.param : 15);
            stats.rotation += (deg * (Math.PI / 180)) * 0.05;
          }

          // 3. Turn ↺ [15] degrees (counterclockwise / left)
          const turnLeft = spriteBlocks.find(b => b.id.startsWith('mo_turn_left'));
          if (turnLeft) {
            const deg = Number(turnLeft.param !== undefined ? turnLeft.param : 15);
            stats.rotation -= (deg * (Math.PI / 180)) * 0.05;
          }

          // 4. Change X/Y blocks
          const changeX = spriteBlocks.find(b => b.id.startsWith('mo_change_x'));
          if (changeX) {
            movedByBlock = true;
            stats.x += Number(changeX.param !== undefined ? changeX.param : 10) * 0.1;
          }
          const changeY = spriteBlocks.find(b => b.id.startsWith('mo_change_y'));
          if (changeY) {
            movedByBlock = true;
            stats.y += Number(changeY.param !== undefined ? changeY.param : 10) * 0.1;
          }

          // 5. Set X/Y blocks
          const setX = spriteBlocks.find(b => b.id.startsWith('mo_set_x'));
          if (setX) {
            movedByBlock = true;
            stats.x = Number(setX.param !== undefined ? setX.param : 0);
          }
          const setY = spriteBlocks.find(b => b.id.startsWith('mo_set_y'));
          if (setY) {
            movedByBlock = true;
            stats.y = Number(setY.param !== undefined ? setY.param : 0);
          }

          // 6. Go to target (random position, mouse-pointer, Stage center)
          const gotoTarget = spriteBlocks.find(b => b.id.startsWith('mo_goto_target'));
          if (gotoTarget) {
            movedByBlock = true;
            const target = String(gotoTarget.param || 'random position');
            if (target === 'random position') {
              if (Math.random() < 0.005) { // Teleport occasionally
                stats.x = (Math.random() * 240) - 120;
                stats.y = (Math.random() * 160) - 80;
                playWebBeep(450, 0.05, 'sine');
              }
            } else if (target === 'center') {
              stats.x = 0;
              stats.y = 0;
            }
          }

          // 7. Go to x,y block
          const gotoXY = spriteBlocks.find(b => b.id.startsWith('mo_goto_xy'));
          if (gotoXY) {
            movedByBlock = true;
            const val = String(gotoXY.param || '0, 0');
            const parts = val.split(',').map(p => parseFloat(p.trim()));
            const tx = isNaN(parts[0]) ? 0 : parts[0];
            const ty = isNaN(parts[1]) ? 0 : parts[1];
            stats.x = tx;
            stats.y = ty;
          }

          // 8. Glide to target (random position etc)
          const glideTarget = spriteBlocks.find(b => b.id.startsWith('mo_glide_target'));
          if (glideTarget) {
            movedByBlock = true;
            const secs = Number(glideTarget.param !== undefined ? glideTarget.param : 1);
            // Slowly drift
            stats.x += stats.vx * (1 / (secs * 2 + 1));
            stats.y += stats.vy * (1 / (secs * 2 + 1));
          }

          // 9. Glide to XY
          const glideXY = spriteBlocks.find(b => b.id.startsWith('mo_glide_xy'));
          if (glideXY) {
            movedByBlock = true;
            const val = String(glideXY.param || '1, 10, 10');
            const parts = val.split(',').map(p => parseFloat(p.trim()));
            const s = isNaN(parts[0]) ? 1 : parts[0];
            const tx = isNaN(parts[1]) ? 0 : parts[1];
            const ty = isNaN(parts[2]) ? 0 : parts[2];
            stats.x += (tx - stats.x) * (0.02 / (s || 1));
            stats.y += (ty - stats.y) * (0.02 / (s || 1));
          }

          // 10. Point in direction [90]
          const pointDir = spriteBlocks.find(b => b.id.startsWith('mo_point_dir'));
          if (pointDir) {
            const deg = Number(pointDir.param !== undefined ? pointDir.param : 90);
            stats.rotation = (deg - 90) * (Math.PI / 180); // Offset so 0 is Up in graphics
          }

          // 11. Point towards [mouse-pointer]
          const pointTowards = spriteBlocks.find(b => b.id.startsWith('mo_point_towards'));
          if (pointTowards) {
            const target = String(pointTowards.param || 'mouse-pointer');
            if (target === 'center') {
              const dx = 0 - stats.x;
              const dy = 0 - stats.y;
              stats.rotation = Math.atan2(dy, dx);
            }
          }

          // 12. Set rotation style style
          const rotStyle = spriteBlocks.find(b => b.id.startsWith('mo_rot_style'));
          if (rotStyle) {
            const val = String(rotStyle.param || 'all around');
            if (val === 'left-right') {
              // Upright or flip sign based on heading vx
              if (stats.vx < 0) stats.rotation = Math.PI;
              else stats.rotation = 0;
            } else if (val === "don't rotate") {
              stats.rotation = 0;
            }
          }

          // 13. SWITCH BACKDROP / NEXT BACKDROP
          const switchBk = spriteBlocks.find(b => b.id.startsWith('lo_switch_backdrop'));
          if (switchBk) {
            const dest = String(switchBk.param || 'Neon Sunset');
            if (currentBackdrop !== dest) {
              setCurrentBackdrop(dest);
            }
          }
          const nextBk = spriteBlocks.find(b => b.id.startsWith('lo_next_backdrop'));
          if (nextBk) {
            if (Math.random() < 0.003) { // slower transition rate
              const curIdx = backdropsPool.indexOf(currentBackdrop);
              const nextIdx = (curIdx + 1) % backdropsPool.length;
              setCurrentBackdrop(backdropsPool[nextIdx]);
              playWebBeep(520, 0.06, 'triangle');
            }
          }

          // 14. SWITCH COSTUME / NEXT COSTUME
          const switchCostume = spriteBlocks.find(b => b.id.startsWith('lo_switch_costume'));
          if (switchCostume) {
            stats.costume = String(switchCostume.param || '🐱');
          }
          const nextCostume = spriteBlocks.find(b => b.id.startsWith('lo_next_costume'));
          if (nextCostume) {
            if (Math.random() < 0.003) {
              const emojiPool = ['🐱', '👾', '🛡️', '🦄', '🐼', '🤖', '🦊', '🐸'];
              const curIdx = emojiPool.indexOf(stats.costume || sprite.emoji);
              const nextIdx = (curIdx + 1) % emojiPool.length;
              stats.costume = emojiPool[nextIdx];
              playWebBeep(640, 0.04, 'sine');
            }
          }

          // 15. GRAPHIC EFFECTS (Color, Fisheye/Brightness, Ghost, Pixelate)
          const changeEff = spriteBlocks.find(b => b.id.startsWith('lo_change_effect'));
          if (changeEff) {
            const val = String(changeEff.param || 'color, 25');
            const parts = val.split(',').map(p => p.trim());
            const effType = parts[0] || 'color';
            const effVal = parseFloat(parts[1]) || 25;
            if (!stats.graphicEffects) stats.graphicEffects = {};
            stats.graphicEffects[effType] = (stats.graphicEffects[effType] || 0) + effVal * 0.05;
          }
          const setEff = spriteBlocks.find(b => b.id.startsWith('lo_set_effect'));
          if (setEff) {
            const val = String(setEff.param || 'color, 0');
            const parts = val.split(',').map(p => p.trim());
            const effType = parts[0] || 'color';
            const effVal = parseFloat(parts[1]) || 0;
            if (!stats.graphicEffects) stats.graphicEffects = {};
            stats.graphicEffects[effType] = effVal;
          }
          const clearEffects = spriteBlocks.find(b => b.id.startsWith('lo_clear_effects'));
          if (clearEffects) {
            stats.graphicEffects = {};
          }

          // 16. CHANGE SIZE / SET SIZE
          const changeSize = spriteBlocks.find(b => b.id.startsWith('lo_change_size'));
          if (changeSize) {
            const amt = Number(changeSize.param !== undefined ? changeSize.param : 10);
            stats.size = Math.max(10, Math.min(250, (stats.size !== undefined ? stats.size : 100) + amt * 0.05));
          }
          const setSize = spriteBlocks.find(b => b.id.startsWith('lo_set_size'));
          if (setSize) {
            stats.size = Math.max(10, Math.min(250, Number(setSize.param !== undefined ? setSize.param : 100)));
          }

          // 17. SHOW / HIDE
          if (spriteBlocks.some(b => b.id.startsWith('lo_show'))) {
            stats.visible = true;
          }
          if (spriteBlocks.some(b => b.id.startsWith('lo_hide'))) {
            stats.visible = false;
          }

          // 18. GO TO LAYER / RELATIVE LAYERS
          const goLayer = spriteBlocks.find(b => b.id.startsWith('lo_go_layer'));
          if (goLayer) {
            const dest = String(goLayer.param || 'front');
            stats.layerIndex = dest === 'front' ? 10 : -10;
          }
          const goRelLayer = spriteBlocks.find(b => b.id.startsWith('lo_go_relative_layers'));
          if (goRelLayer) {
            const val = String(goRelLayer.param || 'forward, 1');
            const parts = val.split(',').map(p => p.trim());
            const dir = parts[0] || 'forward';
            const amt = parseInt(parts[1], 10) || 1;
            stats.layerIndex = (stats.layerIndex || 0) + (dir === 'forward' ? amt : -amt);
          }

          // 19. SOUND EFFECTS & VOLUME (Pitch, Pop, Laser, Stop All)
          const stopAllSounds = spriteBlocks.find(b => b.id.startsWith('so_stop_all'));
          if (stopAllSounds) {
            stats.volume = 0;
          }
          const changeVol = spriteBlocks.find(b => b.id.startsWith('so_change_volume'));
          if (changeVol) {
            const amt = Number(changeVol.param !== undefined ? changeVol.param : -10);
            stats.volume = Math.max(0, Math.min(100, (stats.volume !== undefined ? stats.volume : 100) + amt * 0.05));
          }
          const setVol = spriteBlocks.find(b => b.id.startsWith('so_set_volume'));
          if (setVol) {
            stats.volume = Math.max(0, Math.min(100, Number(setVol.param !== undefined ? setVol.param : 100)));
          }
          const changeSndEff = spriteBlocks.find(b => b.id.startsWith('so_change_effect'));
          if (changeSndEff) {
            const val = String(changeSndEff.param || 'pitch, 10');
            const parts = val.split(',').map(p => p.trim());
            const eff = parts[0] || 'pitch';
            const amt = parseFloat(parts[1]) || 10;
            if (!stats.soundEffects) stats.soundEffects = {};
            stats.soundEffects[eff] = (stats.soundEffects[eff] || 100) + amt * 0.5;
          }
          const setSndEff = spriteBlocks.find(b => b.id.startsWith('so_set_effect'));
          if (setSndEff) {
            const val = String(setSndEff.param || 'pitch, 100');
            const parts = val.split(',').map(p => p.trim());
            const eff = parts[0] || 'pitch';
            const amt = parseFloat(parts[1]) || 100;
            if (!stats.soundEffects) stats.soundEffects = {};
            stats.soundEffects[eff] = amt;
          }
          const clearSndEff = spriteBlocks.find(b => b.id.startsWith('so_clear_effects'));
          if (clearSndEff) {
            stats.soundEffects = {};
          }

          // Ambient trigger for Play Sound blocks
          const playSound = spriteBlocks.find(b => b.id.startsWith('so_play_until_done') || b.id.startsWith('so_start_sound'));
          if (playSound) {
            if (Math.random() < 0.002) {
              const soundName = String(playSound.param || 'Pop');
              const pitch = stats.soundEffects?.pitch !== undefined ? stats.soundEffects.pitch : 100;
              const freq = (soundName === 'Pop' ? 620 : 380) * (pitch / 100);
              const volume = (stats.volume !== undefined ? stats.volume : 100) / 100;
              try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioCtx) {
                  const ctx = new AudioCtx();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.type = soundName === 'Pop' ? 'sine' : 'sawtooth';
                  osc.frequency.setValueAtTime(freq, ctx.currentTime);
                  gain.gain.setValueAtTime(0.06 * volume, ctx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.2);
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.start();
                  osc.stop(ctx.currentTime + 0.2);
                }
              } catch (err) {}
            }
          }

          // 20. SAY / THINK BUBBLE EXPIRY UPDATER
          if (stats.sayBubble && stats.sayBubble.expiresAt && Date.now() > stats.sayBubble.expiresAt) {
            stats.sayBubble = undefined;
          }

          // Default linear trajectory
          if (!movedByBlock) {
            stats.x += stats.vx;
            stats.y += stats.vy;
          }

          // Bounces
          const bounceBlock = spriteBlocks.find(b => b.id.includes('bounce') || b.category === 'motion');
          if (bounceBlock) {
            const boundX = canvas.width / 2 - 16;
            const boundY = canvas.height / 2 - 16;
            let bounced = false;
            if (stats.x > boundX) { stats.x = boundX; stats.vx *= -1; bounced = true; }
            if (stats.x < -boundX) { stats.x = -boundX; stats.vx *= -1; bounced = true; }
            if (stats.y > boundY) { stats.y = boundY; stats.vy *= -1; bounced = true; }
            if (stats.y < -boundY) { stats.y = -boundY; stats.vy *= -1; bounced = true; }
            if (bounced) {
              setBounceCount(prev => prev + 1);
              playWebBeep(330, 0.05, 'triangle');
            }
          }
        }

        // --- DRAWING PORTION FOR THE SPRITE ---
        if (stats.visible === false) return; // invisible sprites do not paint!

        ctx.save();
        const canvasX = stats.x + canvas.width / 2;
        const canvasY = -stats.y + canvas.height / 2;

        ctx.translate(canvasX, canvasY);
        ctx.rotate(stats.rotation);

        // Selection ring
        if (sprite.id === activeSpriteId) {
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.moveTo(18, -4);
          ctx.lineTo(24, 0);
          ctx.lineTo(18, 4);
          ctx.fill();
        }

        // Core filter logic (color shift, ghost, brightness, pixelate)
        let fStr = '';
        if (stats.graphicEffects) {
          if (stats.graphicEffects['color'] !== undefined) {
             fStr += ` hue-rotate(${stats.graphicEffects['color'] * 3.6}deg)`;
          }
          if (stats.graphicEffects['ghost'] !== undefined) {
             fStr += ` opacity(${Math.max(0, Math.min(100, 100 - stats.graphicEffects['ghost']))}%)`;
          }
          if (stats.graphicEffects['brightness'] !== undefined) {
             fStr += ` brightness(${100 + stats.graphicEffects['brightness'] * 1.5}%)`;
          }
          if (stats.graphicEffects['pixelate'] !== undefined) {
             fStr += ` contrast(${100 + stats.graphicEffects['pixelate'] * 2}%)`;
          }
        }

        const colorBlock = spriteBlocks.find(b => b.category === 'looks' && b.id.includes('color'));
        if (colorBlock && (!stats.graphicEffects || stats.graphicEffects['color'] === undefined)) {
          const rotationValue = (Number(colorBlock.param || 25) * 5) % 360;
          fStr += ` hue-rotate(${rotationValue}deg)`;
        }

        if (fStr.trim()) {
          ctx.filter = fStr.trim();
        }

        // Costume size scaling
        const sVal = (stats.size !== undefined ? stats.size : 100) / 100;
        ctx.scale(sVal, sVal);

        // Core body emoji or custom drawn pixel grid
        if (sprite.customPixels) {
          const grid = sprite.customPixels;
          const rows = grid.length;
          const cols = grid[0].length;
          const sprSize = 32; // bounding size compatible with 24px emojis
          const cellW = sprSize / cols;
          const cellH = sprSize / rows;
          ctx.save();
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const pixelColor = grid[r][c];
              if (pixelColor && pixelColor !== 'transparent') {
                ctx.fillStyle = pixelColor;
                // Draw pixel cells centered around (0,0)
                ctx.fillRect(-sprSize / 2 + c * cellW, -sprSize / 2 + r * cellH, cellW + 0.1, cellH + 0.1);
              }
            }
          }
          ctx.restore();
        } else {
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(stats.costume || sprite.emoji, 0, 0);
        }
        ctx.restore();

        // Draw Speech or Thought bubble trail
        const bub = stats.sayBubble;
        const isExp = bub?.expiresAt && Date.now() > bub.expiresAt;
        if (bub && !isExp && isRunning) {
          const isThink = bub.mode === 'think';
          const bubbleX = canvasX + 24;
          const bubbleY = canvasY - 32;
          const bubbleW = Math.max(80, ctx.measureText(bub.text).width + 20);
          const bubbleH = 26;

          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = isThink ? '#818cf8' : '#22d3ee';
          ctx.lineWidth = 1.5;

          if (isThink) {
            // Cloud layout
            ctx.beginPath();
            ctx.arc(bubbleX + bubbleW * 0.25, bubbleY + bubbleH * 0.5, 12, 0, Math.PI * 2);
            ctx.arc(bubbleX + bubbleW * 0.5, bubbleY + bubbleH * 0.3, 13, 0, Math.PI * 2);
            ctx.arc(bubbleX + bubbleW * 0.75, bubbleY + bubbleH * 0.5, 12, 0, Math.PI * 2);
            ctx.arc(bubbleX + bubbleW * 0.5, bubbleY + bubbleH * 0.7, 13, 0, Math.PI * 2);
            ctx.roundRect(bubbleX + 6, bubbleY, bubbleW - 12, bubbleH, 6);
            ctx.fill();
            ctx.stroke();

            // Trails
            ctx.beginPath();
            ctx.arc(canvasX + 12, canvasY - 14, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(canvasX + 6, canvasY - 6, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else {
            // Speech pointer
            ctx.beginPath();
            ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(bubbleX, bubbleY + bubbleH * 0.6);
            ctx.lineTo(canvasX + 12, canvasY - 10);
            ctx.lineTo(bubbleX + 12, bubbleY + bubbleH);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.stroke();
          }

          // text label
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(bub.text, bubbleX + bubbleW / 2, bubbleY + bubbleH / 2);
          ctx.restore();
        }
      });

      // Frame continuation loop
      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      canvas.removeEventListener('mousemove', handleMouseMoveOnCanvas);
    };
  }, [isRunning, spritesWorkspace, hueRotation, activeSpriteId, sprites, messageBubble, currentBackdrop]);

  // Handle color categories
  const getCategoryClass = (cat: string) => {
    switch (cat) {
      case 'events': return 'bg-amber-500 hover:bg-amber-600 border-amber-300 text-zinc-950';
      case 'motion': return 'bg-blue-500 hover:bg-blue-600 border-blue-300 text-white';
      case 'control': return 'bg-orange-500 hover:bg-orange-600 border-orange-300 text-white';
      case 'looks': return 'bg-indigo-500 hover:bg-indigo-600 border-indigo-300 text-white';
      case 'sound': return 'bg-pink-500 hover:bg-pink-600 border-pink-300 text-white';
      case 'variables': return 'bg-[#ff8c1a] hover:bg-[#ff8c1a]/90 border-[#ffab55] text-white';
      case 'sensing': return 'bg-cyan-500 hover:bg-cyan-600 border-cyan-300 text-white';
      case 'operators': return 'bg-emerald-500 hover:bg-emerald-600 border-emerald-300 text-white';
      default: return 'bg-zinc-600 border-zinc-400 text-white';
    }
  };

  const renderInteractiveBlockText = (block: BlockDefinition) => {
    if (block.id.startsWith('mo_move') || block.text.includes('[10]')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Move</span>
          <input
            type="number"
            value={block.param !== undefined ? block.param : 10}
            onChange={(e) => handleModifyParam(block.id, parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-12 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-xs font-bold"
          />
          <span>steps</span>
        </div>
      );
    }
    
    if (block.id.startsWith('mo_turn_right') || block.text.includes('Turn ↻')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Turn ↻</span>
          <input
            type="number"
            value={block.param !== undefined ? block.param : 15}
            onChange={(e) => handleModifyParam(block.id, parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-12 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-xs font-bold"
          />
          <span>degrees</span>
        </div>
      );
    }

    if (block.id.startsWith('mo_turn_left') || block.text.includes('Turn ↺')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Turn ↺</span>
          <input
            type="number"
            value={block.param !== undefined ? block.param : 15}
            onChange={(e) => handleModifyParam(block.id, parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-12 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-xs font-bold"
          />
          <span>degrees</span>
        </div>
      );
    }
    
    if (block.id.startsWith('mo_goto_target') || block.text.includes('Go to [')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>Go to</span>
          <select
            value={block.param !== undefined ? String(block.param) : 'random position'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-bold text-xs"
          >
            <option value="random position">random position</option>
            <option value="mouse-pointer">mouse-pointer</option>
            <option value="center">Stage Center (0,0)</option>
          </select>
        </div>
      );
    }

    if (block.id.startsWith('mo_goto_xy') || block.text.includes('Go to x:')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Go to x:</span>
          <input
            type="text"
            placeholder="0, 0"
            value={block.param !== undefined ? String(block.param) : "0, 0"}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-16 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-xs font-bold"
          />
        </div>
      );
    }

    if (block.id.startsWith('mo_glide_target') || block.text.includes('Glide [1] secs to [')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Glide</span>
          <input
            type="number"
            min="1"
            max="10"
            value={block.param !== undefined ? block.param : 1}
            onChange={(e) => handleModifyParam(block.id, parseFloat(e.target.value) || 1)}
            onClick={(e) => e.stopPropagation()}
            className="w-10 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-xs font-bold"
          />
          <span>secs to</span>
          <span className="bg-black/30 px-1 py-0.5 rounded text-white/90">random position</span>
        </div>
      );
    }

    if (block.id.startsWith('mo_glide_xy') || block.text.includes('Glide [1] secs to x:')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Glide</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : "1, 10, 10"}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-24 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-[10px] font-bold"
            placeholder="secs, x, y"
          />
        </div>
      );
    }

    if (block.id.startsWith('mo_point_dir') || block.text.includes('Point in direction')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Point in direction</span>
          <input
            type="number"
            value={block.param !== undefined ? block.param : 90}
            onChange={(e) => handleModifyParam(block.id, parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-12 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-xs font-bold"
          />
          <span>degrees</span>
        </div>
      );
    }

    if (block.id.startsWith('mo_point_towards') || block.text.includes('Point towards')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>Point towards</span>
          <select
            value={block.param !== undefined ? String(block.param) : 'mouse-pointer'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-bold text-xs"
          >
            <option value="mouse-pointer">mouse-pointer</option>
            <option value="center">Stage Center (0,0)</option>
          </select>
        </div>
      );
    }

    if (block.id.startsWith('mo_change_x') || block.text.includes('Change x by')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Change x by</span>
          <input
            type="number"
            value={block.param !== undefined ? block.param : 10}
            onChange={(e) => handleModifyParam(block.id, parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-12 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-xs font-bold"
          />
        </div>
      );
    }

    if (block.id.startsWith('mo_change_y') || block.text.includes('Change y by')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Change y by</span>
          <input
            type="number"
            value={block.param !== undefined ? block.param : 10}
            onChange={(e) => handleModifyParam(block.id, parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-12 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-xs font-bold"
          />
        </div>
      );
    }

    if (block.id.startsWith('mo_set_x') || block.text.includes('Set x to')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Set x to</span>
          <input
            type="number"
            value={block.param !== undefined ? block.param : 0}
            onChange={(e) => handleModifyParam(block.id, parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-12 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-xs font-bold"
          />
        </div>
      );
    }

    if (block.id.startsWith('mo_set_y') || block.text.includes('Set y to')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Set y to</span>
          <input
            type="number"
            value={block.param !== undefined ? block.param : 0}
            onChange={(e) => handleModifyParam(block.id, parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-12 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-xs font-bold"
          />
        </div>
      );
    }

    if (block.id.startsWith('mo_rot_style') || block.text.includes('Set rotation style')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>Set rotation style</span>
          <select
            value={block.param !== undefined ? String(block.param) : 'all around'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-bold text-xs"
          >
            <option value="left-right">left-right</option>
            <option value="don't rotate">don't rotate</option>
            <option value="all around">all around</option>
          </select>
        </div>
      );
    }

    // --- EVENTS CATEGORY BLOCKS ---
    if (block.id.startsWith('ev_backdrop') || block.text.includes('When backdrop switches')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>When backdrop switches to</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : "Stage1"}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-20 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-bold text-[10px]"
          />
        </div>
      );
    }

    if (block.id.startsWith('ev_timer') || block.text.includes('When [timer] >')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>When timer &gt;</span>
          <input
            type="number"
            value={block.param !== undefined ? block.param : 10}
            onChange={(e) => handleModifyParam(block.id, parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-10 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-xs font-bold"
          />
        </div>
      );
    }

    if (block.id.startsWith('ev_message') || block.text.includes('When I receive')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>When I receive</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : "start-broadcast"}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-20 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-bold text-[10px]"
          />
        </div>
      );
    }

    // --- LOOKS & COSTUMES CATEGORIZED BLOCKS ---
    if (block.id.startsWith('lo_say_for')) {
      const val = String(block.param || 'Hello Pixel!, 2');
      const parts = val.split(',').map(p => p.trim());
      const msg = parts[0] || 'Hello Pixel!';
      const secs = parts[1] || '2';
      const handleMsgChange = (m: string) => {
        handleModifyParam(block.id, `${m}, ${secs}`);
      };
      const handleSecsChange = (s: string) => {
        handleModifyParam(block.id, `${msg}, ${s}`);
      };
      return (
        <div className="flex items-center gap-1 flex-wrap">
          <span>say</span>
          <input
            type="text"
            value={msg}
            onChange={(e) => handleMsgChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-16 bg-black/40 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-400"
          />
          <span>for</span>
          <input
            type="number"
            value={secs}
            onChange={(e) => handleSecsChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-8 bg-black/40 text-white rounded px-1.5 py-0.5 text-[10px] font-bold font-mono text-center focus:ring-1 focus:ring-indigo-400"
          />
          <span>secs</span>
        </div>
      );
    }

    if (block.id.startsWith('lo_say') && !block.id.includes('for')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>say</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : "Hello Pixel!"}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-24 bg-black/40 text-white rounded px-1.5 py-0.5 text-xs font-bold focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      );
    }

    if (block.id.startsWith('lo_think_for')) {
      const val = String(block.param || 'Hmm..., 2');
      const parts = val.split(',').map(p => p.trim());
      const msg = parts[0] || 'Hmm...';
      const secs = parts[1] || '2';
      const handleMsgChange = (m: string) => {
        handleModifyParam(block.id, `${m}, ${secs}`);
      };
      const handleSecsChange = (s: string) => {
        handleModifyParam(block.id, `${msg}, ${s}`);
      };
      return (
        <div className="flex items-center gap-1 flex-wrap">
          <span>think</span>
          <input
            type="text"
            value={msg}
            onChange={(e) => handleMsgChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-16 bg-black/40 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-400"
          />
          <span>for</span>
          <input
            type="number"
            value={secs}
            onChange={(e) => handleSecsChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-8 bg-black/40 text-white rounded px-1.5 py-0.5 text-[10px] font-bold font-mono text-center focus:ring-1 focus:ring-indigo-400"
          />
          <span>secs</span>
        </div>
      );
    }

    if (block.id.startsWith('lo_think') && !block.id.includes('for')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>think</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : "Hmm..."}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-24 bg-black/40 text-white rounded px-1.5 py-0.5 text-xs font-bold focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      );
    }

    if (block.id.startsWith('lo_switch_costume')) {
      return (
        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>switch costume to</span>
          <select
            value={block.param !== undefined ? String(block.param) : '🐱'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-400"
          >
            <option value="🐱">🐱 Scratchy</option>
            <option value="👾">👾 Giga Monster</option>
            <option value="🛡️">🛡️ Knight Shield</option>
            <option value="🦄">🦄 Pony</option>
            <option value="🐼">🐼 Panda Bear</option>
            <option value="🤖">🤖 Bot Rover</option>
            <option value="🦊">🦊 Red Fox</option>
            <option value="🐸">🐸 Green Toad</option>
          </select>
        </div>
      );
    }

    if (block.id.startsWith('lo_switch_backdrop')) {
      return (
        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>switch backdrop to</span>
          <select
            value={block.param !== undefined ? String(block.param) : 'Neon Sunset'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-400"
          >
            <option value="Sage Grid">Sage Grid</option>
            <option value="Neon Sunset">Neon Sunset</option>
            <option value="Outer Space">Outer Space</option>
            <option value="Castle Room">Castle Room</option>
          </select>
        </div>
      );
    }

    if (block.id.startsWith('lo_change_effect')) {
      const val = String(block.param || 'color, 25');
      const parts = val.split(',').map(p => p.trim());
      const eff = parts[0] || 'color';
      const amt = parts[1] || '25';
      const handleEffChange = (eType: string) => {
        handleModifyParam(block.id, `${eType}, ${amt}`);
      };
      const handleAmtChange = (eAmt: string) => {
        handleModifyParam(block.id, `${eff}, ${eAmt}`);
      };
      return (
        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>change</span>
          <select
            value={eff}
            onChange={(e) => handleEffChange(e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1 text-[10px] font-bold focus:ring-1 focus:ring-indigo-400"
          >
            <option value="color">color</option>
            <option value="ghost">ghost</option>
            <option value="brightness">brightness</option>
            <option value="pixelate">pixelate</option>
          </select>
          <span>effect by</span>
          <input
            type="number"
            value={amt}
            onChange={(e) => handleAmtChange(e.target.value)}
            className="w-10 bg-black/40 text-center rounded text-white py-0.5 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      );
    }

    if (block.id.startsWith('lo_set_effect')) {
      const val = String(block.param || 'color, 0');
      const parts = val.split(',').map(p => p.trim());
      const eff = parts[0] || 'color';
      const amt = parts[1] || '0';
      const handleEffChange = (eType: string) => {
        handleModifyParam(block.id, `${eType}, ${amt}`);
      };
      const handleAmtChange = (eAmt: string) => {
        handleModifyParam(block.id, `${eff}, ${eAmt}`);
      };
      return (
        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>set</span>
          <select
            value={eff}
            onChange={(e) => handleEffChange(e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1 text-[10px] font-bold focus:ring-1 focus:ring-indigo-400"
          >
            <option value="color">color</option>
            <option value="ghost">ghost</option>
            <option value="brightness">brightness</option>
            <option value="pixelate">pixelate</option>
          </select>
          <span>to</span>
          <input
            type="number"
            value={amt}
            onChange={(e) => handleAmtChange(e.target.value)}
            className="w-10 bg-black/40 text-center rounded text-white py-0.5 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      );
    }

    if (block.id.startsWith('lo_change_size')) {
      return (
        <div className="flex items-center gap-1 flex-wrap">
          <span>change size by</span>
          <input
            type="number"
            value={block.param !== undefined ? Number(block.param) : 10}
            onChange={(e) => handleModifyParam(block.id, parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-10 bg-black/40 text-center rounded text-white py-0.5 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      );
    }

    if (block.id.startsWith('lo_set_size')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>set size to</span>
          <input
            type="number"
            value={block.param !== undefined ? Number(block.param) : 100}
            onChange={(e) => handleModifyParam(block.id, parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-12 bg-black/40 text-center rounded text-white py-0.5 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-400"
          />
          <span>%</span>
        </div>
      );
    }

    if (block.id.startsWith('lo_go_layer')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>go to</span>
          <select
            value={block.param !== undefined ? String(block.param) : 'front'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1 text-[10px] font-bold focus:ring-1 focus:ring-indigo-400"
          >
            <option value="front">front</option>
            <option value="back">back</option>
          </select>
          <span>layer</span>
        </div>
      );
    }

    if (block.id.startsWith('lo_go_relative_layers')) {
      const val = String(block.param || 'forward, 1');
      const parts = val.split(',').map(p => p.trim());
      const dir = parts[0] || 'forward';
      const amt = parts[1] || '1';
      const handleDirChange = (d: string) => {
        handleModifyParam(block.id, `${d}, ${amt}`);
      };
      const handleAmtChange = (a: string) => {
        handleModifyParam(block.id, `${dir}, ${a}`);
      };
      return (
        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>go</span>
          <select
            value={dir}
            onChange={(e) => handleDirChange(e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1.5 text-[10px] font-bold focus:ring-1 focus:ring-indigo-400"
          >
            <option value="forward">forward</option>
            <option value="backward">backward</option>
          </select>
          <input
            type="number"
            value={amt}
            onChange={(e) => handleAmtChange(e.target.value)}
            className="w-8 bg-black/40 text-center rounded text-white py-0.5 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-400"
          />
          <span>layers</span>
        </div>
      );
    }

    // --- SOUNDS & SYNTHESIS CATEGORY BLOCKS ---
    if (block.id.startsWith('so_play_until_done') || block.id.startsWith('so_start_sound')) {
      const label = block.id.startsWith('so_play_until_done') ? 'play sound' : 'start sound';
      const labelTail = block.id.startsWith('so_play_until_done') ? 'until done' : '';
      return (
        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>{label}</span>
          <select
            value={block.param !== undefined ? String(block.param) : 'Pop'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1 text-[10px] font-bold focus:ring-1 focus:ring-pink-400"
          >
            <option value="Pop">Pop 🥤</option>
            <option value="Laser">Laser ⚡</option>
            <option value="Chime">Chime 🔔</option>
            <option value="Synth">Synth 🎹</option>
          </select>
          {labelTail && <span>{labelTail}</span>}
        </div>
      );
    }

    if (block.id.startsWith('so_change_effect')) {
      const val = String(block.param || 'pitch, 10');
      const parts = val.split(',').map(p => p.trim());
      const eff = parts[0] || 'pitch';
      const amt = parts[1] || '10';
      const handleEffChange = (e: string) => {
        handleModifyParam(block.id, `${e}, ${amt}`);
      };
      const handleAmtChange = (a: string) => {
        handleModifyParam(block.id, `${eff}, ${a}`);
      };
      return (
        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>change</span>
          <select
            value={eff}
            onChange={(e) => handleEffChange(e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1 text-[10px] font-bold focus:ring-1 focus:ring-pink-400"
          >
            <option value="pitch">pitch</option>
            <option value="pan">pan</option>
          </select>
          <span>effect by</span>
          <input
            type="number"
            value={amt}
            onChange={(e) => handleAmtChange(e.target.value)}
            className="w-10 bg-black/40 text-center rounded text-white py-0.5 text-xs font-mono font-bold focus:ring-1 focus:ring-pink-400"
          />
        </div>
      );
    }

    if (block.id.startsWith('so_set_effect')) {
      const val = String(block.param || 'pitch, 100');
      const parts = val.split(',').map(p => p.trim());
      const eff = parts[0] || 'pitch';
      const amt = parts[1] || '100';
      const handleEffChange = (e: string) => {
        handleModifyParam(block.id, `${e}, ${amt}`);
      };
      const handleAmtChange = (a: string) => {
        handleModifyParam(block.id, `${eff}, ${a}`);
      };
      return (
        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>set</span>
          <select
            value={eff}
            onChange={(e) => handleEffChange(e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1 text-[10px] font-bold focus:ring-1 focus:ring-pink-400"
          >
            <option value="pitch">pitch</option>
            <option value="pan">pan</option>
          </select>
          <span>effect to</span>
          <input
            type="number"
            value={amt}
            onChange={(e) => handleAmtChange(e.target.value)}
            className="w-12 bg-black/40 text-center rounded text-white py-0.5 text-xs font-mono font-bold focus:ring-1 focus:ring-pink-400"
          />
        </div>
      );
    }

    if (block.id.startsWith('so_change_volume')) {
      return (
        <div className="flex items-center gap-1 flex-wrap">
          <span>change volume by</span>
          <input
            type="number"
            value={block.param !== undefined ? Number(block.param) : -10}
            onChange={(e) => handleModifyParam(block.id, parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-10 bg-black/40 text-center rounded text-white py-0.5 text-xs font-mono font-bold focus:ring-1 focus:ring-pink-400"
          />
        </div>
      );
    }

    if (block.id.startsWith('so_set_volume')) {
      return (
        <div className="flex items-center gap-1 flex-wrap">
          <span>set volume to</span>
          <input
            type="number"
            value={block.param !== undefined ? Number(block.param) : 100}
            onChange={(e) => handleModifyParam(block.id, parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-12 bg-black/40 text-center rounded text-white py-0.5 text-xs font-mono font-bold focus:ring-1 focus:ring-pink-400"
          />
          <span>%</span>
        </div>
      );
    }

    // --- NEWLY ADDED BLOCK RENDERING HANDLERS ---
    
    // Loops and Conditionals custom parameters modifier widgets
    if (block.id.startsWith('co_repeat_start')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>repeat</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : "5"}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-12 bg-black/40 hover:bg-black/60 text-center rounded text-white py-0.5 text-[10px] font-mono font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="5"
          />
          <span>times</span>
        </div>
      );
    }

    if (block.id.startsWith('co_if_then_start') || block.id.startsWith('co_if_else_start') || block.id.startsWith('co_repeat_until_start')) {
      const blockLabel = block.id.startsWith('co_if_then_start')
        ? 'if'
        : block.id.startsWith('co_if_else_start')
        ? 'if'
        : 'repeat until';
      const suffix = (block.id.startsWith('co_if_then_start') || block.id.startsWith('co_if_else_start')) ? 'then' : '';
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>{blockLabel}</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : "counter > 5"}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-28 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-mono font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="condition"
          />
          {suffix && <span>{suffix}</span>}
        </div>
      );
    }

    if (block.id.startsWith('va_reporter_var')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>report value of</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : "my variable"}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-24 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="my variable"
          />
        </div>
      );
    }

    if (block.id.startsWith('va_item_list')) {
      const val = String(block.param || '1, my list');
      const firstComma = val.indexOf(',');
      const idxStr = firstComma !== -1 ? val.substring(0, firstComma).trim() : '1';
      const listName = firstComma !== -1 ? val.substring(firstComma + 1).trim() : 'my list';

      const handleIdxChange = (i: string) => {
        handleModifyParam(block.id, `${i}, ${listName}`);
      };
      const handleListChange = (l: string) => {
        handleModifyParam(block.id, `${idxStr}, ${l}`);
      };

      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>item</span>
          <input
            type="text"
            value={idxStr}
            onChange={(e) => handleIdxChange(e.target.value)}
            className="w-10 bg-black/40 text-center text-white rounded px-1 py-0.5 text-[10px] font-mono font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="1"
          />
          <span>of</span>
          <input
            type="text"
            value={listName}
            onChange={(e) => handleListChange(e.target.value)}
            className="w-18 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="my list"
          />
        </div>
      );
    }

    if (block.id.startsWith('va_item_index_list')) {
      const val = String(block.param || 'apple, my list');
      const firstComma = val.indexOf(',');
      const thing = firstComma !== -1 ? val.substring(0, firstComma).trim() : 'apple';
      const listName = firstComma !== -1 ? val.substring(firstComma + 1).trim() : 'my list';

      const handleThingChange = (t: string) => {
        handleModifyParam(block.id, `${t}, ${listName}`);
      };
      const handleListChange = (l: string) => {
        handleModifyParam(block.id, `${thing}, ${l}`);
      };

      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>item # of</span>
          <input
            type="text"
            value={thing}
            onChange={(e) => handleThingChange(e.target.value)}
            className="w-12 bg-black/40 text-center text-white rounded px-1 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="apple"
          />
          <span>in</span>
          <input
            type="text"
            value={listName}
            onChange={(e) => handleListChange(e.target.value)}
            className="w-18 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="my list"
          />
        </div>
      );
    }

    if (block.id.startsWith('va_length_list')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>length of</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : "my list"}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-20 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="my list"
          />
        </div>
      );
    }

    // 1. Wait command
    if (block.id.startsWith('co_wait')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>Wait</span>
          <input
            type="number"
            step="0.1"
            value={block.param !== undefined ? Number(block.param) : 1}
            onChange={(e) => handleModifyParam(block.id, parseFloat(e.target.value) || 0)}
            className="w-12 bg-black/40 text-center rounded text-white py-0.5 text-xs font-mono font-bold focus:ring-1 focus:ring-orange-400"
          />
          <span>seconds</span>
        </div>
      );
    }

    // 2. Broadcast blocks
    if (block.id.startsWith('ev_broadcast_and_wait')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>broadcast</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : "start-broadcast"}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-28 bg-black/40 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-amber-400 font-mono"
            placeholder="message"
          />
          <span>and wait</span>
        </div>
      );
    }

    if (block.id.startsWith('ev_broadcast')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>broadcast</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : "start-broadcast"}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-28 bg-black/40 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-amber-400 font-mono"
            placeholder="message"
          />
        </div>
      );
    }

    // 3. Variables & lists blocks
    if (block.id.startsWith('va_set_var') || block.id.startsWith('va_change_var')) {
      const val = String(block.param || 'my variable, 0');
      const firstComma = val.indexOf(',');
      const varName = firstComma !== -1 ? val.substring(0, firstComma).trim() : 'my variable';
      const varVal = firstComma !== -1 ? val.substring(firstComma + 1).trim() : '0';

      const handleNameChange = (name: string) => {
        handleModifyParam(block.id, `${name}, ${varVal}`);
      };
      const handleValueChange = (v: string) => {
        handleModifyParam(block.id, `${varName}, ${v}`);
      };

      const actionText = block.id.startsWith('va_set_var') ? 'set' : 'change';
      const preposition = block.id.startsWith('va_set_var') ? 'to' : 'by';

      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>{actionText}</span>
          <input
            type="text"
            value={varName}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-20 bg-black/40 hover:bg-black/60 text-white rounded px-1 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="variable"
          />
          <span>{preposition}</span>
          <input
            type="text"
            value={varVal}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-10 bg-black/40 hover:bg-black/60 text-white rounded px-1 py-0.5 text-[10px] font-mono text-center font-bold focus:ring-1 focus:ring-orange-400"
          />
        </div>
      );
    }

    if (block.id.startsWith('va_show_var') || block.id.startsWith('va_hide_var')) {
      const actionText = block.id.startsWith('va_show_var') ? 'show variable' : 'hide variable';
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>{actionText}</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : "my variable"}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-24 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="my variable"
          />
        </div>
      );
    }

    if (block.id.startsWith('va_add_to_list')) {
      const val = String(block.param || 'apple, my list');
      const firstComma = val.indexOf(',');
      const thing = firstComma !== -1 ? val.substring(0, firstComma).trim() : 'apple';
      const listName = firstComma !== -1 ? val.substring(firstComma + 1).trim() : 'my list';

      const handleThingChange = (t: string) => {
        handleModifyParam(block.id, `${t}, ${listName}`);
      };
      const handleListChange = (l: string) => {
        handleModifyParam(block.id, `${thing}, ${l}`);
      };

      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>add</span>
          <input
            type="text"
            value={thing}
            onChange={(e) => handleThingChange(e.target.value)}
            className="w-16 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="apple"
          />
          <span>to</span>
          <input
            type="text"
            value={listName}
            onChange={(e) => handleListChange(e.target.value)}
            className="w-16 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="my list"
          />
        </div>
      );
    }

    if (block.id.startsWith('va_delete_of_list')) {
      const val = String(block.param || '1, my list');
      const firstComma = val.indexOf(',');
      const idxStr = firstComma !== -1 ? val.substring(0, firstComma).trim() : '1';
      const listName = firstComma !== -1 ? val.substring(firstComma + 1).trim() : 'my list';

      const handleIdxChange = (i: string) => {
        handleModifyParam(block.id, `${i}, ${listName}`);
      };
      const handleListChange = (l: string) => {
        handleModifyParam(block.id, `${idxStr}, ${l}`);
      };

      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>delete</span>
          <input
            type="text"
            value={idxStr}
            onChange={(e) => handleIdxChange(e.target.value)}
            className="w-8 bg-black/40 text-white rounded px-1 py-0.5 text-[10px] font-mono text-center font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="1"
          />
          <span>of</span>
          <input
            type="text"
            value={listName}
            onChange={(e) => handleListChange(e.target.value)}
            className="w-16 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="my list"
          />
        </div>
      );
    }

    if (block.id.startsWith('va_delete_all_list')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>delete all of</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : 'my list'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-20 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="my list"
          />
        </div>
      );
    }

    if (block.id.startsWith('va_insert_at_list')) {
      const val = String(block.param || 'thing, 1, my list');
      const parts = val.split(',').map(p => p.trim());
      const thing = parts[0] || 'thing';
      const pos = parts[1] || '1';
      const listName = parts[2] || 'my list';

      const handleUpdate = (t: string, p: string, l: string) => {
        handleModifyParam(block.id, `${t}, ${p}, ${l}`);
      };

      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>insert</span>
          <input
            type="text"
            value={thing}
            onChange={(e) => handleUpdate(e.target.value, pos, listName)}
            className="w-12 bg-black/40 hover:bg-black/60 text-white rounded px-1 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="thing"
          />
          <span>at</span>
          <input
            type="text"
            value={pos}
            onChange={(e) => handleUpdate(thing, e.target.value, listName)}
            className="w-8 bg-black/40 text-white rounded px-1 py-0.5 text-[10px] font-mono text-center font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="1"
          />
          <span>of</span>
          <input
            type="text"
            value={listName}
            onChange={(e) => handleUpdate(thing, pos, e.target.value)}
            className="w-14 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="my list"
          />
        </div>
      );
    }

    if (block.id.startsWith('va_replace_item_list')) {
      const val = String(block.param || '1, my list, thing');
      const parts = val.split(',').map(p => p.trim());
      const pos = parts[0] || '1';
      const listName = parts[1] || 'my list';
      const thing = parts[2] || 'thing';

      const handleUpdate = (p: string, l: string, t: string) => {
        handleModifyParam(block.id, `${p}, ${l}, ${t}`);
      };

      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>replace item</span>
          <input
            type="text"
            value={pos}
            onChange={(e) => handleUpdate(e.target.value, listName, thing)}
            className="w-8 bg-black/40 text-white rounded px-1 py-0.5 text-[10px] font-mono text-center font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="1"
          />
          <span>of</span>
          <input
            type="text"
            value={listName}
            onChange={(e) => handleUpdate(pos, e.target.value, thing)}
            className="w-14 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="my list"
          />
          <span>with</span>
          <input
            type="text"
            value={thing}
            onChange={(e) => handleUpdate(pos, listName, e.target.value)}
            className="w-12 bg-black/40 hover:bg-black/60 text-white rounded px-1 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="thing"
          />
        </div>
      );
    }

    if (block.id.startsWith('va_show_list') || block.id.startsWith('va_hide_list')) {
      const actionText = block.id.startsWith('va_show_list') ? 'show list' : 'hide list';
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>{actionText}</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : "my list"}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-24 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="my list"
          />
        </div>
      );
    }

    if (block.id.startsWith('co_create_clone')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>create clone of</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : 'myself'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-20 bg-black/40 hover:bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-orange-400"
            placeholder="myself"
          />
        </div>
      );
    }

    // --- SENSING BLOCKS WIDGETS ---
    if (block.id.startsWith('se_costume')) {
      return (
        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>costume</span>
          <select
            value={block.param !== undefined ? String(block.param) : 'name'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1.5 text-[10px] font-bold focus:ring-1 focus:ring-cyan-400"
          >
            <option value="name">name 🏷️</option>
            <option value="number">number 🔢</option>
          </select>
        </div>
      );
    }

    if (block.id.startsWith('se_backdrop')) {
      return (
        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>backdrop</span>
          <select
            value={block.param !== undefined ? String(block.param) : 'name'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1.5 text-[10px] font-bold focus:ring-1 focus:ring-cyan-400"
          >
            <option value="name">name 🏷️</option>
            <option value="number">number 🔢</option>
          </select>
        </div>
      );
    }

    if (block.id.startsWith('se_touching_color')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <span>touching color</span>
          <input
            type="color"
            value={block.param !== undefined ? String(block.param) : '#ff0000'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-6 h-5 rounded cursor-pointer border border-[#ffffff]/20 bg-transparent py-0 px-0"
          />
        </div>
      );
    }

    if (block.id.startsWith('se_touching_target') || block.id.startsWith('se_distance')) {
      const label = block.id.startsWith('se_touching_target') ? 'touching' : 'distance to';
      const entities = ['mouse-pointer', 'Scratchy', 'Goblin', 'Hero Block'];
      return (
        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>{label}</span>
          <select
            value={block.param !== undefined ? String(block.param) : 'mouse-pointer'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1 text-[10px] font-bold focus:ring-1 focus:ring-cyan-400"
          >
            {entities.map(ent => (
              <option key={ent} value={ent}>{ent}</option>
            ))}
          </select>
        </div>
      );
    }

    if (block.id.startsWith('se_ask_and_wait')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>ask</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : 'What is your name?'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-32 bg-black/40 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-cyan-400"
            placeholder="What is your name?"
          />
          <span>and wait</span>
        </div>
      );
    }

    if (block.id.startsWith('se_property_of')) {
      const val = String(block.param || 'x position, Goblin');
      const parts = val.split(',').map(p => p.trim());
      const prop = parts[0] || 'x position';
      const target = parts[1] || 'Goblin';

      const handlePropChange = (p: string) => {
        handleModifyParam(block.id, `${p}, ${target}`);
      };
      const handleTargetChange = (t: string) => {
        handleModifyParam(block.id, `${prop}, ${t}`);
      };

      const propList = ['x position', 'y position', 'direction', 'costume name', 'costume number', 'size', 'volume', 'backdrop name', 'backdrop number', 'my variable'];
      const targetList = ['Stage', 'Scratchy', 'Goblin', 'Hero Block'];

      return (
        <div className="flex items-center gap-1 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <select
            value={prop}
            onChange={(e) => handlePropChange(e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1 text-[10px] font-bold focus:ring-1 focus:ring-cyan-400"
          >
            {propList.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span>of</span>
          <select
            value={target}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1 text-[10px] font-bold focus:ring-1 focus:ring-cyan-400"
          >
            {targetList.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      );
    }

    if (block.id.startsWith('se_current_time')) {
      const units = ['year', 'month', 'date', 'day of week', 'hour', 'minute', 'second'];
      return (
        <div className="flex items-center gap-1 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>current</span>
          <select
            value={block.param !== undefined ? String(block.param) : 'year'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="bg-black/40 rounded text-white py-0.5 px-1 text-[10px] font-bold focus:ring-1 focus:ring-cyan-400"
          >
            {units.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      );
    }

    if (block.id.startsWith('se_color_touching_color')) {
      const val = String(block.param || '#ff0000, #00ff00');
      const parts = val.split(',').map(p => p.trim());
      const c1 = parts[0] || '#ff0000';
      const c2 = parts[1] || '#00ff00';

      const handleUpdate = (color1: string, color2: string) => {
        handleModifyParam(block.id, `${color1}, ${color2}`);
      };

      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <span>color</span>
          <input
            type="color"
            value={c1}
            onChange={(e) => handleUpdate(e.target.value, c2)}
            className="w-6 h-5 rounded cursor-pointer border border-[#ffffff]/20 bg-transparent py-0 px-0"
          />
          <span>is touching</span>
          <input
            type="color"
            value={c2}
            onChange={(e) => handleUpdate(c1, e.target.value)}
            className="w-6 h-5 rounded cursor-pointer border border-[#ffffff]/20 bg-transparent py-0 px-0"
          />
        </div>
      );
    }

    if (block.id.startsWith('se_key_pressed')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>key</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : 'space'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-16 bg-black/40 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-cyan-400 animate-none"
            placeholder="space"
          />
          <span>pressed?</span>
        </div>
      );
    }

    if (block.id.startsWith('se_mouse_down')) {
      return (
        <div className="text-xs font-bold font-sans">
          <span>mouse down?</span>
        </div>
      );
    }

    if (block.id.startsWith('se_list_contains')) {
      const val = String(block.param || 'my list, apple');
      const parts = val.split(',').map(p => p.trim());
      const listName = parts[0] || 'my list';
      const itemVal = parts[1] || 'apple';

      const handleUpdate = (l: string, i: string) => {
        handleModifyParam(block.id, `${l}, ${i}`);
      };

      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <span>[</span>
          <input
            type="text"
            value={listName}
            onChange={(e) => handleUpdate(e.target.value, itemVal)}
            className="w-16 bg-black/40 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-cyan-400"
            placeholder="my list"
          />
          <span>] contains (</span>
          <input
            type="text"
            value={itemVal}
            onChange={(e) => handleUpdate(listName, e.target.value)}
            className="w-16 bg-black/40 text-white rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-cyan-400"
            placeholder="apple"
          />
          <span>)?</span>
        </div>
      );
    }

    if (block.id.startsWith('se_less_than') || block.id.startsWith('se_equal_to') || block.id.startsWith('se_greater_than')) {
      const isLess = block.id.startsWith('se_less_than');
      const isEqual = block.id.startsWith('se_equal_to');
      const sign = isLess ? '<' : isEqual ? '=' : '>';
      
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : `counter ${sign} 5`}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-28 bg-black/40 text-white font-mono rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-cyan-400"
            placeholder={`var ${sign} value`}
          />
        </div>
      );
    }

    if (block.id.startsWith('se_and_opt') || block.id.startsWith('se_or_opt') || block.id.startsWith('se_not_opt')) {
      const label = block.id.startsWith('se_not_opt') ? 'not' : block.id.startsWith('se_and_opt') ? 'and' : 'or';
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : 'timer > 5'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-36 bg-black/40 text-white font-mono rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-cyan-400"
            placeholder={`${label} formula`}
          />
        </div>
      );
    }

    // --- Control - Stop Options UI ---
    if (block.id.startsWith('co_stop_script')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span>stop</span>
          <select
            value={block.param !== undefined ? String(block.param) : 'all'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="bg-black/45 rounded text-white py-0.5 px-1 bg-[#14161f] text-[10px] font-bold focus:ring-1 focus:ring-emerald-400"
          >
            <option value="all">all 🚫</option>
            <option value="this script">this script 🛑</option>
            <option value="other scripts in sprite">other scripts ⚠️</option>
          </select>
        </div>
      );
    }

    // --- Operators - Math + Text Interactive Input Blocks ---
    if (block.id.startsWith('op_add')) {
      return (
        <div className="flex items-center gap-1 bg-black/10 px-1 py-0.5 rounded flex-wrap text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : '10 + 5'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-24 bg-black/40 text-white font-mono rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-emerald-500 focus:ring-1 text-center"
            placeholder="10 + 5"
          />
        </div>
      );
    }

    if (block.id.startsWith('op_subtract')) {
      return (
        <div className="flex items-center gap-1 bg-black/10 px-1 py-0.5 rounded flex-wrap text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : '10 - 5'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-24 bg-black/40 text-white font-mono rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-emerald-500 focus:ring-1 text-center"
            placeholder="10 - 5"
          />
        </div>
      );
    }

    if (block.id.startsWith('op_multiply')) {
      return (
        <div className="flex items-center gap-1 bg-black/10 px-1 py-0.5 rounded flex-wrap text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : '5 * 4'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-24 bg-black/40 text-white font-mono rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-emerald-500 focus:ring-1 text-center"
            placeholder="5 * 4"
          />
        </div>
      );
    }

    if (block.id.startsWith('op_divide')) {
      return (
        <div className="flex items-center gap-1 bg-black/10 px-1 py-0.5 rounded flex-wrap text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : '10 / 2'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-24 bg-black/40 text-white font-mono rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-emerald-500 focus:ring-1 text-center"
            placeholder="10 / 2"
          />
        </div>
      );
    }

    if (block.id.startsWith('op_random')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <span>pick random</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : '1 to 10'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-20 bg-black/40 text-white font-mono rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-emerald-500 focus:ring-1 text-center"
            placeholder="1 to 10"
          />
        </div>
      );
    }

    if (block.id.startsWith('op_join')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <span>join</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : 'apple, banana'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-24 bg-black/40 text-white font-mono rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-emerald-500 focus:ring-1 text-center"
            placeholder="apple, banana"
          />
        </div>
      );
    }

    if (block.id.startsWith('op_letter_of')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <span>letter</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : '1, apple'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-20 bg-black/40 text-white font-mono rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-emerald-500 focus:ring-1 text-center"
            placeholder="1, apple"
          />
        </div>
      );
    }

    if (block.id.startsWith('op_length_of')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <span>length of</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : 'apple'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-20 bg-black/40 text-white font-mono rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-emerald-500 focus:ring-1 text-center"
            placeholder="apple"
          />
        </div>
      );
    }

    if (block.id.startsWith('op_mod')) {
      return (
        <div className="flex items-center gap-1 bg-black/10 px-1 py-0.5 rounded flex-wrap text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : '10 mod 3'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-24 bg-black/40 text-white font-mono rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-emerald-500 focus:ring-1 text-center"
            placeholder="10 mod 3"
          />
        </div>
      );
    }

    if (block.id.startsWith('op_round')) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <span>round</span>
          <input
            type="text"
            value={block.param !== undefined ? String(block.param) : '3.6'}
            onChange={(e) => handleModifyParam(block.id, e.target.value)}
            className="w-16 bg-black/40 text-white font-mono rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-emerald-500 focus:ring-1 text-center"
            placeholder="3.6"
          />
        </div>
      );
    }

    if (block.id.startsWith('op_math_func')) {
      const val = String(block.param || 'abs, -10');
      const parts = val.split(',').map(p => p.trim());
      const func = parts[0] || 'abs';
      const argument = parts[1] || '-10';
      
      const handleFuncChange = (newFunc: string) => {
        handleModifyParam(block.id, `${newFunc}, ${argument}`);
      };
      const handleArgChange = (newArg: string) => {
        handleModifyParam(block.id, `${func}, ${newArg}`);
      };

      const funcs = ['abs', 'floor', 'ceiling', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'e^', '10^'];
      
      return (
        <div className="flex items-center gap-1 flex-wrap text-xs font-bold" onClick={(e) => e.stopPropagation()}>
          <select
            value={func}
            onChange={(e) => handleFuncChange(e.target.value)}
            className="bg-black/45 rounded text-white py-0.5 px-1 bg-[#14161f] text-[10px] font-bold focus:ring-1 focus:ring-emerald-400"
          >
            {funcs.map(f => (
               <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <span>of</span>
          <input
            type="text"
            value={argument}
            onChange={(e) => handleArgChange(e.target.value)}
            className="w-16 bg-black/40 text-white font-mono rounded px-1.5 py-0.5 text-[10px] font-bold focus:ring-1 focus:ring-emerald-400 text-center"
            placeholder="-10"
          />
        </div>
      );
    }

    // Default fallback line label
    return <span>{block.text}</span>;
  };

  return (
    <div className="fixed inset-0 bg-[#0f1115]/98 z-50 flex flex-col font-sans text-gray-200">
      
      {/* 1. TOP HEADER TOOLBAR BUTTONS */}
      <div className="px-3 sm:px-5 py-2.5 sm:py-3 bg-[#181a21] border-b border-zinc-800 flex flex-col xs:flex-row gap-2.5 xs:gap-0 justify-between items-center select-none shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-cyan-500 rounded flex items-center justify-center shadow-lg transform -rotate-3 border border-cyan-400 shrink-0">
            <span className="text-zinc-950 font-black text-xs leading-none">2D</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-xs sm:text-sm tracking-wide text-white uppercase">
                Arcade No-Code Studio
              </h3>
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono animate-pulse">
                v1.2 Sandbox
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium hidden sm:block">Inspired by Scratch & Blocky drag compilers</p>
          </div>
        </div>

        {/* Play/Control panel triggers */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* Green flag block indicator */}
          <button
            onClick={handleGreenFlag}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded font-bold text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition-all shadow-md cursor-pointer ${isRunning ? 'bg-emerald-600 text-white border border-emerald-400 scale-105 font-bold' : 'bg-zinc-800 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20'}`}
            title="Compile visual stack and execute Green Flag Event"
          >
            <Play fill="currentColor" size={11} className="text-emerald-400 group-hover:text-white" />
            <span>Go Flag</span>
          </button>

          <button
            onClick={handleStopAll}
            className={`px-2.5 sm:px-3 py-1.5 rounded font-bold text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${!isRunning ? 'bg-zinc-800 text-zinc-650 border border-zinc-900 pointer-events-none' : 'bg-rose-500 hover:bg-rose-600 text-white border border-rose-400 animate-pulse font-bold'}`}
            title="Stop all active active blocks immediately"
          >
            <Square fill="currentColor" size={9} className="text-rose-500" />
            <span>Stop All</span>
          </button>

          <div className="h-5 w-[1px] bg-zinc-800 hidden md:block" />

          {/* Publish Game Button */}
          <button
            onClick={() => {
              setIsPublished(false);
              setShowPublishModal(true);
              playWebBeep(750, 0.15, 'triangle');
            }}
            className="p-1 px-2 sm:px-2.5 bg-cyan-500 hover:bg-cyan-400 border border-cyan-300 text-zinc-950 font-black rounded transition-all cursor-pointer text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
          >
            <Sparkles size={11} className="fill-zinc-950" /> <span className="hidden xxs:inline">Publish AST Game</span><span className="xxs:hidden">Publish</span>
          </button>

          {/* Close Editor Studio */}
          <button
            onClick={onClose}
            className="p-1 px-2 bg-zinc-800 hover:bg-rose-600 hover:border-rose-400 text-zinc-400 hover:text-white rounded border border-zinc-700 transition-colors cursor-pointer text-[10px] sm:text-xs font-bold font-mono flex items-center gap-1 shrink-0"
          >
            <X size={12} /> <span className="hidden sm:inline">Close Creator</span><span className="sm:hidden">Close</span>
          </button>
        </div>
      </div>

      {/* MOBILE PANEL TABS SWITCHER */}
      <div className="flex md:hidden bg-[#14161f] border-b border-zinc-800 p-1 shrink-0 select-none">
        <button 
          onClick={() => { setActiveTab2D('toolbox'); playWebBeep(450, 0.05); }}
          className={`flex-1 py-1.5 text-center text-[10px] sm:text-xs font-bold rounded transition-colors flex items-center justify-center gap-1 ${activeTab2D === 'toolbox' ? 'bg-cyan-500 text-zinc-950 font-black' : 'text-zinc-400 hover:text-white'}`}
        >
          🧩 Toolbox
        </button>
        <button 
          onClick={() => { setActiveTab2D('workspace'); playWebBeep(455, 0.05); }}
          className={`flex-1 py-1.5 text-center text-[10px] sm:text-xs font-bold rounded transition-colors flex items-center justify-center gap-1 ${activeTab2D === 'workspace' ? 'bg-indigo-500 text-white font-black' : 'text-zinc-400 hover:text-white'}`}
        >
          ⚙️ Workspace ({workspaceBlocks.length})
        </button>
        <button 
          onClick={() => { setActiveTab2D('stage'); playWebBeep(460, 0.05); }}
          className={`flex-1 py-1.5 text-center text-[10px] sm:text-xs font-bold rounded transition-colors flex items-center justify-center gap-1 ${activeTab2D === 'stage' ? 'bg-emerald-600 text-white font-black' : 'text-zinc-400 hover:text-white'}`}
        >
          🎬 Live Stage
        </button>
      </div>
 
      {/* 2. CORE WORKSPACE PANELS SPLIT GRID */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-[#0f1115]">
        
        {/* PANEL A: BLOCK TOOLBOX (LEFT PANEL) */}
        <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col min-h-0 scrollbar-none select-none ${activeTab2D === 'toolbox' ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-3 bg-[#14161f] border-b border-zinc-800 shrink-0">
            <h5 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 font-mono">
              🧩 1. Block Blueprint Toolbox
            </h5>
            <p className="text-[9px] text-zinc-500 mt-0.5 leading-relaxed">
              Click elements below to snap them into your visual program stack.
            </p>
          </div>

          <div className="flex-1 p-3.5 overflow-y-auto space-y-4 font-sans select-none scrollbar-thin scrollbar-thumb-zinc-800">
            {/* Group events */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-amber-500 block">Events logic</span>
              <div className="space-y-1.5">
                {TOOLBOX_BLOCKS.filter(b => b.category === 'events').map(b => (
                  <div
                    key={b.id}
                    onClick={() => handleAddBlock(b)}
                    className="p-2 border rounded-md text-[11px] font-bold cursor-pointer transition-transform transform active:scale-95 flex justify-between items-center group shadow-sm hover:translate-x-0.5 bg-amber-500 border-amber-400 text-zinc-950 font-sans"
                  >
                    <span>{b.text}</span>
                    <Plus size={12} className="opacity-60 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>

            {/* Group motion */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-blue-400 block">Motion & coordinates</span>
              <div className="space-y-1.5">
                {TOOLBOX_BLOCKS.filter(b => b.category === 'motion').map(b => (
                  <div
                    key={b.id}
                    onClick={() => handleAddBlock(b)}
                    className="p-2 border rounded-md text-[11px] font-bold cursor-pointer transition-transform transform active:scale-95 flex justify-between items-center group shadow-sm hover:translate-x-0.5 bg-blue-500 border-blue-400 text-white font-sans"
                  >
                    <span>{b.text}</span>
                    <Plus size={12} className="opacity-60 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>

            {/* Group control */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-orange-400 block">Control Loops</span>
              <div className="space-y-1.5">
                {TOOLBOX_BLOCKS.filter(b => b.category === 'control').map(b => (
                  <div
                    key={b.id}
                    onClick={() => handleAddBlock(b)}
                    className="p-2 border rounded-md text-[11px] font-bold cursor-pointer transition-transform transform active:scale-95 flex justify-between items-center group shadow-sm hover:translate-x-0.5 bg-orange-500 border-orange-400 text-white font-sans"
                  >
                    <span>{b.text}</span>
                    <Plus size={12} className="opacity-60 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>

            {/* Group looks */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-indigo-400 block">Looks & Costumes</span>
              <div className="space-y-1.5">
                {TOOLBOX_BLOCKS.filter(b => b.category === 'looks').map(b => (
                  <div
                    key={b.id}
                    onClick={() => handleAddBlock(b)}
                    className="p-2 border rounded-md text-[11px] font-bold cursor-pointer transition-transform transform active:scale-95 flex justify-between items-center group shadow-sm hover:translate-x-0.5 bg-indigo-500 border-indigo-400 text-white font-sans"
                  >
                    <span>{b.text}</span>
                    <Plus size={12} className="opacity-60 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>

            {/* Group sound */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-pink-500 block">Sound synthers</span>
              <div className="space-y-1.5">
                {TOOLBOX_BLOCKS.filter(b => b.category === 'sound').map(b => (
                  <div
                    key={b.id}
                    onClick={() => handleAddBlock(b)}
                    className="p-2 border rounded-md text-[11px] font-bold cursor-pointer transition-transform transform active:scale-95 flex justify-between items-center group shadow-sm hover:translate-x-0.5 bg-pink-500 border-pink-400 text-white font-sans"
                  >
                    <span>{b.text}</span>
                    <Plus size={12} className="opacity-60 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>

            {/* Group variables & lists */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-orange-500 block">Variables & Lists</span>
              <div className="space-y-1.5">
                {TOOLBOX_BLOCKS.filter(b => b.category === 'variables').map(b => (
                  <div
                    key={b.id}
                    onClick={() => handleAddBlock(b)}
                    className="p-2 border rounded-md text-[11px] font-bold cursor-pointer transition-transform transform active:scale-95 flex justify-between items-center group shadow-sm hover:translate-x-0.5 bg-[#ff8c1a] border-[#ffab55] text-white font-sans"
                  >
                    <span>{b.text}</span>
                    <Plus size={12} className="opacity-60 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>

            {/* Group sensing */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-cyan-400 block">Sensing Queries</span>
              <div className="space-y-1.5">
                {TOOLBOX_BLOCKS.filter(b => b.category === 'sensing').map(b => (
                  <div
                    key={b.id}
                    onClick={() => handleAddBlock(b)}
                    className="p-2 border rounded-md text-[11px] font-bold cursor-pointer transition-transform transform active:scale-95 flex justify-between items-center group shadow-sm hover:translate-x-0.5 bg-cyan-500 border-cyan-400 text-white font-sans"
                  >
                    <span>{b.text}</span>
                    <Plus size={12} className="opacity-60 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>

            {/* Group operators */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-emerald-400 block">Operators Math & Text</span>
              <div className="space-y-1.5">
                {TOOLBOX_BLOCKS.filter(b => b.category === 'operators').map(b => (
                  <div
                    key={b.id}
                    onClick={() => handleAddBlock(b)}
                    className="p-2 border rounded-md text-[11px] font-bold cursor-pointer transition-transform transform active:scale-95 flex justify-between items-center group shadow-sm hover:translate-x-0.5 bg-emerald-500 border-emerald-400 text-white font-sans"
                  >
                    <span>{b.text}</span>
                    <Plus size={12} className="opacity-60 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PANEL B: CENTER WORKSPACE ASSEMBLY AREA (MIDDLE PANEL) */}
        <div className={`flex-1 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col min-h-0 bg-[#121319] ${activeTab2D === 'workspace' ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-3 bg-[#14161f] border-b border-zinc-800 shrink-0 flex justify-between items-center select-none">
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-widest text-[#a1a1aa] font-mono flex items-center gap-1.5">
                ⚙️ 2. Stacking workspace
              </h5>
              <p className="text-[9px] text-zinc-500 mt-0.5">Assemble program steps here. Blocks automatically compile on click.</p>
            </div>
            
            <button
              onClick={handleClearStack}
              className="text-[10px] font-semibold text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer border border-zinc-800 hover:border-rose-950 px-2 py-1 rounded bg-[#0b0c10]"
              title="Clear all blocks in workspace"
            >
              <Trash2 size={11} /> Clear All
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-2 select-none font-sans scrollbar-thin scrollbar-thumb-zinc-800">
            {workspaceBlocks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-800 rounded-lg max-w-sm mx-auto text-zinc-600 space-y-3 my-16">
                <div className="text-3xl animate-pulse">🧩</div>
                <div className="space-y-1">
                  <h6 className="font-bold text-xs text-zinc-400">Workspace Empty</h6>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Select block modules from the Toolbox panel to start stacking instructions for <strong className="text-cyan-400">{activeSprite.name}</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-1 bg-[#0b0c10]/40 p-4 rounded-xl border border-zinc-800/60 shadow-inner">
                {workspaceBlocks.map((block, idx) => (
                  <div key={block.id} className="relative group">
                    {/* Inter-block snapping visual puzzle notch layout */}
                    <div className="relative overflow-visible pb-1">
                      
                      {/* Jigsaw connector nub sticking out on top of each block */}
                      <div className="absolute top-[-6px] left-10 w-5 h-2 border-t border-x border-inherit z-10 rounded-t-md opacity-90 animate-pulse" 
                           style={{ backgroundColor: block.category === 'events' ? '#f59e0b' : block.category === 'motion' ? '#3b82f6' : block.category === 'control' ? '#f97316' : block.category === 'looks' ? '#6366f1' : block.category === 'variables' ? '#ff8c1a' : block.category === 'sensing' ? '#06b6d4' : block.category === 'operators' ? '#10b981' : '#ec4899' }} />

                      <div className={`p-2 rounded-lg border flex items-center justify-between shadow-md transition-all gap-3 ${getCategoryClass(block.category)} relative overflow-visible`}>
                        <div className="flex items-center gap-2 text-xs font-bold leading-none">
                          <span className="opacity-40 font-mono text-[9px] w-4">#{idx + 1}</span>
                          
                          {/* Render textual blocks with inline input controls for custom values! */}
                          {renderInteractiveBlockText(block)}
                        </div>

                        {/* Reordering and remove controls for professional Snap AST compiler */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveBlock(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 hover:bg-white/20 text-white rounded disabled:opacity-25 transition-all opacity-40 group-hover:opacity-100 font-mono text-[9px] font-bold cursor-pointer"
                            title="Shift Snap Block Up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleMoveBlock(idx, 'down')}
                            disabled={idx === workspaceBlocks.length - 1}
                            className="p-1 hover:bg-white/20 text-white rounded disabled:opacity-25 transition-all opacity-40 group-hover:opacity-100 font-mono text-[9px] font-bold cursor-pointer"
                            title="Shift Snap Block Down"
                          >
                            ▼
                          </button>
                          <button
                            onClick={() => handleRemoveBlock(block.id)}
                            className="p-1 hover:bg-white/25 text-white hover:text-rose-100 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Remove block"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Recessed puzzle gap receiver cutout bottom of each block */}
                      <div className="absolute bottom-[-1px] left-10 w-5 h-1.5 bg-[#121319] border-b border-x border-zinc-800 rounded-b-md z-15" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANEL C: STAGE CONTROLS & SPRITE INVENTORY (RIGHT PANEL) */}
        <div className={`w-full md:w-96 flex flex-col min-h-0 select-none bg-[#0c0d12] ${activeTab2D === 'stage' ? 'flex' : 'hidden md:flex'}`}>
          
          {/* Renders Canvas Frame */}
          <div className="p-3 bg-[#14161f] border-b border-zinc-800 shrink-0 select-none">
            <h5 className="text-[11px] font-bold uppercase tracking-widest text-[#a1a1aa] font-mono">
              🎬 3. Interactive Preview Stage
            </h5>
          </div>

          <div className="flex-1 p-4 flex flex-col justify-start items-center space-y-4">
            
            {/* The Simulation Screen Stage */}
            <div className="relative border-2 border-zinc-800 rounded bg-[#0b0c10] overflow-hidden shadow-2xl shrink-0 w-full aspect-video flex justify-center items-center">
              <canvas 
                ref={canvasRef} 
                className="max-w-full rounded bg-[#0b0c10]"
              />

              {/* Status overlay indicator pins */}
              <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-1 border border-zinc-800 rounded-md pointer-events-none select-none text-[8px] font-mono space-y-0.5 flex flex-col">
                <span className="flex items-center gap-1 text-zinc-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500 animate-ping' : 'bg-zinc-600'}`} />
                  {isRunning ? 'INTERPRETER ACTIVE' : 'STAGE READY'}
                </span>
                <span className="text-zinc-500">BOUNCE-CHECKS: <strong className="text-zinc-200">{bounceCount}</strong></span>
              </div>

              {/* Live Variables & Lists Overlays */}
              <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5 max-h-[85%] overflow-y-auto select-none pointer-events-auto pr-1">
                {/* Built-in Timer bubble */}
                <div className="bg-[#1e1e24]/90 border border-[#818cf8]/20 px-2 py-1 rounded text-[9px] font-mono text-[#818cf8] flex justify-between items-center gap-2">
                  <span className="text-zinc-400 font-bold">⏱️ timer:</span>
                  <span className="text-indigo-400 font-extrabold font-mono">{((Date.now() - timerStartTime.current) / 1000).toFixed(1)}s</span>
                </div>

                {/* Test Counter bubble */}
                <div className="bg-[#1e1e24]/90 border border-emerald-500/20 px-2 py-1 rounded text-[9px] font-mono text-emerald-400 flex justify-between items-center gap-2">
                  <span className="text-zinc-400 font-bold">🔢 counter:</span>
                  <span className="text-emerald-400 font-extrabold font-mono">{testCounter}</span>
                </div>

                {/* Visible variables */}
                {Object.keys(variables).map(name => {
                  if (!visibleVars[name]) return null;
                  return (
                    <div key={name} className="bg-[#2a1b10]/95 border border-[#ff8c1a]/40 px-2 py-1 rounded text-[9px] font-semibold flex items-center gap-2 shadow-lg">
                      <span className="text-zinc-250">{name}:</span>
                      <span className="bg-[#ff8c1a] text-white px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold">
                        {variables[name]}
                      </span>
                    </div>
                  );
                })}

                {/* Visible lists */}
                {Object.keys(scratchLists).map(name => {
                  if (!visibleLists[name]) return null;
                  const items = scratchLists[name] || [];
                  return (
                    <div key={name} className="bg-zinc-950/95 border border-[#ff8c1a]/55 p-1.5 rounded-md text-[9px] flex flex-col gap-1 w-36 shadow-xl text-left max-h-36 overflow-y-auto">
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-1 shrink-0 font-bold text-zinc-300">
                        <span>📋 {name}</span>
                        <span className="text-[8px] bg-[#ff8c1a] text-white px-1 rounded-sm">len: {items.length}</span>
                      </div>
                      <div className="space-y-0.5 max-h-24 overflow-y-auto font-mono text-[8px] scrollbar-thin scrollbar-thumb-zinc-800">
                        {items.length === 0 ? (
                          <span className="text-zinc-650 italic block px-1 py-0.5 text-center">empty</span>
                        ) : (
                          items.map((item, index) => (
                            <div key={index} className="flex gap-1.5 items-center bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">
                              <span className="text-zinc-500 border-r border-zinc-800 pr-1 w-4 text-center">{index + 1}</span>
                              <span className="truncate max-w-[100px] text-zinc-200 font-bold font-mono">{item ?? ''}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sprites Lists Manager */}
            <div className="w-full space-y-2 border-t border-zinc-800/80 pt-4 flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center shrink-0">
                <h6 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  👾 Active Costumes & Sprite Assets
                </h6>
                <button
                  onClick={() => {
                    const nextId = `s${sprites.length + 1}`;
                    const emojis = ['🦄', '🐼', '🤖', '🦊', '🐸', '🚀', '⭐', '🎈'];
                    const chosenEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    const newSprite: Sprite = {
                      id: nextId,
                      name: `Sprite-${sprites.length + 1}`,
                      emoji: chosenEmoji,
                      x: Math.floor(Math.random() * 120) - 60,
                      y: Math.floor(Math.random() * 80) - 40,
                      color: 'bg-indigo-600',
                    };
                    setSprites(prev => [...prev, newSprite]);
                    physicsState.current[nextId] = {
                      x: newSprite.x,
                      y: newSprite.y,
                      vx: (Math.random() * 3) - 1.5,
                      vy: (Math.random() * 3) - 1.5,
                      rotation: 0
                    };
                    setActiveSpriteId(nextId);
                    playWebBeep(720, 0.1, 'sine');
                  }}
                  className="px-2 py-0.5 border border-zinc-800 text-[9px] font-bold text-zinc-400 hover:text-white rounded bg-zinc-900 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  title="Create a random sprite costume asset"
                >
                  <Plus size={10} /> Add Emoji Sprite
                </button>
                <button
                  onClick={() => {
                    const defaultGrid = Array(16).fill(null).map(() => Array(16).fill('transparent'));
                    setDrawingPixels(defaultGrid);
                    setDrawingSpriteId(null);
                    setDrawingResolution(16);
                    setDrawingSpriteName(`CustomSprite-${sprites.length + 1}`);
                    setActiveBrushColor('#ec4899');
                    setActiveDrawingTool('Brush');
                    setDrawingUndoStack([]);
                    setDrawingRedoStack([]);
                    setIsDrawingBoardOpen(true);
                    playWebBeep(520, 0.1, 'sine');
                  }}
                  className="px-2 py-0.5 border border-cyan-500/40 text-[9px] font-bold text-cyan-400 hover:text-white rounded bg-cyan-950/20 hover:bg-cyan-950/40 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  title="Draw a custom pixel art sprite asset"
                >
                  🎨 Draw Sprite
                </button>
              </div>

              {/* Sprite items grids */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {sprites.map(sprite => {
                  const specs = physicsState.current[sprite.id] || { x: 0, y: 0 };
                  const isCurSelected = sprite.id === activeSpriteId;
                  
                  return (
                    <div
                      key={sprite.id}
                      onClick={() => {
                        setActiveSpriteId(sprite.id);
                        playWebBeep(550, 0.05, 'triangle');
                      }}
                      className={`flex justify-between items-center p-2 rounded border transition-all cursor-pointer select-none ${isCurSelected ? 'bg-cyan-950/40 border-cyan-500 text-white' : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        {sprite.customPixels ? (
                          <svg width={24} height={24} viewBox="0 0 24 24" className="rounded border border-zinc-700/60 shadow-sm overflow-hidden bg-zinc-950/40 shrink-0">
                            {sprite.customPixels.map((row: string[], rIdx: number) => 
                              row.map((color: string, cIdx: number) => {
                                if (color === 'transparent') return null;
                                const cellW = 24 / sprite.customPixels!.length;
                                const cellH = 24 / sprite.customPixels![0].length;
                                return (
                                  <rect
                                    key={`${rIdx}-${cIdx}`}
                                    x={cIdx * cellW}
                                    y={rIdx * cellH}
                                    width={cellW + 0.15}
                                    height={cellH + 0.15}
                                    fill={color}
                                  />
                                );
                              })
                            )}
                          </svg>
                        ) : (
                          <span className="text-lg select-none filter drop-shadow">{sprite.emoji}</span>
                        )}
                        <div>
                          <span className="text-xs font-semibold block">{sprite.name}</span>
                          <span className="text-[9px] font-mono text-zinc-500">x: {Math.round(specs.x)}  y: {Math.round(specs.y)}</span>
                        </div>
                      </div>

                      {/* Info label or action Edit */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const gridToEdit = sprite.customPixels ? sprite.customPixels.map(row => [...row]) : Array(16).fill(null).map(() => Array(16).fill('transparent'));
                            setDrawingPixels(gridToEdit);
                            setDrawingSpriteId(sprite.id);
                            setDrawingResolution(gridToEdit.length);
                            setDrawingSpriteName(sprite.name);
                            setDrawingUndoStack([]);
                            setDrawingRedoStack([]);
                            setIsDrawingBoardOpen(true);
                            playWebBeep(600, 0.1, 'sine');
                          }}
                          className="px-1.5 py-0.5 bg-zinc-800 hover:bg-cyan-900/30 hover:text-cyan-400 text-zinc-400 text-[8px] font-black uppercase rounded tracking-wider border border-zinc-700 transition-colors"
                          title="Open board to paint/edit this sprite asset pixels"
                        >
                          ✏️ edit
                        </button>
                        <span className="text-[8px] font-mono text-zinc-600 uppercase hidden sm:inline">
                          {isCurSelected ? 'Selected' : 'Idling'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 2D ARCADE WORKSPACE PUBLISHING MODAL OVERLAY */}
      {showPublishModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#141517] border border-cyan-500/30 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-3.5 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-cyan-400 animate-pulse" />
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">Publish Arcade Game</h3>
              </div>
              <button 
                onClick={() => {
                  setShowPublishModal(false);
                  setIsPublished(false);
                }}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body / Loading or Editing */}
            <div className="flex-1 p-4.5 space-y-4 overflow-y-auto">
               {isPublished ? (
                 /* Success View */
                 <div className="flex flex-col items-center justify-center text-center py-4 space-y-3.5">
                   <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-bounce">
                     <Check size={24} className="text-cyan-400" />
                   </div>
                   <div className="space-y-1">
                     <h4 className="text-sm font-bold text-white uppercase tracking-wide">Deployment Connected!</h4>
                     <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                       Your game <strong>"{pubTitle}"</strong> is compiled and live on the Arcade Feed!
                     </p>
                   </div>
                   
                   <div className="bg-zinc-900 border border-[#232527] rounded-lg p-2.5 text-left w-full space-y-1.5">
                     <div className="flex justify-between text-[10px] font-mono">
                       <span className="text-zinc-500">ID</span>
                       <span className="text-cyan-400 font-bold truncate max-w-[150px]">ast_{pubTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}</span>
                     </div>
                     <div className="flex justify-between text-[10px] font-mono">
                       <span className="text-zinc-500">ENGINE VERSION</span>
                       <span className="text-zinc-400">2D Workspace v1.2</span>
                     </div>
                     <div className="flex justify-between text-[10px] font-mono">
                       <span className="text-zinc-500">DISTRIBUTION</span>
                       <span className="text-emerald-400 font-bold uppercase flex items-center gap-1 text-[9px]">
                         <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                         Live on Catalog
                       </span>
                     </div>
                   </div>

                   <button
                     onClick={() => {
                       setShowPublishModal(false);
                       setIsPublished(false);
                       onClose(); // Close the editor so the user sees their game
                     }}
                     className="w-full py-1.5 bg-cyan-500 hover:bg-cyan-400 border border-cyan-300 text-zinc-950 font-extrabold text-xs rounded transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)] text-center flex items-center justify-center gap-1"
                   >
                     <Gamepad2 size={12} /> Play Published Game
                   </button>
                 </div>
               ) : (
                 /* Edit & Publish inputs view */
                 <>
                   <p className="text-[11px] text-zinc-400 leading-normal">
                     Review the game title, description, and catalog classification. Ready when you are!
                   </p>

                   {/* Title Input */}
                   <div className="space-y-1">
                     <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Game Title</label>
                     <input
                       type="text"
                       maxLength={35}
                       value={pubTitle}
                       onChange={(e) => setPubTitle(e.target.value)}
                       placeholder="e.g. My 2D Brick Run"
                       className="w-full bg-[#1c1d22] border border-zinc-800 focus:border-cyan-500 rounded p-1.5 text-xs text-white placeholder-zinc-650 focus:outline-none transition-all"
                     />
                   </div>

                   {/* Category Selection */}
                   <div className="space-y-1">
                     <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Category Classifier</label>
                     <div className="grid grid-cols-3 gap-1.5">
                       {['Arcade', 'Action', 'Survival', 'Puzzle', 'Bricks', 'Sandbox'].map((cat) => (
                         <button
                           key={cat}
                           onClick={() => setPubCategory(cat)}
                           className={`p-1 border rounded text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                             pubCategory === cat 
                               ? 'bg-cyan-950/40 border-cyan-500 text-white font-black' 
                               : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                           }`}
                         >
                           {cat}
                         </button>
                       ))}
                     </div>
                   </div>

                   {/* Description Input */}
                   <div className="space-y-1">
                     <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Experience Card Summary</label>
                     <textarea
                       maxLength={120}
                       rows={2}
                       value={pubDesc}
                       onChange={(e) => setPubDesc(e.target.value)}
                       placeholder="Enter catalog description..."
                       className="w-full bg-[#1c1d22] border border-zinc-800 focus:border-cyan-500 rounded p-1.5 text-xs text-white placeholder-zinc-650 focus:outline-none transition-all resize-none"
                     />
                   </div>

                   {/* Preview Card */}
                   <div className="rounded-lg bg-zinc-950/40 border border-[#232527] p-2 flex gap-2 w-full text-left">
                     <span className="text-xl filter drop-shadow select-none">🎮</span>
                     <div className="flex-1 min-w-0">
                       <h5 className="text-[11px] font-bold text-white truncate">{pubTitle || 'Untitled Game'}</h5>
                       <p className="text-[9px] text-zinc-500 truncate">{pubDesc || 'No summary configured.'}</p>
                     </div>
                   </div>
                 </>
               )}
            </div>

            {/* Modal Footer (only when and if not published yet) */}
            {!isPublished && (
              <div className="p-3 border-t border-zinc-850 bg-zinc-950/60 flex justify-end gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setShowPublishModal(false);
                    setIsPublished(false);
                  }}
                  className="px-2.5 py-1 hover:bg-zinc-800 hover:text-white rounded text-[9px] text-zinc-400 font-extrabold uppercase transition-colors cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={() => {
                    playWebBeep(600, 0.1, 'sine');
                    setTimeout(() => playWebBeep(900, 0.15, 'sine'), 100);

                    const randomPlayers = Math.floor(Math.random() * 5);
                    const randomUpvotes = 85 + Math.floor(Math.random() * 15);
                    const generatedId = `g_comp_${Date.now()}`;
                    const customGameObj = {
                      id: generatedId,
                      title: pubTitle,
                      thumbnail: "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=200&auto=format&fit=crop",
                      upvoteRatio: randomUpvotes,
                      activePlayers: randomPlayers,
                      creator: "GamerProX",
                      description: pubDesc,
                      category: pubCategory,
                      visits: 1,
                      createdAt: new Date().toISOString().split('T')[0],
                      is2D: true,
                    };

                    if (onPublish) {
                      onPublish(customGameObj);
                    }
                    setIsPublished(true);
                  }}
                  disabled={!pubTitle.trim()}
                  className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-500 border border-cyan-300 text-zinc-950 font-extrabold text-[9px] rounded uppercase transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                >
                  <Sparkles size={10} className="fill-zinc-950 animate-pulse" /> Launch Game
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 2D ARCADE SPRITE PIXEL DESIGNER STUDIO */}
      {isDrawingBoardOpen && (
        <div className="fixed inset-0 bg-[#09090b]/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4 font-sans select-none animate-fadeIn font-sans">
          <div className="w-full max-w-4xl bg-[#18181b] border border-cyan-500/40 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.2)] flex flex-col overflow-hidden max-h-[92vh]">
            
            {/* Header ribbon */}
            <div className="px-5 py-4 bg-[#0c0c0e] border-b border-zinc-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎨</span>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Arcade Pixel-Art Sprite Creator
                  </h3>
                  <p className="text-[10px] text-zinc-400">Paint custom tile textures and player costumes in real time</p>
                </div>
              </div>

              {/* Design parameters & resolutions */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-0.5 bg-[#121214] p-1 px-1.5 rounded border border-zinc-800">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mr-1">Grid Resolution:</span>
                    <span className="text-[10px] text-cyan-400 font-bold font-mono">{drawingResolution}²</span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[280px] justify-end">
                    {[8, 16, 24, 32, 48, 64, 96, 128].map((res) => (
                       <button
                         key={res}
                         onClick={() => {
                           playWebBeep(380, 0.05, 'triangle');
                           const oldRes = drawingResolution;
                           const confirmResize = drawingPixels.some(row => row.some(cell => cell !== 'transparent'));
                           
                           // Smart Upscale Nearest-Neighbor Resizing
                           const scaledGrid = Array(res).fill(null).map((_, newR) => {
                             return Array(res).fill(null).map((_, newC) => {
                               // Map coordinate proportionally
                               const oldR = Math.floor((newR / res) * oldRes);
                               const oldC = Math.floor((newC / res) * oldRes);
                               return drawingPixels[oldR]?.[oldC] || 'transparent';
                             });
                           });

                           saveDrawingHistory(drawingPixels);
                           setDrawingPixels(scaledGrid);
                           setDrawingResolution(res);
                           setDrawingUndoStack([]);
                           setDrawingRedoStack([]);
                         }}
                         className={`p-0.5 px-1.5 text-[8.5px] font-mono font-bold rounded cursor-pointer transition-all ${
                           drawingResolution === res 
                             ? 'bg-cyan-600 text-white' 
                             : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                         }`}
                         title={`Resize canvas to ${res}x${res} pixels (retains & scales current artwork!)`}
                       >
                         {res}
                       </button>
                    ))}
                  </div>
                </div>

                {/* Undo / Redo */}
                <div className="flex items-center gap-1 bg-[#121214] p-1 rounded border border-zinc-800">
                  <button
                    onClick={undoDrawing}
                    disabled={drawingUndoStack.length === 0}
                    className="p-1 px-2.5 rounded text-[10px] uppercase font-bold text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                    title="Undo paint"
                  >
                    ◀ Undo
                  </button>
                  <button
                    onClick={redoDrawing}
                    disabled={drawingRedoStack.length === 0}
                    className="p-1 px-2.5 rounded text-[10px] uppercase font-bold text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                    title="Redo paint"
                  >
                    Redo ▶
                  </button>
                </div>

                <button
                  onClick={() => { setIsDrawingBoardOpen(false); playWebBeep(300, 0.05, 'sine'); }}
                  className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Main Workshop Grid Body */}
            <div className="flex-1 flex overflow-hidden bg-[#0c0c0e]">
              
              {/* Left Hand: Painting tools toolbar */}
              <div className="w-56 border-r border-zinc-800 p-4 space-y-5 overflow-y-auto bg-[#101012] shrink-0">
                
                {/* Asset meta */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Sprite Label Name</label>
                  <input
                    type="text"
                    maxLength={20}
                    value={drawingSpriteName}
                    onChange={(e) => setDrawingSpriteName(e.target.value)}
                    className="w-full bg-[#16161a] border border-zinc-800 focus:border-cyan-500 rounded p-2 text-xs font-mono text-zinc-100 outline-none transition-all placeholder-zinc-600"
                    placeholder="e.g. LaserShield"
                  />
                </div>

                {/* Toolbox selection */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Tool Belt</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'Brush', name: '🖌️ Brush', desc: 'Draw pixel lines' },
                      { id: 'Eraser', name: '🧽 Eraser', desc: 'Wipe pixel spots' },
                      { id: 'Bucket', name: '🪣 Bucket', desc: 'Flood fill blocks' },
                      { id: 'Marquee', name: '🎯 Lasso', desc: 'Selection boundaries' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setActiveDrawingTool(t.id as any);
                          setMarqueeStart(null);
                          setMarqueeEnd(null);
                          playWebBeep(450, 0.05, 'sine');
                        }}
                        className={`p-2 py-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          activeDrawingTool === t.id 
                            ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md' 
                            : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                        }`}
                        title={t.desc}
                      >
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">{t.name}</span>
                        <span className="text-[8px] text-zinc-500 mt-0.5">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brush Size parameters (only for Brush / Eraser) */}
                {(activeDrawingTool === 'Brush' || activeDrawingTool === 'Eraser') && (
                  <div className="space-y-1.5 bg-zinc-900/40 p-2 border border-zinc-800/60 rounded-lg">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Brush Stroke Diameter</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4, 6, 8, 12, 16].map((bs) => (
                        <button
                          key={bs}
                          onClick={() => { setDrawingBrushSize(bs); playWebBeep(400, 0.04, 'sine'); }}
                          className={`p-1 rounded font-mono text-[9px] font-bold cursor-pointer transition-colors ${
                            drawingBrushSize === bs 
                              ? 'bg-[#18181b] text-cyan-400 border border-cyan-800/40' 
                              : 'bg-[#09090b]/40 border border-zinc-900/45 text-zinc-500 hover:text-zinc-300'
                          }`}
                          title={`Paint with a ${bs}x${bs} brush tip`}
                        >
                          {bs}px
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mirror / Transform Utilities */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Advanced Transforms</label>
                  <div className="grid grid-cols-2 gap-1.5 text-[9px] uppercase font-extrabold text-zinc-400 font-mono">
                    <button
                      onClick={() => {
                        saveDrawingHistory(drawingPixels);
                        const N = drawingPixels.length;
                        const rotated = Array(N).fill(null).map(() => Array(N).fill('transparent'));
                        for (let r = 0; r < N; r++) {
                          for (let c = 0; c < N; c++) {
                            rotated[c][N - 1 - r] = drawingPixels[r][c];
                          }
                        }
                        setDrawingPixels(rotated);
                        playWebBeep(480, 0.08, 'sine');
                      }}
                      className="p-2 border border-zinc-800 hover:border-zinc-700 bg-[#121214] hover:bg-zinc-800 hover:text-white rounded flex flex-col items-center gap-1 cursor-pointer transition-colors"
                      title="Rotate entire board 90 degrees clockwise"
                    >
                      <span>🔄 Rotate 90°</span>
                    </button>
                    <button
                      onClick={() => {
                        saveDrawingHistory(drawingPixels);
                        const mirrored = drawingPixels.map(row => [...row].reverse());
                        setDrawingPixels(mirrored);
                        playWebBeep(480, 0.08, 'sine');
                      }}
                      className="p-2 border border-zinc-800 hover:border-zinc-700 bg-[#121214] hover:bg-zinc-800 hover:text-white rounded flex flex-col items-center gap-1 cursor-pointer transition-colors"
                      title="Flip/Mirror drawing horizontally"
                    >
                      <span>↔️ Flip Horiz</span>
                    </button>
                    <button
                      onClick={() => {
                        saveDrawingHistory(drawingPixels);
                        const inverted = drawingPixels.map(row => row.map(color => {
                          if (color === 'transparent') return 'transparent';
                          // Standard HEX invert
                          if (color.startsWith('#')) {
                            const hex = color.replace('#', '');
                            const r = (255 - parseInt(hex.substring(0, 2), 16)).toString(16).padStart(2, '0');
                            const g = (255 - parseInt(hex.substring(2, 4), 16)).toString(16).padStart(2, '0');
                            const b = (255 - parseInt(hex.substring(4, 6), 16)).toString(16).padStart(2, '0');
                            return `#${r}${g}${b}`;
                          }
                          return color;
                        }));
                        setDrawingPixels(inverted);
                        playWebBeep(520, 0.1, 'sine');
                      }}
                      className="p-2 border border-zinc-800 hover:border-zinc-700 bg-[#121214] hover:bg-zinc-800 hover:text-white rounded flex flex-col items-center gap-1 cursor-pointer col-span-2 transition-colors"
                      title="Invert color hues on painted blocks"
                    >
                      <span>🎨 Invert Colors</span>
                    </button>
                  </div>
                </div>

                {/* Solid Clear Canvas Button */}
                <button
                  onClick={() => {
                    saveDrawingHistory(drawingPixels);
                    setDrawingPixels(Array(drawingResolution).fill(null).map(() => Array(drawingResolution).fill('transparent')));
                    setMarqueeStart(null);
                    setMarqueeEnd(null);
                    playWebBeep(250, 0.08, 'sawtooth');
                  }}
                  className="w-full py-2 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/60 text-rose-300 font-extrabold text-[10px] uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono"
                >
                  🗑️ Clear Board
                </button>

              </div>

              {/* Center Pane: Checkerboard drawing grid view */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#09090b] relative overflow-hidden">
                
                <div className="absolute top-4 left-4 text-[10px] text-zinc-500 font-mono">
                  {activeDrawingTool === 'Marquee' ? (
                    <span className="text-cyan-400">🚨 Drag box on grid to define marquee block bounds. Click below to clear or fill!</span>
                  ) : (
                    <span>💡 Press & Drag cells to paint blocks rapidly</span>
                  )}
                </div>

                 {/* Checkerboard container */}
                 <div 
                   className="relative border-4 border-zinc-800 rounded bg-[#16161a] overflow-hidden select-none hover:border-zinc-700/60 shadow-2xl transition-colors cursor-crosshair touch-none"
                   style={{
                     width: 'min(420px, 65vh)',
                     height: 'min(420px, 65vh)',
                     display: 'grid',
                     gridTemplateRows: `repeat(${drawingResolution}, 1fr)`,
                     gridTemplateColumns: `repeat(${drawingResolution}, 1fr)`,
                   }}
                   onMouseLeave={() => setIsPointerDrawing(false)}
                   onTouchStart={(e) => {
                     setIsPointerDrawing(true);
                     const touch = e.touches[0];
                     if (!touch) return;
                     const element = document.elementFromPoint(touch.clientX, touch.clientY);
                     if (!element) return;
                     const rAttr = element.getAttribute('data-row');
                     const cAttr = element.getAttribute('data-col');
                     if (rAttr !== null && cAttr !== null) {
                       const r = parseInt(rAttr, 10);
                       const c = parseInt(cAttr, 10);
                       paintCellAt(r, c, true);
                     }
                   }}
                   onTouchMove={(e) => {
                     if (!isPointerDrawing) return;
                     if (e.cancelable) e.preventDefault();
                     const touch = e.touches[0];
                     if (!touch) return;
                     const element = document.elementFromPoint(touch.clientX, touch.clientY);
                     if (!element) return;
                     const rAttr = element.getAttribute('data-row');
                     const cAttr = element.getAttribute('data-col');
                     if (rAttr !== null && cAttr !== null) {
                       const r = parseInt(rAttr, 10);
                       const c = parseInt(cAttr, 10);
                       paintCellAt(r, c, false);
                     }
                   }}
                   onTouchEnd={() => {
                     setIsPointerDrawing(false);
                   }}
                   onTouchCancel={() => {
                     setIsPointerDrawing(false);
                   }}
                 >
                   {drawingPixels.map((rowArr, rIdx) => 
                     rowArr.map((colorVal, cIdx) => {
                       let isInsideMarquee = false;
                       if (marqueeStart && marqueeEnd) {
                         const minR = Math.min(marqueeStart.r, marqueeEnd.r);
                         const maxR = Math.max(marqueeStart.r, marqueeEnd.r);
                         const minC = Math.min(marqueeStart.c, marqueeEnd.c);
                         const maxC = Math.max(marqueeStart.c, marqueeEnd.c);
                         isInsideMarquee = rIdx >= minR && rIdx <= maxR && cIdx >= minC && cIdx <= maxC;
                       }
 
                       const isTransparent = colorVal === 'transparent';
                       const isCheckerOdd = (rIdx + cIdx) % 2 === 0;
 
                       return (
                         <div
                           key={`${rIdx}-${cIdx}`}
                           data-row={rIdx}
                           data-col={cIdx}
                           onMouseDown={() => {
                             setIsPointerDrawing(true);
                             paintCellAt(rIdx, cIdx, true);
                           }}
                           onMouseEnter={() => {
                             if (isPointerDrawing) {
                               paintCellAt(rIdx, cIdx, false);
                             }
                           }}
                           onMouseUp={() => {
                             setIsPointerDrawing(false);
                           }}
                           className="relative w-full h-full select-none"
                           style={{
                             backgroundColor: isTransparent 
                               ? (isCheckerOdd ? '#27272a' : '#18181b') 
                               : colorVal,
                           }}
                         >
                           <div 
                             className={`absolute inset-0 pointer-events-none hover:bg-white/5 transition-colors duration-100 ${
                                drawingResolution <= 24
                                  ? 'border-[0.5px] border-zinc-700/30'
                                  : drawingResolution <= 48
                                  ? 'border-[0.3px] border-zinc-700/20'
                                  : drawingResolution <= 64
                                  ? 'border-[0.15px] border-zinc-700/10'
                                  : 'border-0'
                              }`}
                             data-row={rIdx}
                             data-col={cIdx}
                           />
                           {isInsideMarquee && (
                             <div className="absolute inset-0 bg-amber-500/10 border border-dashed border-amber-400 pointer-events-none z-10" />
                           )}
                         </div>
                       );
                     })
                   )}
                 </div>

                {/* Selection helper toolbar */}
                {activeDrawingTool === 'Marquee' && marqueeStart && marqueeEnd && (
                  <div className="mt-4 flex items-center gap-3 bg-[#111114] border border-amber-900/40 p-2 px-3 rounded-lg animate-fadeIn text-[9px] font-mono text-zinc-300 z-40">
                    <span className="text-amber-400 font-extrabold uppercase tracking-wider">⚡ Lasso Tool Options:</span>
                    <button
                      onClick={() => {
                        saveDrawingHistory(drawingPixels);
                        const minR = Math.min(marqueeStart.r, marqueeEnd.r);
                        const maxR = Math.max(marqueeStart.r, marqueeEnd.r);
                        const minC = Math.min(marqueeStart.c, marqueeEnd.c);
                        const maxC = Math.max(marqueeStart.c, marqueeEnd.c);
                        const gridCopy = drawingPixels.map((row, r) => row.map((color, c) => {
                          if (r >= minR && r <= maxR && c >= minC && c <= maxC) {
                            return activeBrushColor;
                          }
                          return color;
                        }));
                        setDrawingPixels(gridCopy);
                        playWebBeep(520, 0.08, 'sine');
                      }}
                      className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900 text-amber-300 rounded border border-amber-800 tracking-wider uppercase font-extrabold transition-colors"
                    >
                      Fill Bounds
                    </button>
                    <button
                      onClick={() => {
                        saveDrawingHistory(drawingPixels);
                        const minR = Math.min(marqueeStart.r, marqueeEnd.r);
                        const maxR = Math.max(marqueeStart.r, marqueeEnd.r);
                        const minC = Math.min(marqueeStart.c, marqueeEnd.c);
                        const maxC = Math.max(marqueeStart.c, marqueeEnd.c);
                        const gridCopy = drawingPixels.map((row, r) => row.map((color, c) => {
                          if (r >= minR && r <= maxR && c >= minC && c <= maxC) {
                            return 'transparent';
                          }
                          return color;
                        }));
                        setDrawingPixels(gridCopy);
                        playWebBeep(300, 0.05, 'sawtooth');
                      }}
                      className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded border border-rose-900 tracking-wider uppercase font-extrabold transition-colors"
                    >
                      Clear Area
                    </button>
                    <button
                      onClick={() => {
                        setMarqueeStart(null);
                        setMarqueeEnd(null);
                        playWebBeep(350, 0.05, 'sine');
                      }}
                      className="px-2 py-1 bg-zinc-850 hover:bg-zinc-805 text-zinc-400 rounded transition-colors uppercase font-extrabold"
                    >
                      Deselect
                    </button>
                  </div>
                )}

              </div>

              {/* Right Hand: Palette selectors */}
              <div className="w-52 border-l border-zinc-800 p-4 space-y-5 overflow-y-auto bg-[#101012] shrink-0">
                
                {/* Live selection block preview */}
                <div className="p-3 bg-zinc-950/50 border border-zinc-800/80 rounded-lg flex flex-col items-center font-mono space-y-2">
                  <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Brush Fill</div>
                  <div 
                    className="w-8 h-8 rounded border border-zinc-700/60 shadow-lg ring-2 ring-zinc-900"
                    style={{ backgroundColor: activeBrushColor }}
                  />
                  <div className="text-[10px] text-[#06b6d4] font-bold">{activeBrushColor}</div>
                </div>

                {/* Custom HEX choice */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Custom Input</label>
                  <div className="flex gap-1.5">
                    <input
                      type="color"
                      value={activeBrushColor.startsWith('#') ? activeBrushColor : '#000000'}
                      onChange={(e) => setActiveBrushColor(e.target.value)}
                      className="w-10 h-8 rounded bg-[#16161a] border border-zinc-800 outline-none p-0.5 cursor-pointer shrink-0"
                      title="Click to choose a color"
                    />
                    <input
                      type="text"
                      value={activeBrushColor}
                      onChange={(e) => setActiveBrushColor(e.target.value)}
                      className="flex-1 min-w-0 bg-[#16161a] border border-zinc-800 focus:border-cyan-500 rounded px-2.5 text-xs font-mono text-zinc-100 outline-none transition-all placeholder-zinc-650"
                      placeholder="#ffffff"
                      maxLength={20}
                    />
                  </div>
                </div>

                {/* Interactive Color Wheel */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Color Wheel Picker</label>
                  <div className="relative w-[130px] h-[130px] mx-auto bg-zinc-950 rounded-full p-1 border border-zinc-805/80 shadow-inner group select-none">
                    <div 
                      className="w-full h-full rounded-full cursor-crosshair relative overflow-hidden touch-none"
                      style={{
                        background: 'conic-gradient(from 0deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                      }}
                      onPointerDown={startWheelDrag}
                      onPointerMove={moveWheelDrag}
                      onPointerUp={endWheelDrag}
                      onPointerLeave={endWheelDrag}
                    >
                      <div 
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
                        }}
                      />
                    </div>
                    {/* Position indicator handle */}
                    {(() => {
                      const { h, s } = hexToHsl(activeBrushColor);
                      const angleRad = (h * Math.PI) / 180;
                      const maxKnobR = 58; 
                      const knobDist = (s / 100) * maxKnobR;
                      const knobX = 65 + knobDist * Math.cos(angleRad);
                      const knobY = 65 + knobDist * Math.sin(angleRad);
                      return (
                        <div 
                          className="absolute w-3.5 h-3.5 bg-white border-2 border-zinc-950 rounded-full shadow-lg pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-colors duration-75 ring-1 ring-white/40"
                          style={{
                            left: `${knobX}px`,
                            top: `${knobY}px`,
                          }}
                        />
                      );
                    })()}
                  </div>
                </div>

                {/* Fast palettes grids */}
                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Color Palette</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      'transparent', '#ffffff', '#a1a1aa', '#18181b', // Neutrals
                      '#ef4444', '#f97316', '#eab308', '#22c55e', // Hot Warm
                      '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', // Cosmic Neon
                      '#f43f5e', '#a855f7', '#7c2d12', '#14532d'  // Gems
                    ].map((hexColor, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => { setActiveBrushColor(hexColor); playWebBeep(450, 0.04, 'sine'); }}
                        className={`w-7 h-7 rounded border relative transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                          activeBrushColor === hexColor 
                            ? 'border-white ring-2 ring-cyan-500 z-10 scale-105' 
                            : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                        style={{ 
                          backgroundColor: hexColor === 'transparent' ? undefined : hexColor,
                          backgroundImage: hexColor === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : undefined,
                          backgroundSize: hexColor === 'transparent' ? '8px 8px' : undefined,
                          backgroundPosition: hexColor === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined
                        }}
                        title={hexColor === 'transparent' ? 'Transparent Eraser block' : hexColor}
                      >
                        {hexColor === 'transparent' && (
                          <div className="absolute inset-0 flex items-center justify-center text-[8px] bg-red-600/10 font-bold text-red-500 select-none font-mono">❌</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#16161a] p-2.5 rounded border border-zinc-800/80 text-[8.5px] leading-relaxed text-zinc-500 space-y-1 font-mono">
                  <div className="font-extrabold text-[#06b6d4] uppercase tracking-wider">💡 Canvas Tip:</div>
                  <p>Transparent "❌" lets you paint holes/transparencies inside your sprite shapes!</p>
                </div>

              </div>

            </div>

            {/* Footer ribbon actions */}
            <div className="px-5 py-3.5 bg-[#0c0c0e] border-t border-zinc-800 flex justify-between items-center shrink-0">
              <div className="text-[10px] font-mono text-zinc-500">
                {drawingSpriteId ? (
                  <span>🔧 Editing Sprite Slot: <span className="text-zinc-300 font-bold">{drawingSpriteId}</span></span>
                ) : (
                  <span>➕ Painting New Sprite Costume</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setIsDrawingBoardOpen(false); playWebBeep(320, 0.05, 'sine'); }}
                  className="px-4 py-2 hover:bg-zinc-800 rounded font-bold text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const finalName = drawingSpriteName.trim() || 'DrawnSprite';
                    playWebBeep(650, 0.15, 'sine');

                    if (drawingSpriteId) {
                      // Save edits to existing sprite id
                      setSprites(prev => prev.map(s => {
                        if (s.id === drawingSpriteId) {
                          return {
                            ...s,
                            name: finalName,
                            customPixels: drawingPixels.map(row => [...row])
                          };
                        }
                        return s;
                      }));
                    } else {
                      // Save as a brand-new sprite
                      const nextId = `drawn_${Date.now()}`;
                      const newSprite: Sprite = {
                        id: nextId,
                        name: finalName,
                        emoji: '🎨', // thumbnail placeholder fallback
                        x: Math.round((Math.random() * 100) - 50),
                        y: Math.round((Math.random() * 80) - 40),
                        color: 'bg-cyan-500',
                        customPixels: drawingPixels.map(row => [...row])
                      };
                      
                      setSprites(prev => [...prev, newSprite]);
                      
                      physicsState.current[nextId] = {
                        x: newSprite.x,
                        y: newSprite.y,
                        vx: (Math.random() * 2) - 1,
                        vy: (Math.random() * 2) - 1,
                        rotation: 0
                      };
                      setActiveSpriteId(nextId);
                    }
                    setIsDrawingBoardOpen(false);
                  }}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black text-xs rounded shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5 border border-cyan-300"
                >
                  Apply & Save Sprite Costume
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
