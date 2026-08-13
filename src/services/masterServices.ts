import { vehicleRepository, driverRepository, ownerRepository, agentRepository } from "../repositories/repositories"
import { DBVehicle, DBDriver, DBOwner, DBAgent } from "../db/schema"

export const masterServices = {
  // Vehicles
  getVehicles: async (): Promise<DBVehicle[]> => vehicleRepository.findAll(),
  addVehicle: async (v: Partial<DBVehicle>) => {
    if (!v.number || !v.number.trim()) throw new Error("Vehicle number is required")
    return await vehicleRepository.create({
      number: v.number.trim().toUpperCase(),
      type: v.type || "Trailer",
      capacity: v.capacity || "18T",
      owner: v.owner || "In-house Fleet",
      driver: v.driver || "Unassigned",
      gpsId: v.gpsId || "",
      rc: v.rc || "31 Dec 2028",
      insurance: v.insurance || "15 Mar 2028",
      fitness: v.fitness || "10 Aug 2027",
      permit: v.permit || "30 Nov 2027",
      puc: v.puc || "15 Sep 2027",
      status: v.status || "active"
    })
  },
  updateVehicle: async (id: string, updates: Partial<DBVehicle>) => {
    const existing = await vehicleRepository.findById(id)
    if (!existing) return null
    return await vehicleRepository.save({ ...existing, ...updates, updatedAt: new Date().toISOString() })
  },
  deleteVehicle: async (id: string) => vehicleRepository.softDelete(id),

  // Drivers
  getDrivers: async (): Promise<DBDriver[]> => driverRepository.findAll(),
  addDriver: async (d: Partial<DBDriver>) => {
    if (!d.name || !d.name.trim()) throw new Error("Driver name is required")
    return await driverRepository.create({
      name: d.name.trim(),
      mobile: d.mobile || "9820000000",
      altMobile: d.altMobile || "",
      license: d.license || "MH-12-20220011223",
      licenseExpiry: d.licenseExpiry || "15 Mar 2030",
      aadhaar: d.aadhaar || "XXXX-XXXX-9999",
      address: d.address || "Standard Depot Address",
      emergency: d.emergency || "Family · 9820000001",
      vehicle: d.vehicle || "Unassigned",
      experience: d.experience || "5 yrs",
      status: d.status || "active"
    })
  },
  updateDriver: async (id: string, updates: Partial<DBDriver>) => {
    const existing = await driverRepository.findById(id)
    if (!existing) return null
    return await driverRepository.save({ ...existing, ...updates, updatedAt: new Date().toISOString() })
  },
  deleteDriver: async (id: string) => driverRepository.softDelete(id),

  // Vehicle Owners
  getOwners: async (): Promise<DBOwner[]> => ownerRepository.findAll(),
  addOwner: async (o: Partial<DBOwner>) => {
    if (!o.name || !o.name.trim()) throw new Error("Owner name is required")
    return await ownerRepository.create({
      name: o.name.trim(),
      contact: o.contact || o.name.trim(),
      mobile: o.mobile || "9820099999",
      email: o.email || "owner@transpos.in",
      pan: o.pan || "AABCS9999A",
      gst: o.gst || "27AABCS9999A1Z8",
      address: o.address || "Hub Depot Office",
      vehicles: o.vehicles || 1,
      status: o.status || "active"
    })
  },
  updateOwner: async (id: string, updates: Partial<DBOwner>) => {
    const existing = await ownerRepository.findById(id)
    if (!existing) return null
    return await ownerRepository.save({ ...existing, ...updates, updatedAt: new Date().toISOString() })
  },
  deleteOwner: async (id: string) => ownerRepository.softDelete(id),

  // Agents
  getAgents: async (): Promise<DBAgent[]> => agentRepository.findAll(),
  addAgent: async (a: Partial<DBAgent>) => {
    if (!a.name || !a.name.trim()) throw new Error("Agent name is required")
    return await agentRepository.create({
      name: a.name.trim(),
      contact: a.contact || a.name.trim(),
      mobile: a.mobile || "9820088888",
      email: a.email || "agent@transpos.in",
      city: a.city || "Mumbai",
      state: a.state || "Maharashtra",
      commission: a.commission || "2.5%",
      outstanding: a.outstanding || 0,
      status: a.status || "active"
    })
  },
  updateAgent: async (id: string, updates: Partial<DBAgent>) => {
    const existing = await agentRepository.findById(id)
    if (!existing) return null
    return await agentRepository.save({ ...existing, ...updates, updatedAt: new Date().toISOString() })
  },
  deleteAgent: async (id: string) => agentRepository.softDelete(id)
}
