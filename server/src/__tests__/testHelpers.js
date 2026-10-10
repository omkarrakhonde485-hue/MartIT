import { setSupabaseAdmin } from '../config/supabase.js'
import { ROLES } from '../utils/permissions.js'

/**
 * Creates an in-memory mock Supabase client for testing Express routes.
 */
export function createMockSupabaseClient({
  users = [],
  profiles = [],
  userRoles = [],
  stores = [],
  locations = [],
  categories = [],
  products = [],
  orders = [],
} = {}) {
  const state = {
    users: [...users],
    profiles: [...profiles],
    user_roles: [...(userRoles || [])],
    stores: [...stores],
    locations: [...locations],
    categories: [...categories],
    products: [...products],
    orders: [...orders],
  }

  const client = {
    auth: {
      async getUser(token) {
        if (!token || token === 'invalid-token') {
          return { data: { user: null }, error: { message: 'Invalid token' } }
        }
        const user = state.users.find((u) => u.token === token)
        if (!user) {
          return { data: { user: null }, error: { message: 'User not found for token' } }
        }
        return {
          data: {
            user: {
              id: user.id,
              email: user.email,
              user_metadata: { name: user.name },
            },
          },
          error: null,
        }
      },
    },

    from(table) {
      let currentTableData = state[table] || []
      let filters = []
      let selectedFields = null
      let isSingle = false
      let pendingUpdate = null
      let isDelete = false

      const query = {
        select(fields) {
          selectedFields = fields
          return query
        },
        eq(column, value) {
          filters.push({ column, value })
          return query
        },
        order() {
          return query
        },
        limit(n) {
          return query
        },
        async maybeSingle() {
          let results = currentTableData.filter((row) =>
            filters.every((f) => row[f.column] === f.value),
          )
          return { data: results[0] || null, error: null }
        },
        async single() {
          let results = currentTableData.filter((row) =>
            filters.every((f) => row[f.column] === f.value),
          )
          if (results.length === 0) {
            return { data: null, error: { message: 'No rows found', code: 'PGRST116' } }
          }
          return { data: results[0], error: null }
        },
        async upsert(values, options) {
          const arr = Array.isArray(values) ? values : [values]
          for (const item of arr) {
            const idx = currentTableData.findIndex((row) =>
              row.user_id === item.user_id && row.role === item.role,
            )
            if (idx >= 0) {
              currentTableData[idx] = { ...currentTableData[idx], ...item }
            } else {
              currentTableData.push({ ...item })
            }
          }
          return { data: values, error: null }
        },
        update(values) {
          pendingUpdate = values
          return query
        },
        delete() {
          isDelete = true
          return query
        },
        then(resolve, reject) {
          if (pendingUpdate) {
            for (let i = 0; i < currentTableData.length; i++) {
              if (filters.every((f) => currentTableData[i][f.column] === f.value)) {
                currentTableData[i] = { ...currentTableData[i], ...pendingUpdate }
              }
            }
            return resolve({ data: currentTableData, error: null })
          }

          if (isDelete) {
            state[table] = currentTableData.filter(
              (row) => !filters.every((f) => row[f.column] === f.value),
            )
            return resolve({ data: null, error: null })
          }

          let results = currentTableData.filter((row) =>
            filters.every((f) => row[f.column] === f.value),
          )
          // Handle relationships in mock if queried
          if (table === 'profiles') {
            results = results.map((p) => ({
              ...p,
              user_roles: state.user_roles.filter((r) => r.user_id === p.id),
            }))
          }
          resolve({ data: results, error: null })
        },
      }

      return query
    },
  }

  setSupabaseAdmin(client)
  return { client, state }
}
