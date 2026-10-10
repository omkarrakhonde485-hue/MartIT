import { Router } from 'express'
import { getSupabaseAdmin } from '../config/supabase.js'
import { ApiError } from '../utils/errors.js'

export const catalogueRouter = Router()

async function handleProducts(req, res, next) {
  try {
    const storeId = req.query.storeId || req.body?.storeId
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('products')
      .select('id, store_id, category_id, name, pack, price, mrp, stock, is_available, image_url')
      .eq('is_available', true)

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const { data: products, error } = await query

    if (error) {
      throw ApiError.internal('Failed to load catalogue products.')
    }

    // Map to camelCase compatible with frontend catalogue expectations
    const formatted = (products || []).map((p) => ({
      id: p.id,
      storeId: p.store_id,
      categoryId: p.category_id,
      name: p.name,
      pack: p.pack,
      price: Number(p.price),
      mrp: Number(p.mrp),
      stock: p.stock,
      isAvailable: p.is_available,
      imageUrl: p.image_url,
    }))

    res.status(200).json(formatted)
  } catch (err) {
    next(err)
  }
}

async function handleCategories(req, res, next) {
  try {
    const supabase = getSupabaseAdmin()
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, icon, sort_order')
      .order('sort_order', { ascending: true })

    if (error) {
      throw ApiError.internal('Failed to load catalogue categories.')
    }

    res.status(200).json(categories || [])
  } catch (err) {
    next(err)
  }
}

// Products endpoints
catalogueRouter.get('/api/v1/catalogue/products', handleProducts)
catalogueRouter.post('/catalogue/products', handleProducts)

// Categories endpoints
catalogueRouter.get('/api/v1/catalogue/categories', handleCategories)
catalogueRouter.post('/catalogue/categories', handleCategories)
