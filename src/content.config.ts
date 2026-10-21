import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// The docs, at /docs: Markdown and MDX in src/content/docs/docs/.
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // Every page has its own description, for search results and link
        // previews: 160 characters at most.
        description: z.string().max(160),
      }),
    }),
  }),
  // The blog, at /blog: one Markdown file a post in src/content/blog/.
  blog: defineCollection({
    loader: glob({ pattern: '*.md', base: './src/content/blog' }),
    schema: z.object({
      title: z.string(),
      description: z.string().max(160),
      date: z.coerce.date(),
      author: z.string().default('The Firenook team'),
      draft: z.boolean().default(false),
    }),
  }),
};
