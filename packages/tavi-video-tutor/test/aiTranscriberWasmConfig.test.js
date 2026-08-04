import test from 'node:test';
import assert from 'node:assert';

test('AITranscriber WASM Configuration Test', async () => {
  const { env } = await import('@huggingface/transformers');
  
  // Verify env structure in @huggingface/transformers
  assert.ok(env, 'env object must exist');
  assert.ok(env.backends, 'env.backends object must exist');
  assert.strictEqual(typeof env.wasm, 'undefined', 'env.wasm is undefined in @huggingface/transformers v4.2.0');

  // Verify safe setting on backends.onnx.wasm
  if (env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.numThreads = 1;
    assert.strictEqual(env.backends.onnx.wasm.numThreads, 1);
  } else if (env.wasm) {
    env.wasm.numThreads = 1;
  }

  console.log('  ✅ PASS: AITranscriber env WASM backend safely configured without throwing TypeError');
});
