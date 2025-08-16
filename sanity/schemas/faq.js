import {defineType, defineField} from 'sanity'
export default defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({ name:'question', title:'Question', type:'string', validation:R=>R.required() }),
    defineField({ name:'answer', title:'Answer', type:'array', of:[{type:'block'}] }),
    defineField({ name:'relatedPerfume', title:'Related Perfume', type:'reference', to:[{type:'perfume'}] }),
    defineField({ name:'tags', title:'Tags', type:'array', of:[{type:'string'}], options:{layout:'tags'} }),
  ],
  preview: { select: {title:'question'} },
})
