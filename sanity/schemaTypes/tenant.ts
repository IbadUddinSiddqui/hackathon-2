import { defineField, defineType } from 'sanity';

// P4-01 — Tenant (SaaS). One doc per client brand running on the platform.
// Every tenant-scoped collection carries a `tenantId` string that points here.
// The default tenant (tenant-anks) wraps all pre-existing data.
export default defineType({
  name: 'tenant',
  title: 'Tenant',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Tenant Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'domains',
      title: 'Domains',
      description: 'Custom domains + subdomains that route to this tenant (e.g. anks.pk, store.anks.pk)',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'plan',
      title: 'Plan',
      type: 'string',
      options: {
        list: [
          { title: 'Free', value: 'free' },
          { title: 'Trial', value: 'trial' },
          { title: 'Pro', value: 'pro' },
        ],
        layout: 'radio',
      },
      initialValue: 'free',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'billingStatus',
      title: 'Billing Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Trialing', value: 'trialing' },
          { title: 'Past Due', value: 'past_due' },
          { title: 'Paused', value: 'paused' },
        ],
        layout: 'radio',
      },
      initialValue: 'active',
    }),
    defineField({
      name: 'branding',
      title: 'Branding',
      type: 'object',
      fields: [
        defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
        defineField({ name: 'contactEmail', title: 'Contact Email', type: 'string' }),
        defineField({ name: 'whatsapp', title: 'WhatsApp Number', type: 'string' }),
        defineField({ name: 'accentColor', title: 'Accent Color (hex)', type: 'string' }),
      ],
    }),
    defineField({
      name: 'features',
      title: 'Feature Flags',
      description: 'Enabled per-plan features (flash sales, reviews, gift cards, loyalty, bundles).',
      type: 'object',
      fields: [
        defineField({ name: 'flashSales', title: 'Flash Sales', type: 'boolean', initialValue: true }),
        defineField({ name: 'reviews', title: 'Reviews', type: 'boolean', initialValue: true }),
        defineField({ name: 'giftCards', title: 'Gift Cards', type: 'boolean', initialValue: true }),
        defineField({ name: 'loyalty', title: 'Loyalty Points', type: 'boolean', initialValue: true }),
        defineField({ name: 'bundles', title: 'Bundles', type: 'boolean', initialValue: true }),
        defineField({ name: 'credit', title: 'Store Credit', type: 'boolean', initialValue: true }),
      ],
    }),
    defineField({
      name: 'payments',
      title: 'Payment Config',
      description: 'Per-tenant payment keys. Leave empty to fall back to the platform env vars.',
      type: 'object',
      fields: [
        defineField({ name: 'safepayApiKey', title: 'Safepay API Key', type: 'string' }),
        defineField({ name: 'safepaySecret', title: 'Safepay Secret', type: 'string' }),
        defineField({ name: 'safepayWebhookSecret', title: 'Safepay Webhook Secret', type: 'string' }),
        defineField({ name: 'currency', title: 'Currency', type: 'string', initialValue: 'PKR' }),
      ],
    }),
    defineField({
      name: 'usage',
      title: 'Usage (auto)',
      type: 'object',
      readOnly: true,
      fields: [
        defineField({ name: 'month', title: 'Billing Month (YYYY-MM)', type: 'string' }),
        defineField({ name: 'orders', title: 'Orders This Month', type: 'number', initialValue: 0 }),
        defineField({ name: 'products', title: 'Products', type: 'number', initialValue: 0 }),
        defineField({ name: 'bandwidthProxy', title: 'Bandwidth Proxy (GB)', type: 'number', initialValue: 0 }),
      ],
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'plan' },
  },
});
