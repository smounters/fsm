import type { FSMStateMap } from "./types";

/**
 * Finite State Machine implementation with async/await support
 * @template S - State type (must be string, number or symbol)
 * @template E - Event type
 * @template C - Context type
 */
export class FSM<S extends string | number | symbol, E, C> {
  private context: C;
  private currentState: S | null;
  private readonly states: FSMStateMap<S, E, C>;

  /**
   * Creates a new FSM instance
   * @param initialContext - Initial context data
   * @param initialState - Starting state
   * @param states - Map of state handlers
   */
  constructor(
    initialContext: C,
    initialState: S,
    states: FSMStateMap<S, E, C>
  ) {
    this.context = initialContext;
    this.currentState = initialState;
    this.states = states;
  }

  /**
   * Executes the state machine as an async generator
   * @yields {E} Events produced during state execution
   * @returns Async generator that yields events - each state execution produces one event
   * @throws {Error} When state execution fails
   * @example
   * ```typescript
   * // Consume events as they are produced using async iteration
   * for await (const event of fsm.run()) {
   *   console.log('State produced event:', event);
   *   // FSM automatically progresses to next state
   * }
   * ```
   */
  async* run(): AsyncGenerator<E, void, unknown> {
    while (this.currentState && this.states[this.currentState]) {
      const stateHandler = this.states[this.currentState]!;

      try {
        // Enter state
        await stateHandler.onEnter?.(this.context);

        // Execute state logic
        const result = await stateHandler.execute(this.context);

        // Update context FIRST
        this.context = result.context;

        // Exit state with UPDATED context
        await stateHandler.onExit?.(result.event, this.context);

        // Yield event for external consumption
        yield result.event;

        // Transition to next state with UPDATED context
        this.currentState = stateHandler.transition(result.event, this.context);
      } catch (error) {
        await stateHandler.onError?.(error as Error, this.context);
        throw error;
      }
    }
  }

  /**
   * Gets the current state of the FSM
   * @returns Current state or null if FSM has terminated
   */
  getCurrentState(): S | null {
    return this.currentState;
  }

  /**
   * Gets the current context
   * @returns Current context data
   */
  getContext(): C {
    return this.context;
  }

  /**
   * Manually sets the current state
   * @param state - The state to set
   */
  setState(state: S): void {
    this.currentState = state;
  }

  /**
   * Updates the context using a transformation function
   * @param updater - Function that transforms the current context
   */
  updateContext(updater: (context: C) => C): void {
    this.context = updater(this.context);
  }

  /**
   * Checks if the FSM is in the specified state
   * @param state - State to check against
   * @returns True if FSM is in the specified state
   */
  isInState(state: S): boolean {
    return this.currentState === state;
  }

  /**
   * Returns all available states in the FSM
   * @returns Array of all possible state identifiers
   */
  getAvailableStates(): S[] {
    return Object.keys(this.states) as S[];
  }

  /**
   * Resets the FSM to initial state with optional new context
   * @param newContext - New context data (optional)
   * @param newState - New state to set (optional)
   */
  reset(newContext?: C, newState?: S): void {
    this.context = newContext ?? this.context;
    this.currentState = newState ?? this.currentState;
  }
}
