'use server';
import { getSmartReplySuggestions } from '@/ai/flows/smart-reply-suggestions';

export async function generateSmartReplies(message: string) {
  if (!message) return [];
  try {
    const replies = await getSmartReplySuggestions({ message });
    return replies;
  } catch (error) {
    console.error('Error generating smart replies:', error);
    return [];
  }
}
