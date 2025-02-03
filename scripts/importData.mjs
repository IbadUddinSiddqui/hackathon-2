import { createClient } from '@sanity/client';
import { v4 as uuidv4 } from 'uuid';

const client = createClient({
  projectId: 'xphvex0e',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2025-01-13',
  token: 'skwCgoxZFlLNZ4pJvHGxBL4HwxACC2BWjzLOdLShub9MUTiTjDJqf3MZVipfrn4bxvoG3v8kWSWponB4lrdSH08kYflsjXTAG3TI4aIGSxogwN5y3mcOojsD3LFZDf5CYEpYrrspXa3beHAiGY9obhivS48gAMi8w67AS7y6UoLzW0mEvPfp', // Add your Sanity API token here
});

async function deleteAllProducts() {
  try {
    const products = await client.fetch(`*[_type == "product"]{ _id }`);

    if (products.length === 0) {
      console.log('No products found to delete.');
      return;
    }

    console.log(`Found ${products.length} products. Deleting...`);

    const deletePromises = products.map((product) =>
      client.delete(product._id)
    );

    await Promise.all(deletePromises);

    console.log('All products deleted successfully.');
  } catch (error) {
    console.error('Error deleting products:', error);
  }
}

deleteAllProducts();

async function uploadImageToSanity(imageUrl) {
  try {
    console.log(`Uploading image: ${imageUrl}`);

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${imageUrl}`);
    }

    const buffer = await response.arrayBuffer();
    const bufferImage = Buffer.from(buffer);

    const asset = await client.assets.upload('image', bufferImage, {
      filename: imageUrl.split('/').pop(),
    });

    console.log(`Image uploaded successfully: ${asset._id}`);
    return {
      _type: 'image',
      asset: {
        _ref: asset._id,
      },
    };
  } catch (error) {
    console.error('Failed to upload image:', imageUrl, error);
    return null;
  }
}

async function uploadProduct(product) {
  try {
    const images = await Promise.all(
      product.images.map(async (imageUrl) => {
        const uploadedImage = await uploadImageToSanity(imageUrl);
        return {
          _key: uuidv4(), // Generate a unique key for each image
          ...uploadedImage,
        };
      })
    );

    const document = {
      _type: 'product',
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      category_slug: product.category_slug,
      images: images.filter(Boolean), // Filter out failed uploads
      size: product.size,
      qcom_availability: product.qcom_availability,
      brand: product.brand,
      tags: product.tags,
      ratings: product.ratings,
      created_at: product.created_at,
    };

    const createdProduct = await client.create(document);
    console.log(`Product "${product.name}" uploaded successfully:`, createdProduct);
  } catch (error) {
    console.error('Error uploading product:', error);
  }
}

async function importProducts() {
  try {
    const response = await fetch('https://hackathon3backendserver-production.up.railway.app/api/products');

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const products = await response.json();

    for (const product of products) {
      await uploadProduct(product);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

importProducts();
