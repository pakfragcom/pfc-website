import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'brand',
  title: 'Brand',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: R=>R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name', maxLength: 96 }, validation: R=>R.required() }),
    defineField({ name: 'country', title: 'Country', type: 'string' }),
    defineField({ name: 'foundedYear', title: 'Founded Year', type: 'number' }),
    defineField({ name: 'website', title: 'Website', type: 'url' }),
    defineField({ name: 'logo', title: 'Logo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
  ],
  preview: { select: { title: 'name', media: 'logo' } },
})
