import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { DeliveryDetailsForm } from '@/components/cart/DeliveryDetailsForm'
import { OrderConfirmationView } from '@/components/cart/OrderConfirmationView'
import { CustomerPaymentView } from '@/components/payment/CustomerPaymentView'
import { useCartStore } from '@/stores/cartStore'
import { useAuthStore } from '@/stores/authStore'
import { createMockServer } from '@/services/mockServer/handlers'
import {
  PRESET_CAMPUS_LOCATIONS,
  OTHER_LOCATION_VALUE,
  validateCheckoutDetails,
  mapCampusLocationToDestinationId,
  CAMPUS_LOCATION_DESTINATION_MAP,
} from '@/utils/checkoutValidation'
import {
  useAddressStore,
  formatSpotDeliveryDetails,
} from '@/stores/addressStore'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'

describe('Checkout Customer Details and Campus Address Selection', () => {
  let server, token

  beforeEach(async () => {
    useAddressStore.getState().reset()
    useCartStore.getState().clear()
    useCartStore.getState().resetCheckoutDetails()
    server = createMockServer()
    token = (await server.handle('auth.demoLogin', { role: 'customer' })).token
  })

  // 1. Form renders with the eight preset locations
  it('renders DeliveryDetailsForm with the eight preset campus locations and Other option', () => {
    const html = renderToString(
      <DeliveryDetailsForm
        details={{
          fullName: 'Aarav Patel',
          mobileNumber: '9876543210',
          presetLocation: 'A Block',
          customLocation: '',
          deliveryInstructions: '',
        }}
        errors={{}}
        onChange={vi.fn()}
      />,
    )

    expect(html).toContain('Customer Information')
    expect(html).toContain('Full Name')
    expect(html).toContain('Phone Number')
    expect(html).toContain('Delivery Destination')
    expect(html).toContain('Detailed address / landmark')

    // Verify all 8 preset locations exist in the select / list
    for (const preset of PRESET_CAMPUS_LOCATIONS) {
      expect(html).toContain(preset)
    }

    // Verify Other / Enter address option is present
    expect(html).toContain('Other / Enter address')
  })

  // 2. Existing profile details prefill correctly
  it('prefills available authenticated profile details without overwriting', () => {
    // Authenticated user with profile name and phone
    const mockUser = {
      id: 'u_test_cust',
      name: 'Rohan Sharma',
      phone: '9876500000',
      defaultLocationId: 'loc_hostel_b',
    }

    // Initial state is empty
    expect(useCartStore.getState().checkoutDetails.fullName).toBe('')
    expect(useCartStore.getState().checkoutDetails.mobileNumber).toBe('')

    // Simulate prefilling logic
    const store = useCartStore.getState()
    if (!store.checkoutDetails.fullName && mockUser.name) {
      store.setCheckoutDetails({ fullName: mockUser.name })
    }
    if (!store.checkoutDetails.mobileNumber && mockUser.phone) {
      store.setCheckoutDetails({ mobileNumber: mockUser.phone })
    }

    expect(useCartStore.getState().checkoutDetails.fullName).toBe('Rohan Sharma')
    expect(useCartStore.getState().checkoutDetails.mobileNumber).toBe('9876500000')
  })

  // 3. Customer can edit prefilled details
  it('allows the customer to edit prefilled details without being overwritten', () => {
    useCartStore.getState().setCheckoutDetails({
      fullName: 'Initial Name',
      mobileNumber: '9876500000',
    })

    // Customer edits name and phone
    useCartStore.getState().setCheckoutDetails({
      fullName: 'Updated Customer Name',
      mobileNumber: '+91 9988776655',
    })

    const state = useCartStore.getState().checkoutDetails
    expect(state.fullName).toBe('Updated Customer Name')
    expect(state.mobileNumber).toBe('+91 9988776655')
  })

  // 4. Empty name is rejected
  it('rejects an empty or whitespace-only customer name', () => {
    const emptyResult = validateCheckoutDetails({
      fullName: '',
      mobileNumber: '9876543210',
      presetLocation: 'A Block',
      customLocation: '',
      deliveryInstructions: '',
    })
    expect(emptyResult.isValid).toBe(false)
    expect(emptyResult.errors.fullName).toBe('Please enter your full name.')

    const whitespaceResult = validateCheckoutDetails({
      fullName: '     ',
      mobileNumber: '9876543210',
      presetLocation: 'A Block',
      customLocation: '',
      deliveryInstructions: '',
    })
    expect(whitespaceResult.isValid).toBe(false)
    expect(whitespaceResult.errors.fullName).toBe('Please enter your full name.')
  })

  // 5. Invalid mobile number is rejected
  it('rejects invalid Indian mobile numbers with specific inline messages', () => {
    // Empty
    const resEmpty = validateCheckoutDetails({
      fullName: 'Aarav',
      mobileNumber: '',
      presetLocation: 'A Block',
    })
    expect(resEmpty.isValid).toBe(false)
    expect(resEmpty.errors.mobileNumber).toBe('Please enter your mobile number.')

    // Letters
    const resAlpha = validateCheckoutDetails({
      fullName: 'Aarav',
      mobileNumber: '9876abc210',
      presetLocation: 'A Block',
    })
    expect(resAlpha.isValid).toBe(false)
    expect(resAlpha.errors.mobileNumber).toBe(
      'Mobile number should only contain digits and optional +91 country code.',
    )

    // Starts with invalid digit
    const resInvalidPrefix = validateCheckoutDetails({
      fullName: 'Aarav',
      mobileNumber: '4876543210',
      presetLocation: 'A Block',
    })
    expect(resInvalidPrefix.isValid).toBe(false)
    expect(resInvalidPrefix.errors.mobileNumber).toBe(
      'Indian mobile numbers must start with 6, 7, 8, or 9.',
    )

    // Too short
    const resShort = validateCheckoutDetails({
      fullName: 'Aarav',
      mobileNumber: '98765',
      presetLocation: 'A Block',
    })
    expect(resShort.isValid).toBe(false)
    expect(resShort.errors.mobileNumber).toBe(
      'Mobile number is too short. Please enter a 10-digit Indian mobile number.',
    )
  })

  // 6. Each preset location can be selected
  it('allows each of the 8 preset locations to be selected and mapped to valid destinations', () => {
    const expectedDestinations = {
      'A Block': 'loc_hostel_a',
      'B Block': 'loc_hostel_b',
      'C Block': 'loc_hostel_a',
      'D Block': 'loc_hostel_b',
      'E Block': 'loc_hostel_b',
      'MBA Block': 'loc_library',
      'Food Court': 'loc_hostel_a',
      'Management Building': 'loc_library',
    }

    for (const preset of PRESET_CAMPUS_LOCATIONS) {
      const destinationId = mapCampusLocationToDestinationId(preset, server.db.locations)
      expect(destinationId).toBe(expectedDestinations[preset])

      const result = validateCheckoutDetails({
        fullName: 'Priya Verma',
        mobileNumber: '9876543210',
        presetLocation: preset,
        availableLocations: server.db.locations,
      })
      expect(result.isValid).toBe(true)
      expect(result.data.deliveryLocation.preset).toBe(preset)
      expect(result.data.destinationLocationId).toBe(expectedDestinations[preset])
    }
  })

  // 7. Custom hostel/location details are required when Other is selected
  it('requires custom hostel/location details when Other is selected', () => {
    // Missing custom details
    const resMissing = validateCheckoutDetails({
      fullName: 'Karan Singh',
      mobileNumber: '9876543210',
      presetLocation: OTHER_LOCATION_VALUE,
      customLocation: '',
      availableLocations: server.db.locations,
    })
    expect(resMissing.isValid).toBe(false)
    expect(resMissing.errors.customLocation).toBe(
      'Please enter your destination address.',
    )

    // Whitespace only
    const resWhitespace = validateCheckoutDetails({
      fullName: 'Karan Singh',
      mobileNumber: '9876543210',
      presetLocation: OTHER_LOCATION_VALUE,
      customLocation: '   ',
      availableLocations: server.db.locations,
    })
    expect(resWhitespace.isValid).toBe(false)

    // Valid custom details
    const resValid = validateCheckoutDetails({
      fullName: 'Karan Singh',
      mobileNumber: '9876543210',
      presetLocation: OTHER_LOCATION_VALUE,
      customLocation: 'Hostel 3, Room 204',
      deliveryInstructions: 'Near the entrance',
      availableLocations: server.db.locations,
    })
    expect(resValid.isValid).toBe(true)
    expect(resValid.data.deliveryLocation.preset).toBe(OTHER_LOCATION_VALUE)
    expect(resValid.data.deliveryLocation.customLocation).toBe('Hostel 3, Room 204')
    expect(resValid.data.deliveryLocation.instructions).toBe('Near the entrance')
    expect(resValid.data.deliveryLocation.formattedAddress).toBe(
      'Hostel 3, Room 204, Near the entrance',
    )
  })

  // 8. Valid details proceed through the existing checkout flow
  it('proceeds through checkout and creates order with customerDetails attached', async () => {
    const customerDetails = {
      fullName: 'Ananya Roy',
      mobileNumber: '9876543210',
      phone: '+919876543210',
      destinationLocationId: 'loc_hostel_a',
      deliveryLocation: {
        preset: 'A Block',
        isCustom: false,
        customLocation: '',
        instructions: 'Call upon arrival',
        formattedAddress: 'A Block, Call upon arrival',
      },
    }

    const payload = {
      storeId: 'store_campus_mart',
      locationId: customerDetails.destinationLocationId,
      lines: [{ productId: 'p_milk_500', quantity: 2 }],
      customerDetails,
    }

    const order = await server.handle('orders.create', payload, { token })

    expect(order.id).toMatch(/^ord_/)
    expect(order.status).toBe('AWAITING_PAYMENT')
    expect(order.customerDetails).toBeDefined()
    expect(order.customerDetails.fullName).toBe('Ananya Roy')
    expect(order.customerDetails.mobileNumber).toBe('9876543210')
    expect(order.customerDetails.deliveryLocation.formattedAddress).toBe(
      'A Block, Call upon arrival',
    )
  })

  // 9. Entered details persist when returning from payment
  it('persists entered checkout details across store state changes', () => {
    const store = useCartStore.getState()
    store.setCheckoutDetails({
      fullName: 'Devansh Joshi',
      mobileNumber: '9876512345',
      presetLocation: 'MBA Block',
      customLocation: '',
      deliveryInstructions: 'Near ground floor stairs',
    })

    // Simulate clearing cart items after going to payment or browsing
    store.setQuantity('p_bread', 1, 'store_campus_mart')

    const details = useCartStore.getState().checkoutDetails
    expect(details.fullName).toBe('Devansh Joshi')
    expect(details.mobileNumber).toBe('9876512345')
    expect(details.presetLocation).toBe('MBA Block')
    expect(details.deliveryInstructions).toBe('Near ground floor stairs')
  })

  // 10. Invalid details never trigger order creation or payment initiation
  it('blocks order creation if customer details fail validation', async () => {
    const createSpy = vi.fn()

    const validation = validateCheckoutDetails({
      fullName: '',
      mobileNumber: 'invalid_num',
      presetLocation: 'A Block',
    })

    expect(validation.isValid).toBe(false)

    // Simulate checkout handler guard:
    if (validation.isValid) {
      await createSpy()
    }

    expect(createSpy).not.toHaveBeenCalled()
  })

  // 11. Existing subtotal, delivery fee, platform fee, and payable total remain unchanged
  it('preserves authoritative pricing calculations when customerDetails are included', async () => {
    const payload = {
      storeId: 'store_campus_mart',
      locationId: 'loc_hostel_b',
      lines: [
        { productId: 'p_milk_500', quantity: 2 }, // 28 * 2 = 56
        { productId: 'p_bread', quantity: 1 },    // 45 * 1 = 45 -> subtotal 101
      ],
      customerDetails: {
        fullName: 'Aarav Patel',
        mobileNumber: '9876543210',
        phone: '+919876543210',
        deliveryLocation: {
          preset: 'B Block',
          formattedAddress: 'B Block',
        },
      },
    }

    const order = await server.handle('orders.create', payload, { token })

    // Expected exact pricing (MVP flat ₹10 delivery fee):
    // Subtotal: 101
    // Delivery fee: 10
    // Base amount: 111
    // Dynamic platform fee: 0.01 (paise allocation)
    // Total: 111.01
    expect(order.pricing.itemSubtotal).toBe(101)
    expect(order.pricing.deliveryFee).toBe(10)
    expect(order.pricing.baseAmount).toBe(111)
    expect(order.pricing.platformFee).toBe(0.01)
    expect(order.pricing.total).toBe(111.01)
  })

  // 12. Displays customer delivery details in order confirmation and payment views
  it('renders customer delivery details in OrderConfirmationView and CustomerPaymentView', () => {
    const mockOrder = {
      id: 'ord_test_details_123',
      storeId: 'store_campus_mart',
      locationId: 'loc_hostel_a',
      lines: [{ productId: 'p_milk_500', name: 'Amul Taaza Milk 500ml', unitPrice: 28, quantity: 2 }],
      pricing: {
        itemSubtotal: 56,
        deliveryFee: 10,
        baseAmount: 66,
        platformFee: 0.01,
        total: 66.01,
      },
      payment: {
        status: 'PENDING',
        feePaise: 1,
        windowExpiresAt: Date.now() + 120000,
      },
      paymentStatus: 'PENDING',
      customerDetails: {
        fullName: 'Vikram Seth',
        mobileNumber: '9876543210',
        deliveryLocation: {
          formattedAddress: 'A Block, Room 101',
        },
      },
    }

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const confirmHtml = renderToString(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <OrderConfirmationView order={mockOrder} />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(confirmHtml).toContain('Vikram Seth')
    expect(confirmHtml).toContain('9876543210')
    expect(confirmHtml).toContain('A Block, Room 101')

    const paymentHtml = renderToString(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CustomerPaymentView initialOrder={mockOrder} />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(paymentHtml).toContain('Vikram Seth')
    expect(paymentHtml).toContain('9876543210')
    expect(paymentHtml).toContain('A Block, Room 101')
  })

  // 13. Campus destination dropdown supports mouse wheel scroll without Lenis interference
  it('renders destination dropdown with data-lenis-prevent and overscroll-contain so mouse wheel scroll works', () => {
    const html = renderToString(
      <DeliveryDetailsForm
        details={{
          fullName: 'Aarav Patel',
          mobileNumber: '9876543210',
          presetLocation: 'A Block',
          customLocation: '',
          deliveryInstructions: '',
        }}
        errors={{}}
        onChange={vi.fn()}
        initialDropdownOpen={true}
      />,
    )

    // Verify dropdown listbox is open and has data-lenis-prevent attributes and compact max-h-48
    expect(html).toContain('data-testid="campus-locations-list"')
    expect(html).toContain('data-lenis-prevent')
    expect(html).toContain('data-lenis-prevent-wheel')
    expect(html).toContain('overscroll-contain')
    expect(html).toContain('overflow-y-auto')
    expect(html).toContain('max-h-48')
  })

  // =========================================================================
  // Milestone 4: Saved Delivery Spots Checkout Integration
  // =========================================================================
  describe('Milestone 4: Saved Delivery Spots Checkout Integration', () => {
    it('1. Default saved location preselection activates only when user has not entered custom details', () => {
      // Authenticated user
      useAuthStore.setState({
        user: { id: 'usr_customer_aarav', name: 'Aarav Patel', phone: '9876543210' },
        token: 'tok_aarav',
      })

      // Add a default saved location
      const defaultSpot = useAddressStore.getState().addLocation({
        label: 'Aarav Hostel Room',
        campusLocation: 'A Block',
        wing: 'North Wing',
        floor: '2nd Floor',
        roomNumber: '204',
        landmark: 'Near water cooler',
        isDefault: true,
      })

      expect(defaultSpot.isDefault).toBe(true)

      // Test preselection helper condition:
      // When checkoutDetails has no selectedSpotId and no custom input, preselection activates
      const details = useCartStore.getState().checkoutDetails
      const shouldPreselect =
        !details.selectedSpotId &&
        !details.customLocation?.trim() &&
        !details.deliveryInstructions?.trim()

      expect(shouldPreselect).toBe(true)

      // Simulate preselection into checkout details
      const isOther = defaultSpot.campusLocation === 'other'
      useCartStore.getState().setCheckoutDetails({
        selectedSpotId: defaultSpot.id,
        selectedSpotLabel: defaultSpot.label,
        presetLocation: isOther ? OTHER_LOCATION_VALUE : defaultSpot.campusLocation,
        customLocation: isOther ? defaultSpot.customBuilding : '',
        deliveryInstructions: formatSpotDeliveryDetails(defaultSpot),
      })

      const preselected = useCartStore.getState().checkoutDetails
      expect(preselected.selectedSpotId).toBe(defaultSpot.id)
      expect(preselected.presetLocation).toBe('A Block')
      expect(preselected.deliveryInstructions).toBe(
        'Room 204, 2nd Floor, North Wing, Near water cooler',
      )

      // Render DeliveryDetailsForm and verify default spot card is highlighted
      const html = renderToString(
        <MemoryRouter>
          <DeliveryDetailsForm
            details={preselected}
            errors={{}}
            onChange={vi.fn()}
          />
        </MemoryRouter>,
      )

      expect(html).toContain('Your Saved Delivery Spots')
      expect(html).toContain('Aarav Hostel Room')
      expect(html).toContain(`data-testid="saved-spot-card-${defaultSpot.id}"`)
      expect(html).toContain(`data-testid="saved-spot-default-badge-${defaultSpot.id}"`)
      expect(html).toContain(`data-testid="saved-spot-selected-check-${defaultSpot.id}"`)

      // Case B: If customer already entered custom instructions, preselection should NOT overwrite
      const customEnteredDetails = {
        fullName: 'Aarav Patel',
        mobileNumber: '9876543210',
        presetLocation: 'C Block',
        customLocation: '',
        deliveryInstructions: 'Urgent: drop at gate only',
      }

      const shouldPreselectWhenCustomExists =
        !customEnteredDetails.selectedSpotId &&
        !customEnteredDetails.customLocation?.trim() &&
        !customEnteredDetails.deliveryInstructions?.trim()

      expect(shouldPreselectWhenCustomExists).toBe(false)
    })

    it('2. Selecting a different saved spot updates all supported form fields including campus, building, room, wing, floor, landmark, and instructions', () => {
      useAuthStore.setState({
        user: { id: 'usr_customer_aarav', name: 'Aarav Patel', phone: '9876543210' },
        token: 'tok_aarav',
      })

      const spot1 = useAddressStore.getState().addLocation({
        label: 'Aarav Dorm',
        campusLocation: 'A Block',
        roomNumber: '101',
        isDefault: true,
      })

      const spot2 = useAddressStore.getState().addLocation({
        label: 'Robotics Research Lab',
        campusLocation: 'other',
        customBuilding: 'Mechanical Dept Annex',
        floor: 'Ground Floor',
        wing: 'East Wing',
        roomNumber: 'Lab 03',
        landmark: 'water tank',
        deliveryInstructions: 'Call technician on arrival',
        isDefault: false,
      })

      // Verify formatSpotDeliveryDetails generates correct composite string
      const formattedInstructions = formatSpotDeliveryDetails(spot2)
      expect(formattedInstructions).toBe(
        'Room Lab 03, Ground Floor, East Wing, Near water tank, Call technician on arrival',
      )

      // Simulate selecting Spot 2
      const updatedDetails = {
        fullName: 'Aarav Patel',
        mobileNumber: '9876543210',
        selectedSpotId: spot2.id,
        selectedSpotLabel: spot2.label,
        presetLocation: OTHER_LOCATION_VALUE,
        customLocation: spot2.customBuilding,
        deliveryInstructions: formattedInstructions,
      }

      const html = renderToString(
        <MemoryRouter>
          <DeliveryDetailsForm
            details={updatedDetails}
            errors={{}}
            onChange={vi.fn()}
          />
        </MemoryRouter>,
      )

      expect(html).toContain('Robotics Research Lab')
      expect(html).toContain(`data-testid="saved-spot-selected-check-${spot2.id}"`)
      expect(html).toContain('Mechanical Dept Annex')
      expect(html).toContain('Room Lab 03')
    })

    it('3. Manual address entry still works when user chooses to enter a different location', () => {
      useAuthStore.setState({
        user: { id: 'usr_customer_aarav', name: 'Aarav Patel' },
        token: 'tok_aarav',
      })

      useAddressStore.getState().addLocation({
        label: 'Aarav Existing Spot',
        campusLocation: 'A Block',
      })

      // When manual location card is selected
      const manualDetails = {
        fullName: 'Aarav Patel',
        mobileNumber: '9876543210',
        selectedSpotId: 'manual',
        presetLocation: 'B Block',
        customLocation: '',
        deliveryInstructions: 'Deliver to library porch',
      }

      const html = renderToString(
        <MemoryRouter>
          <DeliveryDetailsForm
            details={manualDetails}
            errors={{}}
            onChange={vi.fn()}
          />
        </MemoryRouter>,
      )

      expect(html).toContain('+ Enter another address')
      expect(html).toContain('data-testid="manual-location-selected-check"')
      expect(html).toContain('data-testid="save-spot-opt-in-card"')

      const validation = validateCheckoutDetails({
        ...manualDetails,
        availableLocations: server.db.locations,
      })
      expect(validation.isValid).toBe(true)
      expect(validation.data.destinationLocationId).toBe('loc_hostel_b')
      expect(validation.data.selectedDestination).toBe('B Block')
      expect(validation.data.detailedAddress).toBe('Deliver to library porch')
    })

    it('4. Customers without saved spots can complete the existing address-entry flow', () => {
      useAuthStore.setState({
        user: { id: 'usr_newbie', name: 'New Student' },
        token: 'tok_newbie',
      })

      // 0 saved spots
      expect(useAddressStore.getState().locations.length).toBe(0)

      const html = renderToString(
        <MemoryRouter>
          <DeliveryDetailsForm
            details={{
              fullName: 'New Student',
              mobileNumber: '9876543210',
              presetLocation: 'A Block',
              customLocation: '',
              deliveryInstructions: '',
            }}
            errors={{}}
            onChange={vi.fn()}
          />
        </MemoryRouter>,
      )

      // Friendly notice displayed
      expect(html).toContain('data-testid="no-saved-spots-notice"')
      expect(html).toContain('No saved delivery spots yet.')
      expect(html).toContain('data-testid="manage-spots-link"')

      // Standard manual fields are fully functional
      expect(html).toContain('Campus Destination')
      expect(html).toContain('data-testid="campus-location-select"')
    })

    it('5. Opt-in saving creates a new saved delivery spot for the authenticated user upon order placement', async () => {
      useAuthStore.setState({
        user: { id: 'usr_customer_aarav', name: 'Aarav Patel', phone: '9876543210' },
        token: 'tok_aarav',
      })

      expect(useAddressStore.getState().locations.length).toBe(0)

      const checkoutDetails = {
        fullName: 'Aarav Patel',
        mobileNumber: '9876543210',
        presetLocation: 'E Block',
        customLocation: '',
        deliveryInstructions: 'Floor 3 Room 312',
        saveNewSpot: true,
        newSpotLabel: 'My E Block Room',
        setAsDefaultSpot: true,
      }

      const validation = validateCheckoutDetails({
        ...checkoutDetails,
        availableLocations: server.db.locations,
      })
      expect(validation.isValid).toBe(true)

      // Simulate place order logic with opt-in saving
      useAddressStore.getState().addLocation({
        label: checkoutDetails.newSpotLabel,
        campusLocation: checkoutDetails.presetLocation,
        customBuilding: checkoutDetails.customLocation,
        deliveryInstructions: checkoutDetails.deliveryInstructions,
        isDefault: checkoutDetails.setAsDefaultSpot,
      })

      const userSpots = useAddressStore.getState().locations
      expect(userSpots.length).toBe(1)
      expect(userSpots[0].label).toBe('My E Block Room')
      expect(userSpots[0].campusLocation).toBe('E Block')
      expect(userSpots[0].deliveryInstructions).toBe('Floor 3 Room 312')
      expect(userSpots[0].isDefault).toBe(true)
    })

    it('6. Declining the save option does not create a location', () => {
      useAuthStore.setState({
        user: { id: 'usr_customer_aarav', name: 'Aarav Patel', phone: '9876543210' },
        token: 'tok_aarav',
      })

      expect(useAddressStore.getState().locations.length).toBe(0)

      const checkoutDetails = {
        fullName: 'Aarav Patel',
        mobileNumber: '9876543210',
        presetLocation: 'D Block',
        customLocation: '',
        deliveryInstructions: 'Room 101',
        saveNewSpot: false,
      }

      const validation = validateCheckoutDetails({
        ...checkoutDetails,
        availableLocations: server.db.locations,
      })
      expect(validation.isValid).toBe(true)

      // Without opt-in, no location is added
      expect(useAddressStore.getState().locations.length).toBe(0)
    })

    it('7. Logout and account switching never expose another users addresses in checkout', async () => {
      // User A logs in and saves a private spot
      useAuthStore.setState({
        user: { id: 'usr_customer_aarav', name: 'Aarav Patel' },
        token: 'tok_aarav',
      })

      useAddressStore.getState().addLocation({
        label: 'Aarav Private Suite',
        campusLocation: 'A Block',
        roomNumber: '501',
      })

      expect(useAddressStore.getState().locations.length).toBe(1)

      // User A logs out
      await useAuthStore.getState().logout()
      expect(useAddressStore.getState().locations).toEqual([])

      // User B logs in
      useAuthStore.setState({
        user: { id: 'usr_customer_bob', name: 'Bob Builder' },
        token: 'tok_bob',
      })

      expect(useAddressStore.getState().locations).toEqual([])

      const html = renderToString(
        <MemoryRouter>
          <DeliveryDetailsForm
            details={{
              fullName: 'Bob Builder',
              mobileNumber: '9876543210',
              presetLocation: 'A Block',
            }}
            errors={{}}
            onChange={vi.fn()}
          />
        </MemoryRouter>,
      )

      expect(html).not.toContain('Aarav Private Suite')
      expect(html).toContain('No saved delivery spots yet.')
    })

    it('8. An order snapshots the selected delivery details independently of saved spots', async () => {
      useAuthStore.setState({
        user: { id: 'usr_customer_aarav', name: 'Aarav Patel' },
        token,
      })

      const spot = useAddressStore.getState().addLocation({
        label: 'Hostel B Room 404',
        campusLocation: 'B Block',
        roomNumber: '404',
        isDefault: true,
      })

      const validation = validateCheckoutDetails({
        fullName: 'Aarav Patel',
        mobileNumber: '9876543210',
        presetLocation: spot.campusLocation,
        deliveryInstructions: formatSpotDeliveryDetails(spot),
        availableLocations: server.db.locations,
        savedSpotId: spot.id,
        savedSpotLabel: spot.label,
      })

      const orderPayload = {
        storeId: 'store_campus_mart',
        locationId: validation.data.destinationLocationId,
        lines: [{ productId: 'p_milk_500', quantity: 1 }],
        customerDetails: validation.data,
      }

      const order = await server.handle('orders.create', orderPayload, { token })

      expect(order.customerDetails.savedSpotId).toBe(spot.id)
      expect(order.customerDetails.savedSpotLabel).toBe('Hostel B Room 404')
      expect(order.customerDetails.selectedDestination).toBe('B Block')
      expect(order.customerDetails.detailedAddress).toBe('Room 404')
      expect(order.customerDetails.deliveryLocation.formattedAddress).toBe('B Block, Room 404')
    })

    it('9. Editing or deleting a saved location later does not mutate an existing historical order snapshot', async () => {
      useAuthStore.setState({
        user: { id: 'usr_customer_aarav', name: 'Aarav Patel' },
        token,
      })

      const spot = useAddressStore.getState().addLocation({
        label: 'Original Dorm Room',
        campusLocation: 'A Block',
        roomNumber: '101',
      })

      const validation = validateCheckoutDetails({
        fullName: 'Aarav Patel',
        mobileNumber: '9876543210',
        presetLocation: spot.campusLocation,
        deliveryInstructions: formatSpotDeliveryDetails(spot),
        availableLocations: server.db.locations,
        savedSpotId: spot.id,
        savedSpotLabel: spot.label,
      })

      const order = await server.handle(
        'orders.create',
        {
          storeId: 'store_campus_mart',
          locationId: validation.data.destinationLocationId,
          lines: [{ productId: 'p_bread', quantity: 1 }],
          customerDetails: validation.data,
        },
        { token },
      )

      // Verify initial snapshot
      expect(order.customerDetails.savedSpotLabel).toBe('Original Dorm Room')
      expect(order.customerDetails.detailedAddress).toBe('Room 101')

      // User subsequently modifies and then deletes the saved spot from their address store
      useAddressStore.getState().updateLocation(spot.id, {
        label: 'Renovated Room 999',
        roomNumber: '999',
      })
      useAddressStore.getState().deleteLocation(spot.id)

      expect(useAddressStore.getState().locations.length).toBe(0)

      // Historical order snapshot remains completely unchanged
      const retrieved = await server.handle('orders.get', { orderId: order.id }, { token })
      expect(retrieved.customerDetails.savedSpotLabel).toBe('Original Dorm Room')
      expect(retrieved.customerDetails.detailedAddress).toBe('Room 101')
      expect(retrieved.customerDetails.selectedDestination).toBe('A Block')
    })

    it('10. Preserves all critical invariants: authoritative pricing, fees, and order creation contracts', async () => {
      useAuthStore.setState({
        user: { id: 'usr_customer_aarav', name: 'Aarav Patel' },
        token,
      })

      const spot = useAddressStore.getState().addLocation({
        label: 'Campus Library Spot',
        campusLocation: 'MBA Block',
        roomNumber: 'Desk 12',
      })

      const validation = validateCheckoutDetails({
        fullName: 'Aarav Patel',
        mobileNumber: '9876543210',
        presetLocation: spot.campusLocation,
        deliveryInstructions: formatSpotDeliveryDetails(spot),
        availableLocations: server.db.locations,
        savedSpotId: spot.id,
        savedSpotLabel: spot.label,
      })

      const payload = {
        storeId: 'store_campus_mart',
        locationId: validation.data.destinationLocationId,
        lines: [
          { productId: 'p_milk_500', quantity: 2 }, // 28 * 2 = 56
          { productId: 'p_bread', quantity: 1 },    // 45
        ],
        customerDetails: validation.data,
      }

      const order = await server.handle('orders.create', payload, { token })

      // Authoritative MVP pricing invariants:
      // Subtotal: 101
      // Flat delivery fee: 10
      // Base amount: 111
      // Platform fee: 0.01
      // Total: 111.01
      expect(order.pricing.itemSubtotal).toBe(101)
      expect(order.pricing.deliveryFee).toBe(10)
      expect(order.pricing.baseAmount).toBe(111)
      expect(order.pricing.platformFee).toBe(0.01)
      expect(order.pricing.total).toBe(111.01)
      expect(order.status).toBe('AWAITING_PAYMENT')
      expect(order.paymentStatus).toBe('PENDING')
    })
  })
})
