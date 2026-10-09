import { useQuery } from '@tanstack/react-query'
import { catalogueService } from '@/services/catalogueService'

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: catalogueService.listStores,
    staleTime: 5 * 60_000,
  })
}

export function useProducts(storeId) {
  return useQuery({
    queryKey: ['products', storeId ?? 'all'],
    queryFn: () => catalogueService.listProducts(storeId),
    staleTime: 60_000,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: catalogueService.listCategories,
    staleTime: 10 * 60_000,
  })
}
