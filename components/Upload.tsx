import React, { useState, useRef, ChangeEvent, useEffect, useCallback, useMemo } from 'react';
import { UploadCloudIcon, TextIcon, TrashIcon, UndoIcon, RedoIcon, CameraIcon } from '../constants';
import { TextOverlay } from '../types';

interface UploadProps {
  onPost: (data: { videoFile: File; caption: string; hashtags: string[]; textOverlays: TextOverlay[], filterClass: string; startTime: number; endTime: number; videoQuality: 'SD' | 'HD' | '4K'; }) => void;
  onCancel: () => void;
}

type EditorState = {
  textOverlays: TextOverlay[];
  startTime: number;
  endTime: number;
};

const FILTERS = [
  { name: 'None', class: '' },
  { name: 'Classic', class: 'grayscale' },
  { name: 'Sunset', class: 'sepia' },
  { name: 'Techno', class: 'invert' },
  { name: 'Vivid', class: 'saturate-200 contrast-125' },
  { name: 'Muted', class: 'saturate-50 contrast-75 brightness-125' },
];

const QUALITY_OPTIONS = [
  { label: 'SD (480p)', value: 'SD' as const, note: 'Faster upload' },
  { label: 'HD (720p)', value: 'HD' as const, note: 'Good balance' },
  { label: '4K (2160p)', value: '4K' as const, note: 'Best quality' },
];


