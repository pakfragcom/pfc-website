import {defineType, defineField} from 'sanity'
const rating = (title) => defineField({ name: title.toLowerCase().replace(/\s+/g,''), title, type: 'number', validation: R=>R.min(0).max(10) })

export default defineType({
  name: 'review',
  title: 'Editorial Review',
  type: 'document',
  fields: [
    defineField({ name: 'perfume', title: 'Perfume', type: 'reference', to:[{type:'perfume'}], validation:R=>R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options:{source: (d)=>d.perfume?._ref, maxLength:96} }),
    defineField({ name: 'headline', title: 'Headline', type: 'string', validation:R=>R.required() }),
    defineField({ name: 'summary', title: 'Bottom line / Summary', type: 'text' }),
    defineField({ name: 'pros', title: 'Pros', type: 'array', of: [{type:'string'}] }),
    defineField({ name: 'cons', title: 'Cons', type: 'array', of: [{type:'string'}] }),
    defineField({
      name: 'ratings', title: 'Ratings (0–10)', type: 'object',
      fields: [ rating('Overall'), rating('Scent Quality'), rating('Originality'), rating('Versatility'), rating('Longevity'), rating('Sillage'), rating('Value') ]
    }),
    defineField({ name: 'whoFor', title: 'Who is this for?', type: 'array', of: [{type:'string'}], options: {layout:'tags'} }),
    defineField({
      name: 'testing', title: 'About this review (transparency)', type: 'object',
      fields: [
        defineField({ name:'bottleSource', title:'Bottle Source', type:'string' }),
        defineField({ name:'testingPeriod', title:'Testing Period', type:'string' }),
        defineField({ name:'climate', title:'Climate', type:'string' }),
      ],
    }),
    defineField({
      name: 'updateLog', title: 'Update Log', type: 'array',
      of: [{ type: 'object', fields: [
        defineField({ name:'date', title:'Date', type:'date' }),
        defineField({ name:'note', title:'Note', type:'text' }),
      ]}],
    }),
    defineField({ name: 'body', title: 'Body', type: 'array', of: [{type:'block'}] }),
  ],
  preview: { select: {title: 'headline', subtitle: 'perfume.name'} },
})
