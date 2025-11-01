# Finite State Machine (FSM) Library

A lightweight, type-safe finite state machine implementation for TypeScript/JavaScript with full async/await support and built-in utilities.

## Features

- 🚀 **Full async/await support** - Handle asynchronous operations seamlessly
- 🛡️ **Type-safe** - Full TypeScript support with generics
- 🔧 **Flexible** - Sync and async state handlers
- 🎯 **Lifecycle hooks** - onEnter, onExit, onError handlers
- 📦 **Built-in helpers** - Pre-built transition and state creation utilities
- 🌳 **Tree-shakable** - Only include what you use
- 🔄 **Async Generator Pattern** - Events produced via `yield` for easy consumption
- 🧪 **Well tested** - Reliable and production-ready


## Installation

```bash
npm install @smounters/fsm

# or
yarn add @smounters/fsm

# or
pnpm add @smounters/fsm
```

## Quick Start

```typescript
import { FSM, createState, transitionTo } from '@smounters/fsm';

// Define your types
type States = 'idle' | 'loading' | 'success' | 'error';
type Events = { type: 'fetch' } | { type: 'success'; data: string } | { type: 'error' };
type Context = { data?: string; error?: string };

// Create state machine
const fsm = new FSM<States, Events, Context>(
  { data: undefined, error: undefined },
  'idle',
  {
    idle: createState(
      (ctx) => ({ event: { type: 'fetch' }, context: ctx }),
      transitionTo('loading')
    ),

    loading: createState(
      async (ctx) => {
        try {
          const data = await api.fetchData();
          return { event: { type: 'success', data }, context: { ...ctx, data } };
        } catch (error) {
          return { event: { type: 'error' }, context: { ...ctx, error: error.message } };
        }
      },
      (event, context) => {
        if (event.type === 'success') return 'success';
        if (event.type === 'error') return 'error';
        return null;
      }
    )
  }
);

// Run using async iteration - each state yields an event
for await (const event of fsm.run()) {
  console.log('Event:', event);
  console.log('Current state:', fsm.getCurrentState());
}
```

## Core Concepts

### Execution Model
The FSM uses async generators - each state execution yields an event that can be consumed using for await...of:
```typescript
// Events are produced as the FSM progresses through states
for await (const event of fsm.run()) {
  // Handle each event as it's yielded
  console.log('New event:', event);
}
```

### State (S)
The current mode/status of your system. Must be a string, number, or symbol.

### Event (E)
Data produced when a state executes, used to trigger transitions.

### Context (C)
Shared data that persists across state transitions.

### State Handler
Object containing execute logic and transition rules for a state:

```typescript
interface FSMStateHandler<S, E, C> {
  execute: (context: C) => { event: E; context: C } | Promise<{ event: E; context: C }>;
  onEnter?: (context: C) => void | Promise<void>;
  onExit?: (event: E, context: C) => void | Promise<void>;
  onError?: (error: Error, context: C) => void | Promise<void>;
  transition: (event: E, context: C) => S | null;
}
```

## Built-in Helpers

### State Creation
```typescript
import { createState, createStateWithLogging } from "@smounters/fsm";

// Basic state
const state = createState(
  (ctx) => ({ event: { type: "next" }, context: ctx }),
  transitionTo("nextState")
);

// State with logging
const loggedState = createStateWithLogging(
  "loading",
  async (ctx) => ({ event: { type: "loaded" }, context: ctx }),
  transitionTo("success"),
  {
    onEnter: (state, ctx) => console.log(`Entering ${state}`),
    onExit: (state, event, ctx) => console.log(`Exiting ${state} with ${event.type}`),
  }
);
```

