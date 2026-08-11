import { defineField, defineType } from 'sanity';

// P3-13 — Flash sale: products sold at a discounted price during a window.
// Storefront + payment endpoints read the ACTIVE sale to price items
// server-side.
export default defineType({
  name: 'flashSale',
  title: 'Flash Sale',
  type: 'document',
  fields: [
    defineField({
      name: 'tenantId',
      title: 'Tenant',
      description: 'Owning tenant (SaaS). Leave empty for the default tenant.',
      type: 'string',
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'salePrice',
      title: 'Sale Price (PKR)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'startsAt',
      title: 'Starts At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endsAt',
      title: 'Ends At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
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
