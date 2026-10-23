import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import ProfilePage from '@/pages/customer/ProfilePage'
import { SavedLocationsCard } from '@/components/customer/SavedLocationsCard'
import { SavedLocationModal, SavedLocationForm } from '@/components/customer/SavedLocationModal'
import {
  useAddressStore,
  validateAddressInput,
  formatSavedLocation,
  sanitizeStoredLocations,
  ADDRESS_STORAGE_KEY,
} from '@/stores/addressStore'
import { useAuthStore } from '@/stores/authStore'
import { ROLES } from '@/utils/permissions'

describe('Milestone 3: Customer Profile & Saved Delivery Spots', () => {
  beforeEach(() => {
    // Reset address store state before each test
    useAddressStore.getState().reset()

    // Default authenticated customer user
    useAuthStore.setState({
      user: {
        id: 'usr_customer_aarav',
        name: 'Aarav Patel',
        email: 'aarav@campus.edu',
        phone: '+919876543210',
        roles: [ROLES.CUSTOMER],
        runnerStatus: null,
      },
      token: 'tok_mock_customer',
    })
  })

  // 1. Existing Profile content remains intact
  describe('1. Existing Profile Content Preservation', () => {
    it('renders customer account details, badges, and runner application card', () => {
      const html = renderToString(
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>,
      )

      // Account Details Card
      expect(html).toContain('My Profile')
      expect(html).toContain('Aarav Patel')
      expect(html).toContain('aarav@campus.edu')
      expect(html).toContain('+919876543210')
      expect(html).toContain('Customer')

      // Runner & Delivery Modes Card
      expect(html).toContain('Runner &amp; Delivery Modes')
      expect(html).toContain('Earn by Delivering on Campus')
      expect(html).toContain('Apply as Runner')

      // Saved Delivery Spots Section is present
      expect(html).toContain('Saved Delivery Spots')
    })

    it('renders Approved Runner status with mode switch button when user has runner permissions', () => {
      useAuthStore.setState({
        user: {
          id: 'usr_runner_rob',
          name: 'Rob Runner',
          email: 'rob@campus.edu',
          phone: '+919876543211',
          roles: [ROLES.CUSTOMER, ROLES.RUNNER],
          runnerStatus: 'approved',
        },
        token: 'tok_runner',
      })

      const html = renderToString(
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>,
      )

      expect(html).toContain('Approved Runner')
      expect(html).toContain('Runner Privileges Active')
      expect(html).toContain('Switch to Runner Mode')
      expect(html).toContain('id="profile-switch-runner-btn"')
      expect(html).toContain('href="/runner"')
    })

    it('renders Runner Application Pending Review notice for applicant user', () => {
      useAuthStore.setState({
        user: {
          id: 'usr_applicant_alex',
          name: 'Alex Applicant',
          email: 'alex@campus.edu',
          roles: [ROLES.CUSTOMER],
          runnerStatus: 'applicant',
        },
        token: 'tok_applicant',
      })

      const html = renderToString(
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>,
      )

      expect(html).toContain('Runner Applicant')
      expect(html).toContain('Runner Application Pending Review')
    })

    it('renders Runner Privileges Suspended notice for suspended runner', () => {
      useAuthStore.setState({
        user: {
          id: 'usr_suspended_sam',
          name: 'Sam Suspended',
          email: 'sam@campus.edu',
          roles: [ROLES.CUSTOMER],
          runnerStatus: 'suspended',
        },
        token: 'tok_suspended',
      })

      const html = renderToString(
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>,
      )

      expect(html).toContain('Runner Suspended')
      expect(html).toContain('Runner Privileges Suspended')
    })
  })

  // 2. Empty saved-location state
  describe('2. Empty Saved-Location State', () => {
    it('renders friendly empty state with prompt when no locations are saved', () => {
      useAddressStore.setState({ locations: [] })

      const html = renderToString(
        <MemoryRouter>
          <SavedLocationsCard />
        </MemoryRouter>,
      )

      expect(html).toContain('data-testid="saved-locations-empty-state"')
      expect(html).toContain('No saved delivery spots yet')
      expect(html).toContain('Save your hostel room, academic department, or campus meeting point')
      expect(html).toContain('Add Your First Spot')
      expect(html).toContain('data-testid="empty-add-spot-btn"')
    })
  })

  // 3. Adding a valid location
  describe('3. Adding a Valid Delivery Location', () => {
    it('adds a valid preset location, assigns stable ID, and sets first location as default', () => {
      const added = useAddressStore.getState().addLocation({
        label: 'My Hostel Room',
        campusLocation: 'A Block',
        wing: 'North Wing',
        floor: '2nd Floor',
        roomNumber: '204',
        landmark: 'Near water cooler',
        deliveryInstructions: 'Call upon arrival at the gate',
      })

      expect(added.id).toMatch(/^loc_/)
      expect(added.label).toBe('My Hostel Room')
      expect(added.campusLocation).toBe('A Block')
      expect(added.roomNumber).toBe('204')
      expect(added.isDefault).toBe(true)

      const storeLocations = useAddressStore.getState().locations
      expect(storeLocations.length).toBe(1)
      expect(storeLocations[0].id).toBe(added.id)

      // Test rendering in SavedLocationsCard
      const html = renderToString(
        <MemoryRouter>
          <SavedLocationsCard />
        </MemoryRouter>,
      )

      expect(html).toContain('My Hostel Room')
      expect(html).toContain('A Block')
      expect(html).toContain('Room 204')
      expect(html).toContain('Default')
      expect(html).toContain('Near water cooler')
      expect(html).toContain('Call upon arrival at the gate')
    })

    it('adds a custom location destination when campusLocation is other', () => {
      const added = useAddressStore.getState().addLocation({
        label: 'Robotics Lab',
        campusLocation: 'other',
        customBuilding: 'Mechanical Department Annex',
        floor: 'Ground',
        roomNumber: 'Lab 03',
        deliveryInstructions: 'Leave with lab technician if occupied',
      })

      expect(added.label).toBe('Robotics Lab')
      expect(added.campusLocation).toBe('other')
      expect(added.customBuilding).toBe('Mechanical Department Annex')

      const formatted = formatSavedLocation(added)
      expect(formatted).toContain('Mechanical Department Annex')
      expect(formatted).toContain('Room Lab 03')
      expect(formatted).toContain('Ground Floor')
    })
  })

  // 4. Validation of missing or invalid fields
  describe('4. Input Validation & Error Handling', () => {
    it('rejects empty or whitespace-only spot labels', () => {
      const result = validateAddressInput({
        label: '   ',
        campusLocation: 'B Block',
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.label).toBe('Please enter a label for this spot (e.g. My Hostel Room).')
    })

    it('rejects spot labels shorter than 2 characters', () => {
      const result = validateAddressInput({
        label: 'X',
        campusLocation: 'B Block',
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.label).toBe('Spot label must be at least 2 characters.')
    })

    it('rejects spot labels longer than 50 characters', () => {
      const result = validateAddressInput({
        label: 'A'.repeat(51),
        campusLocation: 'B Block',
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.label).toBe('Spot label cannot exceed 50 characters.')
    })

    it('rejects empty campusLocation selection', () => {
      const result = validateAddressInput({
        label: 'Study Room',
        campusLocation: '',
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.campusLocation).toBe('Please select a campus building or location.')
    })

    it('rejects custom building when other is selected but custom building name is missing', () => {
      const result = validateAddressInput({
        label: 'Off-Campus Hub',
        campusLocation: 'other',
        customBuilding: '',
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.customBuilding).toBe('Please enter your building or location name.')
    })

    it('throws error when addLocation is called with invalid input', () => {
      expect(() => {
        useAddressStore.getState().addLocation({
          label: '',
          campusLocation: 'A Block',
        })
      }).toThrow('Please enter a label for this spot')
    })
  })

  // 5. Editing a saved location
  describe('5. Editing a Saved Delivery Location', () => {
    it('updates location details and preserves stable ID', () => {
      const spot = useAddressStore.getState().addLocation({
        label: 'Old Label',
        campusLocation: 'C Block',
        roomNumber: '101',
      })

      const updated = useAddressStore.getState().updateLocation(spot.id, {
        label: 'New Hostel Room',
        campusLocation: 'C Block',
        roomNumber: '105',
        floor: '1st Floor',
        deliveryInstructions: 'Ring doorbell twice',
      })

      expect(updated.id).toBe(spot.id)
      expect(updated.label).toBe('New Hostel Room')
      expect(updated.roomNumber).toBe('105')
      expect(updated.floor).toBe('1st Floor')
      expect(updated.deliveryInstructions).toBe('Ring doorbell twice')

      const storeSpots = useAddressStore.getState().locations
      expect(storeSpots[0].label).toBe('New Hostel Room')
    })

    it('throws when updating a non-existent location ID', () => {
      expect(() => {
        useAddressStore.getState().updateLocation('loc_non_existent', {
          label: 'Ghost Room',
          campusLocation: 'A Block',
        })
      }).toThrow('Delivery spot not found.')
    })
  })

  // 6. Selecting a default location
  describe('6. Selecting Default Location', () => {
    it('sets a designated location as default and unsets the previous default', () => {
      const spot1 = useAddressStore.getState().addLocation({
        label: 'Spot 1',
        campusLocation: 'A Block',
      })
      const spot2 = useAddressStore.getState().addLocation({
        label: 'Spot 2',
        campusLocation: 'B Block',
      })

      expect(spot1.isDefault).toBe(true)
      expect(spot2.isDefault).toBe(false)

      useAddressStore.getState().setDefaultLocation(spot2.id)

      const spots = useAddressStore.getState().locations
      const s1 = spots.find((s) => s.id === spot1.id)
      const s2 = spots.find((s) => s.id === spot2.id)

      expect(s1.isDefault).toBe(false)
      expect(s2.isDefault).toBe(true)

      const defaultSpot = useAddressStore.getState().getDefaultLocation()
      expect(defaultSpot.id).toBe(spot2.id)
    })
  })

  // 7. Ensuring only one default location exists
  describe('7. Single Default Invariant Enforcement', () => {
    it('guarantees exactly one default exists when adding multiple default candidates', () => {
      const s1 = useAddressStore.getState().addLocation({
        label: 'First',
        campusLocation: 'A Block',
        isDefault: true,
      })
      const s2 = useAddressStore.getState().addLocation({
        label: 'Second',
        campusLocation: 'B Block',
        isDefault: true,
      })
      const s3 = useAddressStore.getState().addLocation({
        label: 'Third',
        campusLocation: 'C Block',
        isDefault: true,
      })

      const spots = useAddressStore.getState().locations
      const defaults = spots.filter((s) => s.isDefault)

      expect(defaults.length).toBe(1)
      expect(defaults[0].id).toBe(s3.id)
    })
  })

  // 8. Deleting a non-default location
  describe('8. Deleting a Non-Default Location', () => {
    it('removes non-default location without changing the default location', () => {
      const s1 = useAddressStore.getState().addLocation({
        label: 'Default Spot',
        campusLocation: 'A Block',
        isDefault: true,
      })
      const s2 = useAddressStore.getState().addLocation({
        label: 'Secondary Spot',
        campusLocation: 'B Block',
        isDefault: false,
      })

      expect(useAddressStore.getState().locations.length).toBe(2)

      useAddressStore.getState().deleteLocation(s2.id)

      const remaining = useAddressStore.getState().locations
      expect(remaining.length).toBe(1)
      expect(remaining[0].id).toBe(s1.id)
      expect(remaining[0].isDefault).toBe(true)
    })
  })

  // 9. Deleting the default location and maintaining valid state
  describe('9. Deleting Default Location & Reassignment Safeguards', () => {
    it('promotes the next available location to default when the default spot is deleted', () => {
      const s1 = useAddressStore.getState().addLocation({
        label: 'Spot 1 (Default)',
        campusLocation: 'A Block',
        isDefault: true,
      })
      const s2 = useAddressStore.getState().addLocation({
        label: 'Spot 2 (Backup)',
        campusLocation: 'B Block',
        isDefault: false,
      })

      // Delete the default spot s1
      useAddressStore.getState().deleteLocation(s1.id)

      const remaining = useAddressStore.getState().locations
      expect(remaining.length).toBe(1)
      expect(remaining[0].id).toBe(s2.id)
      expect(remaining[0].isDefault).toBe(true)

      const currentDefault = useAddressStore.getState().getDefaultLocation()
      expect(currentDefault.id).toBe(s2.id)
    })

    it('safely handles deleting the last remaining location leaving empty state with null default', () => {
      const spot = useAddressStore.getState().addLocation({
        label: 'Only Spot',
        campusLocation: 'A Block',
      })

      useAddressStore.getState().deleteLocation(spot.id)

      const remaining = useAddressStore.getState().locations
      expect(remaining.length).toBe(0)
      expect(useAddressStore.getState().getDefaultLocation()).toBeNull()
    })
  })

  // 10. Persistence across reload/remount
  describe('10. Client Persistence & Hydration', () => {
    it('serializes to storage key and rehydrates with identical content', () => {
      const spot = useAddressStore.getState().addLocation({
        label: 'Hostel B Room 302',
        campusLocation: 'B Block',
        wing: 'West Wing',
        floor: '3rd Floor',
        roomNumber: '302',
        landmark: 'Facing basketball court',
        deliveryInstructions: 'Leave with warden if not answered',
      })

      // Simulate rehydration from persisted storage JSON
      const serialized = JSON.stringify({
        state: { locations: useAddressStore.getState().locations },
        version: 0,
      })

      const parsed = JSON.parse(serialized)
      const sanitized = sanitizeStoredLocations(parsed.state.locations)

      expect(sanitized.length).toBe(1)
      expect(sanitized[0].id).toBe(spot.id)
      expect(sanitized[0].label).toBe('Hostel B Room 302')
      expect(sanitized[0].landmark).toBe('Facing basketball court')
      expect(sanitized[0].isDefault).toBe(true)
    })
  })

  // 11. Malformed persisted data recovery
  describe('11. Malformed Persisted Data Recovery', () => {
    it('recovers gracefully from non-array or null input', () => {
      expect(sanitizeStoredLocations(null)).toEqual([])
      expect(sanitizeStoredLocations(undefined)).toEqual([])
      expect(sanitizeStoredLocations('corrupted-string')).toEqual([])
      expect(sanitizeStoredLocations({ invalid: 'object' })).toEqual([])
    })

    it('filters out records missing mandatory fields and keeps valid ones', () => {
      const malformed = [
        null,
        undefined,
        {},
        { id: '1' }, // missing label & location
        { id: '2', label: 'Valid Spot', campusLocation: 'A Block' },
        { label: 'Missing ID', campusLocation: 'B Block' },
      ]

      const sanitized = sanitizeStoredLocations(malformed)
      expect(sanitized.length).toBe(1)
      expect(sanitized[0].id).toBe('2')
      expect(sanitized[0].label).toBe('Valid Spot')
      expect(sanitized[0].isDefault).toBe(true) // single entry becomes default
    })

    it('resolves conflicting multiple defaults to exactly one default', () => {
      const conflicting = [
        { id: 'loc_1', label: 'Spot 1', campusLocation: 'A Block', isDefault: true },
        { id: 'loc_2', label: 'Spot 2', campusLocation: 'B Block', isDefault: true },
        { id: 'loc_3', label: 'Spot 3', campusLocation: 'C Block', isDefault: true },
      ]

      const sanitized = sanitizeStoredLocations(conflicting)
      expect(sanitized.length).toBe(3)
      const defaults = sanitized.filter((s) => s.isDefault)
      expect(defaults.length).toBe(1)
      expect(defaults[0].id).toBe('loc_1')
    })
  })

  // 12. Accessibility and keyboard behavior for the modal/dialog
  describe('12. Modal Accessibility & ARIA Structure', () => {
    it('renders accessible modal dialog with title, inputs, and form controls', () => {
      const html = renderToString(
        <SavedLocationForm
          isEditing={false}
          onClose={vi.fn()}
          onSave={vi.fn()}
          initialData={null}
        />,
      )

      expect(html).toContain('Add Delivery Spot')
      expect(html).toContain('data-testid="saved-location-form"')
      expect(html).toContain('data-testid="location-label-input"')
      expect(html).toContain('data-testid="campus-location-select"')
      expect(html).toContain('data-testid="location-wing-input"')
      expect(html).toContain('data-testid="location-floor-input"')
      expect(html).toContain('data-testid="location-room-input"')
      expect(html).toContain('data-testid="location-instructions-input"')
      expect(html).toContain('data-testid="set-default-switch"')
      expect(html).toContain('data-testid="save-location-btn"')
      expect(html).toContain('data-testid="cancel-location-btn"')
    })

    it('renders edit modal with populated initial data', () => {
      const sample = {
        id: 'loc_test_edit',
        label: 'Existing Library Spot',
        campusLocation: 'MBA Block',
        wing: 'East Wing',
        floor: '1st Floor',
        roomNumber: 'Desk 14',
        landmark: 'Near elevator',
        deliveryInstructions: 'Text when arriving',
        isDefault: true,
      }

      const html = renderToString(
        <SavedLocationForm
          isEditing={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          initialData={sample}
        />,
      )

      expect(html).toContain('Edit Delivery Spot')
      expect(html).toContain('Existing Library Spot')
      expect(html).toContain('East Wing')
      expect(html).toContain('Desk 14')
      expect(html).toContain('Save Changes')
    })
  })

  // 13. No regression to runner mode switching or existing profile functionality
  describe('13. No Regression to Runner Mode Switching or Profile Behaviors', () => {
    it('preserves runner application flow without throwing', async () => {
      const applyMock = vi.fn().mockResolvedValue({ success: true })
      useAuthStore.setState({
        applyForRunner: applyMock,
        user: {
          id: 'usr_normal_customer',
          name: 'Normal Customer',
          email: 'normal@campus.edu',
          roles: [ROLES.CUSTOMER],
          runnerStatus: null,
        },
      })

      const html = renderToString(
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>,
      )

      expect(html).toContain('Earn by Delivering on Campus')
      expect(html).toContain('Apply as Runner')
    })
  })

  // 14. Account Isolation & Privacy Hardening
  describe('14. Account Isolation & Privacy Hardening', () => {
    it('1. User A saves a location; logout occurs; locations are no longer visible in-memory or in UI', async () => {
      // User A is active
      const spotA = useAddressStore.getState().addLocation({
        label: 'Aarav Dorm',
        campusLocation: 'A Block',
        wing: 'North Wing',
        floor: '2nd Floor',
        roomNumber: '204',
      })

      expect(useAddressStore.getState().locations.length).toBe(1)
      expect(useAddressStore.getState().locations[0].label).toBe('Aarav Dorm')
      expect(useAddressStore.getState().locations[0].userId).toBe('usr_customer_aarav')

      // Verify visible in UI
      let html = renderToString(
        <MemoryRouter>
          <SavedLocationsCard />
        </MemoryRouter>,
      )
      expect(html).toContain('Aarav Dorm')

      // Logout occurs
      await useAuthStore.getState().logout()

      // User session is cleared
      expect(useAuthStore.getState().user).toBeNull()

      // Locations are immediately wiped from memory
      expect(useAddressStore.getState().locations).toEqual([])
      expect(useAddressStore.getState().getDefaultLocation()).toBeNull()
      expect(useAddressStore.getState().getLocations()).toEqual([])

      // Verify UI shows empty state and does not leak User A's location
      html = renderToString(
        <MemoryRouter>
          <SavedLocationsCard />
        </MemoryRouter>,
      )
      expect(html).toContain('No saved delivery spots yet')
      expect(html).not.toContain('Aarav Dorm')
    })

    it("2. User B logs in; User A's locations remain strictly inaccessible", () => {
      // User A previously saved a location
      useAddressStore.getState().addLocation({
        label: 'Aarav Private Spot',
        campusLocation: 'A Block',
        roomNumber: '101',
      })

      // User B logs in
      useAuthStore.setState({
        user: {
          id: 'usr_customer_bob',
          name: 'Bob Builder',
          email: 'bob@campus.edu',
          phone: '+919876543299',
          roles: [ROLES.CUSTOMER],
          runnerStatus: null,
        },
        token: 'tok_bob',
      })

      // User B must have zero locations
      expect(useAddressStore.getState().locations).toEqual([])
      expect(useAddressStore.getState().getDefaultLocation()).toBeNull()
      expect(useAddressStore.getState().getLocations()).toEqual([])

      // UI rendered for User B must not leak User A's spot
      const html = renderToString(
        <MemoryRouter>
          <SavedLocationsCard />
        </MemoryRouter>,
      )
      expect(html).toContain('No saved delivery spots yet')
      expect(html).not.toContain('Aarav Private Spot')
    })

    it("3. User B saves a different location; switching back to User A restores only User A's data", () => {
      // 1. User A saves a spot
      useAddressStore.getState().addLocation({
        label: 'Aarav Research Lab',
        campusLocation: 'A Block',
        roomNumber: 'A-12',
      })

      // 2. User B logs in
      useAuthStore.setState({
        user: {
          id: 'usr_customer_bob',
          name: 'Bob Builder',
          email: 'bob@campus.edu',
          roles: [ROLES.CUSTOMER],
        },
        token: 'tok_bob',
      })

      expect(useAddressStore.getState().locations).toEqual([])

      // 3. User B saves their own spot
      useAddressStore.getState().addLocation({
        label: 'Bob Workshop',
        campusLocation: 'Mechanical Department Annex',
        roomNumber: 'M-04',
      })

      expect(useAddressStore.getState().locations.length).toBe(1)
      expect(useAddressStore.getState().locations[0].label).toBe('Bob Workshop')
      expect(useAddressStore.getState().locations[0].userId).toBe('usr_customer_bob')

      // 4. Switch back to User A
      useAuthStore.setState({
        user: {
          id: 'usr_customer_aarav',
          name: 'Aarav Patel',
          email: 'aarav@campus.edu',
          roles: [ROLES.CUSTOMER],
        },
        token: 'tok_aarav',
      })

      const aaravLocations = useAddressStore.getState().locations
      expect(aaravLocations.length).toBe(1)
      expect(aaravLocations[0].label).toBe('Aarav Research Lab')
      expect(aaravLocations[0].userId).toBe('usr_customer_aarav')
      expect(aaravLocations.some((loc) => loc.label.includes('Bob'))).toBe(false)

      // 5. Switch back to User B
      useAuthStore.setState({
        user: {
          id: 'usr_customer_bob',
          name: 'Bob Builder',
          email: 'bob@campus.edu',
          roles: [ROLES.CUSTOMER],
        },
        token: 'tok_bob',
      })

      const bobLocations = useAddressStore.getState().locations
      expect(bobLocations.length).toBe(1)
      expect(bobLocations[0].label).toBe('Bob Workshop')
      expect(bobLocations[0].userId).toBe('usr_customer_bob')
      expect(bobLocations.some((loc) => loc.label.includes('Aarav'))).toBe(false)
    })

    it('4. An unauthenticated session cannot read or modify authenticated users locations', () => {
      // User A has saved locations
      useAddressStore.getState().addLocation({
        label: 'Aarav Vault Spot',
        campusLocation: 'A Block',
      })

      // Session becomes unauthenticated
      useAuthStore.setState({ user: null, token: null, session: null })

      // Reading produces empty state / null
      expect(useAddressStore.getState().locations).toEqual([])
      expect(useAddressStore.getState().getLocations()).toEqual([])
      expect(useAddressStore.getState().getDefaultLocation()).toBeNull()

      // Modifying throws authentication error
      expect(() => {
        useAddressStore.getState().addLocation({
          label: 'Unauth Intruder',
          campusLocation: 'A Block',
        })
      }).toThrow(/authentication required/i)

      expect(() => {
        useAddressStore.getState().updateLocation('any_id', { label: 'New Label' })
      }).toThrow(/authentication required/i)

      expect(() => {
        useAddressStore.getState().deleteLocation('any_id')
      }).toThrow(/authentication required/i)

      expect(() => {
        useAddressStore.getState().setDefaultLocation('any_id')
      }).toThrow(/authentication required/i)

      expect(() => {
        useAddressStore.getState().setLocations([
          { id: 'loc_injected', label: 'Injected', campusLocation: 'A Block' },
        ])
      }).toThrow(/authentication required/i)
    })

    it('5. Existing location CRUD, default-location, and storage-sanitization remain intact under account isolation', () => {
      // Test multi-location default toggle and deletion recovery under active user
      const spot1 = useAddressStore.getState().addLocation({
        label: 'Primary Office',
        campusLocation: 'A Block',
      })
      expect(spot1.isDefault).toBe(true)

      const spot2 = useAddressStore.getState().addLocation({
        label: 'Evening Library',
        campusLocation: 'B Block',
        isDefault: true,
      })
      expect(spot2.isDefault).toBe(true)
      expect(useAddressStore.getState().getDefaultLocation().id).toBe(spot2.id)

      // Updating spot 1 to default resets spot 2
      useAddressStore.getState().setDefaultLocation(spot1.id)
      expect(useAddressStore.getState().getDefaultLocation().id).toBe(spot1.id)

      // Deleting default spot 1 promotes spot 2 to default
      useAddressStore.getState().deleteLocation(spot1.id)
      const remaining = useAddressStore.getState().locations
      expect(remaining.length).toBe(1)
      expect(remaining[0].id).toBe(spot2.id)
      expect(remaining[0].isDefault).toBe(true)
    })

    it('6. Auth initialization, logout, and account switching do not briefly expose another users data (zero-latency sync)', () => {
      useAddressStore.getState().addLocation({
        label: 'Aarav Private Hub',
        campusLocation: 'A Block',
      })
      expect(useAddressStore.getState().locations.length).toBe(1)

      // Synchronous logout
      useAuthStore.setState({ user: null })
      // In the exact same synchronous call frame, locations must be []
      expect(useAddressStore.getState().locations).toEqual([])
      expect(useAddressStore.getState().activeUserId).toBeNull()

      // Synchronous login as new user
      useAuthStore.setState({
        user: {
          id: 'usr_new_user_charlie',
          name: 'Charlie Customer',
          roles: [ROLES.CUSTOMER],
        },
      })
      // In the exact same synchronous call frame, locations must be [] for Charlie
      expect(useAddressStore.getState().locations).toEqual([])
      expect(useAddressStore.getState().activeUserId).toBe('usr_new_user_charlie')
    })

    it('7. Migration from legacy un-scoped storage key safely discards unowned records without cross-account exposure', () => {
      const { migrate } = useAddressStore.persist.getOptions()
      const legacyState = {
        locations: [
          { id: 'legacy_1', label: 'Legacy Shared Spot', campusLocation: 'A Block' },
        ],
      }

      // Legacy v0 data has no verified userId ownership
      const migrated = migrate(legacyState, 0)
      expect(migrated.locationsByUser).toEqual({})
      expect(migrated.locations).toBeUndefined()

      // Sanitization with expectedUserId drops any mismatched foreign userId
      const mixedData = [
        { id: 'foreign_1', userId: 'usr_malicious', label: 'Injected Spot', campusLocation: 'A Block' },
        { id: 'valid_1', userId: 'usr_customer_aarav', label: 'Authentic Spot', campusLocation: 'A Block' },
      ]
      const sanitized = sanitizeStoredLocations(mixedData, 'usr_customer_aarav')
      expect(sanitized.length).toBe(1)
      expect(sanitized[0].id).toBe('valid_1')
      expect(sanitized[0].userId).toBe('usr_customer_aarav')
    })

    it('8. onRehydrateStorage hydrates active user locations and ignores foreign records', () => {
      const { onRehydrateStorage } = useAddressStore.persist.getOptions()
      const postHydrate = onRehydrateStorage()
      const mockPersistedState = {
        locationsByUser: {
          usr_customer_aarav: [
            { id: 'loc_a1', userId: 'usr_customer_aarav', label: 'Aarav Spot', campusLocation: 'A Block' },
          ],
          usr_customer_bob: [
            { id: 'loc_b1', userId: 'usr_customer_bob', label: 'Bob Spot', campusLocation: 'B Block' },
          ],
        },
      }
      postHydrate(mockPersistedState)
      expect(mockPersistedState.activeUserId).toBe('usr_customer_aarav')
      expect(mockPersistedState.locations.length).toBe(1)
      expect(mockPersistedState.locations[0].id).toBe('loc_a1')
    })
  })
})
