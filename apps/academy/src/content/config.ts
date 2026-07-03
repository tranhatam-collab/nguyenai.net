import { defineCollection, z } from 'astro:content';

const lessons = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    track: z.string(),
    trackId: z.number(),
    order: z.number(),
    duration: z.string(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Beginner'),
    lang: z.enum(['vi', 'en']).default('vi'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { lessons };
