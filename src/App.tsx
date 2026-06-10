import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MOCK_GAMES, 
  MOCK_FRIENDS, 
  MOCK_SHOP_ITEMS, 
  MOCK_MESSAGES, 
  MOCK_TRADES, 
  MOCK_EXPERIENCES, 
  CURRENT_USER 
} from './data';
import { Game, Friend, ShopItem, Message, Trade, UserExperience } from './types';

// Importing sub components
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Discover from './components/Discover';
import GameSimulator from './components/GameSimulator';
import AvatarCustomizer from './components/AvatarCustomizer';
import CreateDashboard from './components/CreateDashboard';
import StudioMock from './components/StudioMock';
import Studio2D from './components/Studio2D';
import MessagesTab from './components/MessagesTab';
import TradeTab from './components/TradeTab';
import ShortGames from './components/ShortGames';
import ScreenRecorder from './components/ScreenRecorder';

import { Bell, Sparkles, Shield, X, HelpCircle, Flame, Play, ThumbsUp, Calendar, Award, ChevronRight } from 'lucide-react';

// --- Firebase Core SDK Imports ---
import { auth, db, OperationType, handleFirestoreError } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  limit,
  addDoc,
  deleteDoc
} from 'firebase/firestore';

// Custom Debounce Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function App() {
  // Page routing
  const [activeTab, setActiveTab] = useState<string>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // --- Real-time Firebase Authentication & Databases Sync ---
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [signInError, setSignInError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setSignInError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Sign in failed:", error);
      setSignInError(error?.message || error?.code || String(error));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  // Onboarding and first-time Custom Profile States
  const [customName, setCustomName] = useState<string>(() => {
    return localStorage.getItem('blox_custom_name') || "";
  });
  const [customUsername, setCustomUsername] = useState<string>(() => {
    return localStorage.getItem('blox_custom_username') || "";
  });
  const [customGender, setCustomGender] = useState<string>(() => {
    return localStorage.getItem('blox_custom_gender') || "";
  });
  const [customBirthday, setCustomBirthday] = useState<string>(() => {
    return localStorage.getItem('blox_custom_birthday') || "";
  });
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(() => {
    return localStorage.getItem('blox_onboarding_completed') !== 'true';
  });
  const [onboardingStage, setOnboardingStage] = useState<'signin' | 'namescreen'>('signin');

  // Follow Us modal states & auto-prompt once-a-day logic
  const [showFollowUs, setShowFollowUs] = useState<boolean>(false);

  useEffect(() => {
    if (onboardingOpen) return;

    const todayStr = new Date().toDateString();
    const lastPromptDate = localStorage.getItem('blox_last_follow_prompt_date');
    if (lastPromptDate !== todayStr) {
      const delayTimer = setTimeout(() => {
        setShowFollowUs(true);
        localStorage.setItem('blox_last_follow_prompt_date', todayStr);
      }, 1800);
      return () => clearTimeout(delayTimer);
    }
  }, [onboardingOpen]);

  // Skip step 1 if already authenticated when onboarding is open
  useEffect(() => {
    if (currentUser && onboardingOpen) {
      setOnboardingStage('namescreen');
    }
  }, [currentUser, onboardingOpen]);

  // Temporary local states for onboarding form fields
  const [tempName, setTempName] = useState<string>("");
  const [tempUsername, setTempUsername] = useState<string>("");
  const [tempGender, setTempGender] = useState<string>("");
  const [tempBirthMonth, setTempBirthMonth] = useState<string>("");
  const [tempBirthDay, setTempBirthDay] = useState<string>("");
  const [tempBirthYear, setTempBirthYear] = useState<string>("");
  const [onboardingError, setOnboardingError] = useState<string>("");

  // Celebratory full birthday selected effect
  const [showBirthdayCelebration, setShowBirthdayCelebration] = useState<boolean>(false);
  const [hasCelebrated, setHasCelebrated] = useState<boolean>(false);

  useEffect(() => {
    const isFullDate = !!(tempBirthMonth && tempBirthDay && tempBirthYear);
    if (isFullDate) {
      if (!hasCelebrated) {
        setShowBirthdayCelebration(true);
        setHasCelebrated(true);
        const timer = setTimeout(() => {
          setShowBirthdayCelebration(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setHasCelebrated(false);
      setShowBirthdayCelebration(false);
    }
  }, [tempBirthMonth, tempBirthDay, tempBirthYear, hasCelebrated]);

  useEffect(() => {
    if (onboardingOpen) {
      if (currentUser) {
        setTempName(prev => prev || currentUser.displayName || "");
        setTempUsername(prev => {
          if (prev) return prev;
          const unameInput = currentUser.displayName?.toLowerCase().replace(/\s+/g, '') || "gamerprox";
          return unameInput.startsWith('@') ? unameInput : "@" + unameInput;
        });
      } else {
        setTempName(prev => prev || customName || "GamerProX");
        setTempUsername(prev => prev || customUsername || "@gamerprox");
      }
      setTempGender(customGender || "");
      if (customBirthday) {
        const parts = customBirthday.split('-');
        if (parts.length === 3) {
          setTempBirthYear(parts[0]);
          setTempBirthMonth(parts[1]);
          setTempBirthDay(parts[2]);
        }
      }
    }
  }, [onboardingOpen, currentUser]);

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError("");

    const nameVal = tempName.trim();
    let usernameVal = tempUsername.trim();

    if (!nameVal || nameVal.length < 3) {
      setOnboardingError("Display Name must be at least 3 characters.");
      return;
    }

    if (!usernameVal || usernameVal.length < 3) {
      setOnboardingError("Username must be at least 3 characters.");
      return;
    }

    if (!usernameVal.startsWith('@')) {
      usernameVal = "@" + usernameVal;
    }

    const cleanUsername = usernameVal.replace(/\s+/g, '');
    if (cleanUsername === "@" || cleanUsername.length < 4) {
      setOnboardingError("Please enter a valid unique handle starting with @");
      return;
    }

    // Check if username is already in use by a platform builder/friend
    const isUsedInMock = MOCK_FRIENDS.some(friend => friend.username.toLowerCase() === cleanUsername.toLowerCase());
    if (isUsedInMock) {
      setOnboardingError(`The username ${cleanUsername} is already reserved by a platform developer.`);
      return;
    }

    // Query database to check if username is already registered by another user
    try {
      const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        let taken = false;
        querySnapshot.forEach((doc) => {
          if (!currentUser || doc.id !== currentUser.uid) {
            taken = true;
          }
        });
        if (taken) {
          setOnboardingError(`The username ${cleanUsername} is already taken by another player.`);
          return;
        }
      }
    } catch (dbErr) {
      console.warn("Skipping online database unique username validation:", dbErr);
    }

    if (!tempGender) {
      setOnboardingError("Please pick your preferred gender persona.");
      return;
    }

    if (!tempBirthMonth || !tempBirthDay || !tempBirthYear) {
      setOnboardingError("Please specify a complete valid birth date.");
      return;
    }

    const birthdayVal = `${tempBirthYear}-${tempBirthMonth}-${tempBirthDay}`;

    try {
      setCustomName(nameVal);
      setCustomUsername(cleanUsername);
      setCustomGender(tempGender);
      setCustomBirthday(birthdayVal);

      localStorage.setItem('blox_custom_name', nameVal);
      localStorage.setItem('blox_custom_username', cleanUsername);
      localStorage.setItem('blox_custom_gender', tempGender);
      localStorage.setItem('blox_custom_birthday', birthdayVal);
      localStorage.setItem('blox_onboarding_completed', 'true');

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
          name: nameVal,
          username: cleanUsername,
          robux: robux || 14500,
          equippedItems: equippedItems || ["1", "5"],
          skinColor: skinColor || "#ffe0b2",
          avatarColor: avatarColor || "from-amber-400 to-orange-500",
          gender: tempGender,
          birthday: birthdayVal,
          email: currentUser.email || ""
        });

        const tradeRef = doc(db, 'trades', 't1_' + currentUser.uid);
        await setDoc(tradeRef, {
          senderId: 'f2_shedletsky',
          receiverId: currentUser.uid,
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
          valueDifference: 220,
          createdAt: new Date().toISOString()
        });
      }

      setNotifications(prev => [
        {
          id: `welcome_${Date.now()}`,
          title: "🎉 Sandbox Profile Initiated",
          text: `Welcome! Registered to Bloxland as ${nameVal} (${cleanUsername})! Your dashboard is now fully unlocked.`,
          time: "Just now",
          icon: "🚀",
          createdAt: Date.now()
        },
        ...prev
      ]);

      setOnboardingOpen(false);
    } catch (err: any) {
      console.error("Onboarding submission failed:", err);
      setOnboardingError("Could not save details to server. Please try again.");
    }
  };

  // Core synchronized profile states
  const [robux, setRobux] = useState<number>(() => {
    const cached = localStorage.getItem('blox_robux');
    return cached ? parseInt(cached, 10) : CURRENT_USER.robux;
  });
  const [equippedItems, setEquippedItems] = useState<string[]>(() => {
    const cached = localStorage.getItem('blox_equipped_items');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return CURRENT_USER.equippedItems;
  });
  const [skinColor, setSkinColor] = useState<string>(() => {
    return localStorage.getItem('blox_skin_color') || CURRENT_USER.skinColor;
  });
  const [avatarColor, setAvatarColor] = useState<string>(() => {
    return localStorage.getItem('blox_avatar_color') || CURRENT_USER.avatarColor;
  });

  // Search parameters
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals overlays state
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);
  const [editedDescription, setEditedDescription] = useState<string>("");
  const [isSavingDescription, setIsSavingDescription] = useState<boolean>(false);
  const [isDeletingGame, setIsDeletingGame] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Custom Debounce state
  const debouncedDescription = useDebounce(editedDescription, 1000);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'typing' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (activeGame) {
      setEditedDescription(activeGame.description || "");
    } else {
      setEditedDescription("");
    }
    setIsEditingDescription(false);
    setShowDeleteConfirm(false);
    setIsDeletingGame(false);
    setAutoSaveStatus('idle');
  }, [activeGame]);

  // Set typing status when content changes and is different from original
  useEffect(() => {
    if (!isEditingDescription || !activeGame) {
      setAutoSaveStatus('idle');
      return;
    }
    if (editedDescription !== (activeGame.description || "")) {
      setAutoSaveStatus('typing');
    } else {
      setAutoSaveStatus('idle');
    }
  }, [editedDescription, isEditingDescription, activeGame]);

  // Handle Debounced Auto-saving to Firestore
  useEffect(() => {
    if (!isEditingDescription || !activeGame) return;

    const originalDesc = activeGame.description || "";
    if (debouncedDescription === originalDesc) {
      return;
    }

    const triggerAutoSave = async () => {
      setAutoSaveStatus('saving');
      setIsSavingDescription(true);
      try {
        const expRef = doc(db, 'publishedGames', activeGame.id);
        await updateDoc(expRef, {
          description: debouncedDescription,
          lastUpdated: 'Just now'
        });

        // Sync local states immediately
        setActiveGame(prev => prev ? { ...prev, description: debouncedDescription } : null);
        setExperiences(prev => prev.map(exp => exp.id === activeGame.id ? { ...exp, description: debouncedDescription } : exp));
        setGames(prev => prev.map(g => g.id === activeGame.id ? { ...g, description: debouncedDescription } : g));

        setAutoSaveStatus('saved');
      } catch (err: any) {
        console.error("Failed to auto-save Firestore description:", err);
        setAutoSaveStatus('error');
        handleFirestoreError(err, OperationType.UPDATE, `publishedGames/${activeGame.id}`);
      } finally {
        setIsSavingDescription(false);
      }
    };

    triggerAutoSave();
  }, [debouncedDescription, isEditingDescription, activeGame]);

  const [runningGame, setRunningGame] = useState<Game | null>(null);
  const [runningStudio, setRunningStudio] = useState<boolean>(false);
  const [running2DStudio, setRunning2DStudio] = useState<boolean>(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState<boolean>(false);
  const [enablePopNotifications, setEnablePopNotifications] = useState<boolean>(() => {
    const cached = localStorage.getItem('enablePopNotifications');
    return cached === 'true'; // Off (false) by default
  });

  // Simulated monetization core mechanics states
  const [devRobux, setDevRobux] = useState<number>(() => {
    const cached = localStorage.getItem('devRobux');
    return cached ? parseInt(cached, 10) : 3850; // Starter developer Robux seed
  });
  const [devexUSD, setDevexUSD] = useState<number>(() => {
    const cached = localStorage.getItem('devexUSD');
    return cached ? parseFloat(cached) : 0.00;
  });
  const [creatorPoints, setCreatorPoints] = useState<number>(() => {
    const cached = localStorage.getItem('creatorPoints');
    return cached ? parseInt(cached, 10) : 75; // Starter points
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Lists state
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [trades, setTrades] = useState<Trade[]>(MOCK_TRADES);
  const [shopItems, setShopItems] = useState<ShopItem[]>(() => {
    const cached = localStorage.getItem('blox_shop_items');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return MOCK_SHOP_ITEMS;
  });
  const [experiences, setExperiences] = useState<UserExperience[]>(MOCK_EXPERIENCES);
  const [games, setGames] = useState<Game[]>(MOCK_GAMES);

  // Dynamic Friends List State
  const [friends, setFriends] = useState<Friend[]>(() => {
    const cached = localStorage.getItem('roblox_friends');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('roblox_friends', JSON.stringify(friends));
  }, [friends]);

  // Blocked Users State
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    const cached = localStorage.getItem('roblox_blocked_users');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('roblox_blocked_users', JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  const handleToggleBlock = (name: string) => {
    const isCurrentlyBlocked = blockedUsers.some(u => u.toLowerCase() === name.toLowerCase());
    
    if (isCurrentlyBlocked) {
      setBlockedUsers(prev => prev.filter(u => u.toLowerCase() !== name.toLowerCase()));
      setNotifications(prev => [
        {
          id: `unblock_${Date.now()}`,
          title: "🔓 Player Unblocked",
          text: `${name} has been unblocked. You can now exchange chats and view their feeds again.`,
          time: "Just now",
          icon: "🔓",
          createdAt: Date.now()
        },
        ...prev
      ]);
    } else {
      setBlockedUsers(prev => [...prev, name]);
      // Also remove from friends list if they are currently friends
      setFriends(prev => prev.filter(f => f.name.toLowerCase() !== name.toLowerCase()));
      
      setNotifications(prev => [
        {
          id: `block_${Date.now()}`,
          title: "🚫 Player Blocked",
          text: `${name} has been blocked and unfriended. All communication from them is now permanently suppressed.`,
          time: "Just now",
          icon: "🚫",
          createdAt: Date.now()
        },
        ...prev
      ]);
    }
  };

  const handleAddFriend = (newFriend: Friend) => {
    setFriends(prev => {
      if (prev.some(f => f.name.toLowerCase() === newFriend.name.toLowerCase())) {
        return prev;
      }
      return [...prev, newFriend];
    });
    
    setNotifications(prev => [
      {
        id: `friend_${Date.now()}`,
        title: "🎉 New Friend Added!",
        text: `You and ${newFriend.name} (${newFriend.username.startsWith('@') ? newFriend.username : '@' + newFriend.username.toLowerCase()}) are now friends!`,
        time: "Just now",
        icon: "👥",
        createdAt: Date.now()
      },
      ...prev
    ]);
  };

  // Real-time subscription to discover ALL public games (whether authenticated or guest)
  useEffect(() => {
    try {
      const publicGamesQuery = query(
        collection(db, 'publishedGames'),
        where('status', '==', 'Public')
      );
      const unsubPublicGames = onSnapshot(publicGamesQuery, (snapshot) => {
        const dbGames: Game[] = [];
        snapshot.forEach((gDoc) => {
          const data = gDoc.data();
          dbGames.push({
            id: gDoc.id,
            title: data.title || "Custom Game",
            thumbnail: data.is2D 
              ? "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=200&auto=format&fit=crop" 
              : "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=200&auto=format&fit=crop",
            upvoteRatio: 100,
            activePlayers: 0,
            creator: data.creatorName || "GamerProX",
            description: data.description || "No description provided.",
            category: data.category || (data.is2D ? "Bricks" : "Survival"),
            visits: data.visits || 0,
            createdAt: data.createdDate || "2026-05-25",
            is2D: data.is2D || false
          });
        });

        setGames((prev) => {
          const merged = [...prev];
          dbGames.forEach(dbg => {
            const idx = merged.findIndex(g => g.id === dbg.id);
            if (idx !== -1) {
              merged[idx] = dbg;
            } else {
              merged.unshift(dbg);
            }
          });
          return merged.filter((item, index, self) => 
            index === self.findIndex((t) => t.id === item.id)
          );
        });
      }, (error) => {
        console.warn("Public games sync fallback:", error);
      });

      return () => unsubPublicGames();
    } catch (err) {
      console.warn("Public games init warning:", err);
    }
  }, []);


  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load custom profile details
        const userRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.robux !== undefined) setRobux(data.robux);
            if (data.equippedItems !== undefined) setEquippedItems(data.equippedItems);
            if (data.skinColor !== undefined) setSkinColor(data.skinColor);
            if (data.avatarColor !== undefined) setAvatarColor(data.avatarColor);

            if (data.name) {
              setCustomName(data.name);
              localStorage.setItem('blox_custom_name', data.name);
            }
            if (data.username) {
              setCustomUsername(data.username);
              localStorage.setItem('blox_custom_username', data.username);
            }
            if (data.gender) {
              setCustomGender(data.gender);
              localStorage.setItem('blox_custom_gender', data.gender);
            }
            if (data.birthday) {
              setCustomBirthday(data.birthday);
              localStorage.setItem('blox_custom_birthday', data.birthday);
            }

            if (data.username && data.gender && data.birthday) {
              setOnboardingOpen(false);
              localStorage.setItem('blox_onboarding_completed', 'true');
            } else {
              setOnboardingOpen(true);
            }
          } else {
            // First time login - pre-populate displayName and initial guess for username, but keep onboardingOpen true
            if (user.displayName) {
              setCustomName(user.displayName);
              setCustomUsername("@" + user.displayName.toLowerCase().replace(/\s+/g, ''));
            }
            setOnboardingOpen(true);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          // Gracefully fall back to local storage cached variables if offline or database unreachable
          const completed = localStorage.getItem('blox_onboarding_completed') === 'true';
          if (completed) {
            setOnboardingOpen(false);
            setCustomName(localStorage.getItem('blox_custom_name') || user.displayName || "GamerProX");
            setCustomUsername(localStorage.getItem('blox_custom_username') || "@" + (user.displayName?.toLowerCase().replace(/\s+/g, '') || "gamerprox"));
            setCustomGender(localStorage.getItem('blox_custom_gender') || "");
            setCustomBirthday(localStorage.getItem('blox_custom_birthday') || "");
          } else {
            setOnboardingOpen(true);
          }
        }
      } else {
        // Logged out - Reset values to clean fallback mock inputs or guest onboarding values
        const completed = localStorage.getItem('blox_onboarding_completed') === 'true';
        if (completed) {
          setOnboardingOpen(false);
          setCustomName(localStorage.getItem('blox_custom_name') || "GamerProX");
          setCustomUsername(localStorage.getItem('blox_custom_username') || "@gamerprox");
          setCustomGender(localStorage.getItem('blox_custom_gender') || "");
          setCustomBirthday(localStorage.getItem('blox_custom_birthday') || "");
        } else {
          setOnboardingOpen(true);
        }
        const cachedRobux = localStorage.getItem('blox_robux');
        setRobux(cachedRobux ? parseInt(cachedRobux, 10) : CURRENT_USER.robux);

        const cachedEquipped = localStorage.getItem('blox_equipped_items');
        if (cachedEquipped) {
          try {
            setEquippedItems(JSON.parse(cachedEquipped));
          } catch (e) {
            setEquippedItems(CURRENT_USER.equippedItems);
          }
        } else {
          setEquippedItems(CURRENT_USER.equippedItems);
        }

        setSkinColor(localStorage.getItem('blox_skin_color') || CURRENT_USER.skinColor);
        setAvatarColor(localStorage.getItem('blox_avatar_color') || CURRENT_USER.avatarColor);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Profile Auto-save Debounce
  useEffect(() => {
    if (!currentUser || onboardingOpen) return;
    const saveProfile = async () => {
      const userRef = doc(db, 'users', currentUser.uid);
      try {
        await setDoc(userRef, {
          name: customName || currentUser.displayName || "GamerProX",
          username: customUsername || "@" + (currentUser.displayName?.replace(/\s+/g, '') || "GamerProX"),
          robux,
          equippedItems,
          skinColor,
          avatarColor,
          gender: customGender || "",
          birthday: customBirthday || "",
          email: currentUser.email || ""
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
      }
    };
    const debounceTimeout = setTimeout(() => {
      saveProfile();
    }, 1200);
    return () => clearTimeout(debounceTimeout);
  }, [robux, equippedItems, skinColor, avatarColor, currentUser, onboardingOpen, customName, customUsername, customGender, customBirthday]);

  // Synchronize state values locally to retain them across page reloads/starts
  useEffect(() => {
    localStorage.setItem('blox_robux', robux.toString());
  }, [robux]);

  useEffect(() => {
    localStorage.setItem('blox_equipped_items', JSON.stringify(equippedItems));
  }, [equippedItems]);

  useEffect(() => {
    localStorage.setItem('blox_skin_color', skinColor);
  }, [skinColor]);

  useEffect(() => {
    localStorage.setItem('blox_avatar_color', avatarColor);
  }, [avatarColor]);

  useEffect(() => {
    localStorage.setItem('blox_shop_items', JSON.stringify(shopItems));
  }, [shopItems]);
  
  // Simulated stock ticker interval for Limited-edition catalog items
  useEffect(() => {
    const interval = setInterval(() => {
      setShopItems(prevItems => {
        let earnedRobux = 0;
        const logs: { name: string; amt: number; price: number; buyer: string; type: string }[] = [];

        const nextItems = prevItems.map(item => {
          // If this is a user created UGC item, simulate random sales
          if (item.isCreatorItem) {
            if (item.isLimited) {
              let nextSupply = item.supply ?? 0;
              if (nextSupply > 0 && Math.random() > 0.7) {
                const buyAmt = Math.min(nextSupply, Math.floor(Math.random() * 2) + 1);
                nextSupply -= buyAmt;
                const priceVal = item.price;
                const buyers = ["Builderman", "Telamon", "Shedletsky", "Loleris", "Preston", "Linkmon99", "David.baszucki", "Merely"];
                const buyer = buyers[Math.floor(Math.random() * buyers.length)];
                
                earnedRobux += Math.round(priceVal * 0.70) * buyAmt; // 70% payout commission
                logs.push({ name: item.name, amt: buyAmt, price: priceVal, buyer, type: 'LTD' });

                return {
                  ...item,
                  supply: nextSupply,
                  salesCount: (item.salesCount || 0) + buyAmt,
                  earnings: (item.earnings || 0) + Math.round(priceVal * 0.70) * buyAmt
                };
              }
            } else {
              // Unlimited UGC item
              if (Math.random() > 0.8) {
                const priceVal = item.price;
                const buyers = ["Telamon", "Loleris", "Preston", "Builderman", "Shedletsky", "Linkmon99", "Merely"];
                const buyer = buyers[Math.floor(Math.random() * buyers.length)];
                
                earnedRobux += Math.round(priceVal * 0.70);
                logs.push({ name: item.name, amt: 1, price: priceVal, buyer, type: 'Normal' });

                return {
                  ...item,
                  salesCount: (item.salesCount || 0) + 1,
                  earnings: (item.earnings || 0) + Math.round(priceVal * 0.70)
                };
              }
            }
          }

          if (item.isLimited) {
            // Price fluctuation - random walk representing market demand
            const lastPrice = item.price;
            // Generate standard random fluctuation: between -6% and +10% (slight demand bias)
            const changePct = (Math.random() * 16 - 6) / 100; 
            const priceChange = Math.round(lastPrice * changePct);
            const newPrice = Math.max(100, lastPrice + priceChange);

            // Update price history
            const nextHistory = item.priceHistory ? [...item.priceHistory] : [item.price];
            if (nextHistory.length === 0) {
              nextHistory.push(lastPrice);
            }
            nextHistory.push(newPrice);
            if (nextHistory.length > 15) {
              nextHistory.shift(); // Keep last 15 historical points
            }

            // Simulate organic stock purchases by others (supply deduction)
            let nextSupply = item.supply ?? 0;
            if (nextSupply > 0 && Math.random() > 0.6) {
              const buyAmt = Math.min(nextSupply, Math.floor(Math.random() * 2) + 1);
              nextSupply -= buyAmt;
            }

            return {
              ...item,
              price: newPrice,
              priceHistory: nextHistory,
              supply: nextSupply
            };
          }
          return item;
        });

        if (earnedRobux > 0) {
          setRobux(prev => prev + earnedRobux);
          
          logs.forEach(log => {
            const totalCom = Math.round(log.price * 0.70) * log.amt;
            
            // Push notification to state
            setNotifications(prevNotifs => [
              {
                id: `ugc_sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                title: `🎨 UGC Shop Sale!`,
                text: `${log.buyer} bought ${log.amt}x "${log.name}" (+${totalCom} R$, 70% share)`,
                time: "Just now",
                icon: "💰"
              },
              ...prevNotifs
            ]);

            if (enablePopNotifications) {
              setToastMessage(`🎨 UGC Catalog Sale: ${log.buyer} bought "${log.name}" (+${totalCom} R$ profit)!`);
              setTimeout(() => setToastMessage(null), 4500);

              try {
                const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
                if (ac) {
                  const nodeOsc = ac.createOscillator();
                  const nodeGain = ac.createGain();
                  nodeOsc.type = "sine";
                  nodeOsc.frequency.setValueAtTime(523.25, ac.currentTime); // C5
                  nodeOsc.frequency.exponentialRampToValueAtTime(880.00, ac.currentTime + 0.1); // A5
                  nodeGain.gain.setValueAtTime(0.04, ac.currentTime);
                  nodeGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
                  nodeOsc.connect(nodeGain);
                  nodeGain.connect(ac.destination);
                  nodeOsc.start();
                  nodeOsc.stop(ac.currentTime + 0.2);
                }
              } catch (soundErr) {}
            }
          });
        }

        return nextItems;
      });
    }, 5000); // Trigger every 5 seconds to feel live

    return () => clearInterval(interval);
  }, [enablePopNotifications]);

  // Real-time subscriptions for List States
  useEffect(() => {
    if (!currentUser) {
      setMessages(MOCK_MESSAGES);
      setTrades(MOCK_TRADES);
      setExperiences(MOCK_EXPERIENCES);
      return;
    }

    // 1. Chats subscription
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );
    const unsubChats = onSnapshot(chatsQuery, (snapshot) => {
      const liveChats: Message[] = [];
      snapshot.forEach((chatDoc) => {
        const data = chatDoc.data();
        liveChats.push({
          id: chatDoc.id,
          sender: data.partnerName || "Other Player",
          username: data.partnerUsername || "@player",
          senderColor: data.partnerAvatarColor || "bg-indigo-500",
          timestamp: data.lastMessageTime ? new Date(data.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
          unread: data.unreadBy?.includes(currentUser.uid) || false,
          messages: data.messagesList || []
        });
      });
      if (liveChats.length > 0) {
        setMessages(liveChats);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    // 2. Trades subscription
    const tradesQuery = query(
      collection(db, 'trades'),
      where('receiverId', '==', currentUser.uid)
    );
    const unsubTrades = onSnapshot(tradesQuery, (snapshot) => {
      const liveTrades: Trade[] = [];
      snapshot.forEach((tDoc) => {
        const data = tDoc.data();
        liveTrades.push({
          id: tDoc.id,
          partner: data.partner || "Builderman",
          partnerAvatarColor: data.partnerAvatarColor || "bg-yellow-500",
          status: data.status || "Pending",
          giving: data.giving || [],
          receiving: data.receiving || [],
          valueDifference: data.valueDifference || 0
        });
      });
      if (liveTrades.length > 0) {
        setTrades(liveTrades);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trades');
    });

    // 3. User Experiences subscription
    const experiencesQuery = query(
      collection(db, 'publishedGames'),
      where('creatorId', '==', currentUser.uid)
    );
    const unsubExps = onSnapshot(experiencesQuery, (snapshot) => {
      const liveExps: UserExperience[] = [];
      snapshot.forEach((eDoc) => {
        const data = eDoc.data();
        liveExps.push({
          id: eDoc.id,
          title: data.title || "Game Map",
          description: data.description || "Description",
          status: data.status || "Private",
          lastUpdated: data.lastUpdated || "Just now",
          visits: data.visits || 0,
          createdDate: data.createdDate || "2026-05-25",
          is2D: data.is2D || false
        });
      });
      if (liveExps.length > 0) {
        setExperiences(liveExps);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'publishedGames');
    });

    return () => {
      unsubChats();
      unsubTrades();
      unsubExps();
    };
  }, [currentUser]);

  // Custom persistent interceptor setters
  const customSetMessages = (arg: any) => {
    setMessages((prev) => {
      const nextValue = typeof arg === 'function' ? arg(prev) : arg;
      if (!Array.isArray(nextValue)) {
        return nextValue;
      }
      if (currentUser) {
        for (const chat of nextValue) {
          const prevChat = prev.find(p => p.id === chat.id);
          const prevLen = prevChat ? prevChat.messages.length : 0;
          if (chat.messages.length > prevLen) {
            const added = chat.messages.slice(prevLen);
            for (const item of added) {
              const chatRef = doc(db, 'chats', chat.id);
              setDoc(chatRef, {
                participants: [currentUser.uid, chat.username || 'unknown_user'],
                partnerName: chat.sender,
                partnerUsername: chat.username,
                partnerAvatarColor: chat.senderColor,
                lastMessageText: item.text,
                lastMessageTime: new Date().toISOString(),
                unreadBy: [chat.username || 'unknown_user'],
                messagesList: chat.messages.slice(-30)
              }, { merge: true }).catch(err => {
                handleFirestoreError(err, OperationType.WRITE, `chats/${chat.id}`);
              });

              const messagesCol = collection(db, 'chats', chat.id, 'messages');
              addDoc(messagesCol, {
                senderId: currentUser.uid,
                senderName: item.senderName,
                text: item.text,
                createdAt: new Date().toISOString()
              }).catch(err => {
                handleFirestoreError(err, OperationType.WRITE, `chats/${chat.id}/messages`);
              });
            }
          }
        }
      }
      return nextValue;
    });
  };

  const customSetTrades = (arg: any) => {
    setTrades((prev) => {
      const nextValue = typeof arg === 'function' ? arg(prev) : arg;
      if (!Array.isArray(nextValue)) {
        return nextValue;
      }
      if (currentUser) {
        for (const t of nextValue) {
          const prevT = prev.find(p => p.id === t.id);
          if (prevT && prevT.status !== t.status) {
            const tradeRef = doc(db, 'trades', t.id);
            updateDoc(tradeRef, {
              status: t.status
            }).catch(err => {
              handleFirestoreError(err, OperationType.UPDATE, `trades/${t.id}`);
            });
          }
        }
      }
      return nextValue;
    });
  };

  const customSetExperiences = (arg: any) => {
    setExperiences((prev) => {
      const nextValue = typeof arg === 'function' ? arg(prev) : arg;
      if (!Array.isArray(nextValue)) {
        return nextValue;
      }
      const creatorId = currentUser ? currentUser.uid : "guest_user";
      const creatorName = currentUser ? (currentUser.displayName || "GamerPro") : "GuestBuilder";
      for (const exp of nextValue) {
        const prevExp = prev.find(p => p.id === exp.id);
        if (!prevExp) {
          const expRef = doc(db, 'publishedGames', exp.id);
          setDoc(expRef, {
            title: exp.title,
            description: exp.description || "No description",
            status: exp.status,
            creatorId: creatorId,
            creatorName: creatorName,
            mapData: exp.is2D ? '{"type": "2D", "template": "Blank"}' : '{"type": "3D", "template": "Baseplate"}',
            visits: exp.visits,
            createdDate: exp.createdDate,
            is2D: exp.is2D || false,
            lastUpdated: exp.lastUpdated
          }).catch(err => {
            handleFirestoreError(err, OperationType.CREATE, `publishedGames/${exp.id}`);
          });
        } else if (prevExp.status !== exp.status || prevExp.title !== exp.title || prevExp.description !== exp.description) {
          const expRef = doc(db, 'publishedGames', exp.id);
          updateDoc(expRef, {
            status: exp.status,
            title: exp.title,
            description: exp.description || "No description",
            lastUpdated: 'Just now'
          }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `publishedGames/${exp.id}`);
          });
        }
      }
      return nextValue;
    });
  };

  // Automated notification feeds
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, title: "👋 Welcome back!", text: "Develop, trade, and chat logs are simulated locally inside your browser.", time: "Just now", icon: "✨" },
    { id: 2, title: "💸 Incoming Trade proposal", text: "Shedletsky offered neon pauldrons, check the Trade panel.", time: "5m ago", icon: "🔁" },
    { id: 3, title: "🚀 Voxel Studio Compiler", text: "Three.js Sandbox environment is compiled and ready for development.", time: "2h ago", icon: "⚙️" }
  ]);

  // Traffic & Sale Simulator Tick Interval
  useEffect(() => {
    const simulatorInterval = setInterval(() => {
      // Choose public games only
      const publicExps = experiences.filter(exp => exp.status === 'Public');
      if (publicExps.length === 0) return;

      const randomExp = publicExps[Math.floor(Math.random() * publicExps.length)];
      const addedVisits = Math.floor(Math.random() * 6) + 2;

      // Update experience visit metrics and simulate passive revenue
      setExperiences(prev => prev.map(e => {
        if (e.id === randomExp.id) {
          // Check if game has monetization items
          const hasGPs = e.gamepasses && e.gamepasses.length > 0;
          const hasDPs = e.devProducts && e.devProducts.length > 0;
          let updatedGPs = e.gamepasses || [];
          let updatedDPs = e.devProducts || [];
          
          if (hasGPs || hasDPs) {
            // 45% purchase probability on public traffic tick
            if (Math.random() < 0.45) {
              const items = [...updatedGPs, ...updatedDPs];
              const purchasedItem = items[Math.floor(Math.random() * items.length)];
              const buyers = ["Builderman", "Shedletsky", "Telamon", "David.Baszucki", "Wolfpaq", "Merely", "Stickmasterluke", "Linkmon99", "Preston", "Loleris"];
              const buyerName = buyers[Math.floor(Math.random() * buyers.length)];
              
              // Increment sales/revenue stats
              if (purchasedItem.type === 'Gamepass') {
                updatedGPs = updatedGPs.map(item => item.id === purchasedItem.id ? { ...item, sales: item.sales + 1, revenue: item.revenue + item.price } : item);
              } else {
                updatedDPs = updatedDPs.map(item => item.id === purchasedItem.id ? { ...item, sales: item.sales + 1, revenue: item.revenue + item.price } : item);
              }

              // Alert notifications and sounds
              const rewardAmount = purchasedItem.price;
              setDevRobux(prev => {
                const nextCount = prev + rewardAmount;
                localStorage.setItem('devRobux', nextCount.toString());
                return nextCount;
              });

              // Play visual toast and play sales sound only if pop notifications are active
              if (enablePopNotifications) {
                setToastMessage(`💰 ${buyerName} bought "${purchasedItem.emoji} ${purchasedItem.name}" inside your game "${e.title}" (+${rewardAmount} Dev R$)!`);
                setTimeout(() => setToastMessage(null), 4500);

                // Sound beep
                try {
                  const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const nodeOsc = ac.createOscillator();
                  const nodeGain = ac.createGain();
                  nodeOsc.type = "sine";
                  nodeOsc.frequency.setValueAtTime(680, ac.currentTime);
                  nodeOsc.frequency.exponentialRampToValueAtTime(1020, ac.currentTime + 0.08);
                  nodeGain.gain.setValueAtTime(0.04, ac.currentTime);
                  nodeGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
                  nodeOsc.connect(nodeGain);
                  nodeGain.connect(ac.destination);
                  nodeOsc.start();
                  nodeOsc.stop(ac.currentTime + 0.15);
                } catch (soundErr) {}
              }

              // Add notification
              setNotifications(prevNotifs => [
                {
                  id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                  title: `💸 Passive Sale!`,
                  text: `${buyerName} purchased "${purchasedItem.name}" (+${rewardAmount} Dev R$) in "${e.title}"`,
                  time: "Just now",
                  icon: purchasedItem.emoji || "🎮"
                },
                ...prevNotifs
              ]);
            }
          }

          return {
            ...e,
            visits: e.visits + addedVisits,
            gamepasses: updatedGPs,
            devProducts: updatedDPs
          };
        }
        return e;
      }));
    }, 9500); // Reactive ticker: tick every 9.5 seconds

    return () => clearInterval(simulatorInterval);
  }, [experiences]);

  // Helper actions
  const handleFriendClick = (friend: Friend) => {
    // Open message chat directly
    const existingChat = messages.find(m => m.sender.toLowerCase().includes(friend.name.toLowerCase()));
    if (existingChat) {
      setSelectedMsgAndNav(existingChat.id);
    } else {
      // Assemble new mock chat
      const chatID = `m_${friend.id}_${currentUser?.uid || 'guest'}`;
      const newChat: Message = {
        id: chatID,
        sender: friend.name,
        username: friend.username,
        senderColor: friend.avatarColor,
        timestamp: "Just now",
        unread: false,
        messages: [
          { senderName: friend.name, text: `Hey GamerProX! Want to play some ${MOCK_GAMES[0].title} together?`, time: "Just now" }
        ]
      };
      customSetMessages(async (prev: Message[]) => [newChat, ...prev]);
      setSelectedMsgAndNav(newChat.id);
    }
  };

  const setSelectedMsgAndNav = (msgId: string) => {
    setActiveTab('messages');
  };

  const activeHatsIcons = shopItems
    .filter(s => equippedItems.includes(s.id) && s.category !== 'Faces')
    .map(s => s.imageUrl);

  // Counter states
  const unreadCount = messages.filter(m => m.unread).length;
  const pendingTradeCount = trades.filter(t => t.status === 'Pending').length;

  // Active Username
  const activeName = customName || (currentUser ? (currentUser.displayName || "GamerProX") : CURRENT_USER.name);

  return (
    <div className="min-h-screen bg-[#191B1D] text-white antialiased font-sans transition-colors duration-300">
      
      {/* 1. TOPBAR PANEL NAVIGATION */}
      <Topbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        robux={robux}
        userName={activeName}
        avatarColor={avatarColor}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        toggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onOpenNotifications={() => setShowNotificationPanel(!showNotificationPanel)}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        games={games}
        onPlayGame={(g) => setActiveGame(g)}
      />

      {/* 2. SIDEBAR NAVIGATION & COMPENSATED BODY VIEWPORT */}
      <div className="hidden md:block">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          unreadCount={unreadCount}
          pendingTradeCount={pendingTradeCount}
        />
      </div>

      {/* Mobile drawer backdrop overlay */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-35 md:hidden"
        />
      )}

      {/* Mobile Sidebar overlay shelf */}
      <div className={`fixed top-12 bottom-0 left-0 w-64 bg-[#232527] border-r border-[#393B3D] z-40 transition-transform duration-300 md:hidden ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileSidebarOpen(false);
          }}
          collapsed={false}
          setCollapsed={() => {}}
          unreadCount={unreadCount}
          pendingTradeCount={pendingTradeCount}
        />
      </div>

      {/* 3. MAIN GAMEPLAY CORE PAGES CONTAINER router */}
      <main className={`pt-12 min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'md:pl-16' : 'md:pl-60'
      }`}>
        <div className="pb-16">
          {(activeTab === 'home' || activeTab === 'bloxiter' || activeTab === 'clans') && (
            <Dashboard 
              userName={activeName}
              avatarColor={avatarColor}
              friends={friends}
              onAddFriend={handleAddFriend}
              continuePlaying={games.filter(g => !g.is2D).slice(0, 4)}
              recommendedGames={games.filter(g => !g.is2D).slice(2, 6)}
              games2D={games.filter(g => g.is2D)}
              onPlayGame={(g) => setActiveGame(g)}
              onFriendClick={handleFriendClick}
              onNavigateToTab={setActiveTab}
              activeTab={activeTab}
              blockedUsers={blockedUsers}
              onToggleBlock={handleToggleBlock}
              games={games}
              robux={robux}
              setRobux={setRobux}
              shopItems={shopItems}
              setShopItems={setShopItems}
              equippedItems={equippedItems}
              setEquippedItems={setEquippedItems}
              currentUser={currentUser}
              onOpenFollowUs={() => setShowFollowUs(true)}
            />
          )}

          {activeTab === 'discover' && (
            <Discover 
              games={games}
              searchQuery={searchQuery}
              onPlayGame={(g) => setRunningGame(g)}
              activeGame={activeGame}
              setActiveGame={setActiveGame}
            />
          )}

          {(activeTab === 'avatar-shop' || activeTab === 'avatar' || activeTab === 'inventory') && (
            <AvatarCustomizer 
              userName={activeName}
              robux={robux}
              setRobux={setRobux}
              shopItems={shopItems}
              setShopItems={setShopItems}
              equippedItems={equippedItems}
              setEquippedItems={setEquippedItems}
              skinColor={skinColor}
              setSkinColor={setSkinColor}
              avatarColor={avatarColor}
              setAvatarColor={setAvatarColor}
            />
          )}

          {activeTab === 'create' && (
            <CreateDashboard 
              experiences={experiences}
              setExperiences={customSetExperiences}
              onLaunchMockStudio={() => setRunningStudio(true)}
              onLaunchMock2DStudio={() => setRunning2DStudio(true)}
              devRobux={devRobux}
              setDevRobux={setDevRobux}
              devexUSD={devexUSD}
              setDevexUSD={setDevexUSD}
              creatorPoints={creatorPoints}
              setCreatorPoints={setCreatorPoints}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesTab 
              messages={messages}
              setMessages={customSetMessages}
              userName={activeName}
              blockedUsers={blockedUsers}
              onToggleBlock={handleToggleBlock}
            />
          )}

          {activeTab === 'trade' && (
            <TradeTab 
              trades={trades.filter(t => !blockedUsers.some(bu => bu.toLowerCase() === t.partner.toLowerCase()))}
              setTrades={customSetTrades}
              shopItems={shopItems}
              setShopItems={setShopItems}
              equippedItems={equippedItems}
              setEquippedItems={setEquippedItems}
              onTradeActionHappened={() => {
                // Refresh unread or counts if they decline/accept
              }}
            />
          )}

          {activeTab === 'short-games' && (
            <ShortGames 
              games={games}
              onPlayGame={(g) => setActiveGame(g)}
            />
          )}
        </div>
      </main>

      {/* Global Game (App) Description & Detail Modal */}
      {activeGame && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn select-none font-sans">
          <div className="bg-[#232527] border border-[#393B3D] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col my-auto animate-zoomIn">
            
            {/* Header Graphics */}
            <div className={`h-40 md:h-52 bg-gradient-to-br ${activeGame.thumbnail} relative p-6 flex flex-col justify-end border-b border-[#393B3D]`}>
              <div className="absolute inset-0 roblox-grid opacity-15" />
              <button
                type="button"
                onClick={() => setActiveGame(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black text-gray-300 hover:text-white p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                title="Close description modal"
              >
                <X size={20} />
              </button>

              <div className="relative space-y-1 z-10 filter drop-shadow text-left">
                <span className="inline-block text-[10px] bg-[#393B3D] text-white font-extrabold tracking-widest uppercase px-2 py-0.5 rounded mb-1">
                  {activeGame.category}
                </span>
                <h2 className="text-2xl md:text-3xl font-display font-black text-white">
                  {activeGame.title.slice(0, 35)}
                </h2>
                <p className="text-xs text-gray-300">
                  Developed by <strong className="text-white font-bold">{activeGame.creator}</strong>
                </p>
              </div>
            </div>

            {/* General Description */}
            <div className="p-6 space-y-6 flex-1 text-left">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#111214] border border-[#393B3D] p-2.5 rounded text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-display">Visits</div>
                  <div className="text-sm font-mono font-bold text-white mt-0.5">
                    {(activeGame.visits / 1000000).toFixed(1)}M+
                  </div>
                </div>
                <div className="bg-[#111214] border border-[#393B3D] p-2.5 rounded text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-display">Active</div>
                  <div className="text-sm font-mono font-bold text-green-500 mt-0.5">
                    {activeGame.activePlayers.toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#111214] border border-[#393B3D] p-2.5 rounded text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-display">Rating</div>
                  <div className="text-sm font-semibold text-green-500 mt-0.5 flex justify-center items-center gap-1">
                    <ThumbsUp size={12} fill="currentColor" /> {activeGame.upvoteRatio || 90}%
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">About Experience</h4>
                  {(() => {
                    const isOwnGame = experiences.some(exp => exp.id === activeGame.id) || activeGame.creator === activeName;
                    return isOwnGame && (
                      <button
                        type="button"
                        id="edit-game-desc-btn"
                        onClick={() => {
                          setEditedDescription(activeGame.description || "");
                          setIsEditingDescription(true);
                        }}
                        className="text-xs text-amber-500 hover:text-amber-400 font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Edit game description"
                      >
                        ✏️ Edit Description
                      </button>
                    );
                  })()}
                </div>
                {isEditingDescription ? (
                  <div className="space-y-2 animate-fadeIn" id="edit-desc-form">
                    <textarea
                      id="edit-game-desc-input"
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      maxLength={500}
                      rows={4}
                      className="w-full text-xs text-gray-250 bg-[#111214] border border-[#393B3D] focus:border-amber-500 rounded p-3.5 outline-none font-sans min-h-[100px] resize-none"
                      placeholder="Write something cool about your game..."
                    />
                    <div className="flex justify-between items-center gap-2 text-xs w-full">
                      <div>
                        {showDeleteConfirm ? (
                          <div className="flex items-center gap-1.5 animate-fadeIn bg-red-950/20 border border-red-500/30 p-1.5 rounded">
                            <span className="text-red-400 font-bold shrink-0 text-[11px]">⚠️ Permanent delete?</span>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!activeGame) return;
                                setIsDeletingGame(true);
                                try {
                                  const expRef = doc(db, 'publishedGames', activeGame.id);
                                  await deleteDoc(expRef);
                                  
                                  // Update local list states
                                  setExperiences(prev => prev.filter(e => e.id !== activeGame.id));
                                  setGames(prev => prev.filter(g => g.id !== activeGame.id));
                                  
                                  setActiveGame(null);
                                  setToastMessage("🗑️ Experience deleted successfully!");
                                  setTimeout(() => setToastMessage(null), 4000);
                                } catch (err: any) {
                                  console.error("Failed to delete Firestore experience:", err);
                                  handleFirestoreError(err, OperationType.DELETE, `publishedGames/${activeGame.id}`);
                                } finally {
                                  setIsDeletingGame(false);
                                  setShowDeleteConfirm(false);
                                }
                              }}
                              disabled={isDeletingGame}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-extrabold cursor-pointer transition-colors"
                            >
                              {isDeletingGame ? "Deleting..." : "Yes, Delete"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDeleteConfirm(false)}
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded cursor-pointer font-bold"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-3 py-1.5 bg-red-900/40 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white rounded font-bold cursor-pointer transition-colors"
                          >
                            🗑️ Delete Game
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3.5">
                        {/* Elegant Auto-save feedback */}
                        <div className="text-[11px] font-bold flex items-center gap-1.5">
                          {autoSaveStatus === 'typing' && (
                            <span className="text-amber-400 animate-pulse flex items-center gap-1.5">
                              <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                              Typing...
                            </span>
                          )}
                          {autoSaveStatus === 'saving' && (
                            <span className="text-cyan-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                              Auto-saving...
                            </span>
                          )}
                          {autoSaveStatus === 'saved' && (
                            <span className="text-emerald-400 flex items-center gap-1">
                              🟢 Saved to Cloud
                            </span>
                          )}
                          {autoSaveStatus === 'error' && (
                            <span className="text-red-400 flex items-center gap-1">
                              ❌ Auto-save failed
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          id="cancel-edit-desc-btn"
                          onClick={() => {
                            setIsEditingDescription(false);
                            setShowDeleteConfirm(false);
                          }}
                          className="px-4 py-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-cyan-500 hover:text-cyan-400 text-zinc-300 rounded cursor-pointer transition-all font-black text-[11px] uppercase tracking-wider"
                        >
                          Done Editing
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300 leading-relaxed bg-[#111214] border border-[#393B3D] p-3.5 rounded font-sans whitespace-pre-wrap">
                    {activeGame.description || "No description provided."}
                  </p>
                )}
              </div>

              {/* Metadata tags */}
              <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2 border-t border-[#393B3D] font-sans">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Calendar size={14} /> Created: {activeGame.createdAt || '2023-01-01'}
                </span>
                <span className="flex items-center gap-1.5 text-gray-300">
                  <Award size={14} className="text-yellow-500" /> Max Players: 24 (Co-op)
                </span>
              </div>

              {/* More by this Creator Section */}
              {(() => {
                const otherGames = games.filter(g => g.creator === activeGame.creator && g.id !== activeGame.id);
                if (otherGames.length === 0) return null;
                return (
                  <div className="space-y-3 pt-3 border-t border-[#393B3D] animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-display">
                        More By {activeGame.creator}
                      </h4>
                      <span className="text-[10px] font-mono text-amber-400 font-black bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded shadow-sm">
                        {otherGames.length} {otherGames.length === 1 ? 'Other Experience' : 'Other Experiences'}
                      </span>
                    </div>
                    
                    <div className="flex gap-3 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent snap-x">
                      {otherGames.map(game => (
                        <button
                          key={game.id}
                          type="button"
                          onClick={() => {
                            // Play custom audio pitch feedback safely
                            try {
                              const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
                              if (ac) {
                                const oscNode = ac.createOscillator();
                                const gainNode = ac.createGain();
                                oscNode.type = "sine";
                                oscNode.frequency.setValueAtTime(512, ac.currentTime);
                                oscNode.connect(gainNode);
                                gainNode.connect(ac.destination);
                                gainNode.gain.setValueAtTime(0.015, ac.currentTime);
                                gainNode.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
                                oscNode.start();
                                oscNode.stop(ac.currentTime + 0.12);
                              }
                            } catch (e) {}

                            setActiveGame(game);
                          }}
                          className="flex-none w-48 bg-[#111214] hover:bg-[#1a1b1d] border border-[#303336] hover:border-amber-450 p-2.5 rounded-lg text-left transition-all cursor-pointer group flex items-center gap-3 snap-start shadow-md hover:shadow-lg"
                        >
                          <div className={`w-9 h-9 rounded shrink-0 bg-gradient-to-br ${game.thumbnail} flex items-center justify-center text-lg shadow border border-white/5`}>
                            🎮
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <span className="text-[7.5px] uppercase tracking-widest font-black text-gray-500 block truncate font-mono">
                              {game.category}
                            </span>
                            <h5 className="font-extrabold text-[10.5px] text-white truncate group-hover:text-amber-400 transition-colors leading-tight">
                              {game.title}
                            </h5>
                            <span className="text-[9px] font-mono text-green-400 font-bold block leading-none">
                              {game.activePlayers.toLocaleString()} in game
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Launch Footer Panel */}
            <div className="p-4 bg-[#111214] border-t border-[#393B3D] flex justify-end gap-3 items-center font-sans">
              <button
                type="button"
                onClick={() => setActiveGame(null)}
                className="px-4 py-2 hover:bg-[#323436] text-gray-400 hover:text-white rounded text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setRunningGame(activeGame);
                  setActiveGame(null);
                }}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded text-sm flex items-center gap-2 transform active:scale-95 transition-all shadow-md cursor-pointer flex inline-flex items-center"
              >
                <Play fill="currentColor" size={16} /> Play Experience
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. IMMERSIVE PLAY GAME CLIENT WINDOW (Canvas Game Simulator sandbox overlay) */}
      {runningGame && (
        <GameSimulator 
          game={runningGame}
          onClose={() => setRunningGame(null)}
          avatarColor={avatarColor}
          skinColor={skinColor}
          activeHats={activeHatsIcons}
          friends={friends}
          onAddFriend={handleAddFriend}
          blockedUsers={blockedUsers}
          onToggleBlock={handleToggleBlock}
          onUpdateGame={(updated) => {
            setRunningGame(updated);
            setGames(prev => prev.map(g => g.id === updated.id ? updated : g));
          }}
        />
      )}

      {/* 5. IMMERSIVE VOXEL STUDIO IDE WORKSPACE overlay */}
      {runningStudio && (
        <StudioMock 
          onClose={() => setRunningStudio(false)}
          onLaunchGame={(game) => {
            setRunningStudio(false);
            setRunningGame(game);
            setGames(prev => {
              const cleaned = prev.filter(g => g.id !== game.id && g.title !== game.title);
              return [game, ...cleaned];
            });
          }}
        />
      )}

      {/* 5B. NO-CODE 2D ARCADE STUDIO WORKSPACE overlay */}
      {running2DStudio && (
        <Studio2D 
          onClose={() => setRunning2DStudio(false)}
          onPublish={(newGame) => {
            // Append immediately to reactive games list state
            setGames(prev => {
              if (prev.some(g => g.id === newGame.id)) return prev;
              return [newGame, ...prev];
            });

            // Put a new experience under CreateDashboard which invokes cloud Firestore persistence sync
            const expItem = {
              id: newGame.id,
              title: newGame.title,
              description: newGame.description,
              status: "Public" as const,
              lastUpdated: "Just now",
              visits: 0,
              createdDate: newGame.createdAt,
              is2D: true
            };
            customSetExperiences((prev: any) => {
              if (prev.some((e: any) => e.id === newGame.id)) return prev;
              return [expItem, ...prev];
            });
          }}
          onLaunchGame={(game) => {
            setRunning2DStudio(false);
            setRunningGame(game);
            setGames(prev => {
              const cleaned = prev.filter(g => g.id !== game.id && g.title !== game.title);
              return [game, ...cleaned];
            });
          }}
        />
      )}

      {/* 6. FLOATING NOTIFICATION SLIDEOVER SIDE SHEET */}
      {showNotificationPanel && (
        <div className="fixed top-12 right-0 bottom-0 w-80 bg-[#232527] border-l border-[#393B3D] p-4 shadow-2xl z-50 animate-slideLeft flex flex-col font-sans select-none">
          <div className="flex justify-between items-center pb-3 border-b border-[#393B3D] mb-4">
            <h3 className="font-bold text-xs text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Bell size={14} className="text-white" /> Live News Alert
            </h3>
            <button 
              onClick={() => setShowNotificationPanel(false)}
              className="p-1 hover:bg-[#323436] rounded text-gray-400 hover:text-white transition"
              title="Close notifications"
            >
              <X size={16} />
            </button>
          </div>

          {/* Toggle control for pop notification alerts */}
          <div className="bg-[#111214]/60 border border-[#393B3D]/80 rounded-xl p-3 mb-4 flex items-center justify-between gap-2.5">
            <div className="space-y-0.5 min-w-0">
              <h4 className="text-[11px] font-black text-gray-200 uppercase tracking-wider flex items-center gap-1">
                💬 ON-SCREEN POPUPS
              </h4>
              <p className="text-[9.5px] text-gray-400 leading-snug">Shows pop toast alerts for developer passive sales</p>
            </div>
            <button
              onClick={() => {
                const nextState = !enablePopNotifications;
                setEnablePopNotifications(nextState);
                localStorage.setItem('enablePopNotifications', nextState.toString());
                
                try {
                  const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const nodeOsc = ac.createOscillator();
                  const nodeGain = ac.createGain();
                  nodeOsc.type = "sine";
                  nodeOsc.frequency.setValueAtTime(nextState ? 755 : 420, ac.currentTime);
                  nodeGain.gain.setValueAtTime(0.04, ac.currentTime);
                  nodeGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
                  nodeOsc.connect(nodeGain);
                  nodeGain.connect(ac.destination);
                  nodeOsc.start();
                  nodeOsc.stop(ac.currentTime + 0.1);
                } catch (err) {}
              }}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex cursor-pointer shrink-0 ${
                enablePopNotifications ? 'bg-emerald-500 justify-end' : 'bg-zinc-700 justify-start'
              }`}
              id="popups-toggle-button"
              title={enablePopNotifications ? "Disable popup feed" : "Enable popup feed"}
            >
              <motion.span
                layout
                className="w-4 h-4 rounded-full bg-white shadow-md block"
              />
            </button>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto">
            {notifications.slice(0, 15).map((notif) => (
              <div 
                key={notif.id}
                className="p-3 bg-[#111214]/80 hover:bg-[#323436] border border-[#393B3D] rounded-lg text-xs leading-relaxed transition flex gap-3 animate-fadeIn"
              >
                <span className="text-xl leading-none select-none">{notif.icon}</span>
                <div className="space-y-0.5 min-w-0">
                  <h5 className="font-bold text-gray-200 truncate">{notif.title}</h5>
                  <p className="text-gray-400 text-[11px] leading-relaxed break-words">{notif.text}</p>
                  <span className="text-[9px] text-gray-600 block pt-1">{notif.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[#393B3D] text-[10px] text-[#393B3D] flex items-center justify-between font-sans">
            <span className="flex items-center gap-1 text-gray-400"><Shield size={10} strokeWidth={2.5} /> Escrow Active</span>
            <span className="text-gray-400 font-mono">Process Node: #ONLINE</span>
          </div>
        </div>
      )}

      {/* Dynamic passive sales notifier overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-55 max-w-sm bg-slate-900 border-2 border-emerald-500 rounded-xl p-4.5 shadow-2xl flex items-start gap-3 text-sm text-white"
          >
            <div className="p-1 rounded-full bg-emerald-500/15 text-emerald-400 shrink-0 select-none">
              💰
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h5 className="font-bold text-gray-100 font-sans tracking-wide text-xs">Developer Sales Feed</h5>
              <p className="font-semibold text-gray-300 leading-relaxed text-[11px] font-sans break-words">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-slate-800/80 rounded text-slate-400 hover:text-white transition cursor-pointer self-start ml-2 shrink-0"
              title="Close sales notice"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. MODERN RETRO-FUTURISTIC ONBOARDING / SIGN-IN SCREEN */}
      {onboardingOpen && !authLoading && (
        <div className="fixed inset-0 z-55 overflow-y-auto bg-[#131416]/98 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(235,94,40,0.12),transparent_40%)] pointer-events-none" />
          <div className="absolute inset-0 roblox-grid opacity-10 pointer-events-none" />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg bg-[#191B1D] border border-zinc-850 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md text-left"
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300" />

            {/* Logo Header */}
            <div className="text-center mb-6 space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-600 to-amber-500 rounded-2xl shadow-lg transform rotate-6 mb-1 border border-orange-400">
                <span className="text-2xl font-black text-white px-2 uppercase select-none">B</span>
              </div>
              <h1 className="text-3xl font-display font-black text-white tracking-tight uppercase">
                Bloxland Core
              </h1>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Enter the multiplayer trading hub, craft rare customizable gear, and publish multi-dimensional arcade games.
              </p>
            </div>

            {onboardingStage === 'signin' ? (
              <div className="space-y-6">
                <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl text-center space-y-2">
                  <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Terminal Identity Check</h3>
                  <p className="text-xs text-zinc-500">
                    To save products, publish maps, trade items, and chat securely with other developers, please connect with Google or choose Guest Local Mode.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await handleSignIn();
                      } catch (err) {
                        console.error("SSO Error:", err);
                      }
                    }}
                    className="w-full py-3.5 px-4 bg-white hover:bg-zinc-100 text-black font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 transform active:scale-98 shadow-md cursor-pointer"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.39 7.5l3.85 2.99c.92-2.75 3.49-4.75 6.76-4.75z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.18-2 3.72-4.97 3.72-8.61z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.24 14.51a7.93 7.93 0 010-5.02L1.39 6.5a11.93 11.93 0 000 11l3.85-2.99z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.71-2.88c-1.03.69-2.35 1.11-4.25 1.11-3.27 0-5.84-2-6.76-4.75L1.39 16.5C3.37 20.35 7.35 23 12 23z"
                      />
                    </svg>
                    Continue with Google ID
                  </button>

                  {signInError && (
                    <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-2xl text-left space-y-3.5 text-xs animate-shake">
                      <div className="flex items-center justify-between border-b border-red-900/30 pb-2">
                        <div className="flex items-center gap-2 text-red-400 font-bold">
                          <span>⚠️ Sign-in Issue</span>
                        </div>
                        <span className="text-[9px] bg-red-900/50 text-red-200 py-0.5 px-2 rounded font-mono select-all uppercase">
                          {signInError.includes('popup-blocked') ? 'Popup Blocked' : signInError.includes('cancelled-popup') ? 'Popup Closed' : 'Auth Error'}
                        </span>
                      </div>
                      
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        {signInError.includes('popup-blocked') || signInError.includes('cancelled-popup-request') ? (
                          <>
                            Your browser blocked or closed the popup. Inside the <strong>preview iframe</strong>, web browser rules prevent Google Auth Popups from showing up securely.
                          </>
                        ) : (
                          <>
                            The Firebase Authentication request returned an error. This is very common in sandbox or iframe environments.
                          </>
                        )}
                      </p>

                      <div className="flex flex-col gap-2 pt-1">
                        <a
                          href={window.location.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-center text-[11px] uppercase tracking-wider shadow-lg hover:shadow-indigo-950/50 transition-all duration-150 transform active:scale-95 flex items-center justify-center gap-2"
                        >
                          🚀 Open App in New Tab to Sign In
                        </a>
                        <p className="text-[10px] text-zinc-500 text-center leading-snug">
                          Opening the application in a separate tab completely bypasses browser iframe security limits, making popups work perfectly!
                        </p>
                      </div>

                      <div className="border-t border-zinc-800/80 pt-2 space-y-2">
                        <span className="text-[9px] font-mono font-black text-red-400 uppercase tracking-widest block">Quick Troubleshooting Checklist:</span>
                        <ul className="list-disc pl-4 space-y-1.5 text-zinc-400 text-[11.5px] leading-relaxed">
                          <li>
                            <strong className="text-zinc-200">Enable Google SSO in Firebase:</strong> Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline inline-underline">Firebase Console</a>, access <strong>Authentication &rarr; Sign-in method</strong>, and check that <strong>Google</strong> is toggled to Enabled.
                          </li>
                          <li>
                            <strong className="text-zinc-200">Otherwise, Play as Guest:</strong> You can click the <strong>"Play as Guest"</strong> button below to play/test everything locally immediately!
                          </li>
                        </ul>
                      </div>

                      <div className="pt-2 border-t border-red-950/40 text-[9px] text-zinc-500 font-mono break-all line-clamp-2">
                        System Details: {signInError}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 py-1 text-[10px] text-zinc-600 font-mono">
                    <span className="h-px bg-zinc-800 flex-1"></span>
                    <span>OR CONTINUE OFFLINE</span>
                    <span className="h-px bg-zinc-800 flex-1"></span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setOnboardingStage('namescreen');
                    }}
                    className="w-full py-3.5 px-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-white font-medium rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-98 cursor-pointer"
                  >
                    Play as Guest
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOnboardingSubmit} className="space-y-5">
                <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 p-4 rounded-2xl">
                  <h3 className="text-xs font-bold text-orange-400 tracking-wide uppercase flex items-center gap-1.5 mb-1">
                    ✨ Create Your Persona
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Define your digital identity. This configures how your character profile appears in chats, trade listings, and game lobbies.
                  </p>
                </div>

                {onboardingError && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-medium animate-shake">
                    ⚠️ {onboardingError}
                  </div>
                )}

                {/* Form fields */}
                <div className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      In-Game Display Name
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="e.g. GamerProX"
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                      required
                    />
                  </div>

                  {/* Username field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Chosen @Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono select-none">
                        @
                      </span>
                      <input
                        type="text"
                        maxLength={15}
                        value={tempUsername.replace(/^@/, '')}
                        onChange={(e) => setTempUsername("@" + e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="username"
                        className="w-full bg-zinc-900 border border-zinc-850 rounded-xl pl-9 pr-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-orange-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Gender Selector field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Gender Persona
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: 'Male', label: 'Boy', icon: '👦' },
                        { key: 'Female', label: 'Girl', icon: '👧' },
                        { key: 'Other', label: 'Other', icon: '👽' }
                      ].map((genderOption) => {
                        const isSelected = tempGender === genderOption.key;
                        return (
                          <button
                            key={genderOption.key}
                            type="button"
                            onClick={() => setTempGender(genderOption.key)}
                            className={`py-3 px-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-orange-500/10 border-orange-500 text-white font-black'
                                : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                            }`}
                          >
                            <span className="text-xl select-none">{genderOption.icon}</span>
                            <span className="text-[11px] uppercase tracking-wider font-semibold">{genderOption.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Birthday dropdown fields */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Birthday
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Month dropdown */}
                      <select
                        value={tempBirthMonth}
                        onChange={(e) => setTempBirthMonth(e.target.value)}
                        className="bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                        required
                      >
                        <option value="">Month</option>
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, idx) => {
                          const val = String(idx + 1).padStart(2, '0');
                          return <option key={val} value={val}>{month}</option>;
                        })}
                      </select>

                      {/* Day dropdown */}
                      <select
                        value={tempBirthDay}
                        onChange={(e) => setTempBirthDay(e.target.value)}
                        className="bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                        required
                      >
                        <option value="">Day</option>
                        {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((day) => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>

                      {/* Year dropdown */}
                      <select
                        value={tempBirthYear}
                        onChange={(e) => setTempBirthYear(e.target.value)}
                        className="bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                        required
                      >
                        <option value="">Year</option>
                        {Array.from({ length: 87 }, (_, i) => String(2026 - i)).map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    {/* Real-time formatted birthday display */}
                    <div className="flex items-center gap-2 mt-2 pt-0.5 text-[11px] font-mono text-zinc-400 select-none relative">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      <span className="relative inline-flex items-center">
                        Selected:&nbsp;
                        <motion.span 
                          animate={showBirthdayCelebration ? { 
                            scale: [1, 1.25, 0.95, 1.05, 1],
                            color: ['#ffffff', '#f97316', '#eab308', '#ffffff'],
                            borderColor: ['#27272a', '#ea580c', '#f59e0b', '#27272a']
                          } : {}}
                          transition={{ duration: 0.65, ease: "easeInOut" }}
                          className="text-white bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 font-bold transition-all relative inline-block ml-0.5"
                        >
                          {tempBirthDay || 'DD'}/{tempBirthMonth || 'MM'}/{tempBirthYear || 'YYYY'}

                          {/* Celebration Confetti Burst */}
                          {showBirthdayCelebration && (
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-1 h-1">
                              {/* 24 radiating motion particles */}
                              {Array.from({ length: 24 }).map((_, idx) => {
                                const angle = (idx / 24) * 360 + Math.random() * 12;
                                const angleRad = (angle * Math.PI) / 180;
                                const distance = 45 + Math.random() * 60;
                                const x = Math.cos(angleRad) * distance;
                                const y = Math.sin(angleRad) * distance - 8;
                                const colors = ['#f97316', '#eab308', '#ec4899', '#3b82f6', '#10b981', '#a855f7'];
                                const color = colors[idx % colors.length];
                                return (
                                  <motion.span
                                    key={`confetti-${idx}`}
                                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                                    animate={{ 
                                      x: x, 
                                      y: y, 
                                      scale: [0, 1.3, 0.5, 0], 
                                      opacity: [1, 1, 0.6, 0] 
                                    }}
                                    transition={{ 
                                      duration: 1.6, 
                                      ease: "easeOut",
                                      delay: Math.random() * 0.08 
                                    }}
                                    className="absolute w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
                                  />
                                );
                              })}

                              {/* Twinkling rising emojis */}
                              {['✨', '🎈', '⭐', '🎉'].map((emoji, eIdx) => {
                                const xOffset = -50 + eIdx * 32;
                                return (
                                  <motion.span
                                    key={`emoji-${eIdx}`}
                                    initial={{ y: 0, opacity: 0, scale: 0 }}
                                    animate={{ 
                                      y: -45 - Math.random() * 20, 
                                      opacity: [0, 1, 1, 0], 
                                      scale: [0, 1.4, 1.1, 0],
                                      rotate: [-20, 20, -10, 10]
                                    }}
                                    transition={{ 
                                      duration: 2.2, 
                                      ease: "easeOut",
                                      delay: eIdx * 0.12 
                                    }}
                                    className="absolute text-xs font-sans select-none pointer-events-none"
                                    style={{ left: `${xOffset}px` }}
                                  >
                                    {emoji}
                                  </motion.span>
                                );
                              })}

                              {/* High-contrast halo ripple expansion ring */}
                              <motion.span
                                initial={{ scale: 0.6, opacity: 1 }}
                                animate={{ scale: 4.0, opacity: 0 }}
                                transition={{ duration: 0.9, ease: "easeOut" }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-orange-500/90"
                              />
                            </span>
                          )}
                        </motion.span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  {/* Back button only if they are guests (authenticated user is forced to finish step 2 or sign out) */}
                  {!currentUser && (
                    <button
                      type="button"
                      onClick={() => setOnboardingStage('signin')}
                      className="px-4 py-3 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  {currentUser && (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSignOut();
                        setOnboardingStage('signin');
                      }}
                      className="px-4 py-3 bg-zinc-900 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-3 px-5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold rounded-xl text-sm shadow-md transition-all duration-200 transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    Create Character & Enter
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Social Portal / "Follow Us On" Promo Modal */}
      <AnimatePresence>
        {showFollowUs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-55 overflow-y-auto bg-[#131416]/98 flex items-center justify-center p-4 backdrop-blur-md"
          >
            {/* Ambient radiating gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 roblox-grid opacity-10 pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="w-full max-w-lg bg-[#191B1D] border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-left"
            >
              {/* Decorative Indigo Top Ribbon Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

              {/* Close Button ("Exit Page") */}
              <button
                onClick={() => {
                  try {
                    const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = ac.createOscillator();
                    const gain = ac.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, ac.currentTime);
                    gain.gain.setValueAtTime(0.04, ac.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
                    osc.connect(gain);
                    gain.connect(ac.destination);
                    osc.start();
                    osc.stop(ac.currentTime + 0.1);
                  } catch (e) {}
                  setShowFollowUs(false);
                }}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-805 border-zinc-800/85 hover:border-zinc-700 rounded-xl transition-all duration-150 cursor-pointer shadow-md group active:scale-95 flex items-center justify-center shrink-0"
                title="Exit Page"
                id="follow-us-close-button"
              >
                <X size={16} className="group-hover:rotate-90 transition-transform duration-200" />
              </button>

              {/* Header */}
              <div className="text-center mb-6 mt-4 space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-500 rounded-2xl shadow-lg shadow-indigo-950/20 mb-1.5 border border-indigo-400">
                  <span className="text-2xl font-black text-white px-2 select-none">📢</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight uppercase">
                  Follow Us & Feedback!
                </h1>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Join our official developer network, stay connected with creators, report bugs, and submit feature recommendations.
                </p>
              </div>

              {/* External Links Grid */}
              <div className="space-y-3.5">
                {/* Discord */}
                <a
                  href="https://discord.gg/897d9NGaB"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    try {
                      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = ac.createOscillator();
                      const gain = ac.createGain();
                      osc.type = 'sine';
                      osc.frequency.setValueAtTime(587.33, ac.currentTime);
                      gain.gain.setValueAtTime(0.03, ac.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
                      osc.connect(gain);
                      gain.connect(ac.destination);
                      osc.start();
                      osc.stop(ac.currentTime + 0.1);
                    } catch (e) {}
                  }}
                  className="flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/60 hover:border-indigo-500/50 rounded-2xl transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-xl flex items-center justify-center text-xl shrink-0 select-none group-hover:scale-105 transition-transform duration-200">
                      👾
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors leading-snug">
                        Discord Server
                      </h3>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        Join our chat room & connect with the developer guild
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                </a>

                {/* YouTube */}
                <a
                  href="https://youtube.com/@microbytz?si=a9GFi7wipVs93xzb"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    try {
                      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = ac.createOscillator();
                      const gain = ac.createGain();
                      osc.type = 'sine';
                      osc.frequency.setValueAtTime(659.25, ac.currentTime);
                      gain.gain.setValueAtTime(0.03, ac.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
                      osc.connect(gain);
                      gain.connect(ac.destination);
                      osc.start();
                      osc.stop(ac.currentTime + 0.1);
                    } catch (e) {}
                  }}
                  className="flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/60 hover:border-red-500/50 rounded-2xl transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-xl flex items-center justify-center text-xl shrink-0 select-none group-hover:scale-105 transition-transform duration-200">
                      🎥
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white group-hover:text-red-400 transition-colors leading-snug">
                        YouTube Channel
                      </h3>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        Subscribe for video tutorials & feature summaries
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-zinc-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/microbytz?igsh=MXc4bDA5bnVneGlqdA=="
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    try {
                      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = ac.createOscillator();
                      const gain = ac.createGain();
                      osc.type = 'sine';
                      osc.frequency.setValueAtTime(698.46, ac.currentTime);
                      gain.gain.setValueAtTime(0.03, ac.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
                      osc.connect(gain);
                      gain.connect(ac.destination);
                      osc.start();
                      osc.stop(ac.currentTime + 0.1);
                    } catch (e) {}
                  }}
                  className="flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/60 hover:border-pink-500/50 rounded-2xl transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 bg-[#E1306C]/10 border border-[#E1306C]/20 rounded-xl flex items-center justify-center text-xl shrink-0 select-none group-hover:scale-105 transition-transform duration-200">
                      📸
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white group-hover:text-pink-400 transition-colors leading-snug">
                        Instagram Profile
                      </h3>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        Check out virtual items, design reels, & daily posts
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-zinc-500 group-hover:text-pink-400 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                </a>
              </div>

              {/* Feedback Links Section */}
              <div className="pt-3 pb-2 border-t border-zinc-800/60 my-4 flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 font-bold uppercase">Feedback & Suggestions</span>
                <span className="text-[9px] font-bold text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded tracking-wider font-mono">SUPPORT</span>
              </div>

              <div className="space-y-3.5">
                {/* Bug Report */}
                <a
                  href="https://discord.gg/FG46uS4JS"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    try {
                      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = ac.createOscillator();
                      const gain = ac.createGain();
                      osc.type = 'sine';
                      osc.frequency.setValueAtTime(523.25, ac.currentTime);
                      gain.gain.setValueAtTime(0.03, ac.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
                      osc.connect(gain);
                      gain.connect(ac.destination);
                      osc.start();
                      osc.stop(ac.currentTime + 0.1);
                    } catch (e) {}
                  }}
                  className="flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/60 hover:border-red-500/50 rounded-2xl transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-xl shrink-0 select-none group-hover:scale-105 transition-transform duration-200">
                      🐛
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white group-hover:text-red-400 transition-colors leading-snug">
                        Report bug
                      </h3>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        Found a bug? Tell us on our Discord server
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-zinc-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                </a>

                {/* Feature Suggestions */}
                <a
                  href="https://discord.gg/bSeK5HkNN"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    try {
                      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = ac.createOscillator();
                      const gain = ac.createGain();
                      osc.type = 'sine';
                      osc.frequency.setValueAtTime(659.25, ac.currentTime);
                      gain.gain.setValueAtTime(0.03, ac.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
                      osc.connect(gain);
                      gain.connect(ac.destination);
                      osc.start();
                      osc.stop(ac.currentTime + 0.1);
                    } catch (e) {}
                  }}
                  className="flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800/60 hover:border-amber-500/50 rounded-2xl transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-xl shrink-0 select-none group-hover:scale-105 transition-transform duration-200">
                      💡
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
                        Suggest features
                      </h3>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        Have ideas? Share feature recommendations
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                </a>
              </div>

              {/* Exit page button at bottom */}
              <div className="pt-5 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = ac.createOscillator();
                      const gain = ac.createGain();
                      osc.type = 'sine';
                      osc.frequency.setValueAtTime(440, ac.currentTime);
                      gain.gain.setValueAtTime(0.04, ac.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
                      osc.connect(gain);
                      gain.connect(ac.destination);
                      osc.start();
                      osc.stop(ac.currentTime + 0.1);
                    } catch (e) {}
                    setShowFollowUs(false);
                  }}
                  className="w-full py-3 px-5 bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-505 hover:to-purple-405 hover:from-indigo-500 hover:to-purple-400 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-md transition-all duration-200 transform active:scale-98 cursor-pointer text-center"
                >
                  Exit Page
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Stream Stream Screen Recorder Widget */}
      <ScreenRecorder />

    </div>
  );
}
