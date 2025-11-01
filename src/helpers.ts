import type { FSMStateHandler, FSMTransition } from "./types";

/**
 * Creates a state handler with simple configuration
 * @template S - State type
 * @template E - Event type
 * @template C - Context type
 * @param execute - State execution function
 * @param transition - State transition function
 * @param options - Optional lifecycle hooks
 * @returns Configured state handler
 */
export function createState<S, E, C>(
  execute: FSMStateHandler<S, E, C>["execute"],
  transition: FSMTransition<S, E, C>,
  options: Omit<Partial<FSMStateHandler<S, E, C>>, "execute" | "transition"> = {}
): FSMStateHandler<S, E, C> {
  return {
    execute,
    transition,
    ...options,
  };
}

/**
 * Creates a state handler with automatic logging
 * @template S - State type
 * @template E - Event type
 * @template C - Context type
 * @param state - Current state identifier
 * @param execute - State execution function
 * @param transition - State transition function
 * @param logger - Logging callbacks for lifecycle events
 * @returns Configured state handler with logging
 */
export function createStateWithLogging<S, E, C>(
  state: S,
  execute: FSMStateHandler<S, E, C>["execute"],
  transition: FSMTransition<S, E, C>,
  logger: {
    onEnter?: (state: S, context: C) => void | Promise<void>;
    onExit?: (state: S, event: E, context: C) => void | Promise<void>;
    onError?: (state: S, error: Error, context: C) => void | Promise<void>;
  } = {}
): FSMStateHandler<S, E, C> {
  return {
    execute,
    transition,
    onEnter: async (ctx: C) => await logger.onEnter?.(state, ctx),
    onExit: async (event: E, ctx: C) => await logger.onExit?.(state, event, ctx),
    onError: async (error: Error, ctx: C) => await logger.onError?.(state, error, ctx),
  };
}

/**
 * Creates a transition that always goes to the specified state
 * @template S - State type
 * @template E - Event type
 * @template C - Context type
 * @param nextState - The state to transition to
 * @returns Transition function that always returns the specified state
 */
export function transitionTo<S, E, C>(nextState: S): FSMTransition<S, E, C> {
  return () => nextState;
}

/**
 * Creates a conditional transition based on predicates
 * @template S - State type
 * @template E - Event type
 * @template C - Context type
 * @param conditions - Array of condition objects with predicates and target states
 * @param defaultState - Default state if no conditions match (null to terminate)
 * @returns Transition function that evaluates conditions sequentially
 */
export function conditionalTransition<S, E, C>(
  conditions: Array<{
    when: (event: E, context: C) => boolean;
    then: S;
  }>,
  defaultState: S | null = null
): FSMTransition<S, E, C> {
  return (event, context) => {
    for (const condition of conditions) {
      if (condition.when(event, context)) {
        return condition.then;
      }
    }
    return defaultState;
  };
}

/**
 * Creates a transition based on event type
 * @template S - State type
 * @template E - Event type with 'type' property
 * @template C - Context type
 * @param eventMap - Mapping from event types to target states
 * @returns Transition function that routes based on event type
 */
export function eventBasedTransition<S, E extends { type: string }, C>(
  eventMap: Record<string, S>
): FSMTransition<S, E, C> {
  return (event) => eventMap[event.type] || null;
}

/**
 * Creates a transition that always terminates the FSM
 * @template S - State type
 * @template E - Event type
 * @template C - Context type
 * @returns Transition function that always returns null (terminates FSM)
 */
export function finalTransition<S, E, C>(): FSMTransition<S, E, C> {
  return () => null;
}
