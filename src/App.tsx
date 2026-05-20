import { useState } from 'react'
import type { ReactNode } from 'react' // Perbaikan Error 1: Memisahkan import type

// Pastikan file foto profilmu bernama 'profile.jpg' di folder 'src/assets/'
import profilePicUrl from './assets/profile.jpg' 

import { FaClipboardList, FaCheck, FaTimes, FaChartPie, FaFolderOpen } from 'react-icons/fa' 
import { GrLike } from 'react-icons/gr'

// Tipe data Task
type Task = {
  id: number
  title: string
  status: 'todo' | 'doing' | 'done' | 'failed'
  category: string
}

type ColumnType = 'todo' | 'doing' | 'done' | 'failed'

const CATEGORIES = ['Tugas Kuliah', 'Olahraga', 'Tugas Rumah', 'Pekerjaan', 'Lainnya']

const columnConfig: Record<ColumnType, { title: string; emoji: ReactNode; color: string }> = {
  todo: { 
    title: 'lagi ngerjain bang', 
    emoji: <FaClipboardList className="inline text-pink-500 mb-1 mr-1" size={20} />, 
    color: 'border-pink-500' 
  },
  doing: { 
    title: 'sabarr gillaaaa', 
    emoji: <GrLike className="inline text-yellow-500 mb-1 mr-1" size={20} />, 
    color: 'border-yellow-500' 
  },
  done: { 
    title: 'udahan gila', 
    emoji: <FaCheck className="inline text-green-500 mb-1 mr-1" size={20} />, 
    color: 'border-green-500' 
  },
  failed: { 
    title: 'masa gagal si dia', 
    emoji: <FaTimes className="inline text-red-500 mb-1 mr-1" size={20} />, 
    color: 'border-red-500' 
  }
}

