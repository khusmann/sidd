import type * as danfojs from "danfojs";

declare global {
  const dfd: typeof danfojs;
}

// Workaround from: https://github.com/javascriptdata/danfojs/discussions/525
