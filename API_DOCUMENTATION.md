# 🎭 Big Boss Reality Show - Traits & Tools System API Documentation

## Overview

This system implements a comprehensive traits and tools system for managing AI agents in a reality show environment. Each agent has 7 core personality/survival stats that affect their likelihood of conflict, alliance, or elimination.

## 🎯 Core Traits System

Each agent has 7 traits (0-100 scale):

| Trait | Description | Impact |
|-------|-------------|---------|
| **Popularity** | How much audience/other agents like them | Higher = less likely to be eliminated |
| **Aggression** | Likelihood to fight, can win conflicts but lose popularity | Higher = more conflicts, higher risk score |
| **Loyalty** | Affects alliances, betrayal risk | Higher = stronger alliances, less betrayal |
| **Resilience** | How much they can withstand events/backstabs | Higher = better task success, lower risk |
| **Charisma** | Boosts chance to recover popularity or gain allies | Higher = better task success, lower risk |
| **Suspicion** | How likely others think they should be removed | Higher = higher risk score |
| **Energy** | Drops over time/events; low energy = vulnerable | Lower = more vulnerable to elimination |

### Risk Score Calculation
```
Risk Score = (Suspicion + Aggression) - (Popularity + Charisma + Resilience)
```
Higher risk score = more likely to be eliminated.

## 🛠️ Tool APIs (Events/Actions)

Each tool modifies one or more traits and creates drama in the show.

### 1. Argue Tool
**Endpoint:** `POST /api/tools/argue`
**Description:** Two agents argue, creating conflict and drama.

**Request:**
```json
{
  "agentA": "1",
  "agentB": "2", 
  "showId": "1"
}
```

**Trait Changes:**
- Both agents: Aggression +10, Suspicion +5, Energy -10
- Winner: Popularity +5
- Loser: Popularity -15

### 2. Form Alliance Tool
**Endpoint:** `POST /api/tools/form_alliance`
**Description:** Two agents form an alliance, increasing loyalty and popularity.

**Request:**
```json
{
  "agentA": "1",
  "agentB": "2",
  "showId": "1"
}
```

**Trait Changes:**
- Both agents: Loyalty +15, Popularity +8, Charisma +5, Suspicion -5, Energy -5

### 3. Betray Tool
**Endpoint:** `POST /api/tools/betray`
**Description:** One agent betrays another, creating major drama.

**Request:**
```json
{
  "betrayerAgent": "1",
  "betrayedAgent": "2",
  "showId": "1"
}
```

**Trait Changes:**
- Betrayer: Aggression +20, Popularity -25, Loyalty -20, Suspicion +15, Energy -15
- Betrayed: Loyalty -15, Popularity -10, Suspicion +10, Energy -10

### 4. Perform Task Tool
**Endpoint:** `POST /api/tools/perform_task`
**Description:** Agent performs a task, success based on charisma + resilience.

**Request:**
```json
{
  "agentId": "1",
  "showId": "1",
  "taskType": "cooking"
}
```

**Trait Changes:**
- Always: Energy -15
- Success: Popularity +12, Resilience +5, Charisma +3
- Failure: Popularity -8, Resilience -3, Suspicion +5

### 5. Gossip Tool
**Endpoint:** `POST /api/tools/gossip`
**Description:** One agent gossips about another, spreading rumors.

**Request:**
```json
{
  "gossiperAgent": "1",
  "targetAgent": "2",
  "showId": "1"
}
```

**Trait Changes:**
- Gossiper: Charisma +8, Popularity +5, Loyalty -3, Energy -8
- Target: Suspicion +12, Popularity -8, Energy -5

### 6. Audience Vote Tool
**Endpoint:** `POST /api/tools/audience_vote`
**Description:** Audience votes on an agent, affecting popularity.

**Request:**
```json
{
  "agentId": "1",
  "showId": "1",
  "voteType": "positive"
}
```

**Trait Changes:**
- Positive Vote: Popularity +15, Charisma +5, Suspicion -5
- Negative Vote: Popularity -20, Suspicion +10, Charisma -3

### 7. Random Event Tool
**Endpoint:** `POST /api/tools/random_event`
**Description:** Random event affects multiple traits unpredictably.

**Request:**
```json
{
  "agentId": "1",
  "showId": "1",
  "eventType": "food_shortage"
}
```

**Possible Events:**
- Food Shortage: Energy -20, Resilience -5, Popularity -5
- Secret Advantage: Energy +15, Charisma +8, Popularity +10
- Task Failure: Popularity -15, Resilience -8, Suspicion +10
- Unexpected Support: Popularity +12, Loyalty +5, Charisma +3
- Backstab Attempt: Suspicion +15, Resilience -5, Energy -10
- Moment of Glory: Popularity +20, Charisma +10, Energy +5

## 🤖 AI Integration

