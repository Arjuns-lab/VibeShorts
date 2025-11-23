
export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  bio: string;
  followingCount: number;
  followerCount: number;
  totalLikes: number;
  vibeCoinBalance: number;
  followingIds: string[];
  payoutsSetUp: boolean;
  upiId?: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timestamp: string; // ISO string
}

export interface OverlayBase {
  id: string;
  position: { x: number; y: number }; // percentage-based: 0-100
  rotation?: number; // degrees
  scale?: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

export interface TextOverlay extends OverlayBase {
  type: 'text';
  text: string;
  color: string;
  fontSize: number; // in pixels
  fontFamily: string;
  textAlign?: 'left' | 'center' | 'right';
  backgroundStyle?: 'none' | 'rectangle' | 'pill';
  backgroundColor?: string;
  backgroundOpacity?: number; // 0 to 1
  backgroundImageUrl?: string; // For AI generated backgrounds
}

export interface ImageOverlay extends OverlayBase {
  type: 'image';
  src: string; // blob url
  opacity: number;
}

export interface VideoPost {
  id: string;
  user: User;
  videoUrl: string;
  posterUrl: string;
  caption: string;
  songTitle: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  textOverlays?: TextOverlay[];
  imageOverlays?: ImageOverlay[];
  filterClass?: string;
  startTime?: number;
  endTime?: number;
  quality?: 'SD' | 'HD' | '4K';
  hashtags?: string[];
  
  // Advanced Edit Props
  brightness?: number; // 1 is default
  contrast?: number; // 1 is default
  saturation?: number; // 1 is default
  rotation?: number; // 0, 90, 180, 270
  scale?: number; // 1 is default
  originalVolume?: number; // 0 to 1
  musicVolume?: number; // 0 to 1
}

export interface Transaction {
  id:string;
  type: 'earn_watch' | 'earn_bonus' | 'tip_sent' | 'cash_out';
  amount: number; // positive for earnings, negative for spending
  description: string;
  timestamp: string; // ISO string for simplicity
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow';
  user: User;
  post?: VideoPost;
  commentText?: string;
  timestamp: string; // ISO string
  isRead: boolean;
}
