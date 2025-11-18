
import React, { useState, useRef } from 'react';
import { User, VideoPost } from '../types';
import { SettingsIcon, GridIcon, HeartIcon, WalletBellIcon, NoPostsIcon, BarChartIcon, CameraIcon } from '../constants';
import CreatorDashboard from './CreatorDashboard';

interface ProfileProps {
    profileUser: User;
    currentUser: User;
    posts: VideoPost[];
    isFollowing: boolean;
    onToggleFollow: (userId: string) => void;
    onOpenSettings: () => void;
    onOpenWallet: () => void;
    onUpdateAvatar: (file: File) => void;
    onOpenPayoutSetup: () => void;
}

const Profile: React.FC<ProfileProps> = ({ profileUser, currentUser, posts, isFollowing, onToggleFollow, onOpenSettings, onOpenWallet, onUpdateAvatar, onOpenPayoutSetup }) => {
    const [activeTab, setActiveTab] = useState<'posts' | 'dashboard'>('posts');
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const formatCount = (count: number): string => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return String(count);
    };
    
    const isCurrentUserProfile = profileUser.id === currentUser.id;

    const handleAvatarClick = () => {
        if (isCurrentUserProfile) {
            avatarInputRef.current?.click();
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpdateAvatar(file);
        }
    };

    const StatItem: React.FC<{ value: string | number; label: string }> = ({ value, label }) => (
        <div className="text-center">
            <p className="text-xl font-black font-display">{formatCount(Number(value))}</p>
            <p className="text-sm text-[var(--text-color)]/70 font-semibold">{label}</p>
        </div>
    );

    return (
        <div className="h-full w-full bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col transition-colors duration-300">
            {/* Header */}
            <header className="flex-shrink-0 flex justify-between items-center p-4 border-b-2 border-[var(--border-color)]">
                <div className="w-8"></div>
                <h1 className="text-2xl font-black font-display text-center">@{profileUser.username}</h1>
                {isCurrentUserProfile ? (
                    <button onClick={onOpenSettings} className="p-1 rounded-full hover:bg-[var(--text-color)]/10">
                        <SettingsIcon className="w-7 h-7" />
                    </button>
                ) : (
                    <div className="w-8"></div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-grow overflow-y-auto">
                {/* Profile Info & Stats */}
                <div className="pt-6 px-6 flex flex-col items-center">
                    <div 
                        className={`relative group ${isCurrentUserProfile ? 'cursor-pointer' : ''}`}
                        onClick={handleAvatarClick}
                        role={isCurrentUserProfile ? 'button' : undefined}
                        tabIndex={isCurrentUserProfile ? 0 : -1}
                        aria-label={isCurrentUserProfile ? 'Change profile picture' : undefined}
                    >
                        <img src={profileUser.avatarUrl} alt={profileUser.username} className="w-28 h-28 rounded-full object-cover p-1 bg-white border-4 border-[var(--frame-bg-color)] shadow-lg" />
                        {isCurrentUserProfile && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <CameraIcon className="w-8 h-8 text-white" />
                            </div>
                        )}
                    </div>
                     {isCurrentUserProfile && (
                        <input
                            type="file"
                            accept="image/*"
                            ref={avatarInputRef}
                            onChange={handleAvatarChange}
                            className="hidden"
                            aria-hidden="true"
                        />
                    )}
                    <p className="text-center mt-4 font-medium opacity-80 max-w-sm">
                        {profileUser.bio}
                    </p>
                </div>
                
                <div className="grid grid-cols-4 gap-4 px-6 py-6">
                    <StatItem value={profileUser.followingCount} label="Following" />
                    <StatItem value={profileUser.followerCount} label="Followers" />
                    <StatItem value={profileUser.totalLikes} label="Likes" />
                    <StatItem value={profileUser.vibeCoinBalance} label="VibeCoins" />
                </div>
                
                {/* Action Buttons */}
                {isCurrentUserProfile ? (
                    <div className="grid grid-cols-2 gap-4 px-6 pb-6">
                        <button onClick={onOpenSettings} className="bg-[var(--frame-bg-color)] text-center py-4 rounded-2xl font-bold text-lg border-2 border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors">
                            Edit Profile
                        </button>
                        <button onClick={onOpenWallet} className="bg-[var(--frame-bg-color)] flex items-center justify-center gap-3 py-2.5 rounded-2xl font-bold text-lg border-2 border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors">
                            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                                <WalletBellIcon className="w-7 h-7 text-white" />
                            </div>
                            <span>My Wallet</span>
                        </button>
                    </div>
                ) : (
                    <div className="px-6 pb-6">
                        <button 
                            onClick={() => onToggleFollow(profileUser.id)}
                            className={`w-full py-3 text-lg font-bold rounded-xl transition-all duration-200 hover:scale-105 ${isFollowing ? 'bg-[var(--frame-bg-color)] border-2 border-[var(--border-color)] text-[var(--text-color)]' : 'text-white bg-gradient-to-br from-[var(--accent-color)] to-[var(--secondary-color)]'}`}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                )}

                {/* Tabs */}
                <div className="border-t-2 border-[var(--border-color)] grid grid-cols-2">
                    <button onClick={() => setActiveTab('posts')} className="flex justify-center items-center py-3 relative">
                        <GridIcon className={`w-7 h-7 ${activeTab === 'posts' ? 'text-[var(--accent-color)]' : 'text-[var(--text-color)]/50'}`} />
                        {activeTab === 'posts' && <div className="absolute bottom-0 h-1 w-full bg-[var(--accent-color)] rounded-t-full"></div>}
                    </button>
                    <button onClick={() => isCurrentUserProfile && setActiveTab('dashboard')} className="flex justify-center items-center py-3 relative" disabled={!isCurrentUserProfile}>
                        <BarChartIcon className={`w-7 h-7 ${activeTab === 'dashboard' ? 'text-[var(--accent-color)]' : 'text-[var(--text-color)]/50'} ${!isCurrentUserProfile ? 'opacity-20 cursor-not-allowed' : ''}`} />
                        {activeTab === 'dashboard' && <div className="absolute bottom-0 h-1 w-full bg-[var(--accent-color)] rounded-t-full"></div>}
                    </button>
                </div>
                
                {/* Tab Content */}
                {activeTab === 'posts' && (
                    <div className="grid grid-cols-3 gap-1 p-1">
                        {posts.length > 0 ? posts.map(post => (
                            <div key={post.id} className="aspect-[9/16] relative bg-[var(--bg-color)] rounded-md overflow-hidden group profile-video-thumb">
                                <img src={post.posterUrl} alt={post.caption} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-1 left-2 text-white flex items-center gap-1 font-bold text-sm">
                                    <HeartIcon filled className="w-4 h-4" />
                                    <span>{formatCount(post.likes)}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-3 flex flex-col items-center justify-center h-48 opacity-50">
                                <NoPostsIcon className="w-20 h-20" />
                                <p className="mt-2 font-bold text-lg">No Posts Yet</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'dashboard' && isCurrentUserProfile && (
                    <CreatorDashboard user={currentUser} posts={posts} onOpenPayoutSetup={onOpenPayoutSetup} />
                )}

            </main>
        </div>
    );
};

export default Profile;