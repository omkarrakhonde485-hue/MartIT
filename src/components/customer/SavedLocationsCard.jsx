import { useState } from 'react'
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Check,
  Star,
  Building,
  Navigation,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { toast } from '@/components/ui/Toaster'
import {
  useAddressStore,
  formatSavedLocation,
} from '@/stores/addressStore'
import { SavedLocationModal } from './SavedLocationModal'

/**
 * SavedLocationsCard Component
 * Displays customer's saved campus delivery spots with add, edit, delete, and default selection.
 */
export function SavedLocationsCard() {
  const locationsFromHook = useAddressStore((s) => s.locations)
  const locations =
    locationsFromHook && locationsFromHook.length > 0
      ? locationsFromHook
      : useAddressStore.getState().locations

  const addLocation = useAddressStore((s) => s.addLocation)
  const updateLocation = useAddressStore((s) => s.updateLocation)
  const deleteLocation = useAddressStore((s) => s.deleteLocation)
  const setDefaultLocation = useAddressStore((s) => s.setDefaultLocation)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSpot, setEditingSpot] = useState(null)
  const [deletingSpot, setDeletingSpot] = useState(null)

  const handleOpenAdd = () => {
    setEditingSpot(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (spot) => {
    setEditingSpot(spot)
    setIsModalOpen(true)
  }

  const handleSaveSpot = (data) => {
    if (editingSpot?.id) {
      updateLocation(editingSpot.id, data)
      toast.success(`"${data.label}" updated successfully.`)
    } else {
      addLocation(data)
      toast.success(`"${data.label}" saved to your delivery spots.`)
    }
  }

  const handleConfirmDelete = () => {
    if (!deletingSpot) return
    const label = deletingSpot.label
    deleteLocation(deletingSpot.id)
    toast.success(`"${label}" removed from saved delivery spots.`)
    setDeletingSpot(null)
  }

  const handleSetDefault = (spot) => {
    setDefaultLocation(spot.id)
    toast.success(`"${spot.label}" set as your default delivery spot.`)
  }

  return (
    <Card className="mt-6 p-6" data-testid="saved-locations-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-fresh-ink">
              <MapPin className="size-4" aria-hidden="true" />
            </span>
            <h3 className="font-display text-lg font-bold text-ink">
              Saved Delivery Spots
            </h3>
          </div>
          <p className="mt-1 text-xs text-ink-muted leading-relaxed">
            Save your hostel rooms, labs, and frequent drop-off spots for fast campus delivery. Stored locally on this device.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleOpenAdd}
          data-testid="add-new-spot-btn"
          className="shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-4 mr-1.5" aria-hidden="true" />
          Add Spot
        </Button>
      </div>

      {/* Content */}
      <div className="mt-5">
        {locations.length === 0 ? (
          /* Empty State */
          <div
            className="flex flex-col items-center justify-center rounded-tile border border-dashed border-line-strong bg-surface-2/40 px-6 py-10 text-center"
            data-testid="saved-locations-empty-state"
          >
            <div className="grid size-12 place-items-center rounded-full bg-brand-soft text-fresh-ink mb-3">
              <Navigation className="size-6" aria-hidden="true" />
            </div>
            <h4 className="font-display text-base font-semibold text-ink">
              No saved delivery spots yet
            </h4>
            <p className="mt-1 max-w-sm text-xs text-ink-muted leading-relaxed">
              Save your hostel room, academic department, or campus meeting point so runners can reach you without delay.
            </p>
            <Button
              size="sm"
              variant="primary"
              onClick={handleOpenAdd}
              className="mt-4"
              data-testid="empty-add-spot-btn"
            >
              <Plus className="size-4 mr-1.5" aria-hidden="true" />
              Add Your First Spot
            </Button>
          </div>
        ) : (
          /* Saved Locations List */
          <div className="grid gap-3.5" data-testid="saved-locations-list">
            {locations.map((spot) => {
              const summary = formatSavedLocation(spot)
              const buildingDisplay =
                spot.campusLocation === 'other'
                  ? spot.customBuilding || 'Custom Location'
                  : spot.campusLocation

              return (
                <div
                  key={spot.id}
                  className="rounded-card border border-line bg-surface p-4 transition-all hover:border-line-strong hover:shadow-1 flex flex-col justify-between gap-3"
                  data-testid={`saved-location-item-${spot.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-display text-base font-bold text-ink"
                          data-testid={`spot-label-${spot.id}`}
                        >
                          {spot.label}
                        </span>
                        {spot.isDefault && (
                          <Badge
                            tone="brand"
                            size="sm"
                            data-testid={`default-badge-${spot.id}`}
                          >
                            <Check className="size-3 mr-1" aria-hidden="true" />
                            Default
                          </Badge>
                        )}
                      </div>

                      <p
                        className="mt-1 text-xs font-medium text-ink-muted leading-relaxed"
                        data-testid={`spot-summary-${spot.id}`}
                      >
                        {summary}
                      </p>
                    </div>

                    {/* Default selector button if not default */}
                    {!spot.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetDefault(spot)}
                        data-testid={`set-default-btn-${spot.id}`}
                        className="text-xs shrink-0 text-ink-muted hover:text-ink h-8 px-2.5"
                        title="Set this as your default delivery spot"
                      >
                        <Star className="size-3.5 mr-1 text-ink-subtle" aria-hidden="true" />
                        Set Default
                      </Button>
                    )}
                  </div>

                  {/* Badges / Detail pills */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-2 py-0.5 font-medium text-ink">
                      <Building className="size-3 text-ink-subtle" aria-hidden="true" />
                      {buildingDisplay}
                    </span>
                    {spot.roomNumber && (
                      <span className="rounded bg-surface-2 px-2 py-0.5 text-ink-muted">
                        Room {spot.roomNumber}
                      </span>
                    )}
                    {spot.floor && (
                      <span className="rounded bg-surface-2 px-2 py-0.5 text-ink-muted">
                        {spot.floor.toLowerCase().includes('floor') ? spot.floor : `${spot.floor} Floor`}
                      </span>
                    )}
                    {spot.wing && (
                      <span className="rounded bg-surface-2 px-2 py-0.5 text-ink-muted">
                        {spot.wing.toLowerCase().includes('wing') ? spot.wing : `${spot.wing} Wing`}
                      </span>
                    )}
                    {spot.landmark && (
                      <span className="rounded bg-surface-2 px-2 py-0.5 text-ink-muted">
                        Near {spot.landmark.replace(/^near\s+/i, '')}
                      </span>
                    )}
                  </div>

                  {/* Delivery Instructions callout */}
                  {spot.deliveryInstructions && (
                    <div
                      className="rounded-tile border border-line bg-surface-2/40 px-3 py-2 text-xs text-ink-muted flex items-start gap-2"
                      data-testid={`spot-instructions-${spot.id}`}
                    >
                      <FileText className="size-3.5 shrink-0 text-ink-subtle mt-0.5" aria-hidden="true" />
                      <span className="italic">{spot.deliveryInstructions}</span>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="flex items-center justify-end gap-2 border-t border-line/60 pt-2.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenEdit(spot)}
                      data-testid={`edit-spot-btn-${spot.id}`}
                      className="h-8 px-2.5 text-xs font-semibold"
                    >
                      <Pencil className="size-3.5 mr-1" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingSpot(spot)}
                      data-testid={`delete-spot-btn-${spot.id}`}
                      className="h-8 px-2.5 text-xs font-semibold text-danger hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-3.5 mr-1" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <SavedLocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSpot}
        initialData={editingSpot}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingSpot)}
        onOpenChange={(open) => { if (!open) setDeletingSpot(null) }}
      >
        <DialogContent
          title="Delete Delivery Spot?"
          description="Are you sure you want to remove this delivery location?"
          className="max-w-md"
          data-testid="delete-confirmation-dialog"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-tile border border-danger/20 bg-danger/10 p-3.5 text-xs text-ink">
              <AlertTriangle className="size-5 shrink-0 text-danger mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-danger">Permanent Action</p>
                <p className="mt-0.5 text-ink-muted leading-relaxed">
                  Removing <strong className="text-ink">"{deletingSpot?.label}"</strong> cannot be undone. If this was your default location, another saved spot will automatically be designated as default.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-line">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeletingSpot(null)}
                data-testid="cancel-delete-btn"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleConfirmDelete}
                data-testid="confirm-delete-btn"
              >
                Delete Spot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
