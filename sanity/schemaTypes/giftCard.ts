import { defineField, defineType } from 'sanity';

// P3-11 — Gift card. Admin creates a code with a balance; customers redeem it
// at checkout (server-side validated, balance decremented per use).
export default defineType({
  name: 'giftCard',
  title: 'Gift Card',
  type: 'document',
  fields: [
    defineField({
      name: 'code',
      title: 'Code',
      type: 'string',
      validation: (Rule) => Rule.required().uppercase().error('Code is required'),
    }),
    defineField({
      name: 'balance',
      title: 'Balance (PKR)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires At',
      description: 'Optional — leave empty for no expiry',
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
