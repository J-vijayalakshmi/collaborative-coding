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
  Copy
} from 'lucide-react'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [myRooms, setMyRooms] = useState<Room[]>([])
  const [publicRooms, setPublicRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'my-rooms' | 'public'>('my-rooms')

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
        setPublicRooms(activePublicRooms.filter(r => r.ownerId !== user.uid))
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

  const copyRoomLink = (roomId: string) => {
    const link = `${window.location.origin}/room/${roomId}`
    navigator.clipboard.writeText(link)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CodeCollab</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-400">
                {user?.displayName || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Create Room
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('my-rooms')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'my-rooms'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            My Rooms
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'public'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Public Rooms
          </button>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(activeTab === 'my-rooms' ? myRooms : publicRooms).map((room) => (
              <div
                key={room.id}
                className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {room.name}
                  </h3>
                  {room.isPrivate ? (
                    <Lock className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Globe className="w-4 h-4 text-green-500" />
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Code className="w-4 h-4" />
                    {SUPPORTED_LANGUAGES.find(l => l.id === room.language)?.name || room.language}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="w-4 h-4" />
                    {room.participants?.length || 0} / {room.maxParticipants} participants
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                  >
                    <Play className="w-4 h-4" />
                    Join
                  </button>
                  {activeTab === 'my-rooms' && (
                    <button
                      onClick={() => copyRoomLink(room.id)}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
                      title="Copy room link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {(activeTab === 'my-rooms' ? myRooms : publicRooms).length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                {activeTab === 'my-rooms' 
                  ? 'No rooms yet. Create your first room!'
                  : 'No public rooms available.'}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-6">Create New Room</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Coding Session"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Programming Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Participants
                </label>
                <input
                  type="number"
                  min={2}
                  max={50}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPrivate" className="text-sm text-gray-300">
                  Make room private (invite only)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!roomName.trim() || creating}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Room'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
