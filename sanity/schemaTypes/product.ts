import { defineType, defineField } from 'sanity';

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().error('Name is required'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule) => Rule.required().error('Price is required'),
    }),
    defineField({
      name: 'stock',
      title: 'Stock',
      type: 'number',
      validation: (Rule) => Rule.required().error('Stock is required'),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      validation: (Rule) => Rule.required().error('Category is required'),
    }),
    defineField({
      name: 'category_slug',
      title: 'Category Slug',
      type: 'string',
      validation: (Rule) => Rule.required().error('Category slug is required'),
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image' }],
      validation: (Rule) => Rule.required().min(1).error('At least one image is required'),
    }),
    defineField({
      name: 'size',
      title: 'Size',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.required().min(1).error('At least one size is required'),
    }),
    defineField({
      name: 'qcom_availability',
      title: 'QCOM Availability',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'brand',
      title: 'Brand',
      type: 'string',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'ratings',
      title: 'Ratings',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'created_at',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
});
