import { useState, useEffect } from 'react'
import { Video, Phone, PhoneOff } from 'lucide-react'
import { db } from '../../services/firebase'
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore'

interface IncomingCallProps {
  roomId: string
  currentUserId: string
  onAccept: () => void
  onDecline: () => void
}

interface CallData {
  offererId: string
  offererName: string
  timestamp: number
  offer: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
}

const IncomingCall = ({ roomId, currentUserId, onAccept, onDecline }: IncomingCallProps) => {
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null)
  const [isRinging, setIsRinging] = useState(false)

  const callDocId = `video-${roomId}`

  useEffect(() => {
    const callDoc = doc(db, 'videoCalls', callDocId)
    
    const unsubscribe = onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data() as CallData | undefined
      
      if (data?.offer && data.offererId !== currentUserId && !data.answer) {
        // There's an incoming call from someone else
        const callAge = Date.now() - (data.timestamp || 0)
        
        // Only show notification for calls less than 30 seconds old
        if (callAge < 30000) {
          setIncomingCall(data)
          setIsRinging(true)
        }
      } else {
        setIncomingCall(null)
        setIsRinging(false)
      }
    })

    return () => unsubscribe()
  }, [callDocId, currentUserId])

  const handleAccept = () => {
    setIsRinging(false)
    setIncomingCall(null)
    onAccept()
  }

  const handleDecline = async () => {
    setIsRinging(false)
    setIncomingCall(null)
    // Delete the call document to reject the call
    try {
      const callDoc = doc(db, 'videoCalls', callDocId)
      await deleteDoc(callDoc)
    } catch (err) {
      console.error('Error declining call:', err)
    }
    onDecline()
  }

  if (!isRinging || !incomingCall) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700 max-w-sm w-full mx-4 animate-pulse">
        {/* Caller Info */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Incoming Video Call</h2>
          <p className="text-gray-400">{incomingCall.offererName} is calling...</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleDecline}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-lg hover:shadow-xl"
          >
            <PhoneOff className="w-5 h-5" />
            <span>Decline</span>
          </button>
          <button
            onClick={handleAccept}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full transition-all shadow-lg hover:shadow-xl animate-pulse"
          >
            <Phone className="w-5 h-5" />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncomingCall
