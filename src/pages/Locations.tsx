import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Plus, Search } from "lucide-react"

const locationsList = [
  { name: "Mumbai", state: "Maharashtra", type: "Origin", trips: 142 },
  { name: "Delhi", state: "Delhi", type: "Destination", trips: 98 },
  { name: "Chennai", state: "Tamil Nadu", type: "Both", trips: 87 },
  { name: "Bangalore", state: "Karnataka", type: "Both", trips: 76 },
  { name: "Kolkata", state: "West Bengal", type: "Origin", trips: 64 },
  { name: "Hyderabad", state: "Telangana", type: "Destination", trips: 58 },
  { name: "Pune", state: "Maharashtra", type: "Both", trips: 52 },
  { name: "Ahmedabad", state: "Gujarat", type: "Both", trips: 49 },
  { name: "Jaipur", state: "Rajasthan", type: "Origin", trips: 43 },
  { name: "Surat", state: "Gujarat", type: "Origin", trips: 38 },
  { name: "Lucknow", state: "Uttar Pradesh", type: "Destination", trips: 32 },
  { name: "Nagpur", state: "Maharashtra", type: "Both", trips: 28 },
]

export default function Locations() {
  const [search, setSearch] = useState("")
  const filtered = locationsList.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.state.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1000px] mx-auto px-6 py-5 space-y-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Locations</h1>
            <p className="text-xs text-gray-400 mt-0.5">Origin and destination cities</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 h-10 px-5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)", boxShadow: "0 3px 10px rgba(79,70,229,0.3)" }}>
            <Plus size={15} /> Add Location
          </motion.button>
        </motion.div>

        <div className="relative max-w-[240px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search locations..."
            className="pl-8 pr-3 h-9 w-full bg-white rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 border border-gray-200 focus:border-indigo-300 transition-all card-shadow" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((loc, i) => (
            <motion.div key={loc.name}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className="bg-white rounded-[18px] p-4 card-shadow hover:card-shadow-hover transition-shadow duration-300 cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <MapPin size={16} className="text-indigo-500" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  loc.type === "Origin" ? "bg-blue-50 text-blue-600" :
                  loc.type === "Destination" ? "bg-purple-50 text-purple-600" :
                  "bg-indigo-50 text-indigo-600"
                }`}>{loc.type}</span>
              </div>
              <div className="font-bold text-gray-900">{loc.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{loc.state}</div>
              <div className="mt-2 text-xs font-semibold text-indigo-600">{loc.trips} trips</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
