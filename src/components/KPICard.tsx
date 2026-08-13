import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Truck, Gauge, Clock } from "lucide-react"

const iconMap: Record<string, React.ElementType> = {
  TrendingUp, Truck, Gauge, Clock
}

interface KPICardProps {
  label: string
  value: string
  change: string
  positive: boolean
  sub: string
  icon: string
  gradient: string
  bg: string
  index: number
}

export default function KPICard({ label, value, change, positive, sub, icon, gradient, bg, index }: KPICardProps) {
  const Icon = iconMap[icon] || TrendingUp
  const ChangeIcon = positive ? TrendingUp : TrendingDown

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="bg-white rounded-[20px] p-6 cursor-pointer group transition-shadow duration-300 card-shadow hover:card-shadow-hover"
    >
      <div className="flex items-start justify-between mb-5">
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
          style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
        >
          <Icon size={22} className="text-white" />
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
            positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
          }`}
        >
          <ChangeIcon size={11} />
          {change}
        </span>
      </div>

      <div className="space-y-1">
        <div className="text-[26px] font-bold text-gray-900 tracking-tight leading-none">{value}</div>
        <div className="text-sm font-medium text-gray-500">{label}</div>
        <div className="text-xs text-gray-400 pt-0.5">{sub}</div>
      </div>

      {/* Subtle bottom bar */}
      <div className={`mt-5 h-1 rounded-full bg-gradient-to-r ${gradient} opacity-20 group-hover:opacity-40 transition-opacity duration-300`} />
    </motion.div>
  )
}
