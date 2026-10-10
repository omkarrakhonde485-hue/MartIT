import { Router } from 'express'
import { getSupabaseAdmin } from '../config/supabase.js'
import { ApiError } from '../utils/errors.js'

export const storesRouter = Router()

async function handleStores(req, res, next) {
  try {
    const supabase = getSupabaseAdmin()
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, name, description, is_open, latitude, longitude')

    if (error) {
      throw ApiError.internal('Failed to load stores.')
    }

    const formatted = (stores || []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      isOpen: Boolean(s.is_open),
      coords: {
        lat: Number(s.latitude),
        lng: Number(s.longitude),
      },
    }))

    res.status(200).json(formatted)
  } catch (err) {
    next(err)
  }
}

async function handleLocations(req, res, next) {
  try {
    const supabase = getSupabaseAdmin()
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, group_name, latitude, longitude')
      .eq('is_active', true)

    if (error) {
      throw ApiError.internal('Failed to load campus locations.')
    }

    const formatted = (locations || []).map((l) => ({
      id: l.id,
      name: l.name,
      group: l.group_name,
      coords: {
        lat: Number(l.latitude),
        lng: Number(l.longitude),
      },
    }))

    res.status(200).json(formatted)
  } catch (err) {
    next(err)
  }
}

// Stores endpoints
storesRouter.get('/api/v1/stores', handleStores)
storesRouter.post('/stores/list', handleStores)

// Locations endpoints
storesRouter.get('/api/v1/locations', handleLocations)
storesRouter.post('/locations/list', handleLocations)
