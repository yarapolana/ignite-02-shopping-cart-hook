import { createContext, ReactNode, useContext, useState } from 'react'
import { toast } from 'react-toastify'
import { SHOES_STORAGE } from '../constants/storage'
import { getProductById } from '../services/products'
import { getStockByProductId } from '../services/stock'
import { Product } from '../types'

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storedCart = localStorage.getItem(SHOES_STORAGE)

    if (storedCart) {
      return JSON.parse(storedCart)
    }

    return []
  })

  const addProduct = async (productId: number) => {
    try {
      const { data: { amount: currentStock } } = await getStockByProductId(productId)

      const product = cart.find(cartProduct => cartProduct.id === productId)

      if (product && product.amount <= currentStock) {
        updateProductAmount({productId, amount: product.amount + 1})
      } else if (!product && currentStock > 0) {
        const { data: productData } = await getProductById(productId)

        if (!productData) throw Error('Product does not exist')

        const newProduct = {
          ...productData,
          amount: 1,
        }

        const updatedCart = [...cart, newProduct]

        localStorage.setItem(SHOES_STORAGE, JSON.stringify(updatedCart))

        setCart(updatedCart)
      } else {
        throw new Error('Quantidade solicitada fora de estoque')
      }
    } catch(err) {
      toast.error(err.message.includes('estoque') ? err.message : 'Erro na adição do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(product => product.id === productId)

      if(!product) throw new Error('Product no longer exist')

      const updatedCart = cart.filter(c => c.id !== productId)

      localStorage.setItem(SHOES_STORAGE, JSON.stringify(updatedCart))

      setCart(updatedCart)
    } catch {
      toast.error('Erro na remoção do produto')
    }
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) throw new Error('Invalid quantity amount') // message is omited

      const product = cart.find(product => product.id === productId)

      if (!product) throw new Error('Product no longer exist')

      const {data: { amount: currentStock }} = await getStockByProductId(productId)

      if (amount > currentStock) {
        throw new Error('Quantidade solicitada fora de estoque')
      }

      const updatedCart = cart.map(cartProduct => cartProduct.id === productId ? {
        ...cartProduct,
        amount,
      } : cartProduct)

      localStorage.setItem(SHOES_STORAGE, JSON.stringify(updatedCart))

      setCart(updatedCart)
    } catch(err) {
      toast.error(err.message.includes('estoque') ? err.message : 'Erro na alteração de quantidade do produto')
    }
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}
