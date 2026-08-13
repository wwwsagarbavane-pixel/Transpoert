import { companyContext } from "./companyContext"

export interface DBDocument {
  id: string
  company_id: string
  document_type: "INVOICE" | "E_WAY_BILL" | "OTHER"
  entity_type?: string
  entity_id?: string
  original_name: string
  stored_name: string
  mime_type: string
  file_size: number
  storage_path: string
  url: string
  uploaded_by?: string
  createdAt?: string
  updatedAt?: string
}

export const documentService = {
  async uploadFile(
    file: File,
    documentType: "INVOICE" | "E_WAY_BILL" | "OTHER",
    entityId?: string,
    entityType: string = "LR"
  ): Promise<DBDocument> {
    const activeCompanyId = companyContext.getActiveCompanyId()
    if (!activeCompanyId) throw new Error("Active company context required")

    // Validation on Client Side
    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      throw new Error(`File size exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB)`)
    }

    const allowedExts = ["pdf", "jpg", "jpeg", "png"]
    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    if (!allowedExts.includes(ext)) {
      throw new Error("Only PDF, JPG, JPEG, and PNG files are allowed")
    }

    // Convert File to Base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const payload = {
      filename: file.name,
      fileData: base64Data,
      mime_type: file.type || "application/octet-stream",
      file_size: file.size,
      document_type: documentType,
      entity_type: entityType,
      entity_id: entityId || null,
      company_id: activeCompanyId
    }

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Company-ID": activeCompanyId
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.error || `Upload failed with status ${res.status}`)
    }

    const data = await res.json()
    if (!data.success || !data.document) {
      throw new Error(data.error || "Failed to upload document")
    }

    return data.document
  },

  async deleteDocument(documentId: string): Promise<void> {
    const activeCompanyId = companyContext.getActiveCompanyId()
    await fetch(`/api/db/documents/${documentId}?company_id=${activeCompanyId}`, {
      method: "DELETE",
      headers: {
        "X-Company-ID": activeCompanyId
      }
    })
  }
}
