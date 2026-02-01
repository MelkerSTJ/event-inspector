import { EventEmitter } from 'events';

// Create a singleton event bus for SSE streaming
class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    // Increase max listeners to handle multiple SSE connections
    this.setMaxListeners(100);
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
}

// Export singleton instance
export const bus = EventBus.getInstance();

// Also export the class for type usage
export { EventBus };