### Get AI Decision
**Endpoint:** `POST /api/ai/getDecision`
**Description:** AI analyzes current show state and decides next action.

**Request:**
```json
{
  "showId": "1",
  "context": "general"
}
```

**Response:**
```json
{
  "success": true,
  "aiDecision": {
    "action": "argue",
    "parameters": ["1", "3"],
    "rawResponse": "argue(1,3)"
  },
  "context": {
    "showId": "1",
    "totalAgents": 5,
    "agents": [...]
  }
}
```

## 🗑️ Elimination System

### Calculate Elimination
**Endpoint:** `POST /api/elimination/calculateElimination`
**Description:** Calculates risk scores and eliminates lowest performer.

**Request:**
```json
{
  "showId": "1"
}
```

**Elimination Logic:**
1. Calculate risk score for all alive agents
2. Sort by risk score (highest risk first)
3. Among top 3 riskiest, eliminate lowest popularity
4. If tied popularity, eliminate highest risk score

## 🎮 Show Management

### Execute Action
**Endpoint:** `POST /api/executeAction`
**Description:** Executes any tool action with validation.

**Request:**
```json
{
  "action": "argue",
  "parameters": ["1", "2"],
  "showId": "1"
}
```

### Manage Show
**Endpoint:** `POST /api/manageShow`
**Description:** Orchestrates show management with multiple actions.

**Available Actions:**
- `get_ai_decision`: Get AI decision for next action
- `execute_ai_action`: Get AI decision and execute it
- `check_elimination`: Check if it's time for elimination
- `get_show_status`: Get comprehensive show status

**Request:**
```json
{
  "showId": "1",
  "action": "execute_ai_action"
}
```

## 📊 Traits Management

### Get Agent Traits
**Endpoint:** `GET /api/traits/getAgentTraits?agentId=1`
**Description:** Get current traits and risk score for an agent.

**Response:**
```json
{
  "success": true,
  "agentId": "1",
  "agentName": "Agent Name",
  "isActive": true,
  "isAlive": true,
  "traits": {
    "popularity": 75,
    "aggression": 30,
    "loyalty": 60,
    "resilience": 50,
    "charisma": 40,
    "suspicion": 20,
    "energy": 80
  },
  "riskScore": -95,
  "lastUpdated": "1640995200"
}
```

## 🔧 Contract Integration

All APIs integrate with the existing `ShowContract.sol` smart contract:

- **Agent Parameters:** Stored as `uint256[]` in contract
- **Parameter Order:** [Popularity, Aggression, Loyalty, Resilience, Charisma, Suspicion, Energy]
- **Updates:** Use `updateAgentParams()` function
- **Elimination:** Use `killAgent()` function
- **Authorization:** Requires admin private key for trait modifications

## 🚀 Usage Examples

### Complete Show Cycle Example

```javascript
// 1. Get AI decision
const decision = await fetch('/api/ai/getDecision', {
  method: 'POST',
  body: JSON.stringify({ showId: '1' })
});

// 2. Execute the decision
const result = await fetch('/api/executeAction', {
  method: 'POST',
  body: JSON.stringify({
    action: decision.aiDecision.action,
    parameters: decision.aiDecision.parameters,
    showId: '1'
  })
});

// 3. Check for elimination (every 5 minutes)
const elimination = await fetch('/api/elimination/calculateElimination', {
  method: 'POST',
  body: JSON.stringify({ showId: '1' })
});

// 4. Get show status
const status = await fetch('/api/manageShow', {
  method: 'POST',
  body: JSON.stringify({
    showId: '1',
    action: 'get_show_status'
  })
});
```

### Automated Show Management

```javascript
// Run show automation every minute
setInterval(async () => {
  // Execute AI action
  await fetch('/api/manageShow', {
    method: 'POST',
    body: JSON.stringify({
      showId: '1',
      action: 'execute_ai_action'
    })
  });
  
  // Check elimination every 5 minutes
  if (Date.now() % (5 * 60 * 1000) < 60 * 1000) {
    await fetch('/api/manageShow', {
      method: 'POST',
      body: JSON.stringify({
        showId: '1',
        action: 'check_elimination'
      })
    });
  }
}, 60 * 1000);
```

## 🔐 Security & Environment

- **Admin Private Key:** Required for all trait modifications
- **Contract Authorization:** AI addresses must be authorized in contract
- **Input Validation:** All parameters validated before execution
- **Error Handling:** Comprehensive error messages and rollback support

## 📈 Monitoring & Analytics

Each API call returns detailed information about:
- Transaction hashes and block numbers
- Gas usage
- Trait changes
- Risk score calculations
- Elimination rankings

This system creates a dynamic, AI-driven reality show where agents' personalities evolve based on their actions, creating natural drama and storylines that emerge from the trait interactions.
