// ─── Navigation ────────────────────────────────────────────────────────────────
export const dashboardKPIs = [
  { label: "Total LR", value: "2,847", change: "+12.4%", positive: true, sub: "all time", icon: "FileText", gradient: "from-indigo-500 to-purple-600" },
  { label: "Today's LR", value: "24", change: "+4", positive: true, sub: "vs yesterday: 20", icon: "FilePlus", gradient: "from-blue-500 to-cyan-500" },
  { label: "Pending LR", value: "87", change: "-3.2%", positive: true, sub: "awaiting delivery", icon: "Clock", gradient: "from-amber-500 to-orange-500" },
  { label: "Delivered Today", value: "18", change: "+6", positive: true, sub: "on-time: 16", icon: "PackageCheck", gradient: "from-emerald-500 to-teal-500" },
  { label: "Running Vehicles", value: "43", change: "of 83 total", positive: true, sub: "51.8% utilization", icon: "Truck", gradient: "from-violet-500 to-purple-500" },
  { label: "Today's Freight", value: "₹3.84L", change: "+8.1%", positive: true, sub: "vs avg ₹3.55L", icon: "IndianRupee", gradient: "from-rose-500 to-pink-500" },
]

// ─── LR Records ────────────────────────────────────────────────────────────────
export const lrRecords = [
  { lr: "LR-2847", date: "29 Jul 2026", bookingBranch: "Mumbai HQ", bookingStation: "Mumbai", deliveryStation: "Delhi", vehicle: "MH-12-AB-3456", driver: "Ganesh Bawane", owner: "Suresh Logistics Pvt Ltd", agent: "Mehta Agency", from: "Mumbai", to: "Delhi", consignor: "Mehta Traders", consignee: "Sharma Enterprises", articles: 12, packageCount: 12, weight: "4.2T", actualWeight: 4.2, chargedWeight: 4.5, freight: 18500, advance: 8000, balance: 10500, hamali: 200, invoice: "INV-4821", invoiceValue: 185000, waybill: "WB-2341", ewayBill: "EWB-231084521", gst: "27AABCM1234A1Z5", freightType: "To Pay", paymentType: "Credit", expectedDelivery: "30 Jul 2026", status: "in_transit", remarks: "" },
  { lr: "LR-2846", date: "29 Jul 2026", bookingBranch: "Chennai", bookingStation: "Chennai", deliveryStation: "Bangalore", vehicle: "TN-09-CD-7890", driver: "Suresh Rao", owner: "Rao Transport Co", agent: "Southern Agency", from: "Chennai", to: "Bangalore", consignor: "Ravi Industries", consignee: "Lakshmi Stores", articles: 8, packageCount: 8, weight: "2.8T", actualWeight: 2.8, chargedWeight: 3.0, freight: 12200, advance: 5000, balance: 7200, hamali: 150, invoice: "INV-4820", invoiceValue: 95000, waybill: "WB-2340", ewayBill: "EWB-231084520", gst: "33AADCR5678B1Z2", freightType: "Paid", paymentType: "Cash", expectedDelivery: "29 Jul 2026", status: "delivered", remarks: "" },
  { lr: "LR-2845", date: "28 Jul 2026", bookingBranch: "Kolkata", bookingStation: "Kolkata", deliveryStation: "Hyderabad", vehicle: "WB-02-EF-1234", driver: "Amit Singh", owner: "East Bengal Transport", agent: "", from: "Kolkata", to: "Hyderabad", consignor: "Banerjee & Sons", consignee: "Reddy Transport Co", articles: 20, packageCount: 20, weight: "6.5T", actualWeight: 6.5, chargedWeight: 7.0, freight: 28000, advance: 12000, balance: 16000, hamali: 400, invoice: "INV-4819", invoiceValue: 280000, waybill: "WB-2339", ewayBill: "EWB-231084519", gst: "19AABCB9012C1Z8", freightType: "To Pay", paymentType: "Credit", expectedDelivery: "01 Aug 2026", status: "pending", remarks: "Fragile items" },
  { lr: "LR-2844", date: "28 Jul 2026", bookingBranch: "Mumbai HQ", bookingStation: "Pune", deliveryStation: "Ahmedabad", vehicle: "MH-14-GH-5678", driver: "Vikram Patel", owner: "Patel Fleet Owners", agent: "Western Agents", from: "Pune", to: "Ahmedabad", consignor: "Patel Logistics", consignee: "Gujarat Traders", articles: 6, packageCount: 6, weight: "3.1T", actualWeight: 3.1, chargedWeight: 3.2, freight: 15800, advance: 7000, balance: 8800, hamali: 180, invoice: "INV-4818", invoiceValue: 142000, waybill: "WB-2338", ewayBill: "EWB-231084518", gst: "27AADCP3456D1Z1", freightType: "To Pay", paymentType: "Cheque", expectedDelivery: "29 Jul 2026", status: "in_transit", remarks: "" },
  { lr: "LR-2843", date: "27 Jul 2026", bookingBranch: "Jaipur", bookingStation: "Jaipur", deliveryStation: "Lucknow", vehicle: "RJ-14-IJ-9012", driver: "Deepak Sharma", owner: "Rajputana Owners", agent: "", from: "Jaipur", to: "Lucknow", consignor: "Rajasthan Goods", consignee: "UP Distributors", articles: 5, packageCount: 5, weight: "1.9T", actualWeight: 1.9, chargedWeight: 2.0, freight: 9600, advance: 4000, balance: 5600, hamali: 100, invoice: "INV-4817", invoiceValue: 88000, waybill: "WB-2337", ewayBill: "", gst: "08AABCR7890E1Z4", freightType: "Paid", paymentType: "Cash", expectedDelivery: "27 Jul 2026", status: "delivered", remarks: "" },
  { lr: "LR-2842", date: "27 Jul 2026", bookingBranch: "Surat", bookingStation: "Surat", deliveryStation: "Mumbai", vehicle: "GJ-05-KL-3456", driver: "Pradeep Verma", owner: "Gujarat Fleet Co", agent: "Diamond Agency", from: "Surat", to: "Mumbai", consignor: "Diamond Fabrics", consignee: "Fashion Hub", articles: 15, packageCount: 15, weight: "5.0T", actualWeight: 5.0, chargedWeight: 5.0, freight: 22400, advance: 10000, balance: 12400, hamali: 300, invoice: "INV-4816", invoiceValue: 450000, waybill: "WB-2336", ewayBill: "EWB-231084516", gst: "24AADCD1234F1Z7", freightType: "To Pay", paymentType: "Credit", expectedDelivery: "27 Jul 2026", status: "cancelled", remarks: "Cancelled by consignor" },
  { lr: "LR-2841", date: "27 Jul 2026", bookingBranch: "Nagpur", bookingStation: "Nagpur", deliveryStation: "Bhopal", vehicle: "MH-40-MN-7890", driver: "Arun Mishra", owner: "Central India Owners", agent: "", from: "Nagpur", to: "Bhopal", consignor: "Central India Traders", consignee: "MP Warehousing", articles: 9, packageCount: 9, weight: "3.8T", actualWeight: 3.8, chargedWeight: 4.0, freight: 16700, advance: 7500, balance: 9200, hamali: 220, invoice: "INV-4815", invoiceValue: 165000, waybill: "WB-2335", ewayBill: "EWB-231084515", gst: "27AABCC5678G1Z3", freightType: "To Pay", paymentType: "Credit", expectedDelivery: "28 Jul 2026", status: "in_transit", remarks: "" },
  { lr: "LR-2840", date: "26 Jul 2026", bookingBranch: "Indore", bookingStation: "Indore", deliveryStation: "Pune", vehicle: "MP-09-OP-1234", driver: "Sanjay Tiwari", owner: "MP Transport Owners", agent: "", from: "Indore", to: "Pune", consignor: "Madhya Pradesh Goods", consignee: "Pune Suppliers", articles: 7, packageCount: 7, weight: "2.2T", actualWeight: 2.2, chargedWeight: 2.5, freight: 11300, advance: 5000, balance: 6300, hamali: 130, invoice: "INV-4814", invoiceValue: 98000, waybill: "WB-2334", ewayBill: "EWB-231084514", gst: "23AADCM9012H1Z6", freightType: "Paid", paymentType: "NEFT", expectedDelivery: "26 Jul 2026", status: "delivered", remarks: "" },
  { lr: "LR-2839", date: "26 Jul 2026", bookingBranch: "Coimbatore", bookingStation: "Coimbatore", deliveryStation: "Chennai", vehicle: "TN-38-QR-5678", driver: "Murugan K", owner: "Tamil Nadu Fleet", agent: "South India Agency", from: "Coimbatore", to: "Chennai", consignor: "Tamil Nadu Mills", consignee: "Chennai Depot", articles: 22, packageCount: 22, weight: "7.1T", actualWeight: 7.1, chargedWeight: 7.5, freight: 31500, advance: 15000, balance: 16500, hamali: 450, invoice: "INV-4813", invoiceValue: 310000, waybill: "WB-2333", ewayBill: "EWB-231084513", gst: "33AABCT3456I1Z9", freightType: "To Pay", paymentType: "Credit", expectedDelivery: "28 Jul 2026", status: "pending", remarks: "" },
  { lr: "LR-2838", date: "26 Jul 2026", bookingBranch: "Chandigarh", bookingStation: "Chandigarh", deliveryStation: "Amritsar", vehicle: "CH-01-ST-9012", driver: "Gurpreet Singh", owner: "Punjab Vehicle Owners", agent: "", from: "Chandigarh", to: "Amritsar", consignor: "Punjab Traders", consignee: "Amritsar Goods", articles: 4, packageCount: 4, weight: "1.5T", actualWeight: 1.5, chargedWeight: 1.5, freight: 7800, advance: 3500, balance: 4300, hamali: 80, invoice: "INV-4812", invoiceValue: 72000, waybill: "WB-2332", ewayBill: "", gst: "04AADCP7890J1Z5", freightType: "Paid", paymentType: "Cash", expectedDelivery: "26 Jul 2026", status: "delivered", remarks: "" },
  { lr: "LR-2837", date: "25 Jul 2026", bookingBranch: "Bangalore", bookingStation: "Bangalore", deliveryStation: "Hyderabad", vehicle: "KA-01-UV-1234", driver: "Ravi Naidu", owner: "Karnataka Owners", agent: "", from: "Bangalore", to: "Hyderabad", consignor: "Karnataka Exports", consignee: "Hyderabad Imports", articles: 11, packageCount: 11, weight: "4.6T", actualWeight: 4.6, chargedWeight: 5.0, freight: 20100, advance: 9000, balance: 11100, hamali: 260, invoice: "INV-4811", invoiceValue: 195000, waybill: "WB-2331", ewayBill: "EWB-231084511", gst: "29AABCK1234K1Z2", freightType: "To Pay", paymentType: "Credit", expectedDelivery: "25 Jul 2026", status: "delivered", remarks: "" },
  { lr: "LR-2836", date: "25 Jul 2026", bookingBranch: "Mumbai HQ", bookingStation: "Mumbai", deliveryStation: "Kolkata", vehicle: "MH-04-WX-5678", driver: "Sunil Joshi", owner: "Bombay Fleet Pvt Ltd", agent: "East India Agency", from: "Mumbai", to: "Kolkata", consignor: "Bombay Traders", consignee: "Kolkata Distributors", articles: 18, packageCount: 18, weight: "8.3T", actualWeight: 8.3, chargedWeight: 8.5, freight: 42000, advance: 20000, balance: 22000, hamali: 600, invoice: "INV-4810", invoiceValue: 415000, waybill: "WB-2330", ewayBill: "EWB-231084510", gst: "27AABCB5678L1Z8", freightType: "To Pay", paymentType: "Credit", expectedDelivery: "28 Jul 2026", status: "in_transit", remarks: "" },
]

