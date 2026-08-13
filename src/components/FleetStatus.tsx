import { motion } from "framer-motion"
import { vehicleStatus } from "../data/mockData"

export default function FleetStatus() {
  const total = vehicleStatus.reduce((sum: number, v: any) => sum + (v.count || 1), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.38 }}
      className="bg-white rounded-[20px] p-6 card-shadow"
    >
      <div className="mb-6">
        <h3 className="text-base font-bold text-gray-900">Fleet Status</h3>
        <p className="text-sm text-gray-400 mt-0.5">{total} vehicles total</p>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-6">
        {vehicleStatus.map((v: any) => (
          <motion.div
            key={v.status || v.number}
            initial={{ width: 0 }}
            animate={{ width: `${((v.count || 1) / total) * 100}%` }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            style={{ background: v.color || "#4F46E5" }}
          />
        ))}
      </div>

      <div className="space-y-3">
        {vehicleStatus.map((v: any, i: number) => (
          <motion.div
            key={v.status}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.07 }}
            className="flex items-center gap-3"
          >
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: v.color }} />
            <span className="text-sm text-gray-600 flex-1">{v.status}</span>
            <span className="text-sm font-bold text-gray-900">{v.count}</span>
            <span className="text-xs text-gray-400 w-10 text-right">
              {Math.round((v.count / total) * 100)}%
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
        <div>
          <div className="text-xl font-bold text-gray-900">82.5%</div>
          <div className="text-xs text-gray-400">Fleet utilization</div>
        </div>
        <div className="w-16 h-16 rounded-full flex items-center justify-center relative">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#F3F4F6" strokeWidth="8" />
            <motion.circle
              cx="32" cy="32" r="26"
              fill="none"
              stroke="#4F46E5"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - 0.825) }}
              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            />
          </svg>
          <span className="absolute text-xs font-bold text-indigo-600">82%</span>
        </div>
      </div>
    </motion.div>
  )
}
