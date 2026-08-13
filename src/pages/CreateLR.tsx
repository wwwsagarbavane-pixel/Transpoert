import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar, Users, Package, Truck, FileText, Wallet, NotebookPen,
  Save, Printer, MessageCircle, X, Upload, CheckCircle2,
  AlertCircle, Hash, Building, MapPin, User, Scale, ShieldCheck,
  RotateCcw, Tag, Copy, Plus, Trash2, ChevronDown, ChevronUp, Eye, Download
} from "lucide-react"
import QuickAddDropdown from "../components/QuickAddDropdown"
import SearchDropdown from "../components/SearchDropdown"
import LRPrintModal from "../components/LRPrintModal"
import { lrController } from "../controllers/lrController"
import { vehicleController, driverController, ownerController, agentController } from "../controllers/masterControllers"
import { partyController } from "../controllers/partyController"
import { stationController } from "../controllers/stationController"
import { articleController } from "../controllers/articleController"
import { companyContext } from "../services/companyContext"
import { dbQuery } from "../db/db"
import { DBLR, DBParty, DBVehicle } from "../db/schema"
import { sessionService } from "../services/sessionService"
import { documentService, DBDocument } from "../services/documentService"

const freightTypes = ["To Pay", "Paid", "To Be Billed"]

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
  delay = 0,
  id
}: {
  title: string
  subtitle?: string
  icon: any
  children: React.ReactNode
  delay?: number
  id?: string
}) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Icon size={19} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-gray-400 font-medium mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </motion.div>
  )
}

function Field({
  label,
  required,
  hasError,
  children,
  className = "",
  id
}: {
  label: string
  required?: boolean
  hasError?: boolean
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <div id={id} className={`flex flex-col gap-1.5 w-full ${className}`}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center justify-between">
        <span>
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </span>
        {hasError && <span className="text-[10px] text-red-500 font-bold lowercase normal-case">Required</span>}
      </label>
      {children}
    </div>
  )
}

