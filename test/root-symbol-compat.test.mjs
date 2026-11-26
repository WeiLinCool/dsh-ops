/**
 * Cordis v0.2.2-rc.2 moved the root context from `ctx.root` to the symbol key
 * `Symbol.for('cordis.root')`. Reading the old string property inside a plugin
 * throws `cannot get property "root" without inject`, which aborted the whole
 * dsh-ops row during composition-root startup. Every module that keys shared
 * state by root must use the symbol instead.
 */
import { rootOf } from '../lib/adapter/dsh/root.js'
import { joinMode, enabledModes } from '../lib/presets/registry.js'
import { observeSelection, pendingSelection } from '../lib/discovery/observations.js'
import { assert, test, report } from './lib/harness.mjs'

const ROOT = Symbol.for('cordis.root')

/**
 * A stand-in for the rc3 context proxy: symbol reads pass through to the
 * target, while the string `root` read is refused exactly as cordis refuses it
 * from inside a plugin fiber.
 */
function symbolRootContext(root) {
  const target = { [ROOT]: root, emit() {} }
  return new Proxy(target, {
    get(object, property, receiver) {
      if (property === 'root') throw new Error('cannot get property "root" without inject')
      return Reflect.get(object, property, receiver)
    },
  })
}

test('rootOf reads the symbol root without touching the refused string property', () => {
  const shared = {}
  const ctx = symbolRootContext(shared)
  // The fixture must reject the legacy read, or a revert of the helper would go unnoticed.
  assert.throws(() => ctx.root, /without inject/)
  assert.equal(rootOf(ctx), shared)
})

test('rootOf still resolves the legacy string root and a plain context', () => {
  const legacy = {}
  assert.equal(rootOf({ root: legacy }), legacy)
  const plain = {}
  assert.equal(rootOf(plain), plain)
})

test('symbol-root children share preset mode state through the rc3 startup path', () => {
  const shared = {}
  const writer = symbolRootContext(shared), reader = symbolRootContext(shared)
  const config = { batchingGuidance: true }
  const leave = joinMode(writer, 'shell', config)
  assert.equal(enabledModes(reader).get('shell'), config)
  leave()
  assert.equal(enabledModes(reader).size, 0)
})

test('symbol-root children share discovery observations', () => {
  const shared = {}
  const writer = symbolRootContext(shared), reader = symbolRootContext(shared)
  const agent = { id: 'agents/main' }, pending = new Set(['ops_read'])
  const stop = observeSelection(writer, agent, pending)
  assert.equal(pendingSelection(reader, agent), pending)
  stop()
  assert.equal(pendingSelection(reader, agent), undefined)
})

report('root-symbol-compat')
