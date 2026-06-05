export interface PlayerReport {
  id: string;
  reporter: string;
  reported: string;
  reason: string;
  text: string;
  gameId: string;
  gameTitle?: string;
  timestamp: string;
}

export interface PlayerAppeal {
  id: string;
  playerName: string;
  gameId: string;
  gameTitle?: string;
  statement: string;
  timestamp: string;
  status: 'PENDING' | 'REJECTED' | 'APPROVED';
}

export interface PlayerModerationData {
  playerName: string;
  reports: PlayerReport[];
  warningsCount: number;
  isBanned: boolean;
  banType?: 'AUTO' | 'ADMIN'; // Admin bans are permanently sealed
  appeals?: PlayerAppeal[];
}

export const REPORT_CATEGORIES = [
  'Cheating, Exploiting or Glitching',
  'Harassment, Bullying or Intimidation',
  'Toxic Communication & Profanity',
  'Scamming, Fraud & Phishing',
  'Inappropriate Avatar / Outfits',
  'Server Flooding & Text Spamming',
  'Disruptive Gameplay (Flinging, Block Spam)'
];

// Read moderation database
export const getModerationDB = (): Record<string, PlayerModerationData> => {
  const raw = localStorage.getItem('roblox_moderation_database');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
};

// Write moderation database
export const saveModerationDB = (db: Record<string, PlayerModerationData>) => {
  localStorage.setItem('roblox_moderation_database', JSON.stringify(db));
};

// Check if a player is banned
export const isPlayerBanned = (playerName: string): boolean => {
  const db = getModerationDB();
  const player = db[playerName];
  return player ? player.isBanned : false;
};

// Check if a player is ADMIN banned (strictly irreversible)
export const isPlayerAdminBanned = (playerName: string): boolean => {
  const db = getModerationDB();
  const player = db[playerName];
  return player ? (player.isBanned && player.banType === 'ADMIN') : false;
};

// Reset moderation database (for debugging to restore players quickly)
export const resetModerationDB = () => {
  localStorage.removeItem('roblox_moderation_database');
};

// Report player function
export const reportPlayerInDB = (
  reportedName: string,
  reporterName: string,
  reason: string,
  text: string,
  gameId: string,
  gameTitle?: string
): { warned: boolean; banned: boolean; totalUniqueReports: number; warningsCount: number } => {
  const db = getModerationDB();
  
  if (!db[reportedName]) {
    db[reportedName] = {
      playerName: reportedName,
      reports: [],
      warningsCount: 0,
      isBanned: false,
      appeals: []
    };
  }

  const playerMod = db[reportedName];
  if (!playerMod.appeals) {
    playerMod.appeals = [];
  }

  // Each report increments warnings count: "everytime someone reports a person the person safety gets a warning."
  playerMod.warningsCount += 1;

  const newReport: PlayerReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    reporter: reporterName,
    reported: reportedName,
    reason,
    text: text || `Reported for "${reason}" in-game.`,
    gameId,
    gameTitle: gameTitle || gameId,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  playerMod.reports.push(newReport);

  // Compute unique reporters
  const uniqueReporters = new Set(playerMod.reports.map(r => r.reporter.trim()));
  
  // More than 6 reports from different-different people (at least 7 unique reporters)
  const previouslyBanned = playerMod.isBanned;
  const isBannedNow = uniqueReporters.size > 6;
  
  // Only upgrade ban if not already banned by admin manually
  if (playerMod.banType !== 'ADMIN') {
    playerMod.isBanned = isBannedNow;
    if (isBannedNow && !previouslyBanned) {
      playerMod.banType = 'AUTO';
    }
  }

  saveModerationDB(db);

  return {
    warned: true,
    banned: playerMod.isBanned && !previouslyBanned,
    totalUniqueReports: uniqueReporters.size,
    warningsCount: playerMod.warningsCount
  };
};

// Admin Ban (irreversible/permanent from game)
export const adminBanPlayerInDB = (
  reportedName: string,
  gameId: string,
  gameTitle?: string
): void => {
  const db = getModerationDB();
  
  if (!db[reportedName]) {
    db[reportedName] = {
      playerName: reportedName,
      reports: [],
      warningsCount: 0,
      isBanned: true,
      banType: 'ADMIN',
      appeals: []
    };
  } else {
    db[reportedName].isBanned = true;
    db[reportedName].banType = 'ADMIN';
  }

  // Add an admin enforcement report log entry
  db[reportedName].reports.push({
    id: `rep_admin_${Date.now()}`,
    reporter: 'Game Admin Console',
    reported: reportedName,
    reason: 'Manual Admin Moderation Ban',
    text: 'Permanently blacklisted from the game server by administrator override.',
    gameId,
    gameTitle,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  saveModerationDB(db);
};

// Retrieve all pending appeals across all players
export const getActiveAppealsFromDB = (): PlayerAppeal[] => {
  const db = getModerationDB();
  const list: PlayerAppeal[] = [];
  Object.values(db).forEach(p => {
    if (p.appeals) {
      p.appeals.forEach(appeal => {
        list.push(appeal);
      });
    }
  });
  return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
};

// Submit an appeal
export const submitAppealInDB = (
  playerName: string,
  gameId: string,
  gameTitle: string,
  statement: string
): PlayerAppeal => {
  const db = getModerationDB();
  
  if (!db[playerName]) {
    db[playerName] = {
      playerName,
      reports: [],
      warningsCount: 0,
      isBanned: true,
      banType: 'AUTO',
      appeals: []
    };
  }

  const playerMod = db[playerName];
  if (!playerMod.appeals) {
    playerMod.appeals = [];
  }

  const newAppeal: PlayerAppeal = {
    id: `appeal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    playerName,
    gameId,
    gameTitle,
    statement,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    status: 'PENDING'
  };

  playerMod.appeals.push(newAppeal);
  saveModerationDB(db);
  return newAppeal;
};

// Process an appeal (for admins to review and approve/reject)
export const resolveAppealInDB = (
  playerName: string,
  appealId: string,
  status: 'APPROVED' | 'REJECTED'
): { success: boolean; unbanned: boolean; error?: string } => {
  const db = getModerationDB();
  const playerMod = db[playerName];
  if (!playerMod) return { success: false, unbanned: false, error: 'Player data not found.' };

  // Strict check: Admin bans cannot be appealed successfully/revoked because they are permanent
  if (playerMod.banType === 'ADMIN' && status === 'APPROVED') {
    return { 
      success: false, 
      unbanned: false, 
      error: 'Cannot approve appeal: Admin-level manual bans are permanently sealed.' 
    };
  }

  if (playerMod.appeals) {
    const appeal = playerMod.appeals.find(a => a.id === appealId);
    if (appeal) {
      appeal.status = status;
      
      if (status === 'APPROVED') {
        playerMod.isBanned = false;
        playerMod.banType = undefined;
        // Reset reports unique count to give them a fresh clean slate
        playerMod.reports = [];
      }
      
      saveModerationDB(db);
      return { success: true, unbanned: (status === 'APPROVED') };
    }
  }

  return { success: false, unbanned: false, error: 'Appeal ID not found.' };
};
