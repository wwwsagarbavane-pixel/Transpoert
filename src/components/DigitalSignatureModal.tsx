import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, ShieldAlert, Key, Lock, X, RefreshCw, CheckCircle2, FileText, UserCheck, AlertTriangle } from "lucide-react"
import { DBLR } from "../db/schema"
import { digitalSignatureService, SignatureVerificationResult } from "../services/digitalSignatureService"
import { companyContext } from "../services/companyContext"
import { sessionService } from "../services/sessionService"

interface DigitalSignatureModalProps {
  isOpen: boolean
  lr: DBLR | null
  onClose: () => void
  onSignatureUpdated?: () => void
}

export default function DigitalSignatureModal({ isOpen, lr, onClose, onSignatureUpdated }: DigitalSignatureModalProps) {
  const [loading, setLoading] = useState(false)
  const [signing, setSigning] = useState(false)
  const [verification, setVerification] = useState<SignatureVerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedHash, setCopiedHash] = useState(false)

  const activeCompanyId = companyContext.getActiveCompanyId()
  const session = sessionService.getSession()
  const currentUser = session?.user

  useEffect(() => {
    if (!isOpen || !lr) return
    setError(null)
    setVerification(null)

    const fetchVerification = async () => {
      setLoading(true)
      try {
        const res = await digitalSignatureService.verifyLRSignature(lr.id || lr.lr)
        setVerification(res)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchVerification()
  }, [isOpen, lr])

  if (!isOpen || !lr) return null

  const handleSignLR = async () => {
    setSigning(true)
    setError(null)
    try {
      const res = await digitalSignatureService.signLR(lr.id || lr.lr)
      if (!res.success) {
        setError(res.error || "Digital signing failed.")
        return
      }

      // Re-verify immediately after signing
      const verifyRes = await digitalSignatureService.verifyLRSignature(lr.id || lr.lr)
      setVerification(verifyRes)
      if (onSignatureUpdated) onSignatureUpdated()
    } catch (err: any) {
      setError(err.message || "Signing failed")
    } finally {
      setSigning(false)
    }
  }

  const handleReVerify = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await digitalSignatureService.verifyLRSignature(lr.id || lr.lr)
      setVerification(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const isSigned = Boolean(lr.is_digitally_signed || (verification && verification.signature))
  const isValid = verification?.valid === true

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isValid ? "bg-emerald-100 text-emerald-700" : isSigned ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Cryptographic Digital Signature</h3>
                <p className="text-xs text-gray-500 font-mono">LR No: {lr.lr || lr.lrNo}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* Confirmation Box when LR is not signed */}
            {!isSigned && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
                    <span>Company:</span>
                    <span className="font-bold text-gray-900">{activeCompanyId}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
                    <span>Signer:</span>
                    <span className="font-bold text-gray-900">{currentUser?.name || currentUser?.email || "Authorized User"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
                    <span>Role:</span>
                    <span className="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded text-[10px]">{currentUser?.role || "Company Admin"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
                    <span>Cryptographic Spec:</span>
                    <span className="font-mono text-[11px] text-gray-700">RSA-2048 + SHA-256</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <p className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <Lock size={13} className="text-indigo-600" /> Secure Server-Side Cryptographic Signing
                  </p>
                  <p>
                    Signing computes a deterministic SHA-256 digest of all LR details and cargo items, and signs it using the company's protected RSA-2048 private key.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSignLR}
                  disabled={signing}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {signing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Digitally Signing LR (RSA-2048)...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} /> Digitally Sign LR Now
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Signature Verification Details when LR is signed */}
            {isSigned && (
              <div className="space-y-4">
                {/* Verification Status Card */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isValid ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-red-50 border-red-200 text-red-950"
                }`}>
                  <div className="flex items-center gap-3">
                    {isValid ? (
                      <div className="p-2 bg-emerald-600 text-white rounded-lg">
                        <CheckCircle2 size={20} />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-600 text-white rounded-lg">
                        <ShieldAlert size={20} />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-extrabold flex items-center gap-1.5">
                        {isValid ? "Digital Signature Valid" : "Signature Invalid / Document Modified"}
                      </div>
                      <p className="text-xs opacity-80 font-medium">
                        {isValid ? "RSA-2048 Public Key Verification Passed" : verification?.verification?.error || "LR contents modified after signing"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReVerify}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white shadow-xs border border-gray-200 hover:bg-gray-50 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Verify
                  </button>
                </div>

                {/* Signature Metadata Table */}
                <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-500 font-medium flex items-center gap-1">
                      <UserCheck size={14} className="text-indigo-600" /> Signer
                    </span>
                    <span className="font-bold text-gray-900">{verification?.signature?.signed_by || verification?.verification?.signerName || "Authorized Signer"}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-500 font-medium flex items-center gap-1">
                      <Lock size={14} className="text-indigo-600" /> Role
                    </span>
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">{verification?.signature?.signed_by_role || verification?.verification?.signerRole || "Company Admin"}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-500 font-medium">Signed At</span>
                    <span className="font-mono text-gray-800 text-[11px]">
                      {verification?.signature?.signed_at ? new Date(verification.signature.signed_at).toLocaleString("en-IN") : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-500 font-medium">Algorithm</span>
                    <span className="font-mono font-bold text-indigo-900">RSA-2048 / SHA-256</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-500 font-medium">Document Version</span>
                    <span className="font-mono text-gray-900 bg-gray-200 px-2 py-0.5 rounded text-[10px] font-bold">
                      v{verification?.signature?.document_version || lr.document_version || 1}
                    </span>
                  </div>

                  {/* SHA-256 Hash Display */}
                  {(verification?.signature?.document_hash || verification?.verification?.documentHash) && (
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                        <span className="font-semibold flex items-center gap-1">
                          <Key size={13} className="text-indigo-600" /> SHA-256 Document Hash
                        </span>
                        <button
                          onClick={() => copyHash(verification?.signature?.document_hash || verification?.verification?.documentHash || "")}
                          className="text-indigo-600 hover:underline cursor-pointer text-[10px] font-bold"
                        >
                          {copiedHash ? "Copied ✓" : "Copy Hash"}
                        </button>
                      </div>
                      <div className="p-2 bg-gray-900 text-indigo-300 font-mono text-[10px] rounded-lg break-all select-all">
                        {verification?.signature?.document_hash || verification?.verification?.documentHash}
                      </div>
                    </div>
                  )}
                </div>

                {/* Re-sign button if document modified or revoked */}
                {!isValid && (
                  <button
                    type="button"
                    onClick={handleSignLR}
                    disabled={signing}
                    className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {signing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Re-Signing LR (RSA-2048)...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} /> Re-Sign Updated LR
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-400">
            <span>Verified Server-Side Cryptographic Signature</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
