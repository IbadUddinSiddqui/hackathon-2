import React from 'react'
import ProductsGrid from '../ProductsGrid/ProductsGrid'

const NewArrivals = () => {
  return (
    <>
    <div className="text-center mb-10">
        <h2 className="text-5xl font-extrabold mb-4">Accessories Section</h2>
      </div>
    <div><ProductsGrid category='accessories'>
     
      
      </ProductsGrid> </div>
    </>)
}

export default NewArrivals