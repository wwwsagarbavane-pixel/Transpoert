import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Plus, Save, Check } from "lucide-react"
import Modal from "./Modal"
import SearchDropdown from "./SearchDropdown"
import { vehicleController, driverController, ownerController, agentController } from "../controllers/masterControllers"
import { partyController } from "../controllers/partyController"
import { stationController } from "../controllers/stationController"
import { articleController } from "../controllers/articleController"

export type QuickAddCategory = 
  | "vehicle" 
  | "driver" 
  | "owner" 
  | "agent" 
  | "party" 
  | "station" 
  | "article"

interface QuickAddDropdownProps {
  label: string
  category: QuickAddCategory
  value: string
  options: string[]
  placeholder: string
  required?: boolean
  hasError?: boolean
  icon?: any
  addLabelOverride?: string
  onChange: (val: string) => void
  onOptionAdded?: (newItem: string) => void
}

export function getAddButtonLabel(category?: string, override?: string, label: string = "Record"): string {
  if (override) return override
  if (!category) return "Add New"
  switch (category.toLowerCase()) {
    case "vehicle": return "Add New Vehicle"
    case "driver": return "Add New Driver"
    case "owner": case "vehicle owner": return "Add New Vehicle Owner"
    case "agent": return "Add New Agent"
    case "party": case "consignor": case "consignee": return "Add New Party"
    case "station": case "branch": return "Add New Station"
    case "article": return "Add New Article"
    case "user": return "Add New User"
    default: return `Add New ${label}`
  }
}

