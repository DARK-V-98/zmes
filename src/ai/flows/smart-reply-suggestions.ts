'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating smart reply suggestions based on a given message.
 *
 * The flow takes a message as input and returns an array of suggested reply texts.
 * - `getSmartReplySuggestions` - A function that generates smart reply suggestions.
 * - `SmartReplySuggestionsInput` - The input type for the `getSmartReplySuggestions` function.
 * - `SmartReplySuggestionsOutput` - The output type for the `getSmartReplySuggestions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartReplySuggestionsInputSchema = z.object({
  message: z.string().describe('The latest message received from the user.'),
});
export type SmartReplySuggestionsInput = z.infer<typeof SmartReplySuggestionsInputSchema>;

const SmartReplySuggestionsOutputSchema = z.array(z.string()).describe('An array of suggested reply texts.');
export type SmartReplySuggestionsOutput = z.infer<typeof SmartReplySuggestionsOutputSchema>;

export async function getSmartReplySuggestions(input: SmartReplySuggestionsInput): Promise<SmartReplySuggestionsOutput> {
  return smartReplySuggestionsFlow(input);
}

const smartReplySuggestionsPrompt = ai.definePrompt({
  name: 'smartReplySuggestionsPrompt',
  input: {schema: SmartReplySuggestionsInputSchema},
  output: {schema: SmartReplySuggestionsOutputSchema},
  prompt: `You are a helpful AI assistant that suggests smart replies to a given message.

  Generate 3 diverse reply suggestions for the following message:
  {{message}}

  The replies should be short, relevant, and appropriate for a casual conversation.
  Return only a JSON array of strings.
  Do not include any additional information in the response.
  `,
});

const smartReplySuggestionsFlow = ai.defineFlow(
  {
    name: 'smartReplySuggestionsFlow',
    inputSchema: SmartReplySuggestionsInputSchema,
    outputSchema: SmartReplySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await smartReplySuggestionsPrompt(input);
    return output!;
  }
);