function UploadBox({
  label,
  documentType,
  document,
  onUploaded,
  onRemoved,
  subtitle = "PDF, JPG, PNG up to 5MB"
}: {
  label: string
  documentType: "INVOICE" | "E_WAY_BILL"
  document: DBDocument | null
  onUploaded: (doc: DBDocument) => void
  onRemoved: () => void
  subtitle?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [errorErr, setErrorErr] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrorErr("")

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorErr(`File size exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB)`)
      return
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    if (!["pdf", "jpg", "jpeg", "png"].includes(ext)) {
      setErrorErr("File format not supported. Only PDF, JPG, JPEG, PNG allowed.")
      return
    }

    try {
      setUploading(true)
      const uploadedDoc = await documentService.uploadFile(file, documentType)
      onUploaded(uploadedDoc)
    } catch (err: any) {
      setErrorErr(err.message || "Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDownload = () => {
    if (!document?.url) return
    const a = window.document.createElement("a")
    a.href = document.url
    a.download = document.original_name
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
  }

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
      />

      {uploading ? (
        <div className="border-2 border-indigo-200 bg-indigo-50/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-h-[110px]">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-indigo-700 font-bold">Uploading document...</span>
          <span className="text-[10px] text-indigo-500">Storing on server & saving metadata</span>
        </div>
      ) : document ? (
        <div className="border border-indigo-100 bg-indigo-50/30 rounded-2xl p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-gray-900 truncate" title={document.original_name}>
                  {document.original_name}
                </div>
                <div className="text-[10px] text-gray-500 font-mono mt-0.5 flex items-center gap-2">
                  <span>{(document.file_size / 1024).toFixed(0)} KB</span>
                  <span>•</span>
                  <span className="uppercase text-indigo-600 font-bold">{document.mime_type?.split("/")[1] || "PDF"}</span>
                  <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded text-[9px] font-extrabold">Uploaded ✓</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-indigo-100/80">
            <a
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 px-2.5 rounded-lg text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 flex items-center gap-1 cursor-pointer"
            >
              <Eye size={13} /> View
            </a>
            <button
              type="button"
              onClick={handleDownload}
              className="h-7 px-2.5 rounded-lg text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
            >
              <Download size={13} /> Download
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 px-2.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 flex items-center gap-1 cursor-pointer"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onRemoved}
              className="h-7 px-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={13} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group min-h-[110px]"
        >
          <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-indigo-100 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
            <Upload size={17} />
          </div>
          <span className="text-xs text-gray-700 font-semibold text-center group-hover:text-indigo-600 transition-colors">{label}</span>
          <span className="text-[10px] text-gray-400 text-center font-medium">{subtitle}</span>
        </div>
      )}

      {errorErr && (
        <div className="text-[11px] text-red-500 font-bold mt-1 text-center bg-red-50 p-1.5 rounded-lg border border-red-100">
          {errorErr}
        </div>
      )}
    </div>
  )
}

// Extraction helpers
const getBranchPrefix = (branch: { code?: string; name: string }) => {
  if (branch.code) {
    const parts = branch.code.split("-")
    if (parts.length >= 2) {
      const part = parts.find(p => p.length === 3)
      if (part) return part.toUpperCase()
    }
  }
  const name = branch.name.toLowerCase()
  if (name.includes("mumbai")) return "MUM"
  if (name.includes("pune")) return "PUN"
  if (name.includes("delhi")) return "DEL"
  if (name.includes("nagpur")) return "NAG"
  if (name.includes("kolkata")) return "KOL"
  if (name.includes("chennai")) return "CHE"
  if (name.includes("bangalore") || name.includes("bengaluru")) return "BLR"
  return branch.name.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase() || "GEN"
}

const getNextLRForBranch = (branch: any, existingLrs: DBLR[]): string => {
  const prefix = (branch.lr_prefix || getBranchPrefix(branch)).toUpperCase()
  const startingNo = parseInt(branch.lr_next_no, 10) || 1
  
  const matchPrefix = `${prefix}-LR-`.toUpperCase()
  let maxNum = 0
  existingLrs.forEach(r => {
    const lrVal = String(r.lrNo || r.lr || (r as any).lr_no || (r as any).lrNumber || "").trim()
    if (lrVal && lrVal.toUpperCase().startsWith(matchPrefix)) {
      const parts = lrVal.split("-")
      const trailing = parts[parts.length - 1]
      const num = parseInt(trailing, 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    }
  })
  const nextNum = Math.max(startingNo, maxNum + 1)
  const nextNumStr = String(nextNum).padStart(6, "0")
  return `${prefix}-LR-${nextNumStr}`
}

export interface GoodsItemRow {
  id: string
  article: string
  no_of_articles: number
  rate_per_article: number
  lot_no: string
  quality: string
  pr_no: string
  pm_no: string
  weight_in_kgs: number
  charged_weight: number
  description: string
  freightAmount: number
}

const createDefaultGoodsRow = (): GoodsItemRow => ({
  id: `GI-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  article: "",
  no_of_articles: 1,
  rate_per_article: 0,
  lot_no: "",
  quality: "",
  pr_no: "",
  pm_no: "",
  weight_in_kgs: 0,
  charged_weight: 0,
  description: "",
  freightAmount: 0
})

export default function CreateLR({
  onNavigateToList,
  editingLR = null
}: {
  onNavigateToList?: () => void
  editingLR?: DBLR | null
}) {
  const today = new Date().toISOString().split("T")[0]
  const [lrNumber, setLrNumber] = useState("")

  // Master lists
  const [vehicles, setVehicles] = useState<string[]>([])
  const [drivers, setDrivers] = useState<string[]>([])
  const [owners, setOwners] = useState<string[]>([])
  const [agents, setAgents] = useState<string[]>([])
  const [parties, setParties] = useState<string[]>([])
  const [stations, setStations] = useState<string[]>([])
  const [articles, setArticles] = useState<string[]>([])
  const [branchOptions, setBranchOptions] = useState<string[]>([])

  // Raw DB records
  const [allLrs, setAllLrs] = useState<DBLR[]>([])
  const [branchesList, setBranchesList] = useState<any[]>([])
  const [fullPartiesList, setFullPartiesList] = useState<DBParty[]>([])
  const [fullVehiclesList, setFullVehiclesList] = useState<DBVehicle[]>([])
  const [fullAgentsList, setFullAgentsList] = useState<any[]>([])
  const [fullStationsList, setFullStationsList] = useState<any[]>([])
  const [fullArticlesList, setFullArticlesList] = useState<any[]>([])

  // Session info
  const session = sessionService.getSession()
  const currentUserName = session.user?.name || "System Operator"
  const currentCompanyName = session.company?.name || "Ganesh Transport"
  const activeCompanyId = companyContext.getActiveCompanyId()

  // Form states
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successToast, setSuccessToast] = useState("")
  const [printLrRecord, setPrintLrRecord] = useState<DBLR | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Invoice and E-Way Bill uploaded documents
  const [invoiceDoc, setInvoiceDoc] = useState<DBDocument | null>(null)
  const [ewayBillDoc, setEwayBillDoc] = useState<DBDocument | null>(null)

  const [goodsItems, setGoodsItems] = useState<GoodsItemRow[]>([createDefaultGoodsRow()])

  const emptyForm = {
    date: today,
    bookingBranch: "",
    bookingStation: "",
    deliveryStation: "",
    expectedDelivery: "",
    consignor: "",
    consignee: "",
    bill_to: "Consignor" as "Consignor" | "Consignee" | "Third Party",
    gst: "",
    address: "",
    city: "",
    state: "",
    doc_gstin: "",
    article: "",
    packageCount: "1",
    rate: "",
    lot_no: "",
    quality: "",
    pr_no: "",
    pm_no: "",
    weight_in_kgs: "",
    vehicle: "",
    driver: "",
    owner: "",
    agent: "",
    invoice: "",
    invoiceValue: "",
    ewayBill: "",
    freightType: "To Pay",
    freight: "",
    advance: "",
    hamali: "",
    balance: "",
    remarks: ""
  }

  const [form, setForm] = useState({ ...emptyForm })

  useEffect(() => {
    if (editingLR) {
      // 1. Resolve Booking Branch Name from ID or Name (handling string vs number comparisons)
      const targetBranchId = (editingLR as any).booking_branch_id ?? editingLR.branch_id
      const matchedBranch = branchesList.find(b => 
        (targetBranchId !== undefined && targetBranchId !== null && String(b.id) === String(targetBranchId)) ||
        (editingLR.bookingBranch && b.name.toLowerCase() === editingLR.bookingBranch.toLowerCase()) ||
        ((editingLR as any).branch && b.name.toLowerCase() === (editingLR as any).branch.toLowerCase())
      )
      const resolvedBranch = matchedBranch ? matchedBranch.name : (editingLR.bookingBranch || (editingLR as any).branch || "")

      // 2. Resolve Booking Station Name
      const targetFromId = editingLR.from_station_id ?? (editingLR as any).booking_station_id
      const matchedFromStation = fullStationsList.find(s => 
        (targetFromId !== undefined && targetFromId !== null && String(s.id) === String(targetFromId)) ||
        (editingLR.bookingStation && s.name.toLowerCase() === editingLR.bookingStation.toLowerCase()) ||
        (editingLR.from && s.name.toLowerCase() === editingLR.from.toLowerCase())
      )
      const resolvedBookingStation = matchedFromStation ? matchedFromStation.name : (editingLR.bookingStation || editingLR.from || "")

      // 3. Resolve Delivery Station Name
      const targetToId = editingLR.to_station_id ?? (editingLR as any).delivery_station_id
      const matchedToStation = fullStationsList.find(s => 
        (targetToId !== undefined && targetToId !== null && String(s.id) === String(targetToId)) ||
        (editingLR.deliveryStation && s.name.toLowerCase() === editingLR.deliveryStation.toLowerCase()) ||
        (editingLR.to && s.name.toLowerCase() === editingLR.to.toLowerCase())
      )
      const resolvedDeliveryStation = matchedToStation ? matchedToStation.name : (editingLR.deliveryStation || editingLR.to || "")

      // 4. Resolve Consignor Name
      const targetConsignorId = editingLR.consignor_id
      const matchedConsignor = fullPartiesList.find(p => 
        (targetConsignorId !== undefined && targetConsignorId !== null && String(p.id) === String(targetConsignorId)) ||
        (editingLR.consignor && p.name.toLowerCase() === editingLR.consignor.toLowerCase())
      )
      const resolvedConsignor = matchedConsignor ? matchedConsignor.name : (editingLR.consignor || "")

      // 5. Resolve Consignee Name
      const targetConsigneeId = editingLR.consignee_id
      const matchedConsignee = fullPartiesList.find(p => 
        (targetConsigneeId !== undefined && targetConsigneeId !== null && String(p.id) === String(targetConsigneeId)) ||
        (editingLR.consignee && p.name.toLowerCase() === editingLR.consignee.toLowerCase())
      )
      const resolvedConsignee = matchedConsignee ? matchedConsignee.name : (editingLR.consignee || "")

      // 6. Resolve Vehicle Number
      const targetVehicleId = editingLR.vehicle_id
      const matchedVehicle = fullVehiclesList.find(v => 
        (targetVehicleId !== undefined && targetVehicleId !== null && String(v.id) === String(targetVehicleId)) ||
        (editingLR.vehicle && v.number.toLowerCase() === editingLR.vehicle.toLowerCase()) ||
        ((editingLR as any).vehicleNo && v.number.toLowerCase() === (editingLR as any).vehicleNo.toLowerCase())
      )
      const resolvedVehicle = matchedVehicle ? matchedVehicle.number : (editingLR.vehicle || (editingLR as any).vehicleNo || "")

      // 7. Resolve Agent Name
      const targetAgentId = editingLR.agent_id
      const matchedAgent = fullAgentsList.find(a => 
        (targetAgentId !== undefined && targetAgentId !== null && String(a.id) === String(targetAgentId)) ||
        (editingLR.agent && a.name.toLowerCase() === editingLR.agent.toLowerCase())
      )
      const resolvedAgent = matchedAgent ? matchedAgent.name : (editingLR.agent || "")

      // 8. Resolve Document Details (Invoice Number, Invoice Amount, Way Bill Number)
      const resolvedInvoiceNo = editingLR.invoice || (editingLR as any).invoice_no || (editingLR as any).invoiceNo || ""
      const rawInvoiceVal = editingLR.invoiceValue ?? (editingLR as any).invoice_amount
      const resolvedInvoiceValue = rawInvoiceVal !== undefined && rawInvoiceVal !== null && rawInvoiceVal !== "" ? String(rawInvoiceVal) : ""
      const resolvedEwayBill = editingLR.ewayBill || (editingLR as any).way_bill_no || (editingLR as any).eway_bill_no || ""

      setForm(prev => ({
        ...prev,
        date: editingLR.date || today,
        bookingBranch: resolvedBranch || prev.bookingBranch,
        bookingStation: resolvedBookingStation || prev.bookingStation,
        deliveryStation: resolvedDeliveryStation || prev.deliveryStation,
        expectedDelivery: editingLR.expectedDelivery || prev.expectedDelivery,
        consignor: resolvedConsignor || prev.consignor,
        consignee: resolvedConsignee || prev.consignee,
        bill_to: (editingLR as any).bill_to || prev.bill_to || "Consignor",
        gst: editingLR.gst || prev.gst,
        address: (editingLR as any).address || prev.address,
        city: (editingLR as any).city || prev.city,
        state: (editingLR as any).state || prev.state,
        doc_gstin: (editingLR as any).doc_gstin || prev.doc_gstin,
        article: editingLR.article || prev.article,
        packageCount: String(editingLR.packageCount || editingLR.articles || prev.packageCount || 1),
        rate: String((editingLR as any).rate || prev.rate || ""),
        lot_no: (editingLR as any).lot_no || prev.lot_no,
        quality: (editingLR as any).quality || prev.quality,
        pr_no: (editingLR as any).pr_no || prev.pr_no,
        pm_no: (editingLR as any).pm_no || prev.pm_no,
        weight_in_kgs: String(editingLR.weight || editingLR.actualWeight || prev.weight_in_kgs || ""),
        vehicle: resolvedVehicle || prev.vehicle,
        driver: editingLR.driver || prev.driver,
        owner: editingLR.owner || prev.owner,
        agent: resolvedAgent || prev.agent,
        invoice: resolvedInvoiceNo,
        invoiceValue: resolvedInvoiceValue,
        ewayBill: resolvedEwayBill,
        freightType: editingLR.freightType || (editingLR as any).freight_type || (editingLR as any).type || prev.freightType || "To Pay",
        freight: String(editingLR.freight || (editingLR as any).freight_amount || prev.freight || ""),
        advance: String(editingLR.advance || (editingLR as any).advance_amount || prev.advance || ""),
        hamali: String(editingLR.hamali || prev.hamali || ""),
        balance: String(editingLR.balance || (editingLR as any).balance_amount || prev.balance || ""),
        remarks: editingLR.remarks || prev.remarks
      }))
      setLrNumber(editingLR.lr)

      // Restore Invoice & E-Way Bill uploaded document states
      if ((editingLR as any).invoice_doc_url || (editingLR as any).invoice_doc_id || (editingLR as any).invoiceDoc) {
        const invDoc = (editingLR as any).invoiceDoc || {
          id: (editingLR as any).invoice_doc_id || `DOC-INV-${editingLR.id}`,
          company_id: activeCompanyId,
          document_type: "INVOICE",
          entity_type: "LR",
          entity_id: editingLR.id,
          original_name: (editingLR as any).invoice_doc_name || (editingLR as any).invoice || "Invoice_Document.pdf",
          stored_name: (editingLR as any).invoice_doc_url ? (editingLR as any).invoice_doc_url.split("/").pop()! : "invoice.pdf",
          mime_type: ((editingLR as any).invoice_doc_url?.endsWith(".png") || (editingLR as any).invoice_doc_url?.endsWith(".jpg")) ? "image/png" : "application/pdf",
          file_size: 102400,
          storage_path: (editingLR as any).invoice_doc_url || "",
          url: (editingLR as any).invoice_doc_url || "",
          uploaded_by: "Operator",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setInvoiceDoc(invDoc)
      } else {
        setInvoiceDoc(null)
      }

      if ((editingLR as any).ewaybill_doc_url || (editingLR as any).ewaybill_doc_id || (editingLR as any).ewayBillDoc) {
        const ewDoc = (editingLR as any).ewayBillDoc || {
          id: (editingLR as any).ewaybill_doc_id || `DOC-EWAY-${editingLR.id}`,
          company_id: activeCompanyId,
          document_type: "E_WAY_BILL",
          entity_type: "LR",
          entity_id: editingLR.id,
          original_name: (editingLR as any).ewaybill_doc_name || (editingLR as any).ewayBill || "EWayBill_Document.pdf",
          stored_name: (editingLR as any).ewaybill_doc_url ? (editingLR as any).ewaybill_doc_url.split("/").pop()! : "ewaybill.pdf",
          mime_type: ((editingLR as any).ewaybill_doc_url?.endsWith(".png") || (editingLR as any).ewaybill_doc_url?.endsWith(".jpg")) ? "image/png" : "application/pdf",
          file_size: 102400,
          storage_path: (editingLR as any).ewaybill_doc_url || "",
          url: (editingLR as any).ewaybill_doc_url || "",
          uploaded_by: "Operator",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setEwayBillDoc(ewDoc)
      } else {
        setEwayBillDoc(null)
      }

      // Safely parse and restore ALL saved goods items / multiple articles
      let parsedGoodsItems: GoodsItemRow[] = []
      let rawGoods = (editingLR as any).goods_items || (editingLR as any).items
      if (rawGoods) {
        try {
          if (typeof rawGoods === "string") {
            rawGoods = JSON.parse(rawGoods)
          }
        } catch {}
      }

      if (rawGoods && typeof rawGoods === "object" && !Array.isArray(rawGoods) && Array.isArray((rawGoods as any).goods_items)) {
        parsedGoodsItems = (rawGoods as any).goods_items
      } else if (Array.isArray(rawGoods)) {
        parsedGoodsItems = rawGoods
      }

      if (Array.isArray(parsedGoodsItems) && parsedGoodsItems.length > 0) {
        setGoodsItems(parsedGoodsItems.map((gi: any, idx: number) => ({
          id: gi.id || `GI-${Date.now()}-${idx}`,
          article: gi.article || gi.name || editingLR.article || "",
          no_of_articles: Number(gi.no_of_articles || gi.packageCount || gi.quantity || gi.packages || 1),
          rate_per_article: Number(gi.rate_per_article || gi.rate || 0),
          lot_no: gi.lot_no || gi.lotNo || "",
          quality: gi.quality || "",
          pr_no: gi.pr_no || gi.prNo || "",
          pm_no: gi.pm_no || gi.pmNo || "",
          weight_in_kgs: Number(gi.weight_in_kgs || gi.weight || gi.actualWeight || 0),
          charged_weight: Number(gi.charged_weight || gi.chargedWeight || gi.weight_in_kgs || gi.weight || 0),
          description: gi.description || gi.remarks || "",
          freightAmount: gi.freightAmount !== undefined ? Number(gi.freightAmount) : (Number(gi.no_of_articles || 1) * Number(gi.rate_per_article || 0))
        })))
      } else {
        setGoodsItems([{
          id: `GI-${Date.now()}`,
          article: editingLR.article || "",
          no_of_articles: Number(editingLR.packageCount || editingLR.articles || 1),
          rate_per_article: Number((editingLR as any).rate || 0),
          lot_no: (editingLR as any).lot_no || "",
          quality: (editingLR as any).quality || "",
          pr_no: (editingLR as any).pr_no || "",
          pm_no: (editingLR as any).pm_no || "",
          weight_in_kgs: Number(editingLR.weight || editingLR.actualWeight || 0),
          charged_weight: Number(editingLR.chargedWeight || editingLR.actualWeight || 0),
          description: "",
          freightAmount: Number(editingLR.freight || 0)
        }])
      }
    }
  }, [editingLR, branchesList, fullPartiesList, fullStationsList, fullVehiclesList, fullAgentsList])

  const addGoodsItem = () => {
    setGoodsItems(prev => [...prev, createDefaultGoodsRow()])
  }

  const duplicateGoodsItem = (row: GoodsItemRow) => {
    const duplicated: GoodsItemRow = {
      ...row,
      id: `GI-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    }
    setGoodsItems(prev => [...prev, duplicated])
  }

  const deleteGoodsItem = (id: string) => {
    setGoodsItems(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : prev))
  }

  const updateGoodsItemField = (id: string, field: keyof GoodsItemRow, val: any) => {
    setGoodsItems(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: val }
      const qty = Number(updated.no_of_articles) || 0
      const rate = Number(updated.rate_per_article) || 0
      updated.freightAmount = qty * rate
      return updated
    }))
  }

  const totalArticlesCount = goodsItems.reduce((acc, r) => acc + (Number(r.no_of_articles) || 0), 0)
  const totalWeightKg = goodsItems.reduce((acc, r) => acc + (Number(r.weight_in_kgs) || 0), 0)
  const totalChargedWeightKg = goodsItems.reduce((acc, r) => acc + (Number(r.charged_weight) || 0), 0)
  const totalGoodsFreight = goodsItems.reduce((acc, r) => acc + (Number(r.freightAmount) || 0), 0)

  // Keep form.freight and packageCount in sync with Goods Items live totals
  useEffect(() => {
    setForm(prev => {
      const fr = totalGoodsFreight > 0 ? String(totalGoodsFreight) : prev.freight
      const pkg = totalArticlesCount > 0 ? String(totalArticlesCount) : prev.packageCount
      const wt = totalWeightKg > 0 ? String(totalWeightKg) : prev.weight_in_kgs
      const firstArt = goodsItems[0]?.article || prev.article

      const adv = parseFloat(prev.advance) || 0
      const ham = parseFloat(prev.hamali) || 0
      const frVal = parseFloat(fr) || 0
      const bal = (frVal + ham) - adv

      return {
        ...prev,
        freight: fr,
        packageCount: pkg,
        weight_in_kgs: wt,
        article: firstArt,
        balance: String(bal)
      }
    })
  }, [goodsItems])

  const loadDatabaseMasters = async () => {
    try {
      const [
        lrsList,
        vList,
        dList,
        oList,
        aList,
        pList,
        sList,
        artList,
        bList
      ] = await Promise.all([
        lrController.fetchLRs({ status: "all" }, activeCompanyId),
        vehicleController.getVehicles(true, activeCompanyId),
        driverController.getDrivers(true, activeCompanyId),
        ownerController.getOwners(true, activeCompanyId),
        agentController.getAgents(true, activeCompanyId),
        partyController.getParties(true, activeCompanyId),
        stationController.getStations(true, activeCompanyId),
        articleController.getArticles(true, activeCompanyId),
        dbQuery.getAllForCompany<any>("branches", activeCompanyId)
      ])

      setAllLrs(lrsList)
      setFullVehiclesList(vList)
      setVehicles(vList.map(v => v.number))

      setDrivers(dList.map(d => d.name))
      setOwners(oList.map(o => o.name))
      
      setFullAgentsList(aList)
      setAgents(aList.map(a => a.name))

      setFullPartiesList(pList)
      setParties(pList.map(p => p.name))
      
      setFullStationsList(sList)
      setStations(sList.map(s => s.name))
      
      setFullArticlesList(artList)
      setArticles(artList.map(a => a.name))

      const compBranches = bList.filter((b: any) => b.company_id === activeCompanyId)
      setBranchesList(compBranches)
      const bNames = compBranches.map((b: any) => b.name)
      setBranchOptions(bNames)

      if (bNames.length > 0 && !editingLR) {
        setForm(prev => prev.bookingBranch ? prev : { ...prev, bookingBranch: bNames[0] })
      }
    } catch (err) {
      console.error("Error loading database masters:", err)
    }
  }

  useEffect(() => {
    loadDatabaseMasters()
  }, [activeCompanyId])

  // Reactive LR Sequence Generation on Branch Selection (Disabled in Edit Mode)
  useEffect(() => {
    if (editingLR) return
    if (branchesList.length === 0 || !form.bookingBranch) return
    const branchObj = branchesList.find(b => b.name === form.bookingBranch)
    if (!branchObj) return
    const nextLr = getNextLRForBranch(branchObj, allLrs)
    setLrNumber(nextLr)
  }, [form.bookingBranch, branchesList, allLrs, editingLR])

  const currentBranchObj = branchesList.find(b => b.name === form.bookingBranch)
  const currentBranchCode = currentBranchObj?.code || ""

  // Field change updates
  const set = (k: string) => (v: string) => {
    setForm(prev => {
      const next = { ...prev, [k]: v }

      // Auto-calculate Freight = Rate * Package Count
      if (k === "rate" || k === "packageCount") {
        const rateNum = parseFloat(k === "rate" ? v : prev.rate) || 0
        const countNum = parseFloat(k === "packageCount" ? v : prev.packageCount) || 0
        if (rateNum > 0 && countNum > 0) {
          next.freight = (rateNum * countNum).toString()
        }
      }

      // Auto-calculate Balance = Freight + Hamali - Advance
      if (k === "freight" || k === "advance" || k === "hamali" || k === "rate" || k === "packageCount") {
        const fr = parseFloat(next.freight) || 0
        const adv = parseFloat(next.advance) || 0
        const ham = parseFloat(next.hamali) || 0
        const bal = (fr + ham) - adv
        next.balance = bal.toString()
      }

      return next
    })
  }

  // AUTO FILL: Consignor select auto-loads GST, Address, City & State
  const handleConsignorChange = (consignorName: string) => {
    set("consignor")(consignorName)
    if (!consignorName) {
      setForm(prev => ({
        ...prev,
        gst: "",
        doc_gstin: "",
        address: "",
        city: "",
        state: ""
      }))
      return
    }

    const matchedParty = fullPartiesList.find(
      p => p.name.toLowerCase() === consignorName.toLowerCase()
    )

    if (matchedParty) {
      const gstVal = matchedParty.gst || matchedParty.gstin || ""
      const addr = matchedParty.billingAddress || matchedParty.shippingAddress || ""
      const cityStr = matchedParty.city || ""
      const stateStr = matchedParty.state || ""

      setForm(prev => ({
        ...prev,
        gst: gstVal,
        doc_gstin: gstVal,
        address: addr,
        city: cityStr,
        state: stateStr
      }))
    }
  }

  // AUTO FILL: Vehicle select auto-suggests Driver, Owner, and Agent
  const handleVehicleChange = (vehicleNum: string) => {
    set("vehicle")(vehicleNum)
    if (!vehicleNum) return

    const matchedVehicle = fullVehiclesList.find(
      v => v.number.toLowerCase() === vehicleNum.toLowerCase()
    )

    if (matchedVehicle) {
      setForm(prev => {
        const updates: Partial<typeof emptyForm> = {}
        if (matchedVehicle.driver && drivers.includes(matchedVehicle.driver)) {
          updates.driver = matchedVehicle.driver
        }
        if (matchedVehicle.owner && owners.includes(matchedVehicle.owner)) {
          updates.owner = matchedVehicle.owner
        }
        // Auto-assign matching agent broker if vehicle is market/attached
        const matchedAgent = agents.find(a => a.toLowerCase().includes(matchedVehicle.owner.toLowerCase()) || matchedVehicle.owner.toLowerCase().includes(a.toLowerCase()))
        if (matchedAgent) {
          updates.agent = matchedAgent
        } else if (agents.length > 0) {
          if (matchedVehicle.owner !== "TestTranpoart Logistics" && matchedVehicle.owner !== "Self Owned") {
            updates.agent = agents[0]
          }
        }
        return { ...prev, ...updates }
      })
    }
  }

  const isFieldInvalid = (key: keyof typeof emptyForm) => {
    if (!submitted) return false
    switch (key) {
      case "bookingBranch":
      case "bookingStation":
      case "deliveryStation":
      case "consignor":
      case "consignee":
      case "vehicle":
      case "driver":
      case "article":
      case "packageCount":
      case "freightType":
      case "freight":
        return !form[key] || String(form[key]).trim() === ""
      default:
        return false
    }
  }

  const handleResetForm = () => {
    setForm({ ...emptyForm, bookingBranch: branchOptions[0] || "" })
    setSubmitted(false)
    setErrorMsg("")
    setSuccessToast("")
  }

  // Submit Handler mapped to Backend Fields
  const handleSaveLR = async (e: React.FormEvent, actionType: "save" | "draft" | "print" | "whatsapp" = "save") => {
    e.preventDefault()
    setSubmitted(true)
    setErrorMsg("")
    setSuccessToast("")

    const requiredChecks = [
      { key: "bookingBranch", name: "Booking Branch", id: "field-bookingBranch" },
      { key: "bookingStation", name: "Booking Station", id: "field-bookingStation" },
      { key: "deliveryStation", name: "Delivery Station", id: "field-deliveryStation" },
      { key: "consignor", name: "Consignor", id: "field-consignor" },
      { key: "consignee", name: "Consignee", id: "field-consignee" },
      { key: "article", name: "Article", id: "field-article" },
      { key: "packageCount", name: "Number Of Articles", id: "field-packageCount" },
      { key: "vehicle", name: "Vehicle", id: "field-vehicle" },
      { key: "freightType", name: "Freight Type", id: "field-freightType" },
      { key: "freight", name: "Freight Amount", id: "field-freight" }
    ]

    const missing = requiredChecks.find(item => !form[item.key as keyof typeof emptyForm])

    if (missing) {
      setErrorMsg(`Please complete required field: ${missing.name}`)
      const el = document.getElementById(missing.id)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        const inputEl = el.querySelector("input, select, textarea") as HTMLElement
        if (inputEl) inputEl.focus()
      }
      return
    }

    setSaving(true)

    try {
      const freightAmt = parseFloat(form.freight) || 0
      const advanceAmt = parseFloat(form.advance) || 0
      const hamaliAmt = parseFloat(form.hamali) || 0
      const balanceAmt = parseFloat(form.balance) || 0
      const countNum = parseInt(form.packageCount, 10) || 1
      const rateVal = parseFloat(form.rate) || 0
      const weightVal = parseFloat(form.weight_in_kgs) || 0
      const invoiceVal = parseFloat(form.invoiceValue) || 0

      const lrNoVal = editingLR ? (editingLR.lrNo || editingLR.lr) : (lrNumber || `LR-${Date.now()}`)
      const payload: any = {
        lrNo: lrNoVal,
        lr: lrNoVal,
        date: form.date,

        // Multiple Goods Items Support
        goods_items: goodsItems,
        items: goodsItems,

        // Booking Branch persistence
        bookingBranch: form.bookingBranch,
        branch: form.bookingBranch,
        branch_id: currentBranchObj?.id || (editingLR as any)?.branch_id || (editingLR as any)?.booking_branch_id || "",
        booking_branch_id: currentBranchObj?.id || (editingLR as any)?.booking_branch_id || (editingLR as any)?.branch_id || "",

        // Master IDs mapping columns
        consignor_id: fullPartiesList.find(p => p.name === form.consignor)?.id || editingLR?.consignor_id || "",
        consignee_id: fullPartiesList.find(p => p.name === form.consignee)?.id || editingLR?.consignee_id || "",
        bill_to: form.bill_to,
        from_station_id: fullStationsList.find(s => s.name === form.bookingStation)?.id || editingLR?.from_station_id || "",
        to_station_id: fullStationsList.find(s => s.name === form.deliveryStation)?.id || editingLR?.to_station_id || "",
        vehicle_id: fullVehiclesList.find(v => v.number === form.vehicle)?.id || editingLR?.vehicle_id || "",
        agent_id: fullAgentsList.find(a => a.name === form.agent)?.id || editingLR?.agent_id || "",

        // Freight & Cargo
        freight_type: form.freightType as any,
        freightType: form.freightType as any,
        type: form.freightType as any,
        no_of_articles: countNum,
        noof_articles: countNum,
        rate_per_article: rateVal,
        lot_no: form.lot_no,
        quality: form.quality,
        pr_no: form.pr_no,
        pm_no: form.pm_no,
        gstin_no: form.doc_gstin || form.gst,

        // Document Details Persistence (Invoice, Invoice Value, Way Bill Number)
        invoice: form.invoice,
        invoice_no: form.invoice,
        invoiceNo: form.invoice,

        invoiceValue: invoiceVal,
        invoice_amount: invoiceVal,

        ewayBill: form.ewayBill,
        way_bill_no: form.ewayBill,
        eway_bill_no: form.ewayBill,

        // Real Uploaded Document References (Preserves existing attachments on edit if not replaced)
        invoice_doc_id: invoiceDoc?.id || (editingLR as any)?.invoice_doc_id || null,
        invoice_doc_url: invoiceDoc?.url || (editingLR as any)?.invoice_doc_url || null,
        invoice_doc_name: invoiceDoc?.original_name || (editingLR as any)?.invoice_doc_name || null,
        invoiceDoc: invoiceDoc || (editingLR as any)?.invoiceDoc || null,

        ewaybill_doc_id: ewayBillDoc?.id || (editingLR as any)?.ewaybill_doc_id || null,
        ewaybill_doc_url: ewayBillDoc?.url || (editingLR as any)?.ewaybill_doc_url || null,
        ewaybill_doc_name: ewayBillDoc?.original_name || (editingLR as any)?.ewaybill_doc_name || null,
        ewayBillDoc: ewayBillDoc || (editingLR as any)?.ewayBillDoc || null,

        // Weight & Amounts
        weight_in_kgs: weightVal,
        weigh_in_kgs: weightVal,
        freight_amount: freightAmt,
        advance_amount: advanceAmt,
        hamali: hamaliAmt,
        balance_amount: balanceAmt,
        remarks: form.remarks,

        // Backward compatibility fields
        bookingStation: form.bookingStation,
        deliveryStation: form.deliveryStation,
        consignor: form.consignor,
        consignee: form.consignee,
        from: form.bookingStation,
        to: form.deliveryStation,
        vehicle: form.vehicle,
        driver: form.driver,
        owner: form.owner,
        agent: form.agent,
        article: form.article,
        packages: countNum,
        actualWeight: weightVal,
        chargedWeight: weightVal,
        rate: rateVal,
        freight: freightAmt,
        advance: advanceAmt,
        balance: balanceAmt,
        status: actionType === "draft" ? "Draft" : (editingLR ? editingLR.status : "Booked")
      }

      const createdLR = editingLR
        ? await lrController.updateLR(editingLR.id || editingLR.lr, payload, activeCompanyId)
        : await lrController.createLR(payload, activeCompanyId)

      setSuccessToast(
        editingLR
          ? `Lorry Receipt ${createdLR.lr || lrNumber} updated successfully!`
          : actionType === "draft"
          ? `Lorry Receipt ${createdLR.lr} saved as Draft!`
          : `Lorry Receipt ${createdLR.lr} saved successfully!`
      )

      if (actionType === "print") {
        setPrintLrRecord(createdLR)
      } else if (actionType === "whatsapp") {
        const text = encodeURIComponent(`*Lorry Receipt Created*\nLR No: ${createdLR.lr}\nConsignor: ${createdLR.consignor}\nConsignee: ${createdLR.consignee}\nFrom: ${createdLR.from} To: ${createdLR.to}\nFreight: ₹${createdLR.freight}`)
        window.open(`https://wa.me/?text=${text}`, "_blank")
      }

      await loadDatabaseMasters()
      setForm({ ...emptyForm, bookingBranch: branchOptions[0] || "" })
      setSubmitted(false)

      setTimeout(() => setSuccessToast(""), 4500)

      if (onNavigateToList && (actionType === "save" || actionType === "draft")) {
        setTimeout(() => {
          onNavigateToList()
        }, 800)
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save LR")
    } finally {
      setSaving(false)
    }
  }

  const getInputCls = (key: keyof typeof emptyForm, hasLeftIcon: boolean = false) =>
    `h-[46px] w-full rounded-xl ${hasLeftIcon ? "pl-9" : "px-3.5"} text-sm text-gray-800 placeholder:text-gray-400 transition-all duration-150 font-medium focus:outline-none ${
      isFieldInvalid(key)
        ? "border-2 border-red-400 bg-red-50/20 text-red-900 ring-2 ring-red-400/20"
        : "bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-400/20 focus:shadow-sm"
    }`

  return (
    <div className="flex flex-col flex-1 h-full bg-[#F8FAFC] overflow-hidden relative">
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4 pb-1 border-b border-gray-200/60"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create Lorry Receipt</h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono">
                {lrNumber || "Generating..."}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Lorry Receipt · Sequential Allocation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
            >
              <RotateCcw size={13} /> Reset Form
            </button>
            {onNavigateToList && (
              <button
                type="button"
                onClick={onNavigateToList}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors shadow-xs cursor-pointer"
              >
                View LR Register →
              </button>
            )}
          </div>
        </motion.div>

        {/* Feedback Alerts */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-sm font-bold shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <span>{successToast}</span>
              </div>
              {onNavigateToList && (
                <button
                  type="button"
                  onClick={onNavigateToList}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer shrink-0"
                >
                  View LR Register →
                </button>
              )}
            </motion.div>
          )}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-bold shadow-md"
            >
              <AlertCircle size={20} className="text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={(e) => handleSaveLR(e, "save")} className="space-y-6">

          {/* SECTION 1 : BOOKING INFORMATION */}
          <SectionCard
            title="Booking Information"
            subtitle="Branch, stations and expected delivery details"
            icon={Calendar}
            delay={0.05}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div id="field-bookingBranch" className="w-full">
                  <QuickAddDropdown
                    label="Booking Branch"
                    category="station"
                    icon={Building}
                    addLabelOverride="Add New Branch"
                    required
                    hasError={isFieldInvalid("bookingBranch")}
                    value={form.bookingBranch}
                    options={branchOptions}
                    placeholder="Select Booking Branch"
                    onChange={set("bookingBranch")}
                    onOptionAdded={loadDatabaseMasters}
                  />
                </div>

                <Field label="LR Number (Read Only)">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Hash size={16} />
                    </span>
                    <input
                      type="text"
                      value={lrNumber}
                      readOnly
                      className="h-[46px] w-full rounded-xl pl-9 pr-3.5 text-sm font-bold text-gray-700 bg-gray-100 border border-gray-200 select-none cursor-not-allowed font-mono"
                    />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div id="field-bookingStation" className="w-full">
                  <QuickAddDropdown
                    label="From Station"
                    category="station"
                    icon={MapPin}
                    addLabelOverride="Add New Station"
                    required
                    hasError={isFieldInvalid("bookingStation")}
                    value={form.bookingStation}
                    options={stations}
                    placeholder="From station"
                    onChange={set("bookingStation")}
                    onOptionAdded={loadDatabaseMasters}
                  />
                </div>

                <div id="field-deliveryStation" className="w-full">
                  <QuickAddDropdown
                    label="To Station"
                    category="station"
                    icon={MapPin}
                    addLabelOverride="Add New Station"
                    required
                    hasError={isFieldInvalid("deliveryStation")}
                    value={form.deliveryStation}
                    options={stations}
                    placeholder="To station"
                    onChange={set("deliveryStation")}
                    onOptionAdded={loadDatabaseMasters}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* SECTION 2 : PARTY DETAILS */}
          <SectionCard
            title="Consignor & Consignee"
            subtitle="Consignor, consignee and billing party"
            icon={Users}
            delay={0.1}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div id="field-consignor" className="w-full">
                  <QuickAddDropdown
                    label="Consignor"
                    category="party"
                    icon={User}
                    required
                    hasError={isFieldInvalid("consignor")}
                    value={form.consignor}
                    options={parties}
                    placeholder="Select consignor"
                    onChange={handleConsignorChange}
                    onOptionAdded={loadDatabaseMasters}
                  />
                </div>

                <div id="field-consignee" className="w-full">
                  <QuickAddDropdown
                    label="Consignee"
                    category="party"
                    icon={User}
                    required
                    hasError={isFieldInvalid("consignee")}
                    value={form.consignee}
                    options={parties}
                    placeholder="Select consignee"
                    onChange={set("consignee")}
                    onOptionAdded={loadDatabaseMasters}
                  />
                </div>

                <Field label="Bill To">
                  <SearchDropdown
                    value={form.bill_to}
                    onChange={val => set("bill_to")(val)}
                    options={["Consignor", "Consignee", "Third Party"]}
                    placeholder="Select billing party"
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* SECTION 3 : VEHICLE */}
          <SectionCard
            title="Vehicle Assignment"
            subtitle="Assign vehicle, driver and owner info"
            icon={Truck}
            delay={0.15}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div id="field-vehicle" className="w-full">
                <QuickAddDropdown
                  label="Vehicle"
                  category="vehicle"
                  icon={Truck}
                  required
                  hasError={isFieldInvalid("vehicle")}
                  value={form.vehicle}
                  options={vehicles}
                  placeholder="Select vehicle"
                  onChange={handleVehicleChange}
                  onOptionAdded={loadDatabaseMasters}
                />
              </div>

              <div id="field-driver" className="w-full">
                <QuickAddDropdown
                  label="Driver"
                  category="driver"
                  icon={User}
                  required
                  hasError={isFieldInvalid("driver")}
                  value={form.driver}
                  options={drivers}
                  placeholder="Select driver"
                  onChange={set("driver")}
                  onOptionAdded={loadDatabaseMasters}
                />
              </div>

              <QuickAddDropdown
                label="Vehicle Owner"
                category="owner"
                icon={User}
                value={form.owner}
                options={owners}
                placeholder="Select owner"
                onChange={set("owner")}
                onOptionAdded={loadDatabaseMasters}
              />

              <QuickAddDropdown
                label="Agent"
                category="agent"
                icon={User}
                value={form.agent}
                options={agents}
                placeholder="Select agent"
                onChange={set("agent")}
                onOptionAdded={loadDatabaseMasters}
              />
            </div>
          </SectionCard>

          {/* SECTION 4 : GOODS INFORMATION (ALWAYS FULLY VISIBLE CARGO CARDS) */}
          <SectionCard
            title="Goods Information"
            subtitle="Fast multi-item cargo entry grid optimized for transport operators"
            icon={Package}
            delay={0.2}
          >
            <div className="space-y-3 font-sans">
              {/* Rows Header Bar */}
              <div className="hidden md:grid md:grid-cols-[40px_minmax(220px,1fr)_110px_130px_130px_150px_40px] gap-2.5 px-3 py-2 bg-slate-100/80 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-gray-500 items-center select-none">
                <div className="text-center text-gray-400">#</div>
                <div>Article *</div>
                <div className="text-right">Qty *</div>
                <div className="text-right">Rate (₹)</div>
                <div className="text-right">Weight (KG)</div>
                <div className="text-right pr-2">Freight (₹)</div>
                <div className="text-center">Remove</div>
              </div>

              {/* Dynamic Always-Visible Goods Items Cards */}
              <div className="space-y-3">
                {goodsItems.map((row, index) => {
                  return (
                    <div
                      key={row.id}
                      className="rounded-2xl border border-gray-200/90 bg-gray-50/40 hover:border-indigo-200 transition-all overflow-hidden shadow-xs"
                    >
                      {/* TOP PRIMARY ROW */}
                      <div className="p-3 grid grid-cols-12 md:grid-cols-[40px_minmax(220px,1fr)_110px_130px_130px_150px_40px] gap-2.5 items-center">
                        {/* Row Index */}
                        <div className="col-span-12 md:col-span-1 text-center font-mono font-bold text-gray-500 text-xs shrink-0 flex items-center justify-center h-[42px]">
                          #{index + 1}
                        </div>

                        {/* Article Selection */}
                        <div className="col-span-12 md:col-span-1 flex items-center h-[42px]">
                          <div className="w-full">
                            <QuickAddDropdown
                              label=""
                              category="article"
                              icon={Package}
                              required
                              hasError={submitted && !row.article}
                              value={row.article}
                              options={articles}
                              placeholder="Select article"
                              onChange={val => updateGoodsItemField(row.id, "article", val)}
                              onOptionAdded={loadDatabaseMasters}
                            />
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="col-span-4 md:col-span-1 h-[42px]">
                          <input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            value={row.no_of_articles || ""}
                            onChange={e => updateGoodsItemField(row.id, "no_of_articles", Math.max(1, parseInt(e.target.value, 10) || 0))}
                            className="h-[42px] w-full bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 text-right font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all"
                          />
                        </div>

                        {/* Rate */}
                        <div className="col-span-4 md:col-span-1 h-[42px]">
                          <input
                            type="number"
                            min={0}
                            placeholder="Rate (₹)"
                            value={row.rate_per_article || ""}
                            onChange={e => updateGoodsItemField(row.id, "rate_per_article", parseFloat(e.target.value) || 0)}
                            className="h-[42px] w-full bg-white border border-gray-200 rounded-xl px-3 text-xs font-medium text-gray-800 text-right font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all"
                          />
                        </div>

                        {/* Weight */}
                        <div className="col-span-4 md:col-span-1 h-[42px]">
                          <input
                            type="number"
                            min={0}
                            placeholder="Weight (KG)"
                            value={row.weight_in_kgs || ""}
                            onChange={e => updateGoodsItemField(row.id, "weight_in_kgs", parseFloat(e.target.value) || 0)}
                            className="h-[42px] w-full bg-white border border-gray-200 rounded-xl px-3 text-xs text-gray-800 text-right font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all"
                          />
                        </div>

                        {/* Freight Display */}
                        <div className="col-span-6 md:col-span-1 text-right pr-2 min-w-0 flex items-center justify-end h-[42px]">
                          <span className="text-[10px] text-gray-400 font-semibold md:hidden block uppercase mr-2">Freight:</span>
                          <span
                            className="font-mono text-sm font-black text-indigo-900 truncate block w-full text-right"
                            title={`₹${row.freightAmount.toLocaleString("en-IN")}`}
                          >
                            ₹{row.freightAmount.toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Delete Row Button */}
                        <div className="col-span-6 md:col-span-1 flex items-center justify-center h-[42px]">
                          <button
                            type="button"
                            title="Remove Item"
                            disabled={goodsItems.length <= 1}
                            onClick={() => deleteGoodsItem(row.id)}
                            className={`w-8 h-[34px] rounded-lg transition-colors flex items-center justify-center ${
                              goodsItems.length <= 1
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* ALWAYS VISIBLE SECONDARY DETAILS PANEL */}
                      <div className="px-4 py-3 border-t border-gray-100 bg-white/70 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Lot No</label>
                          <input
                            type="text"
                            placeholder="LOT-99"
                            value={row.lot_no}
                            onChange={e => updateGoodsItemField(row.id, "lot_no", e.target.value)}
                            className="h-[38px] w-full bg-white border border-gray-200 rounded-lg px-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Quality</label>
                          <input
                            type="text"
                            placeholder="Grade A"
                            value={row.quality}
                            onChange={e => updateGoodsItemField(row.id, "quality", e.target.value)}
                            className="h-[38px] w-full bg-white border border-gray-200 rounded-lg px-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">PR No</label>
                          <input
                            type="text"
                            placeholder="PR-502"
                            value={row.pr_no}
                            onChange={e => updateGoodsItemField(row.id, "pr_no", e.target.value)}
                            className="h-[38px] w-full bg-white border border-gray-200 rounded-lg px-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">PM No</label>
                          <input
                            type="text"
                            placeholder="PM-88"
                            value={row.pm_no}
                            onChange={e => updateGoodsItemField(row.id, "pm_no", e.target.value)}
                            className="h-[38px] w-full bg-white border border-gray-200 rounded-lg px-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Charged Weight (KG)</label>
                          <input
                            type="number"
                            placeholder="Charged KG"
                            value={row.charged_weight || ""}
                            onChange={e => updateGoodsItemField(row.id, "charged_weight", parseFloat(e.target.value) || 0)}
                            className="h-[38px] w-full bg-white border border-gray-200 rounded-lg px-2.5 text-xs text-gray-800 text-right font-mono focus:outline-none focus:border-indigo-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Description</label>
                          <input
                            type="text"
                            placeholder="Short description"
                            value={row.description || ""}
                            onChange={e => updateGoodsItemField(row.id, "description", e.target.value)}
                            className="h-[38px] w-full bg-white border border-gray-200 rounded-lg px-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* FULL-WIDTH STICKY HORIZONTAL SUMMARY BAR WITH FAR-RIGHT + ADD ITEM BUTTON */}
              <div className="w-full h-[52px] px-4 rounded-xl bg-purple-50/80 border border-purple-100/90 text-purple-950 flex items-center justify-between gap-3 text-xs overflow-x-auto custom-scrollbar font-sans">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Package size={14} />
                  </div>
                  <span className="font-extrabold text-indigo-950 hidden sm:inline uppercase text-[11px] tracking-wider">Cargo Summary</span>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 font-mono text-xs">
                  <div className="flex items-center gap-1.5" title={`${goodsItems.length} cargo rows`}>
                    <span className="text-[10px] text-purple-600 font-sans uppercase font-bold">Items:</span>
                    <span className="font-extrabold text-purple-950">{goodsItems.length}</span>
                  </div>

                  <div className="h-4 w-px bg-purple-200" />

                  <div className="flex items-center gap-1.5" title={`${totalArticlesCount} total packages`}>
                    <span className="text-[10px] text-purple-600 font-sans uppercase font-bold">Pkgs:</span>
                    <span className="font-extrabold text-purple-950">{totalArticlesCount.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="h-4 w-px bg-purple-200 hidden sm:block" />

                  <div className="hidden sm:flex items-center gap-1.5" title={`${totalWeightKg.toLocaleString("en-IN")} KG weight`}>
                    <span className="text-[10px] text-purple-600 font-sans uppercase font-bold">Weight:</span>
                    <span className="font-extrabold text-purple-950">{totalWeightKg.toLocaleString("en-IN")} KG</span>
                  </div>

                  <div className="h-4 w-px bg-purple-200 hidden lg:block" />

                  <div className="hidden lg:flex items-center gap-1.5" title={`${totalChargedWeightKg.toLocaleString("en-IN")} KG charged`}>
                    <span className="text-[10px] text-purple-600 font-sans uppercase font-bold">Charged:</span>
                    <span className="font-extrabold text-purple-950">{totalChargedWeightKg.toLocaleString("en-IN")} KG</span>
                  </div>

                  <div className="h-4 w-px bg-purple-200" />

                  <div className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1 rounded-lg shadow-xs min-w-[110px] justify-end" title={`₹${totalGoodsFreight.toLocaleString("en-IN")}`}>
                    <span className="text-[10px] text-indigo-100 font-sans uppercase font-bold">Freight:</span>
                    <span className="font-black text-white text-sm truncate">₹{totalGoodsFreight.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* FAR-RIGHT + ADD ANOTHER ITEM BUTTON */}
                <button
                  type="button"
                  onClick={addGoodsItem}
                  className="h-8 px-3 rounded-lg text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 active:scale-98 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>+ Add Another Item</span>
                </button>
              </div>
            </div>
          </SectionCard>

          {/* SECTION 5 : DOCUMENT DETAILS */}
          <SectionCard
            title="Document Details"
            subtitle="Cargo invoices and e-way bills"
            icon={FileText}
            delay={0.25}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Invoice Number">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <FileText size={16} />
                    </span>
                    <input
                      value={form.invoice}
                      onChange={e => set("invoice")(e.target.value)}
                      placeholder="INV-XXXX"
                      className={getInputCls("invoice", true)}
                    />
                  </div>
                </Field>

                <Field label="Invoice Amount">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                    <input
                      type="number"
                      value={form.invoiceValue}
                      onChange={e => set("invoiceValue")(e.target.value)}
                      placeholder="0.00"
                      className={`${getInputCls("invoiceValue")} pl-7`}
                    />
                  </div>
                </Field>

                <Field label="Way Bill Number">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <FileText size={16} />
                    </span>
                    <input
                      value={form.ewayBill}
                      onChange={e => set("ewayBill")(e.target.value)}
                      placeholder="EWB-XXXXXXXXXXXX"
                      className={getInputCls("ewayBill", true)}
                    />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <UploadBox
                  label="Upload Invoice"
                  documentType="INVOICE"
                  document={invoiceDoc}
                  onUploaded={doc => setInvoiceDoc(doc)}
                  onRemoved={() => setInvoiceDoc(null)}
                />
                <UploadBox
                  label="Upload E-Way Bill"
                  documentType="E_WAY_BILL"
                  document={ewayBillDoc}
                  onUploaded={doc => setEwayBillDoc(doc)}
                  onRemoved={() => setEwayBillDoc(null)}
                />
              </div>
            </div>
          </SectionCard>

          {/* SECTION 6 : FREIGHT */}
          <SectionCard
            title="Freight & Payment"
            subtitle="Freight billing breakdowns and calculations"
            icon={Wallet}
            delay={0.3}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div id="field-freightType" className="w-full">
                <SearchDropdown
                  label="Freight Type"
                  required
                  hasError={isFieldInvalid("freightType")}
                  value={form.freightType}
                  options={freightTypes}
                  placeholder="Select type"
                  onChange={val => set("freightType")(val)}
                />
              </div>

              <div id="field-freight" className="w-full">
                <Field label="Freight Amount" required hasError={isFieldInvalid("freight")}>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                    <input
                      type="number"
                      value={form.freight}
                      onChange={e => set("freight")(e.target.value)}
                      placeholder="0"
                      className={`${getInputCls("freight")} pl-7 font-bold text-gray-900`}
                    />
                  </div>
                </Field>
              </div>

              <Field label="Advance">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                  <input
                    type="number"
                    value={form.advance}
                    onChange={e => set("advance")(e.target.value)}
                    placeholder="0"
                    className={`${getInputCls("advance")} pl-7`}
                  />
                </div>
              </Field>

              <Field label="Hamali">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                  <input
                    type="number"
                    value={form.hamali}
                    onChange={e => set("hamali")(e.target.value)}
                    placeholder="0"
                    className={`${getInputCls("hamali")} pl-7`}
                  />
                </div>
              </Field>

              <Field label="Balance">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 text-sm font-medium">₹</span>
                  <input
                    type="number"
                    value={form.balance}
                    readOnly
                    className={`${getInputCls("balance")} pl-7 font-bold text-indigo-600 bg-gray-100 select-none cursor-not-allowed`}
                  />
                </div>
              </Field>
            </div>
          </SectionCard>

          {/* SECTION 7 : REMARKS */}
          <SectionCard
            title="Remarks"
            subtitle="Additional notes in create LR"
            icon={NotebookPen}
            delay={0.35}
          >
            <div className="space-y-4">
              <Field label="Booking Remarks">
                <textarea
                  rows={3}
                  value={form.remarks}
                  onChange={e => set("remarks")(e.target.value)}
                  placeholder="Booking remarks"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 focus:bg-white transition-all font-medium focus:shadow-sm resize-none h-[95px]"
                />
              </Field>
            </div>
          </SectionCard>

        </form>

        {/* Print Modal */}
        <LRPrintModal
          isOpen={!!printLrRecord}
          lr={printLrRecord}
          onClose={() => setPrintLrRecord(null)}
        />

        </div>
      </div>

      {/* Sticky Action Bar (Properly nested inside layout to align with sidebar) */}
      <div className="bg-white border-t border-gray-200 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] h-[72px] flex items-center justify-between px-4 md:px-8 py-3 shrink-0">
        <div className="max-w-[1140px] w-full mx-auto flex items-center justify-between gap-4">

          {/* Left Side Summary Chips */}
          <div className="flex items-center gap-2 flex-wrap max-w-full text-xs font-semibold text-gray-600">
            <div className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-150 flex items-center gap-1.5 shrink-0 select-none">
              <span className="text-gray-400 font-medium">Freight</span>
              <strong className="text-gray-800 font-extrabold">
                ₹{(parseFloat(form.freight) || 0).toLocaleString()}
              </strong>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-150 flex items-center gap-1.5 shrink-0 select-none">
              <span className="text-gray-400 font-medium">Advance</span>
              <strong className="text-gray-800 font-extrabold">
                ₹{(parseFloat(form.advance) || 0).toLocaleString()}
              </strong>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-150 flex items-center gap-1.5 shrink-0 select-none">
              <span className="text-gray-400 font-medium">Hamali</span>
              <strong className="text-gray-800 font-extrabold">
                ₹{(parseFloat(form.hamali) || 0).toLocaleString()}
              </strong>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center gap-1.5 shrink-0 select-none">
              <span className="text-indigo-400 font-bold">Balance</span>
              <strong className="font-extrabold text-indigo-700">
                ₹{(parseFloat(form.balance) || 0).toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Right Side Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetForm}
              className="h-10 px-4 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={(e) => handleSaveLR(e, "draft")}
              disabled={saving || !form.bookingBranch}
              className="h-10 px-4 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={(e) => handleSaveLR(e, "print")}
              disabled={saving || !form.bookingBranch}
              className="h-10 px-4 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              Save & Print
            </button>

            <button
              type="button"
              onClick={(e) => handleSaveLR(e, "whatsapp")}
              disabled={saving || !form.bookingBranch}
              className="h-10 px-4 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle size={14} />
              Save & WhatsApp
            </button>

            <motion.button
              type="button"
              onClick={(e) => handleSaveLR(e, "save")}
              disabled={saving || !form.bookingBranch}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="h-10 px-6 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer animate-none"
            >
              <Save size={15} />
              {saving ? "Saving..." : "Save LR"}
            </motion.button>
          </div>

        </div>
      </div>
    </div>
  )
}
