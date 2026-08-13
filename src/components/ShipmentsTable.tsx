import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { shipments } from "../data/mockData"

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  in_transit: { label: "In Transit", bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
  delivered: { label: "Delivered", bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-500", dot: "bg-red-500" },
}

type SortKey = "id" | "origin" | "driver" | "status" | "amount" | "date"
type SortDir = "asc" | "desc"

export default function ShipmentsTable() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("id")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)
  const PER_PAGE = 7

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  const filtered = (shipments || [])
    .filter((s: any) => {
      const q = search.toLowerCase()
      const idStr = s.lr || s.id || ""
      const driverStr = s.driver || s.consignor || ""
      const origStr = s.from || s.origin || ""
      const destStr = s.to || s.destination || ""
      const matchesSearch = !q || idStr.toLowerCase().includes(q) || driverStr.toLowerCase().includes(q) || origStr.toLowerCase().includes(q) || destStr.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "all" || s.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a: any, b: any) => {
      const av = String(a[sortKey] || "")
      const bv = String(b[sortKey] || "")
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
    })

  const pages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown size={13} className="text-gray-300" />
    return sortDir === "asc" ? <ArrowUp size={13} className="text-indigo-500" /> : <ArrowDown size={13} className="text-indigo-500" />
  }

  const thCls = "text-left text-xs font-semibold text-gray-400 uppercase tracking-wider py-3.5 px-4 cursor-pointer select-none hover:text-gray-600 transition-colors"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.45 }}
      className="bg-white rounded-[20px] card-shadow overflow-hidden"
    >
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3 flex-wrap">
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900">Shipments</h3>
          <p className="text-xs text-gray-400">{filtered.length} records</p>
        </div>

        {/* Status tabs */}
        <div className="flex items-center bg-gray-100/80 rounded-lg p-1 gap-0.5">
          {["all", "in_transit", "delivered", "pending", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-150 ${
                statusFilter === s
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search..."
            className="pl-8 pr-3 h-9 w-[180px] bg-gray-100/80 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:bg-white border border-transparent focus:border-indigo-200 transition-all"
          />
        </div>

        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-gray-600 bg-gray-100/80 hover:bg-gray-200/80 transition-colors border border-gray-200/50">
          <Filter size={13} /> Filter
        </motion.button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/60 sticky top-0">
            <tr>
              {([
                ["id", "Shipment ID"],
                ["origin", "Route"],
                ["driver", "Driver"],
                ["status", "Status"],
                ["amount", "Amount"],
                ["date", "Date"],
              ] as [SortKey, string][]).map(([k, label]) => (
                <th key={k} className={thCls} onClick={() => handleSort(k)}>
                  <div className="flex items-center gap-1.5">
                    {label} <SortIcon k={k} />
                  </div>
                </th>
              ))}
              <th className="py-3.5 px-4" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {paged.map((row: any, i: number) => {
                const sc = STATUS_CONFIG[row.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.in_transit
                return (
                  <motion.tr
                    key={row.lr || row.id || i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group border-t border-gray-50 hover:bg-gray-50/60 transition-colors duration-100 cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-sm font-semibold text-indigo-600">{row.id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm font-medium text-gray-800">{row.origin} → {row.destination}</div>
                      <div className="text-xs text-gray-400">{row.vehicle}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm font-medium text-gray-800">{row.driver}</div>
                      <div className="text-xs text-gray-400">{row.weight}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm font-bold text-gray-900">{row.amount}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm text-gray-700">{row.date}</div>
                      <div className="text-xs text-gray-400">ETA: {row.eta}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-100">
                        <MoreHorizontal size={15} className="text-gray-400" />
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {paged.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">No shipments found</div>
        )}
      </div>

      {/* Pagination */}
      <div className="px-6 py-3.5 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={15} />
          </motion.button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                p === page
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages || pages === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={15} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
