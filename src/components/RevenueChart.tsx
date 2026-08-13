import { motion } from "framer-motion"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { revenueData } from "../data/mockData"
import { TrendingUp } from "lucide-react"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl p-3 shadow-xl border border-gray-100/80 text-sm">
        <div className="text-gray-500 mb-1 font-medium">{label} 2026</div>
        <div className="text-gray-900 font-bold">₹{(payload[0].value / 100000).toFixed(1)}L</div>
        <div className="text-indigo-500 text-xs">{payload[1]?.value} trips</div>
      </div>
    )
  }
  return null
}

export default function RevenueChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3 }}
      className="bg-white rounded-[20px] p-6 card-shadow"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-900">Revenue Overview</h3>
          <p className="text-sm text-gray-400 mt-0.5">Monthly performance · 2026</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
          <TrendingUp size={14} />
          +14.2% MoM
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(79,70,229,0.12)", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#4F46E5"
              strokeWidth={2.5}
              fill="url(#colorRevenue)"
              dot={{ fill: "#4F46E5", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#4F46E5", strokeWidth: 2, stroke: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="trips"
              stroke="#2563EB"
              strokeWidth={0}
              fill="transparent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-5 mt-4 pt-4 border-t border-gray-50">
        {revenueData.slice(-3).map((d: any) => (
          <div key={d.month} className="flex-1 text-center">
            <div className="text-xs text-gray-400">{d.month}</div>
            <div className="text-sm font-bold text-gray-800">₹{(d.revenue / 100000).toFixed(1)}L</div>
            <div className="text-xs text-indigo-400">{d.lrs || d.trips || 0} LRs</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
