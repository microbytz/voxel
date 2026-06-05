import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Message } from '../types';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  User, 
  AlertCircle, 
  ArrowLeft,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';

interface MessagesTabProps {
  messages: Message[];
  setMessages: (msgs: Message[] | ((prev: Message[]) => Message[])) => void;
  userName: string;
  blockedUsers?: string[];
  onToggleBlock?: (name: string) => void;
}

export default function MessagesTab({
  messages,
  setMessages,
  userName,
  blockedUsers = [],
  onToggleBlock
}: MessagesTabProps) {
  const [selectedMessageId, setSelectedMessageId] = useState<string>(messages[0]?.id || "");
  const [replyText, setReplyText] = useState("");
  const [isChatActiveMobile, setIsChatActiveMobile] = useState<boolean>(false);

  // --- VOXEL SPATIAL AUDIO CALL SIMULATOR ---
  const [activeCall, setActiveCall] = useState<{
    status: 'dialing' | 'connected' | 'ended';
    senderName: string;
    senderColor: string;
    username: string;
    duration: number;
    isMuted: boolean;
    isDeafened: boolean;
  } | null>(null);

  const [callNotes, setCallNotes] = useState<Array<{ sender: string; text: string; time: string }>>([]);
  const [npcIsTyping, setNpcIsTyping] = useState(false);

  const activeChat = messages.find(m => m.id === selectedMessageId) || messages[0];

  // Auto-scroll call logs container
  React.useEffect(() => {
    const el = document.getElementById('call-transcript-container');
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [callNotes, npcIsTyping]);

  // Duration counter when call is live
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeCall && activeCall.status === 'connected') {
      interval = setInterval(() => {
        setActiveCall(prev => {
          if (prev && prev.status === 'connected') {
            return { ...prev, duration: prev.duration + 1 };
          }
          return prev;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall?.status]);

  // Web Audio Synthesizer Player factory
  const playTone = (freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  const playTelephoneRing = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playPulse = (startOffset: number) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.frequency.setValueAtTime(440, ctx.currentTime + startOffset);
        osc1.type = 'sine';
        osc2.frequency.setValueAtTime(480, ctx.currentTime + startOffset);
        osc2.type = 'sine';
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + startOffset);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + startOffset + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startOffset + 0.75);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(ctx.currentTime + startOffset);
        osc2.start(ctx.currentTime + startOffset);
        osc1.stop(ctx.currentTime + startOffset + 0.8);
        osc2.stop(ctx.currentTime + startOffset + 0.8);
      };
      
      playPulse(0);
      playPulse(0.12);
    } catch (e) {
      console.warn("Audio failed to emit playTelephoneRing", e);
    }
  };

  const playConnectSfx = () => {
    playTone(523.25, 0.12, 'sine', 0.08); // C5
    setTimeout(() => playTone(659.25, 0.12, 'sine', 0.08), 120); // E5
    setTimeout(() => playTone(783.99, 0.25, 'sine', 0.08), 240); // G5
  };

  const playDisconnectSfx = () => {
    playTone(392.00, 0.15, 'sine', 0.08); // G4
    setTimeout(() => playTone(349.23, 0.15, 'sine', 0.08), 150); // F4
    setTimeout(() => playTone(261.63, 0.3, 'sine', 0.08), 300); // C4
  };

  const playNPCSpeechChime = () => {
    const randomFreq = 300 + Math.random() * 200;
    playTone(randomFreq, 0.06, 'triangle', 0.04);
  };

  const handleInitiateCall = (chat: any) => {
    if (activeCall) return; // call ongoing

    playTelephoneRing();

    setActiveCall({
      status: 'dialing',
      senderName: chat.sender,
      senderColor: chat.senderColor,
      username: chat.username,
      duration: 0,
      isMuted: false,
      isDeafened: false
    });

    setCallNotes([
      { sender: 'System Operator', text: `🔄 Establishing Voxel Secure WebRTC handshake with ${chat.sender}...`, time: 'Now' },
      { sender: 'System Operator', text: `📞 Ringing ${chat.sender}'s Voxel client...`, time: 'Now' }
    ]);

    const ringInterval = setInterval(() => {
      playTelephoneRing();
    }, 1800);

    setTimeout(() => {
      clearInterval(ringInterval);
      playConnectSfx();
      setActiveCall(prev => {
        if (prev && prev.status === 'dialing') {
          return { ...prev, status: 'connected' };
        }
        return prev;
      });

      const initialGreeting = getNPCGreeting(chat.sender);
      setCallNotes(prev => [
        ...prev,
        { sender: 'System Operator', text: `🟢 Call Connected! Spatial voice chat is active.`, time: 'Now' },
        { sender: chat.sender, text: initialGreeting, time: 'Now' }
      ]);
      triggerSpeechBeeps();
    }, 3200);
  };

  const triggerSpeechBeeps = () => {
    playNPCSpeechChime();
    setTimeout(playNPCSpeechChime, 100);
    setTimeout(playNPCSpeechChime, 200);
  };

  const getNPCGreeting = (sender: string) => {
    switch (sender) {
      case 'Builderman':
        return "Greetings developer! You caught me working right in my Voxel Studio sandbox. What features are you compiling today?";
      case 'Shedletsky':
        return "Hahaha! What's up gamer! I am currently dining on some crisp country fried chicken. What trade are we discussing?";
      case 'David.Baszucki':
        return "Hello colleague. It's a fantastic day to build. How can the core Voxel systems help you prototype today?";
      default:
        return "Hey! Awesome connection. Let's voice chat. What have you been building lately?";
    }
  };

  const handleHangUp = () => {
    playDisconnectSfx();
    setActiveCall(null);
    setCallNotes([]);
  };

  const speakToNPC = (text: string, tag: string) => {
    if (!activeCall || activeCall.status !== 'connected' || npcIsTyping) return;

    setCallNotes(prev => [
      ...prev,
      { sender: userName, text: text, time: 'Now' }
    ]);
    playTone(400, 0.08, 'sine', 0.06);

    setNpcIsTyping(true);

    setTimeout(() => {
      const partnerName = activeCall.senderName;
      const resp = getCallNPCResponse(partnerName, tag);
      
      setCallNotes(prev => [
        ...prev,
        { sender: partnerName, text: resp, time: 'Now' }
      ]);
      setNpcIsTyping(false);
      triggerSpeechBeeps();
    }, 1500);
  };

  const getCallNPCResponse = (npc: string, tag: string): string => {
    switch (npc) {
      case 'Builderman':
        if (tag === 'server') return "Certainly! Each place file automatically spins up a real-time multiplayer server node. Just click 'Publish' inside the Voxel Studio engine, and our telemetry handler takes care of matchmaking instantly!";
        if (tag === 'trade') return "Trading is managed by the economy system. Shedletsky holds some legendary limited hats like the Dominus series, check his trade hub queue.";
        if (tag === 'crossroads') return "Crossroads is a pristine benchmark! I'd love to join you, but Erik and I are busy patching sound spatializer layers. Good luck out there!";
        if (tag === 'erik') return "Erik Cassel was my co-founder and a brilliant system architect. His foundational physics brick anchor code is still what holds all our simulated worlds together today.";
        if (tag === 'robux') return "Generating simulated currency is capped by our developer sandbox. Keep building great creations, and gamepasses will reward you handsomely!";
        return "I am currently monitoring game statistics. Everything is solid!";

      case 'Shedletsky':
        if (tag === 'server') return "Servers? Builderman handles port forward protocols. I just love testing explosion mechanics with rocket physics, haha!";
        if (tag === 'trade') return "Yes! My classic fedoras and clockwork headphones are highly coveted. Make sure you pitch a fair Robux offset or matching rare limiteds!";
        if (tag === 'crossroads') return "Count me in! I will bring the Superball and Trowel tool to trap opponents. Prepare for massive brick debris!";
        if (tag === 'erik') return "An absolute legend. He coded the primitive engine architecture back when we called it DynaBlocks. Truly amazing legacy.";
        if (tag === 'robux') return "Ah, Robux! Let me inspect my catalog. Buy my fried chicken catalog sticker, and maybe we can talk transfers!";
        return "Always keep a fried chicken icon in your inventory for extra luck on trades!";

      case 'David.Baszucki':
        if (tag === 'server') return "Our global cloud infrastructure automatically scales container groups dynamically, keeping latency under 45ms for play sessions worldwide.";
        if (tag === 'trade') return "Our marketplace values creative ownership and fair trades. Ensure your account verification tags are complete under settings.";
        if (tag === 'crossroads') return "Crossroads represents the timeless charm of simple physics primitives. It is a fantastic showcase of user-generated action.";
        if (tag === 'erik') return "Erik was a wonderful technical partner and co-founder. His engineering philosophy of extreme simplicity and modularity guides our design daily.";
        if (tag === 'robux') return "Platform developers have earned millions through game monetization pools. Direct your passion into building premium obbies!";
        return "Thank you for contributing your awesome feedback and developing on our ecosystem!";

      default:
        if (tag === 'server') return "Hosting is super simple, just enable 'Allow Playing' in game options configurations!";
        if (tag === 'trade') return "I'm looking for high-value limited items. Send me a trade request on the dashboard!";
        if (tag === 'crossroads') return "Yes! I'm an expert crossroads defender. Meet me near the watchtower, and hold your sword high!";
        if (tag === 'erik') return "He was one of the grand master minds of modern digital playground engineering!";
        if (tag === 'robux') return "Haha, I wish I had more Robux too! Let's complete some daily quests to earn badges.";
        return "Let's play and build together soon! This call is super crystal clear.";
    }
  };

  const CALL_PROMPTS = [
    { text: "Can you help me host a Voxel server?", tag: "server" },
    { text: "Are there any rare trade items in your inventory?", tag: "trade" },
    { text: "Want to team up for crossroads matches?", tag: "crossroads" },
    { text: "Who is Erik Cassel?", tag: "erik" },
    { text: "Can you tip me some Robux pretty please?", tag: "robux" }
  ];

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isCompanionBlocked = activeChat && blockedUsers.some(bu => bu.toLowerCase() === activeChat.sender.toLowerCase());

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeChat || isCompanionBlocked) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Append user message
    setMessages(prev => prev.map(chat => {
      if (chat.id === activeChat.id) {
        return {
          ...chat,
          unread: false,
          messages: [
            ...chat.messages,
            { senderName: userName, text: replyText, time: timestamp }
          ]
        };
      }
      return chat;
    }));

    setReplyText("");

    // Hook a fun simulated automated response from the friend after 1 sec
    const replyingPartner = activeChat.sender;
    setTimeout(() => {
      setMessages(prev => prev.map(chat => {
        if (chat.id === activeChat.id) {
          const companionTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          return {
            ...chat,
            messages: [
              ...chat.messages,
              { 
                senderName: replyingPartner, 
                text: getMockReply(replyingPartner), 
                time: "Just now • " + companionTime 
              }
            ]
          };
        }
        return chat;
      }));
    }, 1200);
  };

  const getMockReply = (sender: string): string => {
    switch(sender) {
      case 'Builderman':
        return "That sounds epic! I'm adding your suggestions to the official API guidelines. Keep experimenting on Voxel Studio!";
      case 'Shedletsky':
        return "Haha nice one! Let me review my trade queue and check if I can ship over that Fedora to you.";
      case 'David.Baszucki':
        return "Excellent progress. We are committed to maintaining a robust, accessible developer playground. Have fun!";
      default:
        return "Awesome! Let's meet in natural disasters or Brookhaven neighborhood later.";
    }
  };

  return (
    <div className="w-full text-gray-200 p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans animate-fadeIn">
      
      {/* Tab Title */}
      <div className="pb-3 border-b border-[#393B3D]">
        <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
          📬 Inbox Communications
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Stay connected with friend lists and game developers on the platform.
        </p>
      </div>

      {messages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[480px] rounded border border-[#393B3D] overflow-hidden bg-[#232527]">
          
          {/* Left panel: List (4 cols) */}
          <div className={`md:col-span-4 border-r border-[#393B3D] flex flex-col overflow-y-auto bg-[#232527] h-full ${
            isChatActiveMobile ? 'hidden md:flex' : 'flex'
          }`}>
            {messages.map((chat) => {
              const isChatBlocked = blockedUsers.some(bu => bu.toLowerCase() === chat.sender.toLowerCase());
              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setSelectedMessageId(chat.id);
                    // Mark as read click
                    setMessages(prev => prev.map(m => m.id === chat.id ? { ...m, unread: false } : m));
                    setIsChatActiveMobile(true);
                  }}
                  className={`p-4 border-b border-[#393B3D]/60 cursor-pointer transition select-none relative ${
                    selectedMessageId === chat.id 
                      ? 'bg-[#323436]/60 border-l-4 border-l-white' 
                      : 'hover:bg-[#111214]/30'
                  } ${isChatBlocked ? 'opacity-70' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded ${chat.senderColor} text-gray-950 font-bold flex items-center justify-center text-xs shadow ${isChatBlocked ? 'grayscale opacity-50' : ''}`}>
                        {chat.sender.substring(0, 2).toUpperCase()}
                      </div>
                      {isChatBlocked && (
                        <span className="absolute -bottom-1 -right-1 text-[11px]" title="Blocked Player">🚫</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold text-xs truncate ${isChatBlocked ? 'line-through text-gray-500' : 'text-white'}`}>{chat.sender}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{chat.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-gray-455 truncate mt-1">
                        {isChatBlocked ? 'Communications silenced.' : chat.messages[chat.messages.length - 1]?.text}
                      </p>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {chat.unread && !isChatBlocked && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white shadow-md shadow-zinc-900" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right panel: Active Room (8 cols) */}
          <div className={`md:col-span-8 flex flex-col h-full overflow-hidden bg-[#111214] ${
            isChatActiveMobile ? 'flex' : 'hidden md:flex'
          }`}>
            {activeChat ? (
              <div className="flex flex-col h-full">
                {/* Active Chat Header */}
                <div className="p-3.5 bg-[#232527] border-b border-[#393B3D] flex justify-between items-center select-none">
                  <div className="flex items-center gap-3">
                    {/* Back Button for Mobile View */}
                    <button
                      type="button"
                      onClick={() => setIsChatActiveMobile(false)}
                      className="md:hidden p-1.5 rounded bg-[#323436] hover:bg-[#111214]/40 border border-[#393B3D] text-gray-300 hover:text-white transition cursor-pointer flex items-center justify-center mr-1"
                      title="Back to Inbox"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <div className={`w-8 h-8 rounded ${activeChat.senderColor} text-gray-950 font-bold flex items-center justify-center text-xs`}>
                      {activeChat.sender.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white pb-0.5 flex items-center gap-1.5">
                        {activeChat.sender}
                        {isCompanionBlocked && (
                          <span className="text-[9px] text-red-400 bg-red-950/40 border border-red-500/25 px-1.5 py-0.2 rounded font-black uppercase font-mono tracking-wider">
                            Blocked
                          </span>
                        )}
                      </h4>
                      <span className="text-[9px] text-gray-500 font-mono">{activeChat.username}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Simulated Voice Call Trigger */}
                    {!activeCall && (
                      <button
                        type="button"
                        disabled={isCompanionBlocked}
                        onClick={() => handleInitiateCall(activeChat)}
                        className={`p-1.5 px-3 flex items-center gap-1.5 rounded text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer active:scale-95 ${
                          isCompanionBlocked
                            ? 'bg-zinc-800/30 border-zinc-800 text-zinc-550 cursor-not-allowed'
                            : 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/30 text-emerald-400'
                        }`}
                        title="Simulate Spatial Voice Chat"
                      >
                        <Phone size={11} className="animate-bounce" />
                        <span>Call</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onToggleBlock && onToggleBlock(activeChat.sender)}
                      className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider transition border cursor-pointer active:scale-95 ${
                        isCompanionBlocked
                          ? 'bg-green-950/40 text-green-300 border-green-500/20 hover:bg-green-900/40'
                          : 'bg-red-950/40 text-red-300 border-red-500/20 hover:bg-red-900/40'
                      }`}
                    >
                      {isCompanionBlocked ? '🔓 Unblock' : '🚫 Block'}
                    </button>
                    <span className="text-[10px] bg-[#111214] border border-[#393B3D] px-2 py-0.5 rounded text-white flex items-center gap-1 font-mono hidden sm:inline-flex">
                      <CheckCircle2 size={10} className="text-[#34d399]" /> Secure Encryption
                    </span>
                  </div>
                </div>

                {activeCall && activeCall.senderName === activeChat.sender ? (
                  /* Spatial Voice Call Terminal Screen */
                  <div className="flex-1 bg-gradient-to-b from-[#1c1d22] to-[#0c0d0f] flex flex-col overflow-hidden p-4 md:p-6 relative gap-4 select-none">
                    {/* Absolute subtle glowing ambient circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

                    {/* Top Status Banner */}
                    <div className="flex items-center justify-between text-[9px] md:text-[10px] uppercase font-mono tracking-wider font-extrabold pb-2 border-b border-white/5 relative z-10 select-none">
                      <span className="text-emerald-400 flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Voxel Spatial Voice Stream
                      </span>
                      <span className="text-zinc-500 font-bold">Secure WebRTC Handshake</span>
                    </div>

                    {/* Main Wave and Avatar Section */}
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 justify-center py-2 md:py-4 relative z-10 select-none">
                      {/* Animated Pulsing Avatar Orb */}
                      <div className="relative shrink-0 flex items-center justify-center">
                        {/* Pulse waves */}
                        {activeCall.status === 'connected' && !activeCall.isMuted && (
                          <>
                            <div className="absolute w-20 h-20 rounded-full border border-emerald-500/20 animate-ping duration-1000" />
                            <div className="absolute w-28 h-28 rounded-full border border-emerald-500/10 animate-ping duration-1500" />
                          </>
                        )}
                        {activeCall.status === 'dialing' && (
                          <div className="absolute w-20 h-20 rounded-full border border-amber-500/20 animate-ping duration-1000" />
                        )}

                        <div className={`w-16 h-16 rounded-full ${activeCall.senderColor} text-zinc-950 font-black text-xl flex items-center justify-center shadow-2xl relative z-10 border-4 border-zinc-900`}>
                          {activeCall.senderName.substring(0, 2).toUpperCase()}
                        </div>

                        {/* Small badge */}
                        <span className="absolute bottom-0 right-0 bg-[#0d0e12] border border-[#393B3D] text-[8px] px-1 py-0.5 rounded-full font-black text-emerald-400 flex items-center gap-0.5 shadow relative z-20 font-mono">
                          {activeCall.status === 'connected' ? 'LIVE' : 'RING...'}
                        </span>
                      </div>

                      {/* Metadata summary */}
                      <div className="text-center md:text-left space-y-1 select-none">
                        <h3 className="text-sm font-black text-white">{activeCall.senderName}</h3>
                        <p className="text-[10px] text-gray-550 font-mono">{activeCall.username}</p>
                        
                        <div className="pt-0.5 flex items-center gap-2 justify-center md:justify-start">
                          {activeCall.status === 'connected' ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-mono font-black text-xs">
                              CONNECTED • {formatCallTime(activeCall.duration)}
                            </div>
                          ) : (
                            <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-500 font-mono font-black text-[10px] animate-pulse">
                              ESTABLISHING PROTOCOL...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Real-time Subtitles / Call Transcript Module */}
                    <div className="flex-1 bg-black/60 border border-[#3c3e42]/60 rounded-lg p-3 flex flex-col justify-between overflow-hidden relative z-10">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/5 mb-2 select-none">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Live Transcription</span>
                        {npcIsTyping && (
                          <span className="text-[8.5px] text-[#22d3ee] font-mono animate-pulse font-bold">
                            {activeCall.senderName} is talking...
                          </span>
                        )}
                      </div>

                      {/* Transcript content */}
                      <div id="call-transcript-container" className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin text-left max-h-[140px]">
                        {callNotes.map((note, index) => {
                          const isSystem = note.sender === 'System Operator';
                          const isNpc = note.sender === activeCall.senderName;
                          return (
                            <div key={index} className="text-[11px]">
                              {isSystem ? (
                                <p className="text-[#22d3ee] font-mono font-medium text-[10px] italic leading-normal bg-cyan-950/20 px-2 py-1 rounded border border-cyan-500/10">{note.text}</p>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className={`text-[8.5px] font-black font-mono tracking-wide ${isNpc ? 'text-amber-400' : 'text-gray-300'}`}>
                                    [{note.sender}]:
                                  </span>
                                  <p className={`p-2 rounded font-sans leading-normal text-xs ${
                                    isNpc ? 'bg-[#323436]/40 text-amber-100 border-l-2 border-amber-500' : 'bg-white/5 text-gray-200'
                                  }`}>
                                    {note.text}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Animated Sound Wave Graphics */}
                      {activeCall.status === 'connected' && !activeCall.isMuted && (
                        <div className="flex items-center justify-center gap-1 h-4 pt-2 mt-2 border-t border-white/5 select-none">
                          <div className={`w-0.5 bg-emerald-500 rounded-full transition-all duration-300 ${npcIsTyping ? 'animate-pulse h-3 bg-cyan-400' : 'h-1'}`} />
                          <div className={`w-0.5 bg-emerald-500 rounded-full transition-all duration-300 delay-75 ${npcIsTyping ? 'animate-pulse h-4 bg-cyan-400' : 'h-1'}`} />
                          <div className={`w-0.5 bg-emerald-500 rounded-full transition-all duration-300 delay-100 ${npcIsTyping ? 'animate-pulse h-2 bg-cyan-400' : 'h-1'}`} />
                          <div className={`w-0.5 bg-emerald-500 rounded-full transition-all duration-300 delay-150 ${npcIsTyping ? 'animate-pulse h-4 bg-cyan-400' : 'h-1'}`} />
                          <div className={`w-0.5 bg-emerald-500 rounded-full transition-all duration-300 delay-200 ${npcIsTyping ? 'animate-pulse h-3 bg-cyan-400' : 'h-1'}`} />
                        </div>
                      )}
                    </div>

                    {/* Interactive Quick Action Prompts */}
                    <div className="space-y-1.5 relative z-10 text-left">
                      <span className="block text-[9px] uppercase font-bold text-gray-500 tracking-wider font-mono">Speak to {activeCall.senderName}</span>
                      
                      <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto custom-scrollbar">
                        {CALL_PROMPTS.map((prompt) => (
                          <button
                            key={prompt.tag}
                            type="button"
                            disabled={activeCall.status !== 'connected' || npcIsTyping || activeCall.isMuted}
                            onClick={() => speakToNPC(prompt.text, prompt.tag)}
                            className={`p-1 px-2.5 rounded text-[10.5px] font-bold border transition select-none flex items-center justify-center ${
                              activeCall.status !== 'connected' || npcIsTyping || activeCall.isMuted
                                ? 'bg-zinc-800/20 border-zinc-900 text-zinc-650 cursor-not-allowed'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-gray-200 border-zinc-700 active:scale-95 cursor-pointer'
                            }`}
                          >
                            {prompt.text}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Controls Row */}
                    <div className="bg-[#1c1d22] border border-[#393B3D]/70 rounded-lg p-2 flex items-center justify-between relative z-10 select-none">
                      {/* Hardware options */}
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCall(p => p ? { ...p, isMuted: !p.isMuted } : p);
                            playTone(400, 0.05, 'triangle', 0.05);
                          }}
                          className={`w-8 h-8 rounded border flex items-center justify-center transition-all cursor-pointer ${
                            activeCall.isMuted 
                              ? 'bg-rose-950/60 border-rose-500/50 text-rose-300' 
                              : 'bg-[#111214] hover:bg-[#323436] border-white/5 text-gray-300 hover:text-white'
                          }`}
                          title={activeCall.isMuted ? "Unmute Microphone" : "Mute Microphone"}
                        >
                          {activeCall.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveCall(p => p ? { ...p, isDeafened: !p.isDeafened } : p);
                            playTone(350, 0.05, 'triangle', 0.05);
                          }}
                          className={`w-8 h-8 rounded border flex items-center justify-center transition-all cursor-pointer ${
                            activeCall.isDeafened 
                              ? 'bg-rose-950/60 border-rose-500/50 text-rose-300' 
                              : 'bg-[#111214] hover:bg-[#323436] border-white/5 text-gray-300 hover:text-white'
                          }`}
                          title={activeCall.isDeafened ? "Undeafen Audio" : "Deafen Audio"}
                        >
                          {activeCall.isDeafened ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                      </div>

                      {/* Hang Up Action button */}
                      <button
                        type="button"
                        onClick={handleHangUp}
                        className="h-8 px-4 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer border border-red-500/30 transition-all active:scale-95 shadow-md uppercase tracking-wider font-mono"
                      >
                        <PhoneOff size={12} />
                        <span>Hang Up</span>
                      </button>
                    </div>

                  </div>
                ) : (
                  <>
                    {/* Messages Streams */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col justify-end">
                      <div className="space-y-3.5 pr-1">
                        <AnimatePresence initial={false}>
                          {activeChat.messages.map((item, idx) => {
                            const isMe = item.senderName === userName;
                            const elementKey = `${idx}-${item.senderName}-${item.text.slice(0, 10)}`;
                            return (
                              <motion.div 
                                key={elementKey} 
                                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                className={`flex flex-col max-w-sm ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                              >
                                <span className="text-[9px] text-gray-550 font-mono mb-1">{item.senderName} • {item.time}</span>
                                <div 
                                  className={`p-3 rounded text-xs leading-relaxed ${
                                    isMe 
                                      ? 'bg-white text-black rounded-tr-none font-bold' 
                                      : 'bg-[#323436] border border-[#393B3D] text-gray-200 rounded-tl-none'
                                  }`}
                                >
                                  {item.text}
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Form Reply bar */}
                    {isCompanionBlocked ? (
                      <div className="p-4 bg-[#211616] border-t border-red-950/25 flex items-center gap-2 select-none text-red-400 select-none">
                        <AlertCircle size={15} className="shrink-0" />
                        <p className="text-[11px] font-bold">
                          You have blocked {activeChat.sender}. Unblock this player to resume conversations.
                        </p>
                      </div>
                    ) : (
                      <form 
                        onSubmit={handleSendReply}
                        className="p-3 bg-[#232527] border-t border-[#393B3D] flex gap-2"
                      >
                        <input
                          type="text"
                          required
                          placeholder={`Reply to ${activeChat.sender}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1 bg-[#111214] placeholder-gray-500 text-gray-200 text-xs px-3.5 py-2 rounded focus:outline-none focus:border-white border border-[#393B3D]"
                        />
                        <button
                          type="submit"
                          className="p-2 bg-[#111214] hover:bg-[#323436] text-white border border-[#393B3D] rounded cursor-pointer transition-colors active:scale-95"
                        >
                          <Send size={14} />
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500 flex-col gap-2 p-6 text-center">
                <MessageSquare size={32} />
                <p className="text-sm">No message thread selected.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="py-20 text-center space-y-2 bg-[#232527] border border-[#393B3D] rounded">
          <MessageSquare size={32} className="mx-auto text-zinc-600" />
          <p className="text-gray-400 font-semibold text-sm animate-pulse">Inbox has been completely cleared.</p>
        </div>
      )}

    </div>
  );
}