// ─── Vehicles ───────────────────────────────────────────────────────────────────
export const vehicles = [
  { number: "MH-12-AB-3456", type: "Trailer", capacity: "25T", owner: "Suresh Logistics Pvt Ltd", driver: "Ganesh Bawane", gpsId: "GPS-001", rc: "31 Dec 2027", insurance: "15 Mar 2027", fitness: "10 Aug 2026", permit: "30 Nov 2026", puc: "15 Sep 2026", status: "active" },
  { number: "TN-09-CD-7890", type: "6-Wheeler", capacity: "12T", owner: "Rao Transport Co", driver: "Suresh Rao", gpsId: "GPS-002", rc: "15 Jun 2028", insurance: "22 Jan 2027", fitness: "05 Sep 2026", permit: "20 Mar 2027", puc: "10 Oct 2026", status: "active" },
  { number: "WB-02-EF-1234", type: "Trailer", capacity: "25T", owner: "East Bengal Transport", driver: "Amit Singh", gpsId: "GPS-003", rc: "08 Nov 2026", insurance: "30 Apr 2027", fitness: "20 Oct 2026", permit: "15 Jan 2027", puc: "05 Aug 2026", status: "maintenance" },
  { number: "MH-14-GH-5678", type: "10-Wheeler", capacity: "18T", owner: "Patel Fleet Owners", driver: "Vikram Patel", gpsId: "GPS-004", rc: "20 Feb 2028", insurance: "11 Jul 2027", fitness: "15 Dec 2026", permit: "28 Sep 2026", puc: "20 Nov 2026", status: "active" },
  { number: "RJ-14-IJ-9012", type: "6-Wheeler", capacity: "12T", owner: "Rajputana Owners", driver: "Deepak Sharma", gpsId: "", rc: "12 Sep 2027", insurance: "06 Feb 2027", fitness: "28 Nov 2026", permit: "14 Jun 2027", puc: "30 Aug 2026", status: "active" },
  { number: "GJ-05-KL-3456", type: "Trailer", capacity: "25T", owner: "Gujarat Fleet Co", driver: "Pradeep Verma", gpsId: "GPS-005", rc: "25 Apr 2027", insurance: "19 Aug 2026", fitness: "02 Jan 2027", permit: "22 Apr 2027", puc: "12 Sep 2026", status: "idle" }
]

