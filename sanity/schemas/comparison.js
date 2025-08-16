import {defineType, defineField} from 'sanity'
export default defineType({
  name: 'comparison',
  title: 'Comparison',
  type: 'document',
  fields: [
    defineField({ name:'base', title:'Base Perfume', type:'reference', to:[{type:'perfume'}], validation:R=>R.required() }),
    defineField({ name:'vs', title:'Compared To', type:'reference', to:[{type:'perfume'}], validation:R=>R.required() }),
    defineField({ name:'gain', title:'What you gain', type:'array', of:[{type:'string'}] }),
    defineField({ name:'lose', title:'What you lose', type:'array', of:[{type:'string'}] }),
    defineField({ name:'notes', title:'Notes', type:'text' }),
  ],
  preview: {
    select: {title:'base.name', subtitle:'vs.name'},
    prepare({title, subtitle}) { return { title: `${title} vs ${subtitle}` } }
  }
})
