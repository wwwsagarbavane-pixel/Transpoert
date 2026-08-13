/**
 * TransportOS Security - Centralized Role-Based Access Control (RBAC) Engine
 * Simplified 2-Role Company Access Control Model:
 * 1. Company Admin (Full access inside company)
 * 2. Operator (Day-to-day operational access only)
 */

export type UserRole =
  | "Super Admin"
  | "User Admin"
  | "Company Admin"
  | "Operator"
  | string

export const ALLOWED_ROLES: UserRole[] = ["Company Admin", "Operator"]

/**
 * Page Name to Access Control Mapping
 */
const OPERATOR_ALLOWED_PAGES = new Set<string>([
  "Dashboard",
  "Create LR",
  "LR Register",
  "Blank LR",
  "Billing",
  "Delivery",
  "Parties",
  "Vehicles",
  "Drivers",
  "Vehicle Owners",
  "Agents",
  "Articles",
  "Article Master",
  "Stations",
  "Profile"
])

/**
 * Evaluates whether a user role can access a specific page module
 */
export function canAccessPage(userRole: string = "", pageName: string): boolean {
  if (!userRole) return false
  const r = userRole.toUpperCase().replace(/_/g, " ").trim()

  const isSuper = r === "SUPER ADMIN" || r === "SUPERADMIN"
  const isCompAdmin = r === "COMPANY ADMIN" || r === "COMPANYADMIN" || r === "ADMIN" || r === "COMPANY USER"

  if (isSuper || isCompAdmin) {
    if (pageName === "Admin Control Panel" && !isSuper) {
      return false
    }
    return true
  }

  if (r === "OPERATOR") {
    return OPERATOR_ALLOWED_PAGES.has(pageName)
  }

  if (r.includes("ADMIN") || r.includes("SUPER")) {
    return true
  }

  return false
}

/**
 * Evaluates whether a user can perform action (create, edit, delete, etc.)
 */
export function canPerformAction(
  userRole: string = "",
  action: "create" | "edit" | "delete" | "approve" | "export" | "print",
  entity: string = "masters"
): boolean {
  if (!userRole) return false
  const r = userRole.toUpperCase().replace(/_/g, " ").trim()

  const isSuper = r === "SUPER ADMIN" || r === "SUPERADMIN"
  const isCompAdmin = r === "COMPANY ADMIN" || r === "COMPANYADMIN" || r === "ADMIN" || r === "COMPANY USER"

  if (isSuper || isCompAdmin) return true

  if (r === "OPERATOR") {
    if (action === "delete") return false
    if (entity === "user" || entity === "company" || entity === "branch" || entity === "station") return false
    return true
  }

  return true
}