export const vehicleStatus = vehicles

// ─── Drivers ────────────────────────────────────────────────────────────────────
export const drivers = [
  { id: "DRV-001", name: "Ganesh Bawane", mobile: "9820001234", altMobile: "9820001235", license: "MH-12-20190034512", licenseExpiry: "15 Mar 2029", aadhaar: "XXXX-XXXX-1234", address: "Plot 14, Dharavi, Mumbai 40017", emergency: "Sunita Kumar · 9820001236", vehicle: "MH-12-AB-3456", experience: "12 yrs", status: "active" },
  { id: "DRV-002", name: "Suresh Rao", mobile: "9944005678", altMobile: "", license: "TN-09-20170098765", licenseExpiry: "22 Jan 2027", aadhaar: "XXXX-XXXX-5678", address: "45 Anna Nagar, Chennai 600040", emergency: "Kavita Rao · 9944005679", vehicle: "TN-09-CD-7890", experience: "8 yrs", status: "active" },
  { id: "DRV-003", name: "Amit Singh", mobile: "9830009012", altMobile: "9830009013", license: "WB-02-20180034521", licenseExpiry: "10 Aug 2028", aadhaar: "XXXX-XXXX-9012", address: "12 Ballygunge, Kolkata 700019", emergency: "Priya Singh · 9830009014", vehicle: "WB-02-EF-1234", experience: "6 yrs", status: "active" },
  { id: "DRV-004", name: "Vikram Patel", mobile: "9763003456", altMobile: "", license: "GJ-01-20150076543", licenseExpiry: "05 Nov 2025", aadhaar: "XXXX-XXXX-3456", address: "Sector 7, Gandhinagar 382007", emergency: "Hetal Patel · 9763003457", vehicle: "MH-14-GH-5678", experience: "15 yrs", status: "active" },
  { id: "DRV-005", name: "Deepak Sharma", mobile: "9414007890", altMobile: "9414007891", license: "RJ-01-20200012345", licenseExpiry: "18 Jun 2030", aadhaar: "XXXX-XXXX-7890", address: "Civil Lines, Jaipur 302006", emergency: "Rekha Sharma · 9414007892", vehicle: "RJ-14-IJ-9012", experience: "4 yrs", status: "active" },
  { id: "DRV-006", name: "Pradeep Verma", mobile: "9825001234", altMobile: "", license: "GJ-05-20180056789", licenseExpiry: "30 Dec 2028", aadhaar: "XXXX-XXXX-2345", address: "Ring Road, Surat 395002", emergency: "Meena Verma · 9825001235", vehicle: "GJ-05-KL-3456", experience: "9 yrs", status: "on_trip" },
  { id: "DRV-007", name: "Murugan K", mobile: "9944112233", altMobile: "", license: "TN-38-20160045678", licenseExpiry: "20 Mar 2026", aadhaar: "XXXX-XXXX-3344", address: "Gandhipuram, Coimbatore 641012", emergency: "Selvi K · 9944112234", vehicle: "TN-38-QR-5678", experience: "11 yrs", status: "active" },
]

