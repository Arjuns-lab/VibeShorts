
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoPost, TextOverlay, User } from '../types';
import { HeartIcon, CommentIcon, ShareIcon, MusicDiscIcon, DownloadIcon, FullScreenIcon, FullScreenExitIcon, VolumeOnIcon, VolumeOffIcon, PlaybackSpeedIcon, AutoscrollIcon, PlayIcon, PauseIcon, CoinIcon, GiftIcon, ShareSolidIcon, GIFTS } from '../constants';

interface VideoPlayerProps {
  post: VideoPost;
  onView: (post: VideoPost) => void;
  onFullScreenToggle: (isFullscreen: boolean) => void;
  onVideoEnd: (postId: string) => void;
  isAutoScrollEnabled: boolean;
  onEarnCoins: (amount: number, type: 'earn_watch' | 'earn_bonus', description: string) => void;
  onTipCreator: (creator: User, amount: number) => boolean;
  currentUser: User;
  isMuted: boolean;
  setIsMuted: (value: boolean | ((prev: boolean) => boolean)) => void;
  volume: number;
  onSwipeToProfile: (user: User) => void;
  onSwipeToShare: (post: VideoPost) => void;
  onLike: (postId: string) => void;
  onOpenComments: (post: VideoPost) => void;
}

const PLAYBACK_RATES = [0.5, 1, 1.5, 2];
const TIP_AMOUNTS = [10, 50, 100];
const SWIPE_THRESHOLD = 80; // pixels

const useSwipeActions = ({
  onSwipeLeft,
  onSwipeRight,
  tapTimeoutRef,
  threshold = 80,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  tapTimeoutRef: React.MutableRefObject<number | null>;
  threshold?: number;
}) => {
  const [swipeState, setSwipeState] = useState({ startX: 0, startY: 0, deltaX: 0, isSwiping: false, direction: 'none' as 'left' | 'right' | 'none' });

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    setSwipeState({
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        deltaX: 0,
        isSwiping: false,
        direction: 'none'
    });
    e.stopPropagation();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (swipeState.startX === 0) return;
    const deltaX = e.touches[0].clientX - swipeState.startX;
    const deltaY = e.touches[0].clientY - swipeState.startY;

    if (!swipeState.isSwiping && Math.abs(deltaX) > Math.abs(deltaY) + 10) {
       setSwipeState(prev => ({ ...prev, isSwiping: true }));
       if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    }

    if (swipeState.isSwiping) {
       e.preventDefault();
       e.stopPropagation();
       setSwipeState(prev => ({
           ...prev,
           deltaX: deltaX,
           direction: deltaX > 0 ? 'right' : 'left'
       }));
    }
  };

  const handleTouchEnd = () => {
   if (swipeState.isSwiping) {
       if (swipeState.deltaX < -threshold) {
           onSwipeLeft();
       } else if (swipeState.deltaX > threshold) {
           onSwipeRight();
       }
   }
    setSwipeState({ startX: 0, startY: 0, deltaX: 0, isSwiping: false, direction: 'none' });
  };
  
  return {
    swipeState,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }
  };
};


