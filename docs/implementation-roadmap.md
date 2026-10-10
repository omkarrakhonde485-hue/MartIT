# MartIT — Implementation Roadmap & Repository Audit

> **Document version:** 1.0.0  
> **Last updated:** 2026-10-10  
> **Repository state:** `main` branch, working-tree verified clean, 125/125 vitest tests passing, production SSR build passing.

---

## 1. Executive Summary & Audit Baseline

MartIT is a smart campus grocery delivery platform built with **React 19**, **Vite**, **React Router v7/v8 data router**, **TanStack Query v5**, **Zustand v5**, and **Tailwind CSS v4**.

An end-to-end repository audit was executed prior to implementing code changes. Below is the evidence-based assessment of all system capabilities.

### Evidence Classification Legend
1. **Implemented and tested:** Functional logic covered by automated unit/integration tests.
2. **Implemented only with mock data:** UI & domain services functional in-browser using mock server (`src/services/mockServer/`) and sample datasets.
3. **Partially implemented:** Slices of functionality built; remaining flows or edge-cases incomplete.
4. **Placeholder or not implemented:** Placeholder page (`PhasePlaceholder`), empty directory, or stubs.
5. **Needs a product decision:** Business logic or architecture requiring product owner confirmation.

---

## 2. Capability Audit

