import { defineField, defineType } from 'sanity';

// P3-01 — Customer document. Upserted by email whenever an order is created
// through any payment path (Stripe/Safepay webhook, COD). orderCount and
// totalSpent are maintained by the server; creditBalance/points back
// P3-10 (store credit) and P3-14 (loyalty).
export default defineType({
  name: 'customer',
  title: 'Customer',
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
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'orderCount',
      title: 'Order Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: 'totalSpent',
      title: 'Total Spent',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: 'creditBalance',
      title: 'Store Credit Balance',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'points',
      title: 'Loyalty Points',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: { title: 'email', subtitle: 'name' },
  },
});
