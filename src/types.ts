/**
 * Transition function that determines next state based on event and context
 * @template S - State type
 * @template E - Event type
 * @template C - Context type
 * @param event - The event that triggered the transition
 * @param context - Current context data
 * @returns Next state or null to terminate the FSM
 */
export type FSMTransition<S, E, C> = (
  event: E,
  context: C
) => S | null;

/**
 * Result of state execution
 * @template E - Event type
 * @template C - Context type
 */
export type FSMStateResult<E, C> = {
  /** Event produced during state execution */
  event: E;
  /** Updated context after state execution */
  context: C;
};

/**
 * Handler for a specific state with lifecycle hooks
 * @template S - State type
 * @template E - Event type
 * @template C - Context type
 */
export interface FSMStateHandler<S, E, C> {
  /**
   * Main execution logic for the state
   * @param context - Current context data
   * @returns State execution result, either sync or async
   */
  execute: (context: C) => FSMStateResult<E, C> | Promise<FSMStateResult<E, C>>;

  /**
   * Called when entering the state
   * @param context - Current context data
   */
  onEnter?: (context: C) => void | Promise<void>;

  /**
   * Called when exiting the state
   * @param event - Event that triggered the exit
   * @param context - Current context data
   */
  onExit?: (event: E, context: C) => void | Promise<void>;

  /**
   * Called when execution fails
   * @param error - Error that occurred
   * @param context - Current context data
   */
  onError?: (error: Error, context: C) => void | Promise<void>;

  /**
   * Determines next state transition
   * @param event - Event produced by state execution
   * @param context - Current context data
   * @returns Next state or null to terminate
   */
  transition: FSMTransition<S, E, C>;
}

/**
 * Map of all possible states in the FSM
 * @template S - State type (must be string, number or symbol)
 * @template E - Event type
 * @template C - Context type
 */
export type FSMStateMap<S extends string | number | symbol, E, C> = {
  [state in S]?: FSMStateHandler<S, E, C>;
};
