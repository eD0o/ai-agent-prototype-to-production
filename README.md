# 6 - Memory Management

## Chat History Management Strategies

Managing chat history in LLM applications presents a crucial `balance between maintaining context and managing token limits`. `Every token costs money and consumes context window space, yet losing important context can severely impact the quality of responses`.

### Core Strategies for Memory Management

#### 1. Message Window Sliding (Basic)

The simplest approach is maintaining a fixed window of recent messages. While straightforward, this method risks losing important context from earlier conversations.

```tsx
const manageHistory = (messages: Message[], windowSize: number): Message[] => {
  return messages.slice(-windowSize);
};
```

#### 2. Summarization-Based Management

A more sophisticated strategy. It:

- Keeps a window of recent messages
- Periodically summarizes older messages
- Adds the summary into the system prompt

```tsx
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

const manageHistoryWithSummary = async (
  messages: Message[],
  activeWindowSize: number,
  summaryThreshold: number
) => {
  if (messages.length < summaryThreshold) {
    return messages;
  }

  const recentMessages = messages.slice(-activeWindowSize);
  const messagesToSummarize = messages.slice(0, -activeWindowSize);
  const summary = await summarizeMessages(messagesToSummarize);

  return [
    { role: "system", content: `Previous conversation context: ${summary}` },
    ...recentMessages,
  ];
};
```

#### 3. Hierarchical Summarization

Organizes memory into levels:

- Immediate context (last few messages)

```ts
[
  { role: "user", content: "What's the weather like in Tokyo?" },
  { role: "assistant", content: "It's currently 27°C and sunny in Tokyo." },
];
```

- Recent summary (last N messages)

```ts
{ role: "system", content: "Summary: User asked about the weather in Paris, Tokyo, and New York. Assistant provided forecasts." }
```

- Global summary (long-term facts and themes)

```ts
{ role: "system", content: "Long-term summary: User often checks weather in major cities and prefers Celsius." }
```

#### 4. Topic-Based Segmentation

Groups message history by topic:

- Related messages are clustered
- Summaries are created per topic
- Context is activated dynamically based on the current topic

```json
{
  "topic": "travel",
  "messages": [
    "What's the best time to visit Japan?",
    "Can you suggest a 1-week itinerary?"
  ],
  "summary": "User is planning a 1-week trip to Japan and asked for the best travel period and itinerary suggestions."
}
```

```ts
if (userPrompt.includes("Japan trip")) {
  loadContextFrom("travel");
}
```

### Advanced Techniques

#### 1. Importance-Based Retention

- Assigns scores to messages based on importance
- Keeps high-importance content longer
- Discards or summarizes less relevant messages

Scoring factors:

- Key decisions or agreements
- User preferences or settings
- Critical information
- Explicit markers like "remember this"

```ts
function scoreMessage(message: Message): number {
  if (message.content.includes("remember this")) return 10;
  if (message.content.includes("let's agree")) return 9;
  return 1;
}
```

```ts
const retained = messages.filter((m) => scoreMessage(m) >= 5);
```

Example retained message:

```ts
{ role: "user", content: "Remember that I prefer dark mode and use metric units." }
```

#### 2. Compressed Context Storage (Less Common)

- Converts verbose exchanges into compact forms
- Uses keyword/entity extraction
- Stores structured data when possible

```json
{
  "entities": ["user=Bob", "location=Paris", "weather=rainy"]
}
```

```json
{
  "facts": [
    "User is Bob.",
    "He is currently in Paris.",
    "Rainy weather is expected."
  ]
}
```

#### 3. Dynamic Window Sizing

Adjusts memory window size based on:

- Token usage trends
- Conversation complexity
- User behavior
- Quality/performance metrics

```ts
function determineWindowSize(tokensUsed: number): number {
  if (tokensUsed > 3000) return 5;
  if (tokensUsed > 2000) return 10;
  return 20;
}
```

```ts
if (topic === "code review") {
  expandWindow(30); // Needs full thread
} else {
  shrinkWindow(10);
}
```

### Production Pattern Used by Scott Moss

Scott uses a mix of:

1. Window slicing
2. Summarization
3. Fact extraction (stored externally and re-added via system prompt)

> Users see the full chat, but the AI sees a curated slice with summaries + key facts only.

### Best Practices

#### Summarization Tips

1. Include:

- Key decisions and outcomes
- User preferences
- Constraints and goals
- Background context

2. Ensure clarity:

- Use concise language
- Avoid ambiguous references
- Add sequence markers or timestamps if needed

3. Suggested summary structure:

```tsx
interface ConversationSummary {
  mainPoints: string[];
  decisions: string[];
  userPreferences: Record<string, any>;
  context: string;
  timestamp: number;
}
```

#### Memory Storage Tiers

- Hot memory: Current working context
- Warm memory: Recent summaries
- Cold storage: Archived past interactions

#### Retrieval Strategies

- Lazy loading history on demand
- Preloading expected context
- Caching summaries

### Monitoring and Optimization

#### Metrics

- Context quality: relevance, accuracy, completeness
- Performance: token usage, summary time, retrieval speed
- UX: response coherence, memory continuity

#### Optimization Methods

- Prune redundant/repetitive data
- Compress structured info
- Score and filter context for relevance
- Batch summarization for performance

### Challenges and Edge Cases

#### Long Conversations

- Progressive summarization
- Archival strategies
- Maintain topic continuity

#### Topic Switching

- Detect and isolate topics
- Manage multi-context memory
- Adjust prompt content dynamically

#### Failures and Recovery

- Retry failed summaries
- Use backups or previous summaries
- Fallback to default context

### Future Directions

- Smarter summarization models
- Better topic/intent detection
- Adaptive memory compression
- Dynamic importance scoring

> Balancing cost, performance, and context quality is the key. Combine strategies based on your app’s needs.