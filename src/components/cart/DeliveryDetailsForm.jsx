import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router'
import {
  User,
  Phone,
  MapPin,
  Building,
  Compass,
  Check,
  ChevronDown,
  Navigation,
  Bookmark,
} from 'lucide-react'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/authStore'
import {
  useAddressStore,
  formatSavedLocation,
  formatSpotDeliveryDetails,
} from '@/stores/addressStore'
import {
  PRESET_CAMPUS_LOCATIONS,
  OTHER_LOCATION_VALUE,
  OTHER_LOCATION_LABEL,
  LEGACY_OTHER_LABEL,
} from '@/utils/checkoutValidation'
import { cn } from '@/utils/cn'

/**
 * DeliveryDetailsForm Component
 *
 * Renders the checkout Customer Details and Delivery Destination sections:
 * 1. Customer Information:
 *    - Full Name (Required, trimmed non-empty, prefillable)
 *    - Phone Number (Required, Indian mobile format, inline validation)
 * 2. Delivery Destination:
 *    - Saved Delivery Spots (when authenticated user has saved locations)
 *    - Campus Destination (Searchable combobox & dropdown with exact 8 presets + Other / Enter address)
 *    - Destination Address (Revealed when Other / Enter address is selected, required free-text)
 *    - Detailed address / landmark (Optional text input for extra directions: hostel name, floor, room, landmark)
 *    - Optional opt-in to save entered address for future orders
 */
