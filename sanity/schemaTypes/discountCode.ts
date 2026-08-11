import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'discountCode',
  title: 'Discount Code',
  type: 'document',
  fields: [
    defineField({
      name: 'tenantId',
      title: 'Tenant',
      description: 'Owning tenant (SaaS). Leave empty for the default tenant.',
      type: 'string',
    }),
    defineField({
      name: 'code',
      title: 'Code',
      type: 'string',
      validation: (Rule) => Rule.required().uppercase().error('Code is required'),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Percent (%)', value: 'percent' },
          { title: 'Fixed ($)', value: 'fixed' },
        ],
        layout: 'radio',
      },
      initialValue: 'percent',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Value',
      description: 'Percent (e.g. 10 = 10%) or fixed dollar amount',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).error('Value is required'),
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'maxUses',
      title: 'Max Uses',
      type: 'number',
      initialValue: 100,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'usedCount',
      title: 'Times Used',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires At',
      description: 'Optional — leave empty for no expiry',
      type: 'datetime',
    }),
  ],
});
