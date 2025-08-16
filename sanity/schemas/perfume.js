import {defineType, defineField} from 'sanity'

const concentrations = [
  {title:'EDT', value:'edt'},
  {title:'EDP', value:'edp'},
  {title:'Parfum/Extract', value:'parfum'},
  {title:'Cologne', value:'cologne'},
]
const families = [
  'Floral','Oriental','Woody','Fresh','Chypre','Fougere','Gourmand','Aromatic','Citrus','Leather','Amber'
]
const seasons = ['Spring','Summer','Autumn','Winter']
const genderLean = ['Masculine','Feminine','Unisex']

export default defineType({
  name: 'perfume',
  title: 'Perfume',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: R=>R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name', maxLength: 96 }, validation: R=>R.required() }),
    defineField({ name: 'brand', title: 'Brand', type: 'reference', to: [{type:'brand'}], validation: R=>R.required() }),
    defineField({ name: 'hero', title: 'Hero Image', type: 'image', options: {hotspot:true} }),
    defineField({ name: 'gallery', title: 'Gallery', type: 'array', of: [{type:'image'}] }),
    defineField({ name: 'concentration', title: 'Concentration', type: 'string', options: { list: concentrations } }),
    defineField({ name: 'perfumer', title: 'Perfumer', type: 'string' }),
    defineField({ name: 'launchYear', title: 'Launch Year', type: 'number' }),
    defineField({ name: 'family', title: 'Family', type: 'string', options: { list: families } }),
    defineField({ name: 'accords', title: 'Top Accords', type: 'array', of: [{type:'string'}] }),
    defineField({ name: 'topNotes', title: 'Top Notes', type: 'array', of: [{type:'string'}] }),
    defineField({ name: 'heartNotes', title: 'Heart Notes', type: 'array', of: [{type:'string'}] }),
    defineField({ name: 'baseNotes', title: 'Base Notes', type: 'array', of: [{type:'string'}] }),
    defineField({ name: 'longevityHours', title: 'Longevity (hours)', type: 'number', description:'Average on skin' }),
    defineField({ name: 'sillageMeters', title: 'Sillage (meters)', type: 'number', description:'Approx. projection radius' }),
    defineField({ name: 'seasonality', title: 'Seasonality', type: 'array', of: [{type:'string'}], options: {list: seasons, layout: 'tags'} }),
    defineField({ name: 'genderLean', title: 'Gender Lean', type: 'string', options: {list: genderLean} }),
    defineField({ name: 'sprayAdvice', title: 'Spray Count Advice', type: 'string' }),
    defineField({ name: 'batchInfo', title: 'Batch Info', type: 'text' }),
    defineField({ name: 'ifraStatus', title: 'IFRA Status', type: 'string' }),
    defineField({ name: 'allergens', title: 'Allergens', type: 'array', of: [{type:'string'}] }),
    defineField({ name: 'priceRange', title: 'Price Range (PKR)', type: 'string' }),
  ],
  preview: { select: {title: 'name', subtitle: 'brand.name', media: 'hero'} },
})
