import React from 'react';
import { VideoPost, User, Notification, Comment } from './types';

// Export USERS constant to make it available for import in other modules.
export const USERS: { [key:string]: User } = {
  user1: { 
    id: 'u1', 
    username: 'codeMaster', 
    avatarUrl: 'https://picsum.photos/id/1005/100/100',
    bio: 'Building the future, one line of code at a time. 💻✨',
    followingCount: 150,
    followerCount: 25000,
    totalLikes: 123000,
    vibeCoinBalance: 5000,
    followingIds: ['u2', 'u4'],
    payoutsSetUp: true,
    upiId: 'codeMaster@upi',
  },
  user2: { 
    id: 'u2', 
    username: 'reactDev', 
    avatarUrl: 'https://picsum.photos/id/1012/100/100',
    bio: 'Just a developer who loves creating beautiful UIs with React. ⚛️',
    followingCount: 320,
    followerCount: 54300,
    totalLikes: 54321,
    vibeCoinBalance: 10250,
    followingIds: ['u1', 'u3', 'u5'],
    payoutsSetUp: true,
    upiId: 'reactdev@upi',
  },
  user3: { 
    id: 'u3', 
    username: 'vibeCreator', 
    avatarUrl: 'https://picsum.photos/id/1027/100/100',
    bio: 'Bringing good vibes to your feed daily. ✌️',
    followingCount: 890,
    followerCount: 98700,
    totalLikes: 98765,
    vibeCoinBalance: 9876,
    followingIds: ['u2'],
    payoutsSetUp: false,
  },
  user4: { 
    id: 'u4', 
    username: 'synthWaveFan', 
    avatarUrl: 'https://picsum.photos/id/1040/100/100',
    bio: 'Riding the synthwave into the sunset. 🌅🎶',
    followingCount: 200,
    followerCount: 25000,
    totalLikes: 25000,
    vibeCoinBalance: 2500,
    followingIds: ['u1', 'u5'],
    payoutsSetUp: false,
  },
  user5: {
    id: 'u5',
    username: 'travelExplorer',
    avatarUrl: 'https://picsum.photos/id/1015/100/100',
    bio: 'Exploring the world one city at a time. ✈️🌍',
    followingCount: 450,
    followerCount: 120000,
    totalLikes: 850000,
    vibeCoinBalance: 12345,
    followingIds: ['u2', 'u3'],
    payoutsSetUp: true,
    upiId: 'travel@upi',
  },
  user6: {
    id: 'u6',
    username: 'foodieFusion',
    avatarUrl: 'https://picsum.photos/id/1080/100/100',
    bio: 'Cooking up a storm in the kitchen. 🍳🌶️',
    followingCount: 600,
    followerCount: 350000,
    totalLikes: 1200000,
    vibeCoinBalance: 20000,
    followingIds: ['u1', 'u3', 'u5'],
    payoutsSetUp: false,
  },
};

export const CURRENT_USER: User = { 
  id: 'u_current', 
  username: 'jb', 
  avatarUrl: 'https://picsum.photos/id/100/100/100',
  bio: 'Just exploring and creating my own vibes. Tap to edit your bio!',
  followingCount: 78,
  followerCount: 120,
  totalLikes: 450,
  vibeCoinBalance: 1300,
  followingIds: ['u1', 'u3', 'u5'],
  payoutsSetUp: false,
  upiId: '',
};


