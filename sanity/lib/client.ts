import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token: 'skwCgoxZFlLNZ4pJvHGxBL4HwxACC2BWjzLOdLShub9MUTiTjDJqf3MZVipfrn4bxvoG3v8kWSWponB4lrdSH08kYflsjXTAG3TI4aIGSxogwN5y3mcOojsD3LFZDf5CYEpYrrspXa3beHAiGY9obhivS48gAMi8w67AS7y6UoLzW0mEvPfp', // or leave blank for unauthenticated usage
  useCdn: true, 
  // Set to false if statically generating pages, using ISR or tag-based revalidation
})
