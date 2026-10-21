import { defineCollection } from 'astro:content';
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
};
