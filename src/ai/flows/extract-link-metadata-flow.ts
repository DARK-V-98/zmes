'use server';
/**
 * @fileOverview An AI flow to extract metadata (title, description, image) from a URL.
 *
 * - extractLinkMetadata - A function that takes a URL and returns its metadata.
 * - LinkMetadataInput - The input type for the extractLinkMetadata function.
 * - LinkMetadataOutput - The return type for the extractLinkMetadata function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const LinkMetadataInputSchema = z.object({
  url: z.string().url().describe('The URL to extract metadata from.'),
});
export type LinkMetadataInput = z.infer<typeof LinkMetadataInputSchema>;

const LinkMetadataOutputSchema = z.object({
  title: z.string().describe('The title of the page.'),
  description: z.string().describe('A brief description of the page content.'),
  imageUrl: z.string().url().optional().describe('The URL of a relevant preview image (like an og:image).'),
});
export type LinkMetadataOutput = z.infer<typeof LinkMetadataOutputSchema>;

export async function extractLinkMetadata(input: LinkMetadataInput): Promise<LinkMetadataOutput | null> {
  try {
    return await extractLinkMetadataFlow(input);
  } catch (error) {
    console.error(`Failed to extract metadata for ${input.url}`, error);
    // Return null if the flow fails, so the app can handle it gracefully
    return null;
  }
}

const prompt = ai.definePrompt({
  name: 'extractLinkMetadataPrompt',
  input: { schema: LinkMetadataInputSchema },
  output: { schema: LinkMetadataOutputSchema },
  prompt: `You are a web page metadata extractor. Your task is to analyze the content of the provided URL and return its key metadata.
Focus on extracting the primary title, a concise summary or description, and the main preview image URL (such as the content of the 'og:image' meta tag).

URL to analyze: {{{url}}}
`,
});

const extractLinkMetadataFlow = ai.defineFlow(
  {
    name: 'extractLinkMetadataFlow',
    inputSchema: LinkMetadataInputSchema,
    outputSchema: LinkMetadataOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
