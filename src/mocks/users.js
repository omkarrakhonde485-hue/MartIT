/**
 * SAMPLE ACCOUNTS for the in-browser mock server only.
 * Roles are assigned here (as an admin would), never chosen at signup.
 */
export const SAMPLE_USERS = [
  { id: 'u_customer_1', name: 'Aarav (sample)', email: 'customer@martit.test', roles: ['customer'], defaultLocationId: 'loc_hostel_b' },
  { id: 'u_runner_1', name: 'Meera (sample runner)', email: 'runner@martit.test', roles: ['customer', 'runner'], runnerStatus: 'approved', defaultLocationId: 'loc_hostel_a' },
]
