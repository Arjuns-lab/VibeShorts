import React, { useState, useMemo } from 'react';
import { VideoPost, User } from '../types';
import { USERS } from '../constants';
import { SearchIcon, CopyIcon, CheckIcon } from '../constants';

interface ShareModalProps {
    post: VideoPost;
    currentUser: User;
    onClose: () => void;
}

const useSwipeToClose = ({ onClose, threshold = 100 }: { onClose: () => void; threshold?: number }) => {
    const [swipeState, setSwipeState] = useState({ startY: 0, deltaY: 0, isDragging: false, hasDragged: false });

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        setSwipeState({ ...swipeState, startY: e.touches[0].clientY, isDragging: true, hasDragged: true });
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!swipeState.isDragging) return;
        const currentY = e.touches[0].clientY;
        const delta = currentY - swipeState.startY;
        if (delta >= 0) { // allow dragging down from 0
            setSwipeState(prev => ({ ...prev, deltaY: delta }));
        }
    };

    const handleTouchEnd = () => {
        if (!swipeState.isDragging) return;
        if (swipeState.deltaY > threshold) {
            onClose();
        } else {
            setSwipeState(prev => ({ ...prev, startY: 0, deltaY: 0, isDragging: false }));
        }
    };

    const style: React.CSSProperties = swipeState.hasDragged ? {
        transform: `translateY(${swipeState.deltaY}px)`,
        transition: swipeState.isDragging ? 'none' : 'transform 0.3s ease-out',
    } : {};

    const touchHandlers = {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
    };

    return { touchHandlers, style };
};


const ShareModal: React.FC<ShareModalProps> = ({ post, currentUser, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sentTo, setSentTo] = useState<string[]>([]);
    const [isLinkCopied, setIsLinkCopied] = useState(false);
    const { touchHandlers, style } = useSwipeToClose({ onClose });

    const friends = useMemo(() => {
        return Object.values(USERS).filter(u => u.id !== currentUser.id);
    }, [currentUser.id]);

    const filteredFriends = useMemo(() => {
        if (!searchTerm.trim()) {
            return friends;
        }
        return friends.filter(friend =>
            friend.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [friends, searchTerm]);

    const handleSend = (friendId: string) => {
        if (sentTo.includes(friendId)) return;
        setSentTo(prev => [...prev, friendId]);
        setTimeout(() => {
            onClose();
        }, 800);
    };

    const handleCopyLink = () => {
        const link = `https://vibeshorts.app/v/${post.id}`;
        navigator.clipboard.writeText(link).then(() => {
            setIsLinkCopied(true);
            setTimeout(() => setIsLinkCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy link: ', err);
            alert('Failed to copy link.');
        });
    };


    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end"
            onClick={onClose}
        >
            <div
                className="bg-[var(--frame-bg-color)] text-[var(--text-color)] w-full max-w-sm h-[70vh] rounded-t-3xl flex flex-col"
                onClick={e => e.stopPropagation()}
                {...touchHandlers}
                style={style}
            >
                <header className="flex-shrink-0 p-4 flex flex-col items-center justify-center relative border-b-2 border-[var(--border-color)]">
                     <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mb-3"></div>
                    <h2 className="text-xl font-black font-display">Share Vibe</h2>
                    <button onClick={onClose} className="absolute top-4 right-4 text-2xl font-bold opacity-60 hover:opacity-100">&times;</button>
                </header>
                
                <div className="p-4 flex-shrink-0 border-b-2 border-[var(--border-color)]">
                    <h3 className="font-bold text-sm opacity-60 px-1 mb-2">Share to...</h3>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <button 
                            onClick={handleCopyLink}
                            className={`flex flex-col items-center justify-center gap-1.5 w-20 text-center transition-colors ${isLinkCopied ? 'text-green-500' : ''}`}
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isLinkCopied ? 'bg-green-500/10' : 'bg-[var(--bg-color)] hover:bg-[var(--border-color)]'}`}>
                                {isLinkCopied ? <CheckIcon className="w-7 h-7" /> : <CopyIcon className="w-7 h-7" />}
                            </div>
                            <span className="text-xs font-semibold">{isLinkCopied ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                    </div>
                </div>

                <div className="p-4 flex-shrink-0">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search for a friend..."
                            className="w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-xl py-2.5 pl-11 pr-4 text-[var(--text-color)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] font-medium text-base transition-colors"
                        />
                    </div>
                </div>

                <main className="flex-grow overflow-y-auto px-4 space-y-2">
                    {filteredFriends.map(friend => (
                        <div key={friend.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-color)]">
                            <div className="flex items-center gap-3">
                                <img src={friend.avatarUrl} alt={friend.username} className="w-12 h-12 rounded-full" />
                                <div>
                                    <p className="font-bold">@{friend.username}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSend(friend.id)}
                                disabled={sentTo.includes(friend.id)}
                                className={`px-5 py-2 rounded-full font-bold transition-all duration-200 ${
                                    sentTo.includes(friend.id)
                                        ? 'bg-green-500 text-white'
                                        : 'bg-[var(--accent-color)] text-white hover:scale-105'
                                }`}
                            >
                                {sentTo.includes(friend.id) ? 'Sent!' : 'Send'}
                            </button>
                        </div>
                    ))}
                    {filteredFriends.length === 0 && (
                        <p className="text-center opacity-70 pt-8">No friends found.</p>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ShareModal;