import React, { useState } from 'react';
import { UserIcon, LockIcon } from '../constants';

interface LoginProps {
    onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            setError('Please enter a username.');
            return;
        }
        setError('');
        onLogin(username);
    };

    return (
        <div className="h-full w-full relative bg-black text-[var(--text-color)] flex flex-col justify-center items-center p-8 transition-colors duration-300 font-display overflow-hidden">
            <video
                src="https://videos.pexels.com/video-files/4786422/4786422-hd_1080_1920_25fps.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="login-video-bg"
            />
            <div className="absolute inset-0 bg-black/40 z-0"></div>
            
            <div className="relative z-10 w-full max-w-xs flex flex-col items-center">
                <div className="text-center mb-10 animate-fade-in-up" style={{ animationDelay: '100ms', opacity: 0 }}>
                    <h1 className="text-6xl font-brand bg-clip-text text-transparent bg-gradient-to-br from-[var(--accent-color)] to-[var(--secondary-color)]">
                        VibeShorts
                    </h1>
                    <p className="text-lg font-bold text-white/80 mt-2">Log in to continue</p>
                </div>
                
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                    <div className="relative animate-fade-in-up" style={{ animationDelay: '200ms', opacity: 0 }}>
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            className="w-full bg-black/40 border-2 border-white/20 rounded-xl py-3 pl-10 pr-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] font-medium text-base login-input"
                            aria-label="Username"
                        />
                    </div>
                    <div className="relative animate-fade-in-up" style={{ animationDelay: '300ms', opacity: 0 }}>
                        <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full bg-black/40 border-2 border-white/20 rounded-xl py-3 pl-10 pr-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] font-medium text-base login-input"
                            aria-label="Password"
                        />
                    </div>
                    
                    {error && <p className="text-red-400 text-sm text-center font-semibold">{error}</p>}
                    
                    <button 
                        type="submit"
                        className="w-full py-3 mt-4 text-lg font-bold text-white bg-gradient-to-br from-[var(--accent-color)] to-[var(--secondary-color)] rounded-xl transition-transform hover:scale-105 shadow-lg interactive-glow-light animate-fade-in-up"
                        style={{ animationDelay: '400ms', opacity: 0 }}
                    >
                        Log In
                    </button>
                </form>

                <div className="text-center mt-8 text-sm font-semibold text-white/70 animate-fade-in-up" style={{ animationDelay: '500ms', opacity: 0 }}>
                    <a href="#" className="hover:text-white transition-colors">Forgot Password?</a>
                    <p className="mt-4">
                        Don't have an account? <a href="#" className="font-bold text-[var(--accent-color)] hover:underline">Sign Up</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;