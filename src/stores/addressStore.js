import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandSafeStorage } from '@/utils/storage'
import { PRESET_CAMPUS_LOCATIONS } from '@/utils/checkoutValidation'
import { useAuthStore } from '@/stores/authStore'

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
 * Formats detailed room, wing, floor, landmark, and delivery instructions
 * from a saved spot into a single compatible instructions string for checkout forms.
 */
export function formatSpotDeliveryDetails(spot) {
  if (!spot) return ''
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
    const lm = spot.landmark.trim()
    parts.push(lm.toLowerCase().startsWith('near') ? lm : `Near ${lm.replace(/^near\s+/i, '')}`)
  }
  if (spot.deliveryInstructions) {
    parts.push(spot.deliveryInstructions.trim())
  }
  return parts.join(', ')
}

/**
 * Recovers, sanitizes, and normalizes persisted location records from client storage.
 * Enforces user ownership when expectedUserId is provided.
 * Gracefully handles non-arrays, missing IDs/labels, corrupted items, and conflicting defaults.
 */
export function sanitizeStoredLocations(rawList, expectedUserId = null) {
  if (!Array.isArray(rawList)) return []

  const valid = []
  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue
    if (!item.id || typeof item.id !== 'string') continue
    if (!item.label || typeof item.label !== 'string') continue
    if (!item.campusLocation || typeof item.campusLocation !== 'string') continue

    // If expectedUserId is specified, prevent cross-user leakage
    if (expectedUserId && item.userId && item.userId !== expectedUserId) {
      continue
    }

    valid.push({
      id: String(item.id),
      userId: item.userId ? String(item.userId) : expectedUserId || undefined,
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

const getInitialUserId = () => useAuthStore?.getState?.()?.user?.id || null

/**
 * Account-isolated customer address store with deterministic client persistence.
 * Each authenticated user can access only their own saved locations.
 */
export const useAddressStore = create(
  persist(
    (set, get) => ({
      activeUserId: getInitialUserId(),
      locations: [],
      locationsByUser: {},
      isLoading: false,

      /**
       * Resolves the current authoritative active user ID from authStore or store.
       * Synchronizes store state if an auth session transition occurred.
       */
      resolveActiveUserId() {
        const authUser = useAuthStore?.getState?.()?.user
        const authUserId = authUser?.id ? String(authUser.id) : null
        if (!authUserId) {
          if (get().activeUserId !== null) {
            set({ activeUserId: null, locations: [] })
          }
          return null
        }
        if (get().activeUserId !== authUserId) {
          get().setActiveUser(authUserId)
        }
        return authUserId
      },

      /**
       * Switches active user session.
       * Immediately isolates and exposes only the active user's locations.
       * When userId is null (logout or unauthenticated), clears in-memory locations to [].
       */
      setActiveUser(userId) {
        const cleanUserId = userId ? String(userId) : null
        set((state) => {
          const userLocations =
            cleanUserId && state.locationsByUser[cleanUserId]
              ? sanitizeStoredLocations(state.locationsByUser[cleanUserId], cleanUserId)
              : []
          return {
            activeUserId: cleanUserId,
            locations: userLocations,
          }
        })
      },

      /**
       * Adds a new validated delivery spot for the active authenticated user.
       */
      addLocation(data) {
        const activeUserId = get().resolveActiveUserId()
        if (!activeUserId) {
          throw new Error('Authentication required to save delivery spots.')
        }

        const validation = validateAddressInput(data)
        if (!validation.isValid) {
          const firstErr = Object.values(validation.errors)[0]
          throw new Error(firstErr)
        }

        const now = new Date().toISOString()
        const id = generateLocationId()
        const currentLocations = get().locationsByUser[activeUserId] || []
        const shouldBeDefault = Boolean(data.isDefault) || currentLocations.length === 0

        const newLocation = {
          id,
          userId: activeUserId,
          ...validation.sanitized,
          isDefault: shouldBeDefault,
          createdAt: now,
          updatedAt: now,
        }

        let updatedList = [...currentLocations]
        if (shouldBeDefault) {
          updatedList = updatedList.map((loc) => ({ ...loc, isDefault: false }))
        }
        const sanitizedList = sanitizeStoredLocations([...updatedList, newLocation], activeUserId)

        set((state) => ({
          activeUserId,
          locations: sanitizedList,
          locationsByUser: {
            ...state.locationsByUser,
            [activeUserId]: sanitizedList,
          },
        }))

        return newLocation
      },

      /**
       * Updates an existing delivery spot by ID for the active authenticated user.
       */
      updateLocation(id, updates) {
        const activeUserId = get().resolveActiveUserId()
        if (!activeUserId) {
          throw new Error('Authentication required to update delivery spots.')
        }

        const currentLocations = get().locationsByUser[activeUserId] || []
        const existing = currentLocations.find((l) => l.id === id)
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

        const updatedList = currentLocations.map((loc) => {
          if (loc.id === id) {
            return {
              ...loc,
              userId: activeUserId,
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
        const sanitizedList = sanitizeStoredLocations(updatedList, activeUserId)

        set((state) => ({
          activeUserId,
          locations: sanitizedList,
          locationsByUser: {
            ...state.locationsByUser,
            [activeUserId]: sanitizedList,
          },
        }))

        return sanitizedList.find((l) => l.id === id)
      },

      /**
       * Removes a delivery spot by ID for the active authenticated user.
       * If deleted spot was default, automatically designates the next available spot as default.
       */
      deleteLocation(id) {
        const activeUserId = get().resolveActiveUserId()
        if (!activeUserId) {
          throw new Error('Authentication required to delete delivery spots.')
        }

        const currentLocations = get().locationsByUser[activeUserId] || []
        const remaining = currentLocations.filter((l) => l.id !== id)
        const sanitizedList = sanitizeStoredLocations(remaining, activeUserId)

        set((state) => ({
          activeUserId,
          locations: sanitizedList,
          locationsByUser: {
            ...state.locationsByUser,
            [activeUserId]: sanitizedList,
          },
        }))
      },

      /**
       * Sets a delivery spot as the default location for the active user.
       */
      setDefaultLocation(id) {
        const activeUserId = get().resolveActiveUserId()
        if (!activeUserId) {
          throw new Error('Authentication required to set default delivery spot.')
        }

        const currentLocations = get().locationsByUser[activeUserId] || []
        const target = currentLocations.find((l) => l.id === id)
        if (!target) return

        const updatedList = currentLocations.map((loc) => ({
          ...loc,
          isDefault: loc.id === id,
        }))
        const sanitizedList = sanitizeStoredLocations(updatedList, activeUserId)

        set((state) => ({
          activeUserId,
          locations: sanitizedList,
          locationsByUser: {
            ...state.locationsByUser,
            [activeUserId]: sanitizedList,
          },
        }))
      },

      /**
       * Returns designated default location for active user, or null if unauthenticated.
       */
      getDefaultLocation() {
        const activeUserId = get().resolveActiveUserId()
        if (!activeUserId) return null
        const locations = get().locations
        return locations.find((l) => l.isDefault) || locations[0] || null
      },

      /**
       * Returns all saved locations for active user, or [] if unauthenticated.
       */
      getLocations() {
        const activeUserId = get().resolveActiveUserId()
        if (!activeUserId) return []
        return get().locations
      },

      /**
       * Resets in-memory locations and saved user records (useful for test isolation).
       */
      reset() {
        const currentUserId = useAuthStore?.getState?.()?.user?.id || null
        set({
          activeUserId: currentUserId,
          locations: [],
          locationsByUser: {},
          isLoading: false,
        })
      },

      /**
       * Raw setter for testing recovery from corrupted or migrated records.
       */
      setLocations(raw) {
        const activeUserId = get().resolveActiveUserId()
        if (!activeUserId) {
          throw new Error('Authentication required to set delivery spots.')
        }
        const sanitized = sanitizeStoredLocations(raw, activeUserId)
        set((state) => ({
          activeUserId,
          locations: sanitized,
          locationsByUser: {
            ...state.locationsByUser,
            [activeUserId]: sanitized,
          },
        }))
      },
    }),
    {
      name: ADDRESS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => zustandSafeStorage),
      partialize: (state) => ({
        locationsByUser: state.locationsByUser,
      }),
      migrate(persistedState, version) {
        // Migration from version 0 (shared un-scoped storage):
        // Old records have no verified ownership. To prevent cross-account exposure,
        // do NOT assign legacy records to any user. Discard safely.
        if (version === 0 || !persistedState?.locationsByUser) {
          return {
            locationsByUser: {},
          }
        }
        return persistedState
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const sanitizedByUser = {}
        if (state.locationsByUser && typeof state.locationsByUser === 'object') {
          for (const [uid, list] of Object.entries(state.locationsByUser)) {
            if (uid && Array.isArray(list)) {
              sanitizedByUser[uid] = sanitizeStoredLocations(list, uid)
            }
          }
        }
        state.locationsByUser = sanitizedByUser

        const currentUserId = useAuthStore?.getState?.()?.user?.id || null
        state.activeUserId = currentUserId
        state.locations =
          currentUserId && sanitizedByUser[currentUserId]
            ? sanitizedByUser[currentUserId]
            : []
      },
    },
  ),
)

// Automatically synchronize activeUserId on any authStore state change
if (typeof useAuthStore !== 'undefined' && typeof useAuthStore.subscribe === 'function') {
  useAuthStore.subscribe((state, prevState) => {
    const prevId = prevState?.user?.id || null
    const currentId = state?.user?.id || null
    if (prevId !== currentId) {
      useAddressStore.getState().setActiveUser(currentId)
    }
  })
}
