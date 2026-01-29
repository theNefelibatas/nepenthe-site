import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const post = defineCollection({
    loader: glob({ base: './content/post', pattern: '**/*.{md,mdx}' }),
    schema: () =>
        z.object({
            title: z.string(),
            description: z.string(),
            pubDate: z.coerce.date(),
            updatedDate: z.coerce.date().optional(),
            draft: z.boolean().default(false),
        }),
});

export const collections = { post, };
