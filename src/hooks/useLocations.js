import { useQuery } from '@tanstack/react-query'
import { locationService } from '@/services/locationService'

export const useLocations = () =>
  useQuery({ queryKey: ['locations'], queryFn: locationService.list, staleTime: 10 * 60_000 })

export function useLocationName(id) {
  const { data } = useLocations()
  return data?.find((l) => l.id === id)?.name ?? null
}
