import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  FileText, FileCheck, FileX, Truck, Clock, CreditCard, Users,
  Search, Download, Building2, UserCheck, Shield, Printer, MapPin
} from "lucide-react"
import { lrController } from "../controllers/lrController"
import { billingController } from "../controllers/billingController"
import { partyController } from "../controllers/partyController"
import { vehicleController, driverController, ownerController, agentController } from "../controllers/masterControllers"
import { stationController } from "../controllers/stationController"
import { DBLR, DBBill, DBParty, DBVehicle, DBDriver, DBOwner, DBAgent, DBStation } from "../db/schema"
import { companyContext } from "../services/companyContext"

const reportTypes = [
  { id: "lr", label: "LR Register", desc: "Detailed register of all lorry receipts booked", icon: FileText },
  { id: "outstanding", label: "Outstanding Party Report", desc: "Party-wise billing, paid & outstanding calculated from DB transactions", icon: CreditCard },
  { id: "blank", label: "Blank LR Register", desc: "Summary of manual blank LRs printed & pending", icon: FileCheck },
  { id: "cancelled", label: "Cancelled LR Register", desc: "List of cancelled bookings with reasons", icon: FileX },
  { id: "delivery", label: "Delivery Report", desc: "Status tracking for dispatched shipments", icon: Truck },
  { id: "bills", label: "Bills Register", desc: "Summary of generated client invoices", icon: CreditCard },
  { id: "party", label: "Party Report", desc: "Consignor/Consignee total freight booked", icon: Users },
  { id: "vehicle", label: "Vehicle Report", desc: "Trip count and utilization per vehicle", icon: Truck },
  { id: "driver", label: "Driver Report", desc: "Driver trips, active runs and licenses status", icon: UserCheck },
  { id: "owner", label: "Owner Report", desc: "Trips contracted to third-party owners", icon: Shield },
  { id: "agent", label: "Agent Report", desc: "Agent bookings, commissions and margins", icon: Users },
  { id: "branch", label: "Branch Report", desc: "Branch-wise performance and revenue", icon: Building2 },
]

