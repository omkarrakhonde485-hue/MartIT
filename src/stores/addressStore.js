import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandSafeStorage } from '@/utils/storage'
import { PRESET_CAMPUS_LOCATIONS } from '@/utils/checkoutValidation'

export const ADDRESS_STORAGE_KEY = 'martit-saved-addresses'

/**
 * Generates a collision-resistant unique identifier for saved locations.
 */
export function generateLocationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `loc_${crypto.randomUUID()}`
  }
  return `loc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Validates and normalizes address input fields.
 * Guarantees required fields, length boundaries, and trims whitespace.
 */
export function validateAddressInput({
  label,
  campusLocation,
  customBuilding,
  wing,
  floor,
  roomNumber,
  landmark,
  deliveryInstructions,
}) {
  const errors = {}

  const cleanLabel = (label || '').trim()
  if (!cleanLabel) {
    errors.label = 'Please enter a label for this spot (e.g. My Hostel Room).'
  } else if (cleanLabel.length < 2) {
    errors.label = 'Spot label must be at least 2 characters.'
  } else if (cleanLabel.length > 50) {
    errors.label = 'Spot label cannot exceed 50 characters.'
  }

  const cleanLocation = (campusLocation || '').trim()
  const isOther =
    cleanLocation === 'other' ||
    cleanLocation === 'Other / Enter address' ||
    cleanLocation === 'Other / Custom building'

  if (!cleanLocation) {
    errors.campusLocation = 'Please select a campus building or location.'
  } else if (isOther) {
    const cleanCustom = (customBuilding || '').trim()
    if (!cleanCustom) {
      errors.customBuilding = 'Please enter your building or location name.'
    } else if (cleanCustom.length < 2) {
      errors.customBuilding = 'Building name must be at least 2 characters.'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      label: cleanLabel,
      campusLocation: cleanLocation,
      customBuilding: (customBuilding || '').trim(),
      wing: (wing || '').trim(),
      floor: (floor || '').trim(),
      roomNumber: (roomNumber || '').trim(),
      landmark: (landmark || '').trim(),
      deliveryInstructions: (deliveryInstructions || '').trim(),
    },
  }
}

/**
 * Formats a saved location record into a clean, human-readable summary.
 */
export function formatSavedLocation(spot) {
  if (!spot) return ''
  const isOther =
    spot.campusLocation === 'other' ||
    spot.campusLocation === 'Other / Enter address' ||
    spot.campusLocation === 'Other / Custom building'
  const baseName = isOther
    ? (spot.customBuilding || spot.building || 'Campus Destination')
    : spot.campusLocation

  const parts = []
  if (spot.roomNumber) parts.push(`Room ${spot.roomNumber}`)
  if (spot.floor) {
    const fl = spot.floor.trim()
    parts.push(fl.toLowerCase().includes('floor') ? fl : `${fl} Floor`)
  }
  if (spot.wing) {
    const w = spot.wing.trim()
    parts.push(w.toLowerCase().includes('wing') ? w : `${w} Wing`)
  }
  if (spot.landmark) {
    parts.push(`Near ${spot.landmark.replace(/^near\s+/i, '')}`)
  }

  if (parts.length === 0) return baseName
  return `${baseName} • ${parts.join(', ')}`
}

/**
 * Recovers, sanitizes, and normalizes persisted location records from client storage.
 * Gracefully handles non-arrays, missing IDs/labels, corrupted items, and conflicting defaults.
 */
export function sanitizeStoredLocations(rawList) {
  if (!Array.isArray(rawList)) return []

  const valid = []
  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue
    if (!item.id || typeof item.id !== 'string') continue
    if (!item.label || typeof item.label !== 'string') continue
    if (!item.campusLocation || typeof item.campusLocation !== 'string') continue

    valid.push({
      id: String(item.id),
      label: String(item.label).trim(),
      campusLocation: String(item.campusLocation).trim(),
      customBuilding: item.customBuilding ? String(item.customBuilding).trim() : '',
      building: item.building ? String(item.building).trim() : '',
      wing: item.wing ? String(item.wing).trim() : '',
      floor: item.floor ? String(item.floor).trim() : '',
      roomNumber: item.roomNumber ? String(item.roomNumber).trim() : '',
      landmark: item.landmark ? String(item.landmark).trim() : '',
      deliveryInstructions: item.deliveryInstructions ? String(item.deliveryInstructions).trim() : '',
      isDefault: Boolean(item.isDefault),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    })
  }

  // Invariant: At most one location is default. If locations exist and none is marked default, set the first.
  if (valid.length > 0) {
    const defaultIndices = valid
      .map((loc, idx) => (loc.isDefault ? idx : -1))
      .filter((idx) => idx !== -1)

    if (defaultIndices.length === 0) {
      valid[0].isDefault = true
    } else if (defaultIndices.length > 1) {
      for (let i = 1; i < defaultIndices.length; i++) {
        valid[defaultIndices[i]].isDefault = false
      }
    }
  }

  return valid
}

/**
 * Isolated customer address store with deterministic client persistence.
 */
export const useAddressStore = create(
  persist(
    (set, get) => ({
      locations: [],
      isLoading: false,

      /**
       * Adds a new validated delivery spot.
       * If marked as default or if it's the only spot, enforces single-default invariant.
       */
      addLocation(data) {
        const validation = validateAddressInput(data)
        if (!validation.isValid) {
          const firstErr = Object.values(validation.errors)[0]
          throw new Error(firstErr)
        }

        const now = new Date().toISOString()
        const id = generateLocationId()
        const existing = get().locations
        const shouldBeDefault = Boolean(data.isDefault) || existing.length === 0

        const newLocation = {
          id,
          ...validation.sanitized,
          isDefault: shouldBeDefault,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => {
          let updatedList = [...state.locations]
          if (shouldBeDefault) {
            updatedList = updatedList.map((loc) => ({ ...loc, isDefault: false }))
          }
          return {
            locations: sanitizeStoredLocations([...updatedList, newLocation]),
          }
        })

        return newLocation
      },

      /**
       * Updates an existing delivery spot by ID with full validation.
       */
      updateLocation(id, updates) {
        const existing = get().locations.find((l) => l.id === id)
        if (!existing) {
          throw new Error('Delivery spot not found.')
        }

        const merged = { ...existing, ...updates }
        const validation = validateAddressInput(merged)
        if (!validation.isValid) {
          const firstErr = Object.values(validation.errors)[0]
          throw new Error(firstErr)
        }

        const now = new Date().toISOString()
        const shouldBeDefault =
          updates.isDefault !== undefined ? Boolean(updates.isDefault) : existing.isDefault

        set((state) => {
          const list = state.locations.map((loc) => {
            if (loc.id === id) {
              return {
                ...loc,
                ...validation.sanitized,
                isDefault: shouldBeDefault,
                updatedAt: now,
              }
            }
            if (shouldBeDefault) {
              return { ...loc, isDefault: false }
            }
            return loc
          })

          return { locations: sanitizeStoredLocations(list) }
        })

        return get().locations.find((l) => l.id === id)
      },

      /**
       * Removes a delivery spot by ID.
       * If the deleted spot was default, automatically designates the first remaining spot as default.
       * If the list becomes empty, default safely resets to null.
       */
      deleteLocation(id) {
        set((state) => {
          const remaining = state.locations.filter((l) => l.id !== id)
          return { locations: sanitizeStoredLocations(remaining) }
        })
      },

      /**
       * Sets a delivery spot as the default location and unsets all others.
       */
      setDefaultLocation(id) {
        set((state) => {
          const target = state.locations.find((l) => l.id === id)
          if (!target) return state

          const list = state.locations.map((loc) => ({
            ...loc,
            isDefault: loc.id === id,
          }))
          return { locations: list }
        })
      },

      /**
       * Returns the designated default location, or the first location if none marked, or null.
       */
      getDefaultLocation() {
        const locations = get().locations
        return locations.find((l) => l.isDefault) || locations[0] || null
      },

      /**
       * Resets the store to an empty state.
       */
      reset() {
        set({ locations: [], isLoading: false })
      },

      /**
       * Raw setter for testing recovery from corrupted or migrated records.
       */
      setLocations(raw) {
        set({ locations: sanitizeStoredLocations(raw) })
      },
    }),
    {
      name: ADDRESS_STORAGE_KEY,
      storage: createJSONStorage(() => zustandSafeStorage),
      partialize: (state) => ({ locations: state.locations }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.locations = sanitizeStoredLocations(state.locations)
        }
      },
    },
  ),
)