const columns: ColumnType[] = ['todo', 'doing', 'done', 'failed'] 

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [inputValue, setInputValue] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0])
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [activeColumnModal, setActiveColumnModal] = useState<ColumnType | null>(null)

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const addTask = () => {
    if (inputValue.trim() === '') return 
    const newTask: Task = {
      id: Date.now(), 
      title: inputValue.trim(), 
      status: 'todo', 
      category: selectedCategory 
    }
    setTasks([...tasks, newTask]) 
    setInputValue('') 
  }

  const moveTask = (taskId: number, newStatus: ColumnType) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ))
  }

  const deleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const getTasksByStatus = (status: ColumnType) => {
    return tasks.filter(task => task.status === status)
  }

  // LOGIKA RINGKASAN
  const totalTasks = tasks.length
  const completedTasks = getTasksByStatus('done').length
  const failedTasks = getTasksByStatus('failed').length
  const pendingTasks = getTasksByStatus('todo').length + getTasksByStatus('doing').length
  const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  let summaryMessage = ""
  let summaryEmoji = ""
  if (totalTasks === 0) {
    summaryMessage = "Belum ada tugas hari ini. Yuk mulai rencanakan!"
    summaryEmoji = "🌱"
  } else if (successRate === 100) {
    summaryMessage = "Sempurna! Semua tugas hari ini berhasil diselesaikan. Kerja bagus!"
    summaryEmoji = "🌟"
  } else if (successRate >= 70) {
    summaryMessage = "Hebat! Sebagian besar tugas sudah beres. Sedikit lagi!"
    summaryEmoji = "🔥"
  } else if (successRate >= 40) {
    summaryMessage = "Lumayan, tapi masih banyak yang harus dikerjakan atau dievaluasi."
    summaryEmoji = "💪"
  } else {
    summaryMessage = "Hari ini terasa berat ya? Jangan menyerah, evaluasi yang gagal dan coba lagi besok!"
    summaryEmoji = "🫂"
  }

  return (
    <div className="min-h-screen bg-pink-100 text-gray-800 p-6 font-sans relative">
      
      {/* --- BAGIAN ATAS (TOP BAR) --- */}
      <div className="max-w-[95%] mx-auto flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 bg-white/60 p-2 pr-5 rounded-full shadow-sm border border-white/50 backdrop-blur-sm">
          <img
            src={profilePicUrl}
            alt="Profil"
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150/fbcfe8/db2777?text=User'; }}
          />
          <div className="text-left">
            <p className="text-[10px] text-pink-400 font-bold uppercase tracking-tight">Selamat Datang,</p>
            <p className="text-md font-black text-gray-700 leading-tight">JUDIKA RACING</p> 
          </div>
        </div>

        <button 
          onClick={() => setIsSummaryOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-black rounded-full shadow-md transition-all active:scale-95"
        >
          <FaChartPie /> Lihat Ringkasan
        </button>
      </div>

      {/* --- JUDUL UTAMA --- */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-black text-pink-600 drop-shadow-sm mb-2 flex items-center justify-center gap-4">
          <FaCheck className="text-pink-500" /> KUDU NGAPAIN AJH 
        </h1>
        <p className="text-pink-400 font-bold tracking-widest text-sm bg-pink-200/30 inline-block px-6 py-1 rounded-full">
          {today}
        </p>
      </div>

      {/* --- FORM INPUT --- */}
      <div className="max-w-3xl mx-auto flex flex-wrap sm:flex-nowrap gap-2 mb-12">
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 rounded-2xl bg-white border-2 border-pink-200 focus:outline-none focus:border-pink-500 text-gray-700 font-bold shadow-sm"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Mau ngerjain apa hari ini?..."
          className="flex-1 px-5 py-3 rounded-2xl bg-white border-2 border-pink-200 focus:outline-none focus:border-pink-500 transition-colors shadow-sm text-gray-700 font-medium"
        />
        
        <button
          onClick={addTask}
          className="px-8 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-black transition-all shadow-lg active:scale-95"
        >
          + Add
        </button>
      </div>

      {/* --- SUMMARY COUNTER --- */}
      <div className="flex flex-wrap justify-center gap-4 mb-10">
        <div className="bg-white/80 border-b-4 border-pink-400 text-pink-600 px-6 py-2 rounded-2xl text-xs font-black shadow-sm">
          Todo: {getTasksByStatus('todo').length}
        </div>
        <div className="bg-white/80 border-b-4 border-yellow-400 text-yellow-600 px-6 py-2 rounded-2xl text-xs font-black shadow-sm">
          Doing: {getTasksByStatus('doing').length}
        </div>
        <div className="bg-white/80 border-b-4 border-green-400 text-green-600 px-6 py-2 rounded-2xl text-xs font-black shadow-sm">
          Done: {getTasksByStatus('done').length}
        </div>
        <div className="bg-white/80 border-b-4 border-red-400 text-red-600 px-6 py-2 rounded-2xl text-xs font-black shadow-sm">
          Failed: {getTasksByStatus('failed').length}
        </div>
      </div>

      {/* --- BOARD COLUMNS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {columns.map(status => {
          const config = columnConfig[status]
          const columnTasks = getTasksByStatus(status)

          return (
            <div
              key={status}
              onClick={() => setActiveColumnModal(status)}
              className={`bg-white/80 rounded-[2.5rem] p-6 border-t-8 ${config.color} shadow-md hover:shadow-xl hover:-translate-y-2 cursor-pointer backdrop-blur-md transition-all duration-300 flex flex-col items-center justify-center text-center group`}
            >
              <h2 className="font-black text-md text-gray-600 mb-4 flex items-center justify-center gap-2 w-full border-b border-gray-100 pb-4">
                {config.emoji} {config.title}
              </h2>
              
              <div className="py-4">
                <span className="text-7xl font-black text-gray-800 tracking-tighter">
                  {columnTasks.length}
                </span>
              </div>
              
              <p className="mt-4 text-[10px] font-black text-pink-500 bg-pink-100/50 px-5 py-2 rounded-full w-full uppercase tracking-widest group-hover:bg-pink-500 group-hover:text-white transition-colors">
                Buka Detail &rarr;
              </p>
            </div>
          )
        })}
      </div>

      {/* --- MODAL DETAIL TUGAS --- */}
      {activeColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-[3rem] p-8 max-w-2xl w-full shadow-2xl relative max-h-[85vh] flex flex-col border-t-[12px] border-pink-500">
            <button onClick={() => setActiveColumnModal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors bg-gray-100 rounded-full p-2"><FaTimes size={20} /></button>
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                {columnConfig[activeColumnModal].emoji} {columnConfig[activeColumnModal].title}
                <span className="bg-pink-100 text-pink-600 text-sm px-4 py-1 rounded-full">{getTasksByStatus(activeColumnModal).length}</span>
              </h2>
            </div>
            <div className="overflow-y-auto pr-2 space-y-4 flex-1 custom-scrollbar">
              {getTasksByStatus(activeColumnModal).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <FaFolderOpen size={64} className="mb-4 opacity-20" />
                  <p className="font-bold italic">Kosong melompong bang...</p>
                </div>
              ) : (
                getTasksByStatus(activeColumnModal).map(task => (
                  <div key={task.id} className="bg-gray-50 rounded-3xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black bg-white text-pink-500 px-3 py-1 rounded-full shadow-sm border border-pink-50">{task.category}</span>
                      <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 transition-colors"><FaTimes size={16} /></button>
                    </div>
                    <p className="text-lg font-bold text-gray-800 mb-5">{task.title}</p>
                    <div className="flex flex-wrap gap-2">
                      {activeColumnModal === 'todo' && <button onClick={() => moveTask(task.id, 'doing')} className="w-full py-3 bg-pink-500 text-white rounded-2xl font-black text-sm">Gas Kerjain &rarr;</button>}
                      {activeColumnModal === 'doing' && (
                        <div className="grid grid-cols-2 gap-2 w-full">
                          <button onClick={() => moveTask(task.id, 'done')} className="py-3 bg-green-500 text-white rounded-2xl font-black text-xs">Selesai ✓</button>
                          <button onClick={() => moveTask(task.id, 'failed')} className="py-3 bg-red-500 text-white rounded-2xl font-black text-xs">Gagal ✗</button>
                          <button onClick={() => moveTask(task.id, 'todo')} className="col-span-2 py-2 bg-gray-200 text-gray-600 rounded-xl font-bold text-xs mt-1">Batal</button>
                        </div>
                      )}
                      {(activeColumnModal === 'done' || activeColumnModal === 'failed') && <button onClick={() => moveTask(task.id, 'doing')} className="w-full py-3 bg-gray-200 text-gray-700 rounded-2xl font-black text-sm">Revisi Lagi</button>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL RINGKASAN HARIAN --- */}
      {isSummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative text-center">
            <button onClick={() => setIsSummaryOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 rounded-full p-2"><FaTimes size={16} /></button>
            <span className="text-7xl block mb-4">{summaryEmoji}</span>
            <h2 className="text-3xl font-black text-gray-800 mb-1">Rapor Hari Ini</h2>
            <p className="text-pink-400 font-bold text-xs mb-8 uppercase tracking-widest">{today}</p>
            <div className="bg-pink-50 rounded-[2rem] p-8 mb-8 border border-pink-100 shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 font-bold">Skor Kamu</span>
                <span className="text-4xl font-black text-pink-600">{successRate}%</span>
              </div>
              <div className="w-full bg-pink-200 rounded-full h-4 mb-8 overflow-hidden shadow-inner">
                <div className="bg-pink-500 h-full rounded-full transition-all duration-1000 shadow-lg" style={{ width: `${successRate}%` }}></div>
              </div>
              
              {/* Perbaikan Error 2: Menampilkan kembali semua variabel di UI */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-sm"><p className="text-[10px] text-gray-400 font-bold uppercase">Total</p><p className="text-2xl font-black text-gray-800">{totalTasks}</p></div>
                <div className="bg-white p-4 rounded-2xl shadow-sm"><p className="text-[10px] text-green-400 font-bold uppercase">Beres</p><p className="text-2xl font-black text-green-600">{completedTasks}</p></div>
                <div className="bg-white p-4 rounded-2xl shadow-sm"><p className="text-[10px] text-yellow-400 font-bold uppercase">Pending</p><p className="text-2xl font-black text-yellow-600">{pendingTasks}</p></div>
                <div className="bg-white p-4 rounded-2xl shadow-sm"><p className="text-[10px] text-red-400 font-bold uppercase">Gagal</p><p className="text-2xl font-black text-red-600">{failedTasks}</p></div>
              </div>
            </div>
            
            <p className="text-gray-600 font-bold italic text-sm leading-relaxed mb-8 px-4">"{summaryMessage}"</p>
            <button onClick={() => setIsSummaryOpen(false)} className="w-full py-4 bg-pink-600 text-white font-black rounded-2xl shadow-lg hover:bg-pink-700 transition-all active:scale-95">Tutup Mantap</button>
          </div>
        </div>
      )}

    </div>
  )
}

export default App