import { useQuery } from '@tanstack/react-query'
import { deliveryService } from '@/services/deliveryService'

/**
 * Server-authoritative delivery quote. The query key includes store + location,
 * so changing either automatically re-quotes before checkout can be confirmed.
 */
export function useDeliveryQuote({ storeId, locationId }) {
  return useQuery({
    queryKey: ['delivery-quote', storeId, locationId],
    queryFn: () => deliveryService.quote({ storeId, locationId }),
    enabled: Boolean(storeId && locationId),
    retry: (count, err) => err?.status >= 500 && count < 2, // don't retry business-rule rejections
    staleTime: 60_000,
  })
}
