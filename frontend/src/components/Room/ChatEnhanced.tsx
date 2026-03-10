import { useState, useEffect, useRef, type FormEvent } from 'react'
import { sendChatMessage, subscribeToChatMessages, type ChatMessage } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { Send, MessageSquare, Mic, Square, Play, Pause, Trash2, Video } from 'lucide-react'

interface ChatProps {
  roomId: string
  onVideoCall?: () => void
}

interface VoiceMessage {
  id: string
  blob: Blob
  duration: number
  url: string
}

const Chat = ({ roomId, onVideoCall }: ChatProps) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [voicePreview, setVoicePreview] = useState<VoiceMessage | null>(null)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Subscribe to chat messages
  useEffect(() => {
    if (!roomId) return

    const unsubscribe = subscribeToChatMessages(roomId, (chatMessages) => {
      setMessages(chatMessages)
    })

    return () => unsubscribe()
  }, [roomId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (voicePreview?.url) {
        URL.revokeObjectURL(voicePreview.url)
      }
    }
  }, [])

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || sending) return

    setSending(true)
    try {
      await sendChatMessage(
        roomId,
        user.uid,
        user.displayName || 'Anonymous',
        newMessage.trim()
      )
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setVoicePreview({
          id: Date.now().toString(),
          blob,
          duration: recordingTime,
          url
        })
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Microphone access denied. Please allow microphone access to record voice messages.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const cancelVoiceMessage = () => {
    if (voicePreview?.url) {
      URL.revokeObjectURL(voicePreview.url)
    }
    setVoicePreview(null)
    setRecordingTime(0)
  }

  const sendVoiceMessage = async () => {
    if (!voicePreview || !user) return

    setSending(true)
    try {
      // Convert blob to base64
      const reader = new FileReader()
      reader.readAsDataURL(voicePreview.blob)
      reader.onloadend = async () => {
        const base64data = reader.result as string
        await sendChatMessage(
          roomId,
          user.uid,
          user.displayName || 'Anonymous',
          '🎤 Voice message',
          base64data,
          voicePreview.duration
        )
        cancelVoiceMessage()
        setSending(false)
      }
      reader.onerror = () => {
        console.error('Failed to read voice file')
        setSending(false)
      }
    } catch (error) {
      console.error('Failed to send voice message:', error)
      setSending(false)
    }
  }

  // Play a voice message from stored audio data
  const playVoiceMessage = (messageId: string, audioData: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    
    audioRef.current = new Audio(audioData)
    audioRef.current.play()
    setPlayingVoice(messageId)
    
    audioRef.current.onended = () => {
      setPlayingVoice(null)
    }
  }

  const playVoicePreview = () => {
    if (!voicePreview) return
    
    if (audioRef.current) {
      audioRef.current.pause()
    }
    
    audioRef.current = new Audio(voicePreview.url)
    audioRef.current.play()
    setPlayingVoice(voicePreview.id)
    
    audioRef.current.onended = () => {
      setPlayingVoice(null)
    }
  }

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setPlayingVoice(null)
  }

  // Generate consistent color for user
  const getUserColor = (userId: string) => {
    const colors = [
      'text-blue-400',
      'text-green-400',
      'text-purple-400',
      'text-pink-400',
      'text-yellow-400',
      'text-orange-400',
      'text-cyan-400',
      'text-red-400',
    ]
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Chat</span>
          <span className="text-xs text-gray-500">({messages.length})</span>
        </div>
        {onVideoCall && (
          <button
            onClick={onVideoCall}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition"
            title="Start video call"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.userId === user?.uid
            const isVoiceMessage = message.audioData && message.message.startsWith('🎤')
            
            return (
              <div
                key={message.id}
                className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${getUserColor(message.userId)}`}>
                    {isOwnMessage ? 'You' : message.userName}
                  </span>
                  <span className="text-xs text-gray-600">
                    {formatMessageTime(message.timestamp)}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-700 text-gray-200 rounded-bl-sm'
                  }`}
                >
                  {isVoiceMessage ? (
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <button
                        onClick={() => 
                          playingVoice === message.id 
                            ? stopPlayback() 
                            : playVoiceMessage(message.id, message.audioData!)
                        }
                        className={`p-1.5 ${isOwnMessage ? 'bg-blue-700 hover:bg-blue-800' : 'bg-gray-600 hover:bg-gray-500'} rounded-full transition`}
                      >
                        {playingVoice === message.id ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className={`h-1 ${isOwnMessage ? 'bg-blue-400' : 'bg-gray-500'} rounded-full`}>
                          <div className={`h-full ${playingVoice === message.id ? 'w-full' : 'w-0'} ${isOwnMessage ? 'bg-white' : 'bg-blue-400'} rounded-full transition-all duration-200`} />
                        </div>
                      </div>
                      <span className="text-xs opacity-75">
                        {message.audioDuration ? formatTime(message.audioDuration) : '0:00'}
                      </span>
                    </div>
                  ) : (
                    message.message
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Preview */}
      {voicePreview && (
        <div className="px-3 py-2 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
            <button
              onClick={playingVoice ? stopPlayback : playVoicePreview}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition"
            >
              {playingVoice === voicePreview.id ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <div className="flex-1">
              <div className="h-1 bg-gray-700 rounded-full">
                <div className="h-full w-full bg-blue-500 rounded-full" />
              </div>
              <span className="text-xs text-gray-400 mt-1">{formatTime(voicePreview.duration)}</span>
            </div>
            <button
              onClick={cancelVoiceMessage}
              className="p-1.5 hover:bg-red-600/20 text-red-400 rounded transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={sendVoiceMessage}
              disabled={sending}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg text-sm transition"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="px-3 py-2 bg-red-900/30 border-t border-red-800">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-400">Recording... {formatTime(recordingTime)}</span>
            <button
              onClick={stopRecording}
              className="ml-auto p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      {!isRecording && !voicePreview && (
        <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startRecording}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
              title="Record voice message"
            >
              <Mic className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default Chat
