import React from 'react';
import { UploadCloudIcon, SignalIcon } from '../constants';

interface CreateModalProps {
    onClose: () => void;
    onNavigate: (page: 'upload' | 'live') => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ onClose, onNavigate }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end"
            onClick={onClose}
        >
            <div
                className="bg-[var(--frame-bg-color)] w-full max-w-sm rounded-t-3xl p-6 text-center animate-slide-in-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-4"></div>
                <h2 className="text-2xl font-black font-display mb-6">Create</h2>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onNavigate('upload')}
                        className="flex flex-col items-center justify-center gap-2 p-6 bg-[var(--bg-color)] rounded-2xl hover:bg-[var(--border-color)] transition-colors aspect-square"
                    >
                        <UploadCloudIcon className="w-12 h-12 text-[var(--accent-color)]" />
                        <span className="text-lg font-bold font-display">Upload Video</span>
                    </button>
                    <button 
                        onClick={() => onNavigate('live')}
                        className="flex flex-col items-center justify-center gap-2 p-6 bg-[var(--bg-color)] rounded-2xl hover:bg-[var(--border-color)] transition-colors aspect-square"
                    >
                        <SignalIcon className="w-12 h-12 text-[var(--secondary-color)]" />
                        <span className="text-lg font-bold font-display">Go Live</span>
                    </button>
                </div>
                <button onClick={onClose} className="w-full mt-6 py-3 text-lg font-bold text-center border-2 border-[var(--border-color)] rounded-xl hover:bg-[var(--text-color)]/5 transition-colors">
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default CreateModal;