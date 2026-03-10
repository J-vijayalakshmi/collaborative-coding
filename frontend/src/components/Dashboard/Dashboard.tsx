import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getUserRooms, getActiveRooms, createRoom } from '../../services/firebase'
import { SUPPORTED_LANGUAGES, CODE_TEMPLATES, type Room } from '../../types'
import { 
  Code, 
  Plus, 
  LogOut, 
  Users, 
  Lock, 
  Globe,
  Play,
  Copy,
  Share2,
  Filter,
  Zap,
  Sparkles,
  ChevronRight,
  Moon,
  Sun,
  X,
  Check,
  LayoutDashboard,
  FolderCode,
  Activity,
  Mail,
  Link,
  MessageCircle
} from 'lucide-react'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [myRooms, setMyRooms] = useState<Room[]>([])
  const [publicRooms, setPublicRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'my-rooms' | 'public'>('my-rooms')
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('dashboard-theme')
    return (saved as 'dark' | 'light') || 'dark'
  })
  const [showShareModal, setShowShareModal] = useState<Room | null>(null)
  const [shareEmail, setShareEmail] = useState('')
  const [shareCopied, setShareCopied] = useState(false)

  // Create room form state
  const [roomName, setRoomName] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [isPrivate, setIsPrivate] = useState(false)
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const fetchRooms = async () => {
      if (!user) return
      
      try {
        const [userRooms, activePublicRooms] = await Promise.all([
          getUserRooms(user.uid),
          getActiveRooms()
        ])
        setMyRooms(userRooms)
        setPublicRooms(activePublicRooms)
      } catch (error) {
        console.error('Error fetching rooms:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRooms()
  }, [user])

  const handleCreateRoom = async () => {
    if (!user || !roomName.trim()) return
    
    setCreating(true)
    try {
      const roomId = await createRoom({
        name: roomName.trim(),
        ownerName: user.displayName || 'Anonymous',
        language,
        isPrivate,
        maxParticipants,
        code: CODE_TEMPLATES[language] || '',
        interviewMode: false,
      }, user.uid)
      
      setShowCreateModal(false)
      setRoomName('')
      navigate(`/room/${roomId}`)
    } catch (error) {
      console.error('Error creating room:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleJoinRoom = (roomId: string) => {
    navigate(`/room/${roomId}`)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const baseRooms = activeTab === 'my-rooms' ? myRooms : publicRooms
  const filteredRooms = baseRooms.filter(room => {
    // Visibility filter
    const matchesVisibility = visibilityFilter === 'all' ||
      (visibilityFilter === 'public' && !room.isPrivate) ||
      (visibilityFilter === 'private' && room.isPrivate)
    
    return matchesVisibility
  })

  // Theme toggle
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('dashboard-theme', newTheme)
  }

  // Share functions
  const getRoomLink = (roomId: string) => `${window.location.origin}/room/${roomId}`
  
  const copyShareLink = () => {
    if (!showShareModal) return
    navigator.clipboard.writeText(getRoomLink(showShareModal.id))
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  const shareViaEmail = () => {
    if (!showShareModal) return
    const link = getRoomLink(showShareModal.id)
    const subject = encodeURIComponent(`Join my coding room: ${showShareModal.name}`)
    const body = encodeURIComponent(`Hey!\n\nI'd like to invite you to join my collaborative coding session.\n\nRoom: ${showShareModal.name}\nLanguage: ${showShareModal.language}\n\nJoin here: ${link}`)
    window.open(`mailto:${shareEmail}?subject=${subject}&body=${body}`)
  }

  const shareViaWhatsApp = () => {
    if (!showShareModal) return
    const link = getRoomLink(showShareModal.id)
    const text = encodeURIComponent(`Join my coding room "${showShareModal.name}"! 🚀\n\n${link}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const totalParticipants = myRooms.reduce((acc, room) => acc + (room.participants?.length || 0), 0)
  const activeRoomsCount = myRooms.filter(room => (room.participants?.length || 0) > 0).length

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      javascript: 'from-yellow-500 to-orange-500',
      typescript: 'from-blue-500 to-blue-600',
      python: 'from-green-500 to-emerald-600',
      java: 'from-red-500 to-orange-600',
      cpp: 'from-purple-500 to-indigo-600',
      c: 'from-gray-500 to-slate-600',
      csharp: 'from-violet-500 to-purple-600',
      go: 'from-cyan-500 to-blue-500',
      rust: 'from-orange-600 to-red-600',
      ruby: 'from-red-500 to-pink-600',
      php: 'from-indigo-500 to-violet-600',
      swift: 'from-orange-500 to-red-500',
    }
    return colors[lang] || 'from-gray-500 to-gray-600'
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-linear-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-linear-to-br from-gray-100 via-white to-gray-50'}`}>
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] ${theme === 'dark' ? 'from-blue-900/20' : 'from-blue-400/20'} via-transparent to-transparent`}></div>
        <div className={`absolute top-0 left-1/4 w-96 h-96 ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-400/20'} rounded-full blur-3xl`}></div>
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-400/20'} rounded-full blur-3xl`}></div>
      </div>

      {/* Header */}
      <header className={`relative z-10 backdrop-blur-xl border-b transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900/80 border-gray-800/50' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 ${theme === 'dark' ? 'border-gray-900' : 'border-white'}`}></div>
              </div>
              <div>
                <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>CodeCollab</span>
                <span className={`hidden sm:block text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Real-time Collaboration</span>
              </div>
            </div>
            
            {/* User Section */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition ${theme === 'dark' ? 'text-gray-400 hover:text-yellow-400 hover:bg-gray-800' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* User Profile */}
              <div className={`flex items-center gap-3 pl-3 border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="hidden sm:block text-right">
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.displayName || 'User'}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{user?.email}</p>
                </div>
                <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${theme === 'dark' ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-500 hover:text-red-500 hover:bg-red-50'}`}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {user?.displayName?.split(' ')[0] || 'Developer'}! 👋
          </h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Ready to code? Create a room or join an existing session.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`bg-linear-to-br from-blue-500/10 to-blue-600/5 border rounded-2xl p-4 sm:p-5 ${theme === 'dark' ? 'border-blue-500/20' : 'border-blue-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <FolderCode className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">Total</span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{myRooms.length}</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>My Rooms</p>
          </div>

          <div className={`bg-linear-to-br from-green-500/10 to-green-600/5 border rounded-2xl p-4 sm:p-5 ${theme === 'dark' ? 'border-green-500/20' : 'border-green-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">Live</span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{activeRoomsCount}</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Active Rooms</p>
          </div>

          <div className={`bg-linear-to-br from-purple-500/10 to-purple-600/5 border rounded-2xl p-4 sm:p-5 ${theme === 'dark' ? 'border-purple-500/20' : 'border-purple-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">Online</span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{totalParticipants}</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Participants</p>
          </div>

          <div className={`bg-linear-to-br from-orange-500/10 to-orange-600/5 border rounded-2xl p-4 sm:p-5 ${theme === 'dark' ? 'border-orange-500/20' : 'border-orange-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full">Public</span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{publicRooms.length}</p>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Public Rooms</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 flex items-center justify-between p-4 sm:p-5 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl transition group shadow-lg shadow-blue-500/25"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-lg">Create New Room</p>
                <p className="text-blue-200 text-sm">Start a coding session</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={() => setActiveTab('public')}
            className="flex-1 flex items-center justify-between p-4 sm:p-5 bg-linear-to-r from-purple-600/50 to-purple-700/50 hover:from-purple-600 hover:to-purple-700 border border-purple-500/30 rounded-2xl transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-lg">Explore Rooms</p>
                <p className="text-purple-300 text-sm">Join public sessions</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-400/50 group-hover:text-purple-300 group-hover:translate-x-1 transition" />
          </button>
        </div>

        {/* Search and Tabs */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Row 1: Tabs */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Tabs */}
            <div className={`flex backdrop-blur rounded-xl p-1 border overflow-x-auto ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200'}`}>
              <button
                onClick={() => setActiveTab('my-rooms')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'my-rooms'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">My Rooms</span>
                <span className="sm:hidden">Mine</span>
                <span className={`px-1.5 sm:px-2 py-0.5 text-xs rounded-full ${activeTab === 'my-rooms' ? 'bg-white/20' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  {myRooms.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('public')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'public'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Globe className="w-4 h-4" />
                Public
                <span className={`px-1.5 sm:px-2 py-0.5 text-xs rounded-full ${activeTab === 'public' ? 'bg-white/20' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  {publicRooms.length}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: Visibility Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className={`w-4 h-4 shrink-0 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className={`text-xs sm:text-sm mr-1 sm:mr-2 shrink-0 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Filter:</span>
            <div className={`flex rounded-lg p-1 border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200'}`}>
              <button
                onClick={() => setVisibilityFilter('all')}
                className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  visibilityFilter === 'all'
                    ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
                    : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVisibilityFilter('public')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  visibilityFilter === 'public'
                    ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                    : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Globe className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                Public
              </button>
              <button
                onClick={() => setVisibilityFilter('private')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  visibilityFilter === 'private'
                    ? 'bg-gray-600/20 text-gray-300 border border-gray-500/30'
                    : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Lock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                Private
              </button>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500"></div>
              <Code className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500" />
            </div>
            <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading your rooms...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
              {activeTab === 'my-rooms' ? (
                <FolderCode className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              ) : (
                <Globe className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              )}
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {activeTab === 'my-rooms' ? 'No rooms yet' : 'No public rooms available'}
            </h3>
            <p className={`text-center max-w-md mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {activeTab === 'my-rooms'
                ? 'Create your first room to start coding with others!'
                : 'Check back later for public rooms to join.'}
            </p>
            {activeTab === 'my-rooms' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-lg shadow-blue-500/25"
              >
                <Plus className="w-5 h-5" />
                Create Your First Room
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className={`group backdrop-blur border rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600 hover:shadow-black/20' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-gray-200/50'}`}
              >
                {/* Card Header with gradient */}
                <div className={`h-2 bg-linear-to-r ${getLanguageColor(room.language)}`}></div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-semibold truncate group-hover:text-blue-400 transition ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {room.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        by {room.ownerName || 'Anonymous'}
                      </p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                      room.isPrivate 
                        ? theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {room.isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {room.isPrivate ? 'Private' : 'Public'}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mb-5">
                    <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'text-gray-400 bg-gray-700/50' : 'text-gray-600 bg-gray-100'}`}>
                      <Code className="w-4 h-4" />
                      {SUPPORTED_LANGUAGES.find(l => l.id === room.language)?.name || room.language}
                    </div>
                    <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'text-gray-400 bg-gray-700/50' : 'text-gray-600 bg-gray-100'}`}>
                      <Users className="w-4 h-4" />
                      {room.participants?.length || 0} / {room.maxParticipants}
                    </div>
                    {(room.participants?.length || 0) > 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/20 px-3 py-1.5 rounded-lg">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Active
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-blue-500/25"
                    >
                      <Play className="w-4 h-4" />
                      Join Room
                    </button>
                    {activeTab === 'my-rooms' && (
                      <button
                        onClick={() => setShowShareModal(room)}
                        className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        title="Share room"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className={`rounded-2xl w-full max-w-lg shadow-2xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Create New Room</h2>
                  <p className="text-sm text-gray-500">Start a coding session</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-2 rounded-lg transition ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${theme === 'dark' ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500' : 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400'}`}
                  placeholder="e.g., JavaScript Practice Session"
                  autoFocus
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Programming Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SUPPORTED_LANGUAGES.slice(0, 6).map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setLanguage(lang.id)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition border ${
                        language === lang.id
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`w-full mt-2 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${theme === 'dark' ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-gray-100 border border-gray-200 text-gray-900'}`}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Max Participants
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${theme === 'dark' ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-gray-100 border border-gray-200 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Visibility
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition border ${
                        !isPrivate
                          ? 'bg-green-600/20 border-green-500/50 text-green-400'
                          : theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600' : 'bg-gray-100 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition border ${
                        isPrivate
                          ? 'bg-gray-600/20 border-gray-500/50 text-gray-300'
                          : theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600' : 'bg-gray-100 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      Private
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex gap-3 p-6 border-t ${theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`flex-1 px-4 py-3 rounded-xl transition font-medium ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!roomName.trim() || creating}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-xl transition font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Create Room
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={() => setShowShareModal(null)}
        >
          <div 
            className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl border-t sm:border ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle for mobile */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className={`w-10 h-1 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            </div>
            
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className={`text-lg sm:text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Share Room</h2>
                  <p className="text-sm text-gray-500 truncate max-w-40 sm:max-w-50">{showShareModal.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(null)}
                className={`p-2 rounded-lg transition ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Copy Link */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Room Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getRoomLink(showShareModal.id)}
                    className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm focus:outline-none ${theme === 'dark' ? 'bg-gray-800 border border-gray-700 text-gray-300' : 'bg-gray-100 border border-gray-200 text-gray-700'}`}
                  />
                  <button
                    onClick={copyShareLink}
                    className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition flex items-center gap-2 ${
                      shareCopied 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {shareCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Share via Email */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Share via Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="Enter email address"
                    className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500' : 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400'}`}
                  />
                  <button
                    onClick={shareViaEmail}
                    disabled={!shareEmail}
                    className="px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-xl transition"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Share Options */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quick Share
                </label>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={shareViaWhatsApp}
                    className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={copyShareLink}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition text-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    <Link className="w-4 h-4" />
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
