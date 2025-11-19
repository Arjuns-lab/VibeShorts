
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_VIDEO_POSTS, CURRENT_USER, ArrowDownIcon, CoinIcon, MOCK_NOTIFICATIONS, MOCK_COMMENTS, USERS, UpiIcon, HeartIcon } from './constants';
import { VideoPost, User, TextOverlay, Transaction, Notification, Comment } from './types';
import VideoPlayer from './components/VideoPlayer';
import BottomNav from './components/BottomNav';
import Upload from './components/Upload';
import Discover from './components/Discover';
import Notifications from './components/Notifications';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Login from './components/Login';
import Wallet from './components/Wallet';
import Welcome from './components/Welcome';
import ShareModal from './components/ShareModal';
import CommentsModal from './components/CommentsModal';
import SkeletonLoader from './components/SkeletonLoader';
import CreateModal from './components/CreateModal';
import Live from './components/Live';

export type Page = 'feed' | 'discover' | 'upload' | 'notifications' | 'profile' | 'live';

// Navigation State
interface NavState {
  page: Page;
  viewedUser?: User;
}

const PULL_THRESHOLD = 80; // Pixels to pull down to trigger refresh
const DAILY_CHALLENGE_GOAL = 10;
const DAILY_CHALLENGE_BONUS = 50;
const SWIPE_EDGE_WIDTH = 40; // px for navigation swipe
const SWIPE_NAV_THRESHOLD = 80; // px to trigger navigation

// Payout Setup Modal Component
const PayoutSetupModal: React.FC<{ currentUser: User; onClose: () => void; onSave: (upiId: string) => void; }> = ({ currentUser, onClose, onSave }) => {
    const [upiId, setUpiId] = useState(currentUser.upiId || '');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (!upiId.trim() || !upiId.includes('@')) {
            setError('Please enter a valid UPI ID (e.g., yourname@bank).');
            return;
        }
        onSave(upiId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center" onClick={onClose}>
            <div className="bg-[var(--frame-bg-color)] text-[var(--text-color)] w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 flex flex-col gap-4 font-display" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-black text-center">Set Up Payouts</h2>
                <p className="text-center opacity-70 text-sm">Enter your UPI ID to receive payments directly to your bank account.</p>
                <div className="relative">
                    <UpiIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--text-color)]/40" />
                    <input
                        type="text"
                        value={upiId}
                        onChange={(e) => { setUpiId(e.target.value); setError(''); }}
                        placeholder="yourname@bank"
                        className="w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-xl py-3 pl-12 pr-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] font-medium text-base"
                    />
                </div>
                {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
                <div className="flex gap-2 mt-2">
                    <button onClick={onClose} className="w-full py-3 font-bold border-2 border-[var(--border-color)] rounded-xl hover:bg-[var(--text-color)]/10">Cancel</button>
                    <button onClick={handleSave} className="w-full py-3 font-bold text-white bg-[var(--accent-color)] rounded-xl">Save</button>
                </div>
            </div>
        </div>
    );
};

// Suggested Users Component for Empty Following Feed
const SuggestedUsers: React.FC<{ users: User[], currentUser: User, onToggleFollow: (userId: string) => void }> = ({ users, currentUser, onToggleFollow }) => (
    <div className="h-full w-full snap-start flex flex-col text-white p-4 pt-20 overflow-y-auto">
        <h2 className="text-2xl font-black font-display text-center">Suggested For You</h2>
        <p className="text-center opacity-80 mb-6">Follow some creators to fill your feed!</p>
        <div className="space-y-4">
            {users.filter(u => u.id !== currentUser.id).slice(0, 5).map(user => (
                <div key={user.id} className="bg-white/10 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={user.avatarUrl} alt={user.username} className="w-14 h-14 rounded-full"/>
                        <div>
                            <p className="font-bold text-lg">@{user.username}</p>
                            <p className="text-sm opacity-80 truncate w-40">{user.bio}</p>
                        </div>
                    </div>
                    <button onClick={() => onToggleFollow(user.id)} className="px-5 py-2 rounded-full font-bold bg-[var(--accent-color)] text-white hover:scale-105 transition-transform">Follow</button>
                </div>
            ))}
        </div>
    </div>
);