// ─── Parties ────────────────────────────────────────────────────────────────────
export const parties = [
  { id: "PTY-001", name: "Mehta Traders", type: "Consignor", gst: "27AABCM1234A1Z5", pan: "AABCM1234A", phone: "9820011111", email: "mehta@traders.com", contactPerson: "Vijay Mehta", creditLimit: 500000, outstanding: 87500, billingAddress: "Shop 14, Crawford Market, Mumbai 400001", shippingAddress: "Warehouse 3, Bhiwandi 421302", paymentTerms: "30 Days", city: "Mumbai", state: "Maharashtra", status: "active" },
  { id: "PTY-002", name: "Sharma Enterprises", type: "Consignee", gst: "07AADCS5678B1Z2", pan: "AADCS5678B", phone: "9811022222", email: "sharma@enterprises.in", contactPerson: "Rakesh Sharma", creditLimit: 300000, outstanding: 45200, billingAddress: "Plot 22, Okhla Industrial Area, Delhi 110020", shippingAddress: "Godown 7, Gurgaon 122001", paymentTerms: "15 Days", city: "Delhi", state: "Delhi", status: "active" },
  { id: "PTY-003", name: "Ravi Industries", type: "Both", gst: "33AADCR9012C1Z8", pan: "AADCR9012C", phone: "9944033333", email: "ravi@industries.co.in", contactPerson: "Ravi Subramanian", creditLimit: 750000, outstanding: 120000, billingAddress: "123 Anna Salai, Chennai 600002", shippingAddress: "Phase II, SIPCOT, Chennai 600058", paymentTerms: "45 Days", city: "Chennai", state: "Tamil Nadu", status: "active" },
  { id: "PTY-004", name: "Banerjee & Sons", type: "Consignor", gst: "19AABCB3456D1Z4", pan: "AABCB3456D", phone: "9830044444", email: "banerjee@sons.com", contactPerson: "Subhash Banerjee", creditLimit: 200000, outstanding: 0, billingAddress: "8 Strand Road, Kolkata 700001", shippingAddress: "Dock Area, Kolkata Port 700043", paymentTerms: "Cash", city: "Kolkata", state: "West Bengal", status: "active" },
  { id: "PTY-005", name: "Patel Logistics", type: "Both", gst: "24AADCP7890E1Z7", pan: "AADCP7890E", phone: "9825055555", email: "patel@logistics.net", contactPerson: "Dilip Patel", creditLimit: 1000000, outstanding: 234000, billingAddress: "Ring Road, Surat 395002", shippingAddress: "Hazira Port Area, Surat 394270", paymentTerms: "30 Days", city: "Surat", state: "Gujarat", status: "active" },
  { id: "PTY-006", name: "Gujarat Traders", type: "Consignee", gst: "24AABCG1234F1Z1", pan: "AABCG1234F", phone: "9376066666", email: "gujarat@traders.in", contactPerson: "Manish Shah", creditLimit: 400000, outstanding: 67800, billingAddress: "GIDC, Ahmedabad 382330", shippingAddress: "GIDC Vatva, Ahmedabad 382445", paymentTerms: "30 Days", city: "Ahmedabad", state: "Gujarat", status: "active" },
]

