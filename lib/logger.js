import { Logger } from "beaver-logger";

/**
 * Module for beaver logger setup
 */

export default Logger({

  // URI to post logs to
  uri: 'http://edutab.test.iminds.be:8989/api/log',

  // State name to post logs under
  initial_state_name: 'init',

  // Interval at which to automatically flush logs to the server
  flushInterval: 10 * 60 * 1000,

  // Interval at which to debounce $logger.flush calls
  debounceInterval: 10,

  // Limit on number of logs before auto-flush happens
  sizeLimit: 300,

  // Supress `console.log`s when `true`
  // Recommended for production usage
  silent: false,

  // Enable or disable heartbeats, which run on an interval
  heartbeat: true,

  // Heartbeat log interval
  heartbeatInterval: 5000,

  // Maximum number of sequential heartbeat logs
  heartbeatMaxThreshold: 50,

  // Monitors for event loop delays and triggers a toobusy event
  heartbeatTooBusy: false,

  // Event loop delay which triggers a toobusy event
  heartbeatTooBusyThreshold: 10000,

  // Log levels which trigger an auto-flush to the server
  autoLog: ['warn', 'error'],

  // Log window.onunload and window.beforeUnload events?
  logUnload: true,

  // Log unload synchronously, to guarantee the log gets through?
  logUnloadSync: false,

  // Log performance stats from the browser automatically?
  logPerformance: true
});
