import type { AIMessage } from '../types'
import { openai } from './ai'
import { zodFunction, zodResponseFormat } from 'openai/helpers/zod'
import { systemPrompt as defaultSystemPrompt } from './systemPrompt'
import { z } from 'zod'
import { getSummary } from './memory'

export const runLLM = async ({
  messages,
  tools = [],
  temperature = 0.1,
  systemPrompt,
}: {
  messages: AIMessage[]
  tools?: any[]
  temperature?: number
  systemPrompt?: string
}) => {
  const formattedTools = tools.map(zodFunction)
  const summary = await getSummary()
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature,
    messages: [
      {
        role: 'system',
        content: `${systemPrompt || defaultSystemPrompt
          }. Conversation summary so far: ${summary}`,
      },
      ...messages,
    ],
    ...(formattedTools.length > 0 && {
      tools: formattedTools,
      tool_choice: 'auto',
      parallel_tool_calls: false,
    }),
  })

  return response.choices[0].message
}

// Asynchronous function to check if the user approved the image generation
export const runApprovalCheck = async (userMessage: string) => {
  // Call OpenAI's API using the `parse` method, which expects a structured response
  const response = await openai.beta.chat.completions.parse({
    // Use the lightweight GPT-4o-mini model
    model: 'gpt-4o-mini',
    // Low temperature for consistent, deterministic responses
    temperature: 0.1,
    // Specify the expected response format using Zod schema validation
    response_format: zodResponseFormat(
      z.object({
        // Expect a single boolean field named 'approved'
        approved: z.boolean().describe('did the user say they approved or not'),
      }),
      // Specify the reasoning type for the model (can be a custom instruction tag)
      'math_reasoning'
    ),
    // Provide the message history to the model
    messages: [
      {
        role: 'system',
        // Give the model clear instructions: only consider it approved if it's explicit
        content:
          'Determine if the user approved the image generation. If you are not sure, then it is not approved.',
      },
      // User message that will be analyzed for approval intent
      { role: 'user', content: userMessage },
    ],
  })

  // Return the parsed 'approved' boolean value from the model’s response (if present)
  return response.choices[0].message.parsed?.approved
}

export const summarizeMessages = async (messages: AIMessage[]) => {
  const response = await runLLM({
    systemPrompt:
      'Summarize the key points of the conversation in a concise way that would be helpful as context for future interactions. Make it like a play by play of the conversation.',
    messages,
    temperature: 0.3,
  })

  return response.content || ''
}