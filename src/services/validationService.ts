import {
  DBParty, DBVehicle, DBDriver, DBOwner, DBAgent, DBStation,
  DBArticle, DBLR, DBDelivery, DBBill, DBUser
} from "../db/schema"

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export const validationService = {
  validateParty: (data: Partial<DBParty>): ValidationResult => {
    const errors: string[] = []
    if (!data.name || !data.name.trim()) errors.push("Party name is required")
    if (data.phone && !/^[0-9+\-\s]{8,15}$/.test(data.phone.trim())) errors.push("Invalid phone number format")
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.push("Invalid email address format")
    if (data.gst && data.gst.trim().length > 0 && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(data.gst.trim())) {
      errors.push("Invalid GSTIN format (e.g. 27AABCM1234A1Z5)")
    }
    return { valid: errors.length === 0, errors }
  },

  validateVehicle: (data: Partial<DBVehicle>): ValidationResult => {
    const errors: string[] = []
    if (!data.number || !data.number.trim()) errors.push("Vehicle registration number is required")
    if (!data.type) errors.push("Vehicle type is required")
    return { valid: errors.length === 0, errors }
  },

  validateDriver: (data: Partial<DBDriver>): ValidationResult => {
    const errors: string[] = []
    if (!data.name || !data.name.trim()) errors.push("Driver full name is required")
    if (!data.mobile || !data.mobile.trim()) errors.push("Driver mobile phone is required")
    return { valid: errors.length === 0, errors }
  },

  validateLR: (data: Partial<DBLR>): ValidationResult => {
    const errors: string[] = []
    if (!data.bookingBranch) errors.push("Booking branch is required")
    if (!data.bookingStation) errors.push("Booking station is required")
    if (!data.deliveryStation) errors.push("Delivery station is required")
    if (!data.consignor) errors.push("Consignor party is required")
    if (!data.consignee) errors.push("Consignee party is required")
    if (!data.article) errors.push("Article cargo item is required")
    if (!data.freight || parseFloat(String(data.freight)) <= 0) errors.push("Freight amount must be greater than zero")
    return { valid: errors.length === 0, errors }
  },

  validateBilling: (lrs: DBLR[]): ValidationResult => {
    const errors: string[] = []
    if (lrs.length === 0) {
      errors.push("At least one LR must be selected to generate an invoice bill")
      return { valid: false, errors }
    }

    const first = lrs[0]
    const isSameParty = lrs.every(r => r.consignor === first.consignor)
    const isSameConsignee = lrs.every(r => r.consignee === first.consignee)
    const isSameFreightType = lrs.every(r => r.freightType === first.freightType)

    if (!isSameParty) errors.push("Selected LRs belong to different Consignor Parties")
    if (!isSameConsignee) errors.push("Selected LRs belong to different Consignees (Receivers)")
    if (!isSameFreightType) errors.push("Selected LRs have different Freight Types (e.g. Paid vs To Pay)")

    return { valid: errors.length === 0, errors }
  }
}