// ─── Vehicle Owners ──────────────────────────────────────────────────────────────
export const vehicleOwners = [
  { id: "OWN-001", name: "Suresh Logistics Pvt Ltd", contact: "Suresh Nair", mobile: "9820099001", email: "suresh@logistics.in", pan: "AABCS1234A", gst: "27AABCS1234A1Z8", address: "Andheri East, Mumbai 400059", vehicles: 12, status: "active" },
  { id: "OWN-002", name: "Rao Transport Co", contact: "Krishna Rao", mobile: "9944099002", email: "rao@transport.com", pan: "AADCR5678B", gst: "33AADCR5678B1Z4", address: "T Nagar, Chennai 600017", vehicles: 8, status: "active" },
  { id: "OWN-003", name: "East Bengal Transport", contact: "Tapan Ghosh", mobile: "9830099003", email: "eb@transport.co", pan: "AABCE9012C", gst: "19AABCE9012C1Z6", address: "Park Street, Kolkata 700016", vehicles: 6, status: "active" },
  { id: "OWN-004", name: "Patel Fleet Owners", contact: "Nilesh Patel", mobile: "9763099004", email: "patel@fleet.net", pan: "AADCP3456D", gst: "27AADCP3456D1Z2", address: "Shivajinagar, Pune 411005", vehicles: 15, status: "active" },
  { id: "OWN-005", name: "Rajputana Owners", contact: "Raghuvir Rathore", mobile: "9414099005", email: "rajputana@owners.com", pan: "AABCR7890E", gst: "08AABCR7890E1Z6", address: "MI Road, Jaipur 302001", vehicles: 5, status: "inactive" },
]

