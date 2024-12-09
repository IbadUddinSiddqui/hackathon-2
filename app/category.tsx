

interface Product {
    id: number;
    name: string;
    rating: string;
    price: string;
  }
  interface Categories {
    [key: string]: {
      name: string;
      image: string;
    };
  }
  
  interface Products {
    [key: string]: Product[];
  }
  
export  const categories: Categories = {
    casual: { name: 'Casual', image: '/image-11.svg' },
    formal: { name: 'Formal', image: '/image-13.svg' },
    party: { name: 'Party', image: '/image-12.svg' },
    gym: { name: 'Gym', image: '/image-14.svg' },
  };
  
  export const products: Products = {
    casual: [
      { id: 1, name: 'Tshirt', rating: '4.5/5', price: '120$' },
      { id: 2, name: 'Skinny Fit Jeans', rating: '3.5/5', price: '240$' },
      { id: 3, name: 'Checkered Shirt', rating: '4.6/5', price: '120$' },
      { id: 4, name: 'Sleeve Stripped T-shirt', rating: '4.5/5', price: '120$' },
      { id: 5, name: 'Tshirt', rating: '4.5/5', price: '120$' },
      { id: 6, name: 'Skinny Fit Jeans', rating: '3.5/5', price: '240$' },
      { id: 7, name: 'Checkered Shirt', rating: '4.6/5', price: '120$' },
      { id: 8, name: 'Sleeve Stripped T-shirt', rating: '4.5/5', price: '120$' },
      { id: 9, name: 'Tshirt', rating: '4.5/5', price: '120$' },
      { id: 10, name: 'Skinny Fit Jeans', rating: '3.5/5', price: '240$' },
      { id: 11, name: 'Checkered Shirt', rating: '4.6/5', price: '120$' },
      { id: 12, name: 'Sleeve Stripped T-shirt', rating: '4.5/5', price: '120$' },
      { id: 13, name: 'Tshirt', rating: '4.5/5', price: '120$' },
      { id: 14, name: 'Skinny Fit Jeans', rating: '3.5/5', price: '240$' },
      { id: 15, name: 'Checkered Shirt', rating: '4.6/5', price: '120$' },
      { id: 16, name: 'Sleeve Stripped T-shirt', rating: '4.5/5', price: '120$' },
    ],
    formal: [
      { id: 1, name: 'Formal Suit', rating: '4/5', price: '500$' },
      { id: 2, name: 'Formal Shirt', rating: '4.2/5', price: '80$' },
      { id: 3, name: 'Blazer', rating: '4.5/5', price: '300$' },
      { id: 4, name: 'Slim Fit Trousers', rating: '4.6/5', price: '120$' },
      { id: 5, name: 'Oxford Shoes', rating: '4.7/5', price: '200$' },
      { id: 6, name: 'Formal Vest', rating: '4.3/5', price: '150$' },
      { id: 7, name: 'Tie and Pocket Square Set', rating: '4.8/5', price: '50$' },
      { id: 8, name: 'Classic White Shirt', rating: '4.4/5', price: '70$' },
      { id: 9, name: 'Cufflinks', rating: '4.1/5', price: '30$' },
      { id: 10, name: 'Formal Belt', rating: '4.2/5', price: '40$' },
      { id: 11, name: 'Black Suit', rating: '4.9/5', price: '600$' },
      { id: 12, name: 'Leather Briefcase', rating: '4.3/5', price: '250$' },
      { id: 13, name: 'Formal Socks', rating: '4.0/5', price: '25$' },
      { id: 14, name: 'Formal Coat', rating: '4.6/5', price: '400$' },
      { id: 15, name: 'Button-Up Dress Shirt', rating: '4.4/5', price: '90$' },
      { id: 16, name: 'Polished Leather Shoes', rating: '4.8/5', price: '220$' },
    ],
    party: [
      { id: 1, name: 'Sequined Dress', rating: '4.8/5', price: '250$' },
    { id: 2, name: 'Party Blazer', rating: '4.7/5', price: '320$' },
    { id: 3, name: 'Cocktail Dress', rating: '4.9/5', price: '300$' },
    { id: 4, name: 'Party Tuxedo', rating: '4.5/5', price: '500$' },
    { id: 5, name: 'Shimmer Top', rating: '4.4/5', price: '120$' },
    { id: 6, name: 'Velvet Suit', rating: '4.6/5', price: '450$' },
    { id: 7, name: 'Party Skirt', rating: '4.3/5', price: '180$' },
    { id: 8, name: 'Beaded Gown', rating: '4.7/5', price: '550$' },
    { id: 9, name: 'Embroidered Saree', rating: '4.9/5', price: '400$' },
    { id: 10, name: 'Glitter Shoes', rating: '4.6/5', price: '150$' },
    { id: 11, name: 'Bow Tie Tuxedo', rating: '4.8/5', price: '520$' },
    { id: 12, name: 'Lace Dress', rating: '4.5/5', price: '270$' },
    { id: 13, name: 'Ruffle Top', rating: '4.3/5', price: '90$' },
    { id: 14, name: 'Statement Earrings', rating: '4.7/5', price: '50$' },
    { id: 15, name: 'Sequin Mini Skirt', rating: '4.2/5', price: '110$' },
    { id: 16, name: 'Metallic Blouse', rating: '4.4/5', price: '100$' },
    ],
    gym: [
      { id: 1, name: 'Gym T-Shirt', rating: '4.6/5', price: '25$' },
      { id: 2, name: 'Workout Shorts', rating: '4.7/5', price: '30$' },
      { id: 3, name: 'Compression Pants', rating: '4.8/5', price: '40$' },
      { id: 4, name: 'Training Hoodie', rating: '4.5/5', price: '60$' },
      { id: 5, name: 'Athletic Tank Top', rating: '4.4/5', price: '20$' },
      { id: 6, name: 'Sweatpants', rating: '4.6/5', price: '35$' },
      { id: 7, name: 'Sports Bra', rating: '4.7/5', price: '25$' },
      { id: 8, name: 'Performance Leggings', rating: '4.9/5', price: '45$' },
      { id: 9, name: 'Gym Gloves', rating: '4.5/5', price: '15$' },
      { id: 10, name: 'Headband', rating: '4.3/5', price: '10$' },
      { id: 11, name: 'Training Sneakers', rating: '4.8/5', price: '80$' },
      { id: 12, name: 'Fitness Tracker', rating: '4.9/5', price: '100$' },
      { id: 13, name: 'Weightlifting Belt', rating: '4.7/5', price: '50$' },
      { id: 14, name: 'Resistance Bands', rating: '4.4/5', price: '15$' },
      { id: 15, name: 'Water Bottle', rating: '4.6/5', price: '12$' },
      { id: 16, name: 'Gym Bag', rating: '4.8/5', price: '40$' },
    ],
  };
  
 export const productImages = [
    '/arrival.svg',
    '/arrival1.svg',
    '/arrival2.svg',
    '/arrival3.svg',
    '/arrival4.svg',
    '/arrival5.svg',
    '/arrival6.svg',
    '/arrival7.svg',
  ];
  