export function DeliveryDetailsForm({
  details,
  errors = {},
  onChange,
  disabled = false,
  className,
  initialDropdownOpen = false,
  savedLocations: customSavedLocations,
}) {
  const userFromHook = useAuthStore((s) => s.user)
  const user = userFromHook ?? useAuthStore.getState().user
  const storeSavedLocations = useAddressStore((s) => s.locations)
  const fallbackLocations = useAddressStore.getState().locations || []
  const savedLocations =
    customSavedLocations ??
    (storeSavedLocations && storeSavedLocations.length > 0
      ? storeSavedLocations
      : fallbackLocations)

  const [isDropdownOpen, setIsDropdownOpen] = useState(initialDropdownOpen)
  const dropdownRef = useRef(null)
  const listboxRef = useRef(null)

  const isOtherSelected =
    details.presetLocation === OTHER_LOCATION_VALUE ||
    details.presetLocation === OTHER_LOCATION_LABEL ||
    details.presetLocation === LEGACY_OTHER_LABEL ||
    details.presetLocation === 'Other / Enter address'

  const handleSelectSavedSpot = (spot) => {
    const isOther =
      spot.campusLocation === 'other' ||
      !PRESET_CAMPUS_LOCATIONS.includes(spot.campusLocation)

    const preset = isOther ? OTHER_LOCATION_VALUE : spot.campusLocation
    const custom = isOther ? (spot.customBuilding || spot.campusLocation || '') : ''
    const instructions = formatSpotDeliveryDetails(spot)

    onChange('selectedSpotId', spot.id)
    onChange('selectedSpotLabel', spot.label)
    onChange('presetLocation', preset)
    onChange('customLocation', custom)
    onChange('deliveryInstructions', instructions)
    onChange('saveNewSpot', false)
  }

  const handleSelectManual = () => {
    onChange('selectedSpotId', 'manual')
    onChange('selectedSpotLabel', null)
  }

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isDropdownOpen) return

    const handlePointerDownOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDownOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen])

  // Isolate wheel events on listbox so Lenis/window smooth-scroll doesn't hijack or block mouse wheel scrolling
  useEffect(() => {
    if (!isDropdownOpen) return

    const listbox = listboxRef.current
    if (!listbox) return

    const handleWheel = (e) => {
      // Stop event from bubbling to window so Lenis does not intercept and cancel it
      e.stopPropagation()
    }

    listbox.addEventListener('wheel', handleWheel, { passive: true })
    return () => {
      listbox.removeEventListener('wheel', handleWheel)
    }
  }, [isDropdownOpen])

  const handleSelectLocation = (locationValue) => {
    onChange('selectedSpotId', 'manual')
    onChange('selectedSpotLabel', null)
    onChange('presetLocation', locationValue)
    setIsDropdownOpen(false)
  }

  const selectedLocationDisplay = isOtherSelected
    ? OTHER_LOCATION_LABEL
    : details.presetLocation || 'Select campus destination'

  return (
    <section
      aria-label="Customer and Delivery Details"
      className={cn(
        'rounded-card border border-line bg-surface p-4 sm:p-6 shadow-1 space-y-6',
        className,
      )}
    >
      {/* 1. Customer Information Sub-section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-line/60 text-ink">
          <span className="grid size-8 place-items-center rounded-tile bg-brand-soft text-brand-ink">
            <User className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink leading-tight">Customer Information</h2>
            <p className="text-xs text-ink-subtle">
              Your contact details for order updates and runner coordination.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <Field
            label="Full Name"
            error={errors.fullName}
            className="sm:col-span-1"
          >
            <Input
              id="checkout-full-name"
              data-testid="checkout-full-name"
              name="fullName"
              type="text"
              icon={User}
              placeholder="e.g. Aarav Patel"
              autoComplete="name"
              value={details.fullName || ''}
              onChange={(e) => onChange('fullName', e.target.value)}
              disabled={disabled}
              aria-required="true"
            />
          </Field>

          {/* Phone Number */}
          <Field
            label="Phone Number"
            hint="10-digit Indian mobile number (e.g. 9876543210 or +91 98765 43210)"
            error={errors.mobileNumber || errors.phoneNumber}
            className="sm:col-span-1"
          >
            <Input
              id="checkout-mobile-number"
              data-testid="checkout-phone-number"
              name="mobileNumber"
              type="tel"
              icon={Phone}
              placeholder="e.g. 9876543210"
              autoComplete="tel"
              value={details.mobileNumber || details.phoneNumber || ''}
              onChange={(e) => {
                onChange('mobileNumber', e.target.value)
                onChange('phoneNumber', e.target.value)
              }}
              disabled={disabled}
              aria-required="true"
            />
          </Field>
        </div>
      </div>

      {/* 2. Delivery Destination Sub-section */}
      <div className="space-y-4 pt-2 border-t border-line/60">
        <div className="flex items-center gap-2.5 pb-2 border-b border-line/60 text-ink">
          <span className="grid size-8 place-items-center rounded-tile bg-fresh-soft text-fresh-ink">
            <Navigation className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink leading-tight">Delivery Destination</h2>
            <p className="text-xs text-ink-subtle">
              Select a saved delivery spot or enter an address for our runner.
            </p>
          </div>
        </div>

        {/* 2a. Saved Locations Section (for authenticated users) */}
        {user && savedLocations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-subtle">
                Your Saved Delivery Spots
              </label>
              <Link
                to="/app/profile"
                className="text-xs font-medium text-brand hover:underline inline-flex items-center gap-1"
                data-testid="manage-spots-link"
              >
                Manage Spots
              </Link>
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              data-testid="checkout-saved-spots-list"
            >
              {savedLocations.map((spot) => {
                const isSelected = details.selectedSpotId === spot.id
                const summary = formatSavedLocation(spot)
                return (
                  <button
                    key={spot.id}
                    type="button"
                    data-testid={`saved-spot-card-${spot.id}`}
                    onClick={() => handleSelectSavedSpot(spot)}
                    disabled={disabled}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-card border p-3 text-left transition-all',
                      isSelected
                        ? 'border-brand bg-brand-soft/20 shadow-1 ring-1 ring-brand'
                        : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2/40',
                      disabled && 'opacity-60 cursor-not-allowed',
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-ink truncate">
                        {spot.label}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {spot.isDefault && (
                          <span
                            className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-fresh-ink"
                            data-testid={`saved-spot-default-badge-${spot.id}`}
                          >
                            Default
                          </span>
                        )}
                        {isSelected && (
                          <span
                            className="grid size-4 place-items-center rounded-full bg-brand text-brand-ink"
                            data-testid={`saved-spot-selected-check-${spot.id}`}
                          >
                            <Check className="size-2.5 stroke-[3]" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-ink-muted line-clamp-1">
                      {summary}
                    </p>
                  </button>
                )
              })}

              {/* Enter another address card */}
              <button
                type="button"
                data-testid="manual-location-card"
                onClick={handleSelectManual}
                disabled={disabled}
                className={cn(
                  'flex flex-col items-start justify-center gap-1 rounded-card border p-3 text-left transition-all',
                  details.selectedSpotId === 'manual' || !details.selectedSpotId
                    ? 'border-brand bg-brand-soft/20 shadow-1 ring-1 ring-brand'
                    : 'border-line border-dashed bg-surface hover:border-line-strong hover:bg-surface-2/40',
                  disabled && 'opacity-60 cursor-not-allowed',
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-ink">
                    + Enter another address
                  </span>
                  {(details.selectedSpotId === 'manual' || !details.selectedSpotId) && (
                    <span
                      className="grid size-4 place-items-center rounded-full bg-brand text-brand-ink"
                      data-testid="manual-location-selected-check"
                    >
                      <Check className="size-2.5 stroke-[3]" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-muted">
                  Type in another building or drop-off spot
                </p>
              </button>
            </div>
          </div>
        )}

        {/* 2b. Notice when authenticated but 0 spots saved */}
        {user && savedLocations.length === 0 && (
          <div
            className="flex items-center justify-between rounded-tile border border-dashed border-line bg-surface-2/40 px-3.5 py-2.5 text-xs text-ink-muted"
            data-testid="no-saved-spots-notice"
          >
            <span>No saved delivery spots yet.</span>
            <Link
              to="/app/profile"
              className="font-medium text-brand hover:underline inline-flex items-center gap-1"
              data-testid="manage-spots-link"
            >
              Add spots in Profile →
            </Link>
          </div>
        )}

        {/* Campus Destination Selector */}
        <div className="space-y-1.5">
          <label
            htmlFor="campus-location-select"
            className="block text-sm font-medium text-ink"
          >
            Campus Destination
          </label>

          {/* Accessible native select for keyboard/screen readers & programmatic tests */}
          <div className="relative">
            <select
              id="campus-location-select"
              data-testid="campus-location-select"
              aria-label="Campus Destination"
              value={details.presetLocation || 'A Block'}
              onChange={(e) => handleSelectLocation(e.target.value)}
              disabled={disabled}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            >
              {PRESET_CAMPUS_LOCATIONS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
              <option value={OTHER_LOCATION_VALUE}>{OTHER_LOCATION_LABEL}</option>
            </select>

            {/* Interactive Combobox / Dropdown Trigger */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                id="campus-location-trigger"
                data-testid="campus-location-trigger"
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                aria-label="Choose campus destination"
                disabled={disabled}
                onClick={() => setIsDropdownOpen((open) => !open)}
                className={cn(
                  'group flex w-full items-center justify-between gap-3 rounded-tile border bg-surface px-3.5 py-3 text-left shadow-1 transition-all',
                  errors.location
                    ? 'border-danger focus:ring-danger'
                    : 'border-line-strong hover:border-ink-subtle focus:border-brand',
                  disabled && 'opacity-60 cursor-not-allowed',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-fresh-soft text-fresh-ink">
                    <MapPin className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink leading-tight">
                      {selectedLocationDisplay}
                    </p>
                    <p className="truncate text-[11px] text-ink-subtle mt-0.5">
                      {isOtherSelected
                        ? 'Custom destination address'
                        : 'Campus building preset'}
                    </p>
                  </div>
                </div>

                <ChevronDown
                  className={cn(
                    'size-4 text-ink-subtle shrink-0 transition-transform duration-200',
                    isDropdownOpen && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>

              {/* Dropdown Menu Panel (Max height set to show ~4 options at a time) */}
              {isDropdownOpen && (
                <div
                  ref={listboxRef}
                  role="listbox"
                  aria-label="Campus destinations list"
                  data-testid="campus-locations-list"
                  data-lenis-prevent
                  data-lenis-prevent-wheel
                  data-lenis-prevent-touch
                  tabIndex={-1}
                  onWheel={(e) => e.stopPropagation()}
                  className="absolute z-40 left-0 right-0 mt-1.5 max-h-48 overflow-y-auto overscroll-contain rounded-card border border-line bg-surface p-1.5 shadow-2 animate-fade-in focus:outline-none"
                >
                  <div className="space-y-1">
                    {/* Preset Locations */}
                    {PRESET_CAMPUS_LOCATIONS.map((preset) => {
                      const isSelected = details.presetLocation === preset
                      return (
                        <button
                          key={preset}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          data-testid={`preset-option-${preset.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => handleSelectLocation(preset)}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-tile px-3 py-2 text-sm text-left transition-colors',
                            isSelected
                              ? 'bg-brand-soft text-brand-ink font-semibold'
                              : 'hover:bg-surface-2 text-ink',
                          )}
                        >
                          <span className="truncate">{preset}</span>
                          {isSelected && (
                            <Check className="size-4 text-fresh-ink shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      )
                    })}

                    {/* Divider */}
                    <div className="my-1.5 border-t border-line/60" />

                    {/* Other / Enter address Option */}
                    <button
                      type="button"
                      role="option"
                      aria-selected={isOtherSelected}
                      data-testid="preset-option-other"
                      onClick={() => handleSelectLocation(OTHER_LOCATION_VALUE)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-tile px-3 py-2 text-sm text-left transition-colors font-medium',
                        isOtherSelected
                          ? 'bg-brand-soft text-brand-ink font-semibold'
                          : 'hover:bg-surface-2 text-brand',
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Building className="size-3.5 shrink-0" aria-hidden="true" />
                        <span>{OTHER_LOCATION_LABEL}</span>
                      </span>
                      {isOtherSelected && (
                        <Check className="size-4 text-fresh-ink shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {errors.location && (
            <p role="alert" className="text-[13px] font-medium text-danger mt-1">
              {errors.location}
            </p>
          )}
        </div>

        {/* Destination Address Field (Revealed when Other / Enter address is selected) */}
        {isOtherSelected && (
          <Field
            label="Destination Address"
            hint="Enter your campus building or destination address"
            error={errors.customLocation}
          >
            <Input
              id="checkout-custom-location"
              data-testid="checkout-custom-location"
              name="customLocation"
              type="text"
              icon={Building}
              placeholder="e.g. Science Block, Old Workshop, Mechanical Dept"
              value={details.customLocation || ''}
              onChange={(e) => onChange('customLocation', e.target.value)}
              disabled={disabled}
              aria-required="true"
            />
          </Field>
        )}

        {/* Detailed Address / Landmark (Optional extra directions) */}
        <Field
          label="Detailed address / landmark"
          optional
          hint="Extra directions, such as hostel name, floor, room number, or nearby landmark"
        >
          <Input
            id="checkout-delivery-instructions"
            data-testid="checkout-detailed-address"
            name="deliveryInstructions"
            type="text"
            icon={Compass}
            placeholder="e.g. Hostel 3, 2nd floor, Room 204, near the entrance"
            value={details.deliveryInstructions || ''}
            onChange={(e) => onChange('deliveryInstructions', e.target.value)}
            disabled={disabled}
          />
        </Field>

        {/* 2c. Opt-in to save this address for future orders (when entering manually) */}
        {user && (details.selectedSpotId === 'manual' || !details.selectedSpotId) && (
          <div className="rounded-card border border-line bg-surface-2/30 p-3.5 space-y-3" data-testid="save-spot-opt-in-card">
            <label
              htmlFor="save-address-opt-in"
              className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-ink select-none"
            >
              <input
                type="checkbox"
                id="save-address-opt-in"
                data-testid="save-address-opt-in"
                checked={Boolean(details.saveNewSpot)}
                onChange={(e) => onChange('saveNewSpot', e.target.checked)}
                disabled={disabled}
                className="size-4 rounded border-line-strong text-brand focus:ring-brand accent-brand cursor-pointer"
              />
              <span className="inline-flex items-center gap-1.5">
                <Bookmark className="size-3.5 text-brand" aria-hidden="true" />
                <span>Save this delivery spot for future orders</span>
              </span>
            </label>

            {details.saveNewSpot && (
              <div className="space-y-3 pt-1 animate-fade-in" data-testid="new-spot-fields">
                <Field
                  label="Spot Label"
                  hint="Give this spot a name (e.g. My Hostel Room, Science Lab, Central Library)"
                  error={errors.newSpotLabel}
                >
                  <Input
                    id="checkout-new-spot-label"
                    data-testid="checkout-new-spot-label"
                    name="newSpotLabel"
                    type="text"
                    placeholder="e.g. My Hostel Room"
                    value={details.newSpotLabel || ''}
                    onChange={(e) => onChange('newSpotLabel', e.target.value)}
                    disabled={disabled}
                    aria-required="true"
                  />
                </Field>

                <label
                  htmlFor="set-default-opt-in"
                  className="flex items-center gap-2 cursor-pointer text-xs text-ink-muted select-none"
                >
                  <input
                    type="checkbox"
                    id="set-default-opt-in"
                    data-testid="set-default-opt-in"
                    checked={Boolean(details.setAsDefaultSpot)}
                    onChange={(e) => onChange('setAsDefaultSpot', e.target.checked)}
                    disabled={disabled}
                    className="size-3.5 rounded border-line-strong text-brand focus:ring-brand accent-brand cursor-pointer"
                  />
                  <span>Set as my default delivery spot</span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
