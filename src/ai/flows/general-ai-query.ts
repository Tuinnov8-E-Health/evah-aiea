'use server';

/**
 * @fileOverview A general-purpose AI flow for medical and epilepsy-related knowledge.
 *
 * - generalAiQuery - Provides WHO mhGAP-aligned answers to general inquiries.
 * - GeneralAiQueryInput - Input schema for the query.
 * - GeneralAiQueryOutput - Output schema for the AI response.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneralAiQueryInputSchema = z.object({
  query: z.string().describe('The user\'s medical or clinical question.'),
  context: z.string().optional().describe('Optional context such as selected patient info.'),
});
export type GeneralAiQueryInput = z.infer<typeof GeneralAiQueryInputSchema>;

const GeneralAiQueryOutputSchema = z.object({
  answer: z.string().describe('The AI-generated medical advice or information.'),
});
export type GeneralAiQueryOutput = z.infer<typeof GeneralAiQueryOutputSchema>;

export async function generalAiQuery(input: GeneralAiQueryInput): Promise<GeneralAiQueryOutput> {
  return generalAiQueryFlow(input);
}

const generalAiQueryPrompt = ai.definePrompt({
  name: 'generalAiQueryPrompt',
  input: {schema: GeneralAiQueryInputSchema},
  output: {schema: GeneralAiQueryOutputSchema},
  prompt: `You are an AI Clinical Assistant specializing in epilepsy management (WHO mhGAP protocols).
  
  Provide accurate, concise, and professional medical information. 
  If the query is general, provide WHO-aligned evidence-based information.
  If the query relates to a specific patient context provided, tailor your response while maintaining clinical safety.
  Always emphasize that final clinical authority remains with the healthcare worker.

  Patient Context: {{context}}
  User Query: {{query}}`,
});

const generalAiQueryFlow = ai.defineFlow(
  {
    name: 'generalAiQueryFlow',
    inputSchema: GeneralAiQueryInputSchema,
    outputSchema: GeneralAiQueryOutputSchema,
  },
  async input => {
    const {output} = await generalAiQueryPrompt(input);
    return output!;
  }
);
