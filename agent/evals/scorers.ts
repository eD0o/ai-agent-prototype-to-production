import type { Scorer } from 'autoevals'

export const ToolCallMatch: Scorer<any, {}> = async ({
  input,
  output,
  expected,
}) => {
  const score =
    output.role === 'assistant' && // Check if the output has tool calls
      Array.isArray(output.tool_calls) && // Ensure tool_calls is an array
      output.tool_calls.length === 1 && // Check if there is exactly one tool call
      output.tool_calls[0].function?.name ===
      expected.tool_calls[0].function?.name // Check if the tool call matches the expected one
      ? 1
      : 0

  return {
    name: 'ToolCallMatch',
    score,
  }
}