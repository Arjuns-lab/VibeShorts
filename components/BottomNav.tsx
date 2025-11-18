import React from 'react';
import { HomeIcon, SearchIcon, PlusIcon, BellIcon, UserIcon } from '../constants';
import { Page } from '../App';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onOpenCreateModal: () => void;
  hasUnreadNotifications: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate, onOpenCreateModal, hasUnreadNotifications }) => {
  const navItemClass = "flex flex-col items-center justify-center w-1/5 transition-transform duration-200 ease-in-out hover:scale-110";
  const activeClass = "text-[var(--accent-color)]";
  const inactiveClass = "text-[var(--text-color)] opacity-60";

  return (
    <footer className="absolute bottom-0 left-0 w-full bg-[var(--frame-bg-color)]/80 backdrop-blur-md z-20 border-t border-[var(--border-color)] transition-colors duration-300">
      <nav className="flex justify-around items-center h-16 font-display text-xs font-bold">
        <button 
            onClick={() => onNavigate('feed')}
            className={`${navItemClass} ${currentPage === 'feed' ? activeClass : inactiveClass}`}
            aria-label="Home feed"
        >
          <HomeIcon className="w-7 h-7" />
          <span>Home</span>
        </button>
        <button 
            onClick={() => onNavigate('discover')}
            className={`${navItemClass} ${currentPage === 'discover' ? activeClass : inactiveClass}`}
            aria-label="Discover"
        >
          <SearchIcon className="w-7 h-7" />
          <span>Discover</span>
        </button>
        <button 
            onClick={onOpenCreateModal}
            className="w-14 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[var(--accent-color)] to-[var(--secondary-color)] transition-transform hover:scale-105 upload-btn-animated"
            aria-label="Create new post"
        >
          <PlusIcon className="w-7 h-7 text-white" />
        </button>
        <button 
            onClick={() => onNavigate('notifications')}
            className={`${navItemClass} relative ${currentPage === 'notifications' ? activeClass : inactiveClass}`}
            aria-label="Notifications"
        >
          <BellIcon className="w-7 h-7" />
          {hasUnreadNotifications && (
            <span className="absolute top-1 right-[calc(50%-20px)] w-3 h-3 bg-[var(--secondary-color)] rounded-full border-2 border-[var(--frame-bg-color)]" />
          )}
          <span>Notifications</span>
        </button>
        <button 
            onClick={() => onNavigate('profile')}
            className={`${navItemClass} ${currentPage === 'profile' ? activeClass : inactiveClass}`}
            aria-label="Profile"
        >
          <UserIcon className="w-7 h-7" />
          <span>Profile</span>
        </button>
      </nav>
    </footer>
  );
};

export default BottomNav;