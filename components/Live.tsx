
import React, { useState, useRef, useEffect } from 'react';

interface LiveProps {
  onCancel: () => void;
}

const Live: React.FC<LiveProps> = ({ onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera not supported in this browser.");
        return;
    }

    try {
      // 1. Preferred: Video + Audio
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.warn("Initial camera request failed, trying fallback (video only)...", err);
      try {
          // 2. Fallback: Video only
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setError(null);
      } catch (err2) {
          console.error("Error accessing media devices.", err2);
          setError("Could not access camera. Please check permissions.");
      }
    }
  };
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleGoLive = () => setIsLive(true);
  const handleEndLive = () => {
    setIsLive(false);
    onCancel(); // Go back after ending stream
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col relative">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
      
      <header className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20">
        <button onClick={onCancel} className="text-lg px-3 py-1 rounded-full transition-colors font-display bg-black/30 hover:bg-black/60">
          Back
        </button>
        {isLive && (
          <div className="flex items-center gap-4">
            <span className="bg-red-500 text-white font-bold text-sm px-3 py-1 rounded-md animate-pulse">LIVE</span>
            <div className="bg-black/30 px-3 py-1 rounded-md text-sm font-semibold">
              👀 {Math.floor(Math.random() * 50 + 10)} 
            </div>
          </div>
        )}
      </header>

      <main className="absolute inset-0 z-20 flex flex-col justify-end p-4">
        {error && (
          <div className="bg-red-500/80 p-4 rounded-xl text-center mb-4">
            <h3 className="font-bold">Permissions Error</h3>
            <p className="text-sm">{error}</p>
             <button onClick={startCamera} className="mt-2 font-bold underline">Try Again</button>
          </div>
        )}
        
        {stream && !isLive && (
            <button onClick={handleGoLive} className="w-full py-3 text-lg font-bold text-white bg-red-600 rounded-xl transition-transform hover:scale-105 shadow-lg">
                Go Live
            </button>
        )}
        {isLive && (
             <button onClick={handleEndLive} className="w-full py-3 text-lg font-bold text-white bg-gray-700 rounded-xl transition-transform hover:scale-105 shadow-lg">
                End Stream
            </button>
        )}
      </main>
    </div>
  );
};

export default Live;
