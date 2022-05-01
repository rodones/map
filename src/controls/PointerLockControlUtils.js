export function withThrottled(fn, ms = 250) {
  let lastExecution = 0;

  return (...args) => {
    const now = Date.now();

    if (now >= lastExecution + ms) {
      lastExecution = now;
      return fn(args);
    }
  };
}

export function withSkip(fn, skipFn) {
  let previousArgs = [];

  return (...args) => {
    const shouldSkip = skipFn(previousArgs, args);

    if (!shouldSkip) {
      previousArgs = args;

      return fn(...args);
    }
  };
}
