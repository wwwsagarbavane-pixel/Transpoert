export interface PermissionDefinition {
  key: string
  label: string
}

export interface PermissionGroup {
  title: string
  permissions: PermissionDefinition[]
}

export const ALL_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: "USER MANAGEMENT",
    permissions: [
      { key: "view-users", label: "View Users" },
      { key: "create-user", label: "Create User" },
      { key: "edit-user", label: "Edit User" },
      { key: "delete-user", label: "Delete User" }
    ]
  },
  {
    title: "LR MANAGEMENT",
    permissions: [
      { key: "create-lr", label: "Create LR" },
      { key: "edit-lr", label: "Edit LR" },
      { key: "print-lr", label: "Print LR" },
      { key: "cancel-lr", label: "Cancel LR" }
    ]
  },
  {
    title: "BILLING",
    permissions: [
      { key: "generate-bill", label: "Generate Bill" },
      { key: "outstanding", label: "Outstanding" },
      { key: "payments", label: "Payments" }
    ]
  },
  {
    title: "REPORTS",
    permissions: [
      { key: "view-reports", label: "View Reports" },
      { key: "export-pdf", label: "Export PDF" },
      { key: "export-excel", label: "Export Excel" }
    ]
  },
  {
    title: "MASTERS",
    permissions: [
      { key: "branch", label: "Branch" },
      { key: "party", label: "Party" },
      { key: "vehicle", label: "Vehicle" },
      { key: "driver", label: "Driver" },
      { key: "agent", label: "Agent" }
    ]
  }
]

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  "Operator": ["create-lr", "edit-lr", "print-lr", "party", "vehicle", "driver", "agent"],
  "Company Admin": [
    "view-users", "create-user", "edit-user", "delete-user",
    "create-lr", "edit-lr", "print-lr", "cancel-lr",
    "generate-bill", "outstanding", "payments",
    "view-reports", "export-pdf", "export-excel",
    "branch", "party", "vehicle", "driver", "agent"
  ],
  "User Admin": [
    "view-users", "create-user", "edit-user", "delete-user"
  ],
  "Super Admin": [
    "view-users", "create-user", "edit-user", "delete-user",
    "create-lr", "edit-lr", "print-lr", "cancel-lr",
    "generate-bill", "outstanding", "payments",
    "view-reports", "export-pdf", "export-excel",
    "branch", "party", "vehicle", "driver", "agent"
  ]
}

export const rbacService = {
  getPermissionsForRole: (role: string): string[] => {
    return DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS["Operator"]
  },
  getGroups: (): PermissionGroup[] => {
    return ALL_PERMISSION_GROUPS
  }
}
