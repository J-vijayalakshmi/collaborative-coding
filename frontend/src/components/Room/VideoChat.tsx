import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Video, VideoOff, Mic, MicOff, PhoneOff, Maximize2, Minimize2, Users } from 'lucide-react'
import { db } from '../../services/firebase'
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  deleteDoc,
  addDoc,
  updateDoc,
  getDoc
} from 'firebase/firestore'

interface VideoChatProps {
  roomId: string
  roomName: string
  userName: string
  userId: string
  onClose: () => void
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Free TURN server for NAT traversal
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ]
}

const VideoChat = ({ roomId, roomName, userName, userId, onClose }: VideoChatProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const unsubscribersRef = useRef<(() => void)[]>([])
  
  const [isConnecting, setIsConnecting] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [audioMuted, setAudioMuted] = useState(false)
  const [videoMuted, setVideoMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [participantCount, setParticipantCount] = useState(1)
  const [remoteUserName, setRemoteUserName] = useState<string>('')

  const callDocId = `video-${roomId}`

  // Cleanup function
  const cleanup = useCallback(async () => {
    // Unsubscribe from all listeners
    unsubscribersRef.current.forEach(unsub => unsub())
    unsubscribersRef.current = []
    
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
  }, [])

  // Initialize local media
  const initLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: true
      })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      return stream
    } catch (err) {
      console.error('Failed to get media:', err)
      setError('Camera/mic access denied')
      return null
    }
  }, [])

  // Create WebRTC offer (caller)
  const createOffer = useCallback(async (pc: RTCPeerConnection) => {
    const callDoc = doc(db, 'videoCalls', callDocId)
    const offerCandidates = collection(callDoc, 'offerCandidates')
    const answerCandidates = collection(callDoc, 'answerCandidates')

    // Collect ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON())
      }
    }

    // Create offer
    const offerDescription = await pc.createOffer()
    await pc.setLocalDescription(offerDescription)

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    }

    await setDoc(callDoc, { 
      offer, 
      offererId: userId, 
      offererName: userName,
      timestamp: Date.now() 
    })

    // Listen for answer
    const unsubCall = onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data()
      if (data?.answer && !pc.currentRemoteDescription) {
        const answerDescription = new RTCSessionDescription(data.answer)
        pc.setRemoteDescription(answerDescription)
        if (data.answererName) {
          setRemoteUserName(data.answererName)
        }
      }
    })
    unsubscribersRef.current.push(unsubCall)

    // Listen for remote ICE candidates
    const unsubCandidates = onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data())
          pc.addIceCandidate(candidate)
        }
      })
    })
    unsubscribersRef.current.push(unsubCandidates)
  }, [callDocId, userName, userId])

  // Answer existing call (callee)
  const answerCall = useCallback(async (pc: RTCPeerConnection, offerData: any, offererName: string) => {
    const callDoc = doc(db, 'videoCalls', callDocId)
    const offerCandidates = collection(callDoc, 'offerCandidates')
    const answerCandidates = collection(callDoc, 'answerCandidates')

    setRemoteUserName(offererName)

    // Collect ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON())
      }
    }

    // Set remote description from offer
    await pc.setRemoteDescription(new RTCSessionDescription(offerData))

    // Create answer
    const answerDescription = await pc.createAnswer()
    await pc.setLocalDescription(answerDescription)

    const answer = {
      sdp: answerDescription.sdp,
      type: answerDescription.type
    }

    await updateDoc(callDoc, { answer, answererId: userId, answererName: userName })

    // Listen for remote ICE candidates
    const unsubCandidates = onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data())
          pc.addIceCandidate(candidate)
        }
      })
    })
    unsubscribersRef.current.push(unsubCandidates)
  }, [callDocId, userId, userName])

  // Initialize WebRTC connection
  useEffect(() => {
    let mounted = true

    const init = async () => {
      // Get local media first
      const stream = await initLocalMedia()
      if (!stream || !mounted) return

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS)
      peerConnectionRef.current = pc

      // Add local tracks to connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('ontrack fired:', event.streams)
        if (event.streams[0]) {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0]
          }
          setIsConnected(true)
          setIsConnecting(false)
          setParticipantCount(2)
        }
      }

      // Handle ICE connection state
      pc.oniceconnectionstatechange = () => {
        console.log('ICE state:', pc.iceConnectionState)
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setIsConnecting(false)
          setIsConnected(true)
        }
      }

      // Handle connection state
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState)
        if (pc.connectionState === 'connected') {
          setIsConnecting(false)
          setIsConnected(true)
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsConnected(false)
          setParticipantCount(1)
          setRemoteUserName('')
        }
      }

      // Check if there's an existing call to answer
      const callDoc = doc(db, 'videoCalls', callDocId)
      const callSnapshot = await getDoc(callDoc)
      const existingData = callSnapshot.data()
      
      console.log('Checking for existing call:', existingData)
      
      if (existingData?.offer && existingData.offererId !== userId && !existingData.answer) {
        // Answer existing call
        console.log('Answering existing call from:', existingData.offererName)
        await answerCall(pc, existingData.offer, existingData.offererName || 'User')
        setIsConnecting(false)
      } else if (existingData?.offer && existingData.offererId === userId) {
        // We already have an offer from ourselves, restore the connection
        console.log('Resuming our existing call')
        await createOffer(pc)
        setIsConnecting(false)
      } else {
        // Create new call - add small random delay to reduce race conditions
        const delay = Math.random() * 500
        console.log(`Creating new call with ${delay}ms delay`)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Re-check if someone else created a call while we waited
        const recheck = await getDoc(callDoc)
        const recheckData = recheck.data()
        
        if (recheckData?.offer && recheckData.offererId !== userId && !recheckData.answer) {
          console.log('Found offer during delay, answering instead')
          await answerCall(pc, recheckData.offer, recheckData.offererName || 'User')
        } else {
          // Safe to create offer
          try {
            await deleteDoc(callDoc)
          } catch {}
          await createOffer(pc)
        }
        setIsConnecting(false)
      }
    }

    init()

    return () => {
      mounted = false
      cleanup()
    }
  }, [initLocalMedia, createOffer, answerCall, callDocId, userId, cleanup])

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setAudioMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setVideoMuted(!videoTrack.enabled)
      }
    }
  }

  const hangUp = async () => {
    await cleanup()
    // Delete call document
    try {
      const callDoc = doc(db, 'videoCalls', callDocId)
      await deleteDoc(callDoc)
    } catch (e) {
      console.error('Error deleting call doc:', e)
    }
    onClose()
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 z-50 flex flex-col overflow-hidden rounded-xl shadow-2xl border border-gray-700 w-72">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-sm font-medium text-white">Video Chat</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-red-400 text-sm p-4 text-center">
          {error}. Please allow camera and microphone access.
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`fixed bg-gray-900 z-50 flex flex-col overflow-hidden transition-all duration-300 rounded-xl shadow-2xl border border-gray-700 ${
        isFullscreen 
          ? 'inset-4' 
          : 'bottom-4 right-4 w-72 sm:w-80'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-green-400" />
          <span className="text-xs font-medium text-white truncate max-w-20">
            {roomName}
          </span>
          <div className="flex items-center gap-1 text-gray-400">
            <Users className="w-3 h-3" />
            <span className="text-xs">{participantCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFullscreen}
            className="p-1 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Container - Grid layout for both videos */}
      <div className={`relative bg-gray-950 ${isFullscreen ? 'flex-1' : ''}`}>
        <div className={`grid grid-cols-2 gap-1 p-1 ${isFullscreen ? 'h-full' : 'h-40'}`}>
          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {videoMuted && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white">
              You
            </div>
          </div>

          {/* Remote Video - Always render, show placeholder if not connected */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${isConnected ? '' : 'hidden'}`}
            />
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-2">
                  <Users className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-500">
                    {isConnecting ? 'Connecting...' : 'Waiting for peer...'}
                  </span>
                </div>
              </div>
            )}
            {isConnected && (
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white">
                {remoteUserName || 'Peer'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 border-t border-gray-700">
        <button
          onClick={toggleAudio}
          className={`p-2 rounded-full transition ${
            audioMuted 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={audioMuted ? 'Unmute' : 'Mute'}
        >
          {audioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        
        <button
          onClick={toggleVideo}
          className={`p-2 rounded-full transition ${
            videoMuted 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={videoMuted ? 'Turn on camera' : 'Turn off camera'}
        >
          {videoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </button>
        
        <button
          onClick={hangUp}
          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition"
          title="End call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default VideoChat
