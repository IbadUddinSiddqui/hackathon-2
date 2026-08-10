import React from 'react'
import type { Metadata } from 'next'
import ProductSearch from '../components/ProductSearch/ProductSearch'

export const metadata: Metadata = {
  title: 'Search Products',
  description: 'Search the AnK\'s catalog by name, brand or tag.',
}

function page() {
  return (
    <div><ProductSearch/></div>
  )
}

export default page