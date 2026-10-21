/** Simulates network latency for mock services. */
export function delay(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Random-ish latency in a range so the prototype feels less mechanical. */
export function networkDelay(min = 350, max = 750): Promise<void> {
  return delay(min + Math.round(Math.random() * (max - min)))
}
