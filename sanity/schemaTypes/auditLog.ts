import { defineField, defineType } from 'sanity';

// P3-04 — Admin audit log. Every admin mutation endpoint (product
// create/update/delete, discount create/update/delete, order status change)
// writes one of these via lib/audit.ts. Read-only history of who did what.
export default defineType({
  name: 'auditLog',
  title: 'Audit Log',
  type: 'document',
  fields: [
    defineField({
      name: 'adminEmail',
      title: 'Admin Email',
      type: 'string',
    }),
    defineField({
      name: 'action',
      title: 'Action',
      type: 'string',
      options: {
        list: [
          { title: 'Create', value: 'create' },
          { title: 'Update', value: 'update' },
          { title: 'Delete', value: 'delete' },
          { title: 'Status Change', value: 'status_change' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetType',
      title: 'Target Type',
      type: 'string',
      options: {
        list: [
          { title: 'Product', value: 'product' },
          { title: 'Order', value: 'order' },
          { title: 'Discount Code', value: 'discountCode' },
          { title: 'Customer', value: 'customer' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetId',
      title: 'Target ID',
      type: 'string',
    }),
    defineField({
      name: 'targetLabel',
      title: 'Target Label',
      type: 'string',
    }),
    defineField({
      name: 'details',
      title: 'Details',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: { title: 'action', subtitle: 'targetLabel' },
  },
});
