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

## 3.2 - The RAG Pipeline

The RAG pipeline can be broken down into five main stages:

### Document Processing

- Input Data: Could be PDFs, books, emails, JSON, XML, video/audio transcripts, etc.
- Text Extraction: Convert non-text formats (e.g. audio, images, JSON) into clean text. Often uses OCR or transcription models.
- Chunking Strategy:

  - `Break large documents into semantically meaningful chunks`.
  - Common strategy: Token-limited chunks (e.g. 100 tokens) with overlap (e.g. 20 tokens) to preserve context.
  - Email or thread-based data may require custom logic (relational chunking).
  - Advanced: Contextual Retrieval (used by Claude) generates an LLM-based description of each chunk and stores it with the chunk.

### Embedding Generation

- `Converts chunks into dense vectors using an embedding model`:

![image](https://cdn.openai.com/embeddings/draft-20220124e/vectors-1.svg)

- These `vectors represent semantic meaning and enable math-based similarity search`:
`

![image](https://images.ctfassets.net/kftzwdyauwt9/6feca3be-2b6b-4a99-fc14ed78f1ee/3373feb41e1f9f49ba2c0f1ce3332b8b/Graphofsimilarembeddings.svg?w=3840&q=90)

- Each chunk becomes a list of numbers (e.g. [0.134, 0.902, ...]), typically 768 to 1536+ dimensions:

![image](https://i.imgur.com/waHQhkJ.png)

- Popular models: text-embedding-ada-002, BGE, INSTRUCTOR, etc.
- Tradeoffs: higher dimensions = more detail, but also more cost and slower search.

### Storage & Indexing (Vector Database)

- Store the vectors in a vector database like:

  - Pinecone
  - Weaviate
  - FAISS
  - Chroma

- Most support cosine similarity (or other algorithms) to measure closeness between query and documents.
- Many offer metadata filtering: search by tags, author, year, etc.
- Indexing can be:

  - Static (e.g. PDFs, knowledge base)
  - Dynamic (e.g. user chats, support tickets requires reindexing as new data arrives)

### Retrieval

When a user makes a query:

1. The query is also turned into an embedding.
2. The vector DB searches for closest semantic matches.
3. Retrieval may include:

   - Filtering
   - Re-ranking (to prioritize relevance over semantic similarity)
   - Summarization (to reduce token load)

4. Only the most relevant chunks are selected for augmentation.

> ⚠️ Pitfall: Vector DBs may return “semantically similar but irrelevant” results (e.g. a movie called "1989" when you search for a date range). Re-ranking is crucial.

### Augmentation & Generation

- `Retrieved chunks are injected into the prompt sent to the LLM`.
- The LLM uses this to generate a final answer.
- `You must monitor the total token usage`, feeding back too much data may:

  - Exceed the context window
  - Slow down response time
  - Increase cost

- Many systems also attach source citations during generation (e.g. Perplexity, Claude).

### Additional Use Cases for RAG

- Question Answering (e.g. "Ask this PDF")
- Fact-Checking: Compare generated output against retrieved facts
- Document Creation: Drafting content based on existing knowledge base
- Knowledge Synthesis: Merging info from multiple documents
- Personalization: Use org or user-specific data (e.g. CRM, support logs)

### ⚠️ Key Challenges

| Challenge                  | Description                                                          |
| -------------------------- | -------------------------------------------------------------------- |
| Chunking Strategy          | No one-size-fits-all. Must balance coherence and retrievability.     |
| Relevance vs. Diversity    | Too narrow = redundant, too broad = irrelevant.                      |
| Token Budgeting            | Injecting too many chunks risks exceeding limits.                    |
| Re-ranking & Summarization | Needed to refine retrieved results.                                  |
| Embedding Model Choice     | Impacts semantic resolution, speed, and cost.                        |
| Evaluation (Evals)         | Mandatory to assess retrieval, augmentation, and generation quality. |

### ✅ Best Practices

- 🔍 Start Small: Build naive RAG first (fixed chunks + overlap + cosine search).
- 🧪 Run Evals: Constantly test accuracy, relevance, hallucination rate.
- 🧹 Clean Your Data: Junk in = junk out.
- 🔁 Iterate on Chunking: Consider relational and contextual chunking if naive strategies underperform.
- ⚙️ Optimize Retrieval: Add re-ranking and filters as your system matures.
- 🤝 Consider Hybrid Approaches: Combine RAG with tools, agents, or few-shot examples when appropriate.