export default function Reports() {
  const [selectedType, setSelectedType] = useState("lr")
  const [fromDate, setFromDate] = useState("2026-07-01")
  const [toDate, setToDate] = useState("2026-12-31")
  const [searchQuery, setSearchQuery] = useState("")

  // Live Database States
  const [lrs, setLrs] = useState<DBLR[]>([])
  const [bills, setBills] = useState<DBBill[]>([])
  const [parties, setParties] = useState<DBParty[]>([])
  const [vehicles, setVehicles] = useState<DBVehicle[]>([])
  const [drivers, setDrivers] = useState<DBDriver[]>([])
  const [owners, setOwners] = useState<DBOwner[]>([])
  const [agents, setAgents] = useState<DBAgent[]>([])
  const [stations, setStations] = useState<DBStation[]>([])

  const activeCompanyId = companyContext.getActiveCompanyId()

  const loadAllReportData = async () => {
    try {
      const [lrList, billList, pList, vList, dList, oList, aList, sList] = await Promise.all([
        lrController.fetchLRs({}, activeCompanyId),
        billingController.fetchBills(undefined, activeCompanyId),
        partyController.getParties(false, activeCompanyId),
        vehicleController.getVehicles(false, activeCompanyId),
        driverController.getDrivers(false, activeCompanyId),
        ownerController.getOwners(false, activeCompanyId),
        agentController.getAgents(false, activeCompanyId),
        stationController.getStations(false, activeCompanyId)
      ])
      setLrs(lrList)
      setBills(billList)
      setParties(pList)
      setVehicles(vList)
      setDrivers(dList)
      setOwners(oList)
      setAgents(aList)
      setStations(sList)
    } catch (err) {
      console.error("Error loading report data:", err)
    }
  }

  useEffect(() => {
    loadAllReportData()
  }, [activeCompanyId])

  const activeReport = reportTypes.find(r => r.id === selectedType) || reportTypes[0]

  // Filter Functions
  const filteredLrs = lrs.filter(r => {
    const matchSearch = !searchQuery || r.lr.toLowerCase().includes(searchQuery.toLowerCase()) || r.consignor.toLowerCase().includes(searchQuery.toLowerCase()) || (r.from || "").toLowerCase().includes(searchQuery.toLowerCase()) || (r.to || "").toLowerCase().includes(searchQuery.toLowerCase())
    if (selectedType === "cancelled") return matchSearch && (r.status === "Cancelled" || r.status === "cancelled")
    if (selectedType === "delivery") return matchSearch && (r.status === "Delivered" || r.status === "delivered")
    if (selectedType === "blank") return matchSearch && (r.status === "Draft" || r.status === "draft" || r.status === "pending")
    return matchSearch
  })

  const filteredBills = bills.filter(b => 
    !searchQuery || b.billNo.toLowerCase().includes(searchQuery.toLowerCase()) || b.party.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredParties = parties.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredVehicles = vehicles.filter(v =>
    !searchQuery || v.number.toLowerCase().includes(searchQuery.toLowerCase()) || (v.driver && v.driver.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredDrivers = drivers.filter(d =>
    !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.mobile.includes(searchQuery)
  )

  const filteredOwners = owners.filter(o =>
    !searchQuery || o.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAgents = agents.filter(a =>
    !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || (a.city && a.city.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredStations = stations.filter(s =>
    !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Dynamic Summary Computations
  const totalFreight = filteredLrs.reduce((sum, r) => sum + (r.freight || 0), 0)
  const totalBillAmt = filteredBills.reduce((sum, b) => sum + (b.totalAmount ?? b.amount ?? 0), 0)
  const totalOutstanding = filteredBills.reduce((sum, b) => sum + (b.outstanding || 0), 0)

  // Real CSV Export Engine
  const handleExportCSV = () => {
    let csvContent = ""
    let filename = `${activeReport.label.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`

    if (selectedType === "lr" || selectedType === "blank" || selectedType === "cancelled" || selectedType === "delivery") {
      csvContent = "LR Number,Date,Consignor,Consignee,From,To,Vehicle,Freight,Status\n" +
        filteredLrs.map(r => `"${r.lr}","${r.date}","${r.consignor}","${r.consignee}","${r.from || ''}","${r.to || ''}","${r.vehicle || ''}",${r.freight || 0},"${r.status}"`).join("\n")
    } else if (selectedType === "bills") {
      csvContent = "Bill No,Date,Party,Amount,Paid,Outstanding,Status\n" +
        filteredBills.map(b => `"${b.billNo}","${b.billDate}","${b.party}",${b.totalAmount ?? b.amount ?? 0},${b.paidAmount ?? b.paid ?? 0},${b.outstanding || 0},"${b.status}"`).join("\n")
    } else if (selectedType === "party") {
      csvContent = "Party Name,Type,GSTIN,Phone,City,Status\n" +
        filteredParties.map(p => `"${p.name}","${p.type}","${p.gst || ''}","${p.phone || ''}","${p.city || ''}","${p.status}"`).join("\n")
    } else if (selectedType === "vehicle") {
      csvContent = "Vehicle Number,Type,Capacity,Driver,Owner,Status\n" +
        filteredVehicles.map(v => `"${v.number}","${v.type}","${v.capacity}","${v.driver || ''}","${v.owner || ''}","${v.status}"`).join("\n")
    } else if (selectedType === "driver") {
      csvContent = "Driver Name,Mobile,License,Vehicle,Status\n" +
        filteredDrivers.map(d => `"${d.name}","${d.mobile}","${d.license || ''}","${d.vehicle || ''}","${d.status}"`).join("\n")
    } else if (selectedType === "owner") {
      csvContent = "Owner Name,Mobile,GSTIN,Status\n" +
        filteredOwners.map(o => `"${o.name}","${o.mobile || ''}","${o.gst || ''}","${o.status}"`).join("\n")
    } else if (selectedType === "agent") {
      csvContent = "Agent Name,City,Mobile,Commission,Status\n" +
        filteredAgents.map(a => `"${a.name}","${a.city || ''}","${a.mobile || ''}","${a.commission || ''}","${a.status}"`).join("\n")
    } else if (selectedType === "branch") {
      csvContent = "Station / Branch,City,State,Type,Status\n" +
        filteredStations.map(s => `"${s.name}","${s.city}","${s.state || ''}","${s.type}","${s.status}"`).join("\n")
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left Column: REPORT TYPES Sidebar */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">REPORT TYPES</h2>
              <p className="text-xs text-gray-400">Select a register spreadsheet to view</p>
            </div>

            <div className="space-y-1 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
              {reportTypes.map(rt => {
                const isSel = rt.id === selectedType
                return (
                  <button
                    key={rt.id}
                    onClick={() => setSelectedType(rt.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                      isSel ? "bg-indigo-50/80 text-indigo-700 font-bold border border-indigo-100" : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <rt.icon size={16} className={`shrink-0 mt-0.5 ${isSel ? "text-indigo-600" : "text-gray-400"}`} />
                    <div>
                      <div className="text-xs font-bold leading-none">{rt.label}</div>
                      <div className="text-[10px] text-gray-400 font-normal mt-1 leading-tight">{rt.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Main Column */}
          <div className="lg:col-span-3 space-y-5">

            {/* Header & Export Controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{activeReport.label}</h1>
                <p className="text-xs text-gray-400 font-normal mt-0.5">{activeReport.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm cursor-pointer"
                >
                  <Printer size={14} /> Print
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  <Download size={14} /> Download CSV / Excel
                </button>
              </div>
            </div>

            {/* Filter Bar Card */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap flex-1">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">FROM DATE</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 font-normal focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">TO DATE</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 font-normal focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="flex-1 min-w-[200px] self-end">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search across columns..."
                      className="h-9 w-full pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 font-normal focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">TOTAL RECORD COUNT</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {selectedType === "bills" ? filteredBills.length :
                   selectedType === "party" ? filteredParties.length :
                   selectedType === "vehicle" ? filteredVehicles.length :
                   selectedType === "driver" ? filteredDrivers.length :
                   selectedType === "owner" ? filteredOwners.length :
                   selectedType === "agent" ? filteredAgents.length :
                   selectedType === "branch" ? filteredStations.length :
                   filteredLrs.length} Records
                </div>
                <div className="text-xs text-gray-400 font-normal mt-1">Live Database Count</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">BOOKED FREIGHT VALUE</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">₹{totalFreight.toLocaleString()}</div>
                <div className="text-xs text-gray-400 font-normal mt-1">Active company total</div>
              </div>
            </div>

            {/* Dynamic Report Data Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  
                  {/* Headers & Columns for LRs */}
                  {(selectedType === "lr" || selectedType === "blank" || selectedType === "cancelled" || selectedType === "delivery") && (
                    <>
                      <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-5 align-middle">LR NO</th>
                          <th className="py-3 px-5 align-middle">DATE</th>
                          <th className="py-3 px-5 align-middle">ROUTE</th>
                          <th className="py-3 px-5 align-middle">CONSIGNOR</th>
                          <th className="py-3 px-5 align-middle">CONSIGNEE</th>
                          <th className="py-3 px-5 align-middle">FREIGHT</th>
                          <th className="py-3 px-5 align-middle">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                        {filteredLrs.map(r => (
                          <tr key={r.lr} className="hover:bg-gray-50/50 transition-colors h-14">
                            <td className="py-3 px-5 align-middle font-mono font-semibold text-indigo-600">{r.lr}</td>
                            <td className="py-3 px-5 align-middle text-xs text-gray-500">{r.date}</td>
                            <td className="py-3 px-5 align-middle font-semibold text-gray-900">{r.from} → {r.to}</td>
                            <td className="py-3 px-5 align-middle font-medium text-gray-800">{r.consignor}</td>
                            <td className="py-3 px-5 align-middle text-gray-600">{r.consignee}</td>
                            <td className="py-3 px-5 align-middle font-extrabold text-gray-900">₹{(r.freight || 0).toLocaleString()}</td>
                            <td className="py-3 px-5 align-middle">
                              <span className="h-5 px-2 text-[10px] font-medium leading-none rounded-full inline-flex items-center gap-1 border bg-gray-100 text-gray-600">
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {/* Headers & Columns for Outstanding Party Report */}
                  {selectedType === "outstanding" && (
                    <>
                      <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-5 align-middle">PARTY NAME</th>
                          <th className="py-3 px-5 align-middle">PARTY TYPE</th>
                          <th className="py-3 px-5 align-middle">TOTAL BILLED</th>
                          <th className="py-3 px-5 align-middle">TOTAL PAID</th>
                          <th className="py-3 px-5 align-middle">OUTSTANDING AMOUNT</th>
                          <th className="py-3 px-5 align-middle">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                        {parties.map(p => {
                          const partyBills = bills.filter(b => b.party === p.name || b.partyId === p.id)
                          const partyLrs = lrs.filter(r => r.consignor === p.name || r.consignee === p.name)
                          const totalBilled = partyBills.length > 0
                            ? partyBills.reduce((sum, b) => sum + (b.totalAmount ?? b.amount ?? 0), 0)
                            : partyLrs.reduce((sum, r) => sum + (r.freight || 0), 0)
                          const totalPaid = partyBills.reduce((sum, b) => sum + (b.paidAmount ?? b.paid ?? 0), 0)
                          const outstanding = Math.max(0, totalBilled - totalPaid)
                          if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return null

                          return (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors h-14">
                              <td className="py-3 px-5 align-middle font-bold text-gray-900">{p.name}</td>
                              <td className="py-3 px-5 align-middle text-xs text-gray-500">{p.type}</td>
                              <td className="py-3 px-5 align-middle font-semibold text-gray-900">₹{totalBilled.toLocaleString("en-IN")}</td>
                              <td className="py-3 px-5 align-middle font-semibold text-emerald-700">₹{totalPaid.toLocaleString("en-IN")}</td>
                              <td className="py-3 px-5 align-middle font-black text-red-600">₹{outstanding.toLocaleString("en-IN")}</td>
                              <td className="py-3 px-5 align-middle">
                                <span className={`h-5 px-2 text-[10px] font-extrabold rounded-full inline-flex items-center border uppercase ${
                                  outstanding > 0 ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                }`}>
                                  {outstanding > 0 ? "Outstanding" : "Settled"}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </>
                  )}

                  {/* Headers & Columns for Bills */}
                  {selectedType === "bills" && (
                    <>
                      <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-5 align-middle">BILL NO</th>
                          <th className="py-3 px-5 align-middle">DATE</th>
                          <th className="py-3 px-5 align-middle">PARTY NAME</th>
                          <th className="py-3 px-5 align-middle">BILL AMOUNT</th>
                          <th className="py-3 px-5 align-middle">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                        {filteredBills.map(b => (
                          <tr key={b.billNo} className="hover:bg-gray-50/50 transition-colors h-14">
                            <td className="py-3 px-5 align-middle font-mono font-semibold text-indigo-600">{b.billNo}</td>
                            <td className="py-3 px-5 align-middle text-xs text-gray-500">{b.billDate}</td>
                            <td className="py-3 px-5 align-middle font-semibold text-gray-900">{b.party}</td>
                            <td className="py-3 px-5 align-middle font-extrabold text-gray-900">₹{(b.totalAmount ?? b.amount ?? 0).toLocaleString()}</td>
                            <td className="py-3 px-5 align-middle">
                              <span className="h-5 px-2 text-[10px] font-medium leading-none rounded-full inline-flex items-center border bg-emerald-50 text-emerald-600">
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {/* Headers & Columns for Parties */}
                  {selectedType === "party" && (
                    <>
                      <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-5 align-middle">PARTY NAME</th>
                          <th className="py-3 px-5 align-middle">TYPE</th>
                          <th className="py-3 px-5 align-middle">GSTIN</th>
                          <th className="py-3 px-5 align-middle">PHONE</th>
                          <th className="py-3 px-5 align-middle">CITY</th>
                          <th className="py-3 px-5 align-middle">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                        {filteredParties.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors h-14">
                            <td className="py-3 px-5 align-middle font-semibold text-gray-900">{p.name}</td>
                            <td className="py-3 px-5 align-middle">
                              <span className="h-5 px-2 text-[10px] font-medium rounded-md bg-gray-100 text-gray-600 inline-flex items-center">{p.type}</span>
                            </td>
                            <td className="py-3 px-5 align-middle font-mono text-xs text-gray-600">{p.gst || "—"}</td>
                            <td className="py-3 px-5 align-middle font-mono text-xs text-gray-600">{p.phone || "—"}</td>
                            <td className="py-3 px-5 align-middle text-gray-700">{p.city || "—"}</td>
                            <td className="py-3 px-5 align-middle">
                              <span className="h-5 px-2 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center">{p.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {/* Headers & Columns for Vehicles */}
                  {selectedType === "vehicle" && (
                    <>
                      <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-5 align-middle">VEHICLE NUMBER</th>
                          <th className="py-3 px-5 align-middle">BODY TYPE</th>
                          <th className="py-3 px-5 align-middle">CAPACITY</th>
                          <th className="py-3 px-5 align-middle">ASSIGNED DRIVER</th>
                          <th className="py-3 px-5 align-middle">OWNER</th>
                          <th className="py-3 px-5 align-middle">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                        {filteredVehicles.map(v => (
                          <tr key={v.id} className="hover:bg-gray-50/50 transition-colors h-14">
                            <td className="py-3 px-5 align-middle font-mono font-semibold text-indigo-600">{v.number}</td>
                            <td className="py-3 px-5 align-middle text-gray-800">{v.type}</td>
                            <td className="py-3 px-5 align-middle text-gray-600">{v.capacity}</td>
                            <td className="py-3 px-5 align-middle font-medium text-gray-800">{v.driver || "Unassigned"}</td>
                            <td className="py-3 px-5 align-middle text-gray-600">{v.owner || "In-house Fleet"}</td>
                            <td className="py-3 px-5 align-middle">
                              <span className="h-5 px-2 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center">{v.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {/* Headers & Columns for Drivers */}
                  {selectedType === "driver" && (
                    <>
                      <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-5 align-middle">DRIVER NAME</th>
                          <th className="py-3 px-5 align-middle">MOBILE</th>
                          <th className="py-3 px-5 align-middle">LICENSE NO.</th>
                          <th className="py-3 px-5 align-middle">ASSIGNED VEHICLE</th>
                          <th className="py-3 px-5 align-middle">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                        {filteredDrivers.map(d => (
                          <tr key={d.id} className="hover:bg-gray-50/50 transition-colors h-14">
                            <td className="py-3 px-5 align-middle font-semibold text-gray-900">{d.name}</td>
                            <td className="py-3 px-5 align-middle font-mono text-xs text-gray-600">{d.mobile}</td>
                            <td className="py-3 px-5 align-middle font-mono text-xs text-gray-600">{d.license || "—"}</td>
                            <td className="py-3 px-5 align-middle font-mono font-semibold text-indigo-600">{d.vehicle || "Unassigned"}</td>
                            <td className="py-3 px-5 align-middle">
                              <span className="h-5 px-2 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center">{d.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {/* Headers & Columns for Owners */}
                  {selectedType === "owner" && (
                    <>
                      <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-5 align-middle">OWNER NAME</th>
                          <th className="py-3 px-5 align-middle">MOBILE</th>
                          <th className="py-3 px-5 align-middle">GSTIN</th>
                          <th className="py-3 px-5 align-middle">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                        {filteredOwners.map(o => (
                          <tr key={o.id} className="hover:bg-gray-50/50 transition-colors h-14">
                            <td className="py-3 px-5 align-middle font-semibold text-gray-900">{o.name}</td>
                            <td className="py-3 px-5 align-middle font-mono text-xs text-gray-600">{o.mobile || "—"}</td>
                            <td className="py-3 px-5 align-middle font-mono text-xs text-gray-600">{o.gst || "—"}</td>
                            <td className="py-3 px-5 align-middle">
                              <span className="h-5 px-2 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center">{o.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {/* Headers & Columns for Agents */}
                  {selectedType === "agent" && (
                    <>
                      <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-5 align-middle">AGENT NAME</th>
                          <th className="py-3 px-5 align-middle">CITY</th>
                          <th className="py-3 px-5 align-middle">MOBILE</th>
                          <th className="py-3 px-5 align-middle">COMMISSION</th>
                          <th className="py-3 px-5 align-middle">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                        {filteredAgents.map(a => (
                          <tr key={a.id} className="hover:bg-gray-50/50 transition-colors h-14">
                            <td className="py-3 px-5 align-middle font-semibold text-gray-900">{a.name}</td>
                            <td className="py-3 px-5 align-middle text-gray-800">{a.city || "—"}</td>
                            <td className="py-3 px-5 align-middle font-mono text-xs text-gray-600">{a.mobile || "—"}</td>
                            <td className="py-3 px-5 align-middle font-semibold text-indigo-600">{a.commission || "5%"}</td>
                            <td className="py-3 px-5 align-middle">
                              <span className="h-5 px-2 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center">{a.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {/* Headers & Columns for Stations/Branches */}
                  {selectedType === "branch" && (
                    <>
                      <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-5 align-middle">STATION / BRANCH</th>
                          <th className="py-3 px-5 align-middle">CITY</th>
                          <th className="py-3 px-5 align-middle">STATE</th>
                          <th className="py-3 px-5 align-middle">HUB TYPE</th>
                          <th className="py-3 px-5 align-middle">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                        {filteredStations.map(s => (
                          <tr key={s.id} className="hover:bg-gray-50/50 transition-colors h-14">
                            <td className="py-3 px-5 align-middle font-semibold text-gray-900">{s.name}</td>
                            <td className="py-3 px-5 align-middle text-gray-800">{s.city}</td>
                            <td className="py-3 px-5 align-middle text-gray-600">{s.state || "—"}</td>
                            <td className="py-3 px-5 align-middle">
                              <span className="h-5 px-2 text-[10px] font-medium rounded-md bg-gray-100 text-gray-600 inline-flex items-center">{s.type}</span>
                            </td>
                            <td className="py-3 px-5 align-middle">
                              <span className="h-5 px-2 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center">{s.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                </table>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
