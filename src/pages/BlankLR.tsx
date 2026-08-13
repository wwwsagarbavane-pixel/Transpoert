import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Printer, FileText } from "lucide-react"
import { companyContext } from "../services/companyContext"
import { dbQuery } from "../db/db"
import { companyRepository } from "../repositories/repositories"
import { DBCompanySetup } from "../db/schema"

export default function BlankLR() {
  const [companyDetails, setCompanyDetails] = useState<{
    companyName: string
    address: string
    pan: string
    gstin: string
    phone: string
  }>({
    companyName: "Ganesh Transport",
    address: "HQ Suite 4, Logistics Park, Pune - 411001 (MH)",
    pan: "AABCG5678B",
    gstin: "27AABCG5678B1Z9",
    phone: "022-98765432"
  })

  useEffect(() => {
    const loadCompanyInfo = async () => {
      const activeCompanyId = companyContext.getActiveCompanyId()
      const comp = await companyRepository.findById(activeCompanyId)

      if (comp && comp.name) {
        setCompanyDetails({
          companyName: comp.name,
          address: `${(comp as any).address || ""}, ${comp.city || ""} - ${(comp as any).pincode || ""} (${(comp as any).state || ""})`.trim().replace(/^,\s*/, ""),
          pan: (comp as any).pan || "AABCG5678B",
          gstin: (comp as any).gstin || "27AABCG5678B1Z9",
          phone: (comp as any).phone || "022-98765432"
        })
      }
    }
    loadCompanyInfo()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] print:bg-white print:p-0 font-sans">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6 space-y-6 print:m-0 print:p-0 print:max-w-none">

        {/* Screen Header Bar with Print Action - Hidden when printing */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900">Blank Lorry Receipt Template</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                Official Printable Format
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Standardized blank Lorry Receipt format for tenant manual filling and physical printing</p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="h-11 px-6 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Printer size={16} />
            Print Blank LR
          </button>
        </div>

        {/* DYNAMIC COMPANY BLANK LR TEMPLATE CONTAINER */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm print:p-0 print:border-none print:shadow-none print:w-full">
          
          {/* Exact Outer Blue Box Template */}
          <div className="border-[3px] border-[#0D3B80] bg-white p-4 text-[#0D3B80] text-xs space-y-3 font-sans select-none shadow-sm print:shadow-none print:border-[3px] print:border-[#0D3B80]">
            
            {/* Row 1: Top Header Grid */}
            <div className="grid grid-cols-12 gap-3 border-b-2 border-[#0D3B80] pb-3">
              {/* Top Left Box: CONSIGNEE COPY + Legal Disclaimer */}
              <div className="col-span-5 flex flex-col justify-between pr-2 border-r-2 border-[#0D3B80]">
                <div>
                  <div className="inline-block bg-[#0D3B80] text-white font-black text-xs px-2.5 py-1 tracking-wider uppercase mb-1.5 rounded-xs">
                    CONSIGNEE COPY
                  </div>
                  <p className="text-[8px] leading-tight font-semibold text-[#0D3B80]">
                    We have not availed cenvat credit on any inputs or capital Goods for entering the Service of Goods Transports Agency
                  </p>
                </div>

                <table className="w-full text-[10px] border-collapse border border-[#0D3B80] mt-3 font-bold">
                  <tbody>
                    <tr>
                      <td className="border border-[#0D3B80] p-1.5 w-1/2">LHR No.</td>
                      <td className="border border-[#0D3B80] p-1.5 w-1/2">Lorry No.</td>
                    </tr>
                    <tr>
                      <td className="border border-[#0D3B80] p-1.5">Date</td>
                      <td className="border border-[#0D3B80] p-1.5"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Top Right Box: RAM II + Logo + Address + Phones */}
              <div className="col-span-7 flex flex-col justify-between pl-2">
                <div className="flex justify-between items-center text-[11px] font-extrabold">
                  <span className="text-center flex-1">II RAM II</span>
                  <div className="text-right text-[10px] leading-tight font-extrabold">
                    <div>Cell : {companyDetails.phone}</div>
                  </div>
                </div>

                {/* Logo Box - Dynamic Company Name */}
                <div className="border-2 border-[#0D3B80] px-4 py-2 my-1 text-center bg-blue-50/30 flex items-center justify-center rounded-sm">
                  <span className="text-2xl font-black tracking-tight text-[#0D3B80] uppercase">
                    {companyDetails.companyName}
                  </span>
                </div>

                <div className="text-center space-y-0.5 text-[10px] font-bold">
                  <div>{companyDetails.address}</div>
                  <div>PAN NO : {companyDetails.pan} · GSTIN : {companyDetails.gstin}</div>
                </div>

                <div className="flex justify-between items-end border-t border-[#0D3B80] pt-1 mt-1 font-bold text-[10px]">
                  <div>AT OWNER'S RISK</div>
                  <div className="text-right">
                    <span className="text-[11px] font-black mr-2">Consignment Note No.</span>
                    <span className="border-b border-[#0D3B80] px-6 inline-block"></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Origin / Destination / Consignor / Consignee Table */}
            <div className="border-b-2 border-[#0D3B80] pb-2">
              <table className="w-full text-[11px] border-collapse border border-[#0D3B80] font-bold">
                <tbody>
                  <tr>
                    <td className="border border-[#0D3B80] p-1.5 w-1/2">
                      <span className="text-gray-500 font-medium">From Station:</span> 
                    </td>
                    <td className="border border-[#0D3B80] p-1.5 w-1/2">
                      <span className="text-gray-500 font-medium">To Station:</span> 
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#0D3B80] p-1.5">
                      <span className="text-gray-500 font-medium">Consignor Name:</span> 
                    </td>
                    <td className="border border-[#0D3B80] p-1.5">
                      <span className="text-gray-500 font-medium">Consignee Name:</span> 
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#0D3B80] p-1.5">
                      <span className="text-gray-500 font-medium">Address:</span> 
                    </td>
                    <td className="border border-[#0D3B80] p-1.5">
                      <span className="text-gray-500 font-medium">Address:</span> 
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#0D3B80] p-1.5">
                      <span className="text-gray-500 font-medium">GSTIN:</span> 
                    </td>
                    <td className="border border-[#0D3B80] p-1.5">
                      <span className="text-gray-500 font-medium">GSTIN:</span> 
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Row 3: Goods Description & Freight Details Grid Table */}
            <div className="border-b-2 border-[#0D3B80] pb-2">
              <table className="w-full text-[10px] border-collapse border border-[#0D3B80] text-center font-bold">
                <thead>
                  <tr className="bg-blue-50/40 uppercase">
                    <th className="border border-[#0D3B80] p-1.5 w-[8%]">No. Pkgs</th>
                    <th className="border border-[#0D3B80] p-1.5 w-[38%]">Description of Goods (Said to Contain)</th>
                    <th className="border border-[#0D3B80] p-1.5 w-[14%]">Actual Weight</th>
                    <th className="border border-[#0D3B80] p-1.5 w-[14%]">Charged Weight</th>
                    <th className="border border-[#0D3B80] p-1.5 w-[26%]">Particulars & Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((rowIdx) => (
                    <tr key={rowIdx} className="h-7">
                      <td className="border border-[#0D3B80] p-1"></td>
                      <td className="border border-[#0D3B80] p-1 text-left"></td>
                      <td className="border border-[#0D3B80] p-1"></td>
                      <td className="border border-[#0D3B80] p-1"></td>
                      {rowIdx === 1 && (
                        <td rowSpan={5} className="border border-[#0D3B80] p-2 text-left align-top space-y-1 bg-gray-50/30">
                          <div className="flex justify-between"><span>Freight Charge:</span> <span>₹</span></div>
                          <div className="flex justify-between"><span>Hamali Charges:</span> <span>₹</span></div>
                          <div className="flex justify-between"><span>Statistical Charges:</span> <span>₹</span></div>
                          <div className="flex justify-between"><span>Door Delivery Charges:</span> <span>₹</span></div>
                          <div className="flex justify-between"><span>Other Misc Charges:</span> <span>₹</span></div>
                          <div className="border-t border-[#0D3B80] pt-1 flex justify-between font-black"><span>Total Freight:</span> <span>₹</span></div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Row 4: Freight Type & Signatures Bottom Footer */}
            <div className="grid grid-cols-12 gap-3 items-end pt-1">
              <div className="col-span-8 space-y-1 text-[9px] font-bold">
                <div className="flex items-center gap-4">
                  <span>Freight Terms:</span>
                  <span className="border border-[#0D3B80] px-2 py-0.5">PAID</span>
                  <span className="border border-[#0D3B80] px-2 py-0.5">TO PAY</span>
                  <span className="border border-[#0D3B80] px-2 py-0.5">TO BE BILLED</span>
                </div>
                <div>Goods booked at owner's risk. No responsibility for leakage, breakage or loss in transit.</div>
              </div>

              <div className="col-span-4 text-right space-y-4 text-[10px] font-extrabold">
                <div>For {companyDetails.companyName}</div>
                <div className="pt-4 border-t border-[#0D3B80] inline-block px-4">
                  Authorized Signatory
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