const Upload: React.FC<UploadProps> = ({ onPost, onCancel }) => {
  const [step, setStep] = useState<'select' | 'edit' | 'post' | 'record'>('select');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0].class);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isTrimming, setIsTrimming] = useState<'start' | 'end' | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('Preparing your vibe...');
  const [videoQuality, setVideoQuality] = useState<'SD' | 'HD' | '4K'>('HD');
  const [draftExists, setDraftExists] = useState(false);
  const [showDraftToast, setShowDraftToast] = useState(false);

  // Recording State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'finished'>('idle');
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  // Text overlay state
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
   const [editingOverlayInitialState, setEditingOverlayInitialState] = useState<TextOverlay | null>(null);
  const [draggingOverlay, setDraggingOverlay] = useState<{
    id: string;
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  // Undo/Redo state
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trimBarRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const uploadIntervalRef = useRef<number | null>(null);

  const selectedOverlay = useMemo(() => {
    return textOverlays.find(o => o.id === selectedOverlayId);
  }, [textOverlays, selectedOverlayId]);
  
  const recordHistory = useCallback((newState: EditorState) => {
      const newHistory = history.slice(0, historyIndex + 1);
      // Avoid pushing duplicate states
      if (JSON.stringify(newHistory[newHistory.length - 1]) === JSON.stringify(newState)) {
          return;
      }
      newHistory.push(newState);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);
  
  const applyHistoryState = (state: EditorState) => {
    if (!state) return;
    setTextOverlays(state.textOverlays);
    setStartTime(state.startTime);
    setEndTime(state.endTime);
    if (videoRef.current) {
      videoRef.current.currentTime = state.startTime;
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      applyHistoryState(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      applyHistoryState(history[newIndex]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      handleNewVideo(file);
    } else {
      alert('Please select a valid video file.');
    }
  };
  
  const handleNewVideo = (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStep('edit');
  };

  const handleVideoMetadata = () => {
    if (videoRef.current) {
        const videoDuration = videoRef.current.duration;
        setDuration(videoDuration);
        
        const savedDraft = localStorage.getItem('vibeShortsDraft');
        const hasLoadedDraft = fileInputRef.current?.dataset.loadDraft === 'true';

        if (hasLoadedDraft && savedDraft) {
            const draftData = JSON.parse(savedDraft);
            setCaption(draftData.caption || '');
            setSelectedFilter(draftData.filterClass || FILTERS[0].class);
            setTextOverlays(draftData.textOverlays || []);
            
            const loadedStartTime = draftData.startTime ?? 0;
            const loadedEndTime = draftData.endTime ?? videoDuration;
            
            setStartTime(loadedStartTime);
            setEndTime(loadedEndTime);
            
            const historyState = {
              startTime: loadedStartTime,
              endTime: loadedEndTime,
              textOverlays: draftData.textOverlays || [],
            };
            setHistory([historyState]);
            setHistoryIndex(0);
            if (fileInputRef.current) fileInputRef.current.dataset.loadDraft = 'false';
        } else {
            const initialEndTime = videoDuration;
            setEndTime(initialEndTime);

            const initialState: EditorState = {
              textOverlays: [],
              startTime: 0,
              endTime: initialEndTime,
            };
            setHistory([initialState]);
            setHistoryIndex(0);
        }
    }
  };
  
  const handleCancelUpload = () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handlePost = () => {
    if (!videoFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatusText('Preparing your vibe...');
    
    const hashtags = caption.match(/#\w+/g) || [];

    uploadIntervalRef.current = window.setInterval(() => {
        setUploadProgress(prev => {
            const increment = prev < 70 ? (Math.random() * 5 + 5) : (Math.random() * 2 + 1);
            let newProgress = prev + increment;
            
            if (newProgress >= 100) {
                newProgress = 100;
                if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
                setUploadStatusText('Done! 🎉');
                
                setTimeout(() => {
                    onPost({ videoFile, caption, hashtags, textOverlays, filterClass: selectedFilter, startTime, endTime, videoQuality });
                    clearDraft();
                }, 800);

            } else if (newProgress > 85) {
                setUploadStatusText('Almost there...');
            } else if (newProgress > 50) {
                setUploadStatusText('Uploading securely...');
            }
            
            return Math.min(newProgress, 100);
        });
    }, 150);
};
  
  const handleBackToSelect = () => {
    setVideoFile(null);
    setPreviewUrl(null);
    setSelectedFilter(FILTERS[0].class);
    setCaption('');
    setStartTime(0);
    setEndTime(0);
    setDuration(0);
    setTextOverlays([]);
    setSelectedOverlayId(null);
    setHistory([]);
    setHistoryIndex(-1);
    if(fileInputRef.current) fileInputRef.current.value = "";
    setStep('select');
  };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const startCamera = async () => {
        stopCamera();
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setCameraError(null);
        } catch (err) {
            console.error("Error accessing media devices.", err);
            setCameraError("Could not access camera/microphone. Please check permissions and try again.");
        }
    };
    
    useEffect(() => {
        if (step === 'record') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);


  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
      if(recordingTimerRef.current){
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (recordingStatus === 'finished' && recordedChunks.length > 0) {
        const mimeType = mediaRecorder?.mimeType || 'video/webm';
        const blob = new Blob(recordedChunks, { type: mimeType });
        const file = new File([blob], `recording-${Date.now()}.${mimeType.split('/')[1]}`, { type: mimeType });
        
        handleNewVideo(file);
        
        // Reset recording state
        setRecordedChunks([]);
        setRecordingStatus('idle');
        setRecordingTime(0);
        setMediaRecorder(null);
    }
  }, [recordingStatus, recordedChunks, mediaRecorder]);
  
  // Trimming logic
  const handleTrimChange = useCallback((clientX: number) => {
    if (!trimBarRef.current || !duration || !isTrimming) return;

    const bar = trimBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - bar.left) / bar.width));
    const time = percent * duration;
    
    if (isTrimming === 'start') {
        if (time < endTime - 0.5) { // Ensure start is before end with a small buffer
            setStartTime(time);
            if (videoRef.current) videoRef.current.currentTime = time;
        }
    } else if (isTrimming === 'end') {
        if (time > startTime + 0.5) { // Ensure end is after start
            setEndTime(time);
            if (videoRef.current) videoRef.current.currentTime = time;
        }
    }
  }, [duration, endTime, startTime, isTrimming]);

  const handleMouseMove = useCallback((e: MouseEvent) => { handleTrimChange(e.clientX); }, [handleTrimChange]);
  const handleTouchMove = useCallback((e: TouchEvent) => { handleTrimChange(e.touches[0].clientX); }, [handleTrimChange]);
  const handleMouseUp = useCallback(() => {
      if (isTrimming) {
          recordHistory({ textOverlays, startTime, endTime });
      }
      setIsTrimming(null);
  }, [isTrimming, recordHistory, textOverlays, startTime, endTime]);

  useEffect(() => {
    if (isTrimming) {
        window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleTouchMove); window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove); window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isTrimming, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Video playback loop within trim range
  useEffect(() => {
    const video = videoRef.current;
    if (!video || step === 'record') return;

    const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        if (video.currentTime >= endTime) {
            video.currentTime = startTime;
            video.play();
        }
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [startTime, endTime, step]);
  
  // Recording functions
  const handleStartRecording = () => {
    if (!stream) return;
    setRecordedChunks([]);
    setRecordingTime(0);
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);

    recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            setRecordedChunks(prev => [...prev, event.data]);
        }
    };

    recorder.onstop = () => {
        setRecordingStatus('finished');
    };

    recorder.start();
    setRecordingStatus('recording');
    
    recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
        mediaRecorder.stop();
    }
    if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
    }
    setRecordingStatus('idle'); // onstop will trigger 'finished'
  };

  // Text Overlay Functions
  const handleAddText = () => {
    const newOverlay: TextOverlay = {
      id: `text-${Date.now()}`,
      text: 'Sample Text',
      color: '#FFFFFF',
      fontSize: 28,
      fontFamily: 'Nunito',
      position: { x: 50, y: 50 },
      startTime: currentTime,
      endTime: Math.min(currentTime + 3, endTime),
      backgroundStyle: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0.5,
    };
    const newOverlays = [...textOverlays, newOverlay];
    setTextOverlays(newOverlays);
    handleSelectOverlay(newOverlay.id);
    recordHistory({ textOverlays: newOverlays, startTime, endTime });
  };
  
  const handleSelectOverlay = (id: string | null) => {
    // If we're de-selecting, revert changes of the currently selected overlay
    if (selectedOverlayId && editingOverlayInitialState && id !== selectedOverlayId) {
        setTextOverlays(prev => prev.map(o => o.id === selectedOverlayId ? editingOverlayInitialState : o));
    }

    if (id) {
        const overlay = textOverlays.find(o => o.id === id);
        if (overlay) {
            setEditingOverlayInitialState(overlay);
            setSelectedOverlayId(id);
        }
    } else { // This is a full de-select/cancel
        if (selectedOverlayId && editingOverlayInitialState) {
            setTextOverlays(prev => prev.map(o => o.id === selectedOverlayId ? editingOverlayInitialState : o));
        }
        setSelectedOverlayId(null);
        setEditingOverlayInitialState(null);
    }
};
  
  const handleUpdateSelectedOverlay = (updates: Partial<TextOverlay>) => {
    if (!selectedOverlayId) return;
    setTextOverlays(prev => prev.map(o => o.id === selectedOverlayId ? {...o, ...updates} : o));
  };

  const handleDoneEditingText = () => {
    recordHistory({ textOverlays, startTime, endTime });
    setSelectedOverlayId(null);
    setEditingOverlayInitialState(null);
  };
  
  const handleDeleteOverlay = (id: string) => {
    const newOverlays = textOverlays.filter(o => o.id !== id);
    setTextOverlays(newOverlays);
    setSelectedOverlayId(null);
    setEditingOverlayInitialState(null);
    recordHistory({ textOverlays: newOverlays, startTime, endTime });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    e.stopPropagation();
    handleSelectOverlay(id);
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const overlay = textOverlays.find(o => o.id === id);
    if (!overlay) return;

    setDraggingOverlay({
        id,
        startX: e.clientX,
        startY: e.clientY,
        startPosX: overlay.position.x,
        startPosY: overlay.position.y,
    });
  };
  
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingOverlay || !videoContainerRef.current) return;
    e.stopPropagation();
    const containerRect = videoContainerRef.current.getBoundingClientRect();
    
    const deltaX_px = e.clientX - draggingOverlay.startX;
    const deltaY_px = e.clientY - draggingOverlay.startY;
    
    const deltaX_pct = (deltaX_px / containerRect.width) * 100;
    const deltaY_pct = (deltaY_px / containerRect.height) * 100;

    const newPosX = draggingOverlay.startPosX + deltaX_pct;
    const newPosY = draggingOverlay.startPosY + deltaY_pct;

    handleUpdateSelectedOverlay({ 
        position: {
            x: Math.max(0, Math.min(100, newPosX)),
            y: Math.max(0, Math.min(100, newPosY))
        }
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (draggingOverlay) {
        recordHistory({ textOverlays, startTime, endTime });
    }
    setDraggingOverlay(null);
  };

  // Draft functions
  const saveDraft = () => {
    if (window.confirm("Do you want to save your current progress as a draft? This will overwrite any existing draft.")) {
      if (!videoFile) return;
      const draft = {
          caption,
          filterClass: selectedFilter,
          startTime,
          endTime,
          textOverlays,
      };
      localStorage.setItem('vibeShortsDraft', JSON.stringify(draft));
      // In a real app, you'd save the video file using IndexedDB or similar.
      // For this simulation, we'll just save the metadata.
      setShowDraftToast(true);
      setTimeout(() => setShowDraftToast(false), 2000);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('vibeShortsDraft');
    setDraftExists(false);
  };
  
  useEffect(() => {
    setDraftExists(!!localStorage.getItem('vibeShortsDraft'));
  }, [step]);


  const renderHeader = () => {
    const baseButtonClass = "text-lg px-3 py-1 rounded-full transition-colors font-display";
    const primaryButtonClass = `${baseButtonClass} font-bold text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10`;
    const secondaryButtonClass = `${baseButtonClass} hover:bg-[var(--text-color)]/10 font-semibold`;
    
    switch (step) {
      case 'record':
        return (
          <>
            <div className="flex justify-start">
              <button onClick={() => setStep('select')} className={secondaryButtonClass}>Back</button>
            </div>
            <h1 className="text-2xl font-black font-display text-center col-start-2">Record Video</h1>
            <div /> {/* Placeholder for alignment */}
          </>
        );
      case 'edit':
        return (
          <>
            <div className="flex justify-start items-center gap-2">
              <button onClick={handleBackToSelect} className={secondaryButtonClass}>Back</button>
              <button onClick={saveDraft} className={`${secondaryButtonClass} text-sm`}>Save Draft</button>
            </div>
            <div className="flex justify-center items-center gap-4">
               <button onClick={handleUndo} disabled={historyIndex <= 0} className="disabled:opacity-30 p-1 rounded-full hover:bg-[var(--text-color)]/10" aria-label="Undo">
                    <UndoIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-black font-display">Editor</h1>
                <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="disabled:opacity-30 p-1 rounded-full hover:bg-[var(--text-color)]/10" aria-label="Redo">
                    <RedoIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="flex justify-end">
                <button onClick={() => setStep('post')} className={primaryButtonClass}>Next</button>
            </div>
          </>
        );
      case 'post':
        return (
          <>
            <div className="flex justify-start">
              <button onClick={() => setStep('edit')} className={secondaryButtonClass}>Back</button>
            </div>
            <h1 className="text-2xl font-black font-display text-center col-start-2">New Post</h1>
            <div className="flex justify-end">
                <button onClick={handlePost} disabled={!videoFile || isUploading} className={`${primaryButtonClass} disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed`}>Post</button>
            </div>
          </>
        );
      case 'select':
      default:
        return (
          <>
            <div className="flex justify-start">
              <button onClick={onCancel} className={secondaryButtonClass}>Cancel</button>
            </div>
            <h1 className="text-2xl font-black font-display text-center col-start-2">New Post</h1>
            <div /> {/* Placeholder for alignment */}
          </>
        );
    }
  };

  const renderContent = () => {
    if (step === 'select') {
      const handleLoadDraftClick = () => {
        if (fileInputRef.current) {
          fileInputRef.current.dataset.loadDraft = 'true';
          fileInputRef.current.click();
        }
      };
      
      const handleNewProjectClick = () => {
        clearDraft();
        if (fileInputRef.current) {
          fileInputRef.current.dataset.loadDraft = 'false';
          fileInputRef.current.click();
        }
      };
      
      return (
        <div className="w-full space-y-4">
            {draftExists && (
                <div className="bg-[var(--accent-color)]/10 p-4 rounded-2xl text-center">
                    <p className="font-bold text-lg">You have a saved draft!</p>
                    <p className="text-sm opacity-80 mb-3">Do you want to continue editing or start fresh?</p>
                    <div className="flex gap-2 justify-center">
                        <button onClick={handleLoadDraftClick} className="px-4 py-2 bg-[var(--accent-color)] text-white font-bold rounded-lg">Load Draft</button>
                        <button onClick={handleNewProjectClick} className="px-4 py-2 bg-[var(--border-color)] font-bold rounded-lg">New Project</button>
                    </div>
                </div>
            )}
             <div className="grid grid-cols-2 gap-4 w-full">
                <div 
                    className="h-48 bg-[var(--frame-bg-color)] rounded-3xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-color)] transition-colors hover:bg-[var(--accent-color)]/5"
                    onClick={handleNewProjectClick}
                    role="button" tabIndex={0} aria-label="Select video to upload"
                >
                    <div className="text-center text-[var(--text-color)] opacity-80 flex flex-col items-center">
                        <UploadCloudIcon className="w-12 h-12 mb-2" />
                        <p className="font-bold font-display text-xl">Upload Clip</p>
                    </div>
                </div>
                <div 
                    className="h-48 bg-[var(--frame-bg-color)] rounded-3xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden border-2 border-dashed border-[var(--border-color)] hover:border-[var(--secondary-color)] transition-colors hover:bg-[var(--secondary-color)]/5"
                    onClick={() => setStep('record')}
                    role="button" tabIndex={0} aria-label="Record a new video"
                >
                    <div className="text-center text-[var(--text-color)] opacity-80 flex flex-col items-center">
                        <CameraIcon className="w-12 h-12 mb-2" />
                        <p className="font-bold font-display text-xl">Record Video</p>
                    </div>
                </div>
            </div>
            <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" aria-hidden="true" />
        </div>
      );
    }
    
    if (step === 'record') {
        return (
            <div className="w-full flex flex-col items-center gap-4">
                <div className="w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden relative border-4 border-[var(--border-color)]">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                    {cameraError && (
                        <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 p-4 text-center">
                            <p className="text-red-400 font-semibold">{cameraError}</p>
                            <button onClick={startCamera} className="mt-4 px-4 py-2 bg-[var(--accent-color)] text-white font-bold rounded-lg">Try Again</button>
                        </div>
                    )}
                    {recordingStatus === 'recording' && (
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white font-bold text-sm px-3 py-1 rounded-md animate-pulse z-10">
                            REC
                            <span>{new Date(recordingTime * 1000).toISOString().substr(14, 5)}</span>
                        </div>
                    )}
                </div>
                <div className="w-full flex justify-center items-center p-4">
                    <button 
                        onClick={recordingStatus === 'recording' ? handleStopRecording : handleStartRecording} 
                        disabled={!stream || !!cameraError}
                        className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center disabled:opacity-50"
                        aria-label={recordingStatus === 'recording' ? 'Stop recording' : 'Start recording'}
                    >
                        <div className={`w-16 h-16 rounded-full bg-red-500 transition-all duration-200 ${recordingStatus === 'recording' ? 'rounded-lg w-10 h-10' : ''}`}></div>
                    </button>
                </div>
            </div>
        )
    }

    if (step === 'edit' || step === 'post') {
      const startPercent = duration ? (startTime / duration) * 100 : 0;
      const endPercent = duration ? (endTime / duration) * 100 : 100;

      return (
        <>
          <div 
            ref={videoContainerRef} 
            className="w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden relative border-4 border-[var(--border-color)]"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {previewUrl && (
              <video 
                ref={videoRef}
                src={previewUrl} muted loop autoPlay playsInline
                className={`w-full h-full object-cover transition-all duration-300 ${selectedFilter}`}
                onLoadedMetadata={handleVideoMetadata}
              />
            )}
            {textOverlays.map(overlay => {
              const isVisible = currentTime >= overlay.startTime && currentTime <= overlay.endTime;
              if (!isVisible) return null;

              const backgroundStyle: React.CSSProperties = {};
              if (overlay.backgroundStyle && overlay.backgroundStyle !== 'none') {
                  const rgbaColor = overlay.backgroundColor?.startsWith('#')
                    ? `${overlay.backgroundColor}${Math.round((overlay.backgroundOpacity ?? 0.5) * 255).toString(16).padStart(2, '0')}`
                    : `rgba(0,0,0,${overlay.backgroundOpacity ?? 0.5})`;

                  backgroundStyle.backgroundColor = rgbaColor;
                  
                  if (overlay.backgroundStyle === 'rectangle') backgroundStyle.borderRadius = '0.375rem';
                  if (overlay.backgroundStyle === 'pill') backgroundStyle.borderRadius = '9999px';
              }

              return (
                  <div key={overlay.id}
                      className={`absolute px-4 py-2 cursor-grab select-none whitespace-pre-wrap text-center ${selectedOverlayId === overlay.id ? 'border-2 border-dashed border-[var(--accent-color)]' : 'border-2 border-transparent'}`}
                      style={{
                          left: `${overlay.position.x}%`, top: `${overlay.position.y}%`,
                          transform: 'translate(-50%, -50%)',
                      }}
                      onPointerDown={(e) => handlePointerDown(e, overlay.id)}
                  >
                      {overlay.backgroundStyle && overlay.backgroundStyle !== 'none' && (
                          <div className="absolute inset-0 -z-10" style={{
                              backgroundColor: overlay.backgroundColor,
                              opacity: overlay.backgroundOpacity,
                              borderRadius: backgroundStyle.borderRadius
                          }}></div>
                      )}
                      <span style={{
                          color: overlay.color,
                          fontSize: `${overlay.fontSize}px`, fontFamily: overlay.fontFamily,
                          fontWeight: '900', textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                      }}>
                          {overlay.text}
                      </span>
                  </div>
              )
            })}
          </div>
          
          {step === 'edit' && (
            <div className="w-full space-y-4 font-display">
               <button onClick={handleAddText} className="w-full flex items-center justify-center gap-2 py-2.5 text-lg font-bold border-2 border-[var(--border-color)] text-[var(--text-color)] rounded-xl transition-colors hover:bg-[var(--text-color)]/10">
                    <TextIcon className="w-6 h-6" /> Add Text
                </button>
              <div>
                  <label className="font-bold text-lg">Filters</label>
                  <div className="filter-list flex items-center gap-2 overflow-x-auto pt-2 pb-1">
                      {FILTERS.map(filter => (
                          <div key={filter.name} onClick={() => setSelectedFilter(filter.class)} className="flex flex-col items-center gap-1 cursor-pointer">
                              <div className={`w-16 h-24 bg-[var(--bg-color)] rounded-xl overflow-hidden border-2 transition-all ${selectedFilter === filter.class ? 'border-[var(--accent-color)]' : 'border-transparent'}`}>
                                  {previewUrl && <video src={previewUrl} muted className={`w-full h-full object-cover ${filter.class}`} />}
                              </div>
                              <span className={`text-sm font-semibold ${selectedFilter === filter.class ? 'font-bold text-[var(--accent-color)]' : 'text-[var(--text-color)]'}`}>{filter.name}</span>
                          </div>
                      ))}
                  </div>
              </div>
              <div>
                 <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-lg">Trim</label>
                    <span className="text-sm font-bold text-[var(--secondary-color)]">
                        {(endTime - startTime).toFixed(1)}s
                    </span>
                 </div>
                 <div className="trim-bar" ref={trimBarRef}>
                    <div className="trim-track relative">
                        <div className="absolute h-full bg-[var(--accent-color)]/50 rounded-lg" style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }} />
                        <div className="absolute top-0 h-full w-1 bg-white/80 rounded-full" style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, transform: 'translateX(-50%)' }} />
                        <div className="trim-handle" style={{ left: `${startPercent}%`, transform: 'translate(-50%, -50%)' }} onMouseDown={() => setIsTrimming('start')} onTouchStart={() => setIsTrimming('start')} />
                        <div className="trim-handle" style={{ left: `${endPercent}%`, transform: 'translate(-50%, -50%)' }} onMouseDown={() => setIsTrimming('end')} onTouchStart={() => setIsTrimming('end')} />
                    </div>
                 </div>
              </div>
            </div>
          )}

          {step === 'post' && (
            <div className="flex flex-col gap-4 w-full font-display">
              <div>
                <label htmlFor="caption" className="font-bold text-lg">Caption</label>
                <textarea
                  id="caption" value={caption} onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe your video..."
                  className="w-full mt-1 bg-[var(--frame-bg-color)]/80 border-2 border-[var(--border-color)] rounded-2xl p-3 text-[var(--text-color)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] font-medium text-base transition-colors duration-300"
                  rows={3}
                />
              </div>
              <div>
                <label className="font-bold text-lg">Video Quality</label>
                <div className="flex gap-2 bg-[var(--bg-color)] p-1 rounded-xl mt-1">
                  {QUALITY_OPTIONS.map(option => (
                    <button 
                      key={option.value}
                      onClick={() => setVideoQuality(option.value)}
                      className={`w-full py-2 px-1 text-center font-bold rounded-lg transition-colors text-sm ${videoQuality === option.value ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--frame-bg-color)] hover:bg-[var(--border-color)]'}`}
                    >
                      {option.label}
                      <span className="block text-xs font-normal opacity-80">{option.note}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      );
    }
    return null; // Should not happen
  };
  
  const TextEditorPanel = () => {
    if (!selectedOverlay) return null;

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex justify-center items-end" onClick={() => handleSelectOverlay(null)}>
            <div className="bg-[var(--frame-bg-color)] w-full rounded-t-3xl p-4 flex flex-col gap-4 font-display max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-center">Edit Text</h3>
                <textarea
                    value={selectedOverlay.text}
                    onChange={(e) => handleUpdateSelectedOverlay({ text: e.target.value })}
                    className="w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-xl p-2 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                    rows={2}
                    style={{ fontFamily: selectedOverlay.fontFamily }}
                />
                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-sm">Font Family</label>
                    <div className="flex gap-2 bg-[var(--bg-color)] p-1 rounded-xl">
                        <button onClick={() => handleUpdateSelectedOverlay({ fontFamily: 'Nunito' })} className={`w-full py-2 font-bold rounded-lg transition-colors ${selectedOverlay.fontFamily === 'Nunito' ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--frame-bg-color)] hover:bg-[var(--border-color)]'}`} style={{ fontFamily: 'Nunito' }}>Nunito</button>
                        <button onClick={() => handleUpdateSelectedOverlay({ fontFamily: 'Orbitron' })} className={`w-full py-2 font-bold rounded-lg transition-colors ${selectedOverlay.fontFamily === 'Orbitron' ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--frame-bg-color)] hover:bg-[var(--border-color)]'}`} style={{ fontFamily: 'Orbitron' }}>Orbitron</button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1"><label className="font-semibold text-sm">Color</label><input type="color" value={selectedOverlay.color} onChange={(e) => handleUpdateSelectedOverlay({ color: e.target.value })} className="w-full h-10 rounded-lg bg-[var(--bg-color)] border-2 border-[var(--border-color)]" /></div>
                    <div className="flex flex-col gap-1"><label className="font-semibold text-sm">Font Size ({selectedOverlay.fontSize}px)</label><input type="range" min="12" max="72" value={selectedOverlay.fontSize} onChange={(e) => handleUpdateSelectedOverlay({ fontSize: Number(e.target.value) })} /></div>
                </div>
                 <div className="flex flex-col gap-1">
                    <label className="font-semibold text-sm">Background Style</label>
                    <div className="flex gap-2 bg-[var(--bg-color)] p-1 rounded-xl">
                        {(['none', 'rectangle', 'pill'] as const).map(style => (
                            <button key={style} onClick={() => handleUpdateSelectedOverlay({ backgroundStyle: style })} className={`w-full py-2 font-bold rounded-lg transition-colors capitalize ${selectedOverlay.backgroundStyle === style ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--frame-bg-color)] hover:bg-[var(--border-color)]'}`}>{style}</button>
                        ))}
                    </div>
                </div>
                {selectedOverlay.backgroundStyle !== 'none' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1"><label className="font-semibold text-sm">BG Color</label><input type="color" value={selectedOverlay.backgroundColor || '#000000'} onChange={(e) => handleUpdateSelectedOverlay({ backgroundColor: e.target.value })} className="w-full h-10 rounded-lg bg-[var(--bg-color)] border-2 border-[var(--border-color)]" /></div>
                        <div className="flex flex-col gap-1"><label className="font-semibold text-sm">BG Opacity ({Math.round((selectedOverlay.backgroundOpacity ?? 0.5) * 100)}%)</label><input type="range" min="0" max="1" step="0.05" value={selectedOverlay.backgroundOpacity ?? 0.5} onChange={(e) => handleUpdateSelectedOverlay({ backgroundOpacity: Number(e.target.value) })} /></div>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1"><label className="font-semibold text-sm">Start Time (s)</label><input type="number" step="0.1" value={selectedOverlay.startTime.toFixed(1)} onChange={(e) => handleUpdateSelectedOverlay({ startTime: Number(e.target.value) })} className="w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-xl p-2 font-mono"/></div>
                    <div className="flex flex-col gap-1"><label className="font-semibold text-sm">End Time (s)</label><input type="number" step="0.1" value={selectedOverlay.endTime.toFixed(1)} onChange={(e) => handleUpdateSelectedOverlay({ endTime: Number(e.target.value) })} className="w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-xl p-2 font-mono"/></div>
                </div>
                 <div className="flex gap-2 mt-2">
                    <button onClick={() => handleDeleteOverlay(selectedOverlay.id)} className="w-full py-2 font-bold text-red-500 bg-red-500/10 rounded-xl flex items-center justify-center gap-2"><TrashIcon className="w-5 h-5"/> Delete</button>
                    <button onClick={handleDoneEditingText} className="w-full py-2 font-bold text-white bg-[var(--accent-color)] rounded-xl">Done</button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="h-full w-full bg-[var(--frame-bg-color)] text-[var(--text-color)] flex flex-col transition-colors duration-300 relative">
      <header className="grid grid-cols-3 items-center p-4 border-b-2 border-[var(--border-color)] flex-shrink-0 h-16 transition-colors duration-300 z-10">
        {renderHeader()}
      </header>
      <main className="flex-grow p-4 flex flex-col gap-6 overflow-y-auto items-center">
        {renderContent()}
      </main>
      {step === 'edit' && selectedOverlay && <TextEditorPanel />}
      {isUploading && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 flex flex-col justify-center items-center p-8 text-center">
            {previewUrl && (
              <img src={previewUrl} alt="upload preview" className="w-24 h-40 object-cover rounded-xl mb-4 transition-opacity duration-500" style={{ opacity: Math.min(uploadProgress / 100, 1) }} />
            )}
            <h2 className="text-3xl font-black text-white font-display mb-2">Uploading Your Vibe</h2>
            <p className="text-white/80 font-semibold text-lg min-h-[2rem] mb-4">{uploadStatusText}</p>
            <div className="w-full max-w-md">
                <div 
                    className="w-full bg-white/20 rounded-full h-5 overflow-hidden relative progress-bar-shimmer"
                >
                    <div 
                        className="bg-gradient-to-r from-[var(--accent-color)] to-[var(--secondary-color)] h-full rounded-full transition-all duration-300 ease-linear"
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
                <p 
                    className="text-white font-bold text-xl mt-3"
                    aria-valuenow={uploadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    role="progressbar"
                    aria-label={`Upload progress: ${Math.round(Math.min(uploadProgress, 100))}%`}
                >
                    {Math.round(Math.min(uploadProgress, 100))}%
                </p>
            </div>
            <button 
                onClick={handleCancelUpload}
                className="mt-8 text-white/80 font-bold py-2 px-5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Cancel upload"
            >
                Cancel
            </button>
        </div>
      )}
      {showDraftToast && (
             <div className="absolute top-20 right-4 bg-gradient-to-br from-[var(--accent-color)] to-[var(--secondary-color)] text-white font-bold p-3 rounded-xl shadow-lg animate-toast-in-right z-50">
                <p>💾 Draft Saved!</p>
            </div>
        )}
    </div>
  );
};

export default Upload;