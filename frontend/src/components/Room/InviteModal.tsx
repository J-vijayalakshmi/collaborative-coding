import { useState } from 'react'
import { X, Copy, Check, Link2, Mail, MessageCircle, QrCode } from 'lucide-react'

interface InviteModalProps {
  roomId: string
  roomName: string
  onClose: () => void
}

const InviteModal = ({ roomId, roomName, onClose }: InviteModalProps) => {
  const [copied, setCopied] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)

  const roomLink = `${window.location.origin}/room/${roomId}`
  
  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join my coding session: ${roomName}`)
    const body = encodeURIComponent(
      `Hey!\n\nI'd like you to join my collaborative coding session.\n\nRoom: ${roomName}\nLink: ${roomLink}\n\nSee you there!`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `Join my coding session: ${roomName}\n${roomLink}`
    )
    window.open(`https://wa.me/?text=${text}`)
  }

  const generateQRCode = () => {
    // Using QR code API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(roomLink)}`
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md shadow-2xl border border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Invite Collaborators</h2>
              <p className="text-xs text-gray-400">Share this room with others</p>
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
        <div className="p-6 space-y-5">
          {/* Room Link */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Room Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomLink}
                readOnly
                className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-gray-300 text-sm focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(roomLink, 'link')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
              >
                {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div>
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
            >
              <QrCode className="w-4 h-4" />
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </button>
            {showQR && (
              <div className="mt-3 flex justify-center">
                <div className="bg-white p-3 rounded-lg">
                  <img src={generateQRCode()} alt="Room QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}
          </div>

          {/* Share Options */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Share via</label>
            <div className="flex gap-3">
              <button
                onClick={shareViaEmail}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                <Mail className="w-5 h-5" />
                <span className="text-sm">Email</span>
              </button>
              <button
                onClick={shareViaWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Copy All */}
          <button
            onClick={() => copyToClipboard(
              `Room: ${roomName}\nLink: ${roomLink}`,
              'all'
            )}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition flex items-center justify-center gap-2"
          >
            {copied === 'all' ? (
              <>
                <Check className="w-5 h-5 text-green-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copy All Details</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InviteModal
