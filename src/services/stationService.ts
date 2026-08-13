import { stationRepository } from "../repositories/repositories"
import { DBStation } from "../db/schema"

export type Station = DBStation

export const stationService = {
  getAllStations: async (): Promise<Station[]> => {
    return await stationRepository.findAll()
  },

  getActiveStations: async (): Promise<Station[]> => {
    return await stationRepository.findActive()
  },

  createStation: async (stn: Partial<Station>): Promise<Station> => {
    if (!stn.name || !stn.name.trim()) throw new Error("Station name is required")
    return await stationRepository.create({
      name: stn.name.trim(),
      city: stn.city || stn.name.trim(),
      state: stn.state || "",
      type: stn.type || "Branch",
      pincode: stn.pincode || "",
      phone: stn.phone || "",
      status: stn.status || "active"
    })
  },

  updateStation: async (id: string, updates: Partial<Station>): Promise<Station | null> => {
    const existing = await stationRepository.findById(id)
    if (!existing) return null
    const updated: Station = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    return await stationRepository.save(updated)
  },

  deleteStation: async (id: string): Promise<boolean> => {
    return await stationRepository.softDelete(id)
  }
}
