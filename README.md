# MartIT

Smart ordering and student-powered delivery for closed
communities---campuses, hostels, and residential societies. Customers
can browse essentials, place orders, pay by UPI, track order progress,
and receive deliveries from student runners with an OTP-verified
handover.

> **Implementation status:** This repository currently uses an
> in-browser mock backend when `VITE_API_BASE_URL` is unset. Sample data
> and mock authentication are for development only. Do not treat mock
> payment, tracking, or delivery flows as production integrations.

## Table of contents

-   [Project overview](#project-overview)
-   [Current implementation status](#current-implementation-status)
-   [Tech stack](#tech-stack)
-   [Getting started](#getting-started)
-   [Environment configuration](#environment-configuration)
-   [Useful routes](#useful-routes)
-   [Architecture and project
    structure](#architecture-and-project-structure)
-   [Business rules](#business-rules)
-   [Roles and permissions](#roles-and-permissions)
-   [Security notes](#security-notes)
-   [Testing and production build](#testing-and-production-build)
-   [Roadmap and open decisions](#roadmap-and-open-decisions)
-   [Documentation](#documentation)

## Project overview

MartIT is designed for closed communities where local stores supply
everyday essentials and student runners deliver orders within a defined
service area.

The application is organized around these capabilities:

-   Customer shopping and cart management.
-   Order creation and order-status workflows.
-   Delivery-fee calculation based on distance.
-   Runner workflows and administrative role management.
-   UPI payment and delivery handover flows, which still require
    production integrations as noted below.

## Current implementation status

The following describes the implementation documented in this
repository. Re-check the code before treating any item as
production-ready.

  -----------------------------------------------------------------------------
  Capability              Status                  Notes
  ----------------------- ----------------------- -----------------------------
  Delivery-fee            Implemented logic       `src/utils/deliveryFee.js`;
  calculation                                     unit-tested. Backend pricing
                                                  must match
                                                  `src/config/fees.js`.

  Order totals            Implemented logic       Currently includes item
                                                  totals and delivery fees.
                                                  Taxes, platform fees, and
                                                  discounts are not defined.

  Order and payment state Implemented logic       Separate state machines. Only
  machines                                        a trusted `server_verified`
                                                  source should mark a payment
                                                  as `PAID`.

  Backend and database    Mock                    `src/services/mockServer/`
                                                  uses in-memory data that
                                                  resets on reload.

  Authentication          Mock                    Sample accounts only; real
                                                  authentication is not
                                                  implemented in this mock
                                                  flow.

  Server-side re-pricing  Mock implementation     The mock ignores
  at order creation                               browser-supplied prices and
                                                  fees, rechecks stock,
                                                  re-quotes delivery, and
                                                  snapshots pricing. Production
                                                  must enforce this in a
                                                  trusted backend.

  Distance calculation    Mock                    Uses straight-line distance.
                                                  No routing provider is
                                                  connected; the UI labels this
                                                  accordingly.

  Store, product, and     Sample data             Located in `src/mocks/` and
  location data                                   labelled as sample data in
                                                  the UI.

  UPI payment             Not built               Must be implemented through a
  verification                                    trusted server-side
                                                  payment-verification flow.

  Atomic runner           Not built               Must be a server-side
  assignment                                      operation that prevents two
                                                  runners from accepting the
                                                  same order.

  Delivery OTP            UI only                 Backend verification, expiry,
  verification                                    attempt limits, and abuse
                                                  protection are still
                                                  required.

  Realtime tracking       Not built               Any current tracking display
                                                  is a simulation until a
                                                  realtime service is
                                                  integrated.

  Supabase persistence    Not established by this If Supabase is connected in a
                          repository README       newer version, update this
                                                  document to describe the
                                                  actual integration, schema,
                                                  migrations, and RLS policies.
  -----------------------------------------------------------------------------

## Tech stack

  -----------------------------------------------------------------------
  Area                                Technology
  ----------------------------------- -----------------------------------
  Application                         React 19, Vite, React Router data
                                      router, code-split routes

  Styling                             Tailwind CSS v4 and CSS-variable
                                      tokens

  Server state                        TanStack Query

  Client state                        Zustand for cart, session, and
                                      theme

  UI primitives                       Radix UI (`radix-ui`)

  Motion                              Motion (`motion/react`) and Lenis;
                                      GSAP + ScrollTrigger are installed
                                      for planned Phase 2 storytelling

  Icons and fonts                     Lucide; self-hosted Bricolage
                                      Grotesque and Geist

  Tests                               Vitest
  -----------------------------------------------------------------------

## Getting started

### Prerequisites

-   Node.js 20 or later
-   npm

### Install and run

``` bash
npm install
cp .env.example .env.local
npm run dev
```

The development server is available at `http://localhost:5173`.

Leave `VITE_API_BASE_URL` empty in `.env.local` to use the in-browser
mock backend.

### Available scripts

``` bash
npm test
npm run build
npm run dev
```

-   `npm test` runs the configured Vitest unit tests.
-   `npm run build` creates the production frontend bundle in `dist/`.
-   `npm run dev` starts the local development server.

## Environment configuration

Configuration is documented in `.env.example`. The frontend reads public
`VITE_*` values.

-   `VITE_API_BASE_URL` empty: use the in-browser mock backend.
-   `VITE_API_BASE_URL` set: service calls are sent to
    `${VITE_API_BASE_URL}/<service>/<action>` with a bearer token, as
    implemented by `src/services/api.js`.

Only put values intended to be public in frontend `VITE_*` variables.
**Never put database passwords, service-role keys, payment secrets, or
other privileged credentials in frontend environment variables.**
Secrets belong in a trusted backend or secret manager.

If the project is switched to Supabase, document the exact public client
configuration and server-only secrets used by the implementation. Do not
assume Supabase is connected merely because a project exists.

## Useful routes

  -----------------------------------------------------------------------
  Route                               Purpose
  ----------------------------------- -----------------------------------
  `/`                                 Landing page; currently a shell in
                                      Phase 1, with the full page planned
                                      for Phase 2.

  `/styleguide`                       Internal design tokens, components,
                                      delivery-fee lab, and access-rules
                                      tester. Not linked from the public
                                      site.

  `/login`                            Mock sign-in for sample customer,
                                      approved runner, and super-admin
                                      accounts. Mock backend only.

  `/admin`                            Admin console for people and roles;
                                      intended for admins and super
                                      admins.
  -----------------------------------------------------------------------

## Architecture and project structure

``` text
src/
  app/          router, providers, layouts, route guards
  components/   ui/ primitives, layout, products, cart, orders, runner, marketing
  pages/        landing, auth, customer, runner, dev/styleguide
  services/     domain services (auth, delivery, orders, locations)
                api.js -> configured backend or mockServer
  config/       fees.js (pricing configuration), env.js
  utils/        deliveryFee, orderTotals, order/payment state machines,
                distance, currency, permissions
  hooks/
  stores/
  mocks/
  styles/
docs/           design research, fee policy, brand assets
```

### Request flow

Components should not call the backend directly. They call domain
services under `src/services/`, which route requests through
`src/services/api.js`.

-   With an empty `VITE_API_BASE_URL`, calls are handled by the
    in-browser mock server.
-   With `VITE_API_BASE_URL` configured, the API layer sends requests to
    the configured backend using the service/action path and bearer
    token.

Keep domain logic out of UI components where practical. Validate all
input and enforce sensitive business rules in the trusted backend;
frontend checks improve user experience but are not a security boundary.

## Business rules

### Delivery fees

The delivery-fee policy was confirmed on 2026-10-09. See
[`docs/fee-policy.md`](docs/fee-policy.md).

-   ₹10 for distances up to 0.5 km.
-   ₹15 for distances over 0.5 km and up to 1 km.
-   ₹20 for distances over 1 km and up to 2 km.
-   Beyond 2 km, add ₹5 for every started kilometre.
-   Checkout is blocked beyond 5 km.
-   There is no free-delivery tier.
-   Calculate the fee using the unrounded distance.
-   The trusted server must be authoritative for the final fee.

### Pricing snapshots

Each order should preserve the pricing context used at creation,
including the delivery fee, distance, distance method, and pricing
version. This helps explain historical totals if pricing rules change
later.

### Runner payout

Runner payout is separate from the delivery fee charged to the customer.
Only the ₹10 fee → ₹8 runner payout example is defined so far. Other
payout bands remain undecided and are represented as `null` in the
current design.

### Order and payment states

Order and payment state machines are separate. A client must not be able
to mark a payment as paid by sending a status update. Only a trusted
server-side verification flow should transition payment state to `PAID`.

### Distance

The current mock uses straight-line distance, not walking or road
distance. The interface should continue to label this accurately until a
routing provider is integrated.

## Roles and permissions

The documented role model is defined in `src/utils/permissions.js`.

  -----------------------------------------------------------------------
  Role                                Intended capabilities
  ----------------------------------- -----------------------------------
  Customer                            Shop and view their own orders.
                                      Every sign-up receives the customer
                                      role by default.

  Runner                              Deliver orders only after
                                      `runnerStatus` is `approved`.

  Admin                               Open the admin console, view users,
                                      approve or suspend runners, and
                                      view orders.

  Super admin                         Manage roles and pricing, and
                                      perform all administrative actions,
                                      including assigning or removing
                                      admin and super-admin roles subject
                                      to safeguards.
  -----------------------------------------------------------------------

Additional rules:

-   Users cannot choose their role at sign-up.
-   A super admin cannot remove their own super-admin role.
-   The last super admin cannot be removed.
-   Route guards are for user experience; authorization must also be
    enforced by the trusted server or database policies.

These rules must be tested against the actual backend implementation
before deployment.

## Security notes

Before using real users, orders, payments, or delivery operations:

-   Replace mock authentication with a supported authentication system.
-   Enforce authorization on every sensitive server operation.
-   Validate prices, stock, delivery fees, order ownership, and status
    transitions on the server.
-   Use atomic operations for inventory reservation and runner
    assignment.
-   Verify payment status with the payment provider through a trusted
    server-side flow.
-   Store OTPs securely, enforce expiry and attempt limits, and avoid
    logging plaintext codes.
-   Keep privileged secrets out of frontend bundles and source control.
-   Add tests for cross-user access and unauthorized role changes.
-   Configure and test database policies if a persistent database such
    as Supabase is integrated.
-   Establish backups, monitoring, and recovery procedures before
    production launch.

## Testing and production build

Run the unit tests and production build before submitting changes:

``` bash
npm test
npm run build
```

The current test suite covers fees, state machines, and the mock server,
according to the project setup. Passing these tests does not prove that
real authentication, payment verification, database authorization,
realtime tracking, or delivery OTP verification works.

As production integrations are added, include tests for:

-   Order total and delivery-fee edge cases.
-   Unauthorized access to other customers' orders.
-   Concurrent inventory reservations.
-   Concurrent runner acceptance.
-   Duplicate and delayed payment notifications.
-   OTP expiry, repeated failures, and resend limits.
-   Database migrations and access policies, if a persistent database is
    used.

## Roadmap and open decisions

The README's documented phase plan includes a full landing page in Phase
2, real login in Phase 3, payment verification and realtime tracking
work in Phase 4, and atomic runner assignment and delivery OTP
verification in Phase 5. Confirm current progress in the code before
changing these statuses.

Open decisions:

-   Runner payout values for the ₹15--₹35 delivery-fee bands.
-   Tax and platform-fee values, if any.
-   A vector (SVG) version of the logo; the current mark is extracted
    from the supplied raster image under `public/brand/`.
-   A routing provider for walking or road distance.
-   Production backend and persistent database integration details, if
    not already implemented in the current branch.

## Documentation

-   [Delivery fee policy](docs/fee-policy.md)
-   `docs/` --- design research, fee policy, and brand assets
-   `.env.example` --- supported frontend environment configuration

Update this README whenever implementation status, setup commands,
environment variables, or production architecture changes. Keep claims
about security and production readiness aligned with code and tests.