const App: React.FC = () => {
  const [videoPosts, setVideoPosts] = useState<VideoPost[]>([]);
  const [allComments, setAllComments] = useState<{ [postId: string]: Comment[] }>(MOCK_COMMENTS);
  const [history, setHistory] = useState<VideoPost[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [shareModalData, setShareModalData] = useState<VideoPost | null>(null);
  const [commentsModalPost, setCommentsModalPost] = useState<VideoPost | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPayoutSetupOpen, setIsPayoutSetupOpen] = useState(false);
  
  // Navigation State
  const [navigationHistory, setNavigationHistory] = useState<NavState[]>([{ page: 'feed' }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [transitionState, setTransitionState] = useState({ status: 'idle', direction: 'none' as 'left' | 'right' | 'none' });
  const touchState = useRef({ startX: 0, startY: 0, deltaX: 0, canSwipe: false });

  // Shared video player state
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);

  // Monetization & Engagement State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailyProgress, setDailyProgress] = useState({ count: 0, goal: DAILY_CHALLENGE_GOAL, completed: false });
  const [showBonusToast, setShowBonusToast] = useState(false);

  // Infinite scroll state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const feedRef = useRef<HTMLElement>(null);
  
  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullPosition, setPullPosition] = useState(0);
  const pullStartY = useRef<number>(0);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vibeShotTheme') || 'light';
  });

  const [isDataSaverEnabled, setIsDataSaverEnabled] = useState(() => {
    return localStorage.getItem('vibeShotDataSaver') === 'true';
  });

  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(() => {
    return localStorage.getItem('vibeShotAutoScroll') === 'true';
  });
  
  const [activeFeed, setActiveFeed] = useState<'foryou' | 'following'>('foryou');
  
  const currentNavState = navigationHistory[historyIndex];
  const page = currentNavState.page;
  
  useEffect(() => {
    // Add liked status to initial posts
    setVideoPosts(MOCK_VIDEO_POSTS.map(p => ({...p, isLiked: Math.random() > 0.8})));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vibeShotTheme', theme);
  }, [theme]);
  
  useEffect(() => {
    localStorage.setItem('vibeShotDataSaver', String(isDataSaverEnabled));
  }, [isDataSaverEnabled]);

  useEffect(() => {
    localStorage.setItem('vibeShotAutoScroll', String(isAutoScrollEnabled));
  }, [isAutoScrollEnabled]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
        ...transaction,
        id: `tx-${Date.now()}`,
        timestamp: new Date().toISOString(),
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
      const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}`,
          timestamp: new Date().toISOString(),
          isRead: false,
      };
      setNotifications(prev => [newNotification, ...prev]);
  };

  const handleLogin = (username: string) => {
    const loggedInUser: User = { ...CURRENT_USER, username, vibeCoinBalance: CURRENT_USER.vibeCoinBalance || 0 };
    setCurrentUser(loggedInUser);
    setIsAuthenticated(true);
    setShowWelcomeScreen(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    resetTo('feed');
    setIsSettingsOpen(false);
  };

  const handlePostVideo = (data: { videoFile: File; caption: string; hashtags: string[]; textOverlays: TextOverlay[]; filterClass: string; startTime: number; endTime: number; videoQuality: 'SD' | 'HD' | '4K'; songTitle?: string }) => {
    if (!currentUser) return;
    const newVideoUrl = URL.createObjectURL(data.videoFile);
    const newPost: VideoPost = {
      id: `v${Date.now()}`,
      user: currentUser,
      videoUrl: newVideoUrl,
      posterUrl: currentUser.avatarUrl,
      caption: data.caption,
      hashtags: data.hashtags,
      songTitle: data.songTitle || 'Original Sound • ' + currentUser.username,
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      textOverlays: data.textOverlays,
      filterClass: data.filterClass,
      startTime: data.startTime,
      endTime: data.endTime,
      quality: data.videoQuality,
    };
    setVideoPosts(prevPosts => [newPost, ...prevPosts]);
    resetTo('feed');
  };

  const handleAddToHistory = (post: VideoPost) => {
    setHistory(prevHistory => {
      const isAlreadyInHistory = prevHistory.some(p => p.id === post.id);
      if (isAlreadyInHistory) {
        return prevHistory;
      }
      
      // Update daily challenge progress
      if (!dailyProgress.completed) {
        const newCount = dailyProgress.count + 1;
        if (newCount === dailyProgress.goal) {
          // Challenge complete!
          setDailyProgress({ ...dailyProgress, count: newCount, completed: true });
          handleEarnCoins(DAILY_CHALLENGE_BONUS, 'earn_bonus', 'Daily Watch Challenge Bonus!');
          setShowBonusToast(true);
          setTimeout(() => setShowBonusToast(false), 4000);
        } else {
          setDailyProgress({ ...dailyProgress, count: newCount });
        }
      }
      
      return [post, ...prevHistory];
    });
  };

  const handleClearHistory = () => {
      if (window.confirm('Are you sure you want to clear your entire watch history? This cannot be undone.')) {
        setHistory([]);
      }
  };

  const handleUpdateBio = (newBio: string) => {
    if (!currentUser) return;
    setCurrentUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, bio: newBio };
    });
  };

  const handleUpdateAvatar = (newAvatarFile: File) => {
    if (!currentUser) return;
    const newAvatarUrl = URL.createObjectURL(newAvatarFile);
    setCurrentUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, avatarUrl: newAvatarUrl };
    });
  };

  const handleEarnCoins = (amount: number, type: 'earn_watch' | 'earn_bonus', description: string) => {
    if (!currentUser) return;
    setCurrentUser(prevUser => {
        if (!prevUser) return null;
        return {
            ...prevUser,
            vibeCoinBalance: (prevUser.vibeCoinBalance || 0) + amount
        };
    });
    addTransaction({ type, amount, description });
  };

  const handleTipCreator = (creator: User, amount: number) => {
    if (!currentUser || currentUser.vibeCoinBalance < amount) {
      alert("You don't have enough VibeCoins to make this tip!");
      return false;
    }
    
    setCurrentUser(prevUser => {
        if (!prevUser) return null;
        return {
            ...prevUser,
            vibeCoinBalance: prevUser.vibeCoinBalance - amount
        };
    });
    addTransaction({ type: 'tip_sent', amount: -amount, description: `Tipped @${creator.username}`});
    return true;
  };
  
  const handleSetupPayouts = (upiId: string) => {
      if (!currentUser) return;
      setCurrentUser(prev => prev ? ({ ...prev, upiId, payoutsSetUp: true }) : null);
      // In a real app, this would be an API call.
      alert(`Payouts set up for UPI ID: ${upiId}`);
  };

  const handleCashOut = (amount: number) => {
      if (!currentUser || !currentUser.payoutsSetUp || currentUser.vibeCoinBalance < amount) {
          alert('Cannot process cash out. Check balance and payout setup.');
          return false;
      }
      setCurrentUser(prev => prev ? ({ ...prev, vibeCoinBalance: prev.vibeCoinBalance - amount }) : null);
      addTransaction({ type: 'cash_out', amount: -amount, description: `Cashed out to ${currentUser.upiId}` });
      return true;
  };

  const handleMarkNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const hasUnreadNotifications = notifications.some(n => !n.isRead);

  const loadMoreVideos = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      const morePosts = MOCK_VIDEO_POSTS.map(post => ({
        ...post,
        id: `${post.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`, 
        isLiked: Math.random() > 0.8
      })).sort(() => Math.random() - 0.5);
      setVideoPosts(prevPosts => [...prevPosts, ...morePosts]);
      setIsLoadingMore(false);
    }, 1000); 
  };

  const handleScroll = () => {
    const feedElement = feedRef.current;
    if (feedElement) {
        const { scrollTop, scrollHeight, clientHeight } = feedElement;
        if (scrollHeight - scrollTop <= clientHeight * 1.5) {
            loadMoreVideos();
        }
    }
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setTimeout(() => {
      const refreshedPosts = [...MOCK_VIDEO_POSTS]
        .sort(() => Math.random() - 0.5)
        .map(post => ({
          ...post,
          id: `${post.id.split('-')[0]}-${Date.now()}-${Math.random().toString(36).substring(7)}`, 
          isLiked: Math.random() > 0.8
        }));
      setVideoPosts(refreshedPosts);
      setIsRefreshing(false);
      if (feedRef.current) {
        feedRef.current.scrollTop = 0;
      }
    }, 1500);
  };

  const handlePullTouchStart = (e: React.TouchEvent<HTMLElement>) => {
      if (feedRef.current?.scrollTop === 0) { pullStartY.current = e.touches[0].clientY; } 
      else { pullStartY.current = 0; }
  };
  const handlePullTouchMove = (e: React.TouchEvent<HTMLElement>) => {
      if (pullStartY.current === 0 || isRefreshing) return;
      const pullDistance = e.touches[0].clientY - pullStartY.current;
      if (pullDistance > 0) {
          e.preventDefault();
          setPullPosition(pullDistance / 2.5); 
      }
  };
  const handlePullTouchEnd = () => {
      if (pullStartY.current === 0 || isRefreshing) return;
      if (pullPosition > PULL_THRESHOLD) { handleRefresh(); }
      setPullPosition(0);
      pullStartY.current = 0;
  };

  const handleVideoEnd = (postId: string) => {
    if (!isAutoScrollEnabled || page !== 'feed') return;
    const currentPosts = getFilteredFeedPosts();
    const currentIndex = currentPosts.findIndex(p => p.id === postId);
    if (currentIndex > -1 && currentIndex < currentPosts.length - 1) {
        const nextPost = currentPosts[currentIndex + 1];
        const nextVideoElement = document.getElementById(`video-post-${nextPost.id}`);
        if (nextVideoElement) {
            nextVideoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
  };

    const handleViewProfile = (user: User) => {
        navigateTo({ page: 'profile', viewedUser: user });
    };

    const handleOpenShareModal = (post: VideoPost) => {
        setShareModalData(post);
    };

    const handleToggleLike = (postId: string) => {
        setVideoPosts(posts => posts.map(p => {
            if (p.id === postId) {
                return { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 };
            }
            return p;
        }));
    };

    const handleOpenComments = (post: VideoPost) => {
        setCommentsModalPost(post);
    };

    const handleAddComment = (postData: VideoPost, text: string) => {
        if (!currentUser) return;

        const postId = postData.id;

        const newComment: Comment = {
            id: `c-${Date.now()}`,
            user: currentUser,
            text,
            timestamp: new Date().toISOString(),
        };

        setAllComments(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), newComment],
        }));

        setVideoPosts(prev => prev.map(p => p.id === postId ? {...p, comments: p.comments + 1} : p));
        
        setCommentsModalPost(prev => {
            if (prev && prev.id === postId) {
                return { ...prev, comments: prev.comments + 1 };
            }
            return prev;
        });
        
        // Add notification if commenting on someone else's post
        if (postData.user.id !== currentUser.id) {
            addNotification({
                type: 'comment',
                user: currentUser,
                post: postData,
                commentText: text,
            });
        }
    };
    
    const handleToggleFollow = (userIdToFollow: string) => {
        if (!currentUser) return;
        const isFollowing = currentUser.followingIds.includes(userIdToFollow);
        const userToFollow = Object.values(USERS).find(u => u.id === userIdToFollow);

        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            const newFollowingIds = isFollowing
                ? prevUser.followingIds.filter(id => id !== userIdToFollow)
                : [...prevUser.followingIds, userIdToFollow];
            
            return {
                ...prevUser,
                followingIds: newFollowingIds,
                followingCount: newFollowingIds.length
            };
        });

        if (!isFollowing && userToFollow) {
            addNotification({ type: 'follow', user: currentUser });
        }
    };

    // Navigation functions
    const navigateTo = (navState: NavState) => {
      const newHistory = navigationHistory.slice(0, historyIndex + 1);
      setNavigationHistory([...newHistory, navState]);
      setHistoryIndex(newHistory.length);
    };

    const resetTo = (page: Page) => {
      if (navigationHistory.length === 1 && navigationHistory[0].page === page) return;
      setNavigationHistory([{ page, viewedUser: undefined }]);
      setHistoryIndex(0);
    };

    const goBack = () => {
      if (historyIndex > 0) {
        setTransitionState({ status: 'out', direction: 'right' });
      }
    };

    const goForward = () => {
      if (historyIndex < navigationHistory.length - 1) {
        setTransitionState({ status: 'out', direction: 'left' });
      }
    };

    const handleAnimationEnd = () => {
      if (transitionState.status === 'out') {
        const newIndex = transitionState.direction === 'right' ? historyIndex - 1 : historyIndex + 1;
        setHistoryIndex(newIndex);
        setTransitionState({ status: 'in', direction: transitionState.direction === 'right' ? 'left' : 'right' });
      } else if (transitionState.status === 'in') {
        setTransitionState({ status: 'idle', direction: 'none' });
      }
    };

    // Swipe navigation gesture handlers
    const handleNavTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      const canGoBack = historyIndex > 0;
      const canGoForward = historyIndex < navigationHistory.length - 1;
      
      if ((touch.clientX < SWIPE_EDGE_WIDTH && canGoBack) || ((e.currentTarget.clientWidth - touch.clientX) < SWIPE_EDGE_WIDTH && canGoForward)) {
        touchState.current = { startX: touch.clientX, startY: touch.clientY, deltaX: 0, canSwipe: true };
      } else {
        touchState.current.canSwipe = false;
      }
    };

    const handleNavTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (!touchState.current.canSwipe) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        touchState.current.canSwipe = false;
        return;
      }
      touchState.current.deltaX = deltaX;
    };

    const handleNavTouchEnd = () => {
      if (!touchState.current.canSwipe) return;
      const { deltaX } = touchState.current;
      if (deltaX > SWIPE_NAV_THRESHOLD) goBack();
      else if (deltaX < -SWIPE_NAV_THRESHOLD) goForward();
      touchState.current = { startX: 0, startY: 0, deltaX: 0, canSwipe: false };
    };
    
    const getPageClassName = () => {
        if (transitionState.status === 'out') {
            return transitionState.direction === 'left' ? 'slide-out-left' : 'slide-out-right';
        }
        if (transitionState.status === 'in') {
            return transitionState.direction === 'left' ? 'slide-in-from-left' : 'slide-in-from-right';
        }
        return '';
    };

  const getFilteredFeedPosts = () => {
      if (activeFeed === 'following' && currentUser) {
          return videoPosts.filter(p => currentUser.followingIds.includes(p.user.id));
      }
      return videoPosts;
  };

  const DailyChallengeProgress = () => (
    <div className="flex items-center gap-2 text-sm font-bold">
      <CoinIcon className="w-5 h-5" />
      <span>{dailyProgress.count} / {dailyProgress.goal}</span>
      <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-yellow-400 transition-all duration-300"
          style={{ width: `${(dailyProgress.count / dailyProgress.goal) * 100}%`}}
        />
      </div>
    </div>
  );

  const renderPage = () => {
    if (!isAuthenticated || !currentUser) {
        return <Login onLogin={handleLogin} />;
    }

    if (showWelcomeScreen) {
        return <Welcome onFinished={() => setShowWelcomeScreen(false)} />;
    }
    
    const feedPosts = getFilteredFeedPosts();

    switch (page) {
      case 'feed':
        return (
          <>
            <header className="absolute top-0 left-0 w-full z-10 p-4 bg-transparent">
                <div className="flex items-center justify-between space-x-2 text-white bg-black/20 backdrop-blur-sm p-1.5 rounded-full max-w-sm mx-auto" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                    {!dailyProgress.completed ? <DailyChallengeProgress /> : <span className="text-sm font-bold text-yellow-400 pl-2">🎉 Bonus Claimed!</span>}
                    <div className="flex items-center justify-center space-x-1 flex-grow">
                        <button onClick={() => setActiveFeed('following')} className={`text-center py-1.5 px-3 rounded-full transition-all ${activeFeed === 'following' ? 'font-black bg-[var(--frame-bg-color)] text-[var(--text-color)] shadow-md interactive-glow-light' : 'font-bold opacity-60'}`}>Following</button>
                        <button onClick={() => setActiveFeed('foryou')} className={`text-center py-1.5 px-4 rounded-full transition-all ${activeFeed === 'foryou' ? 'font-black bg-[var(--frame-bg-color)] text-[var(--text-color)] shadow-md interactive-glow-light' : 'font-bold opacity-60'}`}>For You</button>
                    </div>
                </div>
            </header>
            <main 
              ref={feedRef} onScroll={handleScroll}
              onTouchStart={handlePullTouchStart} onTouchMove={handlePullTouchMove} onTouchEnd={handlePullTouchEnd}
              className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black relative"
              style={{ overscrollBehaviorY: 'contain' }}
            >
              <div
                className="absolute top-0 left-0 w-full z-20 flex justify-center items-end pt-4 transition-all duration-200"
                style={{ transform: `translateY(-100%) translateY(${isRefreshing ? 160 : Math.min(pullPosition, 120)}px)`, opacity: isRefreshing || pullPosition > 10 ? 1 : 0 }}
              >
                 <div className="bg-[var(--frame-bg-color)] rounded-full p-2 shadow-lg">
                  {isRefreshing ? <div className="w-8 h-8 border-4 border-[var(--text-color)]/20 border-t-[var(--accent-color)] rounded-full animate-spin"></div>
                   : <ArrowDownIcon className="w-8 h-8 text-[var(--text-color)] transition-transform" style={{ transform: `rotate(${pullPosition > PULL_THRESHOLD ? '180deg' : '0deg'})` }} />}
                </div>
              </div>
              {isRefreshing ? (
                <>
                  <SkeletonLoader />
                  <SkeletonLoader />
                </>
              ) : feedPosts.length > 0 ? (
                feedPosts.map((post: VideoPost) => (
                  <VideoPlayer key={post.id} post={post} onView={handleAddToHistory} onFullScreenToggle={setIsFullScreen} onVideoEnd={handleVideoEnd} isAutoScrollEnabled={isAutoScrollEnabled} onEarnCoins={(amount, type, desc) => handleEarnCoins(amount, type, desc)} onTipCreator={handleTipCreator} currentUser={currentUser} isMuted={isMuted} setIsMuted={setIsMuted} volume={volume} onSwipeToProfile={handleViewProfile} onSwipeToShare={handleOpenShareModal} onLike={handleToggleLike} onOpenComments={handleOpenComments}/>
                ))
              ) : (
                <SuggestedUsers users={Object.values(USERS)} currentUser={currentUser} onToggleFollow={handleToggleFollow} />
              )}
              {isLoadingMore && (
                <div className="h-full w-full snap-center flex justify-center items-center bg-black">
                  <div className="w-12 h-12 border-4 border-[var(--text-color)]/20 border-t-[var(--accent-color)] rounded-full animate-spin"></div>
                </div>
              )}
            </main>
          </>
        );
      case 'discover':
        return <Discover posts={videoPosts} />;
      case 'upload':
        return <Upload onPost={handlePostVideo} onCancel={goBack} />;
      case 'live':
        return <Live onCancel={goBack} />;
      case 'notifications':
        return <Notifications notifications={notifications} onMarkAsRead={handleMarkNotificationsRead} />;
      case 'profile':
        const userToDisplay = currentNavState.viewedUser || currentUser;
        const postsForProfile = videoPosts.filter(p => p.user.id === userToDisplay.id);
        const isFollowing = currentUser.followingIds.includes(userToDisplay.id);
        return <Profile profileUser={userToDisplay} currentUser={currentUser} posts={postsForProfile} isFollowing={isFollowing} onToggleFollow={handleToggleFollow} onOpenSettings={() => setIsSettingsOpen(true)} onOpenWallet={() => setIsWalletOpen(true)} onUpdateAvatar={handleUpdateAvatar} onOpenPayoutSetup={() => setIsPayoutSetupOpen(true)} />;
      default:
        return null;
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-0 md:p-4">
      <div 
        className="w-full h-screen md:max-w-[420px] md:h-[90vh] bg-[var(--frame-bg-color)] md:rounded-[3rem] overflow-hidden relative" style={{boxShadow: '0 0 40px var(--glow-shadow-color)'}}
        onTouchStart={handleNavTouchStart}
        onTouchMove={handleNavTouchMove}
        onTouchEnd={handleNavTouchEnd}
      >
        <div className={`page-container ${getPageClassName()}`} onAnimationEnd={handleAnimationEnd}>
          {renderPage()}
        </div>
        {isAuthenticated && !isFullScreen && !showWelcomeScreen && <BottomNav currentPage={page} onNavigate={resetTo} onOpenCreateModal={() => setIsCreateModalOpen(true)} hasUnreadNotifications={hasUnreadNotifications} />}
        {isAuthenticated && isCreateModalOpen && (
            <CreateModal 
                onClose={() => setIsCreateModalOpen(false)}
                onNavigate={(page) => {
                    setIsCreateModalOpen(false);
                    navigateTo({ page });
                }}
            />
        )}
        {isAuthenticated && currentUser && shareModalData && (
            <ShareModal post={shareModalData} currentUser={currentUser} onClose={() => setShareModalData(null)} />
        )}
        {isAuthenticated && currentUser && commentsModalPost && (
            <CommentsModal post={commentsModalPost} comments={allComments[commentsModalPost.id] || []} currentUser={currentUser} onAddComment={handleAddComment} onClose={() => setCommentsModalPost(null)} />
        )}
        {isAuthenticated && currentUser && isWalletOpen && (
            <Wallet user={currentUser} transactions={transactions} onClose={() => setIsWalletOpen(false)} onOpenPayoutSetup={() => setIsPayoutSetupOpen(true)} onCashOut={handleCashOut} />
        )}
        {isAuthenticated && currentUser && isPayoutSetupOpen && (
            <PayoutSetupModal currentUser={currentUser} onClose={() => setIsPayoutSetupOpen(false)} onSave={handleSetupPayouts} />
        )}
        {isSettingsOpen && currentUser && (
          <Settings 
            theme={theme} setTheme={setTheme} 
            isDataSaverEnabled={isDataSaverEnabled} onDataSaverToggle={setIsDataSaverEnabled}
            isAutoScrollEnabled={isAutoScrollEnabled} onAutoScrollToggle={setIsAutoScrollEnabled}
            onClearHistory={handleClearHistory} onLogout={handleLogout}
            onClose={() => setIsSettingsOpen(false)}
            currentUser={currentUser}
            onUpdateBio={handleUpdateBio}
          />
        )}
        {showBonusToast && (
             <div className="absolute top-20 right-4 bg-gradient-to-br from-[var(--accent-color)] to-[var(--secondary-color)] text-white font-bold p-4 rounded-2xl shadow-lg animate-toast-in-right z-50">
                <p className="text-lg">🎉 Daily Challenge Complete! 🎉</p>
                <p>You earned {DAILY_CHALLENGE_BONUS} VibeCoins!</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;
