/**
 * SAMPLE category list for the landing preview. The live catalogue (Phase 4) comes
 * from each store; this list is illustrative, not a promise of stock.
 */
export const CATEGORY_GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food & drinks' },
  { id: 'daily', label: 'Daily needs' },
  { id: 'study', label: 'Study' },
]

export const SAMPLE_CATEGORIES = [
  { id: 'fruits', name: 'Fruits & vegetables', group: 'food', art: 'Apple', tint: '#fee2e2' },
  { id: 'dairy', name: 'Milk, eggs & bread', group: 'food', art: 'MilkCarton', tint: '#dbeafe' },
  { id: 'bakery', name: 'Bakery & breakfast', group: 'food', art: 'BreadLoaf', tint: '#ffedd5' },
  { id: 'instant', name: 'Instant meals', group: 'food', art: 'NoodleCup', tint: '#fef3c7' },
  { id: 'drinks', name: 'Cold drinks & juices', group: 'food', art: 'SodaCan', tint: '#dcfce7' },
  { id: 'personal', name: 'Personal care', group: 'daily', art: 'SoapBottle', tint: '#ede9fe' },
  { id: 'household', name: 'Cleaning & household', group: 'daily', art: 'SprayBottle', tint: '#e0f2fe' },
  { id: 'stationery', name: 'Stationery', group: 'study', art: 'Notebook', tint: '#dcfce7' },
]
