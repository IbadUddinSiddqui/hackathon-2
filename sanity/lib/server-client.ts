import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

// Server-only Sanity client used for WRITES (user registration, promotion,
// avatar uploads). NEVER import this file from a client component — the token
// must not reach the browser bundle.
export const serverClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_TOKEN || process.env.NEXT_PUBLIC_SANITY_TOKEN,
  useCdn: false, // Writes always go to the API directly
})