### Transition Helpers
```typescript
import {
  transitionTo,
  conditionalTransition,
  eventBasedTransition,
  finalTransition
} from '@smounters/fsm';

// Always go to specific state
const toSuccess = transitionTo('success');

// Conditional transitions - use with specific state types  
const conditional = conditionalTransition([
  { when: (event, ctx) => event.type === 'success', then: 'success' },
  { when: (event, ctx) => event.type === 'error', then: 'error' }
], 'idle' as States | null); // Type assertion for TypeScript

// Event-based routing
const eventBased = eventBasedTransition({
  'SUCCESS': 'success',
  'ERROR': 'error'
});

// Terminate FSM
const terminate = finalTransition();
```

## API Reference

### FSM Class
```typescript
class FSM<S extends string | number | symbol, E, C> {
  constructor(initialContext: C, initialState: S, states: FSMStateMap<S, E, C>);
  
  // Main execution
  async *run(): AsyncGenerator<E, void, unknown>;
  
  // State management
  getCurrentState(): S | null;
  setState(state: S): void;
  isInState(state: S): boolean;
  getAvailableStates(): S[];
  
  // Context management
  getContext(): C;
  updateContext(updater: (context: C) => C): void;
  reset(newContext?: C, newState?: S): void;
}
```

## Real-world Examples

### API Request Flow
```typescript
type ApiStates = 'idle' | 'fetching' | 'success' | 'error';
type ApiEvents = { type: 'start' } | { type: 'success'; data: any } | { type: 'error'; message: string };
type ApiContext = { data?: any; error?: string; retries: number };

const apiFSM = new FSM<ApiStates, ApiEvents, ApiContext>(
  { retries: 0 },
  'idle',
  {
    idle: createState(
      (ctx) => ({ event: { type: 'start' }, context: ctx }),
      transitionTo('fetching')
    ),
    fetching: createState(
      async (ctx) => {
        try {
          const data = await fetch('/api/data').then(r => r.json());
          return { event: { type: 'success', data }, context: { ...ctx, data } };
        } catch (error) {
          return {
            event: { type: 'error', message: error.message },
            context: { ...ctx, error: error.message, retries: ctx.retries + 1 }
          };
        }
      },
      conditionalTransition([
        { when: (event) => event.type === 'success', then: 'success' },
        { when: (event) => event.type === 'error', then: 'error' }
      ])
    ),
    success: createState(
      (ctx) => ({ event: { type: 'complete' }, context: ctx }),
      finalTransition()
    ),
    error: createState(
      (ctx) => ({ event: { type: 'failed' }, context: ctx }),
      finalTransition()
    )
  }
);

// Consume API events as they are yielded
for await (const event of apiFSM.run()) {
  switch (event.type) {
    case 'success':
      displayData(event.data);
      break;
    case 'error':
      showError(event.message);
      break;
  }
}
```

### UI State Management
```typescript
type UIStates = "closed" | "opening" | "open" | "closing";
type UIEvents = { type: "open" } | { type: "opened" } | { type: "close" } | { type: "closed" };
type UIContext = { isAnimating: boolean; content: string };

const uiFSM = new FSM<UIStates, UIEvents, UIContext>(
  { isAnimating: false, content: '' },
  "closed",
  {
    closed: createState(
      (ctx) => ({ event: { type: "open" }, context: ctx }),
      eventBasedTransition({
        "open": "opening"
      })
    ),
    
    opening: createState(
      async (ctx) => {
        await animateOpen();
        return { event: { type: "opened" }, context: { ...ctx, isAnimating: true } };
      },
      transitionTo("open")
    ),
    
    open: createState(
      (ctx) => ({ event: { type: "close" }, context: ctx }),
      eventBasedTransition({
        "close": "closing"
      })
    ),
    
    closing: createState(
      async (ctx) => {
        await animateClose();
        return { event: { type: "closed" }, context: { ...ctx, isAnimating: false } };
      },
      transitionTo("closed")
    ),
  }
);
```

## Best Practices
* Keep states focused - Each state should have a single responsibility
* Use TypeScript - Leverage the full type safety
* Handle errors - Always implement onError handlers for robustness
* Test transitions - Verify all possible state paths
* Use built-in helpers - They reduce boilerplate and prevent errors

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
MIT
