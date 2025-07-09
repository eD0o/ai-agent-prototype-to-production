import { runEval } from '../evalTools'
import { runLLM } from '../../src/llm'
import { ToolCallMatch } from '../scorers'
import { redditToolDefinition } from '../../src/tools/reddit'

// Helper function to create a tool call message for the assistant
const createToolCallMessage = (toolName: string) => ({
  role: 'assistant',
  tool_calls: [
    {
      type: 'function',
      function: { name: toolName },
    },
  ],
})

// Run an evaluation named 'reddit'
runEval('reddit', {
  // The task to evaluate: runs the LLM with a user message and the Reddit tool
  task: (input) =>
    runLLM({
      messages: [{ role: 'user', content: input }],
      tools: [redditToolDefinition],
    }),
  // Test data: input and the expected tool call message
  data: [
    {
      input: 'tell me something cool from reddit',
      expected: createToolCallMessage(redditToolDefinition.name),
    },
  ],
  // Scorers to use for evaluating the result
  scorers: [ToolCallMatch],
})