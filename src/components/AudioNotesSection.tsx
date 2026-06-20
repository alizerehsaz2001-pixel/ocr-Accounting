import React, { useState, useEffect, useRef } from "react";
import { 
  getAudioNotesFromDB, 
  saveAudioNoteInDB, 
  deleteAudioNoteFromDB, 
  updateAudioNoteTextInDB,
  AudioNote 
} from "../utils/audioStorage";
import { 
  Mic, 
  Square, 
  Trash2, 
  Play, 
  Pause, 
  Download, 
  StickyNote,
  AlertCircle,
  Clock,
  Check,
  X,
  Volume2
} from "lucide-react";

interface AudioNotesSectionProps {
  fileId: string;
  fileName: string;
  isDarkMode: boolean;
  onNotesCountChange?: (count: number) => void;
}

export default function AudioNotesSection({ 
  fileId, 
  fileName,
  isDarkMode, 
  onNotesCountChange 
}: AudioNotesSectionProps) {
  const [notes, setNotes] = useState<AudioNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Custom audio elements state (to avoid raw native players)
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({});
  const [audioDurations, setAudioDurations] = useState<{ [key: string]: number }>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Dynamic audio stream analysis (for volume visualizer)
  const [micVolume, setMicVolume] = useState<number[]>(new Array(15).fill(2));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const javascriptNodeRef = useRef<ScriptProcessorNode | null>(null);

  // Load notes on fileId change
  useEffect(() => {
    loadNotes();
    // Stop any ongoing audio
    stopAudioPlayback();
    // Stop recording if active
    if (isRecording) {
      stopRecordingSession(true); // silent cancel
    }
  }, [fileId]);

  // Sync count to parent
  useEffect(() => {
    if (onNotesCountChange) {
      onNotesCountChange(notes.length);
    }
  }, [notes]);

  const loadNotes = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getAudioNotesFromDB(fileId);
      setNotes(data);
    } catch (e: any) {
      console.error(e);
      setErrorMessage("خطا در بارگذاری یادداشت‌های صوتی از حافظه محلی");
    } finally {
      setIsLoading(false);
    }
  };

  // Start Voice Recording Session
  const startRecordingSession = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];
    setRecordingDuration(0);

    try {
      // Check browser permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Visual Analyzer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const jNode = audioCtx.createScriptProcessor(2048, 1, 1);
        analyser.connect(jNode);
        jNode.connect(audioCtx.destination);
        
        jNode.onaudioprocess = () => {
          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          // Convert frequency ranges to a small visual array
          const volumeData = Array.from(array)
            .slice(0, 15)
            .map(val => Math.max(2, Math.floor((val / 255) * 24)));
          setMicVolume(volumeData);
        };

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        javascriptNodeRef.current = jNode;
      } catch (vizErr) {
        console.warn("Failed to init audio analyzer dashboard:", vizErr);
      }

      // Configure Media Recorder
      let options = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/ogg" };
        if (!MediaRecorder.isTypeSupported("audio/ogg")) {
          options = { mimeType: "" }; // default fallback
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        const noteId = Date.now().toString();
        const timestamp = Date.now();
        const duration = recordingDuration > 0 ? recordingDuration : 1;

        try {
          // Save to IndexedDB
          const savedNote = await saveAudioNoteInDB(
            fileId, 
            noteId, 
            audioBlob, 
            duration, 
            timestamp, 
            newNoteText.trim() || undefined
          );

          setNotes(prev => [savedNote, ...prev]);
          setNewNoteText("");
        } catch (saveErr) {
          console.error(saveErr);
          setErrorMessage("خطا در ذخیره‌سازی فایل صوتی سوابق.");
        }

        // Clean up visual stream channels
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(250); // chunk size 250ms
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("دسترسی به میکروفون رد شد. لطفاً دسترسی به میکروفون را از تنظیمات مرورگر خود فعال کنید.");
      } else {
        setErrorMessage("میکروفون یا ورودی صوتی روی این سیستم شناسایی نشد.");
      }
    }
  };

  // Stop Recording Session
  const stopRecordingSession = (cancel: boolean = false) => {
    // Stop recording timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Clean up Audio Analyzer nodes
    try {
      if (javascriptNodeRef.current && analyserRef.current) {
        javascriptNodeRef.current.disconnect();
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    } catch (cleanErr) {
      console.warn("Clean analyzer error:", cleanErr);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      if (cancel) {
        // override onstop
        mediaRecorderRef.current.onstop = () => {
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        };
      }
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    if (cancel) {
      setNewNoteText("");
    }
  };

  // Audio Playback Engine
  const startAudioPlayback = (note: AudioNote) => {
    if (playingNoteId === note.id) {
      stopAudioPlayback();
      return;
    }

    stopAudioPlayback(); // reset previous playbacks

    const player = new Audio(note.url);
    audioPlayerRef.current = player;
    setPlayingNoteId(note.id);

    player.onloadedmetadata = () => {
      setAudioDurations(prev => ({ ...prev, [note.id]: player.duration }));
    };

    player.ontimeupdate = () => {
      setAudioProgress(prev => ({ 
        ...prev, 
        [note.id]: (player.currentTime / (player.duration || 1)) * 100 
      }));
    };

    player.onended = () => {
      setPlayingNoteId(null);
      setAudioProgress(prev => ({ ...prev, [note.id]: 0 }));
    };

    player.onerror = () => {
      setErrorMessage("امکان بازپخش فایل صوتی وجود ندارد.");
      setPlayingNoteId(null);
    };

    player.play().catch(playbackErr => {
      console.error(playbackErr);
      setPlayingNoteId(null);
    });
  };

  const stopAudioPlayback = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setPlayingNoteId(null);
  };

  // Seek Progress bar
  const handleSeek = (noteId: string, percentage: number) => {
    if (audioPlayerRef.current && playingNoteId === noteId) {
      const duration = audioPlayerRef.current.duration || 1;
      audioPlayerRef.current.currentTime = (percentage / 100) * duration;
      setAudioProgress(prev => ({ ...prev, [noteId]: percentage }));
    }
  };

  // Format Dynamic duration
  const formatTimeStr = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Delete Voice note
  const handleDeleteNote = async (id: string) => {
    if (playingNoteId === id) {
      stopAudioPlayback();
    }
    try {
      await deleteAudioNoteFromDB(fileId, id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
      setErrorMessage("امکان حذف یادداشت صوتی فراهم نشد.");
    }
  };

  // Downloader
  const handleDownloadNote = async (note: AudioNote, idx: number) => {
    try {
      const response = await fetch(note.url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `voice-memo-${fileName.split('.')[0] || "doc"}-${idx + 1}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      setErrorMessage("دانلود فایل یادداشت صوتی با مشکل مواجه شد.");
    }
  };

  // Update voice note comment text inline
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");

  const startEditing = (note: AudioNote) => {
    setEditingNoteId(note.id);
    setTempNoteText(note.noteText || "");
  };

  const saveEditedText = async (noteId: string) => {
    try {
      await updateAudioNoteTextInDB(fileId, noteId, tempNoteText.trim());
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, noteText: tempNoteText.trim() || undefined } : n));
      setEditingNoteId(null);
    } catch (e) {
      console.error(e);
      setErrorMessage("امکان به‌روزرسانی یادداشت نوشتاری وجود ندارد.");
    }
  };

  return (
    <div className={`rounded-xl border shadow-sm p-4 flex flex-col transition-all duration-300 ${
      isDarkMode 
        ? "bg-[#1E293B] border-slate-800" 
        : "bg-white border-slate-200"
    }`}>
      {/* Title */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
            <Mic className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <div>
            <h3 className={`text-xs font-extrabold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
              یادداشت صوتی و ضمایم شفاهی سند
            </h3>
            <p className="text-[9px] text-slate-400 font-medium mt-0.5">ثبت دستورالعمل‌ها، مغایرت‌ها یا توضیحات حسابدار روی سند جاری</p>
          </div>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
          notes.length > 0 
            ? isDarkMode ? "bg-rose-500/20 text-rose-400" : "bg-rose-50 text-rose-600"
            : isDarkMode ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"
        }`}>
          {notes.length.toLocaleString("fa-IR")} یادداشت صوتی
        </span>
      </div>

      {errorMessage && (
        <div className="p-2.5 mb-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-medium flex items-start gap-1.5 leading-relaxed" dir="rtl">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Recording Studio Panel */}
      <div className={`p-4 rounded-xl mb-4 border transition-all ${
        isRecording 
          ? "bg-rose-500/5 border-rose-500/20 shadow-inner" 
          : isDarkMode ? "bg-slate-950/20 border-slate-800/60" : "bg-slate-50 border-slate-150"
      }`}>
        {isRecording ? (
          <div className="flex flex-col items-center gap-3">
            {/* Visualizer and Time counter */}
            <div className="flex items-center gap-4 justify-between w-full" dir="rtl">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">در حال ضبط صدا...</span>
              </div>
              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-mono font-bold text-xs">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span>{formatTimeStr(recordingDuration)}</span>
              </div>
            </div>

            {/* Simulated Live Mic Analyzer bars */}
            <div className="flex items-end gap-0.5 justify-center h-8 my-2 min-w-[120px]">
              {micVolume.map((vol, index) => (
                <div 
                  key={index} 
                  className={`w-[4px] rounded-t-full transition-all duration-75 ${
                    isDarkMode ? "bg-rose-500" : "bg-rose-600"
                  }`}
                  style={{ height: `${vol}px`, opacity: 0.3 + (vol / 24) * 0.7 }}
                />
              ))}
            </div>

            {/* Note text field for current recording */}
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="توضیحات کوتاه ضمیمه صوتی (اختیاری)..."
              maxLength={120}
              className={`text-[10px] py-1.5 px-3 rounded-lg border outline-none font-sans w-full focus:ring-1 focus:ring-rose-500 font-medium ${
                isDarkMode 
                  ? "bg-[#0b0f19] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-rose-500" 
                  : "bg-white border-slate-250 text-slate-900 placeholder:text-slate-400 focus:border-rose-600"
              }`}
              dir="rtl"
            />

            {/* Action buttons */}
            <div className="flex gap-2 w-full mt-2 justify-center">
              <button
                onClick={() => stopRecordingSession(false)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-lg text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow transition-all leading-none"
              >
                <Square className="h-3 w-3 fill-white" />
                <span>پایان و ذخیره</span>
              </button>
              <button
                onClick={() => stopRecordingSession(true)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors border ${
                  isDarkMode 
                    ? "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200" 
                    : "border-slate-200 bg-white text-slate-500 hover:text-slate-700"
                }`}
              >
                <span>لغو ضبط</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-1 text-center" dir="rtl">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-[11px] font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                ضبط صدای حسابدار
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">
                برای افزودن دستورالعمل یا یادداشت صوتی دکمه زیر را بفشارید.
              </p>
            </div>
            
            {/* Note text field (can fill before recording too) */}
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="توضیح صوتی درباره چیست؟ (مثال: بررسی تایید ممیز مالیاتی)..."
              maxLength={120}
              className={`text-[10px] py-1.5 px-3 rounded-lg border outline-none font-sans w-full focus:ring-1 focus:ring-rose-500 font-medium ${
                isDarkMode 
                  ? "bg-[#0b0f19] border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-rose-500" 
                  : "bg-white border-slate-250 text-slate-950 placeholder:text-slate-400 focus:border-rose-600"
              }`}
            />

            <button
              onClick={startRecordingSession}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-[10px] font-extrabold rounded-xl text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow transition-all leading-none focus:outline-none"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>شروع ضبط صوت جدید</span>
            </button>
          </div>
        )}
      </div>

      {/* Voice Notes Archive List */}
      <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 space-y-2" dir="rtl">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-slate-450 text-[10px] font-medium">
            <span className="h-4 w-4 animate-spin rounded-full border border-slate-500 border-t-transparent mr-2" />
            <span>درحال بارگذاری سوابق صوتی...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl">
            <StickyNote className="h-6 w-6 mx-auto text-slate-300 dark:text-slate-700 mb-1" />
            <span className="text-[10px] text-slate-400 block font-medium">هیچ ضمیمه صوتی برای این سند ثبت نشده است.</span>
          </div>
        ) : (
          notes.map((note, index) => {
            const isPlaying = playingNoteId === note.id;
            const progress = audioProgress[note.id] || 0;
            const duration = audioDurations[note.id] || note.duration || 0;
            const dateStr = new Date(note.timestamp).toLocaleDateString("fa-IR", {
              hour: '2-digit', minute: '2-digit'
            });

            return (
              <div 
                key={note.id} 
                className={`p-3 rounded-xl border transition-all ${
                  isPlaying 
                    ? isDarkMode ? "bg-rose-500/5 border-rose-500/20" : "bg-rose-50/50 border-rose-100"
                    : isDarkMode ? "bg-slate-950/20 border-slate-800/50 hover:bg-slate-950/40" : "bg-white border-slate-100 hover:shadow-xs"
                }`}
              >
                {/* Note title / description and delete */}
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    {editingNoteId === note.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tempNoteText}
                          onChange={(e) => setTempNoteText(e.target.value)}
                          className={`text-[10px] py-0.5 px-2 rounded border outline-none font-sans w-full ${
                            isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-350 text-slate-950"
                          }`}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditedText(note.id);
                            if (e.key === "Escape") setEditingNoteId(null);
                          }}
                        />
                        <button 
                          onClick={() => saveEditedText(note.id)} 
                          className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                          title="تایید"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => setEditingNoteId(null)} 
                          className="p-1 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                          title="انصراف"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="group flex items-center gap-1.5">
                        <span 
                          onClick={() => startEditing(note)}
                          className={`text-[10px] font-extrabold cursor-pointer hover:text-rose-500 transition-colors ${
                            isDarkMode ? "text-slate-200" : "text-slate-800"
                          } truncate max-w-[170px]`}
                          title="برای ویرایش توضیح کلیک کنید"
                        >
                          {note.noteText || `یادداشت صوتی شماره ${notes.length - index}`}
                        </span>
                        <span className="text-[8px] text-slate-400 shrink-0 font-medium font-sans">
                          ({dateStr})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions (Delete, Download) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDownloadNote(note, notes.length - index - 1)}
                      className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                      title="دانلود فایل صوتی"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                      title="حذف یادداشت صوتی"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Customized Player Controller */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startAudioPlayback(note)}
                    className={`p-2 rounded-lg shrink-0 transition-colors flex items-center justify-center ${
                      isPlaying 
                        ? "bg-rose-500 text-white animate-pulse" 
                        : isDarkMode ? "bg-slate-800 text-slate-300 hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5 fill-white" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  </button>

                  {/* Slider progression bar */}
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[9px] font-mono text-slate-500 shrink-0">{formatTimeStr(isPlaying ? (audioPlayerRef.current?.currentTime || 0) : 0)}</span>
                    <div className="flex-1 relative group py-1">
                      <div className={`h-1 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                        <div 
                          className="h-full bg-rose-500 transition-all rounded-full" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => handleSeek(note.id, parseFloat(e.target.value))}
                        disabled={!isPlaying}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 shrink-0">{formatTimeStr(duration)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