export const MOCK_VIDEO_POSTS: VideoPost[] = [
  {
    id: 'v1',
    user: USERS.user1,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    posterUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
    caption: 'Just vibing with this new setup! What do you think? #developer #coding #setupwars',
    songTitle: 'Lo-Fi Beats - Chillhop Records',
    likes: 12345,
    comments: 876,
    shares: 234,
    textOverlays: [
      {
        id: 't1-v1',
        text: 'Clean Setup ✨',
        color: '#FFFFFF',
        fontSize: 32,
        fontFamily: 'Nunito',
        position: { x: 50, y: 15 },
        startTime: 1,
        endTime: 4,
      }
    ]
  },
  {
    id: 'v2',
    user: USERS.user2,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    posterUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
    caption: 'Weekend getaway was a success! 🚗💨 #roadtrip #adventure #travel',
    songTitle: 'Good Times - All Time Low',
    likes: 54321,
    comments: 1234,
    shares: 567,
  },
  {
    id: 'v3',
    user: USERS.user3,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    posterUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
    caption: 'This little one is a handful but so cute! ❤️ #family #toddlerlife #cute',
    songTitle: 'You Are My Sunshine - Nursery Rhymes',
    likes: 98765,
    comments: 4567,
    shares: 1234,
  },
    {
    id: 'v4',
    user: USERS.user4,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    posterUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg',
    caption: 'Taking the new ride for a spin. On and off-road! #subaru #offroad #carsoftiktok',
    songTitle: 'Born to Run - Bruce Springsteen',
    likes: 25000,
    comments: 998,
    shares: 412,
  },
   {
    id: 'v5',
    user: USERS.user5,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    posterUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg',
    caption: 'Mind-blowing visuals from this short film! #cgi #blender #scifi',
    songTitle: 'Epic Cinematic Score - Two Steps From Hell',
    likes: 250000,
    comments: 3456,
    shares: 2345,
  },
  {
    id: 'v6',
    user: USERS.user6,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    posterUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/WeAreGoingOnBullrun.jpg',
    caption: 'A day at the farm is a day well spent. #farmlife #countryside #animals',
    songTitle: 'Homegrown - Zac Brown Band',
    likes: 180000,
    comments: 1500,
    shares: 800,
  },
   {
    id: 'v7',
    user: USERS.user1,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    posterUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    caption: 'This classic animation never gets old. Such a masterpiece!',
    songTitle: 'Funny Song - Bensound',
    likes: 345678,
    comments: 12345,
    shares: 8765,
  },
   {
    id: 'v8',
    user: USERS.user3,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    posterUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
    caption: 'The surreal world of Elephants Dream. What do you think it all means?',
    songTitle: 'Dreamscape - Ethereal',
    likes: 9876,
    comments: 543,
    shares: 123,
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1',
        type: 'like',
        user: USERS.user2,
        post: MOCK_VIDEO_POSTS[0],
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        isRead: false,
    },
    {
        id: 'n2',
        type: 'follow',
        user: USERS.user3,
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        isRead: false,
    },
    {
        id: 'n3',
        type: 'comment',
        user: USERS.user1,
        post: MOCK_VIDEO_POSTS[1],
        commentText: 'Looks like an awesome trip! Where was this?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        isRead: true,
    },
     {
        id: 'n4',
        type: 'like',
        user: USERS.user4,
        post: MOCK_VIDEO_POSTS[0],
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        isRead: true,
    },
];

export const MOCK_COMMENTS: { [postId: string]: Comment[] } = {
    'v1': [
        { id: 'c1-v1', user: USERS.user2, text: 'That setup is goals! 🔥', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
        { id: 'c2-v1', user: USERS.user4, text: 'Love the chill vibes here.', timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
    ],
    'v2': [
        { id: 'c1-v2', user: USERS.user1, text: 'Awesome! Where is this?', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
        { id: 'c2-v2', user: USERS.user3, text: 'Looks like so much fun!', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
        { id: 'c3-v2', user: USERS.user5, text: 'I need a road trip ASAP!', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    ],
    'v3': [],
};

export const TRENDING_TAGS = ['#setupwars', '#travel', '#toddlerlife', '#offroad', '#carsoftiktok', '#coding', '#adventure'];

// Icon Components (Clean, Modern style)
export const HeartIcon = (props: React.SVGProps<SVGSVGElement> & { filled?: boolean }) => {
  const { filled, ...rest } = props;
  const path = "M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.68998C2 5.59998 4.49 3.09998 7.56 3.09998C9.38 3.09998 10.99 3.97998 12 5.33998C13.01 3.97998 14.62 3.09998 16.44 3.09998C19.51 3.09998 22 5.59998 22 8.68998C22 15.69 15.52 19.82 12.62 20.81Z";
  
  if (filled) {
    return (
      <svg {...rest} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d={path}/>
      </svg>
    );
  }
  return (
    <svg {...rest} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
    </svg>
  );
};

export const CommentIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

export const ShareIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

export const ShareSolidIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.362 10.938a1.5 1.5 0 0 1 0-1.876l18-9a1.5 1.5 0 0 1 1.968 1.968l-9 18a1.5 1.5 0 0 1-2.824-.755L8.98 13.02 1.725 11.498a1.5 1.5 0 0 1 .637-.56z"/>
    </svg>
);

export const MusicDiscIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5" />
        <circle cx="50" cy="50" r="15" fill="currentColor"/>
    </svg>
);

export const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export const HomeIcon = (props: React.SVGProps<SVGSVGElement> & { filled?: boolean }) => props.filled ? <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path></svg> : <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
export const SearchIcon = (props: React.SVGProps<SVGSVGElement> & { filled?: boolean }) => props.filled ? <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg> : <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
export const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
export const BellIcon = (props: React.SVGProps<SVGSVGElement> & { filled?: boolean }) => props.filled ? <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"></path></svg> : <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
export const UserIcon = (props: React.SVGProps<SVGSVGElement> & { filled?: boolean }) => props.filled ? <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg> : <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
export const LockIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
export const UploadCloudIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.3,14.6C18,12,16.1,10,13.6,10c-0.2,0-0.4,0-0.6,0.1C12.3,8.4,10.6,7,8.5,7C6,7,4,9,4,11.5c0,0.3,0,0.5,0.1,0.8 C4,12.3,4,12.2,4,12.2c-2.2,0.1-4,1.9-4,4.1c0,2.3,1.8,4.1,4.1,4.1h11c2.7,0,4.9-2.2,4.9-4.9C20,15.5,19.3,14.9,18.3,14.6z M12,13v6"></path><polyline points="15 16 12 13 9 16"></polyline></svg>;

export const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

export const FullScreenIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
    </svg>
);

export const FullScreenExitIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9V3h6M21 15v6h-6M3 3l7 7M21 21l-7-7"></path>
    </svg>
);

export const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

export const VolumeOnIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
);