export function getEntityName(category?: string): string {
  if (!category) return "Item"
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export function getPlaceholder(category?: string, defaultPlaceholder: string = "Select option"): string {
  if (!category) return defaultPlaceholder
  return `Select ${category}`
}

export function getSearchPlaceholder(category?: string): string {
  if (!category) return "Search options..."
  return `Search ${category}...`
}

export function getDisplayLabel(val: any, fallback: string = "—"): string {
  if (val === null || val === undefined || val === "") return fallback
  return String(val)
}

export default function QuickAddDropdown({
  label,
  category,
  value,
  options,
  placeholder,
  required,
  hasError,
  icon: Icon,
  addLabelOverride,
  onChange,
  onOptionAdded
}: QuickAddDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value || "")
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const containerRef = useRef<HTMLDivElement>(null)

  // Synchronize input value with prop
  useEffect(() => {
    setInputValue(value || "")
  }, [value])

  const getItemAddTitle = (): string => {
    return getAddButtonLabel(category, addLabelOverride, label)
  }

  const handleOpenModal = () => {
    setIsOpen(false)
    setError("")
    const typedQuery = inputValue && !options.includes(inputValue) ? inputValue : ""
    setFormData({
      name: category !== "vehicle" ? typedQuery : "",
      number: category === "vehicle" ? typedQuery.toUpperCase() : "",
      mobile: "",
      city: "",
      state: "",
      unit: "Box",
      type: "Branch",
      description: "",
      gst: ""
    })
    setShowModal(true)
  }

  const [formData, setFormData] = useState({
    name: "",
    number: "",
    mobile: "",
    city: "",
    state: "",
    unit: "Box",
    type: "Branch",
    description: "",
    gst: ""
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let createdName = ""

      if (category === "vehicle") {
        const vNum = formData.number || formData.name
        if (!vNum.trim()) throw new Error("Vehicle number is required")
        const res = await vehicleController.createVehicle({ number: vNum })
        createdName = res.number
      } else if (category === "driver") {
        if (!formData.name.trim()) throw new Error("Driver name is required")
        const res = await driverController.createDriver({ name: formData.name, mobile: formData.mobile })
        createdName = res.name
      } else if (category === "owner") {
        if (!formData.name.trim()) throw new Error("Vehicle owner name is required")
        const res = await ownerController.createOwner({ name: formData.name, mobile: formData.mobile, gst: formData.gst })
        createdName = res.name
      } else if (category === "agent") {
        if (!formData.name.trim()) throw new Error("Agent name is required")
        const res = await agentController.createAgent({ name: formData.name, mobile: formData.mobile, city: formData.city })
        createdName = res.name
      } else if (category === "party") {
        if (!formData.name.trim()) throw new Error("Party name is required")
        const res = await partyController.addParty({ name: formData.name, phone: formData.mobile, city: formData.city, gst: formData.gst })
        createdName = res.name
      } else if (category === "station") {
        if (!formData.name.trim()) throw new Error("Station name is required")
        const res = await stationController.addStation({ name: formData.name, city: formData.city || formData.name, state: formData.state, type: formData.type })
        createdName = res.name
      } else if (category === "article") {
        if (!formData.name.trim()) throw new Error("Article name is required")
        const res = await articleController.addArticle({ name: formData.name, unit: formData.unit, description: formData.description })
        createdName = res.name
      }

      if (createdName) {
        if (onOptionAdded) {
          onOptionAdded(createdName)
        }
        onChange(createdName)
        setInputValue(createdName)
        setShowModal(false)
      }
    } catch (err: any) {
      setError(err.message || "Failed to add item")
    } finally {
      setLoading(false)
    }
  }

  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    width: 200,
    openUpward: false
  })

  const updatePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < 250 && rect.top > spaceBelow

    setCoords({
      top: openUpward
        ? rect.top + window.scrollY - 6
        : rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
      openUpward
    })
  }

  useEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleScrollOrResize = () => {
      updatePosition()
    }

    window.addEventListener("scroll", handleScrollOrResize, true)
    window.addEventListener("resize", handleScrollOrResize)

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true)
      window.removeEventListener("resize", handleScrollOrResize)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const stringOptions = options.map(o => (typeof o === "string" ? o : (o as any)?.name || (o as any)?.label || String(o || "")))

  const isPlaceholderOrEmpty = !inputValue || inputValue === value || (placeholder && inputValue.toLowerCase().trim() === placeholder.toLowerCase().trim())
  const searchQuery = isPlaceholderOrEmpty ? "" : inputValue.trim().toLowerCase()

  const filteredOptions = searchQuery
    ? stringOptions.filter(o => o.toLowerCase().includes(searchQuery))
    : stringOptions

  return (
    <div className={`flex flex-col ${label ? "gap-1.5" : ""} w-full font-sans relative`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center justify-between select-none">
          <span>{label} {required && <span className="text-red-500 font-bold">*</span>}</span>
          {hasError && <span className="text-[10px] text-red-500 font-bold lowercase normal-case">Required</span>}
        </label>
      )}

      {/* Searchable Combobox Input Field */}
      <div className="relative w-full" ref={triggerRef}>
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            <Icon size={16} />
          </div>
        )}
        <input
          type="text"
          value={inputValue}
          onFocus={() => {
            updatePosition()
            setIsOpen(true)
          }}
          onChange={e => {
            const val = e.target.value
            setInputValue(val)
            onChange(val)
            updatePosition()
            setIsOpen(true)
          }}
          placeholder={placeholder}
          className={`h-[44px] w-full rounded-xl ${Icon ? "pl-9" : "pl-3.5"} pr-9 text-xs md:text-sm text-gray-800 placeholder:text-gray-400 font-medium transition-all focus:outline-none ${
            hasError
              ? "border-2 border-red-400 bg-red-50/20 text-red-900 ring-2 ring-red-400/20"
              : isOpen
              ? "border-indigo-400 bg-white ring-2 ring-indigo-400/20 shadow-sm border"
              : "bg-gray-50/80 border border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-400/20"
          }`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            updatePosition()
            setIsOpen(!isOpen)
          }}
          className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-gray-400 hover:text-indigo-600 cursor-pointer"
        >
          <ChevronDown size={15} className={`transition-transform duration-200 ${isOpen ? "rotate-180 text-indigo-600" : ""}`} />
        </button>
      </div>

      {/* PORTAL-BASED FILTERED OPTIONS POPOVER MENU (Z-INDEX 9999) */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: coords.openUpward ? 4 : -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: coords.openUpward ? 4 : -4, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[260px] font-sans text-xs"
              style={{
                position: "absolute",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                zIndex: 9999,
                transform: coords.openUpward ? "translateY(-100%)" : "none",
                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)"
              }}
            >
              <div className="overflow-y-auto flex-1 py-1 divide-y divide-gray-50">
                {value && (
                  <button
                    type="button"
                    onMouseDown={e => {
                      e.preventDefault()
                      onChange("")
                      setInputValue("")
                      setIsOpen(false)
                    }}
                    onClick={() => {
                      onChange("")
                      setInputValue("")
                      setIsOpen(false)
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>— Clear Selection —</span>
                  </button>
                )}

                {filteredOptions.map(opt => {
                  const isSelected = value === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onMouseDown={e => {
                        e.preventDefault()
                        onChange(opt)
                        setInputValue(opt)
                        setIsOpen(false)
                      }}
                      onClick={() => {
                        onChange(opt)
                        setInputValue(opt)
                        setIsOpen(false)
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
                      }`}
                    >
                      <span className="truncate">{opt}</span>
                      {isSelected && <Check size={14} className="text-indigo-600 shrink-0 ml-2" />}
                    </button>
                  )
                })}

                {filteredOptions.length === 0 && (
                  <div className="px-3.5 py-3 text-xs text-gray-400 text-center">No matching records</div>
                )}
              </div>

              {/* Fixed Bottom Divider & + Add New ... Option */}
              <div className="border-t border-gray-100 bg-gray-50/80 p-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50/90 hover:bg-indigo-100 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{typeof getAddButtonLabel === "function" ? getAddButtonLabel(category, addLabelOverride, label) : "Add New"}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Creation Modal using Unified Modal Component */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={getItemAddTitle()}
        icon={<Plus size={16} />}
        maxWidth="md"
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3">
            {category === "vehicle" && (
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Vehicle Registration Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-12-XX-1234"
                  value={formData.number}
                  onChange={e => setFormData({ ...formData, number: e.target.value.toUpperCase() })}
                  className="h-11 w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                />
              </div>
            )}

            {(category === "driver" || category === "owner" || category === "agent" || category === "party" || category === "station" || category === "article") && (
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                  {category === "article" ? "Article Name *" : category === "station" ? "Station / Branch Name *" : "Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Enter ${label} Name`}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="h-11 w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                />
              </div>
            )}

            {(category === "driver" || category === "owner" || category === "agent" || category === "party") && (
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 98200XXXXX"
                  value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                  className="h-11 w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                />
              </div>
            )}

            {(category === "party" || category === "owner") && (
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">GST Number (Optional)</label>
                <input
                  type="text"
                  placeholder="27AABCM1234A1Z5"
                  value={formData.gst}
                  onChange={e => setFormData({ ...formData, gst: e.target.value.toUpperCase() })}
                  className="h-11 w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                />
              </div>
            )}

            {(category === "station" || category === "agent" || category === "party") && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="h-11 w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">State</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="h-11 w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
              </div>
            )}

            {category === "article" && (
              <>
                <SearchDropdown
                  label="Unit"
                  value={formData.unit}
                  onChange={val => setFormData({ ...formData, unit: val })}
                  options={["Box", "Bale", "Carton", "Unit", "Drum", "Kg"]}
                />
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Short description"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="h-11 w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 h-11 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
              >
                <Save size={14} />
                {loading ? "Saving..." : "Save & Select"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}
