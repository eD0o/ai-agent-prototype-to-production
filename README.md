# 2 - Evals

> If you're running on Windows, you need to install dotenv-cli: `npm install -D dotenv-cli`, then, if `npx tsx evals/experiments/reddit.eval.ts` still doesn't work, try to run the project using: `npx dotenv -e .env -- tsx evals/experiments/reddit.eval.ts`

## 2.1 - Improving LLMs with Evals

### 🧪 What Are Evals?

- Evals are `non-deterministic "tests"` for LLMs, used to measure quality, accuracy, and behavior.
- Evaluating LLMs is `hard because they are probabilistic like testing a function with Math.random()`.
- Evals deal with non-determinism and pproximate correctness, not binary pass/fail outcomes.
- Think of them as `continuous feedback loops rather than traditional unit tests`.

### 🧠 Why Evals Matter

- Crucial for diagnosing hallucinations, tool misuse, workflow errors, and low-quality responses.
- Essential in LLMOps, `evaluation can represent 20–30% of the time spent on production-grade AI systems`.
- Unlike frontend or backend tests, evals `can become your core responsibility` on an AI team.
- Most AI failures in production stem from insufficient or absent evals.

### ⚠️ The Challenge

- LLM performance is subjective, unlike classic ML (accuracy, F1, precision).

> Key question: What does "correct" mean? How do we compare responses?

### 🧰 Evaluation Types

#### ✅ Automated Evaluations

- Definition: `Fully programmatic` checks no human in the loop at eval time.
- Use case: `Regression testing (rerun past tests to validate that the agent's logic still works) for new model versions, validating logic/tool behavior` before deployment.
- Example:

  - You have an image-generation agent.
  - You send 100 prompts like: "Generate a cartoon dog with sunglasses."
  - You assert that the agent:

    - Uses the correct tool (imageGenerator)
    - Returns a URL or valid image object
    - The JSON response has the correct structure

  - You record pass/fail status and calculate summary metrics (e.g., 92/100 passed).

#### 📊 Response Quality Metrics

- Definition: Evaluates how good the response is, typically along `semantic and stylistic dimensions`.
- Technique: Often `uses LLM-as-a-judge: a second LLM scores or critiques the first one’s output`.
- Common dimensions:

  - Coherence: Is the response logically structured?
  - Relevance: Does it answer the prompt?
  - Toxicity: Is the response safe and appropriate?
  - Tone: Does the style match expectations (e.g., friendly, formal)?

- Example:

  - Prompt: "Explain how to use the useEffect hook in React."
  - Model responds with an explanation.
  - An eval script runs a responseEvaluator LLM with:

    > “Given the input and response below, score coherence and relevance from 0 to 1.”

  - Output: {"coherence": 0.9, "relevance": 0.85}

#### ✔️ Task Completion Verification

- Definition: Checks whether the LLM or agent `completed the full task as instructed`.
- Useful for: Agents, orchestrated workflows, or multi-step instructions.
- Example:

  - Task: "Summarize the latest 3 emails, then schedule a call based on the thread's availability."
  - Eval checks:

    1. If a summary was generated
    2. If calendar availability was extracted
    3. If scheduleCall was triggered with correct data
    4. If final confirmation was provided

  - Only passes if all steps succeed.

#### 🛠️ Tool Accuracy

- Definition: Measures `whether the correct tool was selected, with the correct parameters, and the output interpreted correctly`.
- Why it matters: LLMs with access to many tools can make tool selection or interpretation mistakes.
- Example:

  - Available tools: getWeather, getStockPrice, getNewsHeadlines
  - Prompt: “What’s the current temperature in Paris?”
  - Failure cases:

    - ❌ Uses getNewsHeadlines
    - ❌ Uses getWeather but passes "France" instead of "Paris"
    - ❌ Uses correct tool, but says 23°F instead of 23°C

  - Eval checks:

    - Tool selection
    - Parameter correctness
    - Output interpretation

