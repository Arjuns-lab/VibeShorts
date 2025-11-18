
import React, { useEffect } from 'react';

interface WelcomeProps {
    onFinished: () => void;
}

const WELCOME_SCREEN_DURATION = 5000; // 5 seconds

const Welcome: React.FC<WelcomeProps> = ({ onFinished }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onFinished();
        }, WELCOME_SCREEN_DURATION);

        return () => clearTimeout(timer);
    }, [onFinished]);

    return (
        <div className="h-full w-full relative bg-black flex flex-col justify-center items-center text-white overflow-hidden">
            <video
                src="https://videos.pexels.com/video-files/7650428/7650428-hd_1080_1920_25fps.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover z-0"
            />
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <div className="z-20 text-center animate-pulse">
                <h1 className="text-5xl font-brand bg-clip-text text-transparent bg-gradient-to-br from-[var(--accent-color)] to-[var(--secondary-color)]">
                    VibeShorts
                </h1>
                <p className="text-xl font-bold font-display opacity-80 mt-4">
                    Curating your vibe...
                </p>
            </div>
        </div>
    );
};

export default Welcome;