// ─── Agents ──────────────────────────────────────────────────────────────────────
export const agents = [
  { id: "AGT-001", name: "Mehta Agency", contact: "Ankit Mehta", mobile: "9820077001", email: "ankit@mehta.agency", city: "Mumbai", state: "Maharashtra", commission: "2.5%", outstanding: 12500, status: "active" },
  { id: "AGT-002", name: "Southern Agency", contact: "Karthik Iyer", mobile: "9944077002", email: "karthik@southern.in", city: "Chennai", state: "Tamil Nadu", commission: "2%", outstanding: 8400, status: "active" },
  { id: "AGT-003", name: "Western Agents", contact: "Haresh Joshi", mobile: "9825077003", email: "haresh@western.com", city: "Ahmedabad", state: "Gujarat", commission: "3%", outstanding: 0, status: "active" },
  { id: "AGT-004", name: "Diamond Agency", contact: "Jayesh Desai", mobile: "9825077004", email: "jayesh@diamond.ag", city: "Surat", state: "Gujarat", commission: "2.5%", outstanding: 21000, status: "active" },
  { id: "AGT-005", name: "East India Agency", contact: "Soumya Das", mobile: "9830077005", email: "soumya@eastindia.in", city: "Kolkata", state: "West Bengal", commission: "2%", outstanding: 5600, status: "inactive" },
]

// ─── Masters ─────────────────────────────────────────────────────────────────────
export const articleMaster = [
  { id: "ART-001", name: "Electronics", description: "Televisions, mobiles, appliances", unit: "Box", fragile: true, status: "active" },
  { id: "ART-002", name: "Textile / Fabric", description: "Cloth, sarees, garments", unit: "Bale", fragile: false, status: "active" },
  { id: "ART-003", name: "Auto Parts", description: "Engine parts, accessories", unit: "Box", fragile: false, status: "active" },
  { id: "ART-004", name: "FMCG Goods", description: "Packaged food, personal care", unit: "Carton", fragile: false, status: "active" },
  { id: "ART-005", name: "Machinery", description: "Industrial equipment", unit: "Unit", fragile: false, status: "active" },
  { id: "ART-006", name: "Chemicals", description: "Industrial chemicals (non-hazardous)", unit: "Drum", fragile: true, status: "active" },
]

export const stationMaster = [
  { id: "STN-001", name: "Mumbai HQ", city: "Mumbai", state: "Maharashtra", type: "Branch", pincode: "400001", phone: "022-41234567", status: "active" },
  { id: "STN-002", name: "Delhi NCR", city: "Delhi", state: "Delhi", type: "Branch", pincode: "110020", phone: "011-41234567", status: "active" },
  { id: "STN-003", name: "Chennai", city: "Chennai", state: "Tamil Nadu", type: "Branch", pincode: "600002", phone: "044-41234567", status: "active" },
  { id: "STN-004", name: "Bangalore", city: "Bangalore", state: "Karnataka", type: "Booking Point", pincode: "560001", phone: "080-41234567", status: "active" },
  { id: "STN-005", name: "Hyderabad", city: "Hyderabad", state: "Telangana", type: "Delivery Point", pincode: "500001", phone: "040-41234567", status: "active" },
  { id: "STN-006", name: "Kolkata", city: "Kolkata", state: "West Bengal", type: "Branch", pincode: "700001", phone: "033-41234567", status: "active" },
  { id: "STN-007", name: "Pune", city: "Pune", state: "Maharashtra", type: "Booking Point", pincode: "411001", phone: "020-41234567", status: "active" },
]

