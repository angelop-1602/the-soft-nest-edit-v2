import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const categories = z.enum(['Living Room', 'Bedroom', 'Small Spaces', 'Home Organization', 'Lifestyle']);

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().min(8),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: categories,
    description: z.string().min(20),
    image: z.string().optional(),
    image_alt: z.string().optional(),
    published: z.boolean().default(false),
    featured: z.boolean().default(false),
    related_products: z.array(z.string()).default([])
  })
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    title: z.string().min(5),
    category: categories,
    summary: z.string().min(20),
    retailer: z.string().default('Amazon US'),
    status: z.enum(['draft', 'approved', 'hidden']).default('draft'),
    published: z.boolean().default(false),
    affiliate_url: z.string().default(''),
    link_verified: z.boolean().default(false),
    image: z.string().optional(),
    image_alt: z.string().optional(),
    image_rights_confirmed: z.boolean().default(false),
    best_for: z.string().optional(),
    considerations: z.string().optional(),
    highlights: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    reviewed_at: z.coerce.date().optional()
  })
});

export const collections = { posts, products };
