interface Product {
    id: number;
    name: string;
    description: string;
    price : string
    rating : string
    images : [string,string,string]
  }
 export const products: { [key: string]: Product[] } = {
    casual: [
        {
      id: 1,
      name: 'Tshirt',
      description: 'A comfortable and stylish t-shirt made from breathable fabric, perfect for casual outings.',
      price: '$120',
      rating: '4.5/5',
      images: [
        'https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg', // T-shirt front view
        'https://images.pexels.com/photos/4085073/pexels-photo-4085073.jpeg', // T-shirt detail view
        'https://images.pexels.com/photos/3671825/pexels-photo-3671825.jpeg', // T-shirt folded
      ],
    },
    {
      id: 2,
      name: 'Skinny Fit Jeans',
      description: 'Trendy skinny fit jeans with superior stretch and comfort for everyday wear.',
      price: '$240',
      rating: '3.5/5',
      images: [
        'https://images.pexels.com/photos/1133000/pexels-photo-1133000.jpeg', // Skinny jeans full view
        'https://images.pexels.com/photos/3662532/pexels-photo-3662532.jpeg', // Skinny jeans close-up
        'https://images.pexels.com/photos/3171744/pexels-photo-3171744.jpeg', // Jeans on body
      ],
    },
    {
      id: 3,
      name: 'Checkered Shirt',
      description: 'A classic checkered shirt that blends style and sophistication for casual occasions.',
      price: '$120',
      rating: '4.6/5',
      images: [
        'https://images.pexels.com/photos/3708905/pexels-photo-3708905.jpeg', // Checkered shirt front
        'https://images.pexels.com/photos/3671173/pexels-photo-3671173.jpeg', // Checkered shirt sleeve detail
        'https://images.pexels.com/photos/3171740/pexels-photo-3171740.jpeg', // Checkered shirt on body
      ],
    },
    {
      id: 4,
      name: 'Sleeve Stripped T-shirt',
      description: 'Stylish stripped t-shirt with premium fabric for a sleek and modern look.',
      price: '$120',
      rating: '4.5/5',
      images: [
        'https://images.pexels.com/photos/4552959/pexels-photo-4552959.jpeg', // Striped t-shirt
        'https://images.pexels.com/photos/4498359/pexels-photo-4498359.jpeg', // Closeup striped t-shirt
        'https://images.pexels.com/photos/4587451/pexels-photo-4587451.jpeg', // Model with striped t-shirt
      ],
    },
    {
      id: 5,
      name: 'Tshirt',
      description: 'A simple yet stylish t-shirt that goes with everything.',
      price: '$120',
      rating: '4.5/5',
      images: [
        'https://images.pexels.com/photos/1624611/pexels-photo-1624611.jpeg', // Casual t-shirt
        'https://images.pexels.com/photos/3972848/pexels-photo-3972848.jpeg', // T-shirt with jeans
        'https://images.pexels.com/photos/1586950/pexels-photo-1586950.jpeg', // T-shirt with a person
      ],
    },
    {
      id: 6,
      name: 'Skinny Fit Jeans',
      description: 'Skinny fit jeans that stretch and move with you for ultimate comfort.',
      price: '$240',
      rating: '3.5/5',
      images: [
        'https://images.pexels.com/photos/3825939/pexels-photo-3825939.jpeg', // Skinny jeans on body
        'https://images.pexels.com/photos/4234673/pexels-photo-4234673.jpeg', // Skinny jeans detail
        'https://images.pexels.com/photos/3725511/pexels-photo-3725511.jpeg', // Jeans with shoes
      ],
    },
    {
      id: 7,
      name: 'Checkered Shirt',
      description: 'Perfect for a laid-back look or semi-formal occasions, this checkered shirt stands out.',
      price: '$120',
      rating: '4.6/5',
      images: [
        'https://images.pexels.com/photos/4384239/pexels-photo-4384239.jpeg', // Checkered shirt front view
        'https://images.pexels.com/photos/4384236/pexels-photo-4384236.jpeg', // Close-up of checkered shirt
        'https://images.pexels.com/photos/3736081/pexels-photo-3736081.jpeg', // Model with checkered shirt
      ],
    },
    {
      id: 8,
      name: 'Sleeve Stripped T-shirt',
      description: 'A modern twist on the classic striped t-shirt with sleeve details.',
      price: '$120',
      rating: '4.5/5',
      images: [
        'https://images.pexels.com/photos/4482903/pexels-photo-4482903.jpeg', // Striped t-shirt on person
        'https://images.pexels.com/photos/4008379/pexels-photo-4008379.jpeg', // Striped t-shirt model
        'https://images.pexels.com/photos/1181350/pexels-photo-1181350.jpeg', // Close-up striped t-shirt
      ],
    },
    {
      id: 9,
      name: 'Tshirt',
      description: 'A casual and comfortable t-shirt that can be dressed up or down.',
      price: '$120',
      rating: '4.5/5',
      images: [
        'https://images.pexels.com/photos/1665744/pexels-photo-1665744.jpeg', // Casual t-shirt
        'https://images.pexels.com/photos/3573380/pexels-photo-3573380.jpeg', // T-shirt flat lay
        'https://images.pexels.com/photos/1570354/pexels-photo-1570354.jpeg', // T-shirt detail
      ],
    },
    {
      id: 10,
      name: 'Skinny Fit Jeans',
      description: 'Super-slim jeans that are a staple for any casual wardrobe.',
      price: '$240',
      rating: '3.5/5',
      images: [
        'https://images.pexels.com/photos/3807413/pexels-photo-3807413.jpeg', // Skinny jeans view
        'https://images.pexels.com/photos/3662167/pexels-photo-3662167.jpeg', // Skinny jeans worn
        'https://images.pexels.com/photos/3255575/pexels-photo-3255575.jpeg', // Jeans with shoes
      ],
    },
    {
      id: 11,
      name: 'Checkered Shirt',
      description: 'The checkered shirt that’s perfect for a casual day out or semi-formal event.',
      price: '$120',
      rating: '4.6/5',
      images: [
        'https://images.pexels.com/photos/4646716/pexels-photo-4646716.jpeg', // Checkered shirt with model
        'https://images.pexels.com/photos/3648295/pexels-photo-3648295.jpeg', // Checkered shirt closeup
        'https://images.pexels.com/photos/3909419/pexels-photo-3909419.jpeg', // Checkered shirt folded
      ],
    },
    {
      id: 12,
      name: 'Sleeve Stripped T-shirt',
      description: 'A stylish sleeve stripped t-shirt for a trendy, modern look.',
      price: '$120',
      rating: '4.5/5',
      images: [
        'https://images.pexels.com/photos/4552959/pexels-photo-4552959.jpeg', // Striped t-shirt
        'https://images.pexels.com/photos/4587451/pexels-photo-4587451.jpeg', // Striped t-shirt on model
        'https://images.pexels.com/photos/4498359/pexels-photo-4498359.jpeg', // Striped t-shirt
      ],
    },
    {
      id: 13,
      name: 'Tshirt',
      description: 'A comfortable and casual t-shirt to wear all year round.',
      price: '$120',
      rating: '4.5/5',
      images: [
        'https://images.pexels.com/photos/3527442/pexels-photo-3527442.jpeg', // Casual t-shirt
        'https://images.pexels.com/photos/1649955/pexels-photo-1649955.jpeg', // T-shirt on body
        'https://images.pexels.com/photos/1654381/pexels-photo-1654381.jpeg', // T-shirt design
      ],
    },
    {
      id: 14,
      name: 'Skinny Fit Jeans',
      description: 'Modern skinny fit jeans that give you a sleek and trendy look.',
      price: '$240',
      rating: '3.5/5',
      images: [
        'https://images.pexels.com/photos/414779/pexels-photo-414779.jpeg', // Skinny jeans full length
        'https://images.pexels.com/photos/3471412/pexels-photo-3471412.jpeg', // Skinny jeans detail
        'https://images.pexels.com/photos/3072481/pexels-photo-3072481.jpeg', // Skinny jeans with shoes
      ],
    },
    {
      id: 15,
      name: 'Checkered Shirt',
      description: 'A versatile checkered shirt that pairs with jeans or chinos.',
      price: '$120',
      rating: '4.6/5',
      images: [
        'https://images.pexels.com/photos/3708905/pexels-photo-3708905.jpeg', // Checkered shirt front view
        'https://images.pexels.com/photos/3671173/pexels-photo-3671173.jpeg', // Checkered shirt sleeve detail
        'https://images.pexels.com/photos/3171740/pexels-photo-3171740.jpeg', // Checkered shirt on body
      ],
    },
    {
      id: 16,
      name: 'Sleeve Stripped T-shirt',
      description: 'A trendy striped t-shirt with sleeve details for a modern look.',
      price: '$120',
      rating: '4.5/5',
      images: [
        'https://images.pexels.com/photos/4587451/pexels-photo-4587451.jpeg', // Striped t-shirt
        'https://images.pexels.com/photos/4181511/pexels-photo-4181511.jpeg', // Striped t-shirt worn by person
        'https://images.pexels.com/photos/4295314/pexels-photo-4295314.jpeg', // T-shirt worn by person
      ],
    },
    ],
    formal: [
      { 
        id: 1,
        name: 'Formal Suit',
        description: 'A sophisticated formal suit.',
        price: '$500',
        rating: '4/5',
        images: [
          'https://images.unsplash.com/photo-1519041105721-f68f59b9c2cc',
          'https://images.unsplash.com/photo-1581497411570-6fc52a813a6b',
          'https://images.unsplash.com/photo-1565658679-fb9a400b84b2'
        ]
      },
      { 
        id: 2,
        name: 'Formal Shirt',
        description: 'A classic formal shirt for any occasion.',
        price: '$80',
        rating: '4.2/5',
        images: [
          'https://images.unsplash.com/photo-1615367358380-82a70c8a3d01',
          'https://images.unsplash.com/photo-1587747064462-c274e710a44b',
          'https://images.unsplash.com/photo-1516420351949-c6bdb4f1ad9f'
        ]
      },
      { 
        id: 3,
        name: 'Blazer',
        description: 'A stylish blazer for the modern man.',
        price: '$300',
        rating: '4.5/5',
        images: [
          'https://images.unsplash.com/photo-1569197004-3c2e156d4425',
          'https://images.unsplash.com/photo-1617020497446-c8de142e8ac4',
          'https://images.unsplash.com/photo-1588702546699-c8791f7d35e0'
        ]
      },
      { 
        id: 4,
        name: 'Slim Fit Trousers',
        description: 'Modern slim-fit trousers for a sleek look.',
        price: '$120',
        rating: '4.6/5',
        images: [
          'https://images.unsplash.com/photo-1543487601-e56f143032a9',
          'https://images.unsplash.com/photo-1579033419389-b589c2e7a019',
          'https://images.unsplash.com/photo-1602191097026-800f16e89c5e'
        ]
      },
      { 
        id: 5,
        name: 'Oxford Shoes',
        description: 'Classic oxford shoes for formal wear.',
        price: '$200',
        rating: '4.7/5',
        images: [
          'https://images.unsplash.com/photo-1532635039-d810f8796238',
          'https://images.unsplash.com/photo-1586325181679-4b1ec85c5e0a',
          'https://images.unsplash.com/photo-1575178502494-e9d848b280ad'
        ]
      },
      { 
        id: 6,
        name: 'Formal Vest',
        description: 'A sleek formal vest for special occasions.',
        price: '$150',
        rating: '4.3/5',
        images: [
          'https://images.unsplash.com/photo-1603409682216-e2e44e8fda68',
          'https://images.unsplash.com/photo-1572576620197-80e2f9a23a98',
          'https://images.unsplash.com/photo-1603121396348-3421f8bc4a45'
        ]
      },
      { 
        id: 7,
        name: 'Tie and Pocket Square Set',
        description: 'Elegant tie and pocket square set.',
        price: '$50',
        rating: '4.8/5',
        images: [
          'https://images.unsplash.com/photo-1557504348-24c855a00fe2',
          'https://images.unsplash.com/photo-1512556958227-c795dc88a70d',
          'https://images.unsplash.com/photo-1554151229-b5371da8d0c4'
        ]
      },
      { 
        id: 8,
        name: 'Classic White Shirt',
        description: 'A timeless white shirt for any formal setting.',
        price: '$70',
        rating: '4.4/5',
        images: [
          'https://images.unsplash.com/photo-1587566027669-017748f76f4d',
          'https://images.unsplash.com/photo-1586265969045-e6dbfef04a58',
          'https://images.unsplash.com/photo-1532757139-2c9ca2466db7'
        ]
      },
      { 
        id: 9,
        name: 'Cufflinks',
        description: 'A stylish pair of cufflinks to complete your look.',
        price: '$30',
        rating: '4.1/5',
        images: [
          'https://images.unsplash.com/photo-1576051213034-df4e0d570a3b',
          'https://images.unsplash.com/photo-1562957875-66d68b7999a7',
          'https://images.unsplash.com/photo-1596014120264-8b631c8c71c3'
        ]
      },
      { 
        id: 10,
        name: 'Formal Belt',
        description: 'A formal leather belt to complete your attire.',
        price: '$40',
        rating: '4.2/5',
        images: [
          'https://images.unsplash.com/photo-1605550153147-7a1745f47e7f',
          'https://images.unsplash.com/photo-1552972383-57da39e053ef',
          'https://images.unsplash.com/photo-1597229747261-5bc0e8c8a6a9'
        ]
      },
      { 
        id: 11,
        name: 'Black Suit',
        description: 'A premium black suit for formal events.',
        price: '$600',
        rating: '4.9/5',
        images: [
          'https://images.unsplash.com/photo-1521747116042-ea44a1e3a0f8',
          'https://images.unsplash.com/photo-1586209890652-379c387bc62d',
          'https://images.unsplash.com/photo-1594924444303-2e6e2c4907da'
        ]
      },
      { 
        id: 12,
        name: 'Leather Briefcase',
        description: 'A stylish leather briefcase for professionals.',
        price: '$250',
        rating: '4.3/5',
        images: [
          'https://images.unsplash.com/photo-1599382576224-6ad60f0c84ff',
          'https://images.unsplash.com/photo-1606352718761-0c6ab1a21e62',
          'https://images.unsplash.com/photo-1580484009791-928fa7b022b4'
        ]
      },
      { 
        id: 13,
        name: 'Formal Socks',
        description: 'High-quality formal socks for added comfort.',
        price: '$25',
        rating: '4.0/5',
        images: [
          'https://images.unsplash.com/photo-1575372542205-c3e67e242d62',
          'https://images.unsplash.com/photo-1563463587-27b212ff77d5',
          'https://images.unsplash.com/photo-1558492356-92ab5f014b73'
        ]
      },
      { 
        id: 14,
        name: 'Formal Coat',
        description: 'A classic formal coat for cold weather.',
        price: '$400',
        rating: '4.6/5',
        images: [
          'https://images.unsplash.com/photo-1572235661105-e3b80ffb2768',
          'https://images.unsplash.com/photo-1585836127367-80feae81efcf',
          'https://images.unsplash.com/photo-1556483587-0e776a627c35'
        ]
      },
      { 
        id: 15,
        name: 'Button-Up Dress Shirt',
        description: 'A sleek button-up dress shirt.',
        price: '$90',
        rating: '4.4/5',
        images: [
          'https://images.unsplash.com/photo-1612285687557-7a85e306de24',
          'https://images.unsplash.com/photo-1564024553-44d10c431fd7',
          'https://images.unsplash.com/photo-1576010734509-1fdd467537c6'
        ]
      },
      { 
        id: 16,
        name: 'Polished Leather Shoes',
        description: 'A premium pair of polished leather shoes.',
        price: '$220',
        rating: '4.8/5',
        images: [
          'https://images.unsplash.com/photo-1590763552131-73a4d441d74f',
          'https://images.unsplash.com/photo-1582584055789-953b9b9d0e8a',
          'https://images.unsplash.com/photo-1577882253899-49849c8c5978'
        ]
      }
    ],
    party :[
      {
        id: 1,
        name: 'Sequined Dress',
        rating: '4.8/5',
        price: '250$',
        description: 'A dazzling sequined dress perfect for any glamorous occasion.',
        images: [
          'https://cdn.pixabay.com/photo/2017/11/29/06/56/party-dress-2999634_960_720.jpg',
          'https://cdn.pixabay.com/photo/2018/07/07/18/43/dress-3527541_960_720.jpg',
          'https://cdn.pixabay.com/photo/2016/02/15/17/52/dress-1208263_960_720.jpg',
        ]
      },
      {
        id: 2,
        name: 'Party Blazer',
        rating: '4.7/5',
        price: '320$',
        description: 'A sleek and stylish blazer for party nights.',
        images: [
          'https://cdn.pixabay.com/photo/2016/11/29/05/20/suit-1869830_960_720.jpg',
          'https://cdn.pixabay.com/photo/2016/11/29/05/18/people-1869829_960_720.jpg',
          'https://cdn.pixabay.com/photo/2015/02/09/13/13/blur-631937_960_720.jpg',
        ]
      },
      {
        id: 3,
        name: 'Cocktail Dress',
        rating: '4.9/5',
        price: '300$',
        description: 'A classy cocktail dress to stand out at any event.',
        images: [
          'https://cdn.pixabay.com/photo/2016/11/21/15/53/women-1846431_960_720.jpg',
          'https://cdn.pixabay.com/photo/2015/09/02/12/17/cocktail-918601_960_720.jpg',
          'https://cdn.pixabay.com/photo/2016/10/01/10/33/fashion-1704779_960_720.jpg',
        ]
      },
      {
        id: 4,
        name: 'Party Tuxedo',
        rating: '4.5/5',
        price: '500$',
        description: 'A sharp tuxedo perfect for a formal party.',
        images: [
          'https://cdn.pixabay.com/photo/2016/10/22/17/39/suit-1763705_960_720.jpg',
          'https://cdn.pixabay.com/photo/2017/05/08/22/00/suit-2292905_960_720.jpg',
          'https://cdn.pixabay.com/photo/2016/11/14/02/21/suit-1823285_960_720.jpg',
        ]
      },
      {
        id: 5,
        name: 'Shimmer Top',
        rating: '4.4/5',
        price: '120$',
        description: 'A shimmering top to shine at any party.',
        images: [
          'https://cdn.pixabay.com/photo/2017/11/29/07/19/fashion-2999636_960_720.jpg',
          'https://cdn.pixabay.com/photo/2017/11/21/10/52/fashion-2968692_960_720.jpg',
          'https://cdn.pixabay.com/photo/2016/05/05/23/14/evening-dress-1376702_960_720.jpg',
        ]
      },
      {
        id: 6,
        name: 'Velvet Suit',
        rating: '4.6/5',
        price: '450$',
        description: 'Luxurious velvet suit for a refined look.',
        images: [
          'https://cdn.pixabay.com/photo/2016/11/19/12/37/suit-1838971_960_720.jpg',
          'https://cdn.pixabay.com/photo/2017/07/04/10/35/suit-2460365_960_720.jpg',
          'https://cdn.pixabay.com/photo/2017/11/21/16/02/dress-2992065_960_720.jpg',
        ]
      },
      {
        id: 7,
        name: 'Party Skirt',
        rating: '4.3/5',
        price: '180$',
        description: 'A stylish skirt that is perfect for any party.',
        images: [
          'https://cdn.pixabay.com/photo/2017/11/28/11/52/fashion-2997029_960_720.jpg',
          'https://cdn.pixabay.com/photo/2018/06/26/14/00/fashion-3517084_960_720.jpg',
          'https://cdn.pixabay.com/photo/2017/11/28/11/47/fashion-2997023_960_720.jpg',
        ]
      },
      {
        id: 8,
        name: 'Beaded Gown',
        rating: '4.7/5',
        price: '550$',
        description: 'A gorgeous beaded gown that will make you the center of attention.',
        images: [
          'https://cdn.pixabay.com/photo/2018/06/17/19/17/fashion-3488363_960_720.jpg',
          'https://cdn.pixabay.com/photo/2015/11/21/13/25/dress-1051560_960_720.jpg',
          'https://cdn.pixabay.com/photo/2018/05/19/17/38/dress-3417226_960_720.jpg',
        ]
      },
      {
        id: 9,
        name: 'Embroidered Saree',
        rating: '4.9/5',
        price: '400$',
        description: 'A luxurious embroidered saree for a traditional look.',
        images: [
          'https://cdn.pixabay.com/photo/2015/09/01/01/00/saree-917703_960_720.jpg',
          'https://cdn.pixabay.com/photo/2018/04/19/00/55/saree-3335720_960_720.jpg',
          'https://cdn.pixabay.com/photo/2017/06/20/01/02/saree-2421060_960_720.jpg',
        ]
      },
      {
        id: 10,
        name: 'Glitter Shoes',
        rating: '4.6/5',
        price: '150$',
        description: 'Sparkling glitter shoes for your night out.',
        images: [
          'https://cdn.pixabay.com/photo/2016/02/19/10/58/shoes-1212929_960_720.jpg',
          'https://cdn.pixabay.com/photo/2015/09/05/17/27/shoes-925640_960_720.jpg',
          'https://cdn.pixabay.com/photo/2016/11/26/06/47/shoes-1861492_960_720.jpg',
        ]
      },
      {
        id: 11,
        name: 'Bow Tie Tuxedo',
        rating: '4.8/5',
        price: '520$',
        description: 'A classic bow tie tuxedo for an elegant night.',
        images: [
          'https://cdn.pixabay.com/photo/2017/10/09/13/01/suit-2837080_960_720.jpg',
          'https://cdn.pixabay.com/photo/2016/11/01/12/57/suit-1790760_960_720.jpg',
          'https://cdn.pixabay.com/photo/2016/02/18/17/03/bowtie-1209860_960_720.jpg',
        ]
      },
      {
        id: 12,
        name: 'Lace Dress',
        rating: '4.5/5',
        price: '270$',
        description: 'An elegant lace dress for a romantic party.',
        images: [
          'https://cdn.pixabay.com/photo/2016/06/01/15/54/dress-1434485_960_720.jpg',
          'https://cdn.pixabay.com/photo/2016/05/24/13/30/dress-1418459_960_720.jpg',
          'https://cdn.pixabay.com/photo/2016/11/04/18/44/dress-1803536_960_720.jpg',
        ]
      },
      {
        id: 13,
        name: 'Ruffle Top',
        rating: '4.3/5',
        price: '90$',
        description: 'A stylish ruffle top for a chic party look.',
        images: [
          'https://cdn.pixabay.com/photo/2017/06/19/23/40/t-shirt-2422635_960_720.jpg',
          'https://cdn.pixabay.com/photo/2017/07/14/12/34/fashion-2501009_960_720.jpg',
          'https://cdn.pixabay.com/photo/2017/05/06/00/46/fashion-2282022_960_720.jpg',
        ]
      },
      {
        id: 14,
        name: 'Statement Earrings',
        rating: '4.7/5',
        price: '50$',
        description: 'Add a bold statement to your outfit with these earrings.',
        images: [
          'https://cdn.pixabay.com/photo/2016/05/03/19/05/jewelry-1376076_960_720.jpg',
          'https://cdn.pixabay.com/photo/2018/05/25/22/16/earrings-3420369_960_720.jpg',
          'https://cdn.pixabay.com/photo/2017/06/29/12/24/jewelry-2451409_960_720.jpg',
        ]
      },
      {
        id: 15,
        name: 'Sequin Mini Skirt',
        rating: '4.2/5',
        price: '110$',
        description: 'A fun sequin mini skirt for your night out.',
        images: [
          'https://cdn.pixabay.com/photo/2017/10/01/08/17/sequin-2807015_960_720.jpg',
          'https://cdn.pixabay.com/photo/2017/10/01/08/15/sequin-2807012_960_720.jpg',
          'https://cdn.pixabay.com/photo/2017/10/01/08/16/sequin-2807013_960_720.jpg',
        ]
      },
      {
        id: 16,
        name: 'Metallic Blouse',
        rating: '4.4/5',
        price: '100$',
        description: 'Shiny metallic blouse to stand out in a party.',
        images: [
          'https://cdn.pixabay.com/photo/2016/11/07/10/13/fashion-1803040_960_720.jpg',
          'https://cdn.pixabay.com/photo/2017/09/05/00/46/fashion-2716994_960_720.jpg',
          'https://cdn.pixabay.com/photo/2016/06/29/12/35/fashion-1484041_960_720.jpg',
        ]
      }
    ]
    ,
    gym :[
      {
        "id": 1,
        "name": "Gym T-Shirt",
        "rating": "4.6/5",
        "price": "$25",
        "description": "A comfortable gym t-shirt perfect for all your workouts.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Gym+T-Shirt+Image+1",
          "https://via.placeholder.com/400x300.png?text=Gym+T-Shirt+Image+2",
          "https://via.placeholder.com/400x300.png?text=Gym+T-Shirt+Image+3"
        ]
      },
      {
        "id": 2,
        "name": "Workout Shorts",
        "rating": "4.7/5",
        "price": "$30",
        "description": "Lightweight workout shorts for maximum comfort.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Workout+Shorts+Image+1",
          "https://via.placeholder.com/400x300.png?text=Workout+Shorts+Image+2",
          "https://via.placeholder.com/400x300.png?text=Workout+Shorts+Image+3"
        ]
      },
      {
        "id": 3,
        "name": "Compression Pants",
        "rating": "4.8/5",
        "price": "$40",
        "description": "Compression pants designed for better performance and muscle support.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Compression+Pants+Image+1",
          "https://via.placeholder.com/400x300.png?text=Compression+Pants+Image+2",
          "https://via.placeholder.com/400x300.png?text=Compression+Pants+Image+3"
        ]
      },
      {
        "id": 4,
        "name": "Training Hoodie",
        "rating": "4.5/5",
        "price": "$60",
        "description": "A cozy hoodie for your training sessions.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Training+Hoodie+Image+1",
          "https://via.placeholder.com/400x300.png?text=Training+Hoodie+Image+2",
          "https://via.placeholder.com/400x300.png?text=Training+Hoodie+Image+3"
        ]
      },
      {
        "id": 5,
        "name": "Athletic Tank Top",
        "rating": "4.4/5",
        "price": "$20",
        "description": "Stay cool with this breathable athletic tank top.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Athletic+Tank+Top+Image+1",
          "https://via.placeholder.com/400x300.png?text=Athletic+Tank+Top+Image+2",
          "https://via.placeholder.com/400x300.png?text=Athletic+Tank+Top+Image+3"
        ]
      },
      {
        "id": 6,
        "name": "Sweatpants",
        "rating": "4.6/5",
        "price": "$35",
        "description": "Comfortable sweatpants perfect for lounging or workouts.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Sweatpants+Image+1",
          "https://via.placeholder.com/400x300.png?text=Sweatpants+Image+2",
          "https://via.placeholder.com/400x300.png?text=Sweatpants+Image+3"
        ]
      },
      {
        "id": 7,
        "name": "Sports Bra",
        "rating": "4.7/5",
        "price": "$25",
        "description": "Supportive sports bra for active women.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Sports+Bra+Image+1",
          "https://via.placeholder.com/400x300.png?text=Sports+Bra+Image+2",
          "https://via.placeholder.com/400x300.png?text=Sports+Bra+Image+3"
        ]
      },
      {
        "id": 8,
        "name": "Performance Leggings",
        "rating": "4.9/5",
        "price": "$45",
        "description": "High-performance leggings for your workout needs.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Performance+Leggings+Image+1",
          "https://via.placeholder.com/400x300.png?text=Performance+Leggings+Image+2",
          "https://via.placeholder.com/400x300.png?text=Performance+Leggings+Image+3"
        ]
      },
      {
        "id": 9,
        "name": "Gym Gloves",
        "rating": "4.5/5",
        "price": "$15",
        "description": "Grip-enhancing gym gloves for weightlifting.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Gym+Gloves+Image+1",
          "https://via.placeholder.com/400x300.png?text=Gym+Gloves+Image+2",
          "https://via.placeholder.com/400x300.png?text=Gym+Gloves+Image+3"
        ]
      },
      {
        "id": 10,
        "name": "Headband",
        "rating": "4.3/5",
        "price": "$10",
        "description": "Keep your hair in place during intense workouts.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Headband+Image+1",
          "https://via.placeholder.com/400x300.png?text=Headband+Image+2",
          "https://via.placeholder.com/400x300.png?text=Headband+Image+3"
        ]
      },
      {
        "id": 11,
        "name": "Training Sneakers",
        "rating": "4.8/5",
        "price": "$80",
        "description": "Supportive and durable sneakers for any kind of training.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Training+Sneakers+Image+1",
          "https://via.placeholder.com/400x300.png?text=Training+Sneakers+Image+2",
          "https://via.placeholder.com/400x300.png?text=Training+Sneakers+Image+3"
        ]
      },
      {
        "id": 12,
        "name": "Fitness Tracker",
        "rating": "4.9/5",
        "price": "$100",
        "description": "Track your fitness metrics with this advanced tracker.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Fitness+Tracker+Image+1",
          "https://via.placeholder.com/400x300.png?text=Fitness+Tracker+Image+2",
          "https://via.placeholder.com/400x300.png?text=Fitness+Tracker+Image+3"
        ]
      },
      {
        "id": 13,
        "name": "Weightlifting Belt",
        "rating": "4.7/5",
        "price": "$50",
        "description": "A durable belt designed for weightlifting support.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Weightlifting+Belt+Image+1",
          "https://via.placeholder.com/400x300.png?text=Weightlifting+Belt+Image+2",
          "https://via.placeholder.com/400x300.png?text=Weightlifting+Belt+Image+3"
        ]
      },
      {
        "id": 14,
        "name": "Resistance Bands",
        "rating": "4.4/5",
        "price": "$15",
        "description": "Portable resistance bands for a variety of exercises.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Resistance+Bands+Image+1",
          "https://via.placeholder.com/400x300.png?text=Resistance+Bands+Image+2",
          "https://via.placeholder.com/400x300.png?text=Resistance+Bands+Image+3"
        ]
      },
      {
        "id": 15,
        "name": "Water Bottle",
        "rating": "4.6/5",
        "price": "$12",
        "description": "A high-quality, durable water bottle for hydration during your workouts.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Water+Bottle+Image+1",
          "https://via.placeholder.com/400x300.png?text=Water+Bottle+Image+2",
          "https://via.placeholder.com/400x300.png?text=Water+Bottle+Image+3"
        ]
      },
      {
        "id": 16,
        "name": "Yoga Mat",
        "rating": "4.7/5",
        "price": "$35",
        "description": "Non-slip yoga mat for all your stretches and yoga poses.",
        "images": [
          "https://via.placeholder.com/400x300.png?text=Yoga+Mat+Image+1",
          "https://via.placeholder.com/400x300.png?text=Yoga+Mat+Image+2",
          "https://via.placeholder.com/400x300.png?text=Yoga+Mat+Image+3"
        ]
      }
    ]
  };

  
