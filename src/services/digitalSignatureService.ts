import { companyContext } from "./companyContext"
import { sessionService } from "./sessionService"
import { DBDigitalSignature } from "../db/schema"

export interface SignatureVerificationResult {
  valid: boolean
  status: "SIGNED" | "NOT_SIGNED" | "DOCUMENT_MODIFIED" | "REVOKED" | "INVALID_SIGNATURE"
  verification?: {
    valid: boolean
    status: string
    signerName?: string
    signerRole?: string
    signedAt?: string
    algorithm?: string
    documentVersion?: number
    documentHash?: string
    error?: string
  }
  signature?: DBDigitalSignature | null
  error?: string
}

export const digitalSignatureService = {
  async signLR(lrId: string): Promise<{ success: boolean; signature?: DBDigitalSignature; error?: string }> {
    const activeCompanyId = companyContext.getActiveCompanyId()
    const session = sessionService.getSession()
    const currentUser = session?.user

    try {
      const res = await fetch(`/api/lr/${encodeURIComponent(lrId)}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": activeCompanyId,
          "X-User-Email": currentUser?.email || "admin@transportos.com",
          "X-User-Role": currentUser?.role || "Company Admin"
        },
        body: JSON.stringify({
          lrId,
          companyId: activeCompanyId,
          userName: currentUser?.name || currentUser?.email || "Authorized Signer",
          userRole: currentUser?.role || "Company Admin",
          userEmail: currentUser?.email || "admin@transportos.com"
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Digital signing failed" }
      }

      return { success: true, signature: data.signature }
    } catch (err: any) {
      console.error("digitalSignatureService.signLR Error:", err)
      return { success: false, error: err.message || "Network error while signing LR" }
    }
  },

  async verifyLRSignature(lrId: string): Promise<SignatureVerificationResult> {
    const activeCompanyId = companyContext.getActiveCompanyId()

    try {
      const res = await fetch(`/api/lr/${encodeURIComponent(lrId)}/signature/verify?companyId=${activeCompanyId}`, {
        headers: {
          "X-Company-ID": activeCompanyId
        }
      })

      const data = await res.json()
      if (!res.ok) {
        return { valid: false, status: "INVALID_SIGNATURE", error: data.error || "Verification failed" }
      }

      return {
        valid: Boolean(data.valid),
        status: data.status || (data.valid ? "SIGNED" : "DOCUMENT_MODIFIED"),
        verification: data.verification,
        signature: data.signature
      }
    } catch (err: any) {
      console.error("digitalSignatureService.verifyLRSignature Error:", err)
      return { valid: false, status: "INVALID_SIGNATURE", error: err.message }
    }
  }
}
