import { type SchemaTypeDefinition } from 'sanity'
import { product } from './product'
import user from './user'
import order from './order'
import discountCode from './discountCode'
import customer from './customer'
import auditLog from './auditLog'
import abandonedCart from './abandonedCart'
import giftCard from './giftCard'
import bundle from './bundle'
import flashSale from './flashSale'
import review from './review'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product, user, order, discountCode, customer, auditLog, abandonedCart, giftCard, bundle, flashSale, review],
}
