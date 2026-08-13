export interface DBCompany {
  id: string
  code: string
  name: string
  city?: string
  logo?: string
  status: "active" | "inactive"
  lastLogin: string
  createdAt: string
  updatedAt: string
}

export interface DBParty {
  id: string
  company_id: string
  name: string           // VARCHAR(200)
  gstin?: string         // VARCHAR(20)
  pan?: string           // VARCHAR(20)
  mobile?: string        // VARCHAR(20)
  credit_days?: number   // INT
  status: "active" | "inactive" | 1 | 0  // SMALLINT
  address_type?: string  // VARCHAR(20)
  city?: string          // VARCHAR(100)
  state?: string         // VARCHAR(100)
  pincode?: string       // VARCHAR(10)
  // Backward compatibility fields
  type?: string
  gst?: string
  phone?: string
  email?: string
  contactPerson?: string
  creditLimit?: number
  outstanding?: number
  billingAddress?: string
  shippingAddress?: string
  paymentTerms?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface DBVehicle {
  id: string
  company_id: string
  number: string
  type: string
  capacity: string
  owner: string
  driver: string
  gpsId?: string
  rc?: string
  insurance?: string
  fitness?: string
  permit?: string
  puc?: string
  status: "active" | "maintenance" | "idle" | "out_of_service"
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface DBDriver {
  id: string
  company_id: string
  name: string
  mobile: string
  altMobile?: string
  license: string
  licenseExpiry?: string
  aadhaar?: string
  address?: string
  emergency?: string
  experience?: string
  vehicle?: string
  status: "active" | "inactive" | "on_trip" | "leave"
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface DBOwner {
  id: string
  company_id: string
  name: string
  contact?: string
  mobile?: string
  email?: string
  pan?: string
  gst?: string
  phone?: string
  address?: string
  type?: string
  vehicles?: number
  bankName?: string
  accountNo?: string
  ifsc?: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export type DBVehicleOwner = DBOwner

export interface DBAgent {
  id: string
  company_id: string
  name: string
  city: string
  state?: string
  contact?: string
  mobile?: string
  email?: string
  phone?: string
  commission: string
  outstanding: number
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface DBStation {
  id: string
  company_id: string
  name: string
  city: string
  state: string
  type: string
  pincode?: string
  phone?: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface DBArticle {
  id: string
  company_id: string
  name: string
  description?: string
  unit: string
  fragile: boolean
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface GoodsItem {
  id: string
  article: string
  no_of_articles: number
  rate_per_article: number
  lot_no?: string
  quality?: string
  pr_no?: string
  pm_no?: string
  weight_in_kgs?: number
  charged_weight?: number
  description?: string
  freightAmount: number
}

export interface DBLR {
  id: string
  company_id: string
  branch_id?: string
  lr: string
  lrNo?: string
  signature_url?: string
  signature?: string
  date: string
  consignor_id?: string | number
  consignee_id?: string | number
  bill_to?: "Consignor" | "Consignee" | "Third Party"
  from_station_id?: string | number
  to_station_id?: string | number
  vehicle_id?: string | number
  agent_id?: string | number
  freight_type?: "Paid" | "To Pay" | "TBB"
  type?: "Paid" | "To Pay" | "TBB" | string
  
  // Multiple Goods Items Support
  goods_items?: GoodsItem[]
  
  // Articles & References
  noof_articles?: number
  rate_per_article?: number
  lot_no?: string
  quality?: string
  pr_no?: string
  pm_no?: string
  gstin_no?: string
  invoice_no?: string
  invoice_amount?: number
  way_bill_no?: string
  weigh_in_kgs?: number

  // Cryptographic Digital Signature Fields
  is_digitally_signed?: boolean
  digital_signature_id?: string
  document_version?: number

  // Document attachments
  invoice_doc_id?: string
  invoice_doc_url?: string
  invoice_doc_name?: string
  ewaybill_doc_id?: string
  ewaybill_doc_url?: string
  ewaybill_doc_name?: string
  
  // Amounts
  freight_amount?: number
  advance_amount?: number
  hamali?: number
  balance_amount?: number

  // Core & Display fields
  bookingBranch?: string
  bookingStation?: string
  deliveryStation?: string
  owner?: string
  agent?: string
  consignor: string
  consignee: string
  consignorGst?: string
  consigneeGst?: string
  origin?: string
  destination?: string
  from?: string
  to?: string
  vehicle?: string
  vehicleNo?: string
  driver?: string
  driverName?: string
  article?: string
  articleType?: string
  articles?: number
  packages?: number
  packageCount?: number
  weight?: string
  actualWeight?: number
  chargedWeight?: number
  rate?: number
  freight?: number
  advance?: number
  balance?: number
  extraCharges?: number
  taxableAmount?: number
  gstPercent?: number
  gstAmount?: number
  totalAmount?: number
  invoice?: string
  invoiceValue?: number
  waybill?: string
  ewayBill?: string
  gst?: string
  freightType?: string
  paymentType?: string
  expectedDelivery?: string
  status: "Draft" | "Booked" | "In Transit" | "Delivered" | "Billed" | "Cancelled" | "pending" | "delivered" | "cancelled" | "draft" | "in_transit"
  invoiceNo?: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

export interface DBDelivery {
  id: string
  company_id: string
  lrNo: string
  lrDate: string
  consignor: string
  consignee: string
  origin: string
  destination: string
  packages: number
  weight: string
  status: "Pending Delivery" | "Out for Delivery" | "Delivered" | "Damaged/Shortage" | "Returned"
  deliveryDate?: string
  receivedBy?: string
  receiverPhone?: string
  podFile?: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

export interface DBBilling {
  id: string
  company_id: string
  billNo: string
  billDate: string
  dueDate: string
  party: string
  partyName?: string
  partyId?: string
  gstin?: string
  lrsCount: number
  subtotal: number
  tax: number
  amount?: number
  totalAmount: number
  paid?: number
  paidAmount: number
  outstanding: number
  lrs?: string[] | any[]
  status: "Unpaid" | "Partially Paid" | "Paid" | "Overdue" | "Cancelled" | "pending" | "partial" | "paid" | "cancelled" | string
  remarks?: string
  createdAt: string
  updatedAt: string
}

export type DBBill = DBBilling

export interface DBPayment {
  id: string
  company_id?: string
  paymentNo?: string
  receiptNo?: string
  billNo: string
  billId?: string
  bill_id?: string
  partyName?: string
  party?: string
  amount: number
  paymentDate?: string
  date?: string
  paymentMode?: "Cash" | "Bank" | "Cheque" | "NEFT" | "UPI" | string
  mode?: string
  referenceNo?: string
  status?: string
  remarks?: string
  createdAt?: string
  updatedAt?: string
}

export type UserRole = "Super Admin" | "User Admin" | "System Admin" | "Support Admin" | "Company Admin" | "Manager" | "Billing" | "Delivery" | "Operator" | "Viewer" | "Company User" | "Admin" | string

export interface DBUser {
  id: string
  company_id?: string
  role: UserRole                 // Enum
  name: string                   // VARCHAR(150)
  username?: string
  mobile?: string                // VARCHAR(20)
  email: string                  // VARCHAR(150)
  password_hash?: string         // TEXT
  password?: string              // TEXT (alias)
  status: "active" | "inactive" | 1 | 0  // SMALLINT
  branch_ids?: string            // TEXT / JSON string of assigned branch IDs
  default_branch?: number | string // INT / Branch ID
  department?: string
  designation?: string
  branch?: string
  assignedCompanies?: string[]
  permissions?: string[]
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface DBAuditLog {
  id: string
  company_id: string
  entity: string
  entityId?: string
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "SOFT_DELETE"
  recordId: string
  payload?: any
  performedBy?: string
  timestamp?: string
  createdAt: string
}

export interface DBCompanySetup {
  id: string
  company_id: string
  companyName: string
  legalName?: string
  code?: string
  gstin?: string
  pan?: string
  cin?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  logo?: string
  bankName?: string
  accountNo?: string
  ifsc?: string
  branchName?: string
  termsAndConditions?: string
  updatedAt: string
}

export interface DBDigitalSignature {
  id: string
  company_id: string
  lr_id: string
  signed_by: string
  signed_by_email?: string
  signed_by_role?: string
  algorithm: string
  hash_algorithm: string
  document_hash: string
  signature: string
  key_version: string
  document_version: number
  status: "ACTIVE" | "REVOKED"
  signed_at: string
  revoked_at?: string | null
  created_at: string
  updated_at: string
}
