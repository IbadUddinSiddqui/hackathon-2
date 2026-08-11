import { defineField, defineType } from 'sanity';

// P3-12 — Bundle: a fixed set of products + quantities sold at a bundle price.
// Renders on the storefront; checkout prices it server-side (price is trusted,
// never client-computed).
export default defineType({
  name: 'bundle',
  title: 'Bundle',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'items',
      title: 'Included Products',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'bundleItem',
          fields: [
            defineField({
              name: 'product',
              title: 'Product',
              type: 'reference',
              to: [{ type: 'product' }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
              initialValue: 1,
              validation: (Rule) => Rule.min(1),
            }),
          ],
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'bundlePrice',
      title: 'Bundle Price (PKR)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
});
