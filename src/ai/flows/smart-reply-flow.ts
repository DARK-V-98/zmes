
'use server';
/**
 * @fileOverview An AI flow to generate smart reply suggestions for a chat conversation.
 *
 * - suggestReplies - A function that generates reply suggestions.
 * - SuggestRepliesInput - The input type for the suggestReplies function.
 * - SuggestRepliesOutput - The return type for the suggestReplies function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestRepliesInputSchema = z.object({
  conversationHistory: z.array(
    z.object({
      author: z.string().describe('The author of the message, either "user" or "other".'),
      content: z.string().describe('The content of the message.'),
    })
  ).describe('The recent history of the conversation.'),
});
export type SuggestRepliesInput = z.infer<typeof SuggestRepliesInputSchema>;

const SuggestRepliesOutputSchema = z.object({
  replies: z
    .array(z.string())
    .describe('A list of 3 short, relevant reply suggestions.'),
});
export type SuggestRepliesOutput = z.infer<typeof SuggestRepliesOutputSchema>;

export async function suggestReplies(input: SuggestRepliesInput): Promise<SuggestRepliesOutput> {
  return suggestRepliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRepliesPrompt',
  input: { schema: SuggestRepliesInputSchema },
  output: { schema: SuggestRepliesOutputSchema },
  prompt: `You are an AI assistant in a messaging app. Your task is to suggest three short, relevant, and natural-sounding replies for the "user". The conversation history is provided below. The last message is from the "other" person. Generate replies that the "user" might send in response. Keep the replies concise, like they would be in a real chat app.

Conversation History:
{{#each conversationHistory}}
{{this.author}}: {{{this.content}}}
{{/each}}
`,
});

const suggestRepliesFlow = ai.defineFlow(
  {
    name: 'suggestRepliesFlow',
    inputSchema: SuggestRepliesInputSchema,
    outputSchema: SuggestRepliesOutputSchema,
  },
  async (input) => {
    // Ensure we don't generate replies for the user's own messages
    const lastMessage = input.conversationHistory[input.conversationHistory.length - 1];
    if (!lastMessage || lastMessage.author === 'user' || input.conversationHistory.length === 0) {
      return { replies: [] };
    }
    
    const { output } = await prompt(input);
    return output || { replies: [] };
  }
);
