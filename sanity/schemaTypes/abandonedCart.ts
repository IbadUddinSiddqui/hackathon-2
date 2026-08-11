import { defineField, defineType } from 'sanity';

// P3-06 — Abandoned cart. Created server-side when a shopper enters a contact
// email at checkout but never completes the order. Removed (or marked
// completed) once the same email places an order. Feeds the recovery-email
// cron (P3-07) and the admin abandoned-cart view (P3-08).
export default defineType({
  name: 'abandonedCart',
  title: 'Abandoned Cart',
  type: 'document',
  fields: [
    defineField({
      name: 'tenantId',
      title: 'Tenant',
      description: 'Owning tenant (SaaS). Leave empty for the default tenant.',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'abandonedItem',
          fields: [
            defineField({ name: 'productId', title: 'Product ID', type: 'string' }),
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'price', title: 'Price', type: 'number' }),
            defineField({ name: 'quantity', title: 'Quantity', type: 'number' }),
            defineField({ name: 'size', title: 'Size', type: 'array', of: [{ type: 'string' }] }),
          ],
        },
      ],
    }),
    defineField({
      name: 'subtotal',
      title: 'Subtotal',
      type: 'number',
    }),
    defineField({
      name: 'checkoutUrl',
      title: 'Checkout URL',
      type: 'string',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Abandoned', value: 'abandoned' },
          { title: 'Reminded', value: 'reminded' },
          { title: 'Recovered', value: 'recovered' },
          { title: 'Completed', value: 'completed' },
        ],
        layout: 'radio',
      },
      initialValue: 'abandoned',
    }),
    defineField({
      name: 'remindedAt',
      title: 'Reminded At',
      type: 'datetime',
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
});