> Tip: The more tools you expose to the LLM, the more important tool accuracy evals become.

#### 📁 Dataset Creation

- Synthetic data: Generate inputs and expected outputs automatically.
- Real-world data: Leverage production logs and user feedback.
- Golden datasets: Curated sets where expected outputs are known, used as "ground truth" for evals.

Key principles:

- Coverage: Include both common and rare cases.
- Diversity: Vary prompt styles, tone, structure, and language.
- Evolution: Continuously update datasets as new failure modes appear.

## 2.2 - 📊 Measuring What Matters

- Choosing the right metric is more valuable than building a perfect model.
- Wrong metrics → Wrong incentives → Wrong behavior.
- Avoid oversimplified metrics (e.g. latency only, or thumbs-up only).
- Use a balanced scorecard, combining:

| Category        | Example Metrics                             |
| --------------- | ------------------------------------------- |
| ✅ Task Success | Workflow completion, correct actions/tools  |
| 🧠 Quality      | Relevance, fluency, coherence, tone         |
| 🔐 Safety       | Toxicity, hallucination detection, accuracy |
| ⚙️ Performance  | Latency, cost, memory footprint             |

### 💸 Cost Considerations

- `Evals cost money`, especially when using GPT-4 or Claude for judgment.
- But it's necessary to eval on the same model your users experience.
- Cost reduction strategies:

  - Use GPT-3.5 or Claude Instant when deep reasoning isn't required
  - Run in batch/offline mode instead of per-request evals
  - Use cached evals where applicable

- Small scale: a few dollars/month
- Large scale: possibly hundreds of thousands/month

### 🧪 Offline vs Online Evals

- Offline Evals:

  - Run locally or in CI pipelines (e.g. before merges/deploys)
  - Useful for rapid iteration and gating model updates

- Online Evals:

  - Run in production, on live traffic (sampled or triggered)
  - Detect drift, regression, or quality dips in real-time

### 💬 Human Feedback = Free Gold

- Thumbs up/down, star ratings, or user comments are invaluable signals.
- Use them to:

  - Detect regressions
  - Label new edge cases
  - Improve and validate automated metrics

- You can even set up alerting based on spikes in negative feedback.

### 🔁 Example Eval Pipeline

1. ✅ Unit tests for tool calls and basic logic
2. 📊 Automated evals for response structure and workflow success
3. 🧠 LLM-as-a-judge for subjective/semantic evaluation
4. 👀 Human review for edge cases and qualitative insight
5. 🔁 Continuous feedback loop to refine models and metrics

### 🔁 Summary: The Eval Lifecycle

1. Prototype a new AI feature
2. Deploy internally or to beta testers
3. Collect feedback and production data
4. Design evals + choose key metrics
5. Iterate until threshold quality is met
6. Gradually roll out to wider users
7. Repeat!

## 2.3 - 🛠️ Setting Up an Eval Framework

With "Scorer" from autoevals built in TypeScript, `it's possible to teach the evaluation structure rather than deep scientific metrics`. The example uses a custom deterministic scorer (not LLM-based) to verify tool call accuracy.

### 🧪 Eval Framework Components

1. Experiment:

   - A named evaluation run to track progress over time (e.g. "generate-image").
   - Helps compare performance across iterations.

2. Task:

   - An async function that executes the LLM or agent to produce output.
   - Could be any kind of async behavior, not just AI.

3. Dataset:

   - An array of input and expected pairs.
   - Can come from:

     - Synthetic generation
     - User logs
     - Manual curation

4. Scorers:

   - One or more metrics that evaluate outputs.
   - Can be simple functions (e.g. match check) or complex LLM-based metrics.

### ✅ Custom Scorer: ToolCallMatch

#### 🔍 Purpose

`Check if the LLM used the correct tool given the input`.

- If match → score = 1
- If mismatch → score = 0

#### 💡 Notes

- Focused on tool name match only.
- Does not check for:

  - Parameter accuracy
  - Incorrect tool calls (inverse check)