const VideoPlayer: React.FC<VideoPlayerProps> = ({ post, onView, onFullScreenToggle, onVideoEnd, isAutoScrollEnabled, onEarnCoins, onTipCreator, currentUser, isMuted, setIsMuted, volume, onSwipeToProfile, onSwipeToShare, onLike, onOpenComments }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [showTipAnimation, setShowTipAnimation] = useState(false);
  const [isTippingModalOpen, setIsTippingModalOpen] = useState(false);
  const [isGiftTrayOpen, setIsGiftTrayOpen] = useState(false);
  const [animatingGift, setAnimatingGift] = useState<{ key: number; emoji: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedAmount, setBufferedAmount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleOverlays, setVisibleOverlays] = useState<TextOverlay[]>([]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPreview, setScrubPreview] = useState<{ time: number; position: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const tapTimeout = useRef<number | null>(null);
  const hasBeenViewed = useRef(false);
  const wasPlayingBeforeScrub = useRef(false);
  const hasEarnedCoinsForView = useRef(false);

  const { swipeState, touchHandlers } = useSwipeActions({
    onSwipeLeft: () => onSwipeToProfile(post.user),
    onSwipeRight: () => onSwipeToShare(post),
    tapTimeoutRef: tapTimeout,
    threshold: SWIPE_THRESHOLD
  });

  const clipStartTime = post.startTime ?? 0;
  const clipEndTime = post.endTime ?? duration;
  const clipDuration = duration > 0 ? clipEndTime - clipStartTime : 0;

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatTime = (timeInSeconds: number): string => {
      if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = Math.floor(timeInSeconds % 60);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const playVideo = useCallback(async () => {
    if (videoRef.current) {
      if (videoRef.current.currentTime < clipStartTime || videoRef.current.currentTime >= clipEndTime) {
        videoRef.current.currentTime = clipStartTime;
      }
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Video play failed:", error);
          setIsPlaying(false);
        }
      }
    }
  }, [clipStartTime, clipEndTime]);

  const pauseVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handlePlayPause = () => isPlaying ? pauseVideo() : playVideo();

  const handleLikeButtonClick = () => {
    if (!post.isLiked) {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 800);
    }
    onLike(post.id);
  };

  const handleContainerClick = () => {
      if (isGiftTrayOpen) {
        setIsGiftTrayOpen(false);
        return;
      }
      if (Math.abs(swipeState.deltaX) > 20) return;
      if (tapTimeout.current !== null) {
          clearTimeout(tapTimeout.current);
          tapTimeout.current = null;
          if (!post.isLiked) onLike(post.id);
          setShowLikeAnimation(true);
          setTimeout(() => setShowLikeAnimation(false), 800);
      } else {
          tapTimeout.current = window.setTimeout(() => {
              handlePlayPause();
              tapTimeout.current = null;
          }, 300);
      }
  };

  const handleFullScreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) document.exitFullscreen();
      else containerRef.current.requestFullscreen();
    }
  };
  
  const handleDownload = async () => {
    try {
        const response = await fetch(post.videoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${post.user.username}-${post.id}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error downloading video:', error);
        alert('Could not download video.');
      }
  };

  const handleTimeUpdate = () => {
      if (videoRef.current && !isScrubbing) {
          const time = videoRef.current.currentTime;

          if (time >= clipEndTime) {
            if (!hasEarnedCoinsForView.current) {
              onEarnCoins(10, 'earn_watch', `Watched @${post.user.username}'s full video`);
              hasEarnedCoinsForView.current = true;
              setShowCoinAnimation(true);
              setTimeout(() => setShowCoinAnimation(false), 1000);
            }
            onVideoEnd(post.id); 
            if (!isAutoScrollEnabled) {
                videoRef.current.currentTime = clipStartTime;
                playVideo();
            }
            return;
          }
          
          setCurrentTime(time);

          if (post.textOverlays) {
            const newVisibleOverlays = post.textOverlays.filter(o => time >= o.startTime && time <= o.endTime);
            if (JSON.stringify(newVisibleOverlays) !== JSON.stringify(visibleOverlays)) {
                setVisibleOverlays(newVisibleOverlays);
            }
          }
      }
  };
  
  const handleTip = (amount: number) => {
    const success = onTipCreator(post.user, amount);
    if(success) {
      setIsTippingModalOpen(false);
      setShowTipAnimation(true);
      setTimeout(() => setShowTipAnimation(false), 3000);
    }
  }
  
  const handleGiftButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGiftTrayOpen(prev => !prev);
  };
  
  const handleSendGift = (gift: { emoji: string; cost: number }) => {
    const success = onTipCreator(post.user, gift.cost);
    if(success) {
      setAnimatingGift({ key: Date.now(), emoji: gift.emoji });
      setTimeout(() => setAnimatingGift(null), 1200);
      setShowTipAnimation(true);
      setTimeout(() => setShowTipAnimation(false), 3000);
    }
    setIsGiftTrayOpen(false);
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      setBufferedAmount(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
    }
  };

  const handleLoadedMetadata = () => { if (videoRef.current) setDuration(videoRef.current.duration); };
  const toggleMute = () => setIsMuted(prev => !prev);

  const handleScrubUpdate = useCallback((clientX: number) => {
    if (!progressBarRef.current || !videoRef.current || clipDuration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const position = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, position / rect.width));
    const newTime = clipStartTime + (percent * clipDuration);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setScrubPreview({ time: newTime - clipStartTime, position: percent * 100 });
  }, [clipDuration, clipStartTime]);

  const handleScrubStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (duration <= 0) return;
      wasPlayingBeforeScrub.current = isPlaying;
      if (isPlaying) pauseVideo();
      setIsScrubbing(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      handleScrubUpdate(clientX);
  };
  
  const handleProgressBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isScrubbing && progressBarRef.current && clipDuration > 0) {
          const rect = progressBarRef.current.getBoundingClientRect();
          const position = e.clientX - rect.left;
          const percent = Math.max(0, Math.min(1, position / rect.width));
          setScrubPreview({ time: (percent * clipDuration), position: percent * 100 });
      }
  };

  useEffect(() => {
      const handleScrubMove = (e: MouseEvent | TouchEvent) => {
          if (!isScrubbing) return;
          const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
          handleScrubUpdate(clientX);
      };
      const handleScrubEnd = () => {
          if (!isScrubbing) return;
          if (wasPlayingBeforeScrub.current) playVideo();
          setIsScrubbing(false);
      };
      if (isScrubbing) {
          document.addEventListener('mousemove', handleScrubMove);
          document.addEventListener('touchmove', handleScrubMove);
          document.addEventListener('mouseup', handleScrubEnd);
          document.addEventListener('touchend', handleScrubEnd);
      }
      return () => {
          document.removeEventListener('mousemove', handleScrubMove);
          document.removeEventListener('touchmove', handleScrubMove);
          document.removeEventListener('mouseup', handleScrubEnd);
          document.removeEventListener('touchend', handleScrubEnd);
      };
  }, [isScrubbing, playVideo, pauseVideo, handleScrubUpdate]);

  const handleCyclePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    setPlaybackRate(PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length]);
  };

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = playbackRate; }, [playbackRate]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      onFullScreenToggle(isCurrentlyFullscreen);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [onFullScreenToggle]);

  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.volume = volume;
        videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
            playVideo();
            if (!hasBeenViewed.current) {
                onView(post);
                hasBeenViewed.current = true;
            }
        } else {
            pauseVideo();
            hasEarnedCoinsForView.current = false;
        }
      },
      { threshold: 0.5 } 
    );
    const currentContainer = containerRef.current;
    if (currentContainer) observer.observe(currentContainer);
    return () => {
      if (currentContainer) observer.unobserve(currentContainer);
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
    };
  }, [playVideo, pauseVideo, post, onView]);

  const progressPercent = clipDuration > 0 ? ((currentTime - clipStartTime) / clipDuration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedAmount / duration) * 100 : 0;

  return (
    <section ref={containerRef} id={`video-post-${post.id}`} className="h-full w-full snap-center relative flex justify-center items-center bg-black overflow-hidden" {...touchHandlers}>
       <div className={`absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-[var(--secondary-color)]/80 to-transparent flex items-center justify-start p-6 transition-opacity duration-300 ${swipeState.direction === 'right' ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col items-center text-white font-bold" style={{ transform: `scale(${Math.min(1.2, Math.max(0, swipeState.deltaX / SWIPE_THRESHOLD))})` }}>
                <ShareSolidIcon className="w-10 h-10" />
                <span>Share</span>
            </div>
        </div>
        <div className={`absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[var(--accent-color)]/80 to-transparent flex items-center justify-end p-6 transition-opacity duration-300 ${swipeState.direction === 'left' ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col items-center text-white font-bold" style={{ transform: `scale(${Math.min(1.2, Math.max(0, -swipeState.deltaX / SWIPE_THRESHOLD))})` }}>
                <img src={post.user.avatarUrl} alt={post.user.username} className="w-10 h-10 rounded-full border-2 border-white mb-1" />
                <span>Profile</span>
            </div>
        </div>

        <div 
            className="w-full h-full relative z-[1]"
            onClick={handleContainerClick}
            style={{ 
                transform: `translateX(${swipeState.deltaX}px)`,
                transition: swipeState.isSwiping ? 'none' : 'transform 0.3s ease-out'
            }}
        >
            <video ref={videoRef} src={post.videoUrl} poster={post.posterUrl} playsInline className={`w-full h-full object-contain ${post.filterClass || ''}`} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onProgress={handleProgress} />

            <div className="absolute inset-0 w-full h-full pointer-events-none z-[5]">
                {visibleOverlays.map(o => <div key={o.id} className="absolute p-2" style={{ left: `${o.position.x}%`, top: `${o.position.y}%`, transform: 'translate(-50%, -50%)', color: o.color, fontSize: `${o.fontSize}px`, fontFamily: o.fontFamily, fontWeight: '900', textShadow: '2px 2px 4px rgba(0,0,0,0.7)', whiteSpace: 'pre-wrap', textAlign: 'center' }}>{o.text}</div>)}
            </div>
            
            {showCoinAnimation && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-coin-rise flex items-center gap-2 bg-yellow-400/90 text-black font-bold py-2 px-3 rounded-full shadow-lg backdrop-blur-sm"><CoinIcon className="w-6 h-6" /><span>+10</span></div>)}
            {showTipAnimation && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-fade-in-out flex items-center gap-2 bg-green-500/90 text-white font-bold py-2 px-4 rounded-full shadow-lg backdrop-blur-sm"><span>Gift Sent!</span></div>)}
            {showLikeAnimation && (<div className="absolute inset-0 flex justify-center items-center z-20 pointer-events-none"><HeartIcon filled className="w-32 h-32 text-[var(--accent-color)] drop-shadow-lg animate-heart-pop" /></div>)}
            {!isPlaying && (<div className="absolute text-white/70 pointer-events-none drop-shadow-lg"><svg className="w-20 h-20" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10s10-4.5,10-10S17.5,2,12,2z M10,16.5v-9l6,4.5L10,16.5z"/></svg></div>)}

            <div className="absolute bottom-0 left-0 w-full p-4 text-white z-10 font-display" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                <div className="flex justify-between items-end">
                    <div className="w-3/4 space-y-2">
                        <div className="flex items-center space-x-3"><img src={post.user.avatarUrl} alt={post.user.username} className="w-12 h-12 rounded-full border-2 border-white bg-white p-0.5"/><p className="text-xl font-black">@{post.user.username}</p></div>
                        <p className="text-base font-medium leading-tight">{post.caption}</p>
                        <p className="font-bold text-lg pt-2">{post.songTitle}</p>
                        <div className="pt-2 space-y-2">
                            <div ref={progressBarRef} onMouseDown={handleScrubStart} onTouchStart={handleScrubStart} onMouseMove={handleProgressBarHover} onMouseLeave={() => { if (!isScrubbing) setScrubPreview(null); }} className="w-full py-3 -my-3 cursor-pointer relative group" role="slider" aria-valuemin={0} aria-valuemax={clipDuration} aria-valuenow={currentTime - clipStartTime} aria-label="Video progress bar" tabIndex={0}>
                                {scrubPreview && (<div className="absolute bottom-full mb-2 bg-black/80 text-white text-xs font-mono font-bold py-1 px-2 rounded-md pointer-events-none transition-opacity duration-100" style={{ left: `${scrubPreview.position}%`, transform: 'translateX(-50%)' }}>{formatTime(scrubPreview.time)}</div>)}
                                <div className="w-full h-1.5 group-hover:h-2 bg-white/30 rounded-full relative pointer-events-none transition-all duration-200 ease-out">
                                    <div className="absolute top-0 left-0 h-full bg-white/50 rounded-full" style={{ width: `${bufferedPercent}%` }}/>
                                    <div className="absolute top-0 left-0 h-full bg-white group-hover:bg-[var(--accent-color)] rounded-full transition-colors duration-200" style={{ width: `${progressPercent}%` }}/>
                                    <div className={`absolute top-1/2 w-4 h-4 bg-white rounded-full pointer-events-none shadow-md transition-transform,opacity duration-200 ease-out ${isScrubbing ? 'opacity-100 scale-125' : 'opacity-0 group-hover:opacity-100'}`} style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}/>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button onClick={e => { e.stopPropagation(); handlePlayPause(); }} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <PauseIcon className="w-6 h-6 text-white" /> : <PlayIcon className="w-6 h-6 text-white" />}</button>
                                    <button
                                        onClick={e => {e.stopPropagation(); handleCyclePlaybackRate();}}
                                        className="flex items-center gap-1 p-1 rounded-md hover:bg-white/10 transition-colors"
                                        aria-label={`Current playback speed: ${playbackRate}x. Click to change.`}
                                    >
                                        <PlaybackSpeedIcon className="w-5 h-5" />
                                        <span className="text-xs font-bold font-mono w-9 text-left">{playbackRate.toFixed(1)}x</span>
                                    </button>
                                </div>
                                <div className="text-sm font-bold font-mono tracking-tighter"><span>{formatTime(currentTime - clipStartTime)} / {formatTime(clipDuration)}</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center space-y-4">
                        <button className="flex flex-col items-center" onClick={e => {e.stopPropagation(); toggleMute();}}>
                            {isMuted || volume === 0 ? 
                                <VolumeOffIcon className="w-9 h-9 text-white" strokeWidth="2"/> : 
                                <VolumeOnIcon className="w-9 h-9 text-white" strokeWidth="2"/>
                            }
                            <span className="text-sm font-bold">{isMuted || volume === 0 ? 'Unmute' : 'Mute'}</span>
                        </button>
                        <button className="flex flex-col items-center" onClick={e => {e.stopPropagation(); handleLikeButtonClick();}}><HeartIcon filled={post.isLiked} className={`w-10 h-10 transition-colors duration-200 ${post.isLiked ? 'text-[var(--accent-color)]' : 'text-white'}`}/><span className="text-sm font-bold">{formatCount(post.likes)}</span></button>
                        <button className="flex flex-col items-center" onClick={e => { e.stopPropagation(); onOpenComments(post);}}><CommentIcon className="w-9 h-9 text-white" strokeWidth="2"/><span className="text-sm font-bold">{formatCount(post.comments)}</span></button>
                        <button className="flex flex-col items-center" onClick={e => { e.stopPropagation(); onSwipeToShare(post);}}><ShareIcon className="w-9 h-9 text-white" strokeWidth="2"/><span className="text-sm font-bold">{formatCount(post.shares)}</span></button>
                        <button className="flex flex-col items-center" onClick={handleGiftButtonClick}><GiftIcon className="w-9 h-9 text-white" strokeWidth="2"/><span className="text-sm font-bold">Tip</span></button>
                        <button className="flex flex-col items-center" onClick={e => {e.stopPropagation(); handleDownload();}}><DownloadIcon className="w-9 h-9 text-white" strokeWidth="2"/><span className="text-sm font-bold">Download</span></button>
                        <div className="w-12 h-12 relative mt-2"><MusicDiscIcon className="w-full h-full text-white/80 animate-spin" style={{ animationDuration: '6s' }}/><img src={post.user.avatarUrl} alt="song cover" className="w-6 h-6 rounded-full object-cover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/></div>
                    </div>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
            
            {isTippingModalOpen && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex justify-center items-end" onClick={(e) => { e.stopPropagation(); setIsTippingModalOpen(false); }}>
                    <div className="bg-[var(--frame-bg-color)] text-[var(--text-color)] w-full max-w-sm rounded-t-3xl p-5 flex flex-col gap-4 font-display" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-center">Send a Tip to @{post.user.username}</h3>
                        <div className="text-center bg-[var(--bg-color)] p-3 rounded-xl">
                            <p className="text-sm font-semibold opacity-70">Your Balance</p>
                            <div className="flex justify-center items-center gap-2"><CoinIcon className="w-6 h-6" /><span className="text-2xl font-black">{currentUser.vibeCoinBalance.toLocaleString()}</span></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {TIP_AMOUNTS.map(amount => (
                                <button 
                                    key={amount}
                                    onClick={() => handleTip(amount)}
                                    disabled={currentUser.vibeCoinBalance < amount}
                                    className="flex flex-col items-center justify-center gap-1 bg-[var(--bg-color)] p-4 rounded-xl hover:bg-[var(--border-color)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--bg-color)]"
                                >
                                    <span className="text-2xl">🎁</span>
                                    <div className="flex items-center gap-1"><CoinIcon className="w-5 h-5" /><span className="font-bold text-lg">{amount}</span></div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setIsTippingModalOpen(false)} className="w-full py-2.5 mt-2 text-lg font-bold border-2 border-[var(--border-color)] rounded-xl transition-colors hover:bg-[var(--text-color)]/10">Cancel</button>
                    </div>
                </div>
            )}
        </div>
        {isGiftTrayOpen && (
            <div className="absolute bottom-[10.5rem] right-20 z-20 bg-black/50 backdrop-blur-md p-2 rounded-full flex items-center gap-2 animate-gift-tray-in">
                {GIFTS.map(gift => (
                    <button 
                        key={gift.name}
                        onClick={(e) => { e.stopPropagation(); handleSendGift(gift); }}
                        disabled={currentUser.vibeCoinBalance < gift.cost}
                        className="flex flex-col items-center justify-center gap-1 p-1 rounded-full hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed group"
                    >
                        <span className="text-3xl group-hover:scale-110 transition-transform">{gift.emoji}</span>
                        <div className="flex items-center gap-0.5 text-xs font-bold text-yellow-300">
                            <CoinIcon className="w-3 h-3" />
                            <span>{gift.cost}</span>
                        </div>
                    </button>
                ))}
            </div>
        )}
        
        {animatingGift && (
            <div 
                key={animatingGift.key} 
                className="absolute bottom-36 right-8 text-5xl z-30 animate-gift-fly pointer-events-none"
            >
                {animatingGift.emoji}
            </div>
        )}
    </section>
  );
};

export default VideoPlayer;