// ─── Delivery ────────────────────────────────────────────────────────────────────
export const deliveries = [
  { lr: "LR-2846", consignee: "Lakshmi Stores", to: "Bangalore", receiver: "Suresh Kumar", mobile: "9944001111", deliveryDate: "29 Jul 2026", deliveryTime: "14:30", pod: true, otp: true, remarks: "Delivered to warehouse", freight: 12200, status: "delivered" },
  { lr: "LR-2843", consignee: "UP Distributors", to: "Lucknow", receiver: "Ramesh Gupta", mobile: "9415002222", deliveryDate: "27 Jul 2026", deliveryTime: "11:15", pod: true, otp: true, remarks: "", freight: 9600, status: "delivered" },
  { lr: "LR-2840", consignee: "Pune Suppliers", to: "Pune", receiver: "Nilesh Joshi", mobile: "9763003333", deliveryDate: "26 Jul 2026", deliveryTime: "16:45", pod: true, otp: false, remarks: "Partial delivery", freight: 11300, status: "delivered" },
  { lr: "LR-2847", consignee: "Sharma Enterprises", to: "Delhi", receiver: "", mobile: "", deliveryDate: "", deliveryTime: "", pod: false, otp: false, remarks: "", freight: 18500, status: "pending" },
  { lr: "LR-2845", consignee: "Reddy Transport Co", to: "Hyderabad", receiver: "", mobile: "", deliveryDate: "", deliveryTime: "", pod: false, otp: false, remarks: "", freight: 28000, status: "pending" },
]

// ─── Billing ─────────────────────────────────────────────────────────────────────
export const billingRecords = [
  { lr: "LR-2846", party: "Lakshmi Stores", amount: 12200, paid: 6000, outstanding: 6200, dueDate: "15 Aug 2026", receipt: "RCT-1021", paymentMode: "NEFT", paymentDate: "29 Jul 2026", status: "partial" },
  { lr: "LR-2843", party: "UP Distributors", amount: 9600, paid: 4000, outstanding: 5600, dueDate: "11 Aug 2026", receipt: "RCT-1020", paymentMode: "Cash", paymentDate: "27 Jul 2026", status: "partial" },
  { lr: "LR-2847", party: "Sharma Enterprises", amount: 18500, paid: 8000, outstanding: 10500, dueDate: "28 Aug 2026", receipt: "", paymentMode: "", paymentDate: "", status: "pending" },
  { lr: "LR-2845", party: "Reddy Transport Co", amount: 28000, paid: 12000, outstanding: 16000, dueDate: "18 Aug 2026", receipt: "RCT-1019", paymentMode: "Cheque", paymentDate: "28 Jul 2026", status: "partial" },
  { lr: "LR-2841", party: "MP Warehousing", amount: 16700, paid: 7500, outstanding: 9200, dueDate: "17 Aug 2026", receipt: "", paymentMode: "", paymentDate: "", status: "pending" },
  { lr: "LR-2836", party: "Kolkata Distributors", amount: 42000, paid: 20000, outstanding: 22000, dueDate: "25 Aug 2026", receipt: "RCT-1018", paymentMode: "NEFT", paymentDate: "25 Jul 2026", status: "partial" },
]

// ─── Users ───────────────────────────────────────────────────────────────────────
export const users = [
  { id: "USR-001", name: "Ganesh Bawane", email: "ganesh@transpos.in", role: "Admin", branch: "Mumbai HQ", lastLogin: "29 Jul 2026, 09:14", status: "active" },
  { id: "USR-002", name: "Priya Sharma", email: "priya@transpos.in", role: "Manager", branch: "Delhi NCR", lastLogin: "29 Jul 2026, 08:45", status: "active" },
  { id: "USR-003", name: "Karthik Iyer", email: "karthik@transpos.in", role: "Operator", branch: "Chennai", lastLogin: "28 Jul 2026, 17:30", status: "active" },
  { id: "USR-004", name: "Nisha Patel", email: "nisha@transpos.in", role: "Operator", branch: "Ahmedabad", lastLogin: "27 Jul 2026, 14:12", status: "active" },
  { id: "USR-005", name: "Suresh Babu", email: "suresh@transpos.in", role: "Viewer", branch: "Bangalore", lastLogin: "25 Jul 2026, 11:00", status: "inactive" },
]

export const revenueData = [
  { month: "Jan", revenue: 420000, lrs: 210 },
  { month: "Feb", revenue: 480000, lrs: 240 },
  { month: "Mar", revenue: 510000, lrs: 255 },
  { month: "Apr", revenue: 490000, lrs: 245 },
  { month: "May", revenue: 560000, lrs: 280 },
  { month: "Jun", revenue: 620000, lrs: 310 },
  { month: "Jul", revenue: 580000, lrs: 290 }
]

export const shipments = lrRecords
