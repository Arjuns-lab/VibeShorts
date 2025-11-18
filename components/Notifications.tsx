import React, { useEffect } from 'react';
import { Notification } from '../types';
import { HeartIcon, CommentIcon, UserIcon, BellIcon } from '../constants';

interface NotificationsProps {
    notifications: Notification[];
    onMarkAsRead: () => void;
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

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
    const getIcon = () => {
        switch (notification.type) {
            case 'like': return <HeartIcon className="w-6 h-6 text-red-500" filled />;
            case 'comment': return <CommentIcon className="w-6 h-6 text-blue-500" />;
            case 'follow': return <UserIcon className="w-6 h-6 text-green-500" />;
            default: return null;
        }
    };

    const getText = () => {
        const username = <span className="font-bold">@{notification.user.username}</span>;
        switch (notification.type) {
            case 'like': return <>{username} liked your video.</>;
            case 'comment': return <>{username} commented: "{notification.commentText}"</>;
            case 'follow': return <>{username} started following you.</>;
            default: return null;
        }
    };

    return (
        <div className={`flex items-start gap-4 p-3 rounded-2xl transition-colors duration-300 ${!notification.isRead ? 'bg-[var(--accent-color)]/10' : 'bg-transparent'}`}>
            <div className="relative flex-shrink-0">
                <img src={notification.user.avatarUrl} alt={notification.user.username} className="w-12 h-12 rounded-full" />
                <div className="absolute -bottom-1 -right-1 bg-[var(--frame-bg-color)] p-0.5 rounded-full">{getIcon()}</div>
            </div>
            <div className="flex-grow">
                <p className="text-[var(--text-color)] text-base">{getText()}</p>
                <p className="text-sm opacity-60 mt-0.5">{timeSince(notification.timestamp)} ago</p>
            </div>
            {notification.post && (
                 <img src={notification.post.posterUrl} alt="post thumbnail" className="w-12 h-16 object-cover rounded-md flex-shrink-0" />
            )}
        </div>
    );
};


const Notifications: React.FC<NotificationsProps> = ({ notifications, onMarkAsRead }) => {
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onMarkAsRead();
        }, 1000); // Mark as read after 1 second of viewing
        return () => clearTimeout(timer);
    }, [onMarkAsRead]);

    return (
        <div className="h-full w-full bg-[var(--frame-bg-color)] text-[var(--text-color)] flex flex-col transition-colors duration-300">
            <header className="flex-shrink-0 p-4 border-b-2 border-[var(--border-color)] transition-colors duration-300">
                <h1 className="text-2xl font-black font-display text-center">Notifications</h1>
            </header>
            <main className="flex-grow overflow-y-auto p-2">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-color)] p-8">
                        <div className="w-24 h-24 flex items-center justify-center bg-[var(--bg-color)] rounded-full mb-6">
                            <BellIcon className="w-12 h-12 text-[var(--text-color)] opacity-40" />
                        </div>
                        <h2 className="text-2xl font-black font-display">All Caught Up!</h2>
                        <p className="mt-2 max-w-xs opacity-70">
                            You don't have any new notifications right now.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map(n => <NotificationItem key={n.id} notification={n} />)}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Notifications;