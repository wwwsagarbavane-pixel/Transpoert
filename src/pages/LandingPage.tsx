import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Zap, Check, ArrowRight, Shield, Globe, Award, Sparkles, 
  ChevronDown, Phone, MapPin, Truck, Plane, Ship, 
  HelpCircle, ChevronRight, UserCheck, Star, Users, ArrowUpRight, 
  FileText, Wallet, Layers, ShieldAlert 
} from "lucide-react"
import Logo from "../components/Logo"

interface LandingPageProps {
  onStart: () => void
}

export default function LandingPage({ onStart }: LandingPageProps) {
  // Quote Estimator State - SaaS Demo Matrix
  const [weight, setWeight] = useState(15)
  const [packageCount, setPackageCount] = useState(25)
  const [origin, setOrigin] = useState("Mumbai HQ")
  const [destination, setDestination] = useState("Delhi NCR")
  const [cargoType, setCargoType] = useState("Textile / Fabric")
  const [estimatedCost, setEstimatedCost] = useState(24500)
  const [quoteSuccess, setQuoteSuccess] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  useEffect(() => {
    let base = 6000
    base += weight * 1600
    base += packageCount * 110
    if (origin === destination) base = base * 0.45
    setEstimatedCost(Math.round(base))
  }, [origin, destination, weight, packageCount])

  const handleRequestQuote = (e: React.FormEvent) => {
    e.preventDefault()
    setQuoteSuccess(true)
    setTimeout(() => {
      setQuoteSuccess(false)
      setShowQuoteModal(false)
    }, 2000)
  }

  const faqs = [
    { q: "How does the traditional Lorry Receipt printing template work?", a: "TransportOS generates vector-perfect representations of traditional Indian transport receipts. You can feed continuous dot-matrix tractor paper or laser sheets, and fields will align perfectly with legacy layouts." },
    { q: "Can we set distinct document prefix series per branch station?", a: "Yes. The Branch Master module lets you set unique prefixes (e.g., MUM-, DEL-) and continuous document number sequences per location." },
    { q: "How are compliance expiration warnings handled?", a: "The system logs vehicle insurance policies, fitness certificates, state permits, and driver licenses. Auto-notifications alert operators 30 days before expiration to prevent dispatch blocks." },
    { q: "Can we send copies to consignors via WhatsApp?", a: "Yes. Our cloud notification engine generates instant share links for Lorry Receipts and dispatch status updates to send straight to client contacts." }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navigation Layout - White header bar */}
      <nav className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/95 backdrop-blur-md text-slate-850">
        <div className="max-w-[1280px] mx-auto px-6 h-[88px] flex items-center justify-between">
          <Logo className="h-10 w-auto shrink-0" />

          {/* Center Links - SaaS Modules */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-indigo-600 transition-colors duration-150">Features</a>
            <a href="#workflows" className="hover:text-indigo-600 transition-colors duration-150">Workflows</a>
            <a href="#modules" className="hover:text-indigo-600 transition-colors duration-150">Modules</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors duration-150">Pricing</a>
          </div>

          {/* Right Action Trigger */}
          <div className="flex items-center gap-4">
            <button onClick={onStart} className="text-sm font-semibold text-slate-600 hover:text-indigo-650 transition-colors duration-150">
              Sign In
            </button>
            <button onClick={onStart}
              className="flex items-center gap-1.5 h-10 px-4.5 rounded-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-750 transition-colors duration-150 cursor-pointer">
              Go to App <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - exactly 100vh viewport height first fold with truck as full background */}
      <section 
        id="home" 
        className="bg-cover bg-no-repeat text-white relative overflow-hidden flex items-center lg:h-[calc(100vh-88px)] min-h-[calc(100vh-88px)] py-16 lg:py-0"
        style={{ 
          backgroundImage: "linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%), url('/ChatGPT Image Jul 30, 2026, 12_36_21 PM.png')",
          backgroundPosition: "75% bottom"
        }}
      >
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-[1280px] mx-auto px-6 text-left space-y-6 relative z-10 w-full"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-slate-100 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
            Complete Transport LR Management Software
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.14] max-w-[800px] text-white">
            Manage Lorry Receipts, Billing & Delivery in One Platform.
          </h1>

          <p className="text-sm sm:text-base text-slate-350 leading-relaxed font-normal max-w-[580px]">
            Digital SaaS platform built for Indian transport operators. Automate lorry receipt generation, branch collections, billing registers, and vehicle compliance logs.
          </p>

          <div className="flex flex-wrap items-center justify-start gap-3.5 pt-2">
            <button 
              onClick={onStart} 
              className="h-11 px-6 rounded-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-150 cursor-pointer z-20"
            >
              Launch Software
            </button>
            <button 
              onClick={() => setShowQuoteModal(true)} 
              className="h-11 px-5 rounded-full text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 transition-all border border-white/15 backdrop-blur-sm cursor-pointer z-20"
            >
              Explore Pricing
            </button>
          </div>
        </motion.div>
      </section>

      {/* Main Content Area - White background for subsequent sections */}
      <div className="bg-white">
        
        {/* Statistics Strip - SaaS adoption metrics */}
        <section className="py-12 bg-white border-b border-slate-100 max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {[
              { value: "2.9M+", label: "Lorry Receipts Generated" },
              { value: "15k+", label: "Active Dispatch Clerks" },
              { value: "99.9%", label: "Cloud Server Uptime" },
              { value: "140+", label: "Transport Hubs Digitized" }
            ].map((stat, idx) => (
              <div key={stat.label} className={`space-y-1 ${idx > 0 ? "pt-6 md:pt-0" : ""}`}>
                <div className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* "All Set for Seamless Transportation" Grid - SaaS Product capabilities */}
        <section id="features" className="py-24 max-w-[1280px] mx-auto px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-2 text-left">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Software Capabilities</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Complete digital operations system</h2>
            </div>
            <div className="lg:col-span-4 text-left lg:text-right pt-2">
              <button onClick={onStart} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-650 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3.5 py-1.5 rounded-full transition-all duration-150">
                Explore All Modules <ArrowRight size={11} />
              </button>
            </div>
          </div>

          {/* Proportional swiftmove grids */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left panel - Branch Master Showcase - Split with natural colors */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden hover:-translate-y-0.5 hover:shadow transition-all duration-200 ease-out group">
              <div className="relative h-[220px] overflow-hidden bg-slate-50 border-b border-slate-200/60">
                <img 
                  src="/white-semi-trailer-truck-port.jpg" 
                  className="w-full h-full object-cover object-center transition-opacity duration-200 group-hover:opacity-95" 
                  alt="Fleet Dispatch Sync"
                  loading="lazy"
                />
              </div>
              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 text-left">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-600">Branch Station Master</span>
                  <h4 className="text-lg font-bold text-slate-900 mt-1">Centralized Multi-Branch Control</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Configure different branch profiles, set prefix patterns per loading station, and manage local operator user roles in real-time.
                  </p>
                </div>
                <div className="pt-4">
                  <button onClick={onStart} className="h-9 px-4 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-150">
                    Open Branch Master
                  </button>
                </div>
              </div>
            </div>

            {/* Right panel - Vertical 3 small cards layout */}
            <div className="lg:col-span-5 flex flex-col gap-4 text-left">
              {[
                { title: "Lorry Receipt Booking Screen", desc: "Allocate LHR numbers, verify GSTINs, write consignors/consignees, and calculate freight rates dynamically." },
                { title: "GST & RCM Invoicing Module", desc: "Generate compliant tax invoices, configure reverse charge parameters, and print dot-matrix bills." },
                { title: "Real-Time Collections Aging", desc: "Track invoice due alerts, log NEFT/cheque payment receipts, and manage outstanding balances." }
              ].map(sub => (
                <div key={sub.title} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 hover:bg-white hover:shadow-sm transition-all duration-200 ease-out border-l-4 hover:border-l-indigo-600">
                  <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide">{sub.title}</h5>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{sub.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* "Tailored Solutions for Your Business Requirements" Section - SaaS Workflow benefits */}
        <section id="workflows" className="py-24 bg-slate-50/40 border-t border-b border-slate-200/60">
          <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column details & bullet grid */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Digitize your booking process in seconds</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-[450px]">
                Our cloud database connects loading clerks, dispatch managers, and billing teams under a single dashboard to prevent cash leakage.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-800">
                {[
                  { title: "Create LR in Seconds", sub: "Auto-fill database lookups" },
                  { title: "Blank LR Management", sub: "Control serial book prints" },
                  { title: "Compliance Expiry Logs", sub: "Licenses & permits warnings" },
                  { title: "WhatsApp Consignment copies", sub: "Auto-share links to clients" }
                ].map(f => (
                  <div key={f.title} className="flex gap-2.5 items-start bg-white p-3.5 rounded-xl border border-slate-200/80">
                    <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                      <Check size={11} />
                    </div>
                    <div>
                      <div className="text-slate-800 font-bold">{f.title}</div>
                      <div className="text-[9px] text-slate-400 font-medium mt-0.5">{f.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button onClick={onStart} className="h-10 px-5 rounded-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-150">
                  Explore Workflows
                </button>
              </div>
            </div>

            {/* Right Column visual composition - Warehouse image, running truck, 97.6% fulfillment rate */}
            <div className="lg:col-span-6 grid grid-cols-12 gap-4 items-stretch text-left">
              
              {/* Top warehouse split card with natural colors */}
              <div className="col-span-12 bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:-translate-y-0.5 hover:shadow transition-all duration-200 ease-out group flex flex-col sm:flex-row h-auto sm:h-[180px]">
                <div className="w-full sm:w-[45%] relative h-[140px] sm:h-full overflow-hidden bg-slate-50 border-r border-slate-200/60 shrink-0">
                  <img 
                    src="/medium-shot-smiley-man-warehouse.jpg" 
                    className="w-full h-full object-cover object-top transition-opacity duration-200 group-hover:opacity-95" 
                    alt="Consignment Hub Database" 
                    loading="lazy"
                  />
                </div>
                <div className="p-5 flex flex-col justify-center flex-1 text-left">
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Consignments & Hubs Master</span>
                  <h5 className="text-sm font-bold text-slate-900 mt-1">Real-time Hub Inventories</h5>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Track warehouse loading status, unloading receipts, and local branch balance registers.
                  </p>
                </div>
              </div>

              {/* Bottom splits: Fleet list image card and Blue stat container */}
              <div className="col-span-7 bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:-translate-y-0.5 hover:shadow transition-all duration-200 ease-out group flex flex-col h-[180px] justify-between">
                <div className="relative h-[120px] overflow-hidden bg-slate-50 border-b border-slate-200/60 shrink-0">
                  <img 
                    src="/group-trucks-parked-row.jpg" 
                    className="w-full h-full object-cover object-center transition-opacity duration-200 group-hover:opacity-95" 
                    alt="Fleet Database" 
                    loading="lazy"
                  />
                </div>
                <div className="p-3 text-left flex-1 flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest block">Fleet Database</span>
                  <span className="text-[10px] font-bold text-slate-700 mt-0.5 block truncate">Vehicles & Drivers Master</span>
                </div>
              </div>
              
              <div className="col-span-5 bg-indigo-600 rounded-2xl text-white p-5 flex flex-col justify-between shadow shadow-indigo-600/10 h-[180px]">
                <Zap size={20} className="text-indigo-200" />
                <div>
                  <div className="text-2xl font-bold tracking-tight leading-none">99.9%</div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-200 mt-2">Cloud Sync Speed</div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* "End-to-End Logistics Solutions" - 4-card grid matching reference */}
        <section id="modules" className="py-24 max-w-[1280px] mx-auto px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-slate-100 pb-5">
            <div className="lg:col-span-8 space-y-2 text-left">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">SaaS Modules</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Complete Software Modules</h2>
            </div>
            <div className="lg:col-span-4 text-left lg:text-right">
              <button onClick={onStart} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors duration-150">
                View All Modules
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { label: "LR Booking", title: "Lorry Receipts Register", desc: "Manage detailed consignment documents, consignors/consignees databases, and dot-matrix continuous invoice spools.", icon: FileText },
              { label: "Status Tracking", title: "Delivery & POD Tracking", desc: "Track milestones from pending loading to in transit. Upload copy signatures or OTP files to confirm delivery.", icon: Truck },
              { label: "Invoicing & Ledgers", title: "Billing & Collections", desc: "Generate bulk station invoices, calculate reverse charge taxes, and track outstanding ledger balances.", icon: Wallet },
              { label: "Compliance Master", title: "Fleet & Driver Expiries", desc: "Auto-check permit dates, vehicle insurance policies, fitness certificates, and driver licenses to prevent blocks.", icon: ShieldAlert }
            ].map(mod => {
              const Icon = mod.icon
              return (
                <div key={mod.label} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 hover:shadow transition-all duration-200 ease-out">
                  <div className="space-y-4">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Icon size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">{mod.title}</h4>
                    <p className="text-xs text-slate-450 leading-relaxed font-normal">{mod.desc}</p>
                  </div>
                  <button onClick={onStart} className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors duration-150 w-full text-left">
                    <span>Open Module</span>
                    <ChevronRight size={11} />
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Compliance Master Block - natural colors split */}
        <section id="sectors" className="py-24 bg-slate-50/40 border-t border-b border-slate-250/30">
          <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left column large mockup image split */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden hover:-translate-y-0.5 hover:shadow transition-all duration-200 ease-out group">
              <div className="relative h-[240px] overflow-hidden bg-slate-50 border-b border-slate-200/60">
                <img 
                  src="/low-angle-man-holding-clipboard.jpg" 
                  className="w-full h-full object-cover object-center transition-opacity duration-200 group-hover:opacity-95" 
                  alt="Software Compliance Screen" 
                  loading="lazy"
                />
              </div>
              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 text-left">
                <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-600">Driver License Audits</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Secure Driver & Owner Master</h3>
                <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                  Keep records of registered drivers, verify phone coordinates, and log license expiry status with automated system notifications.
                </p>
              </div>
            </div>

            {/* Right column overlay selectors */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Operational Masters</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Unified Database Masters</h2>
              
              <div className="divide-y divide-slate-200 text-xs font-bold text-slate-700">
                {["Consignor & Consignee Parties Master", "Vehicles Fleet & Category Master", "Driver License & Expiry logs", "Vehicle Owners & Manifest listings", "GTA Booking Agents Master"].map(sec => (
                  <div key={sec} className="py-3.5 flex items-center justify-between hover:text-indigo-650 transition-colors duration-150 cursor-pointer group">
                    <span>{sec}</span>
                    <ChevronRight size={12} className="text-slate-350 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all duration-155" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Interactive Cost Calculator Slider - framed as software demo */}
        <section id="demo" className="py-24 max-w-[1000px] mx-auto px-6 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Interactive Software Demo</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Auto-Freight Spool Calculator</h2>
            <p className="text-xs sm:text-sm text-slate-450 font-normal">Test our calculation engine. Move the sliders to test automatic calculations of weight and parcel freight.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* sliders */}
            <div className="md:col-span-7 space-y-6 text-left">
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                <div className="space-y-1.5">
                  <label>Origin Branch</label>
                  <select value={origin} onChange={e => setOrigin(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 focus:outline-none focus:border-indigo-400">
                    {["Mumbai HQ", "Delhi NCR", "Chennai", "Bangalore", "Kolkata", "Pune"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label>Destination Branch</label>
                  <select value={destination} onChange={e => setDestination(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 focus:outline-none focus:border-indigo-400">
                    {["Delhi NCR", "Bangalore", "Hyderabad", "Ahmedabad", "Lucknow", "Mumbai HQ"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span>Weight Matrix</span>
                  <span className="text-indigo-650">{weight} Tons</span>
                </div>
                <input type="range" min={1} max={50} value={weight} onChange={e => setWeight(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer" />
              </div>

              <div className="space-y-2 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span>Packages Count</span>
                  <span className="text-indigo-650">{packageCount} Pkgs</span>
                </div>
                <input type="range" min={1} max={100} value={packageCount} onChange={e => setPackageCount(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer" />
              </div>
            </div>

            {/* estimator result */}
            <div className="md:col-span-5 bg-indigo-600 rounded-xl p-6 text-white text-center flex flex-col justify-between h-[230px] shadow-lg shadow-indigo-600/5">
              <span className="text-[9px] text-indigo-200 font-bold uppercase tracking-wider">Estimated Freight Cost</span>
              <div className="text-2xl font-bold font-mono mt-3">₹{estimatedCost.toLocaleString()}</div>
              <p className="text-[10px] text-indigo-100/75 mt-2 max-w-[200px] mx-auto leading-normal">Freight calculation based on custom rates configured in masters database.</p>
              <button onClick={onStart} className="w-full h-9 mt-5 rounded-lg bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs transition-colors duration-150 shadow-sm cursor-pointer">
                Launch App to Book
              </button>
            </div>
          </div>
        </section>

        {/* Testimonial Section - praising the software */}
        <section className="py-24 max-w-[1280px] mx-auto px-6 space-y-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1 text-left">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Operator Reviews</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">What transport MDs say about TransportOS</h2>
            </div>
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { name: "Vijay Mehta", role: "MD, Mehta Transport Agency", text: "TransportOS digital LHR booking reduced our loading station data entry errors. The continuous page layout prints perfectly on laser and dot-matrix printers.", initial: "VM" },
              { name: "Dilip Patel", role: "Founder, Patel Logistics", text: "The multi-branch prefix series setup is excellent. Our billing clerks in different cities allocate receipt numbers without sequence conflicts.", initial: "DP" },
              { name: "Manish Shah", role: "MD, Gujarat Roadlines", text: "Driver license expiry alerts and permit logs prevent dispatch blockages. Reconciling outstanding balances is simple with the billing dashboard.", initial: "MS" }
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:-translate-y-0.5 hover:shadow transition-all duration-205 ease-out">
                <p className="text-xs text-slate-500 leading-relaxed font-normal">"{t.text}"</p>
                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                    {t.initial}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t.name}</div>
                    <div className="text-[9px] text-slate-400 font-semibold">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing packages section */}
        <section id="pricing" className="py-24 bg-slate-50 border-t border-b border-slate-200/60">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12">
            <div className="text-center space-y-2.5 max-w-[450px] mx-auto">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Flexible Pricing</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Software subscription plans</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[950px] mx-auto items-stretch">
              {[
                { name: "Single Branch", price: "₹1,490", desc: "Best for single-station transport agencies", features: ["1 Active Branch Hub", "Unlimited Lorry Receipts", "Laser & Dot-Matrix printing templates", "Single operator license"] },
                { name: "Professional Team", price: "₹4,900", desc: "Designed for multi-hub transport agencies", features: ["Up to 5 Branches syncs", "Centralized Collections Ledger", "Automatic WhatsApp LHR copies sharing", "Continuous GPS telemetry syncs", "Standard compliance expiry logs"], popular: true },
                { name: "Enterprise Hub", price: "Custom", desc: "For large pan-India logistics networks", features: ["Unlimited Branches & operators", "Centralized GST Invoicing integration", "Dedicated priority compliance support", "Advanced telemetry dashboard settings"] }
              ].map(plan => (
                <div key={plan.name} className={`bg-white rounded-2xl p-6 border flex flex-col justify-between relative transition-all duration-200 ${plan.popular ? "border-indigo-500 ring-2 ring-indigo-500/10 shadow" : "border-slate-200 hover:border-slate-300 shadow-sm"}`}>
                  {plan.popular && <span className="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-indigo-650 text-white text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">Most Popular</span>}
                  <div className="space-y-4 text-left">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{plan.name}</h4>
                      <p className="text-[9px] text-slate-400 mt-1 font-medium leading-relaxed">{plan.desc}</p>
                    </div>
                    <div className="flex items-baseline gap-1 pt-1 border-b border-slate-100 pb-3">
                      <span className="text-2xl font-bold text-slate-950">{plan.price}</span>
                      {plan.price !== "Custom" && <span className="text-[9px] text-slate-400 font-bold">/ month</span>}
                    </div>
                    <div className="space-y-2.5 text-xs pt-1">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-slate-600">
                          <Check size={12} className="text-indigo-500 shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={onStart}
                    className={`w-full h-10 mt-6 rounded-xl text-xs font-bold transition-all cursor-pointer ${plan.popular ? "text-white bg-indigo-600 hover:bg-indigo-700 shadow shadow-indigo-500/10" : "text-slate-700 bg-slate-50 hover:bg-slate-150"}`}>
                    Get Started Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="py-24 max-w-[760px] mx-auto px-6 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">FAQs</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const open = activeFaq === i
              return (
                <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <button onClick={() => setActiveFaq(open ? null : i)}
                    className="w-full text-left p-4.5 flex items-center justify-between text-xs font-bold text-slate-750 hover:text-slate-950 transition-colors">
                    <span>{faq.q}</span>
                    <ChevronDown size={13} className={`text-slate-450 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="border-t border-slate-50 bg-slate-50/20">
                        <p className="p-4.5 text-xs text-slate-500 leading-relaxed font-normal">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA Banner Section - modern two-column layout with natural colors */}
        <section className="py-20 max-w-[1200px] mx-auto px-6">
          <div className="bg-[#0A1D37] text-white rounded-3xl overflow-hidden border border-slate-800 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[340px]">
            
            <div className="lg:col-span-7 p-8 sm:p-12 space-y-5 text-left relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full inline-block">Secure Cloud SaaS</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold uppercase leading-tight">Ready to digitize your transport business?</h2>
              <p className="text-xs sm:text-sm text-slate-350 leading-relaxed max-w-[480px]">
                Connect loading clerks, generate continuous laser invoices, and manage collections ledger balances across all station branches instantly.
              </p>
              <div className="pt-4">
                <button onClick={onStart} className="h-11 px-6 rounded-full text-xs font-bold text-indigo-750 bg-white hover:bg-slate-50 transition-colors duration-150 shadow-md cursor-pointer">
                  Start Free Trial
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative h-full min-h-[260px] lg:min-h-full overflow-hidden self-stretch bg-[#0D2447]">
              <img 
                src="/young-courier-his-colleague-unloading-cardboard-boxes-from-delivery-van.jpg" 
                className="absolute inset-0 w-full h-full object-cover object-center" 
                alt="Delivery status and manifest tracking software" 
                loading="lazy"
              />
            </div>

          </div>
        </section>

      </div>

      {/* Footer Section - Deep blue background, matching reference with huge watermark backdrop */}
      <footer className="bg-[#0A1D37] text-white border-t border-white/5 pt-16 pb-12 relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-16 text-xs text-gray-400 relative z-10 text-left">
          <div className="space-y-4">
            <Logo className="h-10 w-auto shrink-0" />
            <p className="leading-relaxed font-medium">Unified digital control platform for Lorry Receipt books, collections invoicing, multi-branch syncing, and compliance alerts.</p>
          </div>
          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-[9px] mb-3">GTA Operations</h5>
            <ul className="space-y-2.5 font-medium">
              <li><a href="#home" className="hover:text-white transition-all">Lorry Receipts Registers</a></li>
              <li><a href="#home" className="hover:text-white transition-all">Operations Steppers</a></li>
              <li><a href="#home" className="hover:text-white transition-all">Billing & Invoices</a></li>
              <li><a href="#home" className="hover:text-white transition-all">Outstanding Reports</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-[9px] mb-3">Compliance Masters</h5>
            <ul className="space-y-2.5 font-medium">
              <li><a href="#workflows" className="hover:text-white transition-all">Branch Stations Master</a></li>
              <li><a href="#workflows" className="hover:text-white transition-all">Vehicles Fleet Master</a></li>
              <li><a href="#workflows" className="hover:text-white transition-all">Drivers License Master</a></li>
              <li><a href="#workflows" className="hover:text-white transition-all">GTA Agents Master</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-[9px] mb-3">Contact Adilabad HQ</h5>
            <p className="leading-relaxed font-medium">N. H. No. 7, Adilabad - 504 001 (Telangana)</p>
            <p className="mt-2 font-bold text-white">Call Office: +91 98488 16561</p>
          </div>
        </div>

        {/* Giant background watermark text at bottom */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[12vw] font-black text-white/[0.02] select-none tracking-widest pointer-events-none font-sans z-0 text-center w-full">
          TRANSPORTOS
        </div>

        <div className="max-w-[1280px] mx-auto px-6 border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 relative z-10">
          <div>© {new Date().getFullYear()} TransportOS Logistics Inc. All rights reserved. Registered GTA Broker.</div>
          <div className="flex gap-4 font-semibold">
            <a href="#home" className="hover:underline">Privacy Policy</a>
            <a href="#home" className="hover:underline">Terms & Conditions</a>
          </div>
        </div>
      </footer>

      {/* Quote / Contact Us Modal */}
      <AnimatePresence>
        {showQuoteModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuoteModal(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0A1D37] text-white rounded-2xl p-6 sm:p-8 w-[450px] shadow-xl border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.08),transparent)] pointer-events-none" />
                <form onSubmit={handleRequestQuote} className="space-y-4 relative z-10 text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-white/10 pb-3">Freight Cost Estimator</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1.5">
                      <label className="text-gray-300">Origin Station</label>
                      <select value={origin} onChange={e => setOrigin(e.target.value)}
                        className="w-full h-10 bg-white/5 border border-white/15 rounded-xl px-3 text-white focus:outline-none">
                        {["Mumbai HQ", "Delhi NCR", "Chennai", "Bangalore", "Kolkata"].map(s => <option key={s} value={s} className="text-gray-900">{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-gray-300">Destination</label>
                      <select value={destination} onChange={e => setDestination(e.target.value)}
                        className="w-full h-10 bg-white/5 border border-white/15 rounded-xl px-3 text-white focus:outline-none">
                        {["Delhi NCR", "Bangalore", "Hyderabad", "Ahmedabad", "Mumbai HQ"].map(s => <option key={s} value={s} className="text-gray-900">{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-semibold">
                    <label className="text-gray-300">Cargo Article Type</label>
                    <select value={cargoType} onChange={e => setCargoType(e.target.value)}
                      className="w-full h-10 bg-white/5 border border-white/15 rounded-xl px-3 text-white focus:outline-none">
                      {["Textile / Fabric", "Electronics", "Auto Parts", "FMCG Goods"].map(a => <option key={a} value={a} className="text-gray-900">{a}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2 text-xs font-semibold">
                    <div className="flex justify-between text-gray-300">
                      <span>Estimated Weight</span>
                      <span className="font-mono text-blue-400 font-bold">{weight} Tons</span>
                    </div>
                    <input type="range" min={1} max={50} value={weight} onChange={e => setWeight(Number(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 bg-white/10 rounded-lg cursor-pointer" />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Dynamic Cost Estimate</span>
                    <div className="text-xl font-bold text-blue-400 font-mono mt-1">₹{estimatedCost.toLocaleString()}</div>
                  </div>

                  <button type="submit" className="w-full h-10 bg-blue-500 hover:bg-blue-600 font-bold rounded-xl text-xs text-white shadow transition-all cursor-pointer">
                    {quoteSuccess ? "✓ Estimate Sent Successfully!" : "Submit Estimate Request"}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