| Area | Feature / Module | Status | Primary Code References | Notes & Limitations |
|---|---|---|---|---|
| **Customer** | Catalogue Browsing | Implemented only with mock data | [`src/pages/customer/HomePage.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/pages/customer/HomePage.jsx), [`src/components/products/ProductGrid.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/components/products/ProductGrid.jsx) | Refactored in Milestone 1 to product-first discovery across all campus stores. |
| **Customer** | Catalogue Search | Implemented only with mock data | [`src/components/products/CatalogueSearch.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/components/products/CatalogueSearch.jsx) | In-memory search by name, pack, category. Tested in `catalogue.test.js`. |
| **Customer** | Category Browsing | Implemented only with mock data | [`src/components/products/CategoryPills.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/components/products/CategoryPills.jsx), [`src/mocks/categories.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/mocks/categories.js) | Dynamic category counts across catalogue products. Gliding active indicator. |
| **Customer** | Product Card & Stepper | Implemented only with mock data | [`src/components/products/ProductCard.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/components/products/ProductCard.jsx) | Stock badges, MRP discounts, quantity stepper connected to `cartStore`. |
| **Customer** | Cart Management | Implemented only with mock data | [`src/stores/cartStore.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/stores/cartStore.js), [`src/pages/customer/CartPage.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/pages/customer/CartPage.jsx) | Single-store cart with Zustand persistence. Tested in `checkoutFlow.test.js`. |
| **Customer** | Delivery Location Selector | Implemented only with mock data | [`src/components/cart/DeliveryLocationSelector.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/components/cart/DeliveryLocationSelector.jsx), [`src/mocks/campus.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/mocks/campus.js) | Grouped campus delivery spots (Hostels, Academic, Residential). |
| **Customer** | Delivery Fee Engine | **Implemented and tested** | [`src/utils/deliveryFee.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/utils/deliveryFee.js), [`src/config/fees.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/config/fees.js) | 33 vitest tests in `deliveryFee.test.js`. Strict unrounded distance tiers up to 5 km. |
| **Customer** | Dynamic Platform Fee | **Implemented and tested** | [`src/services/mockServer/platformFeeAllocator.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/services/mockServer/platformFeeAllocator.js) | 17 vitest tests in `platformFeeAllocator.test.js`. Smallest available paise (₹0.01–₹0.99), 2-min window, 5-min cooldown. |
| **Customer** | Order Creation & Repricing | **Implemented and tested** | [`src/services/mockServer/handlers.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/services/mockServer/handlers.js), [`src/services/orderService.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/services/orderService.js) | Server-authoritative re-pricing, stock check, fee snapshot. Tested in `checkoutFlow.test.js`. |
| **Customer** | UPI Payment & Verification Screen | **Implemented and tested** | [`src/pages/customer/PaymentPage.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/pages/customer/PaymentPage.jsx), [`src/components/payment/CustomerPaymentView.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/components/payment/CustomerPaymentView.jsx), [`src/utils/upi.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/utils/upi.js) | 20 vitest tests in `customerPaymentFlow.test.js`. Genuine UPI QR, authoritative timer, inconclusive feedback. |
| **Customer** | Order Confirmation | Implemented only with mock data | [`src/pages/customer/OrderConfirmationPage.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/pages/customer/OrderConfirmationPage.jsx), [`src/components/cart/OrderConfirmationView.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/components/cart/OrderConfirmationView.jsx) | Authoritative pricing snapshot view. Tested in `checkoutFlow.test.js`. |
| **Customer** | Orders History & Tracking | Placeholder or not implemented | [`src/pages/customer/OrdersPage.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/pages/customer/OrdersPage.jsx), [`src/components/orders/`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/components/orders) | Placeholder (`PhasePlaceholder` Phase 4). Component folder empty. |
| **Customer** | Profile & Saved Locations | Placeholder or not implemented | [`src/pages/customer/ProfilePage.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/pages/customer/ProfilePage.jsx) | Placeholder (`PhasePlaceholder` Phase 4). |
| **Auth** | Demo Login | Implemented only with mock data | [`src/pages/auth/LoginPage.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/pages/auth/LoginPage.jsx), [`src/stores/authStore.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/stores/authStore.js) | Sample accounts for customer, runner, super_admin. LocalStorage token persistence. |
| **Auth** | Registration / Sign Up | Placeholder or not implemented | [`src/pages/auth/SignupPage.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/pages/auth/SignupPage.jsx) | Placeholder (`PhasePlaceholder` Phase 3). |
| **Auth** | Role-Based Access Control | **Implemented and tested** | [`src/utils/permissions.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/utils/permissions.js), [`src/app/RouteGuards.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/app/RouteGuards.jsx) | Route guards + server-side permission enforcement. Tested in `admin.test.js`. |
| **Runner** | Runner Dashboard | Placeholder or not implemented | [`src/pages/runner/RunnerDashboardPage.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/pages/runner/RunnerDashboardPage.jsx), [`src/components/runner/`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/components/runner) | Placeholder (`PhasePlaceholder` Phase 5). Component folder empty. |
| **Runner** | Order Queue & Atomic Accept | Placeholder or not implemented | None | Planned for Phase 5. |
| **Runner** | Pickup & OTP Handover | Partially implemented | [`src/components/ui/OtpInput.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/components/ui/OtpInput.jsx) | UI OtpInput primitive exists; backend OTP generation & verification not built. |
| **Runner** | Payout Policy | Needs a product decision | [`src/config/fees.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/config/fees.js), [`src/utils/deliveryFee.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/utils/deliveryFee.js) | Only ₹10 -> ₹8 split defined. ₹15–₹35 tiers are `null`. |
| **Admin** | People & Roles Console | **Implemented and tested** | [`src/pages/admin/AdminConsolePage.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/pages/admin/AdminConsolePage.jsx), [`src/services/adminService.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/services/adminService.js) | 8 tests in `admin.test.js`. Approves/suspends runners, assigns roles, prevents self-demotion. |
| **Admin** | Store & Inventory Management | Placeholder or not implemented | None | Admin console only manages users & roles currently. |
| **Infrastructure** | API Client Transport | Partially implemented | [`src/services/api.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/services/api.js) | Switches between in-browser mock and `VITE_API_BASE_URL`. |
| **Infrastructure** | Routing / Distance | Implemented only with mock data | [`src/services/mockServer/routing.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/services/mockServer/routing.js) | Straight-line haversine distance. Real road/walking routing provider not connected. |
| **Infrastructure** | Payment Reconciliation | Implemented only with mock data | [`src/services/mockServer/verificationAdapter.js`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/services/mockServer/verificationAdapter.js) | Mock adapter simulating Make.com evidence. Real webhook listener not built. |

---

## 3. Store Selection Dependencies Analysis

Prior to this milestone, customer browsing enforced store selection:
1. **Catalogue Page (`src/pages/customer/HomePage.jsx`):** Held `selectedStoreId` state initialized to `stores[0]?.id`, rendered `<StoreHeader>` and `<StoreSelector>` dropdown, and restricted `useProducts(activeStoreId)` to only products matching that store ID.
2. **Category Counts (`src/components/products/CategoryPills.jsx`):** Computed counts solely from the single active store's product slice.
3. **Product Grid (`src/components/products/ProductGrid.jsx`):** Showed store-level closed banners and "for the selected store" empty state messages.
4. **Cart Store (`src/stores/cartStore.js`):** Maintained a single `storeId` per cart.
5. **Checkout & Order Creation (`src/pages/customer/CartPage.jsx` & `orders.create`):**
   - Cart submitted `{ storeId, locationId, lines }`.
   - `orders.create` validated that each product belonged to `storeId` (`p.storeId === storeId`) and computed delivery fee from that store's coordinates (`store.coords`).

### Fulfillment Architecture Limitation (Single-Store Orders)
- The existing data model and physical fulfillment model support **single-store fulfillment per order**.
- Campus runners pick up an order at one store and deliver it to one campus location.
- Multi-store orders would require multi-hop runner routing, split payouts, multiple delivery fees, or order splitting, none of which exist in the business rules.
- **Architectural Resolution:**
  - Shopping is **product-first**: customers browse and search across all campus stores without an upfront store selector.
  - Adding a product automatically sets the cart's fulfillment store from the product's `storeId` metadata.
  - Adding a product from a different store triggers the explicit single-store confirmation dialog ("Start a new cart?"), preventing mixed-store order corruption without inventing unsupported multi-store fulfillment policies.

---

## 4. Implementation Milestones

### Milestone 1: Product-First Shopping (Completed & Verified)
- [x] Complete repository audit and roadmap ([`docs/implementation-roadmap.md`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/docs/implementation-roadmap.md)).
- [x] Remove mandatory `<StoreHeader>` and `<StoreSelector>` from customer catalogue ([`src/pages/customer/HomePage.jsx`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/pages/customer/HomePage.jsx)).
- [x] Enable product discovery across all stores via `useProducts()` without mandatory store filtering.
- [x] Ensure category pills and search filter the comprehensive campus product set across all stores.
- [x] Display store fulfillment identity as non-blocking product metadata on [`ProductCard`](file:///c:/Users/omkar/OneDrive/Desktop/MyProjects/MartIT/src/components/products/ProductCard.jsx).
- [x] Preserve product availability, stock limits, and closed-store indicators per product.
- [x] Maintain single-store cart integrity with clear switch-store confirmation dialog.
- [x] Ensure checkout seamlessly resolves fulfillment store identity from product metadata without requiring prior store selection.
- [x] Add comprehensive vitest suite covering product-first browsing, search, stock validation, and checkout.
- [x] Full test suite verified: **136 passed** across 8 test suites (0 failed).
- [x] Production SSR and client builds verified (`npm run build`).

### Milestone 2: Customer Order History & Real-Time Simulation (Phase 4)
- [ ] Implement `src/pages/customer/OrdersPage.jsx` displaying past customer orders.
- [ ] Connect order tracking view with state transitions (`AWAITING_PAYMENT` -> `CONFIRMED` -> `PREPARING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`).
- [ ] Implement `src/pages/customer/ProfilePage.jsx` for managing saved delivery spots.

### Milestone 3: Real Authentication & Profile (Phase 3)
- [ ] Implement production email/password login and registration forms (`LoginPage.jsx`, `SignupPage.jsx`).
- [ ] Session management with secure token refresh.
- [ ] Password validation and college email domain verification.

### Milestone 4: Runner App & Delivery Handover (Phase 5)
- [ ] Implement `src/pages/runner/RunnerDashboardPage.jsx`.
- [ ] Implement active order queue with atomic accept lock (first runner to accept gets the order).
- [ ] Implement pickup verification and delivery OTP handover flow.
- [ ] Establish runner payout policy for distance bands > 1 km.

### Milestone 5: Production Backend, Database & Payment Webhook
- [ ] Replace in-browser mock server with production API endpoints.
- [ ] Set up PostgreSQL/Supabase database schema with ACID order creation and inventory locking.
- [ ] Implement secure server-side Make.com webhook listener for authoritative UPI payment reconciliation.
- [ ] Integrate routing provider (road/walking distance) to replace straight-line approximation.

---

## 5. Decisions Requiring Product Owner Input
1. **Multi-Store Orders vs Single-Store Cart:** Confirmed single-store cart per order is enforced as the safe architecture. Any future mixed-store feature requires defining split fees and runner assignment rules.
2. **Runner Payout Schedule:** Values for ₹15 (0.5–1 km), ₹20 (1–2 km), ₹25 (2–3 km), ₹30 (3–4 km), ₹35 (4–5 km) delivery fee bands remain `null`.
3. **Road Routing Provider:** Selection of road/walking routing service (e.g. Mapbox, Google Maps, OpenRouteService) to replace straight-line distance.
