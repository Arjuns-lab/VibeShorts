import React from 'react';
import { Notification } from '../types';

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

interface NotificationsProps {
    notifications: Notification[];
    onMarkAsRead: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, onMarkAsRead }) => {
    
    const getNotificationMessage = (notification: Notification) => {
        const username = <span className="font-bold">@{notification.user.username}</span>;
        switch(notification.type) {
            case 'like':
                return <p>{username} liked your post.</p>;
            case 'comment':
                return <p>{username} commented: <span className="italic">"{notification.commentText}"</span></p>;
            case 'follow':
                return <p>{username} started following you.</p>;
            default:
                return null;
        }
    };

    const hasUnread = notifications.some(n => !n.isRead);

    return (
        <div className="h-full w-full bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col transition-colors duration-300 font-display">
            <header className="flex-shrink-0 p-4 flex justify-between items-center border-b-2 border-[var(--border-color)]">
                <div className="w-20"></div> {/* Spacer */}
                <h1 className="text-2xl font-black text-center">Notifications</h1>
                <button 
                    onClick={onMarkAsRead} 
                    disabled={!hasUnread}
                    className="text-sm font-bold text-[var(--accent-color)] hover:underline flex-shrink-0 w-20 text-right disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                >
                    Mark all read
                </button>
            </header>
            <main className="flex-grow overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-color)] p-8">
                        <div className="w-24 h-24 flex items-center justify-center bg-[var(--frame-bg-color)] rounded-full mb-6">
                           <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-[var(--text-color)] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        </div>
                        <h2 className="text-2xl font-black">You're All Caught Up</h2>
                        <p className="mt-2 max-w-xs opacity-70">
                            New likes, comments, and followers will appear here.
                        </p>
                    </div>
                ) : (
                    <div>
                        {notifications.map(notification => (
                            <div key={notification.id} className={`flex items-start gap-4 p-4 border-b border-[var(--border-color)] transition-colors ${!notification.isRead ? 'bg-[var(--accent-color)]/5' : ''}`}>
                                <img src={notification.user.avatarUrl} alt={notification.user.username} className="w-12 h-12 rounded-full flex-shrink-0" />
                                <div className="flex-grow">
                                    <div className="text-base font-medium">{getNotificationMessage(notification)}</div>
                                    <p className="text-xs opacity-70 mt-1">{timeSince(notification.timestamp)} ago</p>
                                </div>
                                {notification.post && (
                                    <img src={notification.post.posterUrl} alt="post thumbnail" className="w-14 h-14 object-cover rounded-md flex-shrink-0" />
                                )}
                                {!notification.isRead && (
                                    <div className="w-3 h-3 bg-[var(--secondary-color)] rounded-full self-center flex-shrink-0 ml-2"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Notifications;
