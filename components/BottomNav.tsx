
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
  const inactiveClass = "text-[var(--text-color)] opacity-70";

  const NavButton: React.FC<{ page: Page; label: string; icon: React.FC<any> }> = ({ page, label, icon: Icon }) => {
    const isActive = currentPage === page;
    return (
      <button 
          onClick={() => onNavigate(page)}
          className={`${navItemClass} ${isActive ? activeClass : inactiveClass}`}
          aria-label={label}
      >
        <Icon className="w-8 h-8" filled={isActive} />
        <span className={`text-xs font-bold ${isActive ? 'font-black' : ''}`}>{label}</span>
      </button>
    );
  };

  return (
    <footer 
        className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[var(--frame-bg-color)] to-[var(--frame-bg-color)]/70 backdrop-blur-lg z-20"
        style={{ WebkitBackdropFilter: 'blur(16px)' }}
    >
      <nav className="flex justify-around items-center h-16 font-display">
        <NavButton page="feed" label="Home" icon={HomeIcon} />
        <NavButton page="discover" label="Discover" icon={SearchIcon} />

        <button 
            onClick={onOpenCreateModal}
            className="w-16 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[var(--accent-color)] to-[var(--secondary-color)] transition-transform hover:scale-105"
            style={{
                boxShadow: `0 0 20px 0px var(--glow-shadow-color), 0 0 10px 0px var(--glow-shadow-color)`
            }}
            aria-label="Create new post"
        >
          <PlusIcon className="w-8 h-8 text-white" />
        </button>
        
        <div className={`${navItemClass} ${currentPage === 'notifications' ? activeClass : inactiveClass}`}>
            <button onClick={() => onNavigate('notifications')} className="relative flex flex-col items-center justify-center w-full h-full" aria-label="Notifications">
                <BellIcon className="w-8 h-8" filled={currentPage === 'notifications'} />
                {hasUnreadNotifications && ! (currentPage === 'notifications') && (
                    <span className="absolute top-1 right-[calc(50%-22px)] w-3 h-3 bg-[var(--secondary-color)] rounded-full border-2 border-[var(--frame-bg-color)]" />
                )}
                <span className={`text-xs font-bold ${currentPage === 'notifications' ? 'font-black' : ''}`}>Notifications</span>
            </button>
        </div>
        
        <NavButton page="profile" label="Profile" icon={UserIcon} />
      </nav>
    </footer>
  );
};

export default BottomNav;