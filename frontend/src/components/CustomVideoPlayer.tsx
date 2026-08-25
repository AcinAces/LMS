'use client';

import React, { useState, useEffect, useRef } from 'react';
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube';

interface CustomVideoPlayerProps {
  videoId: string;
  initialLastWatched: number;
  initialMaxWatched: number;
  isCompleted: boolean;
  onProgressSync: (lastWatched: number, maxWatched: number, completed: boolean) => void;
  isStaff?: boolean;
}

export default function CustomVideoPlayer({
  videoId,
  initialLastWatched,
  initialMaxWatched,
  isCompleted,
  onProgressSync,
  isStaff = false,
}: CustomVideoPlayerProps) {
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qualities, setQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  
  const [maxWatched, setMaxWatched] = useState(initialMaxWatched);
  const [completed, setCompleted] = useState(isCompleted);

  // Keep local completed state in sync with parent prop
  useEffect(() => {
    setCompleted(isCompleted);
  }, [isCompleted]);

  // Auto-hide controls
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Setup options to completely hide native UI
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1, // Instantly start playing (which also hides the title)
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      showinfo: 0, // Note: YouTube deprecated this, but autoplay hides it
      iv_load_policy: 3,
      playsinline: 1,
      start: initialLastWatched,
    },
  };

  const onReady = (event: YouTubeEvent) => {
    setPlayer(event.target);
    setDuration(event.target.getDuration());
    // Force play as a fallback for some browsers
    event.target.playVideo();
  };

  const onStateChange = (event: YouTubeEvent) => {
    // Playing
    if (event.data === 1) {
      setIsPlaying(true);
      const availableQualities = event.target.getAvailableQualityLevels();
      if (availableQualities && availableQualities.length > 0) {
        setQualities(availableQualities);
      }
      setCurrentQuality(event.target.getPlaybackQuality());
    }
    // Paused or Ended
    else {
      setIsPlaying(false);
    }
  };

  const onPlaybackQualityChange = (event: YouTubeEvent) => {
    setCurrentQuality(event.target.getPlaybackQuality());
  };

  // The main tracking loop
  useEffect(() => {
    if (!player || !isPlaying) return;

    syncInterval.current = setInterval(async () => {
      const time = await player.getCurrentTime();
      setCurrentTime(time);

      // Anti-cheat: prevent skipping if not completed
      // Allowed jump must scale with playback speed (e.g. 3x speed = 3 seconds per second + buffer)
      const allowedJump = Math.max(2, playbackRate * 2);
      
      if (!completed && time > maxWatched + allowedJump) {
        // If they somehow skipped ahead more than the allowed buffer, snap back
        player.seekTo(maxWatched);
      } else {
        if (time > maxWatched) setMaxWatched(time);
      }

      // Check for completion (95% watched)
      if (!completed && duration > 0 && time / duration > 0.95) {
        setCompleted(true);
      }

      // Sync with parent every ~5 seconds
      onProgressSync(time, Math.max(time, maxWatched), completed || (time / duration > 0.95));
      
    }, 1000);

    return () => {
      if (syncInterval.current) clearInterval(syncInterval.current);
    };
  }, [player, isPlaying, maxWatched, completed, duration, playbackRate, onProgressSync]);

  // Idle controls logic
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1500);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) setShowControls(false);
  };

  // Always show controls when paused
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    } else {
      handleMouseMove(); // Start timer immediately upon playing
    }
    
    return () => {
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return;
    const newTime = parseFloat(e.target.value);

    // If not completed and not staff, prevent skipping past maxWatched
    if (!completed && !isStaff && newTime > maxWatched) {
      // Snap to maxWatched
      player.seekTo(maxWatched);
      setCurrentTime(maxWatched);
    } else {
      player.seekTo(newTime);
      setCurrentTime(newTime);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!player) return;
    const speed = parseFloat(e.target.value);
    setPlaybackRate(speed);
    player.setPlaybackRate(speed);
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!player) return;
    const q = e.target.value;
    player.setPlaybackQuality(q);
    setCurrentQuality(q);
  };

  const formatQuality = (q: string) => {
    const map: Record<string, string> = {
      highres: '4K',
      hd2160: '4K',
      hd1440: '1440p',
      hd1080: '1080p',
      hd720: '720p',
      large: '480p',
      medium: '360p',
      small: '240p',
      tiny: '144p',
      auto: 'Auto'
    };
    return map[q] || q;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Gracefully extract the 11-character ID if the database has a full URL
  const extractVideoId = (urlOrId: string) => {
    if (!urlOrId) return '';
    if (urlOrId.length === 11 && !urlOrId.includes('http')) return urlOrId;
    const match = urlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/);
    return match ? match[1] : urlOrId;
  };

  const parsedVideoId = extractVideoId(videoId);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      await document.exitFullscreen().catch(err => console.error(err));
    }
  };

  return (
    <div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group border border-white/10 ${!showControls && isPlaying ? 'cursor-none' : ''}`}
    >
      
      {/* Video Container */}
      <div className="absolute inset-0 pointer-events-none">
        <YouTube 
          videoId={parsedVideoId} 
          opts={opts} 
          onReady={onReady} 
          onStateChange={onStateChange} 
          onPlaybackQualityChange={onPlaybackQualityChange}
          className="w-full h-full"
          iframeClassName="w-full h-full"
        />
      </div>

      {/* Invisible overlay to block native clicking on iframe */}
      <div className="absolute inset-0 z-10" onClick={togglePlay}></div>

      {/* Custom Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        
        {/* Timeline */}
        <div className="flex items-center gap-4 mb-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${completed ? 'bg-emerald-500/50' : 'bg-blue-500/50'}`}
            style={{
              background: `linear-gradient(to right, ${completed ? '#10b981' : '#3b82f6'} ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`
            }}
          />
        </div>

        {/* Buttons & Info */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePlay}
              className="hover:text-emerald-400 transition-colors focus:outline-none"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <div className="text-sm font-mono tracking-wider">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-semibold">
            {/* Quality Control (Only show if multiple qualities exist) */}
            {qualities.length > 1 && (
              <select
                value={currentQuality}
                onChange={handleQualityChange}
                className="bg-black/50 border border-white/20 text-white rounded px-2 py-1 outline-none focus:border-emerald-500 cursor-pointer appearance-none hover:bg-black/80 transition-colors"
              >
                {!qualities.includes('auto') && <option value="auto">Auto</option>}
                {qualities.map(q => (
                  <option key={q} value={q}>{formatQuality(q)}</option>
                ))}
              </select>
            )}

            {/* Speed Control */}
            <select
              value={playbackRate}
              onChange={handleSpeedChange}
              className="bg-black/50 border border-white/20 text-white rounded px-2 py-1 outline-none focus:border-emerald-500 cursor-pointer appearance-none hover:bg-black/80 transition-colors"
            >
              <option value="0.25">0.25x</option>
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="1.75">1.75x</option>
              <option value="2">2x</option>
              <option value="2.5">2.5x</option>
              <option value="3">3x</option>
            </select>

            {!isStaff && (
              completed ? (
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  COMPLETED
                </span>
              ) : (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                  IN PROGRESS
                </span>
              )
            )}

            {/* Fullscreen Button */}
            <button 
              onClick={toggleFullscreen}
              className="hover:text-emerald-400 transition-colors focus:outline-none ml-2"
            >
              {isFullscreen ? (
                // Exit Fullscreen Icon
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                </svg>
              ) : (
                // Enter Fullscreen Icon
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}