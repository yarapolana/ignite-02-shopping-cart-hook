import { api } from './api'
import { Product } from '../types'

export async function getProductById(id: number) {
  return await api.get<Product>(`/products/${id}`)
}
