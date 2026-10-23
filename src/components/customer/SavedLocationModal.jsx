import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { Switch } from '@/components/ui/Switch'
import { PRESET_CAMPUS_LOCATIONS } from '@/utils/checkoutValidation'
import { validateAddressInput } from '@/stores/addressStore'
import { MapPin, Building, Home, Compass, FileText } from 'lucide-react'

export const OTHER_BUILDING_OPTION = 'Other / Custom building'

/**
 * Presentational and interactive Form component for adding or editing a campus delivery spot.
 */
export function SavedLocationForm({
  initialData = null,
  onSave,
  onClose,
  isEditing = false,
}) {
  const isPreset = initialData ? PRESET_CAMPUS_LOCATIONS.includes(initialData.campusLocation) : true

  const [label, setLabel] = useState(initialData?.label || '')
  const [campusLocation, setCampusLocation] = useState(
    initialData
      ? isPreset
        ? initialData.campusLocation
        : OTHER_BUILDING_OPTION
      : 'A Block',
  )
  const [customBuilding, setCustomBuilding] = useState(
    initialData
      ? isPreset
        ? ''
        : initialData.customBuilding || initialData.campusLocation || ''
      : '',
  )
  const [wing, setWing] = useState(initialData?.wing || '')
  const [floor, setFloor] = useState(initialData?.floor || '')
  const [roomNumber, setRoomNumber] = useState(initialData?.roomNumber || '')
  const [landmark, setLandmark] = useState(initialData?.landmark || '')
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    initialData?.deliveryInstructions || '',
  )
  const [isDefault, setIsDefault] = useState(Boolean(initialData?.isDefault))
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync state if initialData changes while mounted
  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label || '')
      const preset = PRESET_CAMPUS_LOCATIONS.includes(initialData.campusLocation)
      if (preset) {
        setCampusLocation(initialData.campusLocation)
        setCustomBuilding('')
      } else {
        setCampusLocation(OTHER_BUILDING_OPTION)
        setCustomBuilding(initialData.customBuilding || initialData.campusLocation || '')
      }
      setWing(initialData.wing || '')
      setFloor(initialData.floor || '')
      setRoomNumber(initialData.roomNumber || '')
      setLandmark(initialData.landmark || '')
      setDeliveryInstructions(initialData.deliveryInstructions || '')
      setIsDefault(Boolean(initialData.isDefault))
    } else {
      setLabel('')
      setCampusLocation('A Block')
      setCustomBuilding('')
      setWing('')
      setFloor('')
      setRoomNumber('')
      setLandmark('')
      setDeliveryInstructions('')
      setIsDefault(false)
    }
    setErrors({})
    setIsSubmitting(false)
  }, [initialData])

  const handleSubmit = (e) => {
    e?.preventDefault()
    setIsSubmitting(true)

    const payload = {
      label,
      campusLocation: campusLocation === OTHER_BUILDING_OPTION ? 'other' : campusLocation,
      customBuilding,
      wing,
      floor,
      roomNumber,
      landmark,
      deliveryInstructions,
      isDefault,
    }

    const validation = validateAddressInput(payload)
    if (!validation.isValid) {
      setErrors(validation.errors)
      setIsSubmitting(false)
      return
    }

    try {
      onSave?.(payload)
      onClose?.()
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save delivery location.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isOther = campusLocation === OTHER_BUILDING_OPTION

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-testid="saved-location-form"
    >
      <div className="sr-only">
        <h2>{isEditing ? 'Edit Delivery Spot' : 'Add Delivery Spot'}</h2>
      </div>

      {errors.form && (
        <div
          role="alert"
          className="rounded-tile border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger"
          data-testid="modal-form-error"
        >
          {errors.form}
        </div>
      )}

      {/* Label / Name */}
      <Field
        label="Spot Label"
        hint="A friendly name for this spot (e.g. My Hostel Room, Central Library, Lab 4)"
        error={errors.label}
      >
        <Input
          icon={Home}
          placeholder="e.g. My Hostel Room"
          value={label}
          onChange={(e) => {
            setLabel(e.target.value)
            if (errors.label) setErrors((prev) => ({ ...prev, label: null }))
          }}
          data-testid="location-label-input"
          autoFocus
        />
      </Field>

      {/* Campus Location Dropdown */}
      <Field
        label="Campus Building / Location"
        hint="Choose a primary campus block or specify a custom campus location"
        error={errors.campusLocation}
      >
        <div className="relative">
          <Building className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
          <select
            value={campusLocation}
            onChange={(e) => {
              setCampusLocation(e.target.value)
              if (errors.campusLocation) setErrors((prev) => ({ ...prev, campusLocation: null }))
            }}
            className="h-12 w-full rounded-tile border border-line-strong bg-surface pl-10 pr-4 text-[15px] text-ink transition-[border-color,box-shadow] duration-200 hover:border-ink-subtle focus:border-brand focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_22%,transparent)]"
            data-testid="campus-location-select"
          >
            {PRESET_CAMPUS_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
            <option value={OTHER_BUILDING_OPTION}>Other / Custom building</option>
          </select>
        </div>
      </Field>

      {/* Custom Building Name (conditional) */}
      {isOther && (
        <Field
          label="Custom Building / Destination Name"
          hint="Enter your specific department, hall, or facility name"
          error={errors.customBuilding}
        >
          <Input
            icon={MapPin}
            placeholder="e.g. Science Block 2, Mechanical Lab"
            value={customBuilding}
            onChange={(e) => {
              setCustomBuilding(e.target.value)
              if (errors.customBuilding) setErrors((prev) => ({ ...prev, customBuilding: null }))
            }}
            data-testid="custom-building-input"
          />
        </Field>
      )}

      {/* Wing and Floor in a 2-col row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Wing / Block Section" optional>
          <Input
            placeholder="e.g. North Wing, Wing B"
            value={wing}
            onChange={(e) => setWing(e.target.value)}
            data-testid="location-wing-input"
          />
        </Field>

        <Field label="Floor Level" optional>
          <Input
            placeholder="e.g. 2nd Floor, Ground"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            data-testid="location-floor-input"
          />
        </Field>
      </div>

      {/* Room Number and Landmark */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Room / Desk Number" optional>
          <Input
            placeholder="e.g. Room 204, Desk 12"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            data-testid="location-room-input"
          />
        </Field>

        <Field label="Nearby Landmark" optional>
          <Input
            icon={Compass}
            placeholder="e.g. Near water cooler"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            data-testid="location-landmark-input"
          />
        </Field>
      </div>

      {/* Delivery Instructions */}
      <Field
        label="Drop-off & Delivery Instructions"
        hint="Help the runner deliver quickly and accurately"
        optional
      >
        <div className="relative">
          <FileText className="pointer-events-none absolute left-3.5 top-3.5 size-[18px] text-ink-subtle" aria-hidden="true" />
          <textarea
            rows={2}
            placeholder="e.g. Call upon reaching the gate. Please leave with security if unreachable."
            value={deliveryInstructions}
            onChange={(e) => setDeliveryInstructions(e.target.value)}
            className="w-full rounded-tile border border-line-strong bg-surface pl-10 pr-4 pt-2.5 pb-2.5 text-[15px] text-ink placeholder:text-ink-subtle transition-[border-color,box-shadow] duration-200 hover:border-ink-subtle focus:border-brand focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_22%,transparent)]"
            data-testid="location-instructions-input"
          />
        </div>
      </Field>

      {/* Set as Default Switch */}
      <div className="flex items-center justify-between rounded-tile border border-line bg-surface-2/60 p-3.5">
        <div>
          <p className="text-sm font-semibold text-ink">Set as default delivery spot</p>
          <p className="text-xs text-ink-muted">
            Pre-selected automatically on your next checkout
          </p>
        </div>
        <Switch
          checked={isDefault}
          onCheckedChange={setIsDefault}
          aria-label="Set as default delivery spot"
          data-testid="set-default-switch"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          data-testid="cancel-location-btn"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          data-testid="save-location-btn"
        >
          {isEditing ? 'Save Changes' : 'Save Spot'}
        </Button>
      </div>
    </form>
  )
}

/**
 * Accessible Modal dialog for adding or editing a campus delivery spot.
 */
export function SavedLocationModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
}) {
  const isEditing = Boolean(initialData?.id)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        title={isEditing ? 'Edit Delivery Spot' : 'Add Delivery Spot'}
        description="Save your hostel, room, or campus spot with drop-off notes for faster deliveries."
        className="max-w-lg max-h-[90dvh] overflow-y-auto"
        data-testid="saved-location-modal"
      >
        <SavedLocationForm
          initialData={initialData}
          onSave={onSave}
          onClose={onClose}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  )
}
