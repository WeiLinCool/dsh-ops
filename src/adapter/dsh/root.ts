/**
 * Cross-generation Cordis root resolution.
 *
 * v0.2.2-rc.2 moved the root context from the `root` property to the global
 * symbol `Symbol.for('cordis.root')` (`Context.root`). Inside a plugin, reading
 * `ctx.root` now throws `cannot get property "root" without inject`. Symbol
 * reads are exempt from that proxy guard, so this helper is safe in both the
 * symbol-root runtime and the older string-root runtime used by the tests.
 */
const ROOT = Symbol.for('cordis.root')

/**
 * The shared root context behind `ctx`, whatever Cordis generation created it.
 * The root is the same kind of context as its child, so the caller's type is
 * preserved. A context with neither key is its own root.
 */
export function rootOf<T extends object>(ctx: T): T {
  const symbolic: unknown = Reflect.get(ctx, ROOT)
  if (symbolic !== undefined && symbolic !== null) return symbolic as T
  try {
    const legacy: unknown = Reflect.get(ctx, 'root')
    if (legacy !== undefined && legacy !== null) return legacy as T
  } catch { /* a symbol-root proxy refuses the legacy string property */ }
  return ctx
}
