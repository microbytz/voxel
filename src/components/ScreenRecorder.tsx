import React, { useState, useEffect, useRef } from 'react';
import { Video, Square, Download, Trash2, Play, AlertCircle, HelpCircle, ChevronRight, ChevronLeft, RefreshCw, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ScreenRecorder() {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'preparing' | 'recording' | 'preview'>('idle');
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check support on mount
  useEffect(() => {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    setIsSupported(supported);
  }, []);

  // Timer effect
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (recordingState !== 'recording' && recordingState !== 'preview') {
        setRecordingDuration(0);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingState]);

  // Clean up object URLs to prevent leaks
  useEffect(() => {
    return () => {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [recordedUrl]);

  // Handle stream ending externally (e.g. user clicks "Stop sharing" on system ribbon)
  const handleStreamEnded = () => {
    stopRecording();
  };

  // Start Screen Recording
  const startRecording = async () => {
    setErrorMessage(null);
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    chunksRef.current = [];
    setRecordingState('preparing');

    try {
      // Options with helpful fallbacks for audio
      const options: DisplayMediaStreamOptions = {
        video: {
          displaySurface: "monitor",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(options);
      streamRef.current = stream;

      // Handle stream stop by user click on system bar
      stream.getVideoTracks().forEach(track => {
        track.addEventListener('ended', handleStreamEnded);
      });

      // Prefer a modern format that is highly compatible
      let recordingType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(recordingType)) {
        recordingType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(recordingType)) {
        recordingType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(recordingType)) {
        recordingType = ''; // browser-default
      }

      const recorder = new MediaRecorder(stream, recordingType ? { mimeType: recordingType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: recordingType || 'video/webm' });
        setRecordedBlob(finalBlob);
        const objectUrl = URL.createObjectURL(finalBlob);
        setRecordedUrl(objectUrl);
        setRecordingState('preview');

        // Stop all tracks to clean up device indicators
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Start recording with 1-second chunks for safety
      recorder.start(1000);
      setRecordingState('recording');
      setIsExpanded(true); // show full panel during recording
      playBeep(600, 0.1);
    } catch (err: any) {
      console.error("Screen capture failed:", err);
      setRecordingState('idle');

      let errorMsg = "Could not start screen capture. Please try again.";
      if (err.name === 'NotAllowedError') {
        errorMsg = "Permission denied. Please allow screen recording access when prompted!";
      } else if (err.toString().includes('permissions policy') || err.toString().includes('display-capture') || window.location !== window.parent.location) {
        errorMsg = "Browser Sandbox Restriction: Iframe embedding prevents screen capture here. To start recording, please click 'Open in New Tab' to load the full application independently, where it will work flawlessly!";
      }
      setErrorMessage(errorMsg);
    }
  };

  // Stop Screen Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      playBeep(450, 0.15);
    }
  };

  // Download video file
  const downloadVideo = () => {
    if (!recordedUrl) return;
    const a = document.createElement('a');
    a.href = recordedUrl;
    a.download = `Voxel_Portal_Stream_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    playBeep(750, 0.1);
  };

  // Reset states
  const discardRecording = () => {
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    chunksRef.current = [];
    setRecordingState('idle');
  };

  // Safe retro buzzer feedback
  const playBeep = (freq: number, duration: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not supported or blocked by user guest gestures
    }
  };

  // Render clean standard timer, e.g. 02:45
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="screen-recorder-container" className="fixed bottom-4 left-4 z-55 font-sans pointer-events-none select-none">
      <div className="flex flex-col items-start gap-2.5 pointer-events-auto">
        <AnimatePresence>
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="w-76 rounded-2xl bg-[#1b1c1e]/95 backdrop-blur-md border border-[#393B3D] p-4 shadow-2xl text-white overflow-hidden relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#323436] mb-3">
                <div className="flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span className="text-xs font-extrabold tracking-wider uppercase text-zinc-300">Creator Stream</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Minimize"
                >
                  Minimize
                </button>
              </div>

              {/* Error Warning Block */}
              {errorMessage && (
                <div className="p-2 mb-3 bg-red-950/40 border border-red-500/30 text-rose-400 rounded-lg text-[11px] leading-relaxed flex gap-1.5 items-start">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-500" />
                  <div className="flex-1 min-w-0">
                    <p>{errorMessage}</p>
                    <button 
                      onClick={() => window.open(window.location.href, '_blank')} 
                      className="text-[10px] text-zinc-200 underline mt-1 font-semibold block hover:text-white"
                    >
                      💡 Open in Direct Tab
                    </button>
                  </div>
                </div>
              )}

              {/* Interactive States */}
              {recordingState === 'idle' && (
                <div className="space-y-3.5">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Record your entire browser tab, game simulations, or customizable 2D/3D studios directly into a high-quality video clip!
                  </p>
                  
                  {!isSupported ? (
                    <div className="bg-amber-950/30 border border-amber-600/30 text-amber-400 p-2 rounded-lg text-[10px] flex gap-1.5 leading-relaxed">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>Recording APIs are disabled/limited in this browser environment. Try Chrome on Desktop.</span>
                    </div>
                  ) : (
                    <button
                      onClick={startRecording}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-950/20 active:scale-95 transition cursor-pointer"
                    >
                      <Video size={14} />
                      <span>Start Capturing Screen</span>
                    </button>
                  )}
                </div>
              )}

              {recordingState === 'preparing' && (
                <div className="text-center py-6 space-y-3">
                  <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Selecting Source...</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Please select the tab or screen window in the pop-up stream menu</p>
                  </div>
                </div>
              )}

              {recordingState === 'recording' && (
                <div className="space-y-3 bg-[#111214]/50 border border-zinc-800 p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping shrink-0" />
                      <span className="text-[11px] font-mono text-rose-400 uppercase tracking-widest font-bold">STREAM LIVE</span>
                    </div>
                    <span className="text-xs font-mono font-black text-rose-500 tracking-wider bg-rose-950/30 px-2 py-0.5 rounded border border-rose-900/30">
                      {formatTime(recordingDuration)}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-snug">Currently recording the workspace... Click stop once you finish.</p>
                  <button
                    onClick={stopRecording}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-rose-950/50 hover:text-rose-400 border border-zinc-700 hover:border-rose-900/40 text-zinc-200 font-bold rounded-lg text-xs transition active:scale-95 cursor-pointer"
                  >
                    <Square size={12} fill="currentColor" />
                    <span>Stop Recording Stream</span>
                  </button>
                </div>
              )}

              {recordingState === 'preview' && (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border border-zinc-700 bg-black aspect-video flex items-center justify-center">
                    {recordedUrl ? (
                      <video 
                        src={recordedUrl} 
                        controls 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-mono">Stream saved</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadVideo}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold rounded-lg hover:shadow-lg transition active:scale-95 cursor-pointer"
                      title="Save recording to downloads folder"
                    >
                      <Download size={13} />
                      <span>Save / Download</span>
                    </button>
                    <button
                      onClick={discardRecording}
                      className="flex items-center justify-center p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 border border-zinc-700 rounded-lg transition active:scale-95 cursor-pointer"
                      title="Discard and restart"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Collapsed tiny floating launcher button */
            <motion.button
              layoutId="screen-recorder-pill"
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-full shadow-lg border border-rose-500/30 hover:scale-105 active:scale-95 cursor-pointer transition-transform duration-150"
              title="Record gameplay or studio creation clip"
            >
              <Video className="w-4 h-4" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Stream Stream</span>
              {recordingState === 'recording' && (
                <span className="w-2 h-2 bg-white rounded-full animate-ping shrink-0" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
