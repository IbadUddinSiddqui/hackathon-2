
import { createClient } from '@sanity/client';

export const sanityclient = createClient({
  projectId: 'xphvex0e', // Replace with your Sanity project ID
  dataset: 'production', // Replace with your dataset name
  apiVersion: '2023-05-03', // Use the current date in YYYY-MM-DD format
  useCdn: true, // Enable CDN for faster responses
});