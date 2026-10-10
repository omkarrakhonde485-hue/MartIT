# MartIT — Delivery Fee Policy

**Status: confirmed by the product owner, 2026-10-09.** Code: `src/config/fees.js`, `src/utils/deliveryFee.js`. Tests: `src/utils/__tests__/deliveryFee.test.js`.

## Customer delivery fee
| Delivery distance `d` | Fee |
|---|---|
| 0 < d ≤ 0.5 km | ₹10 |
| 0.5 < d ≤ 1 km | ₹15 |
| 1 < d ≤ 2 km | ₹20 |
| 2 < d ≤ 3 km | ₹25 |
| 3 < d ≤ 4 km | ₹30 |
| 4 < d ≤ 5 km | ₹35 |
| d > 5 km | Checkout blocked |

- A distance exactly on a boundary gets the lower fee.
- Every started kilometre beyond 2 km adds ₹5: `20 + 5 × ceil(d − 2)`.
- There is no free delivery, whatever the cart value.
- The maximum delivery radius is 5 km.
- The fee is calculated from the **unrounded** distance, so 1.001 km costs ₹20, never ₹15. The only tolerance is 1 µm, which absorbs floating-point noise.

## Authority and snapshots
- The server calculates the authoritative distance, from the selected store (or across all participating stores for multi-store orders) to the saved delivery location. The browser shows estimates only.
- A fee submitted by the browser is never trusted. The server re-prices items, re-checks stock and recalculates the fee when the order is created.
- Each order saves its delivery fee, distance, distance method and pricing version, so later pricing changes don't affect existing orders.
- If the delivery location or store changes, the fee is re-quoted before checkout is confirmed.
- Outside the service radius, checkout is blocked with a clear message.

## Multi-store combined route policy (Confirmed 2026-10-10)
- When a customer purchases products across multiple stores in a single checkout, exactly **one combined delivery fee** is charged based on the complete multi-stop route.
- The combined route visits all participating store pickup locations and finishes at the customer delivery location.
- The existing distance fee tiers apply directly to the combined route distance:
  - ₹10 up to 0.5 km.
  - ₹15 above 0.5 km through 1 km.
  - ₹20 above 1 km through 2 km.
  - ₹5 for each started kilometre above 2 km through 5 km (`20 + 5 × ceil(d − 2)`).
  - Routes exceeding 5 km are blocked.
- The route distance must be based on an authoritative, real route calculation from a configured routing provider (walking/road), never straight-line estimates or fabricated numbers.
- If no configured route provider is available, or the combined route cannot be calculated reliably, no distance or fee is fabricated, and checkout is blocked with an explicit error.

## Distance method
- When a routing service is available, its route distance is used (`distanceMethod: 'route'`).
- Otherwise, straight-line distance is used (`'straight_line'`). The UI must say "straight-line" and never present it as walking or road distance.
- No routing service is connected yet, so the mock uses straight-line distance.

## Customer total
`item subtotal + delivery fee`. Taxes, platform fees and discounts stay excluded until explicitly defined.

## Fee split (internal ledger, never shown to customers)
- The customer delivery fee and the runner's payout are separate values.
- Example given: a ₹10 short-distance fee pays the runner ₹8 and MartIT keeps ₹2. MartIT's ₹2 is before payment processing, support and promotion costs.
- Runner payout must rise with distance and effort. **Payouts for the ₹15–₹35 bands are not decided yet.** They are `null` in config, and the UI shows "payout confirmed at assignment" rather than inventing a figure.
- Any store commission goes in a separate ledger and is not derived from the delivery fee.
