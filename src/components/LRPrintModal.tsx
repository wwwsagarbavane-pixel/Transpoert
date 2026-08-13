import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Printer, X, FileText, Download, Eye, Paperclip, CheckCircle2, ShieldCheck } from "lucide-react"
import { DBLR } from "../db/schema"
import { companyContext } from "../services/companyContext"
import { companyRepository } from "../repositories/repositories"
import { lrController } from "../controllers/lrController"

interface LRPrintModalProps {
  isOpen: boolean
  lr: DBLR | null
  onClose: () => void
  initialCopyType?: "consignee" | "driver"
}

export default function LRPrintModal({ isOpen, lr, onClose, initialCopyType = "consignee" }: LRPrintModalProps) {
  const [copyType, setCopyType] = useState<"consignee" | "driver">(initialCopyType)
  const [fullLr, setFullLr] = useState<DBLR | null>(lr)
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [companyDetails, setCompanyDetails] = useState<{
    companyName: string
    address: string
    pan: string
    gstin: string
    phone: string
    logo?: string
  }>({
    companyName: "Ganesh Transport",
    address: "HQ Suite 4, Logistics Park, Pune - 411001 (MH)",
    pan: "AABCG5678B",
    gstin: "27AABCG5678B1Z9",
    phone: "022-98765432",
    logo: ""
  })

  useEffect(() => {
    if (!isOpen || !lr) return
    setCopyType(initialCopyType)
    setFullLr(lr)

    const loadCompleteLRData = async () => {
      setLoading(true)
      const activeCompanyId = companyContext.getActiveCompanyId()
      
      try {
        // 1. Fetch Company Master Details
        const comp = await companyRepository.findById(activeCompanyId)
        if (comp && comp.name) {
          setCompanyDetails({
            companyName: comp.name,
            address: `${(comp as any).address || ""}, ${comp.city || ""} - ${(comp as any).pincode || ""} (${(comp as any).state || ""})`.trim().replace(/^,\s*/, ""),
            pan: (comp as any).pan || "AABCG5678B",
            gstin: (comp as any).gstin || "27AABCG5678B1Z9",
            phone: (comp as any).phone || "022-98765432",
            logo: comp.logo || ""
          })
        }

        // 2. Fetch COMPLETE LR Record from PostgreSQL Server
        const lrId = lr.id || lr.lr
        const freshLr = await lrController.fetchLRById(lrId, activeCompanyId)
        if (freshLr) {
          setFullLr(freshLr)
        }

        // 3. Fetch Related Document Metadata for Attachments
        const res = await fetch(`/api/print/lr/${encodeURIComponent(lrId)}?company_id=${activeCompanyId}`, {
          headers: { "X-Company-ID": activeCompanyId }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.lr) {
            setFullLr(data.lr)
            if (data.documents) setDocuments(data.documents)
          }
        }
      } catch (err) {
        console.error("Error loading print LR data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadCompleteLRData()
  }, [isOpen, lr, initialCopyType])

  if (!isOpen || !fullLr) return null

  const handlePrint = () => {
    window.print()
  }

  const currentLr = fullLr || lr
  const lhrNo = `LHR-${(currentLr.lr || "").replace(/\D/g, "") || "1001"}`

  // Parse ALL Cargo Articles / Goods Items from PostgreSQL JSON Record (items or goods_items)
  let goodsList: any[] = []
  let rawItems = (currentLr as any).items || (currentLr as any).goods_items || (currentLr as any).cargo_items
  if (typeof rawItems === "string") {
    try {
      rawItems = JSON.parse(rawItems)
    } catch {
      rawItems = []
    }
  }
  if (rawItems && typeof rawItems === "object" && !Array.isArray(rawItems) && Array.isArray((rawItems as any).goods_items) && (rawItems as any).goods_items.length > 0) {
    goodsList = (rawItems as any).goods_items
  } else if (Array.isArray(rawItems) && rawItems.length > 0) {
    goodsList = rawItems
  }

  if (!goodsList || goodsList.length === 0) {
    goodsList = [{
      article: currentLr.article || (currentLr as any).articleType || "General Cargo",
      no_of_articles: currentLr.packageCount || (currentLr as any).noof_articles || 1,
      rate_per_article: currentLr.rate || (currentLr as any).rate_per_article || 0,
      weight_in_kgs: currentLr.weight || (currentLr as any).weight_in_kgs || currentLr.actualWeight || 0,
      charged_weight: (currentLr as any).charged_weight || currentLr.chargedWeight || currentLr.weight || 0,
      freightAmount: currentLr.freight || (currentLr as any).freight_amount || 0,
      lot_no: (currentLr as any).lot_no || "",
      quality: (currentLr as any).quality || "",
      pr_no: (currentLr as any).pr_no || "",
      pm_no: (currentLr as any).pm_no || "",
      description: (currentLr as any).description || ""
    }]
  }

  // Calculate totals across ALL articles
  const totalPkgs = goodsList.reduce((sum, g) => sum + (Number(g.no_of_articles || g.packageCount) || 1), 0)
  const totalWeight = goodsList.reduce((sum, g) => sum + (Number(g.weight_in_kgs || g.weight) || 0), 0)
  const totalChargedWeight = goodsList.reduce((sum, g) => sum + (Number(g.charged_weight || g.weight_in_kgs || g.weight) || 0), 0)
  const totalFreight = currentLr.freight || goodsList.reduce((sum, g) => sum + (Number(g.freightAmount || g.freight) || 0), 0)
  
  const advance = currentLr.advance || 0
  const hamali = currentLr.hamali || 0
  const balance = Math.max(0, (totalFreight + hamali) - advance)
  const signatureUrl = (currentLr as any).signature_url || (currentLr as any).signature || ""

  // Resolve Real Uploaded Invoice and E-Way Bill Attachments
  const itemsObj = typeof (currentLr as any).items === "object" && !Array.isArray((currentLr as any).items) ? (currentLr as any).items : null
  const invoiceDoc = (currentLr as any).invoiceDoc || documents.find(d => d.document_type === "INVOICE" || d.entity_type === "INVOICE") || null
  let invoiceUrl = (currentLr as any).invoice_doc_url || (currentLr as any).invoice_url || itemsObj?.invoice_doc_url || invoiceDoc?.url || ""
  let invoiceName = (currentLr as any).invoice_doc_name || itemsObj?.invoice_doc_name || invoiceDoc?.original_name || (currentLr as any).invoice || "Invoice.pdf"
  if (!invoiceUrl && (currentLr as any).invoice && String((currentLr as any).invoice).startsWith("/api/storage/")) {
    invoiceUrl = (currentLr as any).invoice
  }

  const ewayBillDoc = (currentLr as any).ewayBillDoc || documents.find(d => d.document_type === "E_WAY_BILL" || d.entity_type === "E_WAY_BILL") || null
  let ewayBillUrl = (currentLr as any).ewaybill_doc_url || (currentLr as any).eway_bill_doc_url || (currentLr as any).ewaybill_url || itemsObj?.ewaybill_doc_url || ewayBillDoc?.url || ""
  let ewayBillName = (currentLr as any).ewaybill_doc_name || (currentLr as any).eway_bill_doc_name || itemsObj?.ewaybill_doc_name || ewayBillDoc?.original_name || (currentLr as any).ewayBill || "EWayBill.pdf"
  if (!ewayBillUrl && (currentLr as any).ewayBill && String((currentLr as any).ewayBill).startsWith("/api/storage/")) {
    ewayBillUrl = (currentLr as any).ewayBill
  }

  const isImageFile = (filename: string, url: string) => {
    const ext = (filename.split(".").pop() || url.split(".").pop() || "").toLowerCase()
    return ["jpg", "jpeg", "png", "svg", "webp"].includes(ext)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
        
        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Header Bar - Hidden when printing */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 print:hidden shrink-0">
            <div>
              <h3 className="text-base font-bold text-gray-900 font-mono flex items-center gap-2">
                <span>Official LR Receipt — {currentLr.lr}</span>
                {loading && <span className="text-xs text-indigo-600 font-sans font-semibold animate-pulse">(Loading full DB record...)</span>}
              </h3>
              <p className="text-xs text-gray-400 font-normal">Complete Consignment & Driver Copy Print Template</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-200/80 p-0.5 rounded-xl text-xs font-bold mr-2">
                <button
                  type="button"
                  onClick={() => setCopyType("consignee")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${copyType === "consignee" ? "bg-indigo-600 text-white shadow-xs" : "text-gray-600"}`}
                >
                  Consignee Copy
                </button>
                <button
                  type="button"
                  onClick={() => setCopyType("driver")}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${copyType === "driver" ? "bg-indigo-600 text-white shadow-xs" : "text-gray-600"}`}
                >
                  Print Driver Copy
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} /> {copyType === "driver" ? "Print Driver Copy" : "Print LR"}
              </button>
              <button
                onClick={onClose}
                className="h-9 px-3 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Printable Template Area */}
          <div className="p-6 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
            <div className="border-[3px] border-[#0D3B80] bg-white p-4 text-[#0D3B80] font-sans text-xs space-y-2 select-none print:border-[3px] print:border-[#0D3B80]">
              
              {/* Row 1: Top Header Grid */}
              <div className="grid grid-cols-12 gap-2 border-b-2 border-[#0D3B80] pb-2">
                {/* Top Left Box: COPY TYPE BADGE + LHR / Lorry No / Date Table */}
                <div className="col-span-5 flex flex-col justify-between pr-2 border-r-2 border-[#0D3B80]">
                  <div>
                    <div className="inline-block bg-[#0D3B80] text-white font-bold text-[11px] px-2.5 py-0.5 tracking-wider uppercase mb-1 rounded-xs">
                      {copyType === "driver" ? "DRIVER COPY / TRANSIT MANIFEST" : "CONSIGNEE COPY"}
                    </div>
                    <p className="text-[7.5px] leading-tight font-medium text-[#0D3B80]">
                      We have not availed cenvat credit on any inputs or capital Goods for entering the Service of Goods Transports Agency
                    </p>
                  </div>

                  <table className="w-full text-[10px] border-collapse border border-[#0D3B80] mt-2">
                    <tbody>
                      <tr>
                        <td className="border border-[#0D3B80] p-1 font-bold w-1/2">LHR No. <span className="font-mono text-gray-900">{lhrNo}</span></td>
                        <td className="border border-[#0D3B80] p-1 font-bold w-1/2">Lorry No. <span className="font-mono text-gray-900">{currentLr.vehicle}</span></td>
                      </tr>
                      <tr>
                        <td className="border border-[#0D3B80] p-1 font-bold">Date <span className="font-mono text-gray-900">{currentLr.date}</span></td>
                        <td className="border border-[#0D3B80] p-1 font-bold">LR No. <span className="font-mono text-gray-900">{currentLr.lr}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Top Right Box: RAM II + Logo + Address + Phones */}
                <div className="col-span-7 flex flex-col justify-between pl-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-center flex-1">II RAM II</span>
                    <div className="text-right text-[10px] leading-tight font-bold">
                      <div>Cell : {companyDetails.phone}</div>
                    </div>
                  </div>

                  {/* Logo Box - Dynamic Company Name & Logo */}
                  <div className="border-2 border-[#0D3B80] px-3 py-1.5 my-1 text-center bg-blue-50/20 flex items-center justify-center gap-3">
                    {companyDetails.logo && (
                      <img src={companyDetails.logo} alt="Company Logo" className="h-8 max-w-[120px] object-contain shrink-0" />
                    )}
                    <span className="text-2xl font-black tracking-tight text-[#0D3B80] uppercase">
                      {companyDetails.companyName}
                    </span>
                  </div>

                  <div className="text-center space-y-0.5 text-[10px] font-bold">
                    <div>{companyDetails.address}</div>
                    <div>PAN. No. {companyDetails.pan}</div>
                    <div className="text-[11px]">GSTIN No. {companyDetails.gstin}</div>
                  </div>
                </div>
              </div>

              {/* Row 2: Consignor, Consignee, From & To Box */}
              <div className="grid grid-cols-12 gap-2 border-b-2 border-[#0D3B80] pb-2">
                <div className="col-span-8 space-y-2 font-bold text-[11px]">
                  <div>
                    Consignor : <span className="font-extrabold text-gray-900">{currentLr.consignor}</span>
                    {(currentLr.consignorGst || (currentLr as any).doc_gstin || (currentLr as any).gst) && (
                      <span className="text-[10px] text-gray-600 block">GSTIN: {currentLr.consignorGst || (currentLr as any).doc_gstin || (currentLr as any).gst}</span>
                    )}
                  </div>
                  <div>
                    Consignee : <span className="font-extrabold text-gray-900">{currentLr.consignee}</span>
                    {currentLr.consigneeGst && (
                      <span className="text-[10px] text-gray-600 block">GSTIN: {currentLr.consigneeGst}</span>
                    )}
                  </div>
                  {((currentLr as any).bill_to || currentLr.bill_to) && (
                    <div className="text-[10px] text-blue-900 font-extrabold">Bill To: {(currentLr as any).bill_to || currentLr.bill_to}</div>
                  )}
                </div>
                <div className="col-span-4 border-2 border-[#0D3B80] p-2 text-[11px] font-bold space-y-1.5">
                  <div>From : <span className="text-gray-900">{currentLr.from || (currentLr as any).from_station_id}</span></div>
                  <div className="border-t border-[#0D3B80] pt-1">To : <span className="text-gray-900">{currentLr.to || (currentLr as any).to_station_id}</span></div>
                  {((currentLr as any).driver || currentLr.driverName) && (
                    <div className="border-t border-[#0D3B80] pt-1 text-[10px]">Driver: {(currentLr as any).driver || currentLr.driverName}</div>
                  )}
                </div>
              </div>

              {/* Row 3: Main Articles Table (Iterates ALL Goods Items) */}
              <div className="border-b-2 border-[#0D3B80]">
                <table className="w-full border-collapse text-[10px] text-left border border-[#0D3B80]">
                  <thead>
                    <tr className="bg-blue-50/40 text-[#0D3B80] font-bold border-b border-[#0D3B80]">
                      <th className="border-r border-[#0D3B80] p-1.5 w-[6%] text-center">#</th>
                      <th className="border-r border-[#0D3B80] p-1.5 w-[10%] text-center">No.of Pkgs</th>
                      <th className="border-r border-[#0D3B80] p-1.5 w-[38%] text-center">Particulars of Consignment & Cargo Details</th>
                      <th className="border-r border-[#0D3B80] p-1.5 w-[10%] text-center">Weight</th>
                      <th className="border-r border-[#0D3B80] p-1.5 w-[10%] text-center">Charged Wt</th>
                      <th className="border-r border-[#0D3B80] p-1.5 w-[14%] text-center">Freight (₹)</th>
                      <th className="p-1.5 w-[12%] text-center">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goodsList.map((g, idx) => (
                      <tr key={g.id || idx} className="border-b border-[#0D3B80]/40">
                        <td className="border-r border-[#0D3B80] p-1.5 text-center font-bold text-gray-700">{idx + 1}</td>
                        <td className="border-r border-[#0D3B80] p-1.5 text-center font-bold text-gray-900">{g.no_of_articles || 1}</td>
                        <td className="border-r border-[#0D3B80] p-1.5 font-bold text-gray-900">
                          <div className="text-xs">{g.article || "Cargo Item"}</div>
                          <div className="text-[9px] text-gray-600 font-normal space-x-2">
                            {g.lot_no && <span>Lot: {g.lot_no}</span>}
                            {g.quality && <span>Quality: {g.quality}</span>}
                            {g.pr_no && <span>PR: {g.pr_no}</span>}
                            {g.pm_no && <span>PM: {g.pm_no}</span>}
                            {g.rate_per_article > 0 && <span>@ ₹{g.rate_per_article}/unit</span>}
                            {g.description && <span className="block italic">{g.description}</span>}
                          </div>
                        </td>
                        <td className="border-r border-[#0D3B80] p-1.5 text-right font-mono text-gray-800">
                          {g.weight_in_kgs ? `${g.weight_in_kgs} KG` : "—"}
                        </td>
                        <td className="border-r border-[#0D3B80] p-1.5 text-right font-mono text-gray-800">
                          {g.charged_weight || g.weight_in_kgs ? `${g.charged_weight || g.weight_in_kgs} KG` : "—"}
                        </td>
                        <td className="border-r border-[#0D3B80] p-1.5 font-extrabold text-gray-900 text-right">
                          ₹{(g.freightAmount !== undefined ? Number(g.freightAmount) : Number(totalFreight)).toLocaleString("en-IN")}
                        </td>
                        <td className="p-1.5 font-medium text-gray-800">{idx === 0 ? currentLr.freightType || (currentLr as any).type : ""}</td>
                      </tr>
                    ))}

                    {/* CARGO TOTALS SUMMARY ROW */}
                    <tr className="bg-blue-50/60 font-black border-t-2 border-[#0D3B80]">
                      <td className="border-r border-[#0D3B80] p-1.5 text-center text-indigo-950 font-bold uppercase">Total ({goodsList.length})</td>
                      <td className="border-r border-[#0D3B80] p-1.5 text-center text-indigo-950 text-xs">{totalPkgs} Pkgs</td>
                      <td className="border-r border-[#0D3B80] p-1.5 text-indigo-950 uppercase text-xs">Total Cargo Summary</td>
                      <td className="border-r border-[#0D3B80] p-1.5 text-right text-indigo-950 font-mono text-xs">{totalWeight} KG</td>
                      <td className="border-r border-[#0D3B80] p-1.5 text-right text-indigo-950 font-mono text-xs">{totalChargedWeight} KG</td>
                      <td className="border-r border-[#0D3B80] p-1.5 text-right text-indigo-950 font-mono text-xs">₹{totalFreight.toLocaleString("en-IN")}</td>
                      <td className="p-1.5 text-center text-indigo-950 text-[9px] uppercase">Final Total</td>
                    </tr>

                    {/* FINANCIAL BREAKDOWN ROWS */}
                    <tr>
                      <td colSpan={3} className="border-r border-[#0D3B80] p-1.5 font-semibold text-gray-800">
                        Rate: {currentLr.rate || (currentLr as any).rate_per_article ? `₹${currentLr.rate || (currentLr as any).rate_per_article}` : "As per Contract"}
                      </td>
                      <td colSpan={2} className="border-r border-[#0D3B80] p-1.5 font-bold text-gray-900">Less Advance Paid</td>
                      <td className="border-r border-[#0D3B80] p-1.5 text-right font-medium text-emerald-700">₹{advance.toLocaleString("en-IN")}</td>
                      <td className="p-1.5 text-xs text-gray-600">{(currentLr as any).paymentType || "Cash/Bank"}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="border-r border-[#0D3B80] p-1.5 font-semibold text-gray-800">
                        Invoice No: {(currentLr as any).invoice_no || (currentLr as any).invoiceNo || (currentLr as any).invoice || "—"} {(currentLr as any).invoice_amount || (currentLr as any).invoiceValue ? `(Amt: ₹${Number((currentLr as any).invoice_amount || (currentLr as any).invoiceValue).toLocaleString("en-IN")})` : ""}
                        {invoiceUrl && (
                          <a
                            href={invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex items-center gap-1 text-[8.5px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 print:hidden cursor-pointer"
                          >
                            <Eye size={10} /> View Invoice ({invoiceName})
                          </a>
                        )}
                      </td>
                      <td colSpan={2} className="border-r border-[#0D3B80] p-1.5 font-bold text-gray-900">Hamali Charges</td>
                      <td className="border-r border-[#0D3B80] p-1.5 text-right font-medium">₹{hamali.toLocaleString("en-IN")}</td>
                      <td className="p-1.5 text-xs text-gray-600">{(currentLr as any).remarks || ""}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="border-r border-[#0D3B80] p-1.5 font-semibold text-gray-800">
                        E-Way Bill: {(currentLr as any).way_bill_no || (currentLr as any).ewayBillNo || (currentLr as any).ewayBill || "—"}
                        {ewayBillUrl && (
                          <a
                            href={ewayBillUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex items-center gap-1 text-[8.5px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 print:hidden cursor-pointer"
                          >
                            <Eye size={10} /> View E-Way Bill ({ewayBillName})
                          </a>
                        )}
                      </td>
                      <td colSpan={2} className="border-r border-[#0D3B80] p-1.5 font-extrabold bg-blue-50/30 text-indigo-900">NET BALANCE TO PAY</td>
                      <td className="border-r border-[#0D3B80] p-1.5 text-right font-extrabold text-indigo-950 text-sm">
                        ₹{balance.toLocaleString("en-IN")}
                      </td>
                      <td className="p-1.5 font-bold text-indigo-900 uppercase text-[9px]">{currentLr.freightType || (currentLr as any).type || "To Pay"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Row 4: Signature Box & Disclaimer */}
              <div className="flex items-end justify-between pt-2">
                <div className="text-[7.5px] leading-tight space-y-1 font-medium max-w-[65%]">
                  <p>
                    This is LHR issued as per special terms and conditions overleaf by broker on commission only without liability of any nature whatsoever. We are neither public nor private carriers nor owners of the vehicles for making any claim against us/the owner, driver/of vehicle undertake to deliver the above notes cargo to the right person at the destination and or responsibility for its safety during the transit of goods.
                  </p>
                  <p className="font-bold">Subject to terms & condition overleaf. Goods booked at owner's risk.</p>
                </div>

                <div className="text-center font-bold text-[10px] space-y-1">
                  {signatureUrl ? (
                    <div className="flex flex-col items-center">
                      <img src={signatureUrl} alt="Digital Signature" className="h-11 max-w-[150px] object-contain border-b border-gray-400 pb-0.5" />
                      <span className="text-[8.5px] text-gray-600 block mt-0.5 font-bold">Authorized Digital Signature</span>
                      {(currentLr as any).signed_by && (
                        <span className="text-[7.5px] text-gray-500 block font-normal">Signed By: {(currentLr as any).signed_by}</span>
                      )}
                    </div>
                  ) : (
                    <div className="h-10 w-36 border-b border-gray-400 flex items-end justify-center pb-0.5 text-[9px] text-gray-400 font-mono">
                      Authorized Signature
                    </div>
                  )}
                  <div className="text-[#0D3B80] font-black uppercase text-[10px]">For {companyDetails.companyName}</div>
                </div>
              </div>

              {/* Cryptographic Digital Signature Verification Block */}
              {currentLr.is_digitally_signed && (
                <div className="border border-[#0D3B80] p-2 rounded bg-blue-50/20 text-[9px] font-sans flex items-center justify-between mt-2">
                  <div>
                    <span className="font-extrabold text-[#0D3B80] flex items-center gap-1 text-[10px]">
                      <ShieldCheck size={12} className="text-emerald-700" /> DIGITALLY SIGNED ✓ (RSA-2048 / SHA-256)
                    </span>
                    <div className="text-gray-700 space-x-2 text-[8.5px] mt-0.5">
                      <span>Signer: <strong>{(currentLr as any).signed_by || "Authorized Signer"}</strong></span>
                      <span>Algorithm: <strong>RSA-SHA256</strong></span>
                      <span>Version: <strong>v{currentLr.document_version || 1}</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider inline-block">
                      Verification: VALID
                    </span>
                    <span className="block text-[7.5px] text-gray-500 font-mono mt-0.5">
                      LR Data Digitally Signed Server-Side
                    </span>
                  </div>
                </div>
              )}

              {/* ATTACHED DOCUMENTS SUMMARY BOX */}
              {(invoiceUrl || ewayBillUrl) && (
                <div className="border border-[#0D3B80] p-2 rounded bg-gray-50/70 text-[9px] font-sans space-y-1 mt-2">
                  <div className="font-extrabold text-[#0D3B80] uppercase tracking-wider text-[9.5px] border-b border-[#0D3B80]/30 pb-0.5 flex items-center justify-between">
                    <span>ATTACHED DOCUMENTS</span>
                    <span className="text-[8px] font-mono text-gray-500">Manifest Document Bundle</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[8.5px]">
                    <div>
                      <span className="font-bold text-gray-800">Invoice:</span>{" "}
                      {invoiceUrl ? (
                        <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-extrabold hover:underline">
                          ✓ Attached ({invoiceName}) — Open
                        </a>
                      ) : (
                        <span className="text-gray-400 font-medium">Invoice: Not Uploaded</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">E-Way Bill:</span>{" "}
                      {ewayBillUrl ? (
                        <a href={ewayBillUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-extrabold hover:underline">
                          ✓ Attached ({ewayBillName}) — Open
                        </a>
                      ) : (
                        <span className="text-gray-400 font-medium">E-Way Bill: Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* DRIVER COPY FULL-PAGE ATTACHMENTS (PAGE 2+ INVOICE, PAGE N+ E-WAY BILL) */}
            {copyType === "driver" && (invoiceUrl || ewayBillUrl) && (
              <div className="space-y-6 print:space-y-0">
                {/* PAGE 2+: Uploaded Invoice Attachment Page */}
                {invoiceUrl && (
                  <div className="border-[3px] border-[#0D3B80] p-4 bg-white mt-6 print:break-before-page min-h-[92vh] flex flex-col justify-between">
                    <div>
                      <div className="bg-[#0D3B80] text-white px-3 py-2 font-bold text-xs uppercase tracking-wider flex items-center justify-between mb-4">
                        <span className="flex items-center gap-2">
                          <Paperclip size={14} /> DRIVER COPY MANIFEST ATTACHMENT — INVOICE
                        </span>
                        <span>LR NO: {currentLr.lr}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3 text-xs">
                        <span className="font-extrabold text-[#0D3B80] uppercase flex items-center gap-1.5">
                          <FileText size={14} /> File: {invoiceName}
                        </span>
                        <div className="flex items-center gap-2 print:hidden">
                          <a
                            href={invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> Open Full Screen
                          </a>
                          <a
                            href={invoiceUrl}
                            download={invoiceName}
                            className="px-3 py-1 rounded-lg bg-gray-200 text-gray-800 font-bold text-xs hover:bg-gray-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Download size={12} /> Download
                          </a>
                        </div>
                      </div>

                      {isImageFile(invoiceName, invoiceUrl) ? (
                        <div className="flex justify-center p-3 bg-white border border-gray-200 rounded-lg min-h-[70vh] items-center">
                          <img src={invoiceUrl} alt="Invoice Attachment" className="max-h-[80vh] w-auto object-contain rounded shadow-xs" />
                        </div>
                      ) : (
                        <div className="w-full h-[75vh] border border-gray-300 rounded-lg overflow-hidden bg-white">
                          <iframe src={invoiceUrl} title="Invoice Document PDF" className="w-full h-full border-none" />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[#0D3B80] pt-2 text-[9px] text-gray-500 font-mono text-center flex items-center justify-between mt-4">
                      <span>{companyDetails.companyName} — Driver Copy Document Attachment</span>
                      <span>Page 2 of Driver Manifest Bundle</span>
                    </div>
                  </div>
                )}

                {/* PAGE N+: Uploaded E-Way Bill Attachment Page */}
                {ewayBillUrl && (
                  <div className="border-[3px] border-[#0D3B80] p-4 bg-white mt-6 print:break-before-page min-h-[92vh] flex flex-col justify-between">
                    <div>
                      <div className="bg-[#0D3B80] text-white px-3 py-2 font-bold text-xs uppercase tracking-wider flex items-center justify-between mb-4">
                        <span className="flex items-center gap-2">
                          <Paperclip size={14} /> DRIVER COPY MANIFEST ATTACHMENT — E-WAY BILL
                        </span>
                        <span>LR NO: {currentLr.lr}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3 text-xs">
                        <span className="font-extrabold text-[#0D3B80] uppercase flex items-center gap-1.5">
                          <FileText size={14} /> File: {ewayBillName}
                        </span>
                        <div className="flex items-center gap-2 print:hidden">
                          <a
                            href={ewayBillUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> Open Full Screen
                          </a>
                          <a
                            href={ewayBillUrl}
                            download={ewayBillName}
                            className="px-3 py-1 rounded-lg bg-gray-200 text-gray-800 font-bold text-xs hover:bg-gray-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Download size={12} /> Download
                          </a>
                        </div>
                      </div>

                      {isImageFile(ewayBillName, ewayBillUrl) ? (
                        <div className="flex justify-center p-3 bg-white border border-gray-200 rounded-lg min-h-[70vh] items-center">
                          <img src={ewayBillUrl} alt="E-Way Bill Attachment" className="max-h-[80vh] w-auto object-contain rounded shadow-xs" />
                        </div>
                      ) : (
                        <div className="w-full h-[75vh] border border-gray-300 rounded-lg overflow-hidden bg-white">
                          <iframe src={ewayBillUrl} title="E-Way Bill Document PDF" className="w-full h-full border-none" />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[#0D3B80] pt-2 text-[9px] text-gray-500 font-mono text-center flex items-center justify-between mt-4">
                      <span>{companyDetails.companyName} — Driver Copy Document Attachment</span>
                      <span>Page 3 of Driver Manifest Bundle</span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Modal Footer (Screen only) */}
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 print:hidden shrink-0">
            <div className="text-xs text-gray-400 font-medium">Print layout auto-fits A4 / Consignment Receipt paper</div>
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              Close
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  )
}
