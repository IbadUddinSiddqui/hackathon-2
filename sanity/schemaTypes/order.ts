import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  fields: [
    defineField({
      name: 'order_id',
      title: 'Order ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Paid', value: 'paid' },
          { title: 'Failed', value: 'failed' },
          { title: 'Refunded', value: 'refunded' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'payment_method',
      title: 'Payment Method',
      type: 'string',
      options: {
        list: [
          { title: 'Card (Safepay)', value: 'safepay' },
          { title: 'Cash on Delivery', value: 'cod' },
        ],
        layout: 'radio',
      },
      initialValue: 'card',
    }),
    defineField({
      name: 'customer_email',
      title: 'Customer Email',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'customer_name',
      title: 'Customer Name',
      type: 'string',
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'orderItem',
          fields: [
            defineField({
              name: 'product',
              title: 'Product',
              type: 'reference',
              to: [{ type: 'product' }],
            }),
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
            }),
            defineField({
              name: 'price',
              title: 'Price',
              type: 'number',
            }),
            defineField({
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
            }),
            defineField({
              name: 'size',
              title: 'Size',
              type: 'array',
              of: [{ type: 'string' }],
            }),
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
      name: 'discount_code',
      title: 'Discount Code',
      type: 'string',
    }),
    defineField({
      name: 'discount_amount',
      title: 'Discount Amount',
      type: 'number',
    }),
    defineField({
      name: 'total',
      title: 'Total',
      type: 'number',
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'pkr',
    }),
    defineField({
      name: 'stripe_session_id',
      title: 'Stripe Session ID',
      type: 'string',
    }),
    defineField({
      name: 'stripe_payment_intent_id',
      title: 'Stripe Payment Intent ID',
      type: 'string',
    }),
    defineField({
      name: 'safepay_tracker_token',
      title: 'Safepay Tracker Token',
      type: 'string',
    }),
    defineField({
      name: 'safepay_reference',
      title: 'Safepay Reference',
      type: 'string',
    }),
    defineField({
      name: 'created_at',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
});
