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
  AlertCircle,
  Clock,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Plus
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
  
  // Collapse / Expand toggleable state
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Custom audio elements state (to avoid raw native players)
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({});
  const [audioDurations, setAudioDurations] = useState<{ [key: string]: number }>({});

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  
  // Dynamic audio stream analysis (for volume visualizer)
  const [micVolume, setMicVolume] = useState<number[]>(new Array(12).fill(2));
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
    setIsExpanded(true);
    setErrorMessage(null);
    audioChunksRef.current = [];
    setRecordingDuration(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("دستگاه شما از قابلیت ضبط صدا در مرورگر پشتیبانی نمی‌کند.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;

        const jNode = audioCtx.createScriptProcessor(2048, 1, 1);

        source.connect(analyser);
        analyser.connect(jNode);
        jNode.connect(audioCtx.destination);

        jNode.onaudioprocess = () => {
          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          let values = 0;
          for (let i = 0; i < array.length; i++) {
            values += array[i];
          }
          const average = values / array.length;
          setMicVolume(prev => {
            const next = [...prev.slice(1), Math.max(3, Math.min(24, Math.round(average / 3)))];
            return next;
          });
        };

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        javascriptNodeRef.current = jNode;
      } catch (vizErr) {
        console.warn("Failed to init audio analyzer:", vizErr);
      }

      let options = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/ogg" };
        if (!MediaRecorder.isTypeSupported("audio/ogg")) {
          options = { mimeType: "" };
        }
      }

      const mediaRecorder = options.mimeType ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        stream.getTracks().forEach(track => track.stop());

        if (!(mediaRecorder as any).recordingCancelled) {
          try {
            const noteId = `note_${Date.now()}`;
            const savedNote = await saveAudioNoteInDB(
              fileId,
              noteId,
              audioBlob,
              recordingDuration,
              Date.now(),
              newNoteText.trim() || `یادداشت صوتی شماره ${notes.length + 1}`
            );
            setNotes(prev => [savedNote, ...prev]);
            setNewNoteText("");
          } catch (e: any) {
            console.error(e);
            setErrorMessage("خطا در ذخیره‌سازی فایل صوتی در پایگاه داده محلی");
          }
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("دسترسی به میکروفون توسط کاربر صادر نشد.");
      } else {
        setErrorMessage("راه اندازی میکروفون با خطا مواجه گردید: " + (err.message || "ناشناخته"));
      }
      setIsRecording(false);
    }
  };

  const stopRecordingSession = (cancel: boolean = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      (mediaRecorderRef.current as any).recordingCancelled = cancel;
      mediaRecorderRef.current.stop();
    }

    if (javascriptNodeRef.current) {
      javascriptNodeRef.current.disconnect();
      javascriptNodeRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
  };

  const startAudioPlayback = (note: AudioNote) => {
    if (playingNoteId === note.id && audioPlayerRef.current) {
      if (audioPlayerRef.current.paused) {
        audioPlayerRef.current.play();
      } else {
        audioPlayerRef.current.pause();
        setPlayingNoteId(null);
      }
      return;
    }

    stopAudioPlayback();

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

    player.play().catch(e => {
      console.error("Playback error:", e);
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

  const handleSeek = (noteId: string, percentage: number) => {
    if (audioPlayerRef.current && playingNoteId === noteId) {
      const duration = audioPlayerRef.current.duration || 1;
      audioPlayerRef.current.currentTime = (percentage / 100) * duration;
      setAudioProgress(prev => ({ ...prev, [noteId]: percentage }));
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (playingNoteId === id) {
      stopAudioPlayback();
    }
    try {
      await deleteAudioNoteFromDB(fileId, id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
      setErrorMessage("خطا در حذف یادداشت صوتی");
    }
  };

  const handleDownloadNote = (note: AudioNote, idx: number) => {
    const a = document.createElement("a");
    a.href = note.url;
    a.download = `AudioNote_${fileName.replace(/\.[^/.]+$/, "")}_${idx + 1}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const startEditing = (note: AudioNote) => {
    setEditingNoteId(note.id);
    setTempNoteText(note.noteText || "");
  };

  const saveEditedText = async (noteId: string) => {
    try {
      await updateAudioNoteTextInDB(fileId, noteId, tempNoteText.trim());
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, noteText: tempNoteText.trim() } : n));
      setEditingNoteId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTimeStr = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`rounded-xl border shadow-xs transition-all duration-200 overflow-hidden ${
      isDarkMode 
        ? "bg-[#111827] border-slate-800" 
        : "bg-white border-slate-200"
    }`}>
      {/* Minimalist Interactive Header Bar (Optional / Toggleable) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`px-3 py-2 flex items-center justify-between gap-2 cursor-pointer select-none transition-colors ${
          isDarkMode 
            ? "hover:bg-slate-800/60" 
            : "hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg shrink-0 ${
            isRecording 
              ? "bg-rose-500 text-white animate-pulse" 
              : isDarkMode ? "bg-rose-500/15 text-rose-400" : "bg-rose-50 text-rose-600"
          }`}>
            <Mic className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[11px] font-black truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
              یادداشت صوتی
            </span>
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
              notes.length > 0 
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
            }`}>
              {notes.length.toLocaleString("fa-IR")} ضمیمه
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {!isRecording && (
            <button
              type="button"
              onClick={startRecordingSession}
              className="px-2.5 py-1 text-[9.5px] font-black rounded-lg text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>ضبط صدا</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"
            }`}
            title={isExpanded ? "بستن پنل صوتی" : "باز کردن پنل صوتی"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Minimalist Content */}
      {isExpanded && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2.5 transition-all">
          {errorMessage && (
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-[10px] font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Minimalist Active Recording Bar */}
          {isRecording ? (
            <div className="p-2.5 rounded-xl border bg-rose-500/5 border-rose-500/20 flex flex-col gap-2" dir="rtl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold">در حال ضبط...</span>
                  <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-200">
                    <Clock className="w-3 h-3 text-rose-500" />
                    <span>{formatTimeStr(recordingDuration)}</span>
                  </div>
                </div>

                {/* Micro Audio Spectrum Bars */}
                <div className="flex items-end gap-0.5 h-4">
                  {micVolume.map((vol, index) => (
                    <div 
                      key={index} 
                      className="w-[3px] bg-rose-500 rounded-t-full transition-all duration-75"
                      style={{ height: `${Math.max(3, vol / 1.5)}px` }}
                    />
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="توضیح اختیاری..."
                maxLength={80}
                className={`text-[9.5px] py-1 px-2.5 rounded-lg border outline-none font-sans w-full ${
                  isDarkMode 
                    ? "bg-[#0b0f19] border-slate-800 text-slate-100 placeholder:text-slate-600" 
                    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                }`}
              />

              <div className="flex gap-1.5 w-full">
                <button
                  type="button"
                  onClick={() => stopRecordingSession(false)}
                  className="flex-1 py-1 text-[9.5px] font-black rounded-lg text-white bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                >
                  <Square className="h-3 w-3 fill-white" />
                  <span>ذخیره ضبط</span>
                </button>
                <button
                  type="button"
                  onClick={() => stopRecordingSession(true)}
                  className={`px-2.5 py-1 text-[9.5px] font-bold rounded-lg border cursor-pointer ${
                    isDarkMode 
                      ? "border-slate-800 text-slate-400 hover:bg-slate-800" 
                      : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : notes.length > 0 && (
            <div className="flex items-center gap-1.5" dir="rtl">
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="عنوان یادداشت صوتی بعدی..."
                maxLength={80}
                className={`text-[9.5px] py-1 px-2.5 rounded-lg border outline-none font-sans flex-1 ${
                  isDarkMode 
                    ? "bg-[#0b0f19] border-slate-800 text-slate-100 placeholder:text-slate-600" 
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                }`}
              />
              <button
                type="button"
                onClick={startRecordingSession}
                className="px-2.5 py-1 text-[9.5px] font-black rounded-lg text-white bg-rose-600 hover:bg-rose-500 shrink-0 flex items-center gap-1 shadow-xs transition-all cursor-pointer"
              >
                <Mic className="w-3 h-3" />
                <span>ضبط جدید</span>
              </button>
            </div>
          )}

          {/* Minimalist Audio List */}
          <div className="max-h-[160px] overflow-y-auto space-y-1.5 dir-rtl pr-0.5" dir="rtl">
            {isLoading ? (
              <div className="text-center py-2 text-slate-400 text-[9.5px]">درحال دریافت یادداشت‌ها...</div>
            ) : notes.length === 0 && !isRecording ? (
              <div className="text-center py-3 text-[9.5px] text-slate-400 font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                هیچ ضمیمه صوتی ثبت نشده است. جهت ضبط روی دکمه «ضبط صدا» کلیک کنید.
              </div>
            ) : (
              notes.map((note, index) => {
                const isPlaying = playingNoteId === note.id;
                const progress = audioProgress[note.id] || 0;
                const duration = audioDurations[note.id] || note.duration || 0;

                return (
                  <div 
                    key={note.id} 
                    className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${
                      isPlaying 
                        ? isDarkMode ? "bg-rose-500/10 border-rose-500/30" : "bg-rose-50 border-rose-200"
                        : isDarkMode ? "bg-slate-900/50 border-slate-800 hover:bg-slate-900" : "bg-slate-50 border-slate-200/80 hover:bg-white"
                    }`}
                  >
                    {/* Play/Pause Button */}
                    <button
                      type="button"
                      onClick={() => startAudioPlayback(note)}
                      className={`p-1.5 rounded-lg shrink-0 transition-colors cursor-pointer ${
                        isPlaying 
                          ? "bg-rose-600 text-white" 
                          : isDarkMode ? "bg-slate-800 text-slate-300 hover:text-white" : "bg-white text-slate-700 hover:bg-slate-100 shadow-2xs"
                      }`}
                    >
                      {isPlaying ? <Pause className="h-3 w-3 fill-white" /> : <Play className="h-3 w-3 fill-current" />}
                    </button>

                    {/* Content & Progress */}
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-1">
                        {editingNoteId === note.id ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="text"
                              value={tempNoteText}
                              onChange={(e) => setTempNoteText(e.target.value)}
                              className="text-[9px] py-0.5 px-1.5 rounded border outline-none font-sans w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditedText(note.id);
                                if (e.key === "Escape") setEditingNoteId(null);
                              }}
                            />
                            <button onClick={() => saveEditedText(note.id)} className="p-0.5 text-emerald-500"><Check className="h-3 w-3" /></button>
                            <button onClick={() => setEditingNoteId(null)} className="p-0.5 text-slate-400"><X className="h-3 w-3" /></button>
                          </div>
                        ) : (
                          <span 
                            onClick={() => startEditing(note)}
                            className="text-[9.5px] font-extrabold text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:text-rose-500 transition-colors"
                            title="برای ویرایش نام کلیک کنید"
                          >
                            {note.noteText || `یادداشت ${notes.length - index}`}
                          </span>
                        )}

                        <span className="text-[8.5px] font-mono text-slate-400 shrink-0">
                          {formatTimeStr(duration)}
                        </span>
                      </div>

                      {/* Mini Track Bar */}
                      <div className="relative group flex items-center h-1.5 w-full">
                        <div className="h-1 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
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
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadNote(note, notes.length - index - 1)}
                        className="p-1 text-slate-400 hover:text-blue-500 rounded cursor-pointer"
                        title="دانلود"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
