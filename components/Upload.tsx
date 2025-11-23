
import React, { useState, useRef, ChangeEvent, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  UploadCloudIcon, TextIcon, TrashIcon, UndoIcon, RedoIcon, CameraIcon, 
  MusicNoteIcon, CheckIcon, MagicWandIcon, SlidersIcon, RotateIcon, 
  ScissorsIcon, StickerIcon, TextAlignLeftIcon, TextAlignCenterIcon, TextAlignRightIcon, playSound
} from '../constants';
import { TextOverlay, ImageOverlay, VideoPost } from '../types';
import { MOCK_SOUNDS } from '../constants';

interface UploadProps {
  onPost: (data: VideoPost) => void; // Updated to accept full video object structure
  onCancel: () => void;
}

type EditorState = {
  textOverlays: TextOverlay[];
  imageOverlays: ImageOverlay[];
  startTime: number;
  endTime: number;
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  scale: number;
  originalVolume: number;
  musicVolume: number;
};

const QUALITY_OPTIONS = [
  { label: 'SD (480p)', value: 'SD' as const, note: 'Faster upload' },
  { label: 'HD (720p)', value: 'HD' as const, note: 'Good balance' },
  { label: '4K (2160p)', value: '4K' as const, note: 'Best quality' },
];

const Upload: React.FC<UploadProps> = ({ onPost, onCancel }) => {
  const [step, setStep] = useState<'select' | 'edit' | 'post' | 'record'>('select');
  const [activeTab, setActiveTab] = useState<'trim' | 'adjust' | 'audio' | 'text' | 'stickers'>('trim');
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  
  // Video Metadata & Trimming
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isTrimming, setIsTrimming] = useState<'start' | 'end' | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Advanced Adjustments
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  
  // Audio
  const [originalVolume, setOriginalVolume] = useState(1);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [selectedSound, setSelectedSound] = useState<{id: string, title: string, artist: string} | null>(null);
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);

  // Overlays
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [imageOverlays, setImageOverlays] = useState<ImageOverlay[]>([]);
  
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [selectedOverlayType, setSelectedOverlayType] = useState<'text' | 'image' | null>(null);

  // Dragging state
  const [draggingOverlay, setDraggingOverlay] = useState<{
    id: string;
    type: 'text' | 'image';
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('Preparing your Vibe...');
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [videoQuality, setVideoQuality] = useState<'SD' | 'HD' | '4K'>('HD');
  const [draftExists, setDraftExists] = useState(false);
  const [showDraftToast, setShowDraftToast] = useState(false);
  const [loadDraft, setLoadDraft] = useState(false);

  // AI Enhancement State
  const [isEnhancingCaption, setIsEnhancingCaption] = useState(false);
  const [captionSources, setCaptionSources] = useState<any[]>([]);

  // AI Background Generation State
  const [bgPrompt, setBgPrompt] = useState('');
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);

  // Recording State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'finished'>('idle');
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  // Undo/Redo state
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trimBarRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const uploadIntervalRef = useRef<number | null>(null);

  const selectedTextOverlay = useMemo(() => 
    selectedOverlayType === 'text' ? textOverlays.find(o => o.id === selectedOverlayId) : null, 
  [textOverlays, selectedOverlayId, selectedOverlayType]);

  const selectedImageOverlay = useMemo(() => 
    selectedOverlayType === 'image' ? imageOverlays.find(o => o.id === selectedOverlayId) : null, 
  [imageOverlays, selectedOverlayId, selectedOverlayType]);

  const captureState = (): EditorState => ({
      textOverlays,
      imageOverlays,
      startTime, endTime,
      brightness, contrast, saturation, rotation, scale,
      originalVolume, musicVolume
  });
  
  const recordHistory = useCallback((newState: EditorState) => {
      const newHistory = history.slice(0, historyIndex + 1);
      if (newHistory.length > 0 && JSON.stringify(newHistory[newHistory.length - 1]) === JSON.stringify(newState)) {
          return;
      }
      newHistory.push(newState);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);
  
  const applyHistoryState = (state: EditorState) => {
    if (!state) return;
    setTextOverlays(state.textOverlays);
    setImageOverlays(state.imageOverlays);
    setStartTime(state.startTime);
    setEndTime(state.endTime);
    setBrightness(state.brightness);
    setContrast(state.contrast);
    setSaturation(state.saturation);
    setRotation(state.rotation);
    setScale(state.scale);
    setOriginalVolume(state.originalVolume);
    setMusicVolume(state.musicVolume);
    
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

        if (loadDraft && savedDraft) {
            const draftData = JSON.parse(savedDraft);
            setCaption(draftData.caption || '');
            setTextOverlays(draftData.textOverlays || []);
            setImageOverlays(draftData.imageOverlays || []);
            setBrightness(draftData.brightness || 1);
            setContrast(draftData.contrast || 1);
            setSaturation(draftData.saturation || 1);
            setRotation(draftData.rotation || 0);
            setScale(draftData.scale || 1);
            
            const loadedStartTime = draftData.startTime ?? 0;
            const loadedEndTime = draftData.endTime ?? videoDuration;
            
            setStartTime(loadedStartTime);
            setEndTime(loadedEndTime);
            
            const historyState: EditorState = {
              textOverlays: draftData.textOverlays || [],
              imageOverlays: draftData.imageOverlays || [],
              startTime: loadedStartTime,
              endTime: loadedEndTime,
              brightness: draftData.brightness || 1,
              contrast: draftData.contrast || 1,
              saturation: draftData.saturation || 1,
              rotation: draftData.rotation || 0,
              scale: draftData.scale || 1,
              originalVolume: draftData.originalVolume || 1,
              musicVolume: draftData.musicVolume || 0.5,
            };
            setHistory([historyState]);
            setHistoryIndex(0);
            setLoadDraft(false); 
        } else {
            const initialEndTime = videoDuration;
            setEndTime(initialEndTime);

            const initialState: EditorState = {
              textOverlays: [],
              imageOverlays: [],
              startTime: 0,
              endTime: initialEndTime,
              brightness: 1,
              contrast: 1,
              saturation: 1,
              rotation: 0,
              scale: 1,
              originalVolume: 1,
              musicVolume: 0.5
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
    setUploadCompleted(false);
  };

  const handlePost = () => {
    if (!videoFile) return;

    setIsUploading(true);
    setUploadCompleted(false);
    setUploadProgress(0);
    setUploadStatusText('Preparing your Vibe...');
    
    const hashtags = caption.match(/#\w+/g) || [];

    uploadIntervalRef.current = window.setInterval(() => {
        setUploadProgress(prev => {
            const increment = Math.random() * 5 + 2;
            let newProgress = prev + increment;
            
            if (newProgress >= 100) {
                newProgress = 100;
                if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
                setUploadStatusText('All set! 🎉');
                setUploadCompleted(true);
                playSound('success');
                
                setTimeout(() => {
                    onPost({ 
                        id: `v-${Date.now()}`,
                        user: { id: 'temp', username: 'temp', avatarUrl: '', bio: '', followingCount: 0, followerCount: 0, totalLikes: 0, vibeCoinBalance: 0, followingIds: [], payoutsSetUp: false }, // will be overwritten by App.tsx
                        videoUrl: previewUrl || '',
                        posterUrl: '', // App.tsx generates this generally, or we could
                        caption, 
                        hashtags, 
                        textOverlays, 
                        imageOverlays,
                        filterClass: '', 
                        startTime, 
                        endTime, 
                        quality: videoQuality, 
                        songTitle: selectedSound ? `${selectedSound.title} - ${selectedSound.artist}` : undefined,
                        brightness, contrast, saturation, rotation, scale,
                        originalVolume, musicVolume,
                        likes: 0, comments: 0, shares: 0
                    });
                    clearDraft();
                }, 1500);

            } else if (newProgress > 90) {
                setUploadStatusText('Finalizing...');
            } else if (newProgress > 60) {
                setUploadStatusText('Uploading to cloud...');
            } else if (newProgress > 30) {
                setUploadStatusText('Compressing video...');
            }
            
            return Math.min(newProgress, 100);
        });
    }, 200);
  };
  
  const handleBackToSelect = () => {
    setVideoFile(null);
    setPreviewUrl(null);
    setCaption('');
    setStartTime(0);
    setEndTime(0);
    setDuration(0);
    setTextOverlays([]);
    setImageOverlays([]);
    setSelectedOverlayId(null);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedSound(null);
    setBrightness(1); setContrast(1); setSaturation(1); setRotation(0); setScale(1);
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
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             setCameraError("Camera not supported in this browser.");
             return;
        }

        try {
            // 1. Try preferred: User facing camera + Audio
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setCameraError(null);
        } catch (err) {
            console.warn("Standard camera request failed, retrying with fallbacks...", err);
            try {
                // 2. Fallback: Any video + Audio
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
                setCameraError(null);
            } catch (err2) {
                 console.warn("Fallback with audio failed, retrying video only...", err2);
                 try {
                    // 3. Fallback: Video only (no audio)
                    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                    setCameraError(null);
                 } catch (err3) {
                    console.error("All camera attempts failed.", err3);
                    setCameraError("Could not access camera. Please check permissions and try again.");
                 }
            }
        }
    };
    
    useEffect(() => {
        if (step === 'record') startCamera();
        else stopCamera();
        return () => stopCamera();
    }, [step, stopCamera]);


  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Recording logic...
  const handleStartRecording = () => {
    if (!stream) return;
    setRecordedChunks([]);
    setRecordingTime(0);
    
    try {
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) setRecordedChunks(prev => [...prev, event.data]);
        };
        recorder.onstop = () => setRecordingStatus('finished');
        recorder.start();
        setRecordingStatus('recording');
        recordingTimerRef.current = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (e) {
        console.error("Failed to start MediaRecorder", e);
        setCameraError("Recording not supported on this device.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) mediaRecorder.stop();
    if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
    }
    setRecordingStatus('idle');
  };

  useEffect(() => {
    if (recordingStatus === 'finished' && recordedChunks.length > 0) {
        const mimeType = mediaRecorder?.mimeType || 'video/webm';
        const blob = new Blob(recordedChunks, { type: mimeType });
        const file = new File([blob], `recording-${Date.now()}.${mimeType.split('/')[1]}`, { type: mimeType });
        handleNewVideo(file);
        setRecordedChunks([]);
        setRecordingStatus('idle');
        setRecordingTime(0);
        setMediaRecorder(null);
    }
  }, [recordingStatus, recordedChunks, mediaRecorder]);
  
  // Trimming Logic
  const handleTrimStart = (type: 'start' | 'end') => {
    setIsTrimming(type);
    if (videoRef.current) videoRef.current.pause();
  };

  const handleTrimChange = useCallback((clientX: number) => {
    if (!trimBarRef.current || !duration || !isTrimming) return;

    const bar = trimBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - bar.left) / bar.width));
    const time = percent * duration;
    
    if (isTrimming === 'start') {
        if (time < endTime - 0.5) {
            setStartTime(time);
            if (videoRef.current) videoRef.current.currentTime = time;
        }
    } else if (isTrimming === 'end') {
        if (time > startTime + 0.5) {
            setEndTime(time);
            if (videoRef.current) videoRef.current.currentTime = time;
        }
    }
  }, [duration, endTime, startTime, isTrimming]);

  const handleMouseMove = useCallback((e: MouseEvent) => { handleTrimChange(e.clientX); }, [handleTrimChange]);
  const handleTouchMove = useCallback((e: TouchEvent) => { handleTrimChange(e.touches[0].clientX); }, [handleTrimChange]);
  const handleMouseUp = useCallback(() => {
      if (isTrimming) {
          recordHistory(captureState());
          if (videoRef.current) videoRef.current.play().catch(() => {});
      }
      setIsTrimming(null);
  }, [isTrimming, recordHistory, captureState]);

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

  // Playback Loop
  useEffect(() => {
    const video = videoRef.current;
    if (!video || step === 'record') return;
    video.volume = originalVolume;

    const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        if (video.currentTime >= endTime) {
            video.currentTime = startTime;
            video.play().catch(() => {});
        }
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [startTime, endTime, step, originalVolume]);

  // --- TEXT & STICKER LOGIC ---

  const handleAddText = () => {
    const newOverlay: TextOverlay = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: 'Double Tap to Edit',
      color: '#FFFFFF',
      fontSize: 28,
      fontFamily: 'Nunito',
      position: { x: 50, y: 50 },
      startTime: startTime,
      endTime: endTime,
      backgroundStyle: 'none',
      backgroundColor: '#000000',
      backgroundOpacity: 0.5,
      textAlign: 'center',
      rotation: 0,
      scale: 1
    };
    const newOverlays = [...textOverlays, newOverlay];
    setTextOverlays(newOverlays);
    setSelectedOverlayType('text');
    setSelectedOverlayId(newOverlay.id);
    recordHistory({ ...captureState(), textOverlays: newOverlays });
  };

  const handleAddSticker = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      const url = URL.createObjectURL(file);
      const newOverlay: ImageOverlay = {
          id: `img-${Date.now()}`,
          type: 'image',
          src: url,
          position: { x: 50, y: 50 },
          startTime: startTime,
          endTime: endTime,
          opacity: 1,
          rotation: 0,
          scale: 1
      };
      const newOverlays = [...imageOverlays, newOverlay];
      setImageOverlays(newOverlays);
      setSelectedOverlayType('image');
      setSelectedOverlayId(newOverlay.id);
      recordHistory({ ...captureState(), imageOverlays: newOverlays });
  };
  
  const handleUpdateTextOverlay = (updates: Partial<TextOverlay>) => {
    if (selectedOverlayId && selectedOverlayType === 'text') {
        const newOverlays = textOverlays.map(o => o.id === selectedOverlayId ? {...o, ...updates} : o);
        setTextOverlays(newOverlays);
    }
  };

  const handleUpdateImageOverlay = (updates: Partial<ImageOverlay>) => {
    if (selectedOverlayId && selectedOverlayType === 'image') {
        const newOverlays = imageOverlays.map(o => o.id === selectedOverlayId ? {...o, ...updates} : o);
        setImageOverlays(newOverlays);
    }
  };

  const handleDeleteOverlay = () => {
      if(selectedOverlayType === 'text') {
        const newOverlays = textOverlays.filter(o => o.id !== selectedOverlayId);
        setTextOverlays(newOverlays);
      } else if (selectedOverlayType === 'image') {
        const newOverlays = imageOverlays.filter(o => o.id !== selectedOverlayId);
        setImageOverlays(newOverlays);
      }
      setSelectedOverlayId(null);
      setSelectedOverlayType(null);
      recordHistory(captureState());
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string, type: 'text' | 'image') => {
    e.stopPropagation();
    setSelectedOverlayId(id);
    setSelectedOverlayType(type);
    
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    
    const overlay = type === 'text' ? textOverlays.find(o => o.id === id) : imageOverlays.find(o => o.id === id);
    if (!overlay) return;

    setDraggingOverlay({
        id, type,
        startX: e.clientX, startY: e.clientY,
        startPosX: overlay.position.x, startPosY: overlay.position.y,
    });
  };
  
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingOverlay || !videoContainerRef.current) return;
    e.stopPropagation();
    const containerRect = videoContainerRef.current.getBoundingClientRect();
    
    const deltaX_pct = ((e.clientX - draggingOverlay.startX) / containerRect.width) * 100;
    const deltaY_pct = ((e.clientY - draggingOverlay.startY) / containerRect.height) * 100;

    const updates = { 
        position: {
            x: Math.max(0, Math.min(100, draggingOverlay.startPosX + deltaX_pct)),
            y: Math.max(0, Math.min(100, draggingOverlay.startPosY + deltaY_pct))
        }
    };

    if (draggingOverlay.type === 'text') {
         setTextOverlays(prev => prev.map(o => o.id === draggingOverlay.id ? {...o, ...updates} : o));
    } else {
         setImageOverlays(prev => prev.map(o => o.id === draggingOverlay.id ? {...o, ...updates} : o));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (draggingOverlay) {
        recordHistory(captureState());
    }
    setDraggingOverlay(null);
  };

  // Draft functions
  const saveDraft = () => {
    if (window.confirm("Save current draft?")) {
      if (!videoFile) return;
      const draft = captureState();
      localStorage.setItem('vibeShortsDraft', JSON.stringify(draft));
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
  
  // AI Caption Enhancement
  const handleEnhanceCaption = async () => {
      if (!caption.trim()) return;
      setIsEnhancingCaption(true);
      setCaptionSources([]);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: `Rewrite this caption to be engaging for social media with trending hashtags. Use web search for context: "${caption}"`,
              config: { tools: [{googleSearch: {}}] },
          });
          if (response.text) setCaption(response.text.trim());
          const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          setCaptionSources(sources);
      } catch (error) {
          console.error("Caption enhancement failed", error);
      } finally {
          setIsEnhancingCaption(false);
      }
  };
  
  // AI Background Generation
  const handleGenerateBackground = async () => {
      if (!bgPrompt.trim() || !selectedOverlayId) return;
      setIsGeneratingBg(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash-image",
              contents: {
                  parts: [{ text: `Generate a texture or pattern image for a text background: ${bgPrompt}` }]
              }
          });
          
          // Parse response for image parts
          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64String = part.inlineData.data;
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${base64String}`;
                    handleUpdateTextOverlay({ backgroundImageUrl: imageUrl });
                    break;
                }
            }
          }
      } catch (error) {
          console.error("Background generation failed", error);
          alert("Failed to generate image. Please try again.");
      } finally {
          setIsGeneratingBg(false);
      }
  };

  // ---- SUB-COMPONENTS FOR EDITOR TABS ----

  const TrimPanel = () => {
      const startPercent = duration ? (startTime / duration) * 100 : 0;
      const endPercent = duration ? (endTime / duration) * 100 : 100;
      return (
        <div className="space-y-4 p-2">
             <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-lg">Trim Video</label>
                <span className="text-sm font-bold text-[var(--accent-color)]">{(endTime - startTime).toFixed(1)}s</span>
             </div>
             <div className="trim-bar w-full py-4 cursor-pointer relative touch-none" ref={trimBarRef}>
                <div className="trim-track w-full h-3 bg-[var(--border-color)] rounded-full relative">
                    <div className="absolute h-full bg-[var(--accent-color)] rounded-lg" style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }} />
                    <div className="absolute top-0 h-full w-1 bg-white/80 z-10" style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
                    
                    {/* Start Handle */}
                    <div className="absolute top-1/2 w-8 h-8 bg-white shadow-lg rounded-full border-4 border-[var(--accent-color)] z-20 touch-none" 
                         style={{ left: `${startPercent}%`, transform: 'translate(-50%, -50%)' }}
                         onMouseDown={() => handleTrimStart('start')}
                         onTouchStart={() => handleTrimStart('start')} />

                    {/* End Handle */}
                    <div className="absolute top-1/2 w-8 h-8 bg-white shadow-lg rounded-full border-4 border-[var(--accent-color)] z-20 touch-none" 
                         style={{ left: `${endPercent}%`, transform: 'translate(-50%, -50%)' }}
                         onMouseDown={() => handleTrimStart('end')}
                         onTouchStart={() => handleTrimStart('end')} />
                </div>
             </div>
             <p className="text-center text-xs opacity-60">Drag handles to trim video length</p>
        </div>
      );
  };

  const AdjustPanel = () => {
      return (
          <div className="space-y-4 p-2">
              <div className="grid grid-cols-2 gap-4 mb-2">
                  <button onClick={() => setRotation(r => (r + 90) % 360)} className="flex items-center justify-center gap-2 p-3 bg-[var(--bg-color)] rounded-xl font-bold"><RotateIcon className="w-5 h-5"/> Rotate</button>
                  <div className="flex items-center justify-between p-3 bg-[var(--bg-color)] rounded-xl">
                       <span className="font-bold">Scale</span>
                       <input type="range" min="1" max="2" step="0.1" value={scale} onChange={e => setScale(Number(e.target.value))} className="w-20 accent-[var(--accent-color)]" />
                  </div>
              </div>
              
              <div className="space-y-3">
                  <div className="flex items-center justify-between">
                      <span className="text-sm font-bold w-24">Brightness</span>
                      <input type="range" min="0.5" max="1.5" step="0.1" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="flex-grow accent-[var(--accent-color)]" />
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="text-sm font-bold w-24">Contrast</span>
                      <input type="range" min="0.5" max="1.5" step="0.1" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="flex-grow accent-[var(--accent-color)]" />
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="text-sm font-bold w-24">Saturation</span>
                      <input type="range" min="0" max="2" step="0.1" value={saturation} onChange={e => setSaturation(Number(e.target.value))} className="flex-grow accent-[var(--accent-color)]" />
                  </div>
              </div>
               <div className="flex justify-end mt-2">
                   <button onClick={() => { setBrightness(1); setContrast(1); setSaturation(1); setScale(1); setRotation(0); }} className="text-xs text-red-500 font-bold">Reset All</button>
               </div>
          </div>
      );
  };

  const AudioPanel = () => {
      return (
          <div className="space-y-4 p-2">
              <button onClick={() => setIsSoundModalOpen(true)} className="w-full flex items-center justify-between p-4 bg-[var(--bg-color)] rounded-xl border-2 border-[var(--border-color)]">
                 <div className="flex items-center gap-3">
                     <MusicNoteIcon className="w-6 h-6 text-[var(--accent-color)]" />
                     <div className="text-left">
                         <p className="font-bold">{selectedSound ? selectedSound.title : "Add Sound"}</p>
                         <p className="text-xs opacity-70">{selectedSound ? selectedSound.artist : "Select from library"}</p>
                     </div>
                 </div>
                 {selectedSound ? <button onClick={(e) => {e.stopPropagation(); setSelectedSound(null);}} className="text-xs font-bold text-red-500">Remove</button> : <span className="font-bold text-2xl">+</span>}
              </button>

              <div className="space-y-4 pt-2">
                  <div>
                      <div className="flex justify-between mb-1"><span className="text-sm font-bold">Original Sound</span><span className="text-xs">{Math.round(originalVolume * 100)}%</span></div>
                      <input type="range" min="0" max="1" step="0.1" value={originalVolume} onChange={e => setOriginalVolume(Number(e.target.value))} className="w-full accent-[var(--accent-color)]" />
                  </div>
                  {selectedSound && (
                      <div>
                           <div className="flex justify-between mb-1"><span className="text-sm font-bold">Added Music</span><span className="text-xs">{Math.round(musicVolume * 100)}%</span></div>
                           <input type="range" min="0" max="1" step="0.1" value={musicVolume} onChange={e => setMusicVolume(Number(e.target.value))} className="w-full accent-[var(--secondary-color)]" />
                      </div>
                  )}
              </div>
          </div>
      );
  };
  
  const TextPanel = () => {
      if (selectedOverlayId && selectedOverlayType === 'text') {
          const overlay = selectedTextOverlay!;
          return (
              <div className="space-y-3 p-2 max-h-[40vh] overflow-y-auto">
                  <textarea value={overlay.text} onChange={(e) => handleUpdateTextOverlay({ text: e.target.value })} className="w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-xl p-2" rows={2} />
                  
                  <div className="flex gap-2 overflow-x-auto pb-2">
                      <input type="color" value={overlay.color} onChange={(e) => handleUpdateTextOverlay({ color: e.target.value })} className="w-10 h-10 rounded-lg border-0 p-0 overflow-hidden flex-shrink-0" />
                      <button onClick={() => handleUpdateTextOverlay({ textAlign: 'left' })} className={`p-2 rounded-lg ${overlay.textAlign === 'left' ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-color)]'}`}><TextAlignLeftIcon className="w-6 h-6"/></button>
                      <button onClick={() => handleUpdateTextOverlay({ textAlign: 'center' })} className={`p-2 rounded-lg ${overlay.textAlign === 'center' ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-color)]'}`}><TextAlignCenterIcon className="w-6 h-6"/></button>
                      <button onClick={() => handleUpdateTextOverlay({ textAlign: 'right' })} className={`p-2 rounded-lg ${overlay.textAlign === 'right' ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-color)]'}`}><TextAlignRightIcon className="w-6 h-6"/></button>
                  </div>

                  <div className="flex items-center justify-between bg-[var(--bg-color)] p-2 rounded-xl border border-[var(--border-color)]">
                      <span className="text-sm font-bold">Size</span>
                      <input 
                        type="range" 
                        min="12" 
                        max="72" 
                        step="1"
                        value={overlay.fontSize} 
                        onChange={(e) => handleUpdateTextOverlay({ fontSize: Number(e.target.value) })} 
                        className="accent-[var(--accent-color)] w-3/4" 
                      />
                      <span className="text-xs font-mono w-6 text-right">{overlay.fontSize}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleUpdateTextOverlay({ fontFamily: 'Nunito' })} className={`py-2 rounded-lg font-bold border-2 ${overlay.fontFamily === 'Nunito' ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10' : 'border-[var(--border-color)]'}`} style={{fontFamily: 'Nunito'}}>Nunito</button>
                      <button onClick={() => handleUpdateTextOverlay({ fontFamily: 'Orbitron' })} className={`py-2 rounded-lg font-bold border-2 ${overlay.fontFamily === 'Orbitron' ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10' : 'border-[var(--border-color)]'}`} style={{fontFamily: 'Orbitron'}}>Orbitron</button>
                  </div>

                   <div className="flex gap-2">
                      {(['none', 'rectangle', 'pill'] as const).map(s => (
                          <button key={s} onClick={() => handleUpdateTextOverlay({ backgroundStyle: s })} className={`flex-1 py-1 text-xs font-bold rounded-lg capitalize ${overlay.backgroundStyle === s ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-color)]'}`}>{s}</button>
                      ))}
                   </div>
                   
                   {overlay.backgroundStyle !== 'none' && (
                       <div className="space-y-2 bg-[var(--bg-color)] p-2 rounded-xl border border-[var(--border-color)]">
                           <p className="text-xs font-bold opacity-70">Background AI Pattern</p>
                           <div className="flex gap-2">
                               <input 
                                    type="text" 
                                    value={bgPrompt} 
                                    onChange={(e) => setBgPrompt(e.target.value)} 
                                    placeholder="e.g., blue wavy texture"
                                    className="flex-grow bg-[var(--frame-bg-color)] border rounded-lg px-2 py-1 text-sm"
                                />
                                <button 
                                    onClick={handleGenerateBackground} 
                                    disabled={isGeneratingBg || !bgPrompt}
                                    className="bg-[var(--secondary-color)] text-white px-3 py-1 rounded-lg text-xs font-bold disabled:opacity-50"
                                >
                                    {isGeneratingBg ? '...' : 'Gen'}
                                </button>
                           </div>
                           {overlay.backgroundImageUrl && (
                               <button onClick={() => handleUpdateTextOverlay({ backgroundImageUrl: undefined })} className="text-xs text-red-500 font-bold w-full text-right">Remove Image</button>
                           )}
                       </div>
                   )}
                   
                   <button onClick={handleDeleteOverlay} className="w-full py-2 mt-2 bg-red-500/10 text-red-500 font-bold rounded-xl flex items-center justify-center gap-2"><TrashIcon className="w-4 h-4"/> Delete Text</button>
                   <button onClick={() => {setSelectedOverlayId(null); recordHistory(captureState());}} className="w-full py-2 font-bold text-[var(--accent-color)]">Done Editing</button>
              </div>
          )
      }
      return (
          <div className="flex flex-col items-center justify-center p-6 gap-4">
              <p className="opacity-60 font-bold text-center">Add text overlays to your video</p>
              <button onClick={handleAddText} className="bg-[var(--accent-color)] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg transform active:scale-95 transition-transform"><TextIcon className="w-6 h-6"/> Add Text</button>
          </div>
      );
  };

  const StickerPanel = () => {
       if (selectedOverlayId && selectedOverlayType === 'image') {
            const overlay = selectedImageOverlay!;
            return (
                 <div className="space-y-4 p-2">
                      <p className="font-bold text-center">Edit Sticker</p>
                      <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">Opacity</span>
                          <input type="range" min="0" max="1" step="0.1" value={overlay.opacity} onChange={e => handleUpdateImageOverlay({ opacity: Number(e.target.value) })} className="accent-[var(--accent-color)] w-32" />
                      </div>
                      <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">Scale</span>
                          <input type="range" min="0.5" max="3" step="0.1" value={overlay.scale || 1} onChange={e => handleUpdateImageOverlay({ scale: Number(e.target.value) })} className="accent-[var(--accent-color)] w-32" />
                      </div>
                      <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">Rotation</span>
                          <input type="range" min="0" max="360" step="15" value={overlay.rotation || 0} onChange={e => handleUpdateImageOverlay({ rotation: Number(e.target.value) })} className="accent-[var(--accent-color)] w-32" />
                      </div>
                      <button onClick={handleDeleteOverlay} className="w-full py-2 mt-4 bg-red-500/10 text-red-500 font-bold rounded-xl flex items-center justify-center gap-2"><TrashIcon className="w-4 h-4"/> Delete Sticker</button>
                      <button onClick={() => {setSelectedOverlayId(null); recordHistory(captureState());}} className="w-full py-2 font-bold text-[var(--accent-color)]">Done</button>
                 </div>
            );
       }
       return (
          <div className="flex flex-col items-center justify-center p-6 gap-4">
               <p className="opacity-60 font-bold text-center">Add images/stickers to your video</p>
               <button onClick={() => stickerInputRef.current?.click()} className="bg-[var(--secondary-color)] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg transform active:scale-95 transition-transform"><StickerIcon className="w-6 h-6"/> Upload Image</button>
               <input type="file" accept="image/png, image/jpeg" ref={stickerInputRef} onChange={handleAddSticker} className="hidden" />
          </div>
       );
  };


  // ---- MAIN RENDER ----

  if (step === 'edit') {
      return (
        <div className="h-full w-full bg-[var(--frame-bg-color)] text-[var(--text-color)] flex flex-col relative">
            {/* Top Bar */}
            <div className="flex justify-between items-center p-4 z-20 bg-gradient-to-b from-black/50 to-transparent absolute top-0 w-full text-white">
                 <button onClick={() => { if(window.confirm('Discard changes?')) handleBackToSelect(); }} className="font-bold drop-shadow-md">Cancel</button>
                 <div className="flex gap-4">
                    <button onClick={saveDraft} className="font-bold drop-shadow-md">Save</button>
                    <button onClick={() => setStep('post')} className="bg-[var(--accent-color)] px-4 py-1 rounded-full font-bold shadow-lg">Next</button>
                 </div>
            </div>

            {/* Preview Area */}
            <div className="relative flex-grow bg-black overflow-hidden flex items-center justify-center" 
                 onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
                 <div 
                    ref={videoContainerRef}
                    className="relative w-full aspect-[9/16] max-h-full bg-black overflow-hidden shadow-2xl"
                    style={{
                        filter: `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`,
                        transform: `rotate(${rotation}deg) scale(${scale})`,
                        transition: 'transform 0.2s ease-out'
                    }}
                 >
                     {previewUrl && (
                         <video ref={videoRef} src={previewUrl} className="w-full h-full object-cover pointer-events-none" muted={false} playsInline loop autoPlay />
                     )}
                     
                     {/* Overlay Rendering */}
                     <div className="absolute inset-0 z-10 overflow-hidden">
                         {textOverlays.map(o => {
                             if (currentTime < o.startTime || currentTime > o.endTime) return null;
                             let borderRadius = o.backgroundStyle === 'pill' ? '9999px' : o.backgroundStyle === 'rectangle' ? '0.5rem' : '0';
                             const isSelected = selectedOverlayId === o.id;
                             return (
                                 <div key={o.id} 
                                     onPointerDown={(e) => handlePointerDown(e, o.id, 'text')}
                                     className={`absolute px-4 py-2 cursor-move select-none ${isSelected ? 'border-2 border-dashed border-[var(--accent-color)]' : ''}`}
                                     style={{
                                         left: `${o.position.x}%`, top: `${o.position.y}%`, transform: 'translate(-50%, -50%)',
                                         textAlign: o.textAlign || 'center',
                                     }}
                                 >
                                     {o.backgroundStyle !== 'none' && (
                                         <div className="absolute inset-0 -z-10" style={{ 
                                             backgroundColor: o.backgroundImageUrl ? 'transparent' : (o.backgroundColor || 'black'), 
                                             backgroundImage: o.backgroundImageUrl ? `url(${o.backgroundImageUrl})` : undefined,
                                             backgroundSize: 'cover',
                                             backgroundPosition: 'center',
                                             opacity: o.backgroundOpacity || 0.5, 
                                             borderRadius 
                                         }} />
                                     )}
                                     <span style={{ color: o.color, fontSize: `${o.fontSize}px`, fontFamily: o.fontFamily, fontWeight: '900', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{o.text}</span>
                                 </div>
                             )
                         })}
                         {imageOverlays.map(o => {
                             if (currentTime < o.startTime || currentTime > o.endTime) return null;
                             const isSelected = selectedOverlayId === o.id;
                             return (
                                 <div key={o.id}
                                    onPointerDown={(e) => handlePointerDown(e, o.id, 'image')}
                                    className={`absolute cursor-move select-none ${isSelected ? 'border-2 border-dashed border-[var(--secondary-color)]' : ''}`}
                                    style={{
                                        left: `${o.position.x}%`, top: `${o.position.y}%`, transform: `translate(-50%, -50%) scale(${o.scale || 1}) rotate(${o.rotation || 0}deg)`,
                                        opacity: o.opacity
                                    }}
                                 >
                                     <img src={o.src} alt="sticker" className="max-w-[150px] object-contain pointer-events-none" />
                                 </div>
                             )
                         })}
                     </div>
                 </div>
            </div>

            {/* Bottom Editor Sheet */}
            <div className="bg-[var(--frame-bg-color)] rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.2)] z-30 flex flex-col max-h-[50vh]">
                 {/* Active Tool Panel */}
                 <div className="p-4 flex-grow overflow-y-auto">
                      {activeTab === 'trim' && <TrimPanel />}
                      {activeTab === 'adjust' && <AdjustPanel />}
                      {activeTab === 'audio' && <AudioPanel />}
                      {activeTab === 'text' && <TextPanel />}
                      {activeTab === 'stickers' && <StickerPanel />}
                 </div>

                 {/* Tab Bar */}
                 <div className="flex justify-around items-center p-2 border-t border-[var(--border-color)] bg-[var(--bg-color)] pb-6 sm:pb-2">
                      <button onClick={() => setActiveTab('trim')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'trim' ? 'text-[var(--accent-color)] bg-[var(--accent-color)]/10' : 'opacity-60'}`}>
                          <ScissorsIcon className="w-6 h-6" />
                          <span className="text-xs font-bold mt-1">Trim</span>
                      </button>
                      <button onClick={() => setActiveTab('adjust')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'adjust' ? 'text-[var(--accent-color)] bg-[var(--accent-color)]/10' : 'opacity-60'}`}>
                          <SlidersIcon className="w-6 h-6" />
                          <span className="text-xs font-bold mt-1">Adjust</span>
                      </button>
                      <button onClick={() => setActiveTab('audio')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'audio' ? 'text-[var(--accent-color)] bg-[var(--accent-color)]/10' : 'opacity-60'}`}>
                          <MusicNoteIcon className="w-6 h-6" />
                          <span className="text-xs font-bold mt-1">Audio</span>
                      </button>
                      <button onClick={() => setActiveTab('text')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'text' ? 'text-[var(--accent-color)] bg-[var(--accent-color)]/10' : 'opacity-60'}`}>
                          <TextIcon className="w-6 h-6" />
                          <span className="text-xs font-bold mt-1">Text</span>
                      </button>
                       <button onClick={() => setActiveTab('stickers')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'stickers' ? 'text-[var(--accent-color)] bg-[var(--accent-color)]/10' : 'opacity-60'}`}>
                          <StickerIcon className="w-6 h-6" />
                          <span className="text-xs font-bold mt-1">Stickers</span>
                      </button>
                 </div>
            </div>
            
            {isSoundModalOpen && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center" onClick={() => setIsSoundModalOpen(false)}>
                    <div className="bg-[var(--frame-bg-color)] w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 flex flex-col gap-4 font-display" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-black text-center">Sound Library</h2>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {MOCK_SOUNDS.map(s => (
                                <button key={s.id} onClick={() => {setSelectedSound(s); setIsSoundModalOpen(false);}} className="w-full text-left p-3 hover:bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)]">
                                    <div className="font-bold">{s.title}</div>
                                    <div className="text-xs opacity-70">{s.artist}</div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setIsSoundModalOpen(false)} className="py-3 font-bold border-2 rounded-xl">Cancel</button>
                    </div>
                 </div>
            )}
        </div>
      );
  }

  // Re-use previous renderContent for 'select'/'record'/'post' steps, but slightly cleaned up for context
  return (
    <div className="h-full w-full bg-[var(--frame-bg-color)] text-[var(--text-color)] flex flex-col transition-colors duration-300 relative">
      <header className="grid grid-cols-3 items-center p-4 border-b-2 border-[var(--border-color)] flex-shrink-0 h-16">
        {step === 'record' && (
            <>
                <button onClick={() => setStep('select')} className="font-bold">Back</button>
                <h1 className="text-xl font-black text-center">Camera</h1>
                <div/>
            </>
        )}
        {step === 'post' && (
              <>
                <button onClick={() => setStep('edit')} className="font-bold">Back</button>
                <h1 className="text-xl font-black text-center">New Post</h1>
                <button onClick={handlePost} disabled={isUploading} className="font-bold text-[var(--accent-color)]">Post</button>
            </>
        )}
        {step === 'select' && (
            <>
                <button onClick={onCancel} className="font-bold">Cancel</button>
                <h1 className="text-xl font-black text-center">Create</h1>
                <div/>
            </>
        )}
      </header>

      <main className="flex-grow p-4 flex flex-col gap-4 overflow-y-auto items-center">
            {step === 'select' && (
                <div className="w-full space-y-4">
                    {draftExists && (
                    <div className="bg-[var(--accent-color)]/10 p-4 rounded-2xl text-center">
                        <p className="font-bold">Draft Found</p>
                        <button onClick={() => {setLoadDraft(true); fileInputRef.current?.click();}} className="mt-2 px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg font-bold">Resume Draft</button>
                        <button onClick={clearDraft} className="ml-2 px-4 py-2 border rounded-lg font-bold">Discard</button>
                    </div>
                    )}
                    <button onClick={() => {setLoadDraft(false); fileInputRef.current?.click();}} className="w-full h-48 bg-[var(--bg-color)] border-2 border-dashed border-[var(--border-color)] rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-[var(--accent-color)]/5 transition-colors">
                        <UploadCloudIcon className="w-12 h-12 opacity-50"/>
                        <span className="font-bold text-xl">Upload Video</span>
                    </button>
                    <button onClick={() => setStep('record')} className="w-full h-48 bg-[var(--bg-color)] border-2 border-dashed border-[var(--border-color)] rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-[var(--secondary-color)]/5 transition-colors">
                        <CameraIcon className="w-12 h-12 opacity-50"/>
                        <span className="font-bold text-xl">Record Video</span>
                    </button>
                    <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
            )}

            {step === 'record' && (
                <div className="w-full flex flex-col items-center gap-4 h-full">
                    <div className="w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden relative border-4 border-[var(--border-color)]">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                        {recordingStatus === 'recording' && <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-md font-bold animate-pulse">REC {new Date(recordingTime * 1000).toISOString().substr(14, 5)}</div>}
                        {cameraError && <div className="absolute inset-0 flex items-center justify-center text-center p-4 bg-black/80 text-red-400 font-bold">{cameraError}</div>}
                    </div>
                    <button 
                        onClick={recordingStatus === 'recording' ? handleStopRecording : handleStartRecording}
                        className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${recordingStatus === 'recording' ? 'bg-red-500' : 'bg-transparent'}`}
                        disabled={!!cameraError}
                    >
                        <div className={`w-16 h-16 bg-red-500 transition-all ${recordingStatus === 'recording' ? 'rounded-md w-8 h-8' : 'rounded-full'}`} />
                    </button>
                </div>
            )}

            {step === 'post' && (
                <div className="w-full space-y-6 font-display">
                    <div className="relative">
                    <label className="font-bold text-lg mb-2 block">Caption</label>
                    <textarea value={caption} onChange={e => setCaption(e.target.value)} className="w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-2xl p-4 min-h-[120px]" placeholder="Write something..." />
                    <button onClick={handleEnhanceCaption} disabled={isEnhancingCaption || !caption} className="absolute top-0 right-0 text-xs bg-gradient-to-r from-[var(--accent-color)] to-[var(--secondary-color)] text-white px-3 py-1 rounded-full font-bold flex items-center gap-1 mt-2 mr-2 transform -translate-y-10">
                        <MagicWandIcon className="w-3 h-3" /> {isEnhancingCaption ? 'Enhancing...' : 'AI Enhance'}
                    </button>
                    </div>
                    {captionSources.length > 0 && (
                        <div className="text-xs opacity-60 bg-[var(--bg-color)] p-2 rounded-lg">
                            <p className="font-bold">Sources:</p>
                            {captionSources.map((s, i) => s.web?.uri && <a key={i} href={s.web.uri} target="_blank" className="block truncate text-[var(--accent-color)]">{s.web.title}</a>)}
                        </div>
                    )}
                    <div>
                        <label className="font-bold text-lg mb-2 block">Video Quality</label>
                        <div className="flex gap-2">
                            {QUALITY_OPTIONS.map(opt => (
                                <button key={opt.value} onClick={() => setVideoQuality(opt.value)} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${videoQuality === opt.value ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-color)] border border-[var(--border-color)]'}`}>
                                    {opt.label}
                                    <span className="block text-xs font-normal opacity-80">{opt.note}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
      </main>

       {isUploading && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-center items-center p-8 text-center transition-all duration-500">
            <div className={`relative transition-transform duration-500 ${uploadCompleted ? 'scale-110' : 'scale-100'}`}>
                {previewUrl && (
                    <img 
                        src={previewUrl} 
                        alt="upload preview" 
                        className={`w-32 h-48 object-cover rounded-2xl mb-6 transition-all duration-500 shadow-2xl ${uploadCompleted ? 'ring-4 ring-green-500' : 'ring-2 ring-white/20'}`} 
                    />
                )}
                {uploadCompleted && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                        <div className="bg-green-500 rounded-full p-2 shadow-lg animate-bounce">
                            <CheckIcon className="w-8 h-8 text-white" strokeWidth="4" />
                        </div>
                    </div>
                )}
            </div>

            <h2 className="text-3xl font-black text-white font-display mb-2 animate-pulse">{uploadCompleted ? 'Vibe Posted!' : 'Uploading Vibe...'}</h2>
            <p className="text-white/80 font-semibold text-lg min-h-[2rem] mb-6">{uploadStatusText}</p>
            
            <div className="w-full max-w-xs relative">
                <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden backdrop-blur-sm">
                     <div 
                        className={`h-full rounded-full transition-all duration-300 ease-linear ${uploadCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-[var(--accent-color)] to-[var(--secondary-color)] animate-pulse'}`}
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
                {!uploadCompleted && <p className="text-white/50 text-sm font-bold mt-2 text-right">{Math.round(uploadProgress)}%</p>}
            </div>

            {!uploadCompleted && (
                <button 
                    onClick={handleCancelUpload}
                    className="mt-8 text-white/60 hover:text-white font-bold py-2 px-6 rounded-full border-2 border-white/10 hover:bg-white/10 transition-all"
                >
                    Cancel
                </button>
            )}
        </div>
      )}
      {showDraftToast && <div className="absolute top-20 right-4 bg-green-500 text-white font-bold p-3 rounded-xl shadow-lg z-50">Draft Saved!</div>}
    </div>
  );
};

export default Upload;
