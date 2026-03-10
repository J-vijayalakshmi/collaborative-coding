import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor, { type Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useAuth } from '../../hooks/useAuth'
import { 
  getRoom, 
  joinRoom, 
  leaveRoom, 
  updateRoomCode, 
  subscribeToRoom,
  updateCursorPosition,
  removeCursor,
  subscribeToCursors,
  type CursorData
} from '../../services/firebase'
import { SUPPORTED_LANGUAGES, CODE_TEMPLATES, type Room as RoomType } from '../../types'
import { 
  Code, 
  Play, 
  Users, 
  ArrowLeft,
  Loader2,
  Terminal as TerminalIcon,
  MessageSquare,
  Download,
  Settings,
  Share2,
  Sun,
  Moon
} from 'lucide-react'
import axios from 'axios'
import Chat from './ChatEnhanced'
import InviteModal from './InviteModal'
import RoomSettings from './RoomSettings'
import VideoChat from './VideoChat'

// Helper function to darken colors for light theme visibility
const darkenColor = (color: string): string => {
  // Convert hex to RGB, darken, and return
  const hex = color.replace('#', '')
  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 40)
  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 40)
  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 40)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [room, setRoom] = useState<RoomType | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState('javascript')
  const [showOutput, setShowOutput] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [remoteCursors, setRemoteCursors] = useState<CursorData[]>([])
  
  // New features state
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showVideoChat, setShowVideoChat] = useState(false)
  const [outputHeight, setOutputHeight] = useState(200)
  const [isResizingOutput, setIsResizingOutput] = useState(false)
  const outputResizeStartRef = useRef<{ y: number; height: number } | null>(null)
  
  // Chat window dimensions
  const chatWidth = 350
  const chatHeight = 450
  
  // Track if user is currently typing to avoid overwriting their changes
  const isTypingRef = useRef(false)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSyncedCodeRef = useRef('')
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const decorationsRef = useRef<string[]>([])
  const cursorUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load room data and subscribe to updates
  useEffect(() => {
    if (!roomId || !user) return

    const loadRoom = async () => {
      try {
        const roomData = await getRoom(roomId)
        if (!roomData) {
          setError('Room not found')
          setLoading(false)
          return
        }

        // Check if room is active
        if (!roomData.isActive) {
          setError('This room has been closed')
          setLoading(false)
          return
        }

        // Check max participants
        if (roomData.participants && 
            !roomData.participants.includes(user.uid) && 
            roomData.participants.length >= roomData.maxParticipants) {
          setError('Room is full')
          setLoading(false)
          return
        }

        // Join room if not already a participant
        // Private rooms: anyone with the link can join (link sharing = invitation)
        if (!roomData.participants?.includes(user.uid)) {
          try {
            await joinRoom(roomId, user.uid)
          } catch (joinErr) {
            console.error('Error joining room:', joinErr)
            setError('Failed to join room. Please try again.')
            setLoading(false)
            return
          }
        }

        setRoom(roomData)
        const initialCode = roomData.code || CODE_TEMPLATES[roomData.language] || ''
        setCode(initialCode)
        lastSyncedCodeRef.current = initialCode
        setLanguage(roomData.language)
      } catch (err) {
        console.error('Error loading room:', err)
        setError('Failed to load room. Check if the room exists.')
      } finally {
        setLoading(false)
      }
    }

    loadRoom()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToRoom(roomId, (updatedRoom) => {
      if (updatedRoom) {
        setRoom(updatedRoom)
        // Only update code if user is not typing and code actually changed
        if (!isTypingRef.current && updatedRoom.code !== lastSyncedCodeRef.current) {
          setCode(updatedRoom.code || '')
          lastSyncedCodeRef.current = updatedRoom.code || ''
        }
      }
    })

    // Subscribe to cursor positions
    const unsubscribeCursors = subscribeToCursors(roomId, user.uid, (cursors) => {
      setRemoteCursors(cursors)
    })

    // Cleanup: leave room on unmount
    return () => {
      unsubscribe()
      unsubscribeCursors()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current)
      }
      // Remove cursor when leaving
      if (user && roomId) {
        removeCursor(roomId, user.uid).catch(console.error)
        leaveRoom(roomId, user.uid).catch(console.error)
      }
    }
  }, [roomId, user])

  // Update cursor decorations when remote cursors change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    const editor = editorRef.current
    const monaco = monacoRef.current
    const model = editor.getModel()
    
    if (!model) return

    // Create decorations for each remote cursor with position validation
    const newDecorations = remoteCursors
      .map((cursor) => {
        // Validate and clamp position to current document bounds
        const lineCount = model.getLineCount()
        const validLine = Math.min(Math.max(1, cursor.line), lineCount)
        const lineLength = model.getLineLength(validLine)
        const validColumn = Math.min(Math.max(1, cursor.column), lineLength + 1)
        
        return {
          range: new monaco.Range(validLine, validColumn, validLine, validColumn),
          options: {
            className: `remote-cursor-${cursor.oderId.slice(0, 8)}`,
            beforeContentClassName: `cursor-label-${cursor.oderId.slice(0, 8)}`,
            hoverMessage: { value: cursor.userName },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        }
      })

    // Apply decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations)

    // Inject CSS for cursor styles dynamically - visible cursor line with name label
    // Use darker colors on light theme for better visibility
    const isLightTheme = theme === 'light'
    
    remoteCursors.forEach((cursor) => {
      const styleId = `cursor-style-${cursor.oderId.slice(0, 8)}`
      // Remove old style if exists to update
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) existingStyle.remove()
      
      // Darken colors for light theme
      const cursorColor = isLightTheme ? darkenColor(cursor.color) : cursor.color
      const borderWidth = isLightTheme ? '3px' : '2px'
      
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .remote-cursor-${cursor.oderId.slice(0, 8)} {
          border-left: ${borderWidth} solid ${cursorColor} !important;
          margin-left: -1px;
          position: relative;
          box-shadow: ${isLightTheme ? `0 0 0 1px ${cursorColor}` : 'none'};
        }
        .cursor-label-${cursor.oderId.slice(0, 8)}::before {
          content: '${cursor.userName.split(' ')[0]}';
          position: absolute;
          top: -18px;
          left: 0;
          background-color: ${cursorColor};
          color: white;
          padding: 1px 4px;
          border-radius: 2px;
          font-size: 9px;
          font-weight: ${isLightTheme ? '600' : '500'};
          white-space: nowrap;
          z-index: 100;
          pointer-events: none;
          line-height: 1.2;
          ${isLightTheme ? 'box-shadow: 0 1px 3px rgba(0,0,0,0.3);' : ''}
        }
        .cursor-label-${cursor.oderId.slice(0, 8)}::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -3px;
          width: ${isLightTheme ? '8px' : '6px'};
          height: ${isLightTheme ? '8px' : '6px'};
          background-color: ${cursorColor};
          border-radius: 50%;
          z-index: 99;
          ${isLightTheme ? 'box-shadow: 0 1px 2px rgba(0,0,0,0.3);' : ''}
        }
      `
      document.head.appendChild(style)
    })
  }, [remoteCursors, code, theme]) // Re-run when code or theme changes

  // Handle editor mount
  const handleEditorMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (!roomId || !user) return

      // Debounce cursor updates
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current)
      }

      cursorUpdateTimeoutRef.current = setTimeout(() => {
        updateCursorPosition(
          roomId,
          user.uid,
          user.displayName || 'Anonymous',
          e.position.lineNumber,
          e.position.column
        ).catch(console.error)
      }, 50) // Fast updates for smooth cursor tracking
    })
  }

  // Handle code changes with debounce
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setCode(value)
      isTypingRef.current = true
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Debounce the Firestore update and typing status
      typingTimeoutRef.current = setTimeout(() => {
        if (roomId) {
          updateRoomCode(roomId, value).catch(console.error)
          lastSyncedCodeRef.current = value
        }
        isTypingRef.current = false
      }, 500)
    }
  }, [roomId])

  // Execute code
  const handleExecute = async () => {
    if (!code.trim()) return
    
    setExecuting(true)
    setShowOutput(true)
    setOutput('')
    
    try {
      const response = await axios.post('http://localhost:5000/api/execute', {
        code,
        language,
      })
      
      if (response.data.success) {
        setOutput(response.data.output || 'Code executed successfully (no output)')
      } else {
        setOutput(`Error: ${response.data.error || 'Execution failed'}`)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setOutput(`Error: ${errorMessage}`)
    } finally {
      setExecuting(false)
    }
  }

  // Handle leaving room
  const handleLeaveRoom = async () => {
    if (user && roomId) {
      await leaveRoom(roomId, user.uid)
    }
    navigate('/dashboard')
  }

  // Change language
  const handleLanguageChange = async (newLanguage: string) => {
    const newTemplate = CODE_TEMPLATES[newLanguage] || ''
    
    setLanguage(newLanguage)
    setCode(newTemplate)
    lastSyncedCodeRef.current = newTemplate
    
    // Update the room's language and code in Firebase
    if (roomId) {
      try {
        await updateRoomCode(roomId, newTemplate, newLanguage)
      } catch (err) {
        console.error('Failed to update room language:', err)
      }
    }
  }

  // Download code as file
  const handleDownload = () => {
    const currentLang = SUPPORTED_LANGUAGES.find(l => l.id === language)
    const extension = currentLang?.extension || '.txt'
    const filename = `code${extension}`
    
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')
  }

  // Handle output panel vertical resizing
  const handleOutputResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    outputResizeStartRef.current = { y: e.clientY, height: outputHeight }
    setIsResizingOutput(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingOutput || !outputResizeStartRef.current) return
      e.preventDefault()
      // Dragging up increases height, dragging down decreases
      const delta = outputResizeStartRef.current.y - e.clientY
      const newHeight = outputResizeStartRef.current.height + delta
      setOutputHeight(Math.max(100, Math.min(500, newHeight)))
    }

    const handleMouseUp = () => {
      setIsResizingOutput(false)
      outputResizeStartRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (isResizingOutput) {
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingOutput])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || 'Room not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.id === language)

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Code className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-semibold text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">{room.name}</h1>
                <p className="text-xs text-gray-500 hidden sm:block">by {room.ownerName}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[80px] sm:max-w-none"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>

            {/* Participants - with tooltip */}
            <div 
              className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 rounded-lg text-gray-300 text-xs sm:text-sm cursor-pointer group relative"
              title={`Participants: ${room.participants?.join(', ') || 'None'}`}
            >
              <Users className="w-4 h-4" />
              <span>{room.participants?.length || 1}</span>
              {/* Green dot if more than 1 participant */}
              {(room.participants?.length || 0) > 1 && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
              title={theme === 'vs-dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'vs-dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Download Code */}
            <button
              onClick={handleDownload}
              className="hidden sm:block p-1.5 sm:p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
              title="Download code"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Share/Invite */}
            <button
              onClick={() => setShowInviteModal(true)}
              className="p-1.5 sm:p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
              title="Share room"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Room Settings */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="hidden sm:block p-1.5 sm:p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
              title="Room settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Run Code */}
            <button
              onClick={handleExecute}
              disabled={executing}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg text-xs sm:text-sm transition"
            >
              {executing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Run</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Vertical Layout */}
      <div className={`flex-1 flex flex-col overflow-hidden ${theme === 'light' ? 'bg-white' : ''}`}>
        {/* Code Editor - Full Width */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={currentLanguage?.monacoId || 'javascript'}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            theme={theme}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              padding: { top: 16 },
            }}
          />
        </div>

        {/* Output Panel - Below Editor */}
        {showOutput && (
          <>
            {/* Resize Handle - Horizontal */}
            <div
              className="h-2 bg-gray-700 hover:bg-blue-500 cursor-row-resize flex items-center justify-center group transition-colors"
              onMouseDown={handleOutputResizeMouseDown}
              style={{ touchAction: 'none' }}
            >
              <div className="w-12 h-1 bg-gray-500 group-hover:bg-white rounded-full transition" />
            </div>
            
            <div 
              className="bg-gray-900 border-t border-gray-700 flex flex-col"
              style={{ height: outputHeight }}
            >
              {/* Output Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2 text-gray-300">
                  <TerminalIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Output</span>
                </div>
                <button
                  onClick={() => setShowOutput(false)}
                  className="w-8 h-8 flex items-center justify-center text-2xl text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                >
                  ×
                </button>
              </div>
              
              {/* Output Content */}
              <div className="flex-1 p-4 overflow-auto bg-gray-950">
                <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                  {executing ? (
                    <span className="text-blue-400">Running...</span>
                  ) : output ? (
                    output
                  ) : (
                    <span className="text-gray-500">Run code to see output</span>
                  )}
                </pre>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Chat Button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40"
          title="Open Chat"
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Floating Chat Window */}
      {showChat && roomId && (
        <div 
          className="fixed inset-4 sm:inset-auto sm:bottom-6 sm:right-6 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden z-40"
          style={{ 
            width: window.innerWidth < 640 ? 'auto' : chatWidth, 
            height: window.innerWidth < 640 ? 'auto' : chatHeight 
          }}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Chat</span>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="w-8 h-8 flex items-center justify-center text-2xl text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
            >
              ×
            </button>
          </div>
          
          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            <Chat 
              roomId={roomId} 
              onVideoCall={() => setShowVideoChat(true)}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {showInviteModal && roomId && (
        <InviteModal
          roomId={roomId}
          roomName={room.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {showSettingsModal && user && (
        <RoomSettings
          room={room}
          currentUserId={user.uid}
          onClose={() => setShowSettingsModal(false)}
          onRoomDeleted={() => navigate('/dashboard')}
        />
      )}

      {/* Video Chat */}
      {showVideoChat && user && roomId && (
        <VideoChat
          roomId={roomId}
          roomName={room.name}
          userName={user.displayName || 'Anonymous'}
          userId={user.uid}
          onClose={() => setShowVideoChat(false)}
        />
      )}
    </div>
  )
}

export default Room
