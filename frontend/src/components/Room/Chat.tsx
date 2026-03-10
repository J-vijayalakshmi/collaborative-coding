import { useState, useEffect, useRef, type FormEvent } from 'react'
import { sendChatMessage, subscribeToChatMessages, type ChatMessage } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { Send, MessageSquare } from 'lucide-react'

interface ChatProps {
  roomId: string
}

const Chat = ({ roomId }: ChatProps) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
        <MessageSquare className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-300">Chat</span>
        <span className="text-xs text-gray-500">({messages.length})</span>
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
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-700 text-gray-200 rounded-bl-sm'
                  }`}
                >
                  {message.message}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
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
    </div>
  )
}

export default Chat
