import React, { useState, useEffect, useRef } from 'react';
import { Game, Friend } from '../types';
import { Play, RotateCcw, X, Volume2, Trophy, ArrowRight, Shield, Activity, Terminal, Flame, ShieldAlert, Send, WifiOff, UserCheck, Crown, Sliders, Zap, Users, Mic, MicOff, VolumeX, AlertTriangle, AlertCircle, Info, UserX } from 'lucide-react';
import { reportPlayerInDB, isPlayerBanned, getModerationDB, saveModerationDB, REPORT_CATEGORIES, isPlayerAdminBanned, submitAppealInDB, resolveAppealInDB, getActiveAppealsFromDB, adminBanPlayerInDB } from '../utils/moderation';

interface GameSimulatorProps {
  game: Game;
  onClose: () => void;
  avatarColor: string;
  skinColor: string;
  activeHats: string[]; // Hat emoji symbols
  friends: Friend[];
  onAddFriend?: (friend: Friend) => void;
  blockedUsers?: string[];
  onToggleBlock?: (name: string) => void;
  onUpdateGame?: (updatedGame: Game) => void;
}

export default function GameSimulator({ 
  game, 
  onClose,
  avatarColor,
  skinColor,
  activeHats,
  friends,
  onAddFriend,
  blockedUsers = [],
  onToggleBlock,
  onUpdateGame
}: GameSimulatorProps) {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [launchStep, setLaunchStep] = useState<number>(0);
  const [isPlayingCode, setIsPlayingCode] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem(`roblox_highscore_${game.id}`) || '0', 10);
  });

  const [isEditingDesc, setIsEditingDesc] = useState<boolean>(false);
  const [tempDesc, setTempDesc] = useState<string>(game.description || '');

  // Sync tempDesc when game changes
  useEffect(() => {
    setTempDesc(game.description || '');
  }, [game.description]);
  
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);
  
  // Camera View Mode: 1st person vs 3rd person
  const [cameraView, setCameraView] = useState<'3rd' | '1st'>('3rd');

  // Admin Commands (:cmds) state
  const [adminFly, setAdminFly] = useState<boolean>(false);
  const [adminFF, setAdminFF] = useState<boolean>(false);
  const [adminBighead, setAdminBighead] = useState<boolean>(false);

  // Disaster / Event toggles state ("Chaos Menu")
  const [chaosNoobs, setChaosNoobs] = useState<boolean>(false);
  const [chaosAcid, setChaosAcid] = useState<boolean>(false);
  const [chaosLag, setChaosLag] = useState<boolean>(false);

  // Game friend request simulating states
  const [gameFriendRequests, setGameFriendRequests] = useState<Record<string, 'none' | 'sending' | 'accepted'>>({});
  const [gameNotification, setGameNotification] = useState<string | null>(null);

  const handleGameSendFriendRequest = (player: { name: string; username: string; avatarColor: string; isOnline: boolean; status: string }) => {
    if (gameFriendRequests[player.name] && gameFriendRequests[player.name] !== 'none') return;
    
    // Play clicking tone
    playSound(700, 0.08, 'sine');
    
    setGameFriendRequests(prev => ({
      ...prev,
      [player.name]: 'sending'
    }));

    setGameNotification(`Sending friend request to ${player.name}...`);

    setTimeout(() => {
      setGameFriendRequests(prev => ({
        ...prev,
        [player.name]: 'accepted'
      }));

      setGameNotification(`🎉 ${player.name} accepted your friend request!`);

      // Play double-beep chime
      playSound(880, 0.1, 'sine');
      setTimeout(() => playSound(1100, 0.15, 'sine'), 100);

      const newFriend: Friend = {
        id: `friend_in_game_${Date.now()}_${player.name}`,
        name: player.name,
        username: player.username,
        avatarColor: player.avatarColor,
        isOnline: true,
        status: player.status
      };
      
      onAddFriend?.(newFriend);

      setTimeout(() => {
        setGameNotification(null);
      }, 3500);

    }, 2800);
  };

  // High-performance syncing refs for the critical AnimationFrame physics engine loop
  const adminRef = useRef({
    fly: false,
    ff: false,
    bighead: false,
    speedMultiplier: 1.0,
    gravityMultiplier: 1.0
  });

  const chaosRef = useRef({
    noobs: false,
    acid: false,
    lag: false
  });

  // Keep refs instantly updated alongside React states to prevent stale closure glitches in loop
  useEffect(() => {
    adminRef.current.fly = adminFly;
    adminRef.current.ff = adminFF;
    adminRef.current.bighead = adminBighead;
  }, [adminFly, adminFF, adminBighead]);

  useEffect(() => {
    chaosRef.current.noobs = chaosNoobs;
    chaosRef.current.acid = chaosAcid;
    chaosRef.current.lag = chaosLag;
    if (!chaosNoobs) {
      noobs3DRef.current = [];
      noobs2DRef.current = [];
    }
    if (!chaosAcid) {
      aciddrops3DRef.current = [];
      aciddrops2DRef.current = [];
    }
  }, [chaosNoobs, chaosAcid, chaosLag]);

  // Chat Auto-Scroll Anchor Ref
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Voxel Chat History (with initial system advice)
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; text: string; type: 'system' | 'normal' | 'admin'; createdAt?: number }>>([
    { id: 'c1', sender: 'System', text: 'Admin command console active! Type :cmds or click toggles.', type: 'system', createdAt: Date.now() },
    { id: 'c2', sender: 'Builderman', text: 'Welcome to the sandbox! Press / to quickly focus chat.', type: 'normal', createdAt: Date.now() },
    { id: 'c3', sender: 'Server', text: 'Classic Voxel Commands: :fly, :kill, :ff, :bighead', type: 'system', createdAt: Date.now() }
  ]);
  const [activeChatInput, setActiveChatInput] = useState<string>('');
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(true);
  const [isChaosMenuOpen, setIsChaosMenuOpen] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(true);

  // Player persistent moderation states
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportTargetName, setReportTargetName] = useState<string>('');
  const [reportReason, setReportReason] = useState<string>('Cheating / Exploiting');
  const [reportContext, setReportContext] = useState<string>('');
  const [reportsDBVersion, setReportsDBVersion] = useState<number>(0);

  // Appeal states and self-ban state
  const [isSelfBanned, setIsSelfBanned] = useState<boolean>(false);
  const [isSelfAdminBanned, setIsSelfAdminBanned] = useState<boolean>(false);
  const [userAppealText, setUserAppealText] = useState<string>('');
  const [isUserAppealFiled, setIsUserAppealFiled] = useState<boolean>(false);
  const [adminToast, setAdminToast] = useState<string | null>(null);
  const [liveAppeals, setLiveAppeals] = useState<any[]>([]);
  const [pendingAdminConfirm, setPendingAdminConfirm] = useState<{
    reportId: string;
    action: 'MUTED' | 'BANNED' | 'DISMISSED';
    targetName: string;
  } | null>(null);

  // Custom live list of players in the server (excludes banned ones on startup or in real-time)
  const [activeServerPlayers, setActiveServerPlayers] = useState<Array<{
    name: string;
    username: string;
    avatarColor: string;
    isOnline: boolean;
    status: string;
    score: number;
  }>>([
    { name: 'Builderman', username: '@builderman', avatarColor: 'bg-red-500', isOnline: true, status: 'Busy coding Voxel Studio...', score: 12 },
    { name: 'ErikCassel', username: '@erik_cassel', avatarColor: 'bg-indigo-600', isOnline: true, status: 'Testing physical brick anchors.', score: 38 },
    { name: 'Shedletsky', username: '@Shedletsky', avatarColor: 'bg-yellow-500', isOnline: true, status: 'Buying fried chicken parts.', score: 25 },
    { name: 'ClassyStud_08', username: '@classy08', avatarColor: 'bg-cyan-500', isOnline: true, status: 'Undefeated crossroads swordsman.', score: 14 }
  ]);

  // Voxel Spatial Voice Chat States
  const [isMicMuted, setIsMicMuted] = useState<boolean>(true);
  const [isVoiceChatMuted, setIsVoiceChatMuted] = useState<boolean>(false);
  const [activeVoiceSpeaker, setActiveVoiceSpeaker] = useState<string | null>(null);
  const [activeSpeakerText, setActiveSpeakerText] = useState<string>('');
  const [localMicVolume, setLocalMicVolume] = useState<number>(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);

  // Audio Context Ref and Media stream refs for Microphone integration
  const localAudioContextRef = useRef<AudioContext | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Microphone monitoring & real volume audio-context hooks
  useEffect(() => {
    if (!isMicMuted) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            localStreamRef.current = stream;
            try {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioCtx) {
                const ctx = new AudioCtx();
                localAudioContextRef.current = ctx;
                const source = ctx.createMediaStreamSource(stream);
                const analyzer = ctx.createAnalyser();
                analyzer.fftSize = 32;
                source.connect(analyzer);
                const dataArray = new Uint8Array(analyzer.frequencyBinCount);

                const trackVolume = () => {
                  if (ctx.state === 'closed') return;
                  analyzer.getByteFrequencyData(dataArray);
                  let sum = 0;
                  for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                  }
                  const avg = sum / dataArray.length;
                  setLocalMicVolume(avg);
                  setIsUserSpeaking(avg > 8);
                  animationFrameIdRef.current = requestAnimationFrame(trackVolume);
                };
                trackVolume();
              }
            } catch (e) {
              console.warn("Could not construct Web Audio mic node", e);
            }
          })
          .catch((err) => {
            console.warn("Microphone permission denied or device error. Simulating fallback.", err);
            const fallbackInterval = setInterval(() => {
              const fakeVol = Math.random() > 0.45 ? Math.floor(Math.random() * 22) + 4 : 0;
              setLocalMicVolume(fakeVol);
              setIsUserSpeaking(fakeVol > 7);
            }, 300);
            (localStreamRef as any)._fakeInterval = fallbackInterval;
          });
      }
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      if ((localStreamRef as any)._fakeInterval) {
        clearInterval((localStreamRef as any)._fakeInterval);
        (localStreamRef as any)._fakeInterval = null;
      }
      if (localAudioContextRef.current) {
        if (localAudioContextRef.current.state !== 'closed') {
          localAudioContextRef.current.close();
        }
        localAudioContextRef.current = null;
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      setLocalMicVolume(0);
      setIsUserSpeaking(false);
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if ((localStreamRef as any)._fakeInterval) {
        clearInterval((localStreamRef as any)._fakeInterval);
      }
      if (localAudioContextRef.current && localAudioContextRef.current.state !== 'closed') {
        localAudioContextRef.current.close();
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isMicMuted]);

  // Periodic simulated co-player voice speech loop
  useEffect(() => {
    const speechPhrases = [
      { sender: 'Builderman', text: "Classic Voxel Crossroads map physics look stunning here! Great work.", type: 'voice' },
      { sender: 'Shedletsky', text: "Who turned off the brick collision? Erik, did you anchor step 3?", type: 'voice' },
      { sender: 'ErikCassel', text: "The voxel geometry is calculated at local 60Hz. Standard stud coordinates are safe.", type: 'voice' },
      { sender: 'ClassyStud_08', text: "Lava steps are tricky! I've collected 3 developer stars so far.", type: 'voice' },
      { sender: 'Builderman', text: "Noob invasion cheat has been activated! Dodge the falling block avatars!", type: 'voice' },
      { sender: 'Shedletsky', text: "Oof! Who is raining acid? It's corroding my primary spawn plate!", type: 'voice' },
      { sender: 'ClassyStud_08', text: "Watch your step on platform 5, the edge has a high slip coefficient.", type: 'voice' },
      { sender: 'ErikCassel', text: "Make sure to unmute your spatial mic! I'd love to chat in-channel.", type: 'voice' }
    ];

    const voiceInterval = setInterval(() => {
      if (activeVoiceSpeaker) return;

      if (Math.random() > 0.35) {
        const item = speechPhrases[Math.floor(Math.random() * speechPhrases.length)];
        const isBlocked = blockedUsers?.some(bu => bu.toLowerCase() === item.sender.toLowerCase());
        if (isBlocked) return;

        // Walkie-Talkie Chirp-In Sound
        if (!isVoiceChatMuted) {
          playSound(980, 0.05, 'triangle');
          setTimeout(() => playSound(1400, 0.04, 'sine'), 50);
        }

        setActiveVoiceSpeaker(item.sender);
        setActiveSpeakerText(item.text);

        // Print transcription to Game Chat history
        setChatMessages(prev => [
          ...prev,
          {
            id: `voice_${Date.now()}_${Math.random()}`,
            sender: item.sender,
            text: `🎙️ [Spatial Voice] "${item.text}"`,
            type: 'normal',
            createdAt: Date.now()
          }
        ]);

        // TTS Playout
        if (!isVoiceChatMuted) {
          if ('speechSynthesis' in window) {
            try {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(item.text);
              if (item.sender === 'Builderman') {
                utterance.pitch = 1.05;
                utterance.rate = 1.0;
              } else if (item.sender === 'Shedletsky') {
                utterance.pitch = 1.45;
                utterance.rate = 1.15;
              } else if (item.sender === 'ErikCassel') {
                utterance.pitch = 0.75;
                utterance.rate = 0.9;
              } else if (item.sender === 'ClassyStud_08') {
                utterance.pitch = 1.25;
                utterance.rate = 1.1;
              }
              window.speechSynthesis.speak(utterance);
            } catch (err) {
              playSound(150, 0.15, 'sawtooth');
            }
          } else {
            playSound(150, 0.15, 'sawtooth');
          }
        }

        const durationMs = Math.max(3000, item.text.length * 65);

        setTimeout(() => {
          setActiveVoiceSpeaker(null);
          setActiveSpeakerText('');
          if (!isVoiceChatMuted) {
            playSound(110, 0.06, 'sawtooth');
          }
        }, durationMs);
      }
    }, 15000); // Trigger check loop

    return () => clearInterval(voiceInterval);
  }, [activeVoiceSpeaker, isVoiceChatMuted, blockedUsers]);

  // Administrative Moderation Flag Logs state
  const [reportedPlayers, setReportedPlayers] = useState<Array<{
    id: string;
    reporter: string;
    reported: string;
    text: string;
    timestamp: string;
    status: 'PENDING' | 'MUTED' | 'BANNED' | 'DISMISSED';
  }>>([]);

  const syncReportedPlayers = () => {
    const db = getModerationDB();
    const allReports: Array<{
      id: string;
      reporter: string;
      reported: string;
      text: string;
      timestamp: string;
      status: 'PENDING' | 'MUTED' | 'BANNED' | 'DISMISSED';
    }> = [];
    
    Object.values(db).forEach(playerMod => {
      playerMod.reports.forEach(rep => {
        allReports.push({
          id: rep.id,
          reporter: rep.reported === playerMod.playerName ? rep.reporter : 'System',
          reported: playerMod.playerName,
          text: `[${rep.reason}] ${rep.text}`,
          timestamp: rep.timestamp,
          status: playerMod.isBanned ? 'BANNED' as const : 'PENDING' as const
        });
      });
    });

    // Sort descending
    allReports.sort((a, b) => b.id.localeCompare(a.id));
    setReportedPlayers(allReports);
  };

  // Keep lists synced with persistent localStorage database
  useEffect(() => {
    syncReportedPlayers();
    setActiveServerPlayers(prev => prev.filter(p => !isPlayerBanned(p.name)));
    setIsSelfBanned(isPlayerBanned('You (Gamer)'));
    setIsSelfAdminBanned(isPlayerAdminBanned('You (Gamer)'));
    setLiveAppeals(getActiveAppealsFromDB());
  }, [reportsDBVersion]);

  // Hook chat report buttons to pre-fill and launch the Abuse Report interface
  const handleReportPlayer = (msg: { id: string; sender: string; text: string; createdAt?: number }) => {
    playSound(400, 0.05, 'sine');
    setReportTargetName(msg.sender);
    setReportContext(msg.text);
    setReportReason('Toxic Behavior');
    setShowReportModal(true);
  };

  const submitReport = (reportedName: string, reporterName: string, reason: string, contextText: string) => {
    // 1. Submit report in persistent database (This awards 1 Warning to the player)
    const res = reportPlayerInDB(reportedName, reporterName, reason, contextText, game.id, game.title);
    setReportsDBVersion(v => v + 1);

    playSound(440, 0.12, 'sawtooth');

    // Display warnings banner overlay immediately: "everytime someone reports a person the person safety gets a warning."
    setGameNotification(`🚨 WARNING: ${reportedName} has been warned! Violation: ${reason}. Warnings total: ${res.warningsCount}`);
    
    // Announce warning into the Server Chat log list
    setChatMessages(prev => [
      ...prev,
      {
        id: `sys_warn_${Date.now()}_1`,
        sender: 'System Warning',
        text: `⚠️ User ${reportedName} has been issued an automated warning. Reasons: "${reason}". Warning violation count: ${res.warningsCount}.`,
        type: 'system',
        createdAt: Date.now()
      }
    ]);

    // Check if player reaches ban threshold (reports from 7 different people)
    if (res.banned) {
      playSound(120, 0.45, 'sawtooth');
      setTimeout(() => playSound(80, 0.4, 'sawtooth'), 150);

      setGameNotification(`🚫 PLATFORM BAN INITIATED: ${reportedName} has been permanently banned! Kicking from network...`);

      // Broadcast ban in server logs
      setChatMessages(prev => [
        ...prev,
        {
          id: `sys_ban_${Date.now()}`,
          sender: 'Server Guard',
          text: `🚨 BAN ENACTED: Player ${reportedName} is permanently excluded from all sandbox servers (Exceeded 6 unique report flags).`,
          type: 'system',
          createdAt: Date.now()
        }
      ]);

      // Remove immediately from active server list
      setActiveServerPlayers(prev => prev.filter(p => p.name !== reportedName));
      simulateNPCAppeal(reportedName);
    } else {
      // Simulate reports from other different NPCs so users can verify the unique reports ban mechanics!
      // This increases reporter diversity to 7 to show the ban sequence naturally!
      const mockReporters = [
        { name: 'Shedletsky', reason: 'Unfair physics exploiting' },
        { name: 'ErikCassel', reason: 'Abusive scripting spam' },
        { name: 'ClassyStud_08', reason: 'Disrupting game servers' },
        { name: 'Telamon', reason: 'Harassment/bullying behaviour' },
        { name: 'g00by', reason: 'Inappropriate avatar items' },
        { name: '1337_killa', reason: 'Toxic Crossroads conduct' },
        { name: 'WackyWizard', reason: 'Fling hacking other players' },
        { name: 'Loleris', reason: 'Flooding text channels with spam' }
      ];

      // Get existing reports for this player to prevent reporter collision
      const db = getModerationDB();
      const currentReports = db[reportedName]?.reports || [];
      const currentReporters = new Set(currentReports.map(r => r.reporter.trim().toLowerCase()));

      const availableMockReporters = mockReporters.filter(
        mr => mr.name.toLowerCase() !== reporterName.toLowerCase() && !currentReporters.has(mr.name.toLowerCase())
      );

      if (availableMockReporters.length > 0) {
        // Trigger automated reports in 1.5 seconds to show community activity
        setTimeout(() => {
          const nextRep = availableMockReporters[Math.floor(Math.random() * availableMockReporters.length)];
          const bgRes = reportPlayerInDB(reportedName, nextRep.name, nextRep.reason, `Filing secondary abuse flag. Agree with ${reporterName}'s report.`, game.id, game.title);
          setReportsDBVersion(v => v + 1);

          setChatMessages(prev => [
            ...prev,
            {
              id: `sys_warn_${Date.now()}_2`,
              sender: 'Network Moderation',
              text: `⚠️ User ${reportedName} was also reported by co-player ${nextRep.name} in this game. (Warning count: ${bgRes.warningsCount}, Unique reporters: ${bgRes.totalUniqueReports}/7)`,
              type: 'system',
              createdAt: Date.now()
            }
          ]);

          if (bgRes.banned) {
            playSound(120, 0.45, 'sawtooth');
            setGameNotification(`🚫 PLATFORM BAN INITIATED: ${reportedName} exceeded unique report limits and is banned!`);
            
            setChatMessages(prev => [
              ...prev,
              {
                id: `sys_ban_${Date.now()}_bg`,
                sender: 'Server Guard',
                text: `🚨 BAN ENACTED: Player ${reportedName} has been kicked and permanently blacklisted from all experiences!`,
                type: 'system',
                createdAt: Date.now()
              }
            ]);

            setActiveServerPlayers(prev => prev.filter(p => p.name !== reportedName));
            simulateNPCAppeal(reportedName);
          }
        }, 1600 + Math.random() * 800);
      }
    }
  };

  const simulateNPCAppeal = (npcName: string) => {
    const reasons = [
      "I was just rubberbanding due to high ping! I am not exploiting, please check server logs.",
      "It was my little brother playing on my account! I promise he won't use chat again.",
      "My friend set a script to auto-click. I have deleted all extensions.",
      "Sorry about the toxic wording, crossroads got super competitive. Won't happen again!",
      "My sword was glitched into the brick layout, which looked like fly-glitching. I am innocent!"
    ];
    const chosenReason = reasons[Math.floor(Math.random() * reasons.length)];
    setTimeout(() => {
      submitAppealInDB(npcName, game.id, game.title, chosenReason);
      setReportsDBVersion(v => v + 1);
    }, 4500);
  };

  const triggerMockAutoBan = () => {
    playSound(120, 0.5, 'sawtooth');
    const mockReporters = ['Builderman', 'Shedletsky', 'ErikCassel', 'ClassyStud_08', 'Telamon', 'WackyWizard', 'g00by'];
    mockReporters.forEach((rep) => {
      reportPlayerInDB('You (Gamer)', rep, 'Cheating, Exploiting or Glitching', 'Sandbox physics exploitation and scripting spikes.', game.id, game.title);
    });
    setReportsDBVersion(v => v + 1);
  };

  const triggerMockAdminBan = () => {
    playSound(100, 0.6, 'sawtooth');
    adminBanPlayerInDB('You (Gamer)', game.id, game.title);
    setReportsDBVersion(v => v + 1);
  };

  const handleAdminAction = (reportId: string, action: 'MUTED' | 'BANNED' | 'DISMISSED', targetName: string) => {
    playSound(120, 0.35, 'sawtooth');
    
    // Update local storage database as well
    const db = getModerationDB();
    if (db[targetName] || action === 'BANNED') {
      if (action === 'BANNED') {
        adminBanPlayerInDB(targetName, game.id, game.title);
        setReportsDBVersion(v => v + 1);
        setActiveServerPlayers(prev => prev.filter(p => p.name !== targetName));
        simulateNPCAppeal(targetName);
      } else {
        if (db[targetName]) {
          db[targetName].reports = db[targetName].reports.filter(r => r.id !== reportId);
          saveModerationDB(db);
          setReportsDBVersion(v => v + 1);
        }
      }
    }

    setGameNotification(`⚙️ ADMIN ACTION: ${targetName} has been ${action.toLowerCase()}.`);
    setTimeout(() => {
      setGameNotification(null);
    }, 3500);

    setChatMessages(prev => [
      ...prev,
      {
        id: `admin_action_${Date.now()}`,
        sender: 'Admin Console',
        text: `🛡️ Moderation enacted! User ${targetName} is now ${action.toLowerCase()} by server admin.`,
        type: 'system',
        createdAt: Date.now()
      }
    ]);
  };

  // Auto-scroll effect when chat messages list changes or gets expanded
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatExpanded]);

  // Game Chat 10-minute expiry cleanup
  useEffect(() => {
    const TEN_MIN_MS = 10 * 60 * 1000;
    const interval = setInterval(() => {
      const now = Date.now();
      setChatMessages(prev => {
        const filtered = prev.filter(msg => {
          const creation = msg.createdAt || now;
          return (now - creation) < TEN_MIN_MS;
        });
        if (filtered.length !== prev.length) {
          return filtered;
        }
        return prev;
      });
    }, 5000); // Check every 5 seconds for immediate precision
    return () => clearInterval(interval);
  }, []);

  // Trigger instant R6 block death sequence
  const triggerAdminKill = () => {
    // 3D coordinate reset and death bounds trigger
    player3DRef.current.py = -15;
    player3DRef.current.vy = -1;
    // 2D coordinate reset and death bounds trigger
    player2DRef.current.y = 450;
    player2DRef.current.vy = 20;
    playSound(110, 0.45, 'sawtooth');
  };

  // Chat bot reactions mimicking classic multi-player dialogue
  const triggerCoplayerReactions = (userText: string) => {
    const textLow = userText.toLowerCase();
    let replyText = '';
    let replier = 'Builderman';

    if (textLow.includes('lag') || textLow.includes('ping')) {
      replyText = "oof, high latency is so annoying! The server is crying.";
      replier = "Builderman";
    } else if (textLow.includes('obby') || textLow.includes('star')) {
      replyText = "almost fell into the lava. That step is tricky!";
      replier = "Shedletsky";
    } else if (textLow.includes('noob') || textLow.includes('chaos')) {
      replyText = "who activated the noob spawn cheat?? 😂";
      replier = "Builderman";
    } else if (textLow.includes('fly') || textLow.includes('hack')) {
      replyText = "can i get fly permissions too owner? plz!";
      replier = "ClassyStud_08";
    } else {
      const genericReplies = [
        "this is such a cool roblox sandbox!",
        "is it just me or is the acid rain scary?",
        "R6 walking animations look clean here.",
        "nice hat! custom avatar items look sweet.",
        "oof!"
      ];
      replyText = genericReplies[Math.floor(Math.random() * genericReplies.length)];
      const names = ["Builderman", "Shedletsky", "ErikCassel", "ClassyStud_08"];
      replier = names[Math.floor(Math.random() * names.length)];
    }

    // Guard: Don't reply if banned! Choose a fallback non-banned player if possible, otherwise suppress.
    if (isPlayerBanned(replier)) {
      const activeNames = activeServerPlayers.filter(p => !isPlayerBanned(p.name)).map(p => p.name);
      if (activeNames.length > 0) {
        replier = activeNames[Math.floor(Math.random() * activeNames.length)];
      } else {
        return; // No unbanned players available.
      }
    }

    // Delay a response to feel naturally dynamic!
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: replier,
          text: replyText,
          type: 'normal',
          createdAt: Date.now()
        }
      ]);
      playSound(750, 0.08, 'sine');
    }, 1100 + Math.random() * 850);
  };

  // Core administrative parser
  const submitChatMessage = (text: string) => {
    playSound(800, 0.05, 'sine');

    // 1. Log message to screen
    const userMsg = {
      id: Math.random().toString(),
      sender: 'You',
      text: text,
      type: text.startsWith(':') ? 'admin' : 'normal' as const,
      createdAt: Date.now()
    };

    setChatMessages(prev => [...prev, userMsg]);

    // 2. Parse command if starts with :
    if (text.startsWith(':')) {
      const cmd = text.toLowerCase().slice(1).trim();
      const parts = cmd.split(' ');
      const action = parts[0];

      if (action === 'cmds' || action === 'help') {
        const helpLogs = [
          { id: Math.random().toString(), sender: 'Command Console', text: 'Commands List:', type: 'system' as const, createdAt: Date.now() },
          { id: Math.random().toString(), sender: 'System', text: '  :fly - Toggle persistent vertical flight', type: 'system' as const, createdAt: Date.now() },
          { id: Math.random().toString(), sender: 'System', text: '  :kill - Trigger block character oof', type: 'system' as const, createdAt: Date.now() },
          { id: Math.random().toString(), sender: 'System', text: '  :ff - Toggle glowing protective forcefield aura', type: 'system' as const, createdAt: Date.now() },
          { id: Math.random().toString(), sender: 'System', text: '  :bighead - Toggle dynamic huge-head block scaling', type: 'system' as const, createdAt: Date.now() },
          { id: Math.random().toString(), sender: 'System', text: '  :flags - List reported players moderation flags', type: 'system' as const, createdAt: Date.now() }
        ];
        setTimeout(() => {
          setChatMessages(prev => [...prev, ...helpLogs]);
          playSound(900, 0.1, 'sine');
        }, 120);
      } 
      else if (action === 'fly') {
        const newFly = !adminFly;
        setAdminFly(newFly);
        setTimeout(() => {
          setChatMessages(prev => [...prev, {
            id: Math.random().toString(),
            sender: 'Admin Console',
            text: `Flight mode has been ${newFly ? 'ENABLED' : 'DISABLED'}.`,
            type: 'system' as const,
            createdAt: Date.now()
          }]);
          playSound(550, 0.15, 'sine');
        }, 150);
      } 
      else if (action === 'kill') {
        setTimeout(() => {
          setChatMessages(prev => [...prev, {
            id: Math.random().toString(),
            sender: 'Admin Console',
            text: 'Character exterminated. Oof!',
            type: 'system' as const,
            createdAt: Date.now()
          }]);
        }, 100);
        triggerAdminKill();
      } 
      else if (action === 'ff' || action === 'forcefield') {
        const newFF = !adminFF;
        setAdminFF(newFF);
        setTimeout(() => {
          setChatMessages(prev => [...prev, {
            id: Math.random().toString(),
            sender: 'Admin Console',
            text: `Shield bubble forcefield is now ${newFF ? 'ACTIVE' : 'INACTIVE'}.`,
            type: 'system' as const,
            createdAt: Date.now()
          }]);
          playSound(700, 0.2, 'sine');
        }, 150);
      } 
      else if (action === 'bighead') {
        const newBH = !adminBighead;
        setAdminBighead(newBH);
        setTimeout(() => {
          setChatMessages(prev => [...prev, {
            id: Math.random().toString(),
            sender: 'Admin Console',
            text: `Bighead structural mesh bounds ${newBH ? 'EXPANDED' : 'NORMALIZED'}.`,
            type: 'system' as const,
            createdAt: Date.now()
          }]);
          playSound(1200, 0.1, 'sine');
        }, 150);
      } 
      else if (action === 'flags' || action === 'reports') {
        setTimeout(() => {
          if (reportedPlayers.length === 0) {
            setChatMessages(prev => [...prev, {
              id: Math.random().toString(),
              sender: 'Admin Console',
              text: '👮 No active report flags registered in server database memory.',
              type: 'system' as const,
              createdAt: Date.now()
            }]);
          } else {
            const reportMsgs = reportedPlayers.map((rep, idx) => ({
              id: `cmd_rep_${idx}_${rep.id}`,
              sender: 'Admin Console',
              text: `🚩 [${rep.status}] Player ${rep.reported} reported by ${rep.reporter} at ${rep.timestamp}: "${rep.text}"`,
              type: 'system' as const,
              createdAt: Date.now()
            }));
            setChatMessages(prev => [
              ...prev,
              {
                id: Math.random().toString(),
                sender: 'Admin Console',
                text: `👮 Active Incident Flags Register (${reportedPlayers.length}):`,
                type: 'system' as const,
                createdAt: Date.now()
              },
              ...reportMsgs
            ]);
          }
          playSound(900, 0.1, 'sine');
        }, 150);
      }
      else {
        setTimeout(() => {
          setChatMessages(prev => [...prev, {
            id: Math.random().toString(),
            sender: 'System',
            text: `Unknown command "${text}". Type :cmds for valid list.`,
            type: 'system' as const,
            createdAt: Date.now()
          }]);
          playSound(220, 0.2, 'sawtooth');
        }, 150);
      }
    } else {
      triggerCoplayerReactions(text);
    }
  };

  // Falling Noobs List Refs
  const noobs3DRef = useRef<Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; size: number }>>([]);
  const noobs2DRef = useRef<Array<{ x: number; y: number; vy: number; size: number }>>([]);

  // Falling Acid Raindroplets Refs
  const aciddrops3DRef = useRef<Array<{ x: number; y: number; z: number; vy: number }>>([]);
  const aciddrops2DRef = useRef<Array<{ x: number; y: number; vy: number }>>([]);

  // Platforms health reference trackers (7 for 3D platforms, 5 for 2D platform paths)
  const platformHealth3DRef = useRef<number[]>([100, 100, 100, 100, 100, 100, 100]);
  const platformHealth2DRef = useRef<number[]>([100, 100, 100, 100, 100]);

  // Key States buffering for lag/rubber-band simulator (simulates high input latency)
  const inputDelayQueueRef = useRef<Array<{ timestamp: number; keyStates: { [key: string]: boolean }; joyX: number; joyY: number }>>([]);

  // High-performance Refs for 3D state preservation
  const player3DRef = useRef({
    px: 0,
    py: 0.6,
    pz: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 0,
    isGrounded: false
  });

  // High-performance Refs for 2D states
  const player2DRef = useRef({
    x: 50,
    y: 200,
    width: 28,
    height: 28,
    vx: 0,
    vy: 0,
    isGrounded: false
  });

  // Level-specific static & interactive lists
  const stars3DRef = useRef([
    { x: 0, y: 1.1, z: 7, collected: false },
    { x: 3.2, y: 1.8, z: 12, collected: false },
    { x: -3.2, y: 2.5, z: 17, collected: false },
    { x: 0, y: 3.2, z: 23, collected: false },
    { x: 0, y: 4.8, z: 34, collected: false }
  ]);

  const stars2DRef = useRef([
    { x: 100, y: 270, collected: false },
    { x: 320, y: 230, collected: false },
    { x: 490, y: 170, collected: false },
    { x: 300, y: 120, collected: false },
    { x: 80, y: 80, collected: false }
  ]);

  // High-performance analog joystick values
  const joystickAxesRef = useRef({ x: 0, y: 0 }); // normalized -1 to +1 axes values
  const joystickKnobRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickStartRef = useRef({ x: 0, y: 0 });
  const resetRequestedRef = useRef<boolean>(false);

  // Drag-to-look camera rotation refs (Mouse & Touch)
  const canvasDragStartRef = useRef({ x: 0, y: 0 });
  const canvasIsDraggingRef = useRef(false);
  const canvasLastYawRef = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(touchCapable);
      // Auto enable touch controls if touch support detected on start
      if (touchCapable) {
        setShowTouchControls(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!game.is2D && game.parts) {
      const scaleDev = 2.5;
      const coinParts = game.parts.filter(p => p.specialBehavior === 'candy_coin' || p.name?.toLowerCase().includes('coin'));
      if (coinParts.length > 0) {
        stars3DRef.current = coinParts.map(p => ({
          x: p.x / scaleDev,
          y: p.y / scaleDev + (p.sizeY / scaleDev) / 2 + 0.3,
          z: p.z / scaleDev,
          collected: false
        }));
      } else {
        // Find normal platforms to place some floating stars on
        const normalParts = game.parts.filter(p => !p.name?.toLowerCase().includes('spawn') && p.y > 0);
        if (normalParts.length > 0) {
          stars3DRef.current = normalParts.slice(0, 5).map(p => ({
            x: p.x / scaleDev,
            y: p.y / scaleDev + (p.sizeY / scaleDev) / 2 + 1.2,
            z: p.z / scaleDev,
            collected: false
          }));
        }
      }
    } else if (game.is2D && game.sprites) {
      const starSprites = game.sprites.filter(s => s.name?.toLowerCase().includes('star') || s.name?.toLowerCase().includes('coin') || s.emoji === '⭐');
      if (starSprites.length > 0) {
        stars2DRef.current = starSprites.map(s => ({
          x: s.x + 320, // offset coordinates to match simulator's coordinate space
          y: -s.y + 180,
          collected: false
        }));
      } else {
        // Fallback layout based on platforms
        stars2DRef.current = [
          { x: 100, y: 270, collected: false },
          { x: 320, y: 230, collected: false },
          { x: 490, y: 170, collected: false }
        ];
      }
    }
  }, [game]);

  useEffect(() => {
    if (isPlayingCode) {
      // Auto expire/hide controls overlay after 8 seconds of starting
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isPlayingCode]);

  const handleJoystickStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    joystickStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDraggingJoystick(true);
  };

  const handleJoystickMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingJoystick || joystickTouchIdRef.current === null) return;
    
    let touch: React.Touch | null = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === joystickTouchIdRef.current) {
        touch = e.touches[i];
        break;
      }
    }
    if (!touch) return;

    let dx = touch.clientX - joystickStartRef.current.x;
    let dy = touch.clientY - joystickStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 32;

    if (distance > maxRadius) {
      const angle = Math.atan2(dy, dx);
      dx = Math.cos(angle) * maxRadius;
      dy = Math.sin(angle) * maxRadius;
    }

    // Direct DOM manipulation of knob translates for lag-free performance at maximum framerate!
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    // Capture normalized analog axes for the physics loop (runs at custom interval)
    joystickAxesRef.current = {
      x: dx / maxRadius,
      y: dy / maxRadius
    };
  };

  const handleJoystickEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (joystickTouchIdRef.current === null) return;
    
    let touchEnded = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        touchEnded = true;
        break;
      }
    }

    if (touchEnded) {
      joystickTouchIdRef.current = null;
      setIsDraggingJoystick(false);
      
      if (joystickKnobRef.current) {
        joystickKnobRef.current.style.transform = `translate(0px, 0px)`;
      }
      
      joystickAxesRef.current = { x: 0, y: 0 };
    }
  };

  // Drag to Rotate camera yaw canvas handlers (touch & mouse)
  const handleCanvasDragStart = (clientX: number, clientY: number) => {
    canvasIsDraggingRef.current = true;
    canvasDragStartRef.current = { x: clientX, y: clientY };
    canvasLastYawRef.current = player3DRef.current.yaw;
  };

  const handleCanvasDragMove = (clientX: number, clientY: number) => {
    if (!canvasIsDraggingRef.current) return;
    const dx = clientX - canvasDragStartRef.current.x;
    // Update yaw rotation directly inside the physics state ref:
    player3DRef.current.yaw = canvasLastYawRef.current + dx * 0.01;
  };

  const handleCanvasDragEnd = () => {
    canvasIsDraggingRef.current = false;
  };

  const handleJumpStart = (e: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // In Voxel, jumping activates jump key only. Direction walk is handled by the joystick!
    keys.current[' '] = true;
  };

  const handleJumpEnd = () => {
    keys.current[' '] = false;
  };
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  
  // Audio synther
  const playSound = (freq: number, dur: number, type: OscillatorType = 'sine') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {
      // Audio context block bypass safely
    }
  };

  // Launching stage sequences
  const launchMessages = [
    "Checking client validation updates...",
    "Retrieving server authorization codes...",
    "Allocating persistent server sandbox...",
    "Acquiring assets & textures (100%)...",
    "Estabilshing low-latency server connection..."
  ];

  useEffect(() => {
    if (showSplash) return;

    if (launchStep < launchMessages.length) {
      const timer = setTimeout(() => {
        setLaunchStep(prev => prev + 1);
        playSound(400 + launchStep * 100, 0.1, 'triangle');
      }, 750);
      return () => clearTimeout(timer);
    } else if (!isPlayingCode) {
      setIsPlayingCode(true);
      playSound(523.25, 0.35, 'sine'); // C5 tone on successful launch
    }
  }, [launchStep, showSplash]);

  // Keys state tracker
  const keys = useRef<{ [key: string]: boolean }>({});

  // Helper to read inputs (representing lagged input buffer if Lag mode is on)
  const getSimulatedInputs = () => {
    const rawKeys = { ...keys.current };
    const rawJoy = { x: joystickAxesRef.current.x, y: joystickAxesRef.current.y };

    if (!chaosRef.current.lag) {
      return { keys: rawKeys, joyX: rawJoy.x, joyY: rawJoy.y };
    }

    // Ping lag is active! Buffer inputs and retrieve them with a delay
    const now = Date.now();
    inputDelayQueueRef.current.push({
      timestamp: now,
      keyStates: rawKeys,
      joyX: rawJoy.x,
      joyY: rawJoy.y
    });

    if (inputDelayQueueRef.current.length > 120) {
      inputDelayQueueRef.current.shift();
    }

    const latencyDelayMs = 450; // Custom high-ping latency delay
    const targetQueryTime = now - latencyDelayMs;

    let lagInput = inputDelayQueueRef.current[0];
    for (let i = inputDelayQueueRef.current.length - 1; i >= 0; i--) {
      if (inputDelayQueueRef.current[i].timestamp <= targetQueryTime) {
        lagInput = inputDelayQueueRef.current[i];
        break;
      }
    }

    return {
      keys: lagInput ? lagInput.keyStates : {},
      joyX: lagInput ? lagInput.joyX : 0,
      joyY: lagInput ? lagInput.joyY : 0
    };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard to prevent character walking when typing chat commands
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      const lockKeys = ['arrowup', 'arrowdown', 'space', ' ', 'arrowleft', 'arrowright'];
      if (lockKeys.includes(e.key.toLowerCase()) && isPlayingCode) {
        e.preventDefault();
      }
      keys.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    const handleGlobalSlashFocus = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const chatInput = document.getElementById('roblox-chat-input');
        if (chatInput) {
          (chatInput as HTMLInputElement).focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleGlobalSlashFocus);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleGlobalSlashFocus);
    };
  }, [isPlayingCode]);

  // Canvas interactive game engine (Supports 2D arcade levels & beautiful 3D perspective Obby arenas!)
  useEffect(() => {
    if (!isPlayingCode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas scaling bounds
    canvas.width = 640;
    canvas.height = 360;

    let isGameOver = false;
    let isStageCleared = false;
    let currentScore = 0;

    const skinColorHex = skinColor || "#ffe0b2";
    // Get flat body details mapping
    const torsoColorHex = (() => {
      if (avatarColor.includes('amber')) return '#f59e0b';
      if (avatarColor.includes('orange')) return '#d97706';
      if (avatarColor.includes('cyan')) return '#06b6d4';
      if (avatarColor.includes('green')) return '#10b981';
      if (avatarColor.includes('red')) return '#f43f5e';
      if (avatarColor.includes('rose')) return '#e11d48';
      if (avatarColor.includes('indigo')) return '#4f46e5';
      if (avatarColor.includes('emerald')) return '#059669';
      return '#f59e0b';
    })();

    // Helper to color shift for 3D shaders
    const getShadedColor = (hexToShade: string, percent: number) => {
      let hashHexString = hexToShade.replace('#', '');
      let hexAsInt = parseInt(hashHexString, 16);
      let targetRGB = percent < 0 ? 0 : 255;
      let percentAsRatio = percent < 0 ? percent * -1 : percent;
      let r = hexAsInt >> 16;
      let g = (hexAsInt >> 8) & 0x00FF;
      let b = hexAsInt & 0x0000FF;
      return "#" + (0x1000000 + (Math.round((targetRGB - r) * (percentAsRatio / 100)) + r) * 0x10000 + (Math.round((targetRGB - g) * (percentAsRatio / 100)) + g) * 0x100 + (Math.round((targetRGB - b) * (percentAsRatio / 100)) + b)).toString(16).slice(1);
    };

    // ==========================================
    // BRANCH A: 3D CLIENT PLATFORMER EXPERIENCE
    // ==========================================
    if (!game.is2D) {
      const player3D = player3DRef.current;

      const scaleDev = 2.5;
      // 3D Blocks layout: static steps or from game.parts if provided
      const blockPlatforms = game.parts ? game.parts.map(p => ({
        x: p.x / scaleDev,
        y: p.y / scaleDev,
        z: p.z / scaleDev,
        w: p.sizeX / scaleDev,
        h: p.sizeY / scaleDev,
        d: p.sizeZ / scaleDev,
        color: p.color,
        label: p.name,
        type: p.type as string,
        specialBehavior: p.specialBehavior as string | undefined,
        isWinPad: p.specialBehavior === 'dimension_rift_portal' || p.name?.toLowerCase().includes('finish') || p.name?.toLowerCase().includes('victory') || p.name?.toLowerCase().includes('portal')
      })) : [
        { x: 0, y: -0.6, z: 0, w: 7, h: 0.4, d: 7, color: '#10b981', label: 'Spawn Pad', type: 'Block', specialBehavior: undefined as string | undefined, isWinPad: false },
        { x: 0, y: 0.1, z: 7, w: 3, h: 0.4, d: 3, color: '#3b82f6', label: 'Step 1', type: 'Block', specialBehavior: undefined as string | undefined, isWinPad: false },
        { x: 3.2, y: 0.8, z: 12, w: 3, h: 0.4, d: 3, color: '#f59e0b', label: 'Step 2', type: 'Block', specialBehavior: undefined as string | undefined, isWinPad: false },
        { x: -3.2, y: 1.5, z: 17, w: 3, h: 0.4, d: 3, color: '#8b5cf6', label: 'Step 3', type: 'Block', specialBehavior: undefined as string | undefined, isWinPad: false },
        { x: 0, y: 2.2, z: 23, w: 3, h: 0.4, d: 3, color: '#22d3ee', label: 'Step 4', type: 'Block', specialBehavior: undefined as string | undefined, isWinPad: false },
        { x: 3.5, y: 2.9, z: 28, w: 3, h: 0.4, d: 3, color: '#f43f5e', label: 'Step 5', type: 'Block', specialBehavior: undefined as string | undefined, isWinPad: false },
        { x: 0, y: 3.6, z: 34, w: 6, h: 0.4, d: 6, color: '#ec4899', isWinPad: true, label: 'Victory Pad', type: 'Block', specialBehavior: undefined as string | undefined }
      ];

      const reset3DLevel = () => {
        const spawnPlat = blockPlatforms.find(p => p.specialBehavior === 'respawn_star' || p.label?.toLowerCase().includes('spawn'));
        if (spawnPlat) {
          player3D.px = spawnPlat.x;
          player3D.py = spawnPlat.y + spawnPlat.h / 2 + 0.05;
          player3D.pz = spawnPlat.z;
        } else {
          player3D.px = blockPlatforms[0]?.x ?? 0;
          player3D.py = (blockPlatforms[0]?.y ?? 0) + (blockPlatforms[0]?.h ?? 0.4) / 2 + 0.05;
          player3D.pz = blockPlatforms[0]?.z ?? 0;
        }
        player3D.vx = 0;
        player3D.vy = 0;
        player3D.vz = 0;
        player3D.yaw = 0;
        player3D.isGrounded = false;
        stars3DRef.current.forEach(s => s.collected = false);
        currentScore = 0;
        setScore(0);
        isGameOver = false;
        isStageCleared = false;
        playSound(523.25, 0.35, 'sine');
      };

      const game3DLoop = () => {
        // Clear canvas
        ctx.fillStyle = '#0f1115';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines metadata
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(10, 10, canvas.width - 20, 35);
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#a1a1aa';
        ctx.fillText(`STUDIO 3D ENGINE CLIENT: R6 AVATAR ACTIVE [DRAG TO LOOK AROUND]`, 20, 32);

        // Respawn check
        if (resetRequestedRef.current) {
          reset3DLevel();
          resetRequestedRef.current = false;
        }

        if (!isGameOver && !isStageCleared) {
          // Read lagged or normal inputs based on the Server Lag toggle
          const { keys: activeKeys, joyX: activeJoyX, joyY: activeJoyY } = getSimulatedInputs();

          // Move speed and gravity multipliers driven by Admin panel command modifiers
          const speedMultiplier = adminRef.current.speedMultiplier;
          const gravityMultiplier = adminRef.current.gravityMultiplier;

          // Snappy speeds & physics tuning
          const turnSpeed = 0.055;
          const walkSpeed = 0.18 * speedMultiplier;   // Much faster physical movement!
          const gravity3D = 0.0125 * gravityMultiplier;
          const accel = 0.22;       // Momentum multiplier for natural transitions!

          // Turning with A/D is replaced by ArrowLeft/ArrowRight to prevent key binds collision
          if (activeKeys['arrowleft']) {
            player3D.yaw -= turnSpeed;
          }
          if (activeKeys['arrowright']) {
            player3D.yaw += turnSpeed;
          }

          // Compute target velocities from both keyboards & analog mobile joysticks
          let targetVx = 0;
          let targetVz = 0;

          // Keyboard Walk
          if (activeKeys['w'] || activeKeys['arrowup']) {
            targetVx += Math.sin(player3D.yaw) * walkSpeed;
            targetVz += Math.cos(player3D.yaw) * walkSpeed;
          }
          if (activeKeys['s'] || activeKeys['arrowdown']) {
            targetVx -= Math.sin(player3D.yaw) * walkSpeed;
            targetVz -= Math.cos(player3D.yaw) * walkSpeed;
          }

          // Keyboard Strafe (A and D move player sideways relative to perspective)
          if (activeKeys['a']) {
            targetVx -= Math.cos(player3D.yaw) * walkSpeed;
            targetVz += Math.sin(player3D.yaw) * walkSpeed;
          }
          if (activeKeys['d']) {
            targetVx += Math.cos(player3D.yaw) * walkSpeed;
            targetVz -= Math.sin(player3D.yaw) * walkSpeed;
          }

          // Analog Mobile Joystick axes integration: smoothly adds 360-degree analog walking!
          const joyX = activeJoyX;
          const joyY = -activeJoyY; // invert touch coordinate system

          if (Math.abs(joyX) > 0.05) {
            targetVx += Math.cos(player3D.yaw) * walkSpeed * joyX;
            targetVz -= Math.sin(player3D.yaw) * walkSpeed * joyX;
          }
          if (Math.abs(joyY) > 0.05) {
            targetVx += Math.sin(player3D.yaw) * walkSpeed * joyY;
            targetVz += Math.cos(player3D.yaw) * walkSpeed * joyY;
          }

          // Smooth momentum interpolation
          player3D.vx += (targetVx - player3D.vx) * accel;
          player3D.vz += (targetVz - player3D.vz) * accel;

          // ADMIN COMMAND LEVEL: Flight checks (:fly ignores gravity or locks height)
          if (adminRef.current.fly) {
            player3D.vy = 0;
            player3D.isGrounded = true;
            // Let Space/W fly up and S fly down
            if (activeKeys[' '] || activeKeys['arrowup'] || activeKeys['w']) {
              player3D.py += 0.08 * speedMultiplier;
            }
            if (activeKeys['s'] || activeKeys['arrowdown']) {
              player3D.py -= 0.08 * speedMultiplier;
            }
          } else {
            // Standard jumping & gravity simulation
            if (activeKeys[' '] && player3D.isGrounded) {
              player3D.vy = 0.235 * Math.sqrt(speedMultiplier); // proportional scale
              player3D.isGrounded = false;
              playSound(260, 0.12, 'sine');
            }
            player3D.vy -= gravity3D;
          }

          // Apply physics positioning
          player3D.px += player3D.vx;
          player3D.py += player3D.vy;
          player3D.pz += player3D.vz;

          // Platform Collision loops
          player3D.isGrounded = false;
          blockPlatforms.forEach((plat, pIdx) => {
            // Disasters element: melted/corroded platform by Acid Rain skips collision entirely!
            if (platformHealth3DRef.current[pIdx] <= 0) {
              return;
            }

            const minX = plat.x - plat.w / 2;
            const maxX = plat.x + plat.w / 2;
            const minZ = plat.z - plat.d / 2;
            const maxZ = plat.z + plat.d / 2;

            if (
              player3D.px + 0.35 > minX && player3D.px - 0.35 < maxX &&
              player3D.pz + 0.35 > minZ && player3D.pz - 0.35 < maxZ
            ) {
              const platformTop = plat.y + plat.h / 2;
              const overlap = player3D.py - platformTop;
              if (player3D.vy <= 0.01 && overlap >= -0.35 && overlap <= 0.45) {
                player3D.py = platformTop;
                player3D.vy = 0;
                player3D.isGrounded = true;

                if (plat.specialBehavior === 'lava_melt' || plat.label?.toLowerCase().includes('lava')) {
                  if (!adminRef.current.ff) {
                    player3D.py = -10; // Trigger fall death immediately
                    playSound(110, 0.45, 'sawtooth');
                  }
                } else if (plat.specialBehavior === 'spiky_ouch' || plat.label?.toLowerCase().includes('spike')) {
                  if (!adminRef.current.ff) {
                    player3D.vy = 0.15; // Bounce player slightly
                    player3D.isGrounded = false;
                    playSound(150, 0.15, 'sawtooth');
                  }
                } else if (plat.specialBehavior === 'bounce_pad' || plat.label?.toLowerCase().includes('spring') || plat.label?.toLowerCase().includes('trampoline')) {
                  player3D.vy = 0.28;
                  player3D.isGrounded = false;
                  playSound(600, 0.25, 'sine');
                } else if (plat.specialBehavior === 'speed_boost' || plat.label?.toLowerCase().includes('speed')) {
                  player3D.vx *= 2.0;
                  player3D.vz *= 2.0;
                  playSound(880, 0.15, 'sine');
                } else if (plat.isWinPad) {
                  isStageCleared = true;
                  playSound(1046, 0.5, 'sine');
                }
              }
            }
          });

          // Fall death hazard
          if (player3D.py < -6) {
            if (adminRef.current.ff) {
              // Forcefield saves! Bounces player high!
              player3D.py = 4.0;
              player3D.vy = 0.12;
              playSound(600, 0.25, 'sine');
            } else {
              isGameOver = true;
              playSound(110, 0.45, 'sawtooth');
            }
          }

          // Spawn three-dimensional falling noobs if Noob Invasion is active
          if (chaosRef.current.noobs) {
            if (Math.random() < 0.035 && noobs3DRef.current.length < 24) {
              noobs3DRef.current.push({
                x: (Math.random() - 0.5) * 14,
                y: 8.5,
                z: Math.random() * 35,
                vx: (Math.random() - 0.5) * 0.04,
                vy: -0.05 - Math.random() * 0.04,
                vz: (Math.random() - 0.5) * 0.04,
                size: 0.6 + Math.random() * 0.4
              });
            }
          }

          // Update Noob Physics (3D)
          noobs3DRef.current.forEach(noob => {
            noob.x += noob.vx;
            noob.y += noob.vy;
            noob.z += noob.vz;

            // Bounce on platforms
            blockPlatforms.forEach((plat, pIdx) => {
              if (platformHealth3DRef.current[pIdx] <= 0) return;
              const minX = plat.x - plat.w / 2;
              const maxX = plat.x + plat.w / 2;
              const minZ = plat.z - plat.d / 2;
              const maxZ = plat.z + plat.d / 2;
              if (
                noob.x > minX && noob.x < maxX &&
                noob.z > minZ && noob.z < maxZ
              ) {
                const platTop = plat.y + plat.h / 2;
                if (noob.y >= platTop - 0.15 && noob.y + noob.vy <= platTop) {
                  noob.y = platTop + 0.02;
                  noob.vy = -noob.vy * 0.45; // Bounce!
                  noob.vx += (Math.random() - 0.5) * 0.02;
                  noob.vz += (Math.random() - 0.5) * 0.02;
                }
              }
            });

            // Hit Player check
            const dx = player3D.px - noob.x;
            const dy = (player3D.py + 0.4) - noob.y;
            const dz = player3D.pz - noob.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < (noob.size / 2 + 0.45)) {
              // Bounce player or deal push! Immune if forcefield is on
              if (adminRef.current.ff) {
                // Noobs bounce off forcefield!
                noob.vx = -dx * 0.15;
                noob.vz = -dz * 0.15;
                noob.vy = 0.08;
              } else {
                player3D.vx += dx * 0.06;
                player3D.vz += dz * 0.06;
                player3D.vy = 0.04;
                playSound(320, 0.15, 'sawtooth');
              }
            }
          });

          // Filter out fallen noobs
          noobs3DRef.current = noobs3DRef.current.filter(n => n.y > -5.0);

          // Spawn Acid Raindroplets if Acid Rain is active
          if (chaosRef.current.acid) {
            for (let i = 0; i < 2; i++) {
              aciddrops3DRef.current.push({
                x: (Math.random() - 0.5) * 16,
                y: 9.0,
                z: Math.random() * 37,
                vy: -0.15 - Math.random() * 0.08
              });
            }
          }

          // Update Acid Rain (3D)
          aciddrops3DRef.current.forEach(drop => {
            drop.y += drop.vy;

            // Platform hit check
            blockPlatforms.forEach((plat, pIdx) => {
              if (platformHealth3DRef.current[pIdx] <= 0) return;

              const minX = plat.x - plat.w / 2;
              const maxX = plat.x + plat.w / 2;
              const minZ = plat.z - plat.d / 2;
              const maxZ = plat.z + plat.d / 2;
              if (
                drop.x > minX && drop.x < maxX &&
                drop.z > minZ && drop.z < maxZ
              ) {
                const platTop = plat.y + plat.h / 2;
                if (drop.y >= platTop - 0.15 && drop.y + drop.vy <= platTop) {
                  // Melt/burn platform health
                  platformHealth3DRef.current[pIdx] = Math.max(0, platformHealth3DRef.current[pIdx] - 12);
                  drop.y = -999; // disintegrate raindrop
                  playSound(1000, 0.03, 'triangle');
                }
              }
            });
          });

          aciddrops3DRef.current = aciddrops3DRef.current.filter(d => d.y > -5.0);

          // Health healing or dissolved cooldown timers for 3D platforms
          platformHealth3DRef.current.forEach((hp, idx) => {
            if (hp < 100) {
              if (hp <= 0) {
                platformHealth3DRef.current[idx] -= 0.45; // Negative health acts as cool regeneration timer!
                if (platformHealth3DRef.current[idx] < -100) {
                  platformHealth3DRef.current[idx] = 100; // Respawned!
                  playSound(650, 0.2, 'sine');
                }
              } else {
                // Slowly heal if not actively melted
                platformHealth3DRef.current[idx] = Math.min(100, hp + 0.18);
              }
            }
          });

          // Stars collection loops
          stars3DRef.current.forEach(star => {
            if (!star.collected) {
              const dx = player3D.px - star.x;
              const dy = (player3D.py + 0.5) - star.y;
              const dz = player3D.pz - star.z;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (dist < 1.0) {
                star.collected = true;
                currentScore += 100;
                setScore(currentScore);
                playSound(880, 0.25, 'sine');

                if (currentScore > highScore) {
                  setHighScore(currentScore);
                  localStorage.setItem(`roblox_highscore_${game.id}`, currentScore.toString());
                }

                if (stars3DRef.current.every(s => s.collected)) {
                  isStageCleared = true;
                  playSound(1046, 0.5, 'sine');
                }
              }
            }
          });
        }

        // Camera Follow Projection parameters
        // Put the camera in 1st person (inside head) or 3rd person (orbit/follow behind)
        const isFirstPerson = cameraView === '1st';
        const camera3D = isFirstPerson ? {
          x: player3D.px + 0.15 * Math.sin(player3D.yaw), // slightly pushed forward relative to head center to prevent self clipping
          y: player3D.py + 1.25,
          z: player3D.pz + 0.15 * Math.cos(player3D.yaw),
          yaw: player3D.yaw,
          pitch: 0.05 // Look straight forward
        } : {
          // Camera placed 4.5 units behind, closer than 7, so player looks prominently sized!
          x: player3D.px - 4.5 * Math.sin(player3D.yaw),
          y: player3D.py + 2.4,
          z: player3D.pz - 4.5 * Math.cos(player3D.yaw),
          yaw: player3D.yaw,
          pitch: -0.34 // Look slightly downwards at the player (this centers the player properly on the screen!)
        };

        const projectCoord = (coordX: number, coordY: number, coordZ: number) => {
          const camX = coordX - camera3D.x;
          const camY = coordY - camera3D.y;
          const camZ = coordZ - camera3D.z;

          // Spin around Y axis
          const cosY = Math.cos(camera3D.yaw);
          const sinY = Math.sin(camera3D.yaw);
          let rx = camX * cosY - camZ * sinY;
          let rz = camX * sinY + camZ * cosY;

          // Spin pitch X axis
          const cosX = Math.cos(camera3D.pitch);
          const sinX = Math.sin(camera3D.pitch);
          let ry = camY * cosX - rz * sinX;
          let rz2 = camY * sinX + rz * cosX;

          if (rz2 <= 0.1) return null;

          const scale = 360 / rz2;
          return {
            x: canvas.width / 2 + rx * scale,
            y: canvas.height / 2 + 10 - ry * scale,
            z: rz2,
            scale
          };
        };

        // GLOBAL 3D PERSPECTIVE RENDERING PIPELINE (Merges ALL faces of ALL solids for unified sorting)
        interface GlobalFace3D {
          p1: { x: number; y: number; z: number; scale: number };
          p2: { x: number; y: number; z: number; scale: number };
          p3: { x: number; y: number; z: number; scale: number };
          p4: { x: number; y: number; z: number; scale: number };
          color: string;
          shade: number;
          avgZ: number;
          emojiDecal?: string;
          isFront?: boolean;
          labelOverlay?: string;
        }

        const globalFaces: GlobalFace3D[] = [];

        // Temporary structure list for our solids
        interface RendererCuboid {
          cx: number; cy: number; cz: number;
          w: number; h: number; d: number;
          color: string;
          emojiDecal?: string;
          labelOverlay?: string;
          isHeadPart?: boolean;
          shapeType?: string;
        }

        const solidsList: RendererCuboid[] = [];

        // 1. Push Platforms to solids list
        blockPlatforms.forEach(plat => {
          solidsList.push({ 
            cx: plat.x, cy: plat.y, cz: plat.z, 
            w: plat.w, h: plat.h, d: plat.d, 
            color: plat.color, 
            labelOverlay: plat.label,
            shapeType: (plat as any).type || 'Block'
          });
        });

        // 2. Push spinning stars to solids list
        stars3DRef.current.forEach(star => {
          if (!star.collected) {
            solidsList.push({
              cx: star.x,
              cy: star.y + Math.sin(Date.now() * 0.005) * 0.12,
              cz: star.z,
              w: 0.45,
              h: 0.45,
              d: 0.45,
              color: '#f59e0b',
              emojiDecal: '⭐'
            });
          }
        });        // Push 3D Noobs into solids list
        noobs3DRef.current.forEach(noob => {
          const ns = noob.size;
          const nx = noob.x;
          const ny = noob.y;
          const nz = noob.z;
          // Yellow head
          solidsList.push({ cx: nx, cy: ny + ns * 0.45, cz: nz, w: ns * 0.35, h: ns * 0.3, d: ns * 0.35, color: '#fbbf24', emojiDecal: '🙂' });
          // Blue torso
          solidsList.push({ cx: nx, cy: ny, cz: nz, w: ns * 0.5, h: ns * 0.5, d: ns * 0.25, color: '#3b82f6' });
          // Green legs
          solidsList.push({ cx: nx - ns * 0.15, cy: ny - ns * 0.35, cz: nz, w: ns * 0.18, h: ns * 0.4, d: ns * 0.18, color: '#22c55e' });
          solidsList.push({ cx: nx + ns * 0.15, cy: ny - ns * 0.35, cz: nz, w: ns * 0.18, h: ns * 0.4, d: ns * 0.18, color: '#22c55e' });
        });

        // Walk cyclic swings
        const limbSwing = Math.sin(Date.now() * 0.015) * 0.45 * (Math.abs(player3D.vx) + Math.abs(player3D.vz) > 0.01 ? 1.5 : 0.05);

        // Player R6 model parts dynamic positioning (relative shifts)
        const px = player3D.px;
        const py = player3D.py;
        const pz = player3D.pz;

        const faceSymbolSymbol = '🙂';

        // 3. Only push player model parts if in 3D follow/orbit view (not in 1st person inside the head)
        if (!isFirstPerson) {
          const isBH = adminRef.current.bighead;
          const bhScale = isBH ? 2.5 : 1.0;
          const bhYOffset = isBH ? 0.30 : 0.0;

          // Torso
          solidsList.push({ cx: px, cy: py + 0.61, cz: pz, w: 0.8, h: 0.9, d: 0.4, color: torsoColorHex });
          // Head (Scales up 2.5x if bighead is active)
          solidsList.push({ 
            cx: px, 
            cy: py + 1.25 + bhYOffset, 
            cz: pz, 
            w: 0.45 * bhScale, 
            h: 0.4 * bhScale, 
            d: 0.45 * bhScale, 
            color: skinColorHex, 
            emojiDecal: faceSymbolSymbol, 
            isHeadPart: true 
          });
          // Limbs
          // Arms
          solidsList.push({ cx: px - 0.55, cy: py + 0.61, cz: pz - limbSwing * 0.25, w: 0.28, h: 0.9, d: 0.28, color: skinColorHex });
          solidsList.push({ cx: px + 0.55, cy: py + 0.61, cz: pz + limbSwing * 0.25, w: 0.28, h: 0.9, d: 0.28, color: skinColorHex });
          // Legs
          solidsList.push({ cx: px - 0.22, cy: py + 0.0, cz: pz + limbSwing * 0.22, w: 0.3, h: 0.9, d: 0.3, color: '#334155' });
          solidsList.push({ cx: px + 0.22, cy: py + 0.0, cz: pz - limbSwing * 0.22, w: 0.3, h: 0.9, d: 0.3, color: '#334155' });

          // Forcefield Shield glowing translucent barrier surrounding player (3D)
          if (adminRef.current.ff) {
            solidsList.push({ cx: px, cy: py + 0.6, cz: pz, w: 1.8, h: 2.2, d: 1.8, color: 'forcefield' });
          }

          // Add Active 3D Hats attached directly to their head center (accounting for bighead scaling)
          activeHats.forEach(hatSym => {
            const hcy = py + 1.25 + bhYOffset; // dynamic head center Y
            if (hatSym === '🎩') {
              solidsList.push({ cx: px, cy: hcy + 0.2 * bhScale, cz: pz, w: 0.72 * bhScale, h: 0.03 * bhScale, d: 0.72 * bhScale, color: '#1f2937', isHeadPart: true }); // Fedora Brim
              solidsList.push({ cx: px, cy: hcy + 0.35 * bhScale, cz: pz, w: 0.42 * bhScale, h: 0.28 * bhScale, d: 0.42 * bhScale, color: '#111827', isHeadPart: true }); // Fedora Dome
            }
            if (hatSym === '🧢') {
              solidsList.push({ cx: px, cy: hcy + 0.2 * bhScale, cz: pz, w: 0.48 * bhScale, h: 0.15 * bhScale, d: 0.48 * bhScale, color: '#ef4444', isHeadPart: true }); // cap dome
              solidsList.push({ cx: px, cy: hcy + 0.17 * bhScale, cz: pz - 0.28 * bhScale, w: 0.42 * bhScale, h: 0.03 * bhScale, d: 0.2 * bhScale, color: '#ef4444', isHeadPart: true }); // Cap Brim
            }
            if (hatSym === '🕶️') {
              solidsList.push({ cx: px, cy: hcy, cz: pz - 0.25 * bhScale, w: 0.5 * bhScale, h: 0.12 * bhScale, d: 0.04 * bhScale, color: '#22d3ee', isHeadPart: true }); // Visor front shield
            }
            if (hatSym === '🦋') {
              solidsList.push({ cx: px - 0.65, cy: py + 0.7, cz: pz + 0.25, w: 0.9, h: 0.2, d: 0.05, color: '#a855f7' }); // Dual wings on back
              solidsList.push({ cx: px + 0.65, cy: py + 0.7, cz: pz + 0.25, w: 0.9, h: 0.2, d: 0.05, color: '#a855f7' });
            }
            if (hatSym === '🛡️') {
              solidsList.push({ cx: px - 0.55, cy: py + 0.9, cz: pz, w: 0.35, h: 0.18, d: 0.35, color: '#2563eb' }); // Shoulder pads blue
              solidsList.push({ cx: px + 0.55, cy: py + 0.9, cz: pz, w: 0.35, h: 0.18, d: 0.35, color: '#2563eb' });
            }
            if (hatSym === '⚔️') {
              solidsList.push({ cx: px + 0.3, cy: py + 0.5, cz: pz + 0.32, w: 0.08, h: 1.4, d: 0.08, color: '#f97316' }); // Orange sword strapping
            }
            if (hatSym === '🪶') {
              solidsList.push({ cx: px - 0.26 * bhScale, cy: hcy, cz: pz, w: 0.04 * bhScale, h: 0.3 * bhScale, d: 0.2 * bhScale, color: '#f59e0b', isHeadPart: true }); // Gold valkyrie wing
              solidsList.push({ cx: px + 0.26 * bhScale, cy: hcy, cz: pz, w: 0.04 * bhScale, h: 0.3 * bhScale, d: 0.2 * bhScale, color: '#f59e0b', isHeadPart: true });
            }
            if (hatSym === '🧔') {
              solidsList.push({ cx: px, cy: hcy - 0.13 * bhScale, cz: pz - 0.24 * bhScale, w: 0.35 * bhScale, h: 0.12 * bhScale, d: 0.05 * bhScale, color: '#44403c', isHeadPart: true }); // beard
            }
          });
        }

        const headRotY = Math.sin(Date.now() * 0.0025) * 0.42;
        const headRotX = Math.cos(Date.now() * 0.0035) * 0.10;

        // Process each solid into its corresponding individual faces or shapes
        solidsList.forEach(item => {
          const shape = item.shapeType || 'Block';

          if (shape === 'Sphere') {
            const proj = projectCoord(item.cx, item.cy, item.cz);
            if (proj) {
              const radius = item.w / 2;
              globalFaces.push({
                type: 'sphere',
                cx: proj.x,
                cy: proj.y,
                r: radius * proj.scale,
                color: item.color,
                avgZ: proj.z,
                id: Math.random().toString(),
                labelOverlay: item.labelOverlay
              } as any);
            }
            return;
          }

          if (shape === 'Cylinder') {
            const topProj = projectCoord(item.cx, item.cy + item.h / 2, item.cz);
            const bottomProj = projectCoord(item.cx, item.cy - item.h / 2, item.cz);
            if (topProj && bottomProj) {
              const rx = (item.w / 2) * topProj.scale;
              const ry = (item.d / 2) * topProj.scale * 0.45;
              globalFaces.push({
                type: 'cylinder',
                cxTop: topProj.x,
                cyTop: topProj.y,
                cxBottom: bottomProj.x,
                cyBottom: bottomProj.y,
                rx,
                ry,
                color: item.color,
                avgZ: (topProj.z + bottomProj.z) / 2,
                id: Math.random().toString(),
                labelOverlay: item.labelOverlay
              } as any);
            }
            return;
          }

          const x0 = item.cx - item.w / 2; const x1 = item.cx + item.w / 2;
          const y0 = item.cy - item.h / 2; const y1 = item.cy + item.h / 2;
          const z0 = item.cz - item.d / 2; const z1 = item.cz + item.d / 2;

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

          // Rotate head parts relative to head center
          if (item.isHeadPart) {
            cubVertices = cubVertices.map(v => {
              let tx = v.x - px;
              let ty = v.y - (py + 1.25);
              let tz = v.z - pz;

              // Rotate around X-axis (pitch)
              const cosH_X = Math.cos(headRotX);
              const sinH_X = Math.sin(headRotX);
              let ty1 = ty * cosH_X - tz * sinH_X;
              let tz1 = ty * sinH_X + tz * cosH_X;

              // Rotate around Y-axis (yaw)
              const cosH_Y = Math.cos(headRotY);
              const sinH_Y = Math.sin(headRotY);
              let tx2 = tx * cosH_Y - tz1 * sinH_Y;
              let tz2 = tx * sinH_Y + tz1 * cosH_Y;

              return {
                x: tx2 + px,
                y: ty1 + (py + 1.25),
                z: tz2 + pz
              };
            });
          }

          const projectedVerts = cubVertices.map(v => projectCoord(v.x, v.y, v.z));

          const faces3D = [
            { indices: [0, 1, 2, 3], shade: -15, isFront: true }, // Front front face
            { indices: [4, 5, 6, 7], shade: 10, isFront: false }, // Back
            { indices: [1, 5, 6, 2], shade: -5, isFront: false },  // Right side
            { indices: [0, 4, 7, 3], shade: -25, isFront: false }, // Left side
            { indices: [0, 1, 5, 4], shade: -35, isFront: false }, // Bottom
            { indices: [3, 2, 6, 7], shade: 15, isFront: false }   // Top
          ];

          faces3D.forEach((face, fIdx) => {
            const p1 = projectedVerts[face.indices[0]];
            const p2 = projectedVerts[face.indices[1]];
            const p3 = projectedVerts[face.indices[2]];
            const p4 = projectedVerts[face.indices[3]];

            if (p1 && p2 && p3 && p4) {
              const avgZ = (p1.z + p2.z + p3.z + p4.z) / 4;
              globalFaces.push({
                p1, p2, p3, p4,
                color: item.color,
                shade: face.shade,
                avgZ,
                emojiDecal: face.isFront ? item.emojiDecal : undefined,
                isFront: face.isFront,
                labelOverlay: fIdx === 5 ? item.labelOverlay : undefined // attach label trigger to top face
              } as any);
            }
          });
        });

        // SORT ALL INDIVIDUAL FACES GLOBALLY (Painter's algorithm resolves hollow, glitchy layers)
        globalFaces.sort((a, b) => b.avgZ - a.avgZ);

        // Draw sorted faces seamlessly
        globalFaces.forEach(face => {
          if ((face as any).type === 'sphere') {
            const f = face as any;
            ctx.save();
            // Gorgeous 3D radial glare effect
            const grad = ctx.createRadialGradient(
              f.cx - f.r * 0.3, f.cy - f.r * 0.3, f.r * 0.05,
              f.cx, f.cy, f.r
            );
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.35, f.color);
            grad.addColorStop(1, getShadedColor(f.color, -50));
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(f.cx, f.cy, f.r, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = getShadedColor(f.color, -15);
            ctx.lineWidth = 1;
            ctx.stroke();

            if (f.labelOverlay) {
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 8px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(f.labelOverlay, f.cx, f.cy - f.r - 4);
            }
            ctx.restore();
            return;
          }

          if ((face as any).type === 'cylinder') {
            const f = face as any;
            ctx.save();
            
            // Bottom face
            ctx.fillStyle = getShadedColor(f.color, -20);
            ctx.beginPath();
            ctx.ellipse(f.cxBottom, f.cyBottom, f.rx, f.ry, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Side body path
            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.moveTo(f.cxTop - f.rx, f.cyTop);
            ctx.lineTo(f.cxBottom - f.rx, f.cyBottom);
            ctx.ellipse(f.cxBottom, f.cyBottom, f.rx, f.ry, 0, Math.PI, 0, true);
            ctx.lineTo(f.cxTop + f.rx, f.cyTop);
            ctx.ellipse(f.cxTop, f.cyTop, f.rx, f.ry, 0, 0, Math.PI, true);
            ctx.closePath();
            ctx.fill();
            
            // Stroke side lines
            ctx.strokeStyle = getShadedColor(f.color, -25);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(f.cxTop - f.rx, f.cyTop);
            ctx.lineTo(f.cxBottom - f.rx, f.cyBottom);
            ctx.moveTo(f.cxTop + f.rx, f.cyTop);
            ctx.lineTo(f.cxBottom + f.rx, f.cyBottom);
            ctx.stroke();
            
            // Top face
            ctx.fillStyle = getShadedColor(f.color, 15);
            ctx.beginPath();
            ctx.ellipse(f.cxTop, f.cyTop, f.rx, f.ry, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = getShadedColor(f.color, 10);
            ctx.lineWidth = 1;
            ctx.stroke();

            if (f.labelOverlay) {
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 8px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(f.labelOverlay, f.cxTop, f.cyTop - f.ry - 4);
            }
            ctx.restore();
            return;
          }

          ctx.beginPath();
          ctx.moveTo(face.p1.x, face.p1.y);
          ctx.lineTo(face.p2.x, face.p2.y);
          ctx.lineTo(face.p3.x, face.p3.y);
          ctx.lineTo(face.p4.x, face.p4.y);
          ctx.closePath();

          if (face.color === 'forcefield') {
            ctx.fillStyle = 'rgba(34, 211, 238, 0.22)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            ctx.fillStyle = getShadedColor(face.color, face.shade);
            ctx.fill();

            ctx.strokeStyle = getShadedColor(face.color, face.shade - 15);
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Centred emoji projection (only when front face is facing front)
          if (face.isFront && face.emojiDecal) {
            const windingProduct = (face.p2.x - face.p1.x) * (face.p3.y - face.p1.y) - (face.p2.y - face.p1.y) * (face.p3.x - face.p1.x);
            if (windingProduct > 0) {
              const xMean = (face.p1.x + face.p2.x + face.p3.x + face.p4.x) / 4;
              const yMean = (face.p1.y + face.p2.y + face.p3.y + face.p4.y) / 4;
              ctx.save();
              ctx.fillStyle = '#000000';
              // Responsive font size
              ctx.font = `${Math.min(32, Math.max(8, Math.round(18 * (face.p1.scale / 45))))}px Arial`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(face.emojiDecal, xMean, yMean);
              ctx.restore();
            }
          }

          // Label texts for floating triggers (labelOverlay on Win pads or spawn names)
          if (face.labelOverlay && face.p4) {
            const pTopMedian = face.p4; // top face anchor
            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
            ctx.fillRect(pTopMedian.x - 38, pTopMedian.y - 14, 76, 12);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.strokeRect(pTopMedian.x - 38, pTopMedian.y - 14, 76, 12);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 7px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(face.labelOverlay, pTopMedian.x, pTopMedian.y - 6);
            ctx.restore();
          }
        });

        // 3D Screen overlays
        if (isGameOver) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.font = 'bold 20px font-display';
          ctx.fillStyle = '#f87171';
          ctx.textAlign = 'center';
          ctx.fillText('🚨 OOF! YOU TUMBLED! 🚨', canvas.width / 2, canvas.height / 2 - 20);

          ctx.font = '13px sans-serif';
          ctx.fillStyle = '#d1d5db';
          ctx.fillText('You slipped into the lava pit. Refine your 3D platform jumps!', canvas.width / 2, canvas.height / 2 + 10);
          ctx.fillText('Press SPACE BAR or click Re-spawn below', canvas.width / 2, canvas.height / 2 + 30);

          if (keys.current[' '] || keys.current['enter'] || keys.current['r']) {
            reset3DLevel();
          }
        }

        if (isStageCleared) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.font = 'bold 22px font-display';
          ctx.fillStyle = '#10b981';
          ctx.textAlign = 'center';
          ctx.fillText('🏆 3D PLATFORM VICTORY! 🏆', canvas.width / 2, canvas.height / 2 - 20);
          
          ctx.font = '13px sans-serif';
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(`Excellent! Guided your customized 3D avatar perfectly across the Obby steps.`, canvas.width / 2, canvas.height / 2 + 10);
          ctx.fillText(`Press SPACE BAR to reset and speedrun again.`, canvas.width / 2, canvas.height / 2 + 30);

          if (keys.current[' ']) {
            reset3DLevel();
          }
        }

        requestRef.current = requestAnimationFrame(game3DLoop);
      };

      requestRef.current = requestAnimationFrame(game3DLoop);
    } 
    // ==========================================
    // BRANCH B: 2D CLIENT OBBY PLATFORMER ROADWAY
    // ==========================================
    else {
      // Physics constants
      const gravity = 0.55;
      const friction = 0.84;

      const player = player2DRef.current;

      // Platform objects (Simple Obby levels)
      const platforms = game.sprites ? [
        { x: 0, y: 320, width: 220, height: 40, item: 'ground' },
        ...game.sprites
          .filter(s => s.name?.toLowerCase().includes('platform') || s.name?.toLowerCase().includes('ground') || s.name?.toLowerCase().includes('solid') || s.name?.toLowerCase().includes('block'))
          .map(s => ({
            x: (s.x + canvas.width / 2) - 35,
            y: (-s.y + canvas.height / 2) - 10,
            width: 70,
            height: 20,
            item: s.name?.toLowerCase().includes('ground') ? 'ground' : 'platform'
          }))
      ] : [
        { x: 0, y: 320, width: 200, height: 40, item: 'ground' },
        { x: 260, y: 280, width: 120, height: 15, item: 'platform' },
        { x: 440, y: 230, width: 100, height: 15, item: 'platform' },
        { x: 240, y: 170, width: 120, height: 15, item: 'platform' },
        { x: 50, y: 130, width: 120, height: 15, item: 'platform' }
      ];

      // Hazards (lava fields)
      const hazards = game.sprites ? [
        ...game.sprites
          .filter(s => s.name?.toLowerCase().includes('lava') || s.name?.toLowerCase().includes('hazard') || s.name?.toLowerCase().includes('laser'))
          .map(s => ({
            x: (s.x + canvas.width / 2) - 35,
            y: (-s.y + canvas.height / 2) + 5,
            width: 70,
            height: 15
          }))
      ] : [
        { x: 200, y: 345, width: 440, height: 15 } // Base lava trap
      ];

      const resetLevel = () => {
        player.x = 50;
        player.y = 200;
        player.vx = 0;
        player.vy = 0;
        stars2DRef.current.forEach(s => s.collected = false);
        currentScore = 0;
        setScore(0);
        isGameOver = false;
        isStageCleared = false;
      };

      // Game cycle loop
      const gameTick = () => {
        // 1. CLEAR CANVAS
        ctx.fillStyle = '#0f1115';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. BACKGROUND GRAPHICS
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 20) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Draw active game header metadata
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(10, 10, canvas.width - 20, 35);
        
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#a1a1aa';
        ctx.fillText(`EXPERIENCE SERVER: DEFAULT-EAST_US [PING: 17MS]`, 20, 32);

        // 3. COLLISION CHECKS & VELOCITY TRIGGERS
        if (resetRequestedRef.current) {
          resetLevel();
          resetRequestedRef.current = false;
        }

        if (!isGameOver && !isStageCleared) {
          // Lag-buffered keys input fetching
          const { keys: activeKeys, joyX: activeJoyX, joyY: activeJoyY } = getSimulatedInputs();

          // Move speed and gravity multipliers
          const speedMultiplier = adminRef.current.speedMultiplier;
          const gravityMultiplier = adminRef.current.gravityMultiplier;

          // Horizontal Inputs using arrows or WASD
          if (activeKeys['arrowleft'] || activeKeys['a']) {
            player.vx -= 1.3 * speedMultiplier; // Multiplied speed
          }
          if (activeKeys['arrowright'] || activeKeys['d']) {
            player.vx += 1.3 * speedMultiplier;
          }

          // Mobile Analog Joystick left/right integration
          if (Math.abs(activeJoyX) > 0.05) {
            player.vx += activeJoyX * 1.5 * speedMultiplier;
          }

          // ADMIN COMMAND LEVEL: Flight checks (:fly ignores gravity or locks height)
          if (adminRef.current.fly) {
            player.vy = 0;
            player.isGrounded = true;
            // Let Space/Up float up and Down sink
            if (activeKeys['arrowup'] || activeKeys['w'] || activeKeys[' ']) {
              player.y -= 4.5 * speedMultiplier;
            }
            if (activeKeys['arrowdown'] || activeKeys['s']) {
              player.y += 4.5 * speedMultiplier;
            }
          } else {
            // Jump Input
            if ((activeKeys['arrowup'] || activeKeys['w'] || activeKeys[' ']) && player.isGrounded) {
              player.vy = -11.5 * Math.sqrt(speedMultiplier); // proportional scale
              player.isGrounded = false;
              playSound(280, 0.15, 'sine');
            }
            player.vy += gravity * gravityMultiplier;
          }

          // Physics damping
          player.vx *= friction;

          // Position Updates
          player.x += player.vx;
          player.y += player.vy;

          // Boundaries checks
          if (player.x < 0) {
            player.x = 0;
            player.vx = 0;
          } else if (player.x + player.width > canvas.width) {
            player.x = canvas.width - player.width;
            player.vx = 0;
          }

          player.isGrounded = false;

          // Platform Collisions (taking into account melted platform health!)
          platforms.forEach((plat, pIdx) => {
            if (platformHealth2DRef.current[pIdx] <= 0) {
              return; // dissolved! player drops through
            }
            if (
              player.x + player.width > plat.x &&
              player.x < plat.x + plat.width &&
              player.y + player.height > plat.y &&
              player.y + player.height - player.vy <= plat.y + 10
            ) {
              player.y = plat.y - player.height;
              player.vy = 0;
              player.isGrounded = true;
            }
          });

          // Lava Hazards check (Immune if Forcefield is on!)
          hazards.forEach(hz => {
            if (
              player.x + player.width > hz.x &&
              player.x < hz.x + hz.width &&
              player.y + player.height > hz.y
            ) {
              if (adminRef.current.ff) {
                // Forcefield bounces player safe high!
                player.vy = -12;
                player.y = hz.y - player.height - 25;
                playSound(600, 0.25, 'sine');
              } else {
                isGameOver = true;
                playSound(120, 0.4, 'sawtooth');
              }
            }
          });

          // Spawn falling noobs if Noob Invasion is active (2D)
          if (chaosRef.current.noobs) {
            if (Math.random() < 0.045 && noobs2DRef.current.length < 24) {
              noobs2DRef.current.push({
                x: Math.random() * canvas.width,
                y: -10,
                vy: 2 + Math.random() * 3,
                size: 20 + Math.random() * 15
              });
            }
          }

          // Update Noob Physics & Collisions (2D)
          noobs2DRef.current.forEach(noob => {
            noob.y += noob.vy;

            // Collision with platforms
            platforms.forEach((plat, pIdx) => {
              if (platformHealth2DRef.current[pIdx] <= 0) return;
              if (
                noob.x + noob.size > plat.x &&
                noob.x < plat.x + plat.width &&
                noob.y + noob.size > plat.y &&
                noob.y + noob.size - noob.vy <= plat.y + 10
              ) {
                noob.y = plat.y - noob.size;
                noob.vy = -noob.vy * 0.4; // Bounce!
              }
            });

            // Collision with Player block
            if (
              noob.x + noob.size > player.x &&
              noob.x < player.x + player.width &&
              noob.y + noob.size > player.y &&
              noob.y < player.y + player.height
            ) {
              if (adminRef.current.ff) {
                // Bounces off forcefield!
                noob.vy = -4;
                if (noob.x < player.x) noob.x -= 20;
                else noob.x += 20;
              } else {
                // Push player sideways
                const pushDirection = (player.x + player.width / 2) > (noob.x + noob.size / 2) ? 1.5 : -1.5;
                player.vx += pushDirection * 3.5;
                player.vy = -2.5;
                playSound(320, 0.15, 'sawtooth');
              }
            }
          });

          // Filter out falling noobs
          noobs2DRef.current = noobs2DRef.current.filter(n => n.y < canvas.height + 40);

          // Spawn Acid Rain in 2D
          if (chaosRef.current.acid) {
            for (let i = 0; i < 2; i++) {
              aciddrops2DRef.current.push({
                x: Math.random() * canvas.width,
                y: -10,
                vy: 5 + Math.random() * 4
              });
            }
          }

          // Update Acid Rain collisions (2D)
          aciddrops2DRef.current.forEach(drop => {
            drop.y += drop.vy;

            // Corrosion checks with platforms
            platforms.forEach((plat, pIdx) => {
              if (platformHealth2DRef.current[pIdx] <= 0) return;
              if (
                drop.x > plat.x &&
                drop.x < plat.x + plat.width &&
                drop.y > plat.y &&
                drop.y - drop.vy <= plat.y + 10
              ) {
                platformHealth2DRef.current[pIdx] = Math.max(0, platformHealth2DRef.current[pIdx] - 15);
                drop.y = 999; // destroy drop
                playSound(1000, 0.03, 'triangle');
              }
            });
          });

          aciddrops2DRef.current = aciddrops2DRef.current.filter(d => d.y < canvas.height + 20);

          // Cooldown and regenerate health inside loop for 2D platform paths
          platformHealth2DRef.current.forEach((hp, idx) => {
            if (hp < 100) {
              if (hp <= 0) {
                platformHealth2DRef.current[idx] -= 0.5; // acting countdown cooldown!
                if (platformHealth2DRef.current[idx] < -120) {
                  platformHealth2DRef.current[idx] = 100; // regenerated!
                  playSound(650, 0.2, 'sine');
                }
              } else {
                platformHealth2DRef.current[idx] = Math.min(100, hp + 0.15);
              }
            }
          });

          // Stars collection check
          stars2DRef.current.forEach(star => {
            if (!star.collected) {
              const dx = (player.x + player.width / 2) - star.x;
              const dy = (player.y + player.height / 2) - star.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < player.width / 2 + 10) {
                star.collected = true;
                currentScore += 100;
                setScore(currentScore);
                playSound(880, 0.25, 'sine');

                // Highscore persistence updates
                 if (currentScore > highScore) {
                  setHighScore(currentScore);
                  localStorage.setItem(`roblox_highscore_${game.id}`, currentScore.toString());
                }

                // Win condition
                if (stars2DRef.current.every(s => s.collected)) {
                  isStageCleared = true;
                  playSound(1046.5, 0.5, 'sine');
                }
              }
            }
          });
        }

        // 4. RENDERING OBSTACLES & ENTITIES
        // Render platforms
        platforms.forEach(plat => {
          ctx.fillStyle = plat.item === 'ground' ? '#1f2937' : '#374151';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

          // Platform neon outline
          ctx.strokeStyle = '#4b5563';
          ctx.lineWidth = 2;
          ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
        });

        // Render hazard lasers
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        hazards.forEach(hz => {
          ctx.fillRect(hz.x, hz.y, hz.width, hz.height);
          
          // Neon lava highlights
          ctx.fillStyle = '#f87171';
          ctx.fillRect(hz.x, hz.y, hz.width, 2);
        });

        // Render custom sprites if available
        if (game.sprites) {
          game.sprites.forEach(sprite => {
            const rx = sprite.x + canvas.width / 2;
            const ry = -sprite.y + canvas.height / 2;
            
            // Render custom pixels if available
            if (sprite.customPixels && sprite.customPixels.length > 0) {
              const pixelSize = Math.max(1, Math.round(24 / sprite.customPixels.length));
              sprite.customPixels.forEach((row, rIdx) => {
                row.forEach((pixelColor, cIdx) => {
                  if (pixelColor && pixelColor !== 'transparent') {
                    ctx.fillStyle = pixelColor;
                    ctx.fillRect(
                      rx - 12 + cIdx * pixelSize,
                      ry - 12 + rIdx * pixelSize,
                      pixelSize,
                      pixelSize
                    );
                  }
                });
              });
            } else {
              // Otherwise render as emoji
              ctx.fillStyle = sprite.color || '#3b82f6';
              ctx.font = '20px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(sprite.emoji || '👾', rx, ry);
            }
            
            // Draw small label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(sprite.name, rx, ry - 18);
          });
        }

        // Render stars
        stars2DRef.current.forEach(star => {
          if (!star.collected) {
            ctx.font = '14px Arial';
            ctx.fillText('⭐', star.x - 7, star.y + 5);
          }
        });

        // 5. RENDER USER CHARACTER BLOCK (Customized details!)
        const isBH = adminRef.current.bighead;
        const headW = isBH ? player.width * 1.85 : player.width;
        const headH = isBH ? player.height * 1.5 : player.height;
        const headX = isBH ? player.x - (headW - player.width) / 2 : player.x;
        const headY = isBH ? player.y - (headH - player.height) - 4 : player.y;

        // Draw Player Torso (Below Head if bighead is active)
        if (isBH) {
          ctx.fillStyle = torsoColorHex;
          // Draw a standard rectangular R6 torso
          ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        // Draw Player Head
        ctx.fillStyle = skinColorHex;
        ctx.fillRect(headX, headY, headW, isBH ? headH : player.height - 8);

        // Face details
        ctx.fillStyle = '#000000';
        if (isBH) {
          // Larger eyes
          ctx.fillRect(headX + headW * 0.62, headY + headH * 0.25, 4, 4);
          ctx.fillRect(headX + headW * 0.28, headY + headH * 0.25, 4, 4);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(headX + headW * 0.5, headY + headH * 0.52, 9, 0, Math.PI);
          ctx.stroke();
        } else {
          // Standard face
          ctx.fillRect(player.x + 18, player.y + 6, 3, 3); // eye 1
          ctx.fillRect(player.x + 10, player.y + 6, 3, 3); // eye 2
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(player.x + 14, player.y + 16, 4, 0, Math.PI);
          ctx.stroke();
        }

        // Clothing layer if NOT bighead (if bighead is active, torso is drawn below)
        if (!isBH) {
          ctx.fillStyle = torsoColorHex;
          ctx.fillRect(player.x, player.y + 20, player.width, 8);
        }

        // Hat emoji placement based on custom avatar inventory index
        if (activeHats && activeHats.length > 0) {
          ctx.font = isBH ? '26px sans-serif' : '16px sans-serif';
          const hatX = isBH ? headX + (headW - 26) / 2 : player.x + 4;
          const hatY = isBH ? headY - 1 : player.y - 2;
          ctx.fillText(activeHats[0], hatX, hatY);
        }

        // Forcefield bubble aura (2D rendering)
        if (adminRef.current.ff) {
          ctx.save();
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 3;
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#06b6d4';
          ctx.beginPath();
          // Adjust radius depending on bighead status
          const radiusFF = isBH ? 35 : 22;
          ctx.arc(player.x + player.width / 2, player.y + player.height / 2, radiusFF, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
          ctx.fill();
          ctx.restore();
        }

        // 6. DRAW GAME OVER OR VICTORY PANEL
        if (isGameOver) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.font = 'bold 20px font-display';
          ctx.fillStyle = '#f87171';
          ctx.textAlign = 'center';
          ctx.fillText('🚨 BLOCK AVATAR WIPED OUT! 🚨', canvas.width / 2, canvas.height / 2 - 20);
          
          ctx.font = '13px sans-serif';
          ctx.fillStyle = '#d1d5db';
          ctx.fillText('You tumbled into the blazing neon lava. Do not lose hope!', canvas.width / 2, canvas.height / 2 + 10);
          ctx.fillText('Press SPACE BAR or click Re-spawn below', canvas.width / 2, canvas.height / 2 + 30);

          if (keys.current[' '] || keys.current['enter']) {
            resetLevel();
          }
        }

        if (isStageCleared) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.font = 'bold 22px font-display';
          ctx.fillStyle = '#10b981';
          ctx.textAlign = 'center';
          ctx.fillText('🏆 ESCAPED THE OBBY! VICTORY! 🏆', canvas.width / 2, canvas.height / 2 - 20);
          
          ctx.font = '13px sans-serif';
          ctx.fillStyle = '#d1d5db';
          ctx.fillText(`Outstanding reflexes! Gathered all stars for a clean 500 Score.`, canvas.width / 2, canvas.height / 2 + 10);
          ctx.fillText(`Press SPACE BAR to play another course loop.`, canvas.width / 2, canvas.height / 2 + 30);

          if (keys.current[' ']) {
            resetLevel();
          }
        }

        requestRef.current = requestAnimationFrame(gameTick);
      };

      requestRef.current = requestAnimationFrame(gameTick);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlayingCode, skinColor, avatarColor, activeHats, cameraView]);

  return (
    <div className="fixed inset-0 bg-[#161719]/98 z-50 flex items-center justify-center p-4">
      {/* 1. INITIAL SHIELD, PROGRAM Splash screen lobby AND BOOT-LOADER */}
      {showSplash ? (
        <div className="bg-[#1f2022] border-2 border-[#ffb347]/25 rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.85)] transform transition-transform duration-300 animate-zoomIn flex flex-col font-sans">
          {/* Top Banner accent */}
          <div className="h-32 bg-gradient-to-br from-[#1e1b4b] via-[#311c87] to-zinc-900 px-6 py-4 flex flex-col justify-end relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/10 via-purple-500/10 to-transparent"></div>
            {/* Genre Badge */}
            <span className="absolute top-4 right-4 bg-purple-500/20 border border-purple-400/40 text-purple-200 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-center">
              🏷️ {game.category || 'Sandbox'}
            </span>
            <h2 className="font-display font-black text-2xl text-white tracking-wide truncate uppercase drop-shadow">
              {game.title}
            </h2>
          </div>

          {/* Core metadata panel */}
          <div className="p-6 space-y-5 bg-[#1a1b1d] border-b border-[#313335]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Developer Name</span>
                <span className="text-sm font-semibold text-zinc-200 font-mono">
                  👤 {game.creator || 'Voxel Developer'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Date Created</span>
                <span className="text-sm font-semibold text-zinc-200 font-mono">
                  📅 {game.createdAt || 'Just now'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Server Genre</span>
                <span className="text-sm font-semibold text-zinc-200 font-mono">
                  🎮 {game.category || 'Obby Adventure'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Experience Size</span>
                <span className="text-sm font-semibold text-zinc-200 font-mono">
                  💾 {game.sizeMB || '4.2'} MB
                </span>
              </div>
            </div>

            {isEditingDesc ? (
              <div className="border-t border-[#313335] pt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Description</span>
                  <span className="text-[9px] text-[#3b82f6] font-semibold tracking-wider uppercase">Editing Description...</span>
                </div>
                <textarea
                  value={tempDesc}
                  onChange={(e) => setTempDesc(e.target.value)}
                  maxLength={400}
                  className="w-full h-24 p-2.5 bg-[#121315] text-xs text-zinc-200 border border-[#3b82f6]/50 rounded-lg outline-none focus:border-[#3b82f6] resize-none font-sans leading-relaxed scrollbar-thin transition-colors"
                  placeholder="Give your awesome game a short description so other players know what to expect!"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setTempDesc(game.description || '');
                      setIsEditingDesc(false);
                      playSound(400, 0.05, 'triangle');
                    }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-[10px] uppercase tracking-wider rounded transition-all cursor-pointer border border-[#313335]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (onUpdateGame) {
                        onUpdateGame({
                          ...game,
                          description: tempDesc
                        });
                      }
                      setIsEditingDesc(false);
                      playSound(900, 0.1, 'sine');
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-[10px] uppercase tracking-wider rounded transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-[#313335] pt-4 group relative">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Description</span>
                  <button
                    onClick={() => {
                      setIsEditingDesc(true);
                      playSound(600, 0.05, 'sine');
                    }}
                    className="px-2 py-0.5 bg-[#2a2b2d] hover:bg-zinc-700 text-zinc-300 font-extrabold text-[9px] uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1 border border-[#313335] shadow"
                  >
                    ✏️ Edit Description
                  </button>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed max-h-24 overflow-y-auto scrollbar-thin bg-[#121315]/35 p-2 rounded-lg border border-[#313335]/30">
                  {game.description || 'Welcome to this custom sandbox experience! Explore, complete challenges, and hang out with other voxel players in this multiplayer-ready blocky world.'}
                </p>
              </div>
            )}
          </div>

          {/* Bottom actions cover */}
          <div className="p-5 bg-[#121315] flex justify-between items-center px-6">
            <button
              onClick={onClose}
              className="p-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer border border-[#313335]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                playSound(650, 0.15, 'sine');
                setTimeout(() => playSound(880, 0.25, 'sine'), 100);
                setShowSplash(false);
              }}
              className="p-2.5 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center gap-2 animate-pulse hover:animate-none"
            >
              🚀 Launch Game Client
            </button>
          </div>
        </div>
      ) : launchStep < launchMessages.length ? (
        <div className="bg-[#232527] border border-[#393B3D] rounded w-full max-w-md p-6 relative text-center space-y-6">
          <div className="flex flex-col items-center">
            {/* Logo slanted blocks loader animate */}
            <div className="w-16 h-16 bg-white rounded flex items-center justify-center transform -rotate-12 animate-pulse shadow-xl mb-4">
              <div className="w-6 h-6 bg-[#232527] rounded" />
            </div>
            
            <h3 className="font-display font-black text-xl text-white tracking-wide uppercase">
              Voxel Game Client
            </h3>
            <p className="text-xs text-zinc-400 font-semibold font-mono animate-pulse">
              BOOTING RECT-SANDBOX CONTAINER
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-[#111214] h-1.5 rounded-full overflow-hidden border border-[#393B3D]">
              <div 
                className="bg-white h-full transition-all duration-700 ease-out" 
                style={{ width: `${(launchStep / launchMessages.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-gray-500 font-mono">
              <span className="truncate">{launchMessages[launchStep]}</span>
              <span>{Math.round((launchStep / launchMessages.length) * 100)}%</span>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 font-mono border-t border-[#393B3D] pt-3">
            Voxel Client Process ID: <span className="text-gray-300 font-bold">#RX-{Math.floor(Math.random() * 8999) + 1000}</span>
          </div>
        </div>
      ) : (
        /* 2. THE GAMEPLAY SIMULATOR SCREEN */
        <div className="bg-[#232527] border border-[#393B3D] rounded w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col relative animate-zoomIn font-sans">
          
          {/* Header Bar */}
          <div className="px-4 py-3 bg-[#111214] border-b border-[#393B3D] flex justify-between items-center select-none animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-lg">🎮</span>
              <div>
                <h4 className="font-bold text-sm text-white">{game.title}</h4>
                <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                  <span>Server: USA-EAST_1</span>
                  <span>●</span>
                  <span className="text-green-400">Latency: 17ms</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!game.is2D && (
                <button
                  type="button"
                  onClick={() => {
                    setCameraView(prev => prev === '3rd' ? '1st' : '3rd');
                    playSound(400, 0.1, 'sine');
                  }}
                  className="p-1 px-2.5 py-1 rounded border bg-[#111214] hover:bg-[#323436] text-gray-200 hover:text-white border-[#393B3D] transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-bold font-mono"
                  title="Toggle 1st / 3rd Person camera views of the 3D obby"
                >
                  {cameraView === '3rd' ? '🎥 3rd Person' : '👁️ 1st Person'}
                </button>
              )}

              <button
                onClick={() => setShowTouchControls(prev => !prev)}
                className={`p-1 px-2.5 py-1 rounded border transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-bold font-mono ${
                  showTouchControls
                    ? 'bg-indigo-600/40 hover:bg-indigo-600/50 text-indigo-300 border-indigo-500/50' 
                    : 'bg-[#111214] hover:bg-[#323436] text-gray-400 hover:text-white border-[#393B3D]'
                }`}
                title="Toggle Virtual Joystick Controls"
              >
                📱 <span className="hidden xs:inline">Mobile Joysticks</span>
              </button>
              
              <span className="text-xs font-mono font-bold bg-[#111214] px-2.5 py-1 border border-[#393B3D] rounded text-white flex items-center gap-1">
                <Trophy size={11} className="text-[#eab308]" /> Score: {score}
              </span>
              <span className="text-xs font-mono font-bold bg-[#111214] px-2.5 py-1 border border-[#393B3D] rounded text-gray-400 hidden sm:inline-block">
                🏆 High: {highScore}
              </span>
              <button
                onClick={onClose}
                className="p-1 px-1.5 bg-[#111214] hover:bg-[#323436] text-white hover:text-[#ef4444] rounded border border-[#393B3D] transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold"
                title="Exit game client"
              >
                <X size={15} /> <span className="font-bold font-mono">X</span>
              </button>
            </div>
          </div>

          {/* Interactive Game Canvas Box */}
          <div className="relative bg-black flex justify-center items-center aspect-video sm:p-2 p-0 overflow-hidden">
            <canvas 
              ref={canvasRef} 
              className="max-w-full rounded shadow-xl border border-zinc-900 bg-[#0f1115] cursor-grab active:cursor-grabbing select-none touch-none"
              style={{ touchAction: 'none' }}
              onMouseDown={(e) => handleCanvasDragStart(e.clientX, e.clientY)}
              onMouseMove={(e) => handleCanvasDragMove(e.clientX, e.clientY)}
              onMouseUp={handleCanvasDragEnd}
              onMouseLeave={handleCanvasDragEnd}
              onTouchStart={(e) => {
                if (e.touches.length > 0) {
                  handleCanvasDragStart(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length > 0) {
                  handleCanvasDragMove(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={handleCanvasDragEnd}
              onTouchCancel={handleCanvasDragEnd}
            />

            {isSelfBanned && (
              <div id="ban-screen-overlay" className="absolute inset-0 bg-[#0f1115]/95 z-55 flex items-center justify-center p-4 select-none pointer-events-auto animate-fadeIn">
                <div className="bg-[#1b1c1e] border border-red-500/40 rounded-lg p-5 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-4 pointer-events-auto">
                  
                  {/* Warning Symbol */}
                  <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 animate-pulse">
                    <ShieldAlert size={22} />
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="font-display font-black text-sm text-red-500 uppercase tracking-wide">
                      Connection Terminated
                    </h3>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      Voxel Security & Moderation Services
                    </p>
                  </div>

                  <div className="border border-white/5 bg-black/40 rounded-lg p-3 w-full text-left space-y-2 text-[11px] font-sans">
                    <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                      <span className="text-zinc-400">Moderated Account</span>
                      <span className="font-mono text-white font-bold">You (Gamer)</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-400 font-semibold block text-[9px] uppercase tracking-wider">Reason for Ban</span>
                      <p className="text-amber-300 font-sans leading-relaxed bg-[#111214] border border-white/5 p-2 rounded leading-relaxed select-text cursor-text text-xs">
                        {isSelfAdminBanned 
                          ? "Permanent manual administrative ban executed by the game landlord/experience developer." 
                          : "Exceeded 6 unique abuse report flags from different players across game sessions."}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-white/5">
                      <span className="text-zinc-400 font-semibold block text-[9px] uppercase tracking-wider">Ban Classification</span>
                      <p className="text-zinc-300 leading-normal text-[10px]">
                        {isSelfAdminBanned 
                          ? "🔒 MANUAL ADMIN PERMABAN. This ban is permanent, irreversible, and overrides any appeal procedures. The server host has blacklisted your identifier forever." 
                          : "💼 AUTOMATIC SUSPENSION. Your unique warnings threshold was breached in active multiplayer play. You are eligible to file one appeal to our admin staff below."}
                      </p>
                    </div>
                  </div>

                  {/* Appeal Form / Status Area */}
                  {!isSelfAdminBanned && (
                    <div className="w-full border border-white/5 bg-black/25 rounded-lg p-3 text-left space-y-2">
                      <span className="text-cyan-400 font-mono text-[9px] uppercase tracking-wider font-bold block">
                        🛡️ Voxel Client Appeals Board
                      </span>

                      {(() => {
                        // Dynamically look up the user's filed appeal
                        const db = getModerationDB();
                        const userModData = db['You (Gamer)'];
                        const activeAppeal = userModData?.appeals?.slice(-1)[0]; // get latest appeal

                        if (!activeAppeal) {
                          return (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!userAppealText.trim()) return;
                                submitAppealInDB('You (Gamer)', game.id, game.title, userAppealText);
                                playSound(1046, 0.25, 'sine');
                                setReportsDBVersion(v => v + 1);
                                setIsUserAppealFiled(true);
                                setUserAppealText('');
                              }}
                              className="space-y-2 text-[11px]"
                            >
                              <p className="text-zinc-400 text-[9px]">
                                State why this warning threshold spike was a false-positive or describe how your gameplay is compliant:
                              </p>
                              <textarea
                                value={userAppealText}
                                onChange={(e) => setUserAppealText(e.target.value)}
                                placeholder="I was lagging / I am sorry, I did not cheat..."
                                className="w-full bg-[#111214] border border-[#393B3D] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-md p-2 text-white placeholder-zinc-650 outline-none h-14 resize-none cursor-text text-xs leading-relaxed"
                                maxLength={280}
                                required
                              />
                              <button
                                type="submit"
                                className="w-full bg-cyan-650 hover:bg-cyan-600 hover:scale-[1.01] active:scale-[0.99] hover:shadow-cyan-500/10 text-white font-bold text-xs uppercase p-2 rounded cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg"
                              >
                                <Send size={11} /> Submit Appeals Log Entry
                              </button>
                            </form>
                          );
                        }

                        // Appeal is filed, let's render the status!
                        return (
                          <div className="space-y-1.5 text-[10px] leading-relaxed">
                            <div className="bg-[#111214] border border-white/5 p-2 rounded text-zinc-300 italic font-mono select-text">
                              "{activeAppeal.statement}"
                            </div>
                            <div className="flex items-center justify-between bg-black/40 border border-[#393B3D] p-1.5 rounded">
                              <span className="text-zinc-400">Status:</span>
                              <span className={`font-mono font-bold uppercase px-1.5 py-0.5 rounded text-[9px] border ${
                                activeAppeal.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                                activeAppeal.status === 'APPROVED' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' :
                                'bg-red-950/30 text-red-400 border-red-500/20'
                              }`}>
                                {activeAppeal.status}
                              </span>
                            </div>
                            
                            {activeAppeal.status === 'PENDING' && (
                              <p className="text-amber-400/90 text-[9px] text-center font-mono">
                                ⏳ Pending: admins can approve/reject your appeal in the "Chaos Menu" on the top right.
                              </p>
                            )}
                            {activeAppeal.status === 'REJECTED' && (
                              <p className="text-red-400 text-[9px] text-center font-mono">
                                ❌ Appeal rejected: Standard suspension active.
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-[#1c1d1f] hover:bg-red-600 text-white font-bold text-xs uppercase p-2 border border-[#393B3D] hover:border-red-500 rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <X size={11} /> Leave Experience
                  </button>
                </div>
              </div>
            )}

            {pendingAdminConfirm && (
              <div id="admin-confirm-overlay" className="absolute inset-0 bg-[#0f1115]/90 z-55 flex items-center justify-center p-4 select-none pointer-events-auto animate-fadeIn">
                <div className="bg-[#1b1c1e] border border-red-500/30 rounded-lg p-5 max-w-sm w-full shadow-2xl flex flex-col space-y-4 pointer-events-auto">
                  
                  {/* Warning Symbol & Header */}
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                      pendingAdminConfirm.action === 'BANNED' 
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 font-bold' 
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold'
                    }`}>
                      <ShieldAlert size={18} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-display font-black text-sm text-white uppercase tracking-wide">
                        Confirm Admin Action
                      </h4>
                      <p className="text-[9px] font-mono text-zinc-450 uppercase tracking-wider">
                        Prevent accidental moderation
                      </p>
                    </div>
                  </div>

                  {/* Targeted Action Label */}
                  <div className="text-left text-xs leading-normal space-y-1">
                    <p className="text-zinc-350">
                      You are about to execute a <span className={`font-black font-sans ${pendingAdminConfirm.action === 'BANNED' ? 'text-red-400' : 'text-amber-400'}`}>{pendingAdminConfirm.action}</span> sanction against:
                    </p>
                    <div className="bg-black/45 border border-white/5 p-2 rounded text-center">
                      <span className="text-white font-mono text-xs font-black tracking-wide">
                        {pendingAdminConfirm.targetName}
                      </span>
                    </div>
                  </div>

                  {/* Player History Summary Data block */}
                  <div className="border border-white/5 bg-black/40 rounded-lg p-3 text-left space-y-2 text-[10px] font-sans">
                    <div className="text-cyan-400 font-mono text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1 border-b border-white/5 pb-1 mb-1 shadow-sm">
                      <Activity size={10} /> Active Player History
                    </div>

                    {(() => {
                      const db = getModerationDB();
                      const pRecord = db[pendingAdminConfirm.targetName];
                      const totalReports = pRecord?.reports?.length || 0;
                      const warnings = pRecord?.warningsCount || 0;
                      const activeStatus = pRecord?.isBanned ? '❌ BANNED' : '🟢 ACTIVE';
                      const reportItems = pRecord?.reports || [];

                      return (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[8.5px] font-mono border-b border-white/5 pb-1.5 text-zinc-400">
                            <div>
                              <span>Status: </span>
                              <span className="text-white font-bold">{activeStatus}</span>
                            </div>
                            <div>
                              <span>Warnings: </span>
                              <span className="text-amber-400 font-bold">{warnings}</span>
                            </div>
                            <div>
                              <span>Total Incident Flags: </span>
                              <span className="text-white font-bold">{totalReports}</span>
                            </div>
                            <div>
                              <span>Appeals Filed: </span>
                              <span className="text-white font-bold">
                                {pRecord?.appeals && pRecord.appeals.length > 0 
                                  ? `${pRecord.appeals.slice(-1)[0].status}` 
                                  : 'None'}
                              </span>
                            </div>
                          </div>

                          {reportItems.length === 0 ? (
                            <p className="text-[9px] text-zinc-500 italic">No historical reports filed inside current session.</p>
                          ) : (
                            <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1 custom-scrollbar text-[8px]">
                              <span className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-wider block">Incidents registered:</span>
                              {reportItems.map((rep, idx) => (
                                <div key={idx} className="bg-[#111214] border border-white/5 p-1 rounded text-[8px] leading-relaxed">
                                  <div className="flex justify-between items-center text-zinc-500 text-[6.5px] font-mono mb-0.5">
                                    <span className="text-amber-450 font-bold">Reason: {rep.reason}</span>
                                    <span>{rep.timestamp}</span>
                                  </div>
                                  <p className="text-zinc-300 italic truncate" title={rep.text}>"{rep.text}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Extra Confirmation Warning */}
                  <div className="text-[8px] text-red-400/90 leading-tight italic text-left flex items-start gap-1">
                    <span className="shrink-0">⚠️</span>
                    <span>
                      {pendingAdminConfirm.action === 'BANNED' 
                        ? 'Administrative blacklist action cannot be auto-reversed by system. Verify logs before initiating.' 
                        : 'Muting prevents safety spikes and censors offending chat logs on general channels.'}
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 pt-1 select-none">
                    <button
                      type="button"
                      onClick={() => setPendingAdminConfirm(null)}
                      className="flex-1 bg-[#1c1d1f] hover:bg-[#2c2d2f] text-zinc-400 hover:text-white border border-[#393B3D] text-[10px] font-bold uppercase p-2 rounded cursor-pointer transition-all text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleAdminAction(
                          pendingAdminConfirm.reportId,
                          pendingAdminConfirm.action,
                          pendingAdminConfirm.targetName
                        );
                        setPendingAdminConfirm(null);
                      }}
                      className={`flex-1 text-white text-[10px] font-black uppercase p-2 rounded cursor-pointer transition-all text-center flex items-center justify-center gap-1 shadow-md ${
                        pendingAdminConfirm.action === 'BANNED' 
                          ? 'bg-red-650 hover:bg-red-650 active:scale-95' 
                          : 'bg-amber-550 hover:bg-[#ffae00] text-gray-950 active:scale-95 border border-amber-500/20'
                      }`}
                    >
                      Confirm {pendingAdminConfirm.action === 'BANNED' ? 'Ban 🔨' : 'Mute 🔇'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Helper HUD overlay (bottom left, out of the way of top-left chat!) */}
            {showControls && (
              <div className="absolute bottom-4 left-4 bg-[#111214]/95 border border-[#393B3D]/80 p-3 rounded-lg text-[11px] text-gray-300 font-sans pointer-events-auto select-none max-w-[200px] shadow-2xl z-20">
                <button 
                  onClick={() => setShowControls(false)}
                  className="absolute top-1 right-1 p-0.5 hover:bg-white/10 rounded cursor-pointer text-gray-400 hover:text-white transition-colors"
                  title="Close instructions"
                >
                  <X size={11} />
                </button>
                <span className="font-bold text-white uppercase tracking-wider block mb-1 font-mono text-[9px] text-cyan-400 flex items-center gap-1">
                  🕹️ Instruction
                </span>
                <p className="leading-relaxed text-[9px]">
                  Walk: <strong className="text-white">A/D</strong> or <strong className="text-white">⬅/➡</strong>. Jump: <strong className="text-white">W/Space</strong>. Type <strong className="text-cyan-400">/</strong> to focus chat.
                </p>
              </div>
            )}

            {/* Classic Voxel Chat HUD (Top Left) */}
            <div className="absolute top-3 left-3 z-30 flex flex-col gap-1 pointer-events-auto max-w-[240px] sm:max-w-[280px]">
              {/* Toggle Chat Speech Bubble Button */}
              <button
                type="button"
                onClick={() => {
                  setIsChatExpanded(prev => !prev);
                  playSound(600, 0.05);
                }}
                className={`p-1.5 w-10 h-10 flex items-center justify-center rounded border transition-colors select-none ${
                  isChatExpanded 
                    ? 'bg-black/60 border-white/20 text-white' 
                    : 'bg-black/35 hover:bg-black/55 border-white/10 text-zinc-300'
                }`}
                title="Toggle Voxel Chat History"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>

              {/* Chat history list and entry field */}
              {isChatExpanded && (
                <div className="flex flex-col bg-black/60 backdrop-blur-md border border-white/15 rounded-lg p-2.5 font-sans overflow-hidden shadow-2xl text-left">
                  {/* Spatial Voice Beta Header Bar */}
                  <div className="flex items-center justify-between bg-zinc-950/70 border border-white/10 rounded-md p-1.5 mb-1.5 text-[9px] font-mono select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${!isMicMuted ? 'bg-green-400' : 'bg-red-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${!isMicMuted ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </span>
                      <span className="text-zinc-200 font-bold tracking-wide uppercase flex items-center gap-1">
                        🎙️ Spatial Voice Beta
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* MIC Toggle Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMicMuted(prev => !prev);
                          playSound(500, 0.08);
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all border shrink-0 ${
                          isMicMuted 
                            ? 'bg-red-950/30 text-red-300 border-red-500/20 hover:bg-red-900/20 cursor-pointer' 
                            : 'bg-green-950/40 text-green-300 border-green-500/30 hover:bg-green-900/20 cursor-pointer animate-pulse'
                        }`}
                        title={isMicMuted ? "Turn microphone on (unmute)" : "Mute microphone"}
                      >
                        {isMicMuted ? <MicOff size={10} /> : <Mic size={10} className="text-green-400" />}
                        <span>{isMicMuted ? 'Muted' : 'Mic On'}</span>
                      </button>

                      {/* SPEAKERS / VOICE CHAT MUTE Toggle Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsVoiceChatMuted(prev => !prev);
                          playSound(550, 0.08);
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all border shrink-0 ${
                          isVoiceChatMuted 
                            ? 'bg-amber-950/30 text-amber-300 border-amber-500/20 hover:bg-amber-900/20 cursor-pointer' 
                            : 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30 hover:bg-cyan-900/20 cursor-pointer'
                        }`}
                        title={isVoiceChatMuted ? "Unmute all co-player voices" : "Mute all co-player voices"}
                      >
                        {isVoiceChatMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                        <span>{isVoiceChatMuted ? "Muted" : "Unmuted"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Active co-player speaking indicator */}
                  {activeVoiceSpeaker && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-950/50 to-emerald-900/20 border border-emerald-500/20 rounded p-1.5 px-2 mb-1.5 select-none animate-pulse">
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <div className="flex gap-[1.5px] items-end h-2 w-3 pb-[1px]">
                          <span className="bg-emerald-400 w-[2px] h-1 animate-pulse" />
                          <span className="bg-emerald-400 w-[2px] h-2 animate-bounce" />
                          <span className="bg-emerald-400 w-[2px] h-1.5 animate-pulse" />
                        </div>
                      </div>
                      <div className="text-[9px] min-w-0">
                        <span className="font-extrabold text-emerald-300 mr-1 font-mono uppercase">🎙️ {activeVoiceSpeaker}:</span>
                        <span className="text-zinc-200 font-medium italic truncate">{activeSpeakerText}</span>
                      </div>
                    </div>
                  )}

                  {/* Active local user speaking indicator */}
                  {isUserSpeaking && !isMicMuted && (
                    <div className="flex items-center gap-2 bg-cyan-950/50 border border-cyan-500/20 rounded p-1.5 px-2 mb-1.5 select-none animate-pulse">
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full bg-cyan-400 opacity-75 rounded-full"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                        </span>
                        <div className="flex gap-[1.5px] items-end h-2 w-3 pb-[1px]">
                          <span className="bg-cyan-400 w-[2px]" style={{ height: `${Math.min(8, Math.max(2, localMicVolume / 3))}px` }} />
                          <span className="bg-cyan-400 w-[2px]" style={{ height: `${Math.min(8, Math.max(2, localMicVolume / 2))}px` }} />
                          <span className="bg-cyan-400 w-[2px]" style={{ height: `${Math.min(8, Math.max(2, localMicVolume / 4))}px` }} />
                        </div>
                      </div>
                      <div className="text-[9px] font-mono text-cyan-300">
                        🎙️ <span className="font-extrabold uppercase mr-1">You:</span>
                        <span className="text-zinc-350 italic">Speaking (active mic detection value: {Math.round(localMicVolume)})...</span>
                      </div>
                    </div>
                  )}

                  {/* Message scroll log viewport */}
                  <div ref={chatScrollRef} className="h-28 overflow-y-auto mb-1.5 rounded space-y-1 p-1 pr-1.5 flex flex-col scrollbar-thin scrollbar-thumb-white/15 text-[10px]">
                    {chatMessages.map((msg) => {
                      const isSenderBlocked = blockedUsers?.some(bu => bu.toLowerCase() === msg.sender.toLowerCase());
                      if (isSenderBlocked) return null;

                      const msgTimeStr = msg.createdAt 
                        ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                      return (
                        <div key={msg.id} className="leading-tight break-words select-text flex justify-between items-start gap-1 group py-0.5">
                          <div className="flex items-start flex-1 min-w-0">
                            <span className="text-[7.5px] text-zinc-500 font-mono mr-1.5 pt-0.5 select-none shrink-0" title="Local network timestamp">
                              [{msgTimeStr}]
                            </span>
                            <div className="min-w-0">
                              {msg.type === 'system' ? (
                                <span className="text-purple-400 font-semibold italic">[System] {msg.text}</span>
                              ) : msg.type === 'admin' ? (
                                <span className="text-cyan-400 font-bold"><span className="text-[#a1a1aa] font-normal">Console run:</span> {msg.text}</span>
                              ) : (
                                <>
                                  <span 
                                    className={`font-semibold mr-1 ${
                                      msg.sender === 'You' ? 'text-sky-300' :
                                      msg.sender === 'Builderman' ? 'text-amber-400' :
                                      msg.sender === 'Shedletsky' ? 'text-rose-400' :
                                      'text-[#10b981]'
                                    }`}
                                  >
                                    {msg.sender}:
                                  </span>
                                  <span className="text-white font-medium">{msg.text}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Report Player CTA - Active for non-You, non-System co-players */}
                          {msg.type === 'normal' && msg.sender !== 'You' && msg.sender !== 'System' && msg.sender !== 'Server' && msg.sender !== 'Admin Console' && (
                            <button
                              type="button"
                              onClick={() => handleReportPlayer(msg)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-950/70 hover:bg-red-900/90 hover:text-red-200 border border-red-500/30 rounded text-[7px] px-1 py-0.5 leading-none font-bold select-none cursor-pointer shrink-0"
                              title={`Flag ${msg.sender} for moderation`}
                            >
                              ⚠️ Report
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Text key slot */}
                  <div className="flex items-center gap-1.5 border-t border-white/10 pt-1.5">
                    <input
                      id="roblox-chat-input"
                      type="text"
                      maxLength={80}
                      placeholder="Type msg or :cmds..."
                      className="bg-black/75 hover:bg-black/95 border border-white/15 rounded px-2 py-1 text-[10px] text-white flex-1 min-w-0 outline-none focus:border-cyan-500/50 font-mono transition-colors"
                      value={activeChatInput}
                      onChange={(e) => setActiveChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          if (activeChatInput.trim()) {
                            submitChatMessage(activeChatInput.trim());
                            setActiveChatInput('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (activeChatInput.trim()) {
                          submitChatMessage(activeChatInput.trim());
                          setActiveChatInput('');
                        }
                      }}
                      className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-neutral-950 rounded text-[9px] font-black uppercase transition-all tracking-wider shrink-0 cursor-pointer"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Server Lag Warning (Top Center Alert) */}
            {chaosLag && (
              <div className="absolute top-3 inset-x-0 mx-auto w-fit z-20 bg-rose-950/90 border border-rose-500/50 text-rose-300 text-[9px] font-mono px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2 network-warning animate-pulse select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping mr-1" />
                <span>⚠️ Instability: Latency 982ms (packet loss 14.5%)</span>
              </div>
            )}

            {/* Game Notification Banner */}
            {gameNotification && (
              <div className="absolute top-14 inset-x-0 mx-auto w-fit z-40 bg-[#16171a]/95 border border-cyan-500/50 text-cyan-300 text-[9.5px] font-sans font-extrabold px-4.5 py-2 rounded shadow-2xl flex items-center gap-2 animate-bounce select-none pointer-events-none">
                <span className="w-1.5 h-1.5 bg-cyan-500 animate-ping rounded-full shrink-0" />
                <span>{gameNotification}</span>
              </div>
            )}

            {/* Administrative Chaos Injector & Leaderboard Panel (Top Right) */}
            <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-1.5 pointer-events-auto select-none">
              <div className="flex gap-1.5 flex-wrap justify-end">
                {/* Leaderboard Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaderboard(prev => !prev);
                    playSound(600, 0.05);
                  }}
                  className={`p-1.5 px-3 h-10 flex items-center gap-1 rounded border transition-all pointer-events-auto select-none cursor-pointer ${
                    showLeaderboard 
                      ? 'bg-cyan-950/80 border-cyan-500/30 text-cyan-300' 
                      : 'bg-black/50 hover:bg-black/75 border-white/10 text-white'
                  }`}
                  title="Toggle Leaderboard"
                >
                  <Users size={13} className={showLeaderboard ? "text-cyan-400" : "text-zinc-300"} />
                  <span className="text-[10px] font-bold font-mono tracking-wide">👥 Leaderboard</span>
                </button>

                {/* Chaos Menu Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsChaosMenuOpen(prev => !prev);
                    playSound(650, 0.1);
                  }}
                  className={`p-1.5 px-3 h-10 flex items-center gap-1.5 rounded border transition-all pointer-events-auto select-none cursor-pointer ${
                    isChaosMenuOpen 
                      ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' 
                      : 'bg-black/50 hover:bg-black/75 border-white/10 text-white'
                  }`}
                  title="Toggle Administrative Chaos panel"
                >
                  <Sliders size={13} className={isChaosMenuOpen ? "animate-spin text-rose-400" : "text-zinc-300"} />
                  <span className="text-[10px] font-bold font-mono tracking-wide">🔥 Chaos Menu</span>
                </button>
              </div>

              {isChaosMenuOpen && (
                <div className="w-56 bg-[#16171a]/95 border border-[#393B3D]/80 rounded-lg p-2.5 font-sans flex flex-col gap-2 shadow-2xl text-left select-none animate-zoomIn">
                  <div>
                    <span className="text-[9px] font-black tracking-widest text-[#ef4444] block uppercase font-mono mb-0.5">
                      🔥 Chaos Injects
                    </span>
                    <p className="text-[8px] text-[#a1a1aa] leading-snug">
                      Toggle sandbox code injection or trigger server disasters.
                    </p>
                  </div>

                  {/* Disasters toggles */}
                  <div className="flex flex-col border-t border-white/5 pt-1.5 gap-1.5">
                    {/* Noob Invasion */}
                    <button
                      type="button"
                      onClick={() => {
                        setChaosNoobs(prev => !prev);
                        playSound(600, 0.1, 'sawtooth');
                      }}
                      className={`w-full p-1.5 rounded flex justify-between items-center border transition-all text-[9.5px] font-bold font-mono ${
                        chaosNoobs
                          ? 'bg-[#fbbf24]/10 border-[#eab308]/50 text-[#facc15]'
                          : 'bg-black/20 hover:bg-black/40 border-white/5 text-zinc-400'
                      }`}
                    >
                      <span>Noob Invasion</span>
                      <span className="text-[8px] opacity-80 uppercase">
                        {chaosNoobs ? 'Active' : 'Deploy'}
                      </span>
                    </button>

                    {/* Acid Rain */}
                    <button
                      type="button"
                      onClick={() => {
                        setChaosAcid(prev => !prev);
                        playSound(450, 0.1, 'sawtooth');
                      }}
                      className={`w-full p-1.5 rounded flex justify-between items-center border transition-all text-[9.5px] font-bold font-mono ${
                        chaosAcid
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-[#4ade80]'
                          : 'bg-black/20 hover:bg-black/40 border-white/5 text-zinc-400'
                      }`}
                    >
                      <span>Acid Rain</span>
                      <span className="text-[8px] opacity-80 uppercase">
                        {chaosAcid ? 'Melt' : 'Engage'}
                      </span>
                    </button>

                    {/* Server Lag */}
                    <button
                      type="button"
                      onClick={() => {
                        setChaosLag(prev => !prev);
                        playSound(355, 0.08, 'triangle');
                      }}
                      className={`w-full p-1.5 rounded flex justify-between items-center border transition-all text-[9.5px] font-bold font-mono ${
                        chaosLag
                          ? 'bg-rose-950/45 border-rose-500/40 text-[#f87171]'
                          : 'bg-black/20 hover:bg-black/40 border-white/5 text-zinc-400'
                      }`}
                    >
                      <span>Server Lag</span>
                      <span className="text-[8px] opacity-80 uppercase">
                        {chaosLag ? 'Lagging' : 'Spike'}
                      </span>
                    </button>
                  </div>

                  {/* Admin Shortcuts */}
                  <div className="border-t border-white/5 pt-1.5 flex flex-col gap-1">
                    <span className="text-[8.5px] font-bold text-cyan-400 font-mono uppercase tracking-wider">
                      ⚡ Quick Commands
                    </span>

                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newFly = !adminFly;
                          setAdminFly(newFly);
                          playSound(550, 0.08, 'sine');
                        }}
                        className={`p-1 rounded border text-[9px] font-semibold text-center truncate transition-all ${
                          adminFly
                            ? 'bg-sky-600/30 border-sky-400/50 text-sky-200'
                            : 'bg-black/35 hover:bg-black/55 border-white/5 text-zinc-400'
                        }`}
                      >
                        🚀 {adminFly ? 'Fly: On' : 'Fly'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const newFF = !adminFF;
                          setAdminFF(newFF);
                          playSound(700, 0.08, 'sine');
                        }}
                        className={`p-1 rounded border text-[9px] font-semibold text-center truncate transition-all ${
                          adminFF
                            ? 'bg-[#22d3ee]/20 border-cyan-400/50 text-cyan-200'
                            : 'bg-black/35 hover:bg-black/55 border-white/5 text-zinc-400'
                        }`}
                      >
                        🛡️ {adminFF ? 'FF: On' : 'FF'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const newBH = !adminBighead;
                          setAdminBighead(newBH);
                          playSound(900, 0.08, 'sine');
                        }}
                        className={`p-1 rounded border text-[9px] font-semibold text-center truncate transition-all ${
                          adminBighead
                            ? 'bg-purple-600/30 border-purple-400/50 text-purple-200'
                            : 'bg-black/35 hover:bg-black/55 border-white/5 text-zinc-400'
                        }`}
                      >
                        🧔 {adminBighead ? 'Bighead' : 'Normal'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerAdminKill();
                        }}
                        className="p-1 bg-black/35 hover:bg-rose-900/60 border border-white/5 text-[#ef4444] rounded text-[9px] font-semibold text-center truncate transition-all"
                      >
                        ☠️ Kill Player
                      </button>
                    </div>
                  </div>

                  {/* Ban Testing Injects */}
                  <div className="border-[#393B3D]/30 border-t pt-1.5 flex flex-col gap-1">
                    <span className="text-[8.5px] font-bold text-amber-500 font-mono uppercase tracking-wider">
                      ⚠️ Ban Test Controls
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[8.5px]">
                      <button
                        type="button"
                        onClick={triggerMockAutoBan}
                        className="p-1 bg-amber-950/35 hover:bg-amber-900/50 border border-amber-500/40 text-amber-200 rounded text-[7.5px] font-bold text-center truncate transition-all cursor-pointer"
                        title="Reports you from 7 different users. Fully appealable!"
                      >
                        🚨 Sim Auto-Ban
                      </button>
                      <button
                        type="button"
                        onClick={triggerMockAdminBan}
                        className="p-1 bg-rose-950/35 hover:bg-rose-900/50 border border-rose-500/40 text-rose-200 rounded text-[7.5px] font-bold text-center truncate transition-all cursor-pointer"
                        title="Manual admin-level blacklist action. This is strictly permanent!"
                      >
                        🚫 Sim Admin Ban
                      </button>
                    </div>
                  </div>

                  {/* Moderation Flag Log panel */}
                  <div className="border-t border-white/5 pt-1.5 flex flex-col gap-1.5">
                    <span className="text-[8.5px] font-bold text-rose-450 font-mono uppercase tracking-wider flex items-center justify-between">
                      <span>👮 Admin Flags ({reportedPlayers.length})</span>
                      {reportedPlayers.some(rep => rep.status === 'PENDING') && (
                        <span className="bg-red-500/10 text-red-400 border border-red-550/30 px-1 rounded text-[7px] animate-pulse">
                          NEW
                        </span>
                      )}
                    </span>

                    {reportedPlayers.length === 0 ? (
                      <p className="text-[7.5px] text-zinc-500 italic pb-0.5">
                        No report flags filed. Right-hover a message in chat to report co-players.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5 max-h-[90px] overflow-y-auto pr-0.5 custom-scrollbar text-[8px]">
                        {reportedPlayers.map((rep) => (
                          <div 
                            key={rep.id} 
                            className="bg-black/40 border border-rose-500/20 hover:border-rose-550/40 rounded p-1.5 flex flex-col gap-1 text-[8px] transition-colors"
                          >
                            <div className="flex justify-between items-center text-zinc-400 font-mono">
                              <span className="text-rose-400 font-black text-[8.5px] truncate max-w-[80px]">{rep.reported}</span>
                              <span className="text-[7px] text-gray-500 shrink-0">{rep.timestamp}</span>
                            </div>
                            <p className="text-zinc-350 italic bg-black/55 p-1 rounded border border-white/5 break-words line-clamp-2 leading-relaxed" title={rep.text}>
                              "{rep.text}"
                            </p>

                            <div className="flex justify-between items-center gap-1 pt-0.5 leading-none">
                              <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded border ${
                                rep.status === 'PENDING' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25 animate-pulse' :
                                rep.status === 'MUTED' ? 'bg-orange-550/20 text-orange-400 border-orange-500/25' :
                                rep.status === 'BANNED' ? 'bg-rose-900/30 text-rose-400 border-rose-500/25 font-bold' :
                                'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}>
                                {rep.status}
                              </span>

                              {rep.status === 'PENDING' ? (
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setPendingAdminConfirm({ reportId: rep.id, action: 'MUTED', targetName: rep.reported })}
                                    className="bg-amber-600 hover:bg-amber-505 hover:scale-105 active:scale-95 text-neutral-900 font-extrabold text-[7px] uppercase px-1 py-0.5 rounded cursor-pointer transition-all"
                                  >
                                    Mute
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingAdminConfirm({ reportId: rep.id, action: 'BANNED', targetName: rep.reported })}
                                    className="bg-red-650 hover:bg-red-600 hover:scale-105 active:scale-95 text-white font-extrabold text-[7px] uppercase px-1 py-0.5 rounded cursor-pointer transition-all"
                                  >
                                    Ban
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[7px] text-zinc-500 uppercase font-mono">Enforced 👍</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Admin Appeals Board */}
                  <div className="border-t border-white/5 pt-1.5 flex flex-col gap-1.5">
                    <span className="text-[8.5px] font-bold text-cyan-400 font-mono uppercase tracking-wider flex items-center justify-between">
                      <span>📋 Appeals Board ({liveAppeals.filter(a => a.status === 'PENDING').length})</span>
                      {liveAppeals.some(a => a.status === 'PENDING') && (
                        <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1 rounded text-[7px] animate-pulse">
                          PENDING
                        </span>
                      )}
                    </span>

                    {/* Toast error message for admins */}
                    {adminToast && (
                      <div className="absolute top-2 left-2 right-2 bg-red-600 text-white rounded p-1.5 text-[8.5px] font-mono shadow-md border border-red-400 font-bold z-50 animate-bounce flex items-center justify-between">
                        <span className="break-all">⚠️ {adminToast}</span>
                        <button onClick={() => setAdminToast(null)} className="text-white hover:text-red-200 ml-1.5 shrink-0">
                          <X size={10} />
                        </button>
                      </div>
                    )}

                    {liveAppeals.length === 0 ? (
                      <p className="text-[7px] text-zinc-500 italic pb-0.5">
                        No appeals filed yet in server database registry.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5 max-h-[110px] overflow-y-auto pr-0.5 custom-scrollbar text-[8px]">
                        {liveAppeals.map((appeal) => {
                          const isPlayerManualAdminBanned = isPlayerAdminBanned(appeal.playerName);
                          return (
                            <div 
                              key={appeal.id} 
                              className="bg-[#111214] border border-cyan-500/20 hover:border-cyan-500/40 rounded p-1.5 flex flex-col gap-1 text-[8px] transition-colors"
                            >
                              <div className="flex justify-between items-center text-zinc-400 font-mono">
                                <span className="text-cyan-300 font-black text-[8.5px] truncate max-w-[80px]">{appeal.playerName}</span>
                                <span className="text-[7px] text-gray-505 shrink-0">{appeal.timestamp}</span>
                              </div>
                              <p className="text-zinc-350 italic bg-black/60 p-1 rounded border border-white/5 break-words">
                                "{appeal.statement}"
                              </p>

                              {isPlayerManualAdminBanned && (
                                <div className="text-[7px] text-red-400 font-semibold uppercase bg-red-950/20 px-1 py-0.5 rounded border border-red-900/30 font-mono scale-[0.95] origin-left">
                                  🚫 Admin ban overrides are permanent
                                </div>
                              )}

                              <div className="flex justify-between items-center gap-1 pt-0.5 leading-none">
                                <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded border ${
                                  appeal.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  appeal.status === 'APPROVED' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' :
                                  'bg-red-950/30 text-red-400 border-red-500/20'
                                }`}>
                                  {appeal.status}
                                </span>

                                {appeal.status === 'PENDING' && (
                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = resolveAppealInDB(appeal.playerName, appeal.id, 'APPROVED');
                                        if (res.success) {
                                          playSound(1046, 0.25, 'sine');
                                          setTimeout(() => playSound(1318, 0.35, 'sine'), 100);
                                          setReportsDBVersion(v => v + 1);
                                        } else {
                                          playSound(150, 0.4, 'sawtooth');
                                          setAdminToast(res.error || 'Resolve failed.');
                                          setTimeout(() => setAdminToast(null), 5500);
                                        }
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 text-white font-black text-[7.5px] uppercase px-1.5 py-0.5 rounded cursor-pointer transition-all"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        resolveAppealInDB(appeal.playerName, appeal.id, 'REJECTED');
                                        playSound(120, 0.3, 'sawtooth');
                                        setReportsDBVersion(v => v + 1);
                                      }}
                                      className="bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 text-white font-black text-[7.5px] uppercase px-1.5 py-0.5 rounded cursor-pointer transition-all"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Classic Voxel Player Leaderboard */}
              {showLeaderboard && (
                <div className="w-52 bg-[#16171a]/85 backdrop-blur-md border border-[#393B3D]/80 rounded-lg p-2.5 flex flex-col gap-1.5 shadow-2xl select-none text-left relative animate-fadeIn">
                  <div className="flex justify-between items-center px-1 border-b border-white/5 pb-1 select-none">
                    <span className="text-[9px] font-black tracking-widest text-[#22d3ee] uppercase font-mono flex items-center gap-1">
                      👥 Leaderboard
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-mono text-zinc-400 bg-zinc-800/60 px-1.5 py-0.5 rounded">
                        45ms
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLeaderboard(false);
                          playSound(600, 0.05);
                        }}
                        className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
                        title="Close Leaderboard"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-0.5 custom-scrollbar">
                    {/* You */}
                    <div className="flex items-center justify-between text-[10px] bg-cyan-500/10 border border-cyan-500/25 rounded p-1.5 px-2 select-none">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <div className={`w-4 h-4 rounded-full ${avatarColor || 'bg-sky-500'} text-zinc-950 font-black text-[8px] flex items-center justify-center shrink-0`}>
                          YA
                        </div>
                        <span className="font-bold text-cyan-200 truncate font-sans">You (Gamer)</span>
                        {isMicMuted ? (
                          <MicOff size={9} className="text-red-500 shrink-0" title="Your mic is muted" />
                        ) : (
                          <div className="flex items-center gap-[1px] cursor-help" title="Mic active. Speak now!">
                            <Mic size={9} className="text-green-400 shrink-0" />
                            {isUserSpeaking && (
                              <span className="text-[7px] text-green-400 animate-pulse font-mono font-bold">LIVE</span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="font-mono font-black text-cyan-400 shrink-0">{score ? score : 0} KO</span>
                    </div>

                    {/* Simulated server players */}
                    {activeServerPlayers.map(player => {
                      const isFriend = friends.some(f => f.name.toLowerCase() === player.name.toLowerCase());
                      const reqStatus = gameFriendRequests[player.name] || 'none';
                      const isPlayerBlocked = blockedUsers?.some(bu => bu.toLowerCase() === player.name.toLowerCase());
                      const isSpeaking = activeVoiceSpeaker === player.name;
                      
                      const modData = getModerationDB()[player.name];
                      const warnsTotal = modData ? modData.warningsCount : 0;

                      return (
                        <div 
                          key={player.name}
                          className={`flex items-center justify-between text-[10px] border rounded p-1.5 px-2 transition-colors select-none ${
                            isSpeaking && !isPlayerBlocked
                              ? 'bg-emerald-950/20 border-emerald-500/40 animate-pulse' 
                              : 'bg-black/25 border-white/5 hover:bg-black/40'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className={`w-4 h-4 rounded-full ${player.avatarColor} text-zinc-900 font-extrabold text-[8px] flex items-center justify-center shrink-0`}>
                                {player.name.substring(0, 1).toUpperCase()}
                              </div>
                              <span className={`font-bold truncate font-sans ${isPlayerBlocked ? 'line-through text-red-400 opacity-60' : 'text-gray-300'}`} title={`${player.name} (${player.username})`}>
                                {player.name} {isPlayerBlocked && '🚫'}
                              </span>
                              {warnsTotal > 0 && (
                                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 rounded font-mono text-[7px]" title={`${warnsTotal} moderation warnings issued across games`}>
                                  ⚠️ {warnsTotal}W
                                </span>
                              )}
                              {isSpeaking && !isPlayerBlocked && (
                                <div className="flex items-center gap-0.5" title={`${player.name} is speaking!`}>
                                  <Mic size={9} className="text-green-450 shrink-0" />
                                  <span className="text-[7px] font-bold text-green-400 tracking-tighter animate-pulse font-mono h-3.5 flex items-center">TALK</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Friend, Block, and Report button CTA triggers */}
                            <div className="mt-1 pl-5.5 flex items-center gap-1 flex-wrap font-sans">
                              {isFriend ? (
                                <span className="text-[7.5px] font-bold text-green-400 flex items-center gap-0.5 select-none uppercase">
                                  👥 Friends
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={reqStatus !== 'none' || isPlayerBlocked}
                                  onClick={() => handleGameSendFriendRequest(player)}
                                  className={`px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wider transition-all border ${
                                    reqStatus === 'none'
                                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40 cursor-pointer hover:bg-indigo-600/50 active:scale-95'
                                      : reqStatus === 'sending'
                                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse cursor-not-allowed'
                                      : 'bg-green-500/10 border-green-500/30 text-green-400 cursor-not-allowed'
                                  } ${isPlayerBlocked ? 'opacity-30 cursor-not-allowed' : ''}`}
                                >
                                  {reqStatus === 'none' && '➕ Friend'}
                                  {reqStatus === 'sending' && 'Pending'}
                                  {reqStatus === 'accepted' && 'Friends 🎉'}
                                </button>
                              )}
		
                              {/* Block list action toggle */}
                              <button
                                type="button"
                                onClick={() => onToggleBlock && onToggleBlock(player.name)}
                                className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider transition-all border cursor-pointer active:scale-95 ${
                                  isPlayerBlocked
                                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/25 hover:bg-emerald-900/40'
                                    : 'bg-red-950/40 text-red-300 border-red-500/25 hover:bg-red-900/40'
                                }`}
                              >
                                {isPlayerBlocked ? '🔓 Unblock' : '🚫 Block'}
                              </button>

                              {/* Report Player button */}
                              <button
                                type="button"
                                onClick={() => {
                                  playSound(500, 0.05, 'sine');
                                  setReportTargetName(player.name);
                                  setReportContext(`Active gameplay session in ${game.title}`);
                                  setReportReason('Cheating / Exploiting');
                                  setShowReportModal(true);
                                }}
                                className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider transition-all border cursor-pointer active:scale-95 bg-orange-950/40 text-orange-300 border-orange-500/25 hover:bg-orange-100/20"
                                title={`File a report against ${player.name}`}
                              >
                                🚨 Report
                              </button>
                            </div>
                          </div>
 
                          <span className="font-mono font-bold text-zinc-400 ml-1.5 shrink-0 text-[10px]">{player.score} KO</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Joystick and Jump Button Overlay */}
            {showTouchControls && isPlayingCode && (
              <div className="absolute inset-0 pointer-events-none select-none z-10 flex justify-between items-end p-4 pb-8">
                {/* Left side Joystick Base */}
                <div 
                  className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center pointer-events-auto relative touch-none select-none ml-2"
                  onTouchStart={handleJoystickStart}
                  onTouchMove={handleJoystickMove}
                  onTouchEnd={handleJoystickEnd}
                  onTouchCancel={handleJoystickEnd}
                  style={{ touchAction: 'none' }}
                >
                  <div className="absolute inset-1.5 border border-white/5 rounded-full pointer-events-none" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/15 pointer-events-none absolute" />

                  {/* Dragged knob */}
                  <div 
                    ref={joystickKnobRef}
                    className="w-10 h-10 rounded-full bg-white/20 active:bg-white/30 shadow-lg border border-white/25 flex items-center justify-center pointer-events-none absolute"
                    style={{
                      transform: 'translate(0px, 0px)',
                      transition: 'transform 45ms ease-out'
                    }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-white/40" />
                  </div>
                </div>

                {/* Right side Circular Jump Button */}
                <button
                  onTouchStart={handleJumpStart}
                  onTouchEnd={handleJumpEnd}
                  onTouchCancel={handleJumpEnd}
                  onMouseDown={handleJumpStart}
                  onMouseUp={handleJumpEnd}
                  onMouseLeave={handleJumpEnd}
                  className="w-14 h-14 rounded-full bg-indigo-600/30 active:bg-indigo-600/50 border border-indigo-500/40 shadow-lg flex items-center justify-center pointer-events-auto cursor-pointer select-none touch-none mr-2 transition-all active:scale-90"
                  style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
                  title="Virtual Jump Action Button"
                >
                  <span className="text-white text-[10px] font-black tracking-widest uppercase font-mono">Jump</span>
                </button>
              </div>
            )}
          </div>

          {/* AESTHETIC REPORT ABUSE MODAL DIALOGUE */}
          {showReportModal && (
            <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#1d2024] border border-red-500/30 rounded-xl overflow-hidden shadow-2xl text-white font-sans">
                {/* Header */}
                <div className="bg-[#121417] p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-red-500 shrink-0 select-none animate-pulse" size={18} />
                    <span className="font-extrabold text-[#f34a4a] text-sm tracking-wide uppercase">Report Player Abuse</span>
                  </div>
                  <button 
                    onClick={() => {
                      playSound(800, 0.05);
                      setShowReportModal(false);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-all text-gray-450 hover:text-white cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Form fields */}
                <div className="p-5 space-y-4 text-xs">
                  <div className="bg-amber-500/5 border border-amber-500/25 rounded-md p-3 text-amber-300 flex gap-2.5">
                    <Info size={16} className="shrink-0 mt-0.5 text-amber-400" />
                    <p className="leading-relaxed font-sans text-[10px]">
                      <strong>System Directive:</strong> In accordance with Voxel Safety regulations, completing this report issues an immediate platform warning. Players accumulating reports from <strong>more than 6 different people</strong> across different games are auto-permabanned.
                    </p>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Offending Player</label>
                    <div className="bg-[#111214] border border-[#393B3D] rounded-lg p-2.5 font-bold flex items-center justify-between">
                      <span className="text-white font-mono text-sm">{reportTargetName || 'Select a player'}</span>
                      <span className="text-[8px] bg-red-500/15 text-red-400 border border-red-500/35 px-1.5 py-0.5 rounded uppercase font-semibold">Flagged</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Reason for Report</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full bg-[#111214] border border-[#393B3D] focus:border-red-500 rounded-lg p-2.5 text-white outline-none cursor-pointer text-xs font-sans font-medium transition-all"
                    >
                      {REPORT_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-bold mb-1 uppercase tracking-wider text-[9px]">Chat Text / Action Context</label>
                    <textarea
                      value={reportContext}
                      onChange={(e) => setReportContext(e.target.value)}
                      placeholder="Explain what the user did or leave as is to flag recent activity..."
                      rows={3}
                      className="w-full bg-[#111214] border border-[#393B3D] focus:border-red-500 rounded-lg p-2.5 text-white outline-none placeholder-zinc-600 text-xs font-medium resize-none transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="bg-[#121417] p-4 border-t border-white/5 flex gap-2 justify-end font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      playSound(800, 0.05);
                      setShowReportModal(false);
                    }}
                    className="px-4 py-2 hover:bg-[#202226] rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!reportTargetName) return;
                      submitReport(reportTargetName, 'You (Gamer)', reportReason, reportContext);
                      setShowReportModal(false);
                    }}
                    className="px-5 py-2 bg-red-600/90 hover:bg-red-600 active:scale-95 text-white rounded-lg text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-red-950/20 flex items-center gap-1.5"
                  >
                    <UserX size={14} /> Submit Abuse Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Control footer bar */}
          <div className="p-3 bg-[#111214] border-t border-[#393B3D] flex justify-between items-center text-xs text-gray-400 font-sans">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Volume2 size={14} className="text-gray-400" />
                <span>Web-synth enabled</span>
              </div>
              <span>•</span>
              <div className="font-mono">
                Item Equipped: <span className="text-white font-bold">{activeHats[0] || 'Original Hair'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                resetRequestedRef.current = true;
                playSound(150, 0.15, 'sawtooth');
              }}
              className="px-3.5 py-1.5 bg-[#111214] hover:bg-[#323436] hover:text-white border border-[#393B3D] rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 font-mono"
            >
              <RotateCcw size={13} /> Re-spawn
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
