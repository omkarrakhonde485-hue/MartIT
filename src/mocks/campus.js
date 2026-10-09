/**
 * SAMPLE DATA — a fictional campus used until the real backend is connected.
 * Coordinates are illustrative; distances from the store are approximate by design
 * so every fee band can be exercised.
 */

export const SAMPLE_STORES = [
  {
    id: 'store_campus_mart',
    name: 'Campus Mart (sample store)',
    coords: { lat: 12.97, lng: 77.59 },
    isOpen: true,
  },
  {
    id: 'store_night_canteen',
    name: 'Night Canteen & Snacks',
    coords: { lat: 12.972, lng: 77.591 },
    isOpen: true,
  },
  {
    id: 'store_stationery_hub',
    name: 'Campus Stationery Hub',
    coords: { lat: 12.981, lng: 77.59 },
    isOpen: false,
  },
]

// ~0.001° latitude ≈ 111 m
export const SAMPLE_DELIVERY_LOCATIONS = [
  { id: 'loc_hostel_a', name: 'Hostel A, Block 1', group: 'Hostels', coords: { lat: 12.9733, lng: 77.59 } },
  { id: 'loc_hostel_b', name: 'Hostel B, Block 3', group: 'Hostels', coords: { lat: 12.9772, lng: 77.59 } },
  { id: 'loc_library', name: 'Central Library', group: 'Academic', coords: { lat: 12.985, lng: 77.59 } },
  { id: 'loc_faculty', name: 'Faculty Quarters', group: 'Residential', coords: { lat: 12.995, lng: 77.59 } },
  { id: 'loc_far_gate', name: 'North Gate PG', group: 'Off-campus', coords: { lat: 13.007, lng: 77.59 } },
  { id: 'loc_outside', name: 'City PG (outside area)', group: 'Off-campus', coords: { lat: 13.02, lng: 77.59 } },
]