export const VolumeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9"x2="23" y2="15"></line>
    </svg>
);

export const GridIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);

export const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export const SignalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.9 16.1A11.6 11.6 0 0 1 12 13a11.6 11.6 0 0 1 7.1 3.1"></path>
    <path d="M2.1 11.4a20.8 20.8 0 0 1 19.8 0"></path>
    <path d="M8 20.3a4 4 0 0 1 8 0"></path>
  </svg>
);

export const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
);

export const TextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7"></polyline>
        <line x1="9" y1="20" x2="15" y2="20"></line>
        <line x1="12" y1="4" x2="12" y2="20"></line>
    </svg>
);

export const ArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <polyline points="19 12 12 19 5 12"></polyline>
    </svg>
);

export const AutoscrollIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m8 12 4 4 4-4" />
        <path d="M12 8v8" />
    </svg>
);

export const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5v14l11-7z" />
    </svg>
);

export const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

export const PlaybackSpeedIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 19 22 12 13 5 13 19"></polygon>
        <polygon points="2 19 11 12 2 5 2 19"></polygon>
    </svg>
);

export const UndoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 13.5A9 9 0 1 1 12 4.5c2.5 0 4.8.99 6.4 2.6L15 10.5" />
        <path d="M15 4.5v6h6" />
    </svg>
);

export const RedoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 13.5A9 9 0 1 0 12 4.5c-2.5 0-4.8.99-6.4 2.6L9 10.5" />
        <path d="M9 4.5v6h-6" />
    </svg>
);

export const HistoryIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4v6h6" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
);

export const CoinIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-yellow-400">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-2-5.5h4v1h-4v-1zm-1.5 2.5h7v1h-7v-1z"/>
        <path d="M10 12.5c0 .83.67 1.5 1.5 1.5h1c.83 0 1.5-.67 1.5-1.5v-3c0-.83-.67-1.5-1.5-1.5h-1C10.67 8 10 8.67 10 9.5v3z" opacity=".3"/>
        <text x="12" y="14.5" textAnchor="middle" fontSize="5" fontWeight="bold" fill="white">$</text>
    </svg>
);

export const GiftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12"></polyline>
        <rect x="2" y="7" width="20" height="5"></rect>
        <line x1="12" y1="22" x2="12" y2="7"></line>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
    </svg>
);

export const BarChartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10"></line>
        <line x1="18" y1="20" x2="18" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="16"></line>
    </svg>
);

export const MailIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
export const KeyIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>;
export const SunIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
export const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;

export const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

export const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

export const CameraIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
    </svg>
);

export const WalletBellIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 10.3A7.5 7.5 0 0 1 12.5 3a7.5 7.5 0 0 1 7.5 7.3V14H5v-3.7Z" />
    <path d="M3 18h18" />
    <path d="M5 14h14v4H5z" />
    <path d="M12.5 7v4" />
  </svg>
);

export const NoPostsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="3" x2="21" y2="21" />
    <path d="M12 12 5.6 5.6" />
    <path d="m11 3-3 3" />
    <path d="m3 11 3-3" />
    <path d="m21 13-3 3" />
    <path d="m13 21 3-3" />
  </svg>
);

export const UpiIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v2c0 1.1.9 2 2 2h1.2" />
        <path d="M21 3v2c0 1.1-.9 2-2 2h-1.2" />
        <path d="M3 21v-2c0-1.1.9-2 2-2h1.2" />
        <path d="M21 21v-2c0-1.1-.9-2-2-2h-1.2" />
        <path d="M11 3h2" />
        <path d="M11 21h2" />
        <path d="M3 11v2" />
        <path d="M21 11v2" />
    </svg>
);
