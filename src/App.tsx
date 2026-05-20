import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import profilePicUrl from './assets/profile.jpg' 

import { 
  FaClipboardList, FaCheck, FaTimes, FaChartPie, FaFolderOpen, 
  FaCamera,FaClock, FaTrash, FaSeedling, FaStar, FaFire, 
  FaTrophy, FaHeart, FaFingerprint, FaImage, FaSearch, FaCalendarAlt, 
  FaExclamationTriangle, FaSyncAlt, FaMoon, FaSun, FaMicrophone, 
  FaDownload, FaUpload, FaPlus, FaMagic, FaHeadphones, FaGithub, FaRunning, FaCloudUploadAlt
} from 'react-icons/fa' 
import { GrLike } from 'react-icons/gr'

type SubTask = { id: number; text: string; isCompleted: boolean }

type Task = {
  id: number
  title: string
  status: 'todo' | 'doing' | 'done' | 'failed'
  category: string
  notes: string 
  image?: string 
  priority: 'low' | 'medium' | 'high' 
  dueDate: string | null              
  isDaily: boolean
  subtasks?: SubTask[] 
  completedAt?: string // FITUR BARU: Track tanggal selesai untuk Heatmap
}

type ColumnType = 'todo' | 'doing' | 'done' | 'failed'
type PriorityType = 'low' | 'medium' | 'high'

const CATEGORIES = ['Tugas Kuliah', 'Olahraga', 'Tugas Rumah', 'Pekerjaan', 'Organisasi', 'Lainnya']

const columnConfig: Record<ColumnType, { title: string; emoji: ReactNode; glowColor: string; borderColor: string }> = {
  todo: { title: 'Lagi Ngerjain Bang', emoji: <FaClipboardList className="inline mb-1 mr-2" size={18} />, glowColor: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]', borderColor: 'border-pink-500' },
  doing: { title: 'Sabarr Gillaaaa', emoji: <GrLike className="inline mb-1 mr-2" size={18} />, glowColor: 'hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]', borderColor: 'border-yellow-500' },
  done: { title: 'Udahan Gila', emoji: <FaCheck className="inline mb-1 mr-2" size={18} />, glowColor: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]', borderColor: 'border-green-500' },
  failed: { title: 'Masa Gagal Si Dia', emoji: <FaTimes className="inline mb-1 mr-2" size={18} />, glowColor: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]', borderColor: 'border-red-500' }
}

