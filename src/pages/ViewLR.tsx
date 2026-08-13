import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  FileText, ArrowLeft, Printer, Edit2, Share2, Package, Truck, User,
  Building2, MapPin, Wallet, Calendar, ShieldCheck, CheckCircle2,
  Clock, AlertCircle, FileCheck
} from "lucide-react"
import { DBLR, GoodsItem } from "../db/schema"
import { lrController } from "../controllers/lrController"
import { companyContext } from "../services/companyContext"
import LRPrintModal from "../components/LRPrintModal"
import DigitalSignatureModal from "../components/DigitalSignatureModal"

interface ViewLRProps {
  lrRecord: DBLR | null
  onBack: () => void
  onEdit?: (lr: DBLR) => void
}

export default function ViewLR({ lrRecord, onBack, onEdit }: ViewLRProps) {
  const [lr, setLr] = useState<DBLR | null>(lrRecord)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showSigModal, setShowSigModal] = useState(false)

  const activeCompanyId = companyContext.getActiveCompanyId()

  useEffect(() => {
    setLr(lrRecord)
  }, [lrRecord])

  if (!lr) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
        <AlertCircle size={40} className="text-gray-300 mb-2" />
        <h3 className="text-base font-bold text-gray-700">No Lorry Receipt Selected</h3>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
        >
          Back to Register
        </button>
      </div>
    )
  }

  const goodsList: GoodsItem[] = lr.goods_items && lr.goods_items.length > 0
    ? lr.goods_items
    : [
        {
          id: "item-1",
          article: lr.article || "General Goods Cargo",
          no_of_articles: lr.packageCount || (lr as any).noof_articles || 1,
          rate_per_article: lr.rate || (lr as any).rate_per_article || 0,
          weight_in_kgs: lr.weight || (lr as any).weight_in_kgs || 0,
          charged_weight: (lr as any).charged_weight || 0,
          freightAmount: lr.freight || 0,
          lot_no: (lr as any).lot_no || "",
          quality: (lr as any).quality || "",
          pr_no: (lr as any).pr_no || "",
          pm_no: (lr as any).pm_no || "",
          description: (lr as any).description || ""
        }
      ]

  const totalPkgs = goodsList.reduce((sum, g) => sum + (g.no_of_articles || 0), 0)
  const totalWt = goodsList.reduce((sum, g) => sum + (g.weight_in_kgs || 0), 0)
  const totalChargedWt = goodsList.reduce((sum, g) => sum + (g.charged_weight || g.weight_in_kgs || 0), 0)
  const totalFreight = lr.freight || goodsList.reduce((sum, g) => sum + (g.freightAmount || 0), 0)
  const advanceAmt = lr.advance || 0
  const hamaliAmt = lr.hamali || 0
  const balanceAmt = Math.max(0, (totalFreight + hamaliAmt) - advanceAmt)

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/60 font-sans pb-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* TOP ACTION & TITLE BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Back to LR Register"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-gray-900 font-mono tracking-tight">{lr.lr}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                  lr.status === "Delivered" || lr.status === "delivered"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : lr.status === "Cancelled" || lr.status === "cancelled"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                }`}>
                  {lr.status || "In Transit"}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Booked on {lr.date} • {lr.from} to {lr.to}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(lr)}
                className="h-10 px-4 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-250 hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 size={14} />
                <span>Edit LR</span>
              </button>
            )}

            <button
              onClick={() => setShowSigModal(true)}
              className={`h-10 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                lr.is_digitally_signed
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <ShieldCheck size={16} />
              <span>{lr.is_digitally_signed ? "Digitally Signed ✓" : "Digitally Sign LR"}</span>
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="h-10 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              <span>Print LR</span>
            </button>
          </div>
        </div>

        {/* 2-COLUMN MAIN ERP DETAILS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: BOOKING, VEHICLE & PARTIES (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* 1. BOOKING INFORMATION */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <FileText size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Booking Information</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">LR Number</span>
                  <span className="font-mono font-extrabold text-gray-900 text-sm">{lr.lr}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Booking Date</span>
                  <span className="font-medium text-gray-800">{lr.date}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Booking Branch</span>
                  <span className="font-semibold text-indigo-900">{(lr as any).branch_id || "Main HQ Pune"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">From Station</span>
                  <span className="font-bold text-gray-900">{lr.from}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">To Station</span>
                  <span className="font-bold text-gray-900">{lr.to}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Delivery Status</span>
                  <span className="font-semibold text-emerald-700">{lr.status || "In Transit"}</span>
                </div>
              </div>
            </div>

            {/* 2. VEHICLE & DRIVER INFORMATION */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Truck size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Vehicle & Driver Details</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Vehicle Number</span>
                  <span className="font-mono font-extrabold text-gray-900">{lr.vehicle}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Driver Name</span>
                  <span className="font-medium text-gray-800">{(lr as any).driver || lr.driverName || "Assign Pending"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Vehicle Owner</span>
                  <span className="font-medium text-gray-800">{(lr as any).owner || "Market Attached"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Agent / Broker</span>
                  <span className="font-medium text-gray-800">{(lr as any).agent || "Direct Booking"}</span>
                </div>
              </div>
            </div>

            {/* 3. CONSIGNOR & CONSIGNEE DETAILS */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Building2 size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Consignor & Consignee</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Consignor */}
                <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5">
                  <div className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">CONSIGNOR (SHIPPER)</div>
                  <div className="text-sm font-extrabold text-gray-900">{lr.consignor}</div>
                  {(lr.consignorGst || (lr as any).doc_gstin || (lr as any).gst) && (
                    <div className="text-xs text-gray-500 font-mono">GSTIN: {lr.consignorGst || (lr as any).doc_gstin || (lr as any).gst}</div>
                  )}
                  <div className="text-xs text-gray-600 font-medium">Origin: {lr.from}</div>
                </div>

                {/* Consignee */}
                <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5">
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">CONSIGNEE (RECEIVER)</div>
                  <div className="text-sm font-extrabold text-gray-900">{lr.consignee}</div>
                  {lr.consigneeGst && (
                    <div className="text-xs text-gray-500 font-mono">GSTIN: {lr.consigneeGst}</div>
                  )}
                  <div className="text-xs text-gray-600 font-medium">Destination: {lr.to}</div>
                </div>
              </div>

              {((lr as any).bill_to || lr.bill_to) && (
                <div className="pt-2 text-xs font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-gray-400 font-bold uppercase">Billed To Party:</span>
                  <span className="text-indigo-900 font-extrabold font-mono bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                    {(lr as any).bill_to || lr.bill_to}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: INVOICES & FINANCIAL SUMMARY (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">

            {/* 4. CARGO INVOICE & DOCUMENT DETAILS */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <FileCheck size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Invoice & Documents</h2>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <span className="text-gray-400 font-semibold">Invoice Number</span>
                  <span className="font-mono font-bold text-gray-900">{(lr as any).invoice_no || (lr as any).invoiceNo || (lr as any).invoice || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <span className="text-gray-400 font-semibold">Invoice Value</span>
                  <span className="font-mono font-bold text-gray-900">
                    {(lr as any).invoice_amount || (lr as any).invoiceValue ? `₹${Number((lr as any).invoice_amount || (lr as any).invoiceValue).toLocaleString("en-IN")}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <span className="text-gray-400 font-semibold">E-Way Bill Number</span>
                  <span className="font-mono font-bold text-gray-900">{(lr as any).way_bill_no || (lr as any).ewayBillNo || (lr as any).ewayBill || "—"}</span>
                </div>

                {/* Uploaded Invoice File */}
                {((lr as any).invoice_doc_url || (lr as any).invoiceDoc?.url) && (
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-400 font-semibold">Invoice Document</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-indigo-600 font-bold truncate max-w-[120px]">
                        {(lr as any).invoice_doc_name || "Invoice.pdf"}
                      </span>
                      <a
                        href={(lr as any).invoice_doc_url || (lr as any).invoiceDoc?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] hover:bg-indigo-100"
                      >
                        View
                      </a>
                      <a
                        href={(lr as any).invoice_doc_url || (lr as any).invoiceDoc?.url}
                        download={(lr as any).invoice_doc_name || "Invoice.pdf"}
                        className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold text-[10px] hover:bg-gray-200"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                )}

                {/* Uploaded E-Way Bill File */}
                {((lr as any).ewaybill_doc_url || (lr as any).ewayBillDoc?.url) && (
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-400 font-semibold">E-Way Bill Document</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-indigo-600 font-bold truncate max-w-[120px]">
                        {(lr as any).ewaybill_doc_name || "EWayBill.pdf"}
                      </span>
                      <a
                        href={(lr as any).ewaybill_doc_url || (lr as any).ewayBillDoc?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] hover:bg-indigo-100"
                      >
                        View
                      </a>
                      <a
                        href={(lr as any).ewaybill_doc_url || (lr as any).ewayBillDoc?.url}
                        download={(lr as any).ewaybill_doc_name || "EWayBill.pdf"}
                        className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold text-[10px] hover:bg-gray-200"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. FREIGHT & FINANCIAL BREAKDOWN */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Wallet size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Freight Settlement</h2>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-medium">Freight Type</span>
                  <span className="font-extrabold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    {lr.freightType || (lr as any).type || "To Pay"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-medium">Total Freight Amount</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">₹{totalFreight.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center py-1 text-gray-600">
                  <span className="font-medium">Less Advance Paid</span>
                  <span className="font-mono text-emerald-700 font-semibold">- ₹{advanceAmt.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center py-1 text-gray-600">
                  <span className="font-medium">Plus Hamali / Loading</span>
                  <span className="font-mono font-semibold">+ ₹{hamaliAmt.toLocaleString("en-IN")}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-extrabold text-gray-900 text-sm">Net Balance Payable</span>
                  <span className="font-mono font-black text-indigo-600 text-base">₹{balanceAmt.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 6. GOODS INFORMATION (FULL UNCOLLAPSED MULTI-COLUMN ERP TABLE) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Goods Cargo Details ({goodsList.length} Items)</h2>
            </div>
            <div className="text-xs font-mono font-semibold text-gray-500">
              Total Pkgs: <span className="font-bold text-gray-900">{totalPkgs.toLocaleString("en-IN")}</span> | Wt: <span className="font-bold text-gray-900">{totalWt.toLocaleString("en-IN")} KG</span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar border border-gray-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-gray-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Article</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Weight (KG)</th>
                  <th className="py-2.5 px-3 text-right">Charged (KG)</th>
                  <th className="py-2.5 px-3 text-right">Freight (₹)</th>
                  <th className="py-2.5 px-3">Lot No</th>
                  <th className="py-2.5 px-3">Quality</th>
                  <th className="py-2.5 px-3">PR / PM</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-gray-800">
                {goodsList.map((g, idx) => (
                  <tr key={g.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-gray-400">#{idx + 1}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-gray-900">{g.article}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">{g.no_of_articles || 1}</td>
                    <td className="py-2.5 px-3 text-right">{g.rate_per_article ? `₹${g.rate_per_article.toLocaleString("en-IN")}` : "—"}</td>
                    <td className="py-2.5 px-3 text-right">{g.weight_in_kgs ? `${g.weight_in_kgs.toLocaleString("en-IN")} KG` : "—"}</td>
                    <td className="py-2.5 px-3 text-right">{g.charged_weight ? `${g.charged_weight.toLocaleString("en-IN")} KG` : "—"}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-indigo-900">
                      ₹{(g.freightAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-gray-600">{g.lot_no || "—"}</td>
                    <td className="py-2.5 px-3 font-sans text-gray-600">{g.quality || "—"}</td>
                    <td className="py-2.5 px-3 font-sans text-gray-600">
                      {g.pr_no || g.pm_no ? `${g.pr_no || ""}/${g.pm_no || ""}`.replace(/^\/|\/$/g, "") : "—"}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-gray-600 max-w-[160px] truncate">{g.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-extrabold text-xs">
                  <td colSpan={2} className="py-3 px-3 uppercase tracking-wider">Total Summary</td>
                  <td className="py-3 px-3 text-right font-mono">{totalPkgs.toLocaleString("en-IN")}</td>
                  <td className="py-3 px-3 text-right font-mono">—</td>
                  <td className="py-3 px-3 text-right font-mono">{totalWt.toLocaleString("en-IN")} KG</td>
                  <td className="py-3 px-3 text-right font-mono">{totalChargedWt.toLocaleString("en-IN")} KG</td>
                  <td className="py-3 px-3 text-right font-mono text-amber-300 text-sm">₹{totalFreight.toLocaleString("en-IN")}</td>
                  <td colSpan={4} className="py-3 px-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>

      {/* Print LR Modal */}
      <LRPrintModal
        isOpen={showPrintModal}
        lr={lr}
        onClose={() => setShowPrintModal(false)}
      />

      {/* Cryptographic Digital Signature Modal */}
      <DigitalSignatureModal
        isOpen={showSigModal}
        lr={lr}
        onClose={() => setShowSigModal(false)}
        onSignatureUpdated={async () => {
          if (lr.id) {
            const fresh = await lrController.fetchLRById(lr.id, activeCompanyId)
            if (fresh) setLr(fresh)
          }
        }}
      />
    </div>
  )
}
