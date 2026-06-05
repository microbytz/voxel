export interface Game {
  id: string;
  title: string;
  thumbnail: string;
  upvoteRatio: number; // e.g. 94%
  activePlayers: number;
  creator: string;
  description: string;
  category: string;
  visits: number;
  createdAt: string;
  is2D?: boolean; // True for 2D arcade experiences
  isShort?: boolean; // Is a short / instant-play micro-game
  sizeMB?: number; // Size in MB
  rating?: number; // Rating out of 5 stars
  ratingCount?: number; // Count of user ratings
  parts?: any[]; // Optional 3D custom parts layout
  sprites?: any[]; // Optional 2D custom sprites level
  backdrop?: string; // Optional custom selected background theme
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatarColor: string; // Tailwind hex or class
  isOnline: boolean;
  status: string;
  lastOnline?: string;
  activeGameId?: string;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: 'Accessories' | 'Clothing' | 'Gear' | 'Faces';
  imageUrl: string;
  color: string;
  purchased: boolean;
  isLimited?: boolean;
  supply?: number;
  maxSupply?: number;
  priceHistory?: number[];
  originalPrice?: number;
  serialNumber?: number;
  isCreatorItem?: boolean;
  creatorName?: string;
  salesCount?: number;
  earnings?: number;
}

export interface Message {
  id: string;
  sender: string;
  username: string;
  senderColor: string;
  timestamp: string;
  unread: boolean;
  messages: {
    senderName: string;
    text: string;
    time: string;
  }[];
}

export interface Trade {
  id: string;
  partner: string;
  partnerAvatarColor: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed';
  giving: { name: string; value: number }[];
  receiving: { name: string; value: number }[];
  valueDifference: number;
}

export interface UserExperience {
  id: string;
  title: string;
  description: string;
  status: 'Public' | 'Private';
  lastUpdated: string;
  visits: number;
  createdDate: string;
  is2D?: boolean; // True for 2D Scratch-like creation
  gamepasses?: MonetizationItem[];
  devProducts?: MonetizationItem[];
}

export interface MonetizationItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'Gamepass' | 'DevProduct';
  sales: number;
  revenue: number;
  emoji: string;
}
