import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, RotateCcw, Upload, Edit3, ShieldCheck } from "lucide-react"

interface SignatureModalProps {
  isOpen: boolean
  title?: string
  lrNo?: string
  onClose: () => void
  onSaveSignature: (signatureDataUrl: string) => Promise<void>
}

export default function SignatureModal({
  isOpen,
  title = "Capture Digital Signature",
  lrNo,
  onClose,
  onSaveSignature
}: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [mode, setMode] = useState<"draw" | "upload">("draw")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && mode === "draw") {
      const timer = setTimeout(() => {
        const canvas = canvasRef.current
        if (canvas) {
          canvas.width = canvas.offsetWidth || 500
          canvas.height = 200
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.strokeStyle = "#1e1b4b"
            ctx.lineWidth = 2.5
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
          }
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, mode])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    setHasDrawn(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    setHasDrawn(false)
    setUploadedImage(null)
    setError("")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Signature file size must be less than 5MB")
      return
    }

    setError("")
    const reader = new FileReader()
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setUploadedImage(evt.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setError("")
    let finalDataUrl = ""

    if (mode === "draw") {
      const canvas = canvasRef.current
      if (!canvas || !hasDrawn) {
        setError("Please draw a signature before saving")
        return
      }
      finalDataUrl = canvas.toDataURL("image/png")
    } else {
      if (!uploadedImage) {
        setError("Please select a signature image file")
        return
      }
      finalDataUrl = uploadedImage
    }

    setSaving(true)
    try {
      await onSaveSignature(finalDataUrl)
      handleClear()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save signature")
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden font-sans"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
              <Edit3 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">{title}</h3>
              {lrNo && <p className="text-[11px] text-gray-400 font-mono">Target LR: {lrNo}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 pt-4 flex gap-2">
          <button
            type="button"
            onClick={() => { setMode("draw"); setError(""); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === "draw" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Edit3 size={14} /> Draw Signature
          </button>
          <button
            type="button"
            onClick={() => { setMode("upload"); setError(""); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === "upload" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Upload size={14} /> Upload Image
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
              {error}
            </div>
          )}

          {mode === "draw" ? (
            <div className="space-y-2">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-1 bg-gray-50/50 relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[200px] bg-white rounded-xl touch-none cursor-crosshair"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-gray-400 font-medium">
                    Sign inside this area using mouse or touch
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-gray-500 hover:text-gray-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={12} /> Clear Signature
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-gray-50/50 hover:border-indigo-400 transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Uploaded Signature" className="max-h-[140px] object-contain rounded-lg" />
                ) : (
                  <>
                    <Upload size={24} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-700">Click to select signature image</span>
                    <span className="text-[10px] text-gray-400">PNG, JPG or WEBP up to 5MB</span>
                  </>
                )}
              </div>
              {uploadedImage && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-gray-500 hover:text-gray-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={12} /> Change Image
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
            <ShieldCheck size={12} /> Encrypted & Associated with LR
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} /> {saving ? "Saving Signature..." : "Attach Signature"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
