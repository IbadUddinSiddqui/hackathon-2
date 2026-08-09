import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

// Public Sanity client for reads (products, users on login, etc.).
// No token is needed for public reads and this keeps credentials out of the
// browser bundle. Use `serverClient` (sanity/lib/server-client.ts) for writes.
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  // Set to false if statically generating pages, using ISR or tag-based revalidation
})