const columns: ColumnType[] = ['todo', 'doing', 'done', 'failed'] 

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('my-todo-tasks')
    return saved ? JSON.parse(saved) : []
  })

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('my-todo-theme') === 'dark')
  const [exp, setExp] = useState(() => parseInt(localStorage.getItem('my-todo-exp') || '0'))
  const [isZenMode, setIsZenMode] = useState(false) // FITUR BARU: Zen Mode
  
  const [inputValue, setInputValue] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0])
  const [inputImage, setInputImage] = useState<string | null>(null) 
  const [inputPriority, setInputPriority] = useState<PriorityType>('low')
  const [inputDueDate, setInputDueDate] = useState('')
  const [inputIsDaily, setInputIsDaily] = useState(false)
  const [searchQuery, setSearchQuery] = useState('') 
  const [isListening, setIsListening] = useState(false) 

  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [activeColumnModal, setActiveColumnModal] = useState<ColumnType | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  
  const [userName, setUserName] = useState(() => localStorage.getItem('my-todo-name') || 'Nazhif Alhuwaidie')
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem('my-todo-pic') || profilePicUrl)
  const [tempName, setTempName] = useState(userName)
  
  const profileInputRef = useRef<HTMLInputElement>(null)
  const taskInputImageRef = useRef<HTMLInputElement>(null) 
  const updateTaskImageRef = useRef<HTMLInputElement>(null) 
  const backupInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null) // Audio Player Zen Mode

  const [timeLeft, setTimeLeft] = useState(1500)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // --- EFEK & PENYIMPANAN ---
  useEffect(() => {
    const lastLogin = localStorage.getItem('my-todo-last-date')
    const currentLogin = new Date().toDateString()
    if (lastLogin && lastLogin !== currentLogin) {
      setTasks(prev => prev.map(t => t.isDaily ? { ...t, status: 'todo', completedAt: undefined } : t))
    }
    localStorage.setItem('my-todo-last-date', currentLogin)
  }, [])

  useEffect(() => {
    localStorage.setItem('my-todo-tasks', JSON.stringify(tasks))
    localStorage.setItem('my-todo-theme', isDarkMode ? 'dark' : 'light')
    localStorage.setItem('my-todo-exp', exp.toString())
  }, [tasks, isDarkMode, exp])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isTimerRunning && timeLeft > 0) interval = setInterval(() => setTimeLeft(p => p - 1), 1000)
    else if (timeLeft === 0) { setIsTimerRunning(false); alert("Sesi fokus selesai! Waktunya rehat sejenak."); }
    return () => clearInterval(interval)
  }, [isTimerRunning, timeLeft])

  // --- GAMIFIKASI ---
  const level = Math.floor(exp / 100) + 1
  const expProgress = exp % 100
  const getRankName = (lvl: number) => {
    if(lvl < 3) return "Novice Planner"
    if(lvl < 6) return "RW Coordinator"
    if(lvl < 10) return "Web Dev Intern"
    return "ENTJ Mastermind"
  }

  // --- FITUR BARU: AI SMART AUTO-SCHEDULE ---
  const handleAutoSchedule = () => {
    setTasks(prevTasks => {
      const sorted = [...prevTasks].sort((a, b) => {
        // Prioritas ke-1: Status Todo didahulukan dari yang lain
        if (a.status === 'todo' && b.status !== 'todo') return -1;
        if (a.status !== 'todo' && b.status === 'todo') return 1;
        
        // Prioritas ke-2: Level Prioritas (high > medium > low)
        const prioScore = { high: 3, medium: 2, low: 1 };
        if (prioScore[a.priority] !== prioScore[b.priority]) {
          return prioScore[b.priority] - prioScore[a.priority];
        }

        // Prioritas ke-3: Tanggal tenggat (Due Date) paling dekat
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;

        return 0;
      });
      return sorted;
    });
    alert("✨ AI Schedulling Berhasil! Tugas lu udah diurutkan dari yang paling urgent.");
  }

  // --- FITUR BARU: MOCK EXTERNAL API SYNC ---
  const simulateApiSync = (platform: 'strava' | 'github') => {
    alert(`Menyinkronkan data dengan ${platform.toUpperCase()}...`);
    setTimeout(() => {
      const newTask: Task = {
        id: Date.now(),
        title: platform === 'strava' ? 'Lari Pagi 5KM (Synced)' : 'Commit Fitur Frontend (Synced)',
        status: 'done',
        category: platform === 'strava' ? 'Olahraga' : 'Pekerjaan',
        notes: `Data otomatis ditarik dari API ${platform} pada ${new Date().toLocaleTimeString()}`,
        priority: 'low',
        dueDate: new Date().toISOString().split('T')[0],
        isDaily: false,
        completedAt: new Date().toISOString().split('T')[0]
      };
      setTasks(prev => [...prev, newTask]);
      setExp(e => e + 10);
      alert(`✅ Sinkronisasi ${platform} berhasil! +10 EXP.`);
    }, 1500);
  }

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser belum support fitur Voice AI.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => setInputValue(prev => prev + (prev ? " " : "") + e.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }

  const handleExportData = () => {
    const data = JSON.stringify({ tasks, exp, userName });
    const blob = new Blob([data], {type: 'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'todo-memory-backup.json'; a.click();
  }
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if(parsed.tasks) setTasks(parsed.tasks);
        if(parsed.exp) setExp(parsed.exp);
        if(parsed.userName) setUserName(parsed.userName);
        alert("Sistem berhasil memulihkan ingatan data!");
      } catch (err) { alert("File korup atau format tidak valid."); }
    }; reader.readAsText(file);
  }

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning)
  const resetTimer = () => { setIsTimerRunning(false); setTimeLeft(1500); }
  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const todayDateObj = new Date();
  const todayStrStr = todayDateObj.toISOString().split('T')[0];
  const today = todayDateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // --- HEATMAP LOGIC (Last 7 Days) ---
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const processImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image(); img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas'); const MAX_WIDTH = 800;
        let w = img.width; let h = img.height;
        if (w > MAX_WIDTH) { h *= MAX_WIDTH / w; w = MAX_WIDTH; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.7));
      }
    }
  }

  const addTask = () => {
    if (inputValue.trim() === '') return 
    const newTask: Task = {
      id: Date.now(), title: inputValue.trim(), status: 'todo', category: selectedCategory,
      notes: '', image: inputImage || undefined, priority: inputPriority,
      dueDate: inputDueDate || null, isDaily: inputIsDaily, subtasks: []
    }
    setTasks([...tasks, newTask]); 
    setInputValue(''); setInputImage(null); setInputDueDate(''); setInputIsDaily(false); setInputPriority('low');
  }

  const moveTask = (taskId: number, newStatus: ColumnType) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        if(newStatus === 'done' && t.status !== 'done') {
          setExp(e => e + 10);
          return { ...t, status: newStatus, completedAt: todayStrStr }; // Catat tanggal selesai
        }
        if(newStatus === 'failed' && t.status !== 'failed') setExp(e => Math.max(0, e - 5));
        return { ...t, status: newStatus };
      }
      return t;
    }))
  }

  const deleteTask = (taskId: number) => setTasks(tasks.filter(t => t.id !== taskId))
  const updateNotes = (taskId: number, newNotes: string) => setTasks(tasks.map(t => t.id === taskId ? { ...t, notes: newNotes } : t))
  const updateTaskImage = (taskId: number, file: File) => processImage(file, (base64) => setTasks(tasks.map(t => t.id === taskId ? { ...t, image: base64 } : t)))
  
  const addSubTask = (taskId: number, text: string) => {
    if(!text.trim()) return;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), {id: Date.now(), text, isCompleted: false}] } : t))
  }
  const toggleSubTask = (taskId: number, subId: number) => setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks?.map(s => s.id === subId ? {...s, isCompleted: !s.isCompleted} : s) } : t))
  const deleteSubTask = (taskId: number, subId: number) => setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks?.filter(s => s.id !== subId) } : t))

  const getTasksByStatus = (status: ColumnType) => tasks.filter(task => task.status === status && task.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const getDeadlineInfo = (dateStr: string | null) => {
    if (!dateStr) return null;
    const due = new Date(dateStr); due.setHours(0,0,0,0);
    const now = new Date(); now.setHours(0,0,0,0);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: "OVERDUE", color: isDarkMode ? "text-red-400 bg-red-900/40 border-red-500" : "text-red-600 bg-red-100 border-red-500" };
    if (diffDays === 0) return { text: "HARI INI", color: isDarkMode ? "text-orange-400 bg-orange-900/40 border-orange-500 animate-pulse" : "text-orange-600 bg-orange-100 border-orange-500 animate-pulse" };
    if (diffDays === 1) return { text: "BESOK", color: isDarkMode ? "text-yellow-400 bg-yellow-900/40 border-yellow-500" : "text-yellow-600 bg-yellow-100 border-yellow-500" };
    return { text: `H-${diffDays}`, color: isDarkMode ? "text-green-400 bg-green-900/40 border-green-500" : "text-green-600 bg-green-100 border-green-500" };
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader(); reader.onloadend = () => { setProfilePic(reader.result as string); localStorage.setItem('my-todo-pic', reader.result as string) }
      reader.readAsDataURL(file)
    }
  }

  const saveProfile = () => {
    if (tempName.trim() !== '') { setUserName(tempName); localStorage.setItem('my-todo-name', tempName) }
    setIsProfileModalOpen(false)
  }

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t=>t.status==='done').length
  const failedTasks = tasks.filter(t=>t.status==='failed').length
  const pendingTasks = tasks.filter(t=>t.status==='todo' || t.status==='doing').length
  const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const themeBg = isDarkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100" : "bg-gradient-to-br from-pink-400 via-pink-200 to-rose-300 text-gray-800";
  const themeCard = isDarkMode ? "bg-white/5 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]" : "bg-white/20 border-white/40 shadow-[0_8px_32px_rgba(255,255,255,0.2)]";
  const themeInput = isDarkMode ? "bg-gray-800/60 border-gray-600 text-white placeholder-gray-400" : "bg-white/50 border-white/60 text-gray-800 placeholder-gray-500";
  const themeModal = isDarkMode ? "bg-gray-900/80 border-gray-700 shadow-[0_0_50px_rgba(0,0,0,0.8)]" : "bg-white/30 border-white/50 shadow-[0_0_50px_rgba(255,255,255,0.3)]";
  const themeText = isDarkMode ? "text-gray-100" : "text-gray-900";
  const themeMutedText = isDarkMode ? "text-gray-400" : "text-gray-600";

  // --- TAMPILAN ZEN MODE ---
  if (isZenMode) {
    const doingTasks = getTasksByStatus('doing');
    return (
      <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center p-8 overflow-hidden animate-fade-in">
        {/* Audio Player Lo-Fi Background */}
        <audio ref={audioRef} src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" loop />
        
        <button onClick={() => { setIsZenMode(false); audioRef.current?.pause(); }} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors cursor-pointer"><FaTimes size={30}/></button>
        
        <div className="text-center mb-12 relative group cursor-pointer" onClick={toggleTimer}>
          <p className="text-pink-500 font-black tracking-[0.5em] mb-4 uppercase">Zen Focus Mode</p>
          <h1 className={`text-[12rem] font-black leading-none font-mono drop-shadow-[0_0_50px_rgba(236,72,153,0.5)] ${isTimerRunning ? 'text-white' : 'text-gray-600'}`}>{formatTime(timeLeft)}</h1>
          <div className="flex justify-center gap-6 mt-8">
            <button className="text-gray-400 hover:text-pink-500 transition-colors p-4 rounded-full border border-gray-800 hover:border-pink-500"><FaClock size={24}/></button>
            <button onClick={(e) => { e.stopPropagation(); if(audioRef.current?.paused) audioRef.current.play(); else audioRef.current?.pause(); }} className="text-gray-400 hover:text-green-500 transition-colors p-4 rounded-full border border-gray-800 hover:border-green-500" title="Play/Pause Lo-Fi Music"><FaHeadphones size={24}/></button>
          </div>
        </div>

        <div className="w-full max-w-2xl bg-gray-900/50 border border-gray-800 rounded-3xl p-8 backdrop-blur-md">
          <h3 className="text-gray-500 font-bold tracking-widest uppercase text-sm mb-6 border-b border-gray-800 pb-4">Current Objective</h3>
          {doingTasks.length === 0 ? (
            <p className="text-gray-600 text-center italic">Tidak ada tugas di kolom "Doing". Santai dulu komandan!</p>
          ) : (
            <div className="space-y-4">
              {doingTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
                    <span className="text-xl font-bold text-gray-200">{t.title}</span>
                  </div>
                  <button onClick={() => moveTask(t.id, 'done')} className="bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-all cursor-pointer">Beres ✓</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- TAMPILAN NORMAL DASHBOARD ---
  return (
    <div className={`min-h-screen ${themeBg} p-6 font-sans relative overflow-x-hidden selection:bg-pink-500 selection:text-white pb-20 transition-colors duration-500`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${isDarkMode ? 'via-pink-500' : 'via-white'} to-transparent opacity-50`}></div>
      
      {/* --- TOP BAR --- */}
      <div className="max-w-[95%] mx-auto flex flex-wrap gap-4 items-center justify-between mb-8">
        <div 
          onClick={() => { setTempName(userName); setIsProfileModalOpen(true); }}
          className={`flex items-center gap-3 p-2 pr-6 rounded-full backdrop-blur-xl cursor-pointer transition-all duration-300 group ${isDarkMode ? 'bg-black/40 border border-gray-700 hover:bg-black/60' : 'bg-white/20 border border-white/40 hover:bg-white/30'}`}
        >
          <div className="relative">
            <img src={profilePic} alt="Profil" className={`w-12 h-12 rounded-full object-cover border-[3px] shadow-sm ${isDarkMode ? 'border-gray-600' : 'border-white/70'}`} />
            <div className="absolute inset-0 bg-pink-500/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm"><FaFingerprint className="text-white" size={20} /></div>
          </div>
          <div className="text-left">
            <p className={`text-[9px] font-bold uppercase tracking-[0.2em] opacity-80 ${isDarkMode ? 'text-pink-400' : 'text-pink-700'}`}>{getRankName(level)} // Lv.{level}</p>
            <p className={`text-sm font-black tracking-wide ${themeText}`}>{userName}</p> 
            <div className="w-24 h-1 mt-1 bg-gray-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-pink-500 transition-all" style={{width: `${expProgress}%`}}></div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 items-center ml-auto">
          {/* TOMBOL ZEN MODE & DARK MODE */}
          <button onClick={() => setIsZenMode(true)} className={`p-3 rounded-full backdrop-blur-xl border shadow-sm transition-colors cursor-pointer group hover:bg-pink-500 hover:text-white hover:border-pink-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white/20 border-white/40 text-gray-800'}`} title="Masuk Zen Mode">
            <FaHeadphones size={16} className="group-hover:animate-bounce" />
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-full backdrop-blur-xl border shadow-sm transition-colors cursor-pointer ${isDarkMode ? 'bg-gray-800 border-gray-600 text-yellow-400' : 'bg-white/20 border-white/40 text-gray-800'}`} title="Ubah Tema">
            {isDarkMode ? <FaSun size={16} /> : <FaMoon size={16} />}
          </button>

          <div className={`flex items-center gap-1 backdrop-blur-xl p-1 rounded-full border shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white/20 border-white/40'}`}>
            <button onClick={toggleTimer} className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 tracking-wider font-mono cursor-pointer ${isTimerRunning ? 'bg-pink-500 text-white animate-pulse' : themeMutedText}`}><FaClock /> {formatTime(timeLeft)}</button>
            <button onClick={resetTimer} className={`p-2 rounded-full cursor-pointer hover:text-pink-500 ${themeMutedText}`}><FaTimes size={14}/></button>
          </div>
          <button onClick={() => setIsSummaryOpen(true)} className={`flex items-center gap-2 px-6 py-3 backdrop-blur-xl font-black rounded-full shadow-sm transition-all active:scale-95 tracking-wide cursor-pointer ${isDarkMode ? 'bg-pink-600 text-white hover:bg-pink-500 border border-pink-400' : 'bg-white/20 hover:bg-white/40 text-gray-900 border border-white/50'}`}><FaChartPie className={isDarkMode ? 'text-white' : 'text-pink-600'} /> Analitik</button>
        </div>
      </div>

      {/* --- JUDUL UTAMA --- */}
      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)] mb-3 flex items-center justify-center gap-4 uppercase tracking-tighter">
          <FaCheck className="text-pink-500 drop-shadow-none" /> Kudu Ngapain Ajh 
        </h1>
        <p className={`font-bold tracking-[0.3em] text-xs backdrop-blur-md inline-block px-8 py-2 rounded-full border shadow-inner uppercase mb-4 ${isDarkMode ? 'bg-gray-800/50 border-gray-600 text-pink-400' : 'bg-white/30 border-white/40 text-pink-800'}`}>Sys_Date: {today}</p>
      </div>

      {/* --- CONTROL PANEL INPUT --- */}
      <div className={`max-w-4xl mx-auto mb-10 p-5 backdrop-blur-2xl border rounded-[2rem] flex flex-col gap-3 ${themeCard}`}>
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={`px-5 py-4 rounded-[1.2rem] backdrop-blur-md border focus:ring-2 focus:ring-pink-400 font-bold outline-none cursor-pointer ${themeInput}`}>
            {CATEGORIES.map(cat => <option key={cat} value={cat} className={isDarkMode ? 'bg-gray-800' : ''}>{cat}</option>)}
          </select>
          
          <div className={`flex-1 flex items-center backdrop-blur-md border rounded-[1.2rem] px-2 shadow-inner ${themeInput}`}>
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="Masukkan perintah tugas..." className="flex-1 px-4 py-4 bg-transparent focus:outline-none font-bold" />
            
            <button onClick={handleVoiceInput} className={`p-3 rounded-xl transition-all mr-1 cursor-pointer ${isListening ? 'text-white bg-pink-500 animate-pulse' : 'text-gray-400 hover:text-pink-500'}`} title="Voice Command"><FaMicrophone size={18} /></button>
            <button onClick={() => taskInputImageRef.current?.click()} className={`p-3 rounded-xl transition-all cursor-pointer ${inputImage ? 'text-white bg-pink-500' : 'text-gray-400 hover:text-pink-500'}`} title="Lampirkan Gambar"><FaImage size={18} /></button>
            <input type="file" accept="image/*" className="hidden" ref={taskInputImageRef} onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0], setInputImage)} />
          </div>

          <button onClick={addTask} className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-[1.2rem] font-black transition-all shadow-[0_0_20px_rgba(236,72,153,0.4)] active:scale-95 uppercase tracking-wide cursor-pointer">+ Eksekusi</button>
          
          {/* TOMBOL AI SMART SCHEDULE */}
          <button onClick={handleAutoSchedule} className="px-5 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-[1.2rem] font-black transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 cursor-pointer" title="AI Auto-Schedule"><FaMagic size={20}/></button>
        </div>

        <div className="flex flex-wrap items-center gap-4 px-2 py-1">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-white/40 border-white/50'}`}>
            <FaExclamationTriangle className={inputPriority === 'high' ? 'text-red-500' : inputPriority === 'medium' ? 'text-yellow-500' : 'text-green-500'} />
            <select value={inputPriority} onChange={(e) => setInputPriority(e.target.value as PriorityType)} className={`bg-transparent text-xs font-bold outline-none cursor-pointer ${themeText}`}>
              <option value="low" className={isDarkMode ? 'bg-gray-800' : ''}>Prio: Low</option>
              <option value="medium" className={isDarkMode ? 'bg-gray-800' : ''}>Prio: Med</option>
              <option value="high" className={isDarkMode ? 'bg-gray-800' : ''}>Prio: High</option>
            </select>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-white/40 border-white/50'}`}>
            <FaCalendarAlt className="text-pink-500" />
            <input type="date" value={inputDueDate} onChange={(e) => setInputDueDate(e.target.value)} className={`bg-transparent text-xs font-bold outline-none cursor-pointer ${themeText}`} style={{colorScheme: isDarkMode ? 'dark' : 'light'}} />
          </div>
          <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${isDarkMode ? 'bg-gray-800/50 border-gray-600 hover:bg-gray-700' : 'bg-white/40 border-white/50 hover:bg-white/60'}`}>
            <input type="checkbox" checked={inputIsDaily} onChange={(e) => setInputIsDaily(e.target.checked)} className="accent-pink-500 w-4 h-4 cursor-pointer" /> 
            <span className={`text-xs font-bold flex items-center gap-1 ${themeText}`}><FaSyncAlt className="text-pink-500" size={10}/> Rutinitas Pagi</span>
          </label>
          {inputImage && (
            <div className={`flex items-center gap-2 ml-auto px-3 py-1 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-white/40 border-white/50'}`}>
              <img src={inputImage} className="w-6 h-6 rounded object-cover" />
              <button onClick={() => setInputImage(null)} className="text-red-500 hover:text-red-700 cursor-pointer"><FaTimes size={12} /></button>
            </div>
          )}
        </div>
      </div>

      {/* --- RADAR PENCARIAN --- */}
      <div className="max-w-7xl mx-auto flex justify-end mb-6 px-2">
        <div className="relative w-full md:w-64">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-500" />
          <input type="text" placeholder="Radar Pencarian..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full backdrop-blur-md border pl-11 pr-4 py-3 rounded-full text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-sm transition-all ${themeInput}`} />
        </div>
      </div>

      {/* --- BOARD COLUMNS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {columns.map(status => {
          const config = columnConfig[status]
          const columnTasks = getTasksByStatus(status)
          return (
            <div key={status} onClick={() => setActiveColumnModal(status)} className={`relative backdrop-blur-2xl border-t-4 border ${themeCard} rounded-[2.5rem] p-6 ${config.glowColor} hover:-translate-y-2 cursor-pointer transition-all duration-500 flex flex-col items-center justify-center text-center group overflow-hidden`} style={{borderTopColor: config.borderColor.replace('border-', '')}}>
              <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent ${isDarkMode ? 'via-pink-500' : 'via-white'} to-transparent opacity-50`}></div>
              <h2 className={`font-black text-sm uppercase tracking-widest mb-4 flex items-center justify-center w-full pb-4 border-b ${isDarkMode ? 'border-white/10 text-gray-300' : 'border-white/30 text-gray-700'}`}>{config.emoji} {config.title}</h2>
              <div className="py-6"><span className={`text-7xl font-black text-transparent bg-clip-text drop-shadow-sm group-hover:scale-110 transition-transform duration-300 ${isDarkMode ? 'bg-gradient-to-b from-white to-gray-500' : 'bg-gradient-to-b from-gray-800 to-gray-500'}`}>{columnTasks.length}</span></div>
              <p className="mt-4 text-[10px] font-black text-pink-500 bg-pink-500/10 shadow-sm px-5 py-2 rounded-full w-full uppercase tracking-widest group-hover:bg-pink-500 group-hover:text-white transition-colors">Akses Data &rarr;</p>
            </div>
          )
        })}
      </div>

      {/* --- MODAL DETAIL TUGAS --- */}
      {activeColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className={`backdrop-blur-3xl rounded-[3rem] p-8 max-w-3xl w-full relative max-h-[90vh] flex flex-col border-t-[8px] ${themeModal}`} style={{borderTopColor: columnConfig[activeColumnModal].borderColor.replace('border-', '')}}>
            <button onClick={() => setActiveColumnModal(null)} className={`absolute top-6 right-6 z-50 transition-colors rounded-full p-3 shadow-sm border cursor-pointer ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300 hover:text-white hover:bg-pink-600' : 'bg-white/50 border-white/30 text-gray-800 hover:text-white hover:bg-pink-500'}`}><FaTimes size={16} /></button>
            <div className={`mb-6 pb-4 border-b ${isDarkMode ? 'border-white/10' : 'border-white/30'}`}>
              <h2 className={`text-3xl font-black flex items-center gap-3 drop-shadow-md pr-12 ${themeText}`}>{columnConfig[activeColumnModal].emoji} {columnConfig[activeColumnModal].title} <span className={`text-sm px-4 py-1 rounded-full border shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white/50 border-white/50'}`}>{getTasksByStatus(activeColumnModal).length}</span></h2>
            </div>

            <div className="overflow-y-auto pr-2 space-y-5 flex-1 custom-scrollbar">
              {getTasksByStatus(activeColumnModal).length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-20 ${themeMutedText}`}><FaFolderOpen size={64} className="mb-4 opacity-50" /><p className="font-bold tracking-widest uppercase text-sm">Direktori Kosong</p></div>
              ) : (
                getTasksByStatus(activeColumnModal).map(task => {
                  const deadlineInfo = getDeadlineInfo(task.dueDate)
                  return (
                  <div key={task.id} className={`backdrop-blur-lg rounded-3xl p-6 border shadow-lg transition-all relative overflow-hidden ${isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-white/50 border-white/60'}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${task.priority === 'high' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : task.priority === 'medium' ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]'}`}></div>

                    {task.image && (
                      <div className="relative mb-5 group ml-2">
                        <img src={task.image} className={`w-full h-48 object-cover rounded-2xl border-2 shadow-md ${isDarkMode ? 'border-gray-600' : 'border-white/50'}`} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                           <button onClick={() => updateTaskImageRef.current?.click()} className="bg-pink-500 p-3 rounded-full text-white shadow-xl hover:scale-110 transition-transform cursor-pointer"><FaCamera size={20} /></button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-between items-center mb-4 ml-2 gap-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] font-black bg-pink-500 text-white px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest">{task.category}</span>
                        {task.isDaily && <span className={`flex items-center gap-1 text-[10px] font-black border px-3 py-1.5 rounded-full uppercase tracking-wider ${isDarkMode ? 'bg-blue-900/40 text-blue-400 border-blue-500' : 'bg-blue-100 text-blue-600 border-blue-300'}`}><FaSyncAlt/> Harian</span>}
                        {deadlineInfo && <span className={`flex items-center gap-1 text-[10px] font-black border px-3 py-1.5 rounded-full uppercase tracking-wider ${deadlineInfo.color}`}><FaCalendarAlt/> {deadlineInfo.text}</span>}
                        {!task.image && <button onClick={() => updateTaskImageRef.current?.click()} className={`text-[10px] font-black px-3 py-1.5 rounded-full border hover:bg-pink-500 hover:text-white transition-all cursor-pointer ${isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-500' : 'bg-white/50 text-gray-600 border-white/50'}`}>+ Foto</button>}
                        <input type="file" accept="image/*" className="hidden" ref={updateTaskImageRef} onChange={(e) => e.target.files?.[0] && updateTaskImage(task.id, e.target.files[0])} />
                      </div>
                      <button onClick={() => deleteTask(task.id)} className={`transition-colors p-2 rounded-full shadow-sm cursor-pointer ${isDarkMode ? 'bg-gray-700 text-gray-400 hover:bg-red-600 hover:text-white' : 'bg-white/60 text-gray-500 hover:bg-red-500 hover:text-white'}`}><FaTrash size={12} /></button>
                    </div>
                    
                    <p className={`text-xl font-black mb-4 ml-2 ${themeText}`}>{task.title}</p>
                    
                    {/* SUB-TASKS (Misi Cabang) */}
                    <div className="ml-2 mb-4">
                      <div className="flex flex-col gap-2 mb-2">
                        {task.subtasks?.map(sub => (
                          <div key={sub.id} className="flex items-center gap-2 group">
                            <input type="checkbox" checked={sub.isCompleted} onChange={() => toggleSubTask(task.id, sub.id)} className="accent-pink-500 w-4 h-4 cursor-pointer" />
                            <span className={`text-sm font-medium ${sub.isCompleted ? `line-through ${themeMutedText}` : themeText}`}>{sub.text}</span>
                            <button onClick={() => deleteSubTask(task.id, sub.id)} className="opacity-0 group-hover:opacity-100 text-red-500 ml-auto hover:scale-110 cursor-pointer"><FaTimes size={12}/></button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <FaPlus className="text-pink-500 text-sm" />
                        <input type="text" placeholder="Tambah checkpoint misi cabang..." className={`bg-transparent text-sm focus:outline-none w-full border-b border-transparent focus:border-pink-500 pb-1 ${themeInput.replace('bg-','').replace('border-','')}`} onKeyDown={(e) => { if(e.key === 'Enter'){ addSubTask(task.id, e.currentTarget.value); e.currentTarget.value = ''; } }} />
                      </div>
                    </div>

                    <textarea value={task.notes || ''} onChange={(e) => updateNotes(task.id, e.target.value)} placeholder="Input log catatan tambahan di sini..." className={`w-full ml-2 backdrop-blur-sm border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all resize-y min-h-[70px] font-medium shadow-inner mb-5 ${themeInput}`} />

                    <div className="flex flex-wrap gap-3 ml-2">
                      {activeColumnModal === 'todo' && <button onClick={() => moveTask(task.id, 'doing')} className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_4px_15px_rgba(236,72,153,0.3)] cursor-pointer">Inisialisasi Misi &rarr;</button>}
                      {activeColumnModal === 'doing' && (
                        <div className="grid grid-cols-2 gap-3 w-full">
                          <button onClick={() => moveTask(task.id, 'done')} className="py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-xs shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center justify-center gap-2 uppercase cursor-pointer"><FaCheck /> Selesai</button>
                          <button onClick={() => moveTask(task.id, 'failed')} className="py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2 uppercase cursor-pointer"><FaTimes /> Gagal</button>
                          <button onClick={() => moveTask(task.id, 'todo')} className={`col-span-2 py-3 rounded-2xl font-black text-xs mt-1 border uppercase cursor-pointer transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-white/60 text-gray-800 border-white/50 hover:bg-white'}`}>Batalkan</button>
                        </div>
                      )}
                      {(activeColumnModal === 'done' || activeColumnModal === 'failed') && <button onClick={() => moveTask(task.id, 'doing')} className={`w-full py-3 rounded-2xl font-black text-sm uppercase transition-colors shadow-sm cursor-pointer border ${isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-white/60 text-gray-800 border-white/50 hover:bg-white'}`}>Revisi (Ulang)</button>}
                    </div>
                  </div>
                )})
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL PROFIL & MOCK INTEGRATIONS --- */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className={`backdrop-blur-3xl rounded-[3rem] p-8 max-w-sm w-full relative text-center border ${themeModal}`}>
            <button onClick={() => setIsProfileModalOpen(false)} className={`absolute top-6 right-6 z-50 transition-colors rounded-full p-2 border cursor-pointer ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white hover:bg-pink-600' : 'bg-white/50 border-white/40 text-gray-600 hover:text-white hover:bg-pink-500'}`}><FaTimes size={16} /></button>
            <h2 className={`text-2xl font-black mb-6 uppercase tracking-widest border-b pb-4 ${themeText} ${isDarkMode ? 'border-white/10' : 'border-white/30'}`}>Kalibrasi User</h2>
            
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-2 group cursor-pointer" onClick={() => profileInputRef.current?.click()}>
                <img src={profilePic} alt="Profil" className={`w-28 h-28 rounded-full object-cover border-4 shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:opacity-80 transition-opacity ${isDarkMode ? 'border-gray-700' : 'border-white'}`} />
                <div className="absolute bottom-0 right-0 bg-pink-600 p-3 rounded-full text-white shadow-lg border-2 border-white group-hover:scale-110 transition-transform"><FaCamera size={14} /></div>
              </div>
              <input type="file" accept="image/*" className="hidden" ref={profileInputRef} onChange={handleProfileImageChange} />
            </div>
            
            <div className="mb-6 text-left">
              <label className="block text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] mb-2 text-center">Identifikasi Nama</label>
              <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className={`w-full px-4 py-3 rounded-2xl backdrop-blur-md border focus:outline-none focus:ring-2 focus:ring-pink-400 text-center font-black text-md uppercase tracking-wide ${themeInput}`} />
            </div>

            {/* FITUR BARU: MOCK API INTEGRATION */}
            <div className={`mb-6 p-4 rounded-2xl border text-left ${isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-white/40 border-white/40'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 text-center ${themeMutedText}`}>API & Integrasi External</p>
              <div className="flex gap-2">
                <button onClick={() => simulateApiSync('strava')} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"><FaRunning/> Strava</button>
                <button onClick={() => simulateApiSync('github')} className="flex-1 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"><FaGithub/> GitHub</button>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <button onClick={handleExportData} className={`flex-1 py-2 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors border cursor-pointer ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-white/50 border-white/50 hover:bg-white text-gray-700'}`}><FaDownload/> Export</button>
              <button onClick={() => backupInputRef.current?.click()} className={`flex-1 py-2 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors border cursor-pointer ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-white/50 border-white/50 hover:bg-white text-gray-700'}`}><FaUpload/> Import</button>
              <input type="file" accept=".json" className="hidden" ref={backupInputRef} onChange={handleImportData} />
            </div>

            <button onClick={saveProfile} className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-2xl shadow-[0_4px_20px_rgba(236,72,153,0.3)] transition-all active:scale-95 uppercase tracking-widest cursor-pointer">Simpan & Tutup</button>
          </div>
        </div>
      )}

      {/* --- MODAL ANALITIK + HEATMAP --- */}
      {isSummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className={`backdrop-blur-3xl rounded-[3rem] p-10 max-w-md w-full relative text-center border overflow-y-auto max-h-[90vh] custom-scrollbar ${themeModal}`}>
            <button onClick={() => setIsSummaryOpen(false)} className={`absolute top-6 right-6 z-50 transition-colors rounded-full p-2 border cursor-pointer ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white hover:bg-pink-600' : 'bg-white/50 border-white/40 text-gray-600 hover:text-white hover:bg-pink-500'}`}><FaTimes size={16} /></button>
            <div className="text-6xl flex justify-center mb-4 drop-shadow-md">
              {totalTasks === 0 ? <FaSeedling className="text-green-400" /> : successRate === 100 ? <FaStar className="text-yellow-400" /> : successRate >= 70 ? <FaFire className="text-orange-500" /> : successRate >= 40 ? <FaTrophy className="text-yellow-600" /> : <FaHeart className="text-pink-500" />}
            </div>
            <h2 className={`text-2xl font-black mb-2 uppercase tracking-wider ${themeText}`}>Statistik Harian</h2>
            
            <div className={`backdrop-blur-lg rounded-[2rem] p-6 mb-6 border shadow-lg ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-white/40 border-white/50'}`}>
              <div className="flex justify-between items-center mb-3">
                <span className={`font-black uppercase tracking-wider text-xs ${themeMutedText}`}>Skor Efisiensi</span>
                <span className="text-3xl font-black text-pink-500 drop-shadow-sm">{successRate}%</span>
              </div>
              <div className={`w-full rounded-full h-3 mb-6 overflow-hidden shadow-inner border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/50 border-white/40'}`}>
                <div className="bg-gradient-to-r from-pink-400 to-pink-600 h-full rounded-full transition-all duration-1000" style={{ width: `${successRate}%` }}></div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className={`p-2 rounded-xl text-center border ${isDarkMode ? 'bg-gray-800/80 border-gray-600' : 'bg-white/60 border-white/50'}`}><p className="text-[9px] text-gray-500 font-bold uppercase">Total</p><p className={`text-xl font-black ${themeText}`}>{totalTasks}</p></div>
                <div className={`p-2 rounded-xl text-center border ${isDarkMode ? 'bg-gray-800/80 border-gray-600' : 'bg-white/60 border-white/50'}`}><p className="text-[9px] text-green-500 font-bold uppercase">Beres</p><p className="text-xl font-black text-green-500">{completedTasks}</p></div>
                <div className={`p-2 rounded-xl text-center border ${isDarkMode ? 'bg-gray-800/80 border-gray-600' : 'bg-white/60 border-white/50'}`}><p className="text-[9px] text-yellow-500 font-bold uppercase">Proses</p><p className="text-xl font-black text-yellow-500">{pendingTasks}</p></div>
                <div className={`p-2 rounded-xl text-center border ${isDarkMode ? 'bg-gray-800/80 border-gray-600' : 'bg-white/60 border-white/50'}`}><p className="text-[9px] text-red-500 font-bold uppercase">Gagal</p><p className="text-xl font-black text-red-500">{failedTasks}</p></div>
              </div>
            </div>

            {/* FITUR BARU: ACTIVITY HEATMAP */}
            <div className={`p-5 rounded-[2rem] mb-6 text-left border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/40 border-white/50'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 text-center ${themeMutedText}`}>Kontribusi 7 Hari Terakhir</p>
              <div className="flex justify-between items-end gap-1">
                {last7Days.map((dayStr) => {
                  const count = tasks.filter(t => t.completedAt === dayStr).length;
                  const dayName = new Date(dayStr).toLocaleDateString('id-ID', {weekday: 'short'});
                  let bgClass = isDarkMode ? 'bg-gray-700' : 'bg-white/50';
                  if(count > 0) bgClass = 'bg-pink-300';
                  if(count > 2) bgClass = 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]';
                  if(count > 4) bgClass = 'bg-pink-700 shadow-[0_0_15px_rgba(190,24,93,0.8)]';
                  return (
                    <div key={dayStr} className="flex flex-col items-center gap-1 group relative">
                      <div className={`w-8 h-8 rounded-lg transition-all border border-white/20 ${bgClass}`}></div>
                      <span className={`text-[8px] uppercase font-bold ${themeMutedText}`}>{dayName}</span>
                      <div className="absolute -top-6 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">{count} Tugas</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <button onClick={() => alert("Sistem backend Supabase/Firebase belum dikonfigurasi. Fitur UI ready!")} className={`w-full py-3 mb-3 font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors border cursor-pointer ${isDarkMode ? 'bg-indigo-900/50 hover:bg-indigo-800 text-indigo-300 border-indigo-700' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300'}`}><FaCloudUploadAlt size={18}/> Backup ke Server Awan</button>
            <button onClick={() => setIsSummaryOpen(false)} className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-2xl shadow-[0_4px_20px_rgba(236,72,153,0.3)] transition-all active:scale-95 uppercase tracking-widest cursor-pointer">Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}