### 🧪 Code Example: ToolCallMatch

```ts
// scorer.ts
import type { Scorer } from "autoevals";

export const ToolCallMatch: Scorer<any, {}> = async ({
  input,
  output,
  expected,
}) => {
  const score =
    output.role === "assistant" && // Check role
    Array.isArray(output.toolcalls) && // toolcalls must be an array
    output.toolcalls.length === 1 && // Must contain exactly one tool call
    output.toolcalls[0].function?.name === expected.toolcalls[0].function?.name // Match tool name
      ? 1
      : 0;

  return {
    name: "ToolCallMatch",
    score,
  };
};
```

```ts
// reddit.eval.ts
import { runLLM } from "../../src/llm";
import { redditToolDefinition } from "../../src/tools/reddit";
import { runEval } from "../evalTools";
import { ToolCallMatch } from "../scorers";

const createToolCallMessage = (toolName: string) => ({
  role: "assistant",
  tool_calls: [
    {
      type: "function",
      function: {
        name: toolName,
      },
    },
  ],
});

runEval("reddit", {
  task: (input) =>
    runLLM({
      messages: [{ role: "user", content: input }],
      tools: [redditToolDefinition],
    }),
  data: [
    {
      input: "find me something interesting on reddit",
      expected: createToolCallMessage(redditToolDefinition.name),
    },
    {
      input: "hi",
      expected: createToolCallMessage(redditToolDefinition.name),
    },
  ],
  scorers: [ToolCallMatch],
});
```

> If you're running on Windows, you need to install dotenv-cli: `npm install -D dotenv-cli`, then, if `npx tsx evals/experiments/reddit.eval.ts` still doesn't work, try to run the project using: `npx dotenv -e .env -- tsx evals/experiments/reddit.eval.ts`

### 🗃️ Storing Evaluation Data

- Always store:

  - Input, Output, Expected, and Scores

- Used for:

  - Debugging
  - Historical comparisons
  - Visual dashboards

#### 🧰 Optional Tools

