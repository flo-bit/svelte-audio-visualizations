import { describe, expect, it } from 'vitest';
import { createAnalysis } from '../../src/lib/visualizations/audio/analysis';

function fakeAnalyser() {
	const data = {
		fftSize: 16,
		get frequencyBinCount() {
			return this.fftSize / 2;
		},
		context: { sampleRate: 16000 },
		decibels: -50,
		wave: 0.5,
		getFloatFrequencyData(output: Float32Array) {
			output.fill(this.decibels);
		},
		getFloatTimeDomainData(output: Float32Array) {
			output.fill(this.wave);
		}
	};
	return { data, analyser: data as unknown as AnalyserNode };
}

describe('native audio analysis', () => {
	it('normalizes decibels and measures real RMS loudness', () => {
		const { analyser } = fakeAnalyser();
		const analysis = createAnalysis(analyser, {
			bands: 4,
			minDecibels: -100,
			maxDecibels: 0,
			attack: 0,
			release: 0
		});
		const frame = analysis.read(0);
		expect([...frame.values]).toEqual([0.5, 0.5, 0.5, 0.5]);
		expect(frame.level).toBe(0.5);
	});
	it('maps logarithmic and linear bands to the chosen range', () => {
		const { analyser, data } = fakeAnalyser();
		data.getFloatFrequencyData = (output) => {
			output.fill(-100);
			output[3] = 0;
		};
		for (const scale of ['linear', 'log'] as const) {
			const frame = createAnalysis(analyser, {
				bands: 2,
				minFrequency: 1000,
				maxFrequency: 5000,
				minDecibels: -100,
				maxDecibels: 0,
				scale,
				attack: 0
			}).read(0);
			expect(frame.values[1]).toBe(1);
			expect(frame.values[0]).toBe(0);
		}
	});
	it('reuses frame/buffers and handles externally resized FFTs', () => {
		const { analyser, data } = fakeAnalyser();
		const analysis = createAnalysis(analyser);
		const first = analysis.read(0);
		const values = first.values;
		data.fftSize = 32;
		expect(analysis.read(16)).toBe(first);
		expect(first.values).toBe(values);
		expect([...first.values].every(Number.isFinite)).toBe(true);
	});
	it('applies sensitivity and clamps silence and clipping', () => {
		const { analyser, data } = fakeAnalyser();
		const analysis = createAnalysis(analyser, { gain: 3, attack: 0, release: 0 });
		expect(analysis.read(0).level).toBe(1);
		data.decibels = -Infinity;
		data.wave = 0;
		const frame = analysis.read(16);
		expect(frame.level).toBe(0);
		expect([...frame.values].every((value) => value === 0)).toBe(true);
	});
	it('has time-based attack/release and resets cleanly', () => {
		const { analyser, data } = fakeAnalyser();
		const analysis = createAnalysis(analyser, { attack: 100, release: 200 });
		const initial = analysis.read(0).level;
		expect(initial).toBeGreaterThan(0);
		expect(initial).toBeLessThan(0.5);
		const rising = analysis.read(100).level;
		expect(rising).toBeGreaterThan(initial);
		data.wave = 0;
		const falling = analysis.read(200).level;
		expect(falling).toBeLessThan(rising);
		expect(falling).toBeGreaterThan(0);
		expect(analysis.reset().level).toBe(0);
	});
	it('rejects invalid options', () => {
		const { analyser } = fakeAnalyser();
		for (const bands of [0, -1, 2.5, Infinity, 2049])
			expect(() => createAnalysis(analyser, { bands })).toThrow(RangeError);
		expect(() => createAnalysis(analyser, { minFrequency: 100, maxFrequency: 50 })).toThrow(
			RangeError
		);
		expect(() => createAnalysis(analyser, { minDecibels: -20, maxDecibels: -80 })).toThrow(
			RangeError
		);
		expect(() => createAnalysis(analyser, { gain: NaN })).toThrow(RangeError);
		expect(() => createAnalysis(analyser, { release: -1 })).toThrow(RangeError);
	});
});
