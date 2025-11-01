/**
 * # Finite State Machine (FSM) Library
 *
 * A lightweight, type-safe finite state machine implementation for TypeScript/JavaScript
 * with full async/await support and built-in utilities.
 *
 * ## Execution Model
 *
 * The FSM uses **async generators** - each state execution `yields` an event that can be
 * consumed using `for await...of`:
 *
 * ```typescript
 * // Events are produced as the FSM progresses through states
 * for await (const event of fsm.run()) {
 *   console.log('New event:', event);
 *   console.log('Current state:', fsm.getCurrentState());
 * }
 * ```
 *
 * ## Features
 *
 * - 🚀 Full async/await support
 * - 🛡️ Type-safe with generics
 * - 🔧 Sync and async state handlers
 * - 🎯 Lifecycle hooks (onEnter, onExit, onError)
 * - 📦 Built-in transition helpers
 * - 🌳 Tree-shakable
 * - 🔄 Async generator pattern (yield)
 *
 * ## Quick Start
 *
 * ```typescript
 * import { FSM, createState, transitionTo } from '@smounters/fsm';
 *
 * // Define your types
 * type States = 'idle' | 'loading' | 'success' | 'error';
 * type Events = { type: 'fetch' } | { type: 'success'; data: string } | { type: 'error' };
 * type Context = { data?: string; error?: string };
 *
 * // Create FSM instance
 * const fsm = new FSM<States, Events, Context>(
 *   { data: undefined, error: undefined },
 *   'idle',
 *   {
 *     idle: createState(
 *       (ctx) => ({ event: { type: 'fetch' }, context: ctx }),
 *       transitionTo('loading')
 *     ),
 *     loading: createState(
 *       async (ctx) => {
 *         const data = await fetchData();
 *         return { event: { type: 'success', data }, context: { ...ctx, data } };
 *       },
 *       transitionTo('success')
 *     ),
 *   }
 * );
 *
 * // Run the state machine
 * for await (const event of fsm.run()) {
 *   console.log('Event:', event);
 * }
 * ```
 *
 * ## Core Concepts
 *
 * - **State (S)**: The current mode/status of your system (must be string, number, or symbol)
 * - **Event (E)**: Data produced when a state executes, triggering transitions
 * - **Context (C)**: Shared data that persists across state transitions
 * - **State Handler**: Object containing execute logic and transition rules for a state
 * - **Transition**: Function that determines the next state based on event and context
 *
 * ## Lifecycle
 *
 * For each state, the FSM executes:
 * 1. `onEnter` (optional) - When entering the state
 * 2. `execute` (required) - Main state logic, produces event and updates context
 * 3. `onExit` (optional) - When exiting the state
 * 4. `transition` (required) - Determines next state based on event and context
 *
 * If any step fails, `onError` is called.
 *
 * @packageDocumentation
 */

// Type exports
export type {
  FSMStateHandler,
  FSMStateMap,
  FSMTransition,
  FSMStateResult
} from "./types";

// Helper function exports
export {
  createState,
  createStateWithLogging,
  transitionTo,
  conditionalTransition,
  eventBasedTransition,
  finalTransition
} from "./helpers";

// Main FSM class export
export { FSM } from "./fsm";
