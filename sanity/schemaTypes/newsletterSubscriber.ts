import { defineField, defineType } from 'sanity';

// Newsletter subscribers captured from the storefront footer. This is a real
// persisted subscription (not a local-only success message) — admins can see
// the list in Sanity Studio and export it for email campaigns.
export default defineType({
  name: 'newsletterSubscriber',
  title: 'Newsletter Subscriber',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email().error('A valid email is required'),
    }),
    defineField({
      name: 'tenantId',
      title: 'Tenant',
      description: 'Owning tenant (SaaS). Leave empty for the default tenant.',
      type: 'string',
    }),
    defineField({
      name: 'source',
      title: 'Source',
      description: 'Where the subscription was captured (e.g. footer).',
      type: 'string',
      initialValue: 'footer',
    }),
    defineField({
      name: 'created_at',
      title: 'Subscribed At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: { title: 'email', subtitle: 'created_at' },
  },
});
