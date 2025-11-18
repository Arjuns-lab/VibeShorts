
import React, { useState, useEffect } from 'react';
import { AutoscrollIcon, SignalIcon, TrashIcon, HistoryIcon, ChevronRightIcon, PencilIcon, KeyIcon, SunIcon, MoonIcon, UserIcon } from '../constants';
import { User } from '../types';

interface SettingsProps {
    theme: string;
    setTheme: (theme: 'light' | 'dark') => void;
    isDataSaverEnabled: boolean;
    onDataSaverToggle: (enabled: boolean) => void;
    isAutoScrollEnabled: boolean;
    onAutoScrollToggle: (enabled: boolean) => void;
    onClearHistory: () => void;
    onLogout: () => void;
    onClose: () => void;
    currentUser: User;
    onUpdateBio: (newBio: string) => void;
}

const Section: React.FC<{ title: string; icon: React.FC<any>; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-[var(--bg-color)] rounded-2xl p-4">
        <h3 className="text-sm font-bold opacity-60 flex items-center gap-2 mb-3">
            <Icon className="w-5 h-5" />
            <span>{title}</span>
        </h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const SettingRow: React.FC<{ label: string; description?: string; control: React.ReactNode }> = ({ label, description, control }) => (
    <div className="flex items-center justify-between">
        <div>
            <p className="font-bold text-[var(--text-color)]">{label}</p>
            {description && <p className="text-xs opacity-60">{description}</p>}
        </div>
        {control}
    </div>
);

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
    <label className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle-slider"></span>
    </label>
);

const Settings: React.FC<SettingsProps> = ({ theme, setTheme, isDataSaverEnabled, onDataSaverToggle, isAutoScrollEnabled, onAutoScrollToggle, onClearHistory, onLogout, onClose, currentUser, onUpdateBio }) => {
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [tempBio, setTempBio] = useState(currentUser.bio);
    const [showBioUpdateToast, setShowBioUpdateToast] = useState(false);

    useEffect(() => {
        setTempBio(currentUser.bio);
    }, [currentUser.bio]);

    const handleSaveBio = () => {
        onUpdateBio(tempBio);
        setIsEditingBio(false);
        setShowBioUpdateToast(true);
        setTimeout(() => setShowBioUpdateToast(false), 2000);
    };

    const handleCancelBioEdit = () => {
        setTempBio(currentUser.bio);
        setIsEditingBio(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center" onClick={onClose}>
            <div
                className="bg-[var(--frame-bg-color)] text-[var(--text-color)] w-full max-w-sm h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-xl border-4 border-[var(--border-color)] flex flex-col font-display animate-slide-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-4 flex justify-between items-center border-b-2 border-[var(--border-color)]">
                    <h2 className="text-3xl font-black">Settings</h2>
                    <button onClick={onClose} className="text-2xl font-bold opacity-60 hover:opacity-100">&times;</button>
                </header>

                <main className="flex-grow overflow-y-auto p-4 space-y-4">
                    <Section title="Account" icon={UserIcon}>
                        {isEditingBio ? (
                            <div>
                                <textarea
                                    value={tempBio}
                                    onChange={(e) => setTempBio(e.target.value)}
                                    className="w-full bg-[var(--frame-bg-color)] border-2 border-[var(--border-color)] rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                                    rows={3}
                                    maxLength={150}
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={handleCancelBioEdit} className="px-3 py-1 font-bold rounded-md hover:bg-[var(--text-color)]/10">Cancel</button>
                                    <button onClick={handleSaveBio} className="px-3 py-1 font-bold rounded-md bg-[var(--accent-color)] text-white">Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start">
                                <p className="opacity-80 flex-grow pr-2">{currentUser.bio}</p>
                                <button onClick={() => setIsEditingBio(true)} className="p-1 rounded-full hover:bg-[var(--text-color)]/10 flex-shrink-0">
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        <SettingRow
                            label="Change Password"
                            control={<button className="p-1 rounded-full hover:bg-[var(--text-color)]/10"><ChevronRightIcon className="w-6 h-6" /></button>}
                        />
                    </Section>

                    <Section title="Appearance" icon={theme === 'dark' ? MoonIcon : SunIcon}>
                        <SettingRow
                            label="Dark Mode"
                            control={<ToggleSwitch checked={theme === 'dark'} onChange={(checked) => setTheme(checked ? 'dark' : 'light')} />}
                        />
                    </Section>
                    
                    <Section title="Playback & Data" icon={SignalIcon}>
                         <SettingRow
                            label="Data Saver"
                            description="Reduces video quality to save data"
                            control={<ToggleSwitch checked={isDataSaverEnabled} onChange={onDataSaverToggle} />}
                        />
                        <SettingRow
                            label="Auto-Scroll"
                            description="Automatically scrolls to the next video"
                            control={<ToggleSwitch checked={isAutoScrollEnabled} onChange={onAutoScrollToggle} />}
                        />
                    </Section>
                    
                     <Section title="Data Management" icon={HistoryIcon}>
                         <SettingRow
                            label="Clear Watch History"
                            description="This cannot be undone"
                            control={
                                <button onClick={onClearHistory} className="p-2 rounded-full hover:bg-red-500/10 text-red-500">
                                    <TrashIcon className="w-6 h-6" />
                                </button>
                            }
                        />
                    </Section>
                    
                    <button onClick={onLogout} className="w-full py-3 mt-2 text-lg font-bold text-red-500 bg-red-500/10 rounded-xl transition-colors hover:bg-red-500/20">
                        Log Out
                    </button>
                </main>
                {showBioUpdateToast && (
                     <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-white font-bold py-2 px-4 rounded-full shadow-lg animate-fade-in-out">
                        Bio updated!
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;