# 5 - Human in the Loop

Human in the Loop is a `safety and control pattern where a human must explicitly approve certain AI actions` before they are executed, `especially those that are high-risk, irreversible, or impact external systems`.

Why Use HITL?

- `Prevents irreversible or destructive actions` (e.g., deleting data).
- Adds legal and operational safety.
- Maintains human authority over AI decisions.
- Builds user trust and auditability into AI-driven systems.

## 5.1 - Usage

### Implementation Patterns

#### 🧭 Synchronous Approval (Blocking)

> Direct pause in execution until a human makes a decision.

Flow:

1. Agent requests a protected tool/action.
2. System pauses and displays approval UI.
3. Human approves/denies.
4. Execution continues based on response.

Use Case:
Short, critical decisions (e.g., generating an image or sending an email).

Pros:

- Simple and intuitive
- Immediate human oversight

Cons:

- Interaction blocked until action is approved

#### 🌀 Asynchronous Queue

> Actions requiring approval are added to a queue; execution continues.

Flow:

1. Agent queues the action.
2. System proceeds with unrelated tasks.
3. Human approves at their convenience.
4. Approved result is injected into agent context.

Use Case:
Long workflows, multi-user approvals, delayed decision making.

Pros:

- Non-blocking
- Scales well with volume or complexity

Cons:

- More complex to manage context reintegration

#### 🏛 Tiered Approval Systems

> Different levels of risk get different approval flows.

| Risk Level | Approval Type      | Example Action                    |
| ---------- | ------------------ | --------------------------------- |
| Low        | Auto-approved      | Writing to internal log           |
| Medium     | Single approver    | Modifying a document              |
| High       | Multiple approvers | Deleting records, triggering APIs |
| Critical   | Role-based         | Database wipe, user suspension    |

Key: Use roles, departments, or time sensitivity to escalate approvals as needed.

### Approval Design Principles

#### 🖼 Clear Context Presentation

Approvers need to understand:

- What the agent wants to do
- Why it wants to do it
- What data/context led to this
- What the consequences could be

#### ⚙️ Granular Control

Go beyond “yes/no”:

- Modify parameters
- Suggest alternatives
- Add notes or conditions
- Request additional context

#### 🔁 Feedback Loops

Feed human decisions back into the system:

- Record approval/denial reasons
- Detect patterns (e.g., always denying certain actions)
- Refine agent behavior and reduce false positives

### ⚠️ Common Challenges

#### ⏳ Performance Impact

- Adds latency
- Can block or break UX flow
- Must be transparent to the user

Mitigation:

- Show "waiting for approval" states
- Allow parallel interactions
- Set timeouts and fallback responses

#### 🧑‍💻 User Experience

Balance safety with usability:

- Keep messages clear and actionable
- Allow bulk approvals where safe
- Save user preferences when applicable

#### ❌ Error Handling

- Gracefully handle timeouts, denials, or canceled flows
- Maintain system state through pauses
- Avoid dropping agent context

### 🔐 Security & Best Practices

#### 🧰 Tool Classification

```ts
interface Tool {
  name: string;
  requiresApproval: boolean;
  riskLevel: "low" | "medium" | "high";
  approvalType: "sync" | "async" | "none";
  approverRoles?: string[];
}
```

#### 🔄 Approval State Tracking

```ts
interface ApprovalState {
  toolCallId: string;
  status: "pending" | "approved" | "denied";
  requestedAt: Date;
  respondedAt?: Date;
  approver?: string;
  context: object;
}
```

#### 🧾 Approval Logic Separation

```ts
const executeWithApproval = async (tool: Tool, params: any) => {
  if (tool.requiresApproval) {
    const approved = await getApproval({
      tool,
      params,
      context: getCurrentContext(),
    });

    if (!approved) {
      return {
        status: "denied",
        message: "Action not approved",
      };
    }
  }

  return executeTool(tool, params);
};
```

### 🔒 Security Considerations

#### 👤 Authentication

- Verify approver identity
- Store audit logs
- Enforce RBAC (Role-Based Access Control)
- Detect abnormal patterns

#### ✅ Authorization

- Define clear hierarchies
- Use time-bound access
- Consider geo/IP restrictions
- Support delegated approval

#### 📜 Auditing

Track and log:

- All requests
- Decisions & rationales
- Approver identities
- Execution results
