# 3 - Retrieval Augmented Generation

## 3.1 - RAG Overview

RAG (Retrieval Augmented Generation) is a `method that enhances a language model’s ability to respond accurately by retrieving relevant external information at runtime` instead of relying solely on what the model was trained on.

### 🧠 Why RAG Exists

- LLMs can't know recent events (e.g., yesterday’s NBA game) unless:

  - They're retrained (which is costly and infrequent).
  - They're fine-tuned (smaller updates, but still expensive and not scalable daily).

- System prompts can add knowledge temporarily, but:

  - They’re limited by the context window size.
  - More tokens = slower inference and higher cost.
  - `LLMs often forget information in the middle of long prompts`, they prioritize the beginning and end.

### ⚙️ What RAG Solves

RAG:

- `Retrieves only the necessary data to answer a question`.
- Injects it into the prompt dynamically.
- Reduces:

  - Token usage
  - Latency
  - Forgetfulness
  - Costs

> Think of RAG as giving your AI a `smart search engine + short-term memory that feeds it only what's needed`, nothing more.

### 🔥 Why RAG is Hard

- Doing RAG well is very challenging:

  - You need robust document retrieval, chunking, indexing, and scoring.
  - Must ensure relevant context is pulled every time.

- Researchers and companies are heavily focused on improving Evals and RAG workflows and frameworks.
