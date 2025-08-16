import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import brand from './sanity/schemas/brand'
import perfume from './sanity/schemas/perfume'
import review from './sanity/schemas/review'
import comparison from './sanity/schemas/comparison'
import vendorProfile from './sanity/schemas/vendorProfile'
import faq from './sanity/schemas/faq'

export default defineConfig({
  name: 'default',
  title: 'PFC Content',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [structureTool(), visionTool()],
  schema: { types: [brand, perfume, review, comparison, vendorProfile, faq] },
})
