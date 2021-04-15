import { api } from './api'
import { Stock } from '../types'

export async function getStockByProductId(id: number) {
  return await api.get<Stock>(`/stock/${id}`)
}
