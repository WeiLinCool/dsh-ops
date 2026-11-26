/**
 * Read the JSON summary a migrated PTC program inspected.
 *
 * Host 0.2.3 stopped returning a program's completion value through `run_code`: only
 * `inspect(...values)` output is rendered, as text in `value.logs`. DSH suites that need
 * a structured summary therefore end with `inspect(JSON.stringify(summary))` and read it
 * back here, which keeps the assertion on a typed value instead of rendered prose.
 *
 * @param result - one `run_code` tool result.
 * @returns the parsed summary, or undefined when the program inspected nothing.
 */
export function inspected(result) {
  const log = result?.value?.logs?.at(-1)
  if (typeof log !== 'string' || log.trim() === '') return undefined
  return JSON.parse(log)
}

/**
 * Put one `return`-style fixture program back on the host's output path.
 *
 * The suites predate 0.2.3 and end a program with `return summary`. A top-level return is
 * now a SyntaxError, so such a program runs in an async closure instead and its return
 * value is inspected as JSON. Programs that already report through `inspect` pass through
 * unchanged; a closure keeps one program's declarations to itself, which is what these
 * one-shot fixtures expect.
 *
 * @param body - the program text.
 * @returns the program text the host can run.
 */
export function programForHost(body) {
  if (!/\breturn\b/u.test(body) || body.includes('inspect(')) return body
  return `inspect(JSON.stringify(await (async () => {\n${body}\n})()))`
}