- Tools like [Braintrust](https://www.braintrustdata.com/) help:

  - Manage datasets
  - Visualize failures
  - Run evals online or offline
  - Label data with human experts

> ❗ You don’t need advanced tools until your dataset grows large or user data becomes too complex.

### 🧵 When to Use LLM-Based Metrics?

- LLM-based scores (like semantic similarity or entity match) introduce subjectivity.
- Best used for:

  - Response quality
  - Nuanced understanding

- But not ideal for beginners or simple tool-based agents.

#### Tips

- Focus on simple, deterministic scorers first.
- Store all eval-related data for visibility and improvement.
- Use named experiments to track progress.
- Expand with LLM-based scorers or external platforms as your system matures.

## 2.4 - Viewing Eval Results in a dashboard

To see the dashboard and see the results in the graph, `cd dashboard`, `npm install` and `npm run dev`.

> Remember to have the results.json file (it's necessary to run `npx tsx evals/experiments/reddit.eval.ts` / `npx dotenv -e .env -- tsx evals/experiments/reddit.eval.ts` in the project root).

![](https://i.imgur.com/A8NfDGE.png)

## 2.5 - Handling Evals on Subjective Inputs

### 🛠️ Manual Error Testing

- Deliberately sabotage tool descriptions (e.g. renaming dadJoke to weather) to:

  - Test model behavior
  - Understand tool selection weaknesses

- LLMs are surprisingly resilient to small misnaming, but tool name and description heavily influence selection.

### 🔁 The Improvement Loop:

1. Run eval → identify failure
2. Modify:

   - Tool name
   - Tool description
   - System prompt

3. Run again and compare results
4. Repeat until desired behavior is consistent

### 📝 Log Metadata

- Log tool name, tool definition, system prompt, and score per experiment
- Optional: track historical changes across `dadJoke.v1`, `v2`, etc.

### 💡 Prompt Engineering

LLMs don’t inherently “understand”, they predict what text (or action) should come next based on the inputs they receive. So, `the more clearly and intuitively your prompts and tool definitions match the user's intent, the more likely the model is to choose the correct tool`.

Let’s say your tool is called generateImage and it has this original description: "Generates an image based on a text prompt."

If a user says:
"Take a photo of a sunset", the LLM might fail to call generateImage because:

"Take a photo" ≠ "Generate an image" (in raw semantics)

The word "photo" doesn’t appear in the tool definition

Improved description: "Use this tool to generate an image or take a photo based on a description."

> Small changes in wording like adding can dramatically change tool selection behavior.

### 📊 Interpreting Eval Results

- Eval score depends on number of inputs:

  - 1 input = 0% or 100%
  - Multiple inputs = % average (e.g. 50%)

> Re-running the same eval multiple times gives a consistency check.

### 💬 Real-world Lessons:

- Users won’t phrase things predictably
- Need continuous iteration + data from real usage
- `Avoid trying to “train users” adapt LLM instead`

Your notes are already clear, well-structured, and technically accurate — great job! 🙌
Here are a few suggested improvements for clarity, flow, and polish, especially for professional or learning documentation:

## 2.6 - Eval Multiple Tools

- What happens when multiple tools are registered at once?
- Goal: `Test if the LLM still chooses the correct tool based on user input`.

### ⚙️ Setup:

- Provide all tools simultaneously to the agent.
- Create a dataset of inputs, one per expected tool.
- Use the same framework and custom scorer (e.g. `ToolCallMatch`).

```ts
// experiments/allTools.ts

import { runEval } from "../evalTools";
import { runLLM } from "../../src/llm";
import { ToolCallMatch } from "../scorers";
import { redditToolDefinition } from "../../src/tools/reddit";
import { generateImageToolDefinition } from "../../src/tools/generateImage";
import { dadJokeToolDefinition } from "../../src/tools/dadJoke";

const createToolCallMessage = (toolName: string) => ({
  role: "assistant",
  tool_calls: [
    {
      type: "function",
      function: { name: toolName },
    },
  ],
});

const allTools = [
  redditToolDefinition,
  generateImageToolDefinition,
  dadJokeToolDefinition,
];

runEval("allTools", {
  task: (input) =>
    runLLM({
      messages: [{ role: "user", content: input }],
      tools: allTools,
    }),
  data: [
    {
      input: "tell me something interesting from reddit",
      expected: createToolCallMessage(redditToolDefinition.name),
    },
    {
      input: "generate an image of a mountain landscape",
      expected: createToolCallMessage(generateImageToolDefinition.name),
    },
    {
      input: "tell me a dad joke",
      expected: createToolCallMessage(dadJokeToolDefinition.name),
    },
  ],
  scorers: [ToolCallMatch],
});
```

#### 🔍 Insight:

- Even well-named tools can fail when names or descriptions are ambiguous or too similar.
- This helps evaluate the LLM's tool selection logic under more realistic conditions.

### 🧰 AutoEvals: Built-in Scorers (Partial List)

| Metric           | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `battle`         | Compares the output of two systems to see which is better.                  |
| `closedQA`       | Tests if the LLM can answer from pretraining alone.                         |
| `factuality`     | Evaluates whether the output is factually correct.                          |
| `moderation`     | Flags unsafe or misaligned content.                                         |
| `SQL`            | Checks if the generated SQL is valid and executable.                        |
| `ragas` (Python) | Metrics for evaluating RAG systems, including retrieval and answer quality. |

> ⚠️ These advanced metrics are complex and require deeper understanding of retrieval pipelines, eval math, and LLM behavior.

## ✅ Summary

- Multi-tool evals simulate realistic production scenarios.
- Prompt engineering (tool names, descriptions) plays a major role in LLM tool selection.
- AutoEvals provides a growing set of metrics for varied use cases, from basic correctness to complex RAG evaluations.