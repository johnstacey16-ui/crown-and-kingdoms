import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/network-sync.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const multiplayer = readFileSync(new URL('../multiplayer.js', import.meta.url), 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context, { filename: 'js/network-sync.js' });
const sync = context.window.CK_SIM_SYNC;
const cp = (frame, economy = 100) => ({ frame, hash: sync.checksum({ frame, economy }) });

test('host checkpoint arriving before guest reaches the same tick is matched later', () => {
  const tracker = sync.createCheckpointTracker({ cadence: 300, capacity: 4 });
  assert.equal(tracker.recordRemote(cp(300)).status, 'waiting');
  assert.equal(tracker.stats().compared, 0);
  assert.equal(tracker.recordLocal(cp(300)).status, 'match');
  assert.equal(tracker.stats().compared, 1);
  assert.equal(tracker.stats().mismatches, 0);
});

test('late and out-of-order host packets match retained exact local frames', () => {
  const tracker = sync.createCheckpointTracker({ cadence: 300, capacity: 4 });
  assert.equal(tracker.recordLocal(cp(300)).status, 'waiting');
  assert.equal(tracker.recordLocal(cp(600)).status, 'waiting');
  assert.equal(tracker.recordRemote(cp(600)).status, 'match');
  assert.equal(tracker.recordRemote(cp(300)).status, 'match');
  assert.equal(tracker.stats().compared, 2);
  assert.equal(tracker.stats().last.frame, 300);
});

test('different frame numbers never count as a match or a desync', () => {
  const tracker = sync.createCheckpointTracker({ cadence: 300, capacity: 4 });
  assert.equal(tracker.recordLocal(cp(300)).status, 'waiting');
  assert.equal(tracker.recordRemote(cp(600)).status, 'waiting');
  assert.equal(tracker.stats().compared, 0);
  assert.equal(tracker.recordLocal(cp(600)).status, 'match');
  assert.equal(tracker.recordRemote(cp(300)).status, 'match');
  assert.equal(tracker.stats().mismatches, 0);
});

test('real same-frame economy divergence is reported without mutating worlds', () => {
  const tracker = sync.createCheckpointTracker({ cadence: 300, capacity: 4 });
  const local = cp(300, 125);
  const remote = cp(300, 126);
  assert.equal(tracker.recordLocal(local).status, 'waiting');
  assert.equal(tracker.recordRemote(remote).status, 'desync');
  assert.equal(tracker.stats().mismatches, 1);
  assert.equal(tracker.stats().last.frame, 300);
  assert.equal(local.hash, cp(300, 125).hash);
  assert.equal(remote.hash, cp(300, 126).hash);
});

test('duplicate, conflicting, invalid and old packets fail closed with bounded history', () => {
  const tracker = sync.createCheckpointTracker({ cadence: 300, capacity: 2 });
  assert.equal(tracker.recordRemote(cp(300)).status, 'waiting');
  assert.equal(tracker.recordRemote(cp(300)).status, 'duplicate');
  assert.equal(tracker.recordRemote(cp(300, 9)).status, 'conflicting');
  assert.equal(tracker.recordLocal(cp(300)).status, 'match');
  assert.equal(tracker.recordLocal(cp(300)).status, 'stale');
  for (const bad of [
    cp(301), { frame: -300, hash: cp(300).hash },
    { frame: 300, hash: 'invalid' }, { ...cp(300), extra: true },
    { frame: Number.MAX_SAFE_INTEGER + 1, hash: cp(300).hash }
  ]) assert.equal(tracker.recordRemote(bad).status, 'invalid');
  assert.equal(tracker.recordRemote(cp(1500)).status, 'out-of-window');
  assert.equal(tracker.recordLocal(cp(600)).status, 'waiting');
  assert.equal(tracker.recordLocal(cp(900)).status, 'waiting');
  assert.equal(tracker.recordRemote(cp(300)).status, 'out-of-window');
  assert.equal(tracker.stats().compared, 1);
});

test('fresh marker room tracker cannot inherit earlier match frames', () => {
  const first = sync.createCheckpointTracker();
  first.recordLocal(cp(300));
  first.recordRemote(cp(300, 123));
  const second = sync.createCheckpointTracker();
  assert.equal(first.stats().mismatches, 1);
  assert.equal(second.stats().mismatches, 0);
  assert.equal(second.stats().latestLocalFrame, 0);
});

test('only a diagnostic is integrated: the world is not marked synchronized', () => {
  assert.match(engine, /CK_NET\.onSimulationStep\(\)/);
  assert.match(multiplayer, /event: 'world-checkpoint'/);
  assert.match(multiplayer, /CK_SIM_SYNC\.worldCheckpoint\(S, frame\)/);
  assert.match(multiplayer, /synchronizedWorld: false/);
  assert.doesNotMatch(multiplayer, /executeRemoteGameplayCommand\(/);
});
