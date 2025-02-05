import { type SchemaTypeDefinition } from 'sanity'
import { product } from './product'
import user from './user'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product,user],
}
