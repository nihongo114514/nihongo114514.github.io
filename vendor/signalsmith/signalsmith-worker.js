/* Japanese study audio: local, pitch-preserving time-stretch worker.
 * Signalsmith Stretch core is MIT; see LICENSE-signalsmith.txt.
 * Input/outputs are mono Float32Array PCM; no audio leaves the browser.
 */
'use strict';
importScripts('signalsmith-core.js');
const engineReady = SignalsmithStretch();
const allowedRates = new Set([0.25, 0.5, 1, 1.5, 2]);
const maxOutputFrames = 8_000_000; // <= 32 MB output PCM per request.

function stretchMono(engine, input, sampleRate, rate) {
  if (!allowedRates.has(rate)) throw Error('Unsupported playback rate');
  if (!(input instanceof Float32Array) || !input.length) throw Error('Missing PCM');
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 96000) throw Error('Unsupported sample rate');
  const frameCount = Math.round(input.length / rate);
  if (frameCount > maxOutputFrames) throw Error('Clip exceeds short-audio memory budget');
  if (rate === 1) return {pcm: input, inputLatency: 0, outputLatency: 0};
  // Offline processing has no render-thread deadline, so use dense spectral
  // overlaps instead of the cheaper real-time preset. Pitch/formants stay fixed.
  const blockFrames = Math.round(sampleRate * 0.16);
  const intervalFrames = Math.round(sampleRate * 0.02);
  engine._configure(1, blockFrames, intervalFrames, false);
  engine._reset();
  engine._setTransposeSemitones(0, Math.min(8000 / sampleRate, 0.49));
  engine._setFormantSemitones(0, false);
  const inputLatency = engine._inputLatency();
  const outputLatency = engine._outputLatency();
  const chunkFrames = 1024;
  const capacity = Math.max(blockFrames + intervalFrames, inputLatency, outputLatency, Math.ceil(chunkFrames / rate));
  const inputPointer = engine._setBuffers(1, capacity);
  const outputPointer = inputPointer + capacity * 4;
  const memory = () => engine.exports?.memory.buffer || engine.HEAP8.buffer;
  const inputView = () => new Float32Array(memory(), inputPointer, capacity);
  const outputView = () => new Float32Array(memory(), outputPointer, capacity);
  inputView().fill(0);
  inputView().set(input.subarray(0, Math.min(input.length, inputLatency)));
  engine._seek(inputLatency, rate);
  const withPreroll = new Float32Array(frameCount + outputLatency);
  let processedInput = 0, writtenOutput = 0;
  while (processedInput < input.length) {
    const count = Math.min(chunkFrames, input.length - processedInput);
    const nextOutput = Math.round((processedInput + count) / rate);
    const outputCount = nextOutput - writtenOutput;
    const left = inputLatency + processedInput;
    const right = Math.min(input.length, left + count);
    const buffer = inputView();
    buffer.fill(0);
    if (left < input.length) buffer.set(input.subarray(left, right));
    engine._process(count, outputCount);
    withPreroll.set(outputView().subarray(0, outputCount), writtenOutput);
    processedInput += count;
    writtenOutput = nextOutput;
  }
  // Advance the processing time through the complete input and drain the DSP
  // tail. Removing only documented latency keeps the last syllable intact.
  engine._flush(outputLatency);
  withPreroll.set(outputView().subarray(0, outputLatency), writtenOutput);
  const pcm = withPreroll.slice(outputLatency, outputLatency + frameCount);
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) {
    if (!Number.isFinite(pcm[i])) throw Error('Invalid DSP output');
    peak = Math.max(peak, Math.abs(pcm[i]));
  }
  if (peak > 0.98) {
    const gain = 0.98 / peak;
    for (let i = 0; i < pcm.length; i++) pcm[i] *= gain;
  }
  return {pcm, inputLatency, outputLatency};
}

self.onmessage = async ({data}) => {
  const {id, pcm: source, sampleRate, rate} = data;
  try {
    const input = source instanceof Float32Array ? source : new Float32Array(source);
    const engine = await engineReady;
    const started = performance.now();
    const result = stretchMono(engine, input, sampleRate, rate);
    self.postMessage({
      id, pcm: result.pcm.buffer, sampleRate, rate,
      inputFrames: input.length, outputFrames: result.pcm.length,
      inputLatency: result.inputLatency, outputLatency: result.outputLatency,
      processingMs: performance.now() - started
    }, [result.pcm.buffer]);
  } catch (error) {
    self.postMessage({id, error: error?.message || String(error)});
  }
};
