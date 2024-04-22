/**
 * A basic pub-sub mechanism for sibling component communication
 *
 * @module c/pubsub
 */

const events = {};

/**
 * Register a callback for an event
 * @param {string} eventName - Name of the event to listen for.
 * @param {Function} callback - Function to invoke when the event is fired.
 * @param {object} thisArg - The value to be passed as the this parameter to the callback function is bound.
 */
const registerListener = (eventName, callback, thisArg) => {
  // Initialize the event's object if it doesn't exist
  if (!events[eventName]) {
    events[eventName] = [];
  }

  // Add the callback and `this` argument to the event's object
  events[eventName].push({ callback, thisArg });
};

/**
 * Unregister a callback for an event
 * @param {string} eventName - Name of the event to remove from.
 * @param {Function} callback - Function to remove.
 * @param {object} thisArg - The value that was passed as the this parameter to the callback function is bound.
 */
const unregisterListener = (eventName, callback, thisArg) => {
  // Check if the event exists
  if (events[eventName]) {
    // Filter out the callback and `this` argument from the event's object
    events[eventName] = events[eventName].filter(
      (listener) =>
        listener.callback !== callback || listener.thisArg !== thisArg
    );
  }
};

/**
 * Unregister all callbacks for an event
 * @param {object} thisArg - The value that was passed as the this parameter to the callback function is bound.
 */
const unregisterAllListeners = (thisArg) => {
  // Check all events for `thisArg`
  Object.values(events).forEach((eventListeners) => {
    // Filter out callbacks for `thisArg`
    eventListeners.filter((listener) => listener.thisArg !== thisArg);
  });
};

/**
 * Fire an event
 * @param {object} pageRef - Reference to the current page.
 * @param {string} eventName - Name of the event to fire.
 * @param {*} payload - Optional payload to pass to the callback functions.
 */
const fireEvent = (pageRef, eventName, payload) => {
  // Check if the event exists
  if (events[eventName]) {
    // Fire the event by invoking the registered callbacks
    events[eventName].forEach((listener) => {
      try {
        listener.callback.call(listener.thisArg, payload);
      } catch (error) {
        // Fail silently
      }
    });
  }
};

export {
  registerListener,
  unregisterListener,
  unregisterAllListeners,
  fireEvent
};
