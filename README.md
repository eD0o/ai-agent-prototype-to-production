# 1 - Large Language Models (LLMs) & AI Agents Review

LLMs are `neural networks trained on vast text data to predict the next word/token in a sequence`. They rely on transformer architecture, which uses attention mechanisms to understand context.

Core Functionality:

| Feature               | Description                                             |
| --------------------- | ------------------------------------------------------- |
| Text Prediction       | Predicts next word/token based on context               |
| Transformer Attention | Considers entire input (not just previous word)         |
| Pretrained Knowledge  | Has a knowledge cutoff and doesn't learn after training |
| No Memory             | Each input is processed independently                   |

Example:

```ts
// Prompt to an LLM
"Translate 'cat' to Spanish";
// Output
"gato";
```

## 🔧 LLM Applications & Limitations

### ✅ Common Use Cases

| Use Case          | Description                             |
| ----------------- | --------------------------------------- |
| Content Writing   | Blog posts, summaries, creative writing |
| Coding Assistance | Generate, fix, and explain code         |
| Research Support  | Summarize papers, extract insights      |
| Translation       | Multilingual communication              |

### ⚠️ Key Limitations

| Limitation       | Explanation                                 |
| ---------------- | ------------------------------------------- |
| Hallucination    | Makes up plausible-sounding but false info  |
| Knowledge Cutoff | Can't know about events after training date |
| No Memory        | No persistence across sessions              |
| Context Window   | Can only process limited token count        |
| Compute Cost     | High inference cost limits real-time use    |

## 🤖 What are AI Agents?

AI Agents are `systems that extend LLMs by giving them memory, tools, and the ability to act. They operate in loops, take actions, and maintain context` across interactions.

### 🧩 Agent Structure

| Component     | Role                                     |
| ------------- | ---------------------------------------- |
| LLM Core      | Brain that interprets and generates text |
| Memory        | Keeps track of previous interactions     |
| Tools         | APIs, functions, or services it can use  |
| Looping Logic | Repeats reasoning until task is done     |

### 🌀 Single Turn vs Multi-Turn

| Type               | Description                           | Example                                                                |
| ------------------ | ------------------------------------- | ---------------------------------------------------------------------- |
| Single Turn        | One prompt → one response             | "Write a poem"                                                         |
| Multi-Turn (Agent) | Maintains state across multiple steps | Research assistant planning a trip, booking tickets, sending reminders |

Agent Flow Example:

```ts
// Input: "Book a flight to NYC and send confirmation to email"
Agent → Search flights → Book ticket via API → Send email via SMTP → Done
```

## 🛠️ Agent Use Cases

| Use Case         | What It Does                                        |
| ---------------- | --------------------------------------------------- |
| Customer Service | Accesses order DB, updates info, issues refunds     |
| Research Agent   | Keeps session history, compiles reports             |
| Coding Assistant | Uses tools like linters, test runners, doc fetchers |

## 🏭 Challenges in Production

| Challenge       | Description                                   |
| --------------- | --------------------------------------------- |
| Tool Misuse     | Picks wrong tools, enters infinite loops      |
| Integration     | Needs APIs, error handling, auth, etc.        |
| Latency         | Multiple steps = slower response time         |
| Cost            | Tool calls and long sessions increase compute |
| Human Oversight | Requires fallback, monitoring, auditing       |

## 🚀 Takeaway: LLM vs Agent

| Feature    | LLM                   | Agent                               |
| ---------- | --------------------- | ----------------------------------- |
| Memory     | ❌ Stateless          | ✅ Stateful                         |
| Tool Usage | ❌ None               | ✅ API access, tools                |
| Autonomy   | ❌ One-shot           | ✅ Multi-step planning              |
| Use Cases  | Text completion, help | Automated tasks, real-world actions |

### 🧠 Bonus Tip from Scott Moss:

> “An agent is just an LLM on a loop with tools and memory. It keeps thinking, asking, and acting until the job is done.”
