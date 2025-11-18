import React, { useState } from 'react';
import { VideoPost, Comment, User } from '../types';
import { XIcon, ShareIcon } from '../constants';

interface CommentsModalProps {
    post: VideoPost;
    comments: Comment[];
    currentUser: User;
    onClose: () => void;
    onAddComment: (postId: string, text: string) => void;
}

const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};

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


const CommentsModal: React.FC<CommentsModalProps> = ({ post, comments, currentUser, onClose, onAddComment }) => {
    const [newComment, setNewComment] = useState('');
    const { touchHandlers, style } = useSwipeToClose({ onClose });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedComment = newComment.trim();
        if (trimmedComment) {
            onAddComment(post.id, trimmedComment);
            setNewComment('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end" onClick={onClose}>
            <div
                className="bg-[var(--frame-bg-color)] text-[var(--text-color)] w-full max-w-sm h-[75vh] rounded-t-3xl flex flex-col animate-slide-in-up"
                onClick={e => e.stopPropagation()}
                {...touchHandlers}
                style={style}
            >
                <header className="flex-shrink-0 p-4 flex items-center justify-center relative border-b-2 border-[var(--border-color)]">
                    <h2 className="text-lg font-black font-display">{post.comments.toLocaleString()} comments</h2>
                    <button onClick={onClose} className="absolute top-1/2 -translate-y-1/2 right-4 p-1 rounded-full hover:bg-[var(--text-color)]/10">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-4 space-y-4 comment-list">
                    {comments.length > 0 ? (
                        comments.map(comment => (
                            <div key={comment.id} className="flex items-start gap-3">
                                <img src={comment.user.avatarUrl} alt={comment.user.username} className="w-10 h-10 rounded-full flex-shrink-0" />
                                <div className="flex-grow">
                                    <p className="text-sm font-bold opacity-70">@{comment.user.username} <span className="font-normal opacity-80">· {timeSince(comment.timestamp)}</span></p>
                                    <p className="font-medium">{comment.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                            <h3 className="text-xl font-bold">No comments yet</h3>
                            <p>Be the first one to comment!</p>
                        </div>
                    )}
                </main>

                <footer className="flex-shrink-0 p-3 border-t-2 border-[var(--border-color)]">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        <img src={currentUser.avatarUrl} alt="Your avatar" className="w-10 h-10 rounded-full" />
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-full py-2 px-4 text-[var(--text-color)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] font-medium transition-colors"
                        />
                        <button type="submit" disabled={!newComment.trim()} className="p-2 rounded-full bg-[var(--accent-color)] text-white disabled:bg-gray-400 transition-colors">
                            <ShareIcon className="w-6 h-6" />
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default CommentsModal;