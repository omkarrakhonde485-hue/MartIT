import { Router } from 'express'
import { z } from 'zod'
import { getSupabaseAdmin } from '../config/supabase.js'
import { ApiError } from '../utils/errors.js'

export const deliveryRouter = Router()

const PRICING_VERSION = '2026-10-09.1'

const quoteSchema = z.object({
  storeId: z.string().min(1, 'Store ID is required'),
  locationId: z.string().min(1, 'Delivery location is required'),
})

// Haversine straight-line distance in km
function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function calculateTierDeliveryFee(km) {
  if (km <= 0) return { ok: false, reason: 'INVALID_DISTANCE' }
  // Boundary absorbed by 1 µm float tolerance
  const eps = 1e-9
  if (km <= 0.5 + eps) {
    return { ok: true, fee: 10, label: 'Short campus delivery' }
  }
  if (km <= 1.0 + eps) {
    return { ok: true, fee: 15, label: 'Nearby hostel or campus location' }
  }
  if (km <= 2.0 + eps) {
    return { ok: true, fee: 20, label: 'Longer delivery' }
  }
  if (km <= 5.0 + eps) {
    const startedKm = Math.ceil(km - 2.0 - eps)
    const fee = 20 + 5 * startedKm
    return { ok: true, fee, label: 'Extended delivery' }
  }
  return { ok: false, reason: 'MAX_DISTANCE_EXCEEDED' }
}

async function handleQuote(req, res, next) {
  try {
    const { storeId, locationId } = quoteSchema.parse(req.body)
    const supabase = getSupabaseAdmin()

    // Query store
    const { data: store, error: storeErr } = await supabase
      .from('stores')
      .select('id, name, is_open, latitude, longitude')
      .eq('id', storeId)
      .maybeSingle()

    if (storeErr || !store) {
      throw ApiError.notFound('That store is not available.', 'STORE_NOT_FOUND')
    }

    if (!store.is_open) {
      throw ApiError.conflict('This store is closed right now.', 'STORE_CLOSED')
    }

    // Query delivery location
    const { data: location, error: locErr } = await supabase
      .from('locations')
      .select('id, name, latitude, longitude, is_active')
      .eq('id', locationId)
      .maybeSingle()

    if (locErr || !location || !location.is_active) {
      throw ApiError.notFound('Choose a valid delivery spot first.', 'LOCATION_NOT_FOUND')
    }

    const distanceKm = calculateHaversineKm(
      Number(store.latitude),
      Number(store.longitude),
      Number(location.latitude),
      Number(location.longitude),
    )

    const feeResult = calculateTierDeliveryFee(distanceKm)
    if (!feeResult.ok) {
      throw ApiError.unprocessable(
        'Delivery location is outside our 5 km service radius.',
        'MAX_DISTANCE_EXCEEDED',
        { distanceKm, maxKm: 5 },
      )
    }

    res.status(200).json({
      storeId,
      locationId,
      distanceKm,
      distanceMethod: 'straight_line',
      deliveryFee: feeResult.fee,
      feeLabel: feeResult.label,
      pricingVersion: PRICING_VERSION,
    })
  } catch (err) {
    next(err)
  }
}

deliveryRouter.post('/api/v1/delivery/quote', handleQuote)
deliveryRouter.post('/delivery/quote', handleQuote)
