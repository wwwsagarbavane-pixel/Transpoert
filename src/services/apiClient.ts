import { companyContext } from "./companyContext"

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "")

const SEED_DATA: Record<string, any[]> = {
  companies: [
    { id: "COMP-DEMO-001", code: "DEMO", name: "Demo Transport", schema_name: "demo_transport", status: "active" }
  ],
  users: [
    { id: "USR-SUPERADMIN-001", name: "Super Admin", email: "Admin@gmail.com", role: "SUPER_ADMIN", status: "active" },
    { id: "USR-DEMOADMIN-001", company_id: "COMP-DEMO-001", name: "Demo Transport Admin", email: "demo@gmail.com", role: "Company Admin", status: "active" }
  ]
}

class ApiClient {
  private getLocalStore(key: string): any[] {
    try {
      const raw = localStorage.getItem(`transportos_${key}`)
      if (raw) return JSON.parse(raw)
    } catch {}
    const defaultData = SEED_DATA[key] || []
    try {
      localStorage.setItem(`transportos_${key}`, JSON.stringify(defaultData))
    } catch {}
    return defaultData
  }

  private setLocalStore(key: string, data: any[]) {
    try {
      localStorage.setItem(`transportos_${key}`, JSON.stringify(data))
    } catch {}
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    }

    try {
      const token = localStorage.getItem("transportos_session_token")
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const activeCompanyId = companyContext.getActiveCompanyId()
      if (activeCompanyId) {
        headers["X-Company-ID"] = activeCompanyId
      }

      const rawUser = localStorage.getItem("transportos_session_user")
      if (rawUser) {
        const user = JSON.parse(rawUser)
        if (user.email) headers["X-User-Email"] = user.email
        if (user.role) headers["X-User-Role"] = user.role
      }
    } catch {}

    return headers
  }

  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    if (cleanEndpoint.startsWith("/api")) {
      return API_BASE ? `${API_BASE}${cleanEndpoint}` : cleanEndpoint
    }
    if (
      cleanEndpoint.startsWith("/auth") ||
      cleanEndpoint.startsWith("/digital-signature") ||
      cleanEndpoint.startsWith("/storage") ||
      cleanEndpoint.startsWith("/billing") ||
      cleanEndpoint.startsWith("/health")
    ) {
      return `${API_BASE}${cleanEndpoint}`
    }
    return `${API_BASE}/db${cleanEndpoint}`
  }

  public async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = this.buildUrl(endpoint)
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          searchParams.append(key, String(val))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`
      }
    }

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders()
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.error || `[API GET Error ${res.status}] Failed to fetch ${endpoint}`)
    }

    const json = await res.json()
    const resultData = json !== null && json.data !== undefined ? json.data : json
    return resultData as T
  }

  public async post<T = any>(endpoint: string, body: any): Promise<T> {
    let url = this.buildUrl(endpoint)
    const storeKey = endpoint.replace(/^\//, '').split('/')[0]

    if (body && typeof body === "object") {
      if (!body.id || !String(body.id).trim()) {
        body.id = `${storeKey.toUpperCase().slice(0, 3)}-${Date.now()}`
      }
    }

    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.error || `[API POST Error ${res.status}] Failed to create record in ${endpoint}`)
    }

    const json = await res.json()
    const resultData = json !== null && json.data !== undefined ? json.data : json
    return resultData as T
  }

  public async put<T = any>(endpoint: string, body: any): Promise<T> {
    let url = this.buildUrl(endpoint)

    const res = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.error || `[API PUT Error ${res.status}] Failed to update record in ${endpoint}`)
    }

    const json = await res.json()
    const resultData = json !== null && json.data !== undefined ? json.data : json
    return resultData as T
  }

  public async delete<T = any>(endpoint: string): Promise<T> {
    let url = this.buildUrl(endpoint)

    const res = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders()
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.error || `[API DELETE Error ${res.status}] Failed to delete record in ${endpoint}`)
    }

    const json = await res.json()
    return json as T
  }
}

export const apiClient = new ApiClient()
