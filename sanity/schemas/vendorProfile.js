import {defineType, defineField} from 'sanity'
export default defineType({
  name: 'vendorProfile',
  title: 'Vendor Profile',
  type: 'document',
  fields: [
    defineField({ name:'name', title:'Name', type:'string', validation:R=>R.required() }),
    defineField({ name:'whatsapp', title:'WhatsApp Number', type:'string', description:'+92xxxxxxxxxx' }),
    defineField({ name:'region', title:'Region/City', type:'string' }),
    defineField({ name:'notes', title:'Notes', type:'text' }),
  ],
  preview: { select: {title:'name', subtitle:'region'} },
})
