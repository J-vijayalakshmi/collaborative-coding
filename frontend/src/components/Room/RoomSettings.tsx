import { useState } from 'react'
import { X, Settings, Lock, Unlock, Users, Trash2, Crown, UserMinus } from 'lucide-react'
import { updateDoc, doc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import type { Room } from '../../types'

interface RoomSettingsProps {
  room: Room
  currentUserId: string
  onClose: () => void
  onRoomDeleted: () => void
}

const RoomSettings = ({ room, currentUserId, onClose, onRoomDeleted }: RoomSettingsProps) => {
  const [roomName, setRoomName] = useState(room.name)
  const [isPrivate, setIsPrivate] = useState(room.isPrivate)
  const [password, setPassword] = useState(room.password || '')
  const [maxParticipants, setMaxParticipants] = useState(room.maxParticipants)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isOwner = currentUserId === room.ownerId

  const handleSave = async () => {
    if (!isOwner) return
    
    setSaving(true)
    try {
      await updateDoc(doc(db, 'rooms', room.id), {
        name: roomName,
        isPrivate,
        password: isPrivate ? password : null,
        maxParticipants,
      })
      onClose()
    } catch (error) {
      console.error('Failed to update room:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!isOwner) return
    
    setDeleting(true)
    try {
      // Mark room as inactive instead of deleting
      await updateDoc(doc(db, 'rooms', room.id), {
        isActive: false,
      })
      onRoomDeleted()
    } catch (error) {
      console.error('Failed to delete room:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleKickUser = async (userId: string) => {
    if (!isOwner || userId === room.ownerId) return
    
    try {
      const currentParticipants = room.participants.filter(p => p !== userId)
      await updateDoc(doc(db, 'rooms', room.id), {
        participants: currentParticipants,
      })
    } catch (error) {
      console.error('Failed to kick user:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl border border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Room Settings</h2>
              <p className="text-xs text-gray-400">
                {isOwner ? 'Manage your room' : 'View room settings'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              disabled={!isOwner}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
            />
          </div>

          {/* Privacy Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Room Privacy</label>
            <div className="flex gap-3">
              <button
                onClick={() => isOwner && setIsPrivate(false)}
                disabled={!isOwner}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition ${
                  !isPrivate
                    ? 'bg-green-600/20 border-green-500 text-green-400'
                    : 'bg-gray-900 border-gray-600 text-gray-400 hover:bg-gray-700'
                } ${!isOwner && 'opacity-60 cursor-not-allowed'}`}
              >
                <Unlock className="w-5 h-5" />
                <span>Public</span>
              </button>
              <button
                onClick={() => isOwner && setIsPrivate(true)}
                disabled={!isOwner}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition ${
                  isPrivate
                    ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                    : 'bg-gray-900 border-gray-600 text-gray-400 hover:bg-gray-700'
                } ${!isOwner && 'opacity-60 cursor-not-allowed'}`}
              >
                <Lock className="w-5 h-5" />
                <span>Private</span>
              </button>
            </div>
          </div>

          {/* Password (if private) */}
          {isPrivate && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Room Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!isOwner}
                placeholder="Enter password for private room"
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
              />
            </div>
          )}

          {/* Max Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Participants: {maxParticipants}
            </label>
            <input
              type="range"
              min="2"
              max="10"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              disabled={!isOwner}
              className="w-full accent-purple-500 disabled:opacity-60"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>2</span>
              <span>10</span>
            </div>
          </div>

          {/* Participants List */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <Users className="w-4 h-4 inline mr-2" />
              Participants ({room.participants?.length || 0})
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {room.participants?.map((participantId) => (
                <div
                  key={participantId}
                  className="flex items-center justify-between px-4 py-2.5 bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-xs text-gray-300">
                        {participantId.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-300">
                      {participantId === room.ownerId ? (
                        <span className="flex items-center gap-2">
                          Owner
                          <Crown className="w-4 h-4 text-yellow-500" />
                        </span>
                      ) : participantId === currentUserId ? (
                        'You'
                      ) : (
                        `User ${participantId.slice(0, 6)}...`
                      )}
                    </span>
                  </div>
                  {isOwner && participantId !== room.ownerId && (
                    <button
                      onClick={() => handleKickUser(participantId)}
                      className="p-1.5 hover:bg-red-600/20 text-red-400 rounded transition"
                      title="Remove from room"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {isOwner && (
            <div className="space-y-3 pt-4 border-t border-gray-700">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg transition font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              {/* Delete Room */}
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 bg-gray-700 hover:bg-red-600/20 text-red-400 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Room
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-400 text-center">
                    Are you sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteRoom}
                      disabled={deleting}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg transition"
                    >
                      {deleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomSettings
