import { amplitude } from '../core/utils';
import type { AnalysisOptions, AudioFrame } from './types';

const presets = {
	voice: { minFrequency: 100, maxFrequency: 4000, minDecibels: -80, maxDecibels: -20 },
	music: { minFrequency: 40, maxFrequency: 16000, minDecibels: -90, maxDecibels: -20 }
};

/** One independent analyser reader. All per-frame arrays are reused. */
export function createAnalysis(analyser: AnalyserNode, options: AnalysisOptions = {}) {
	const config = {
		...presets[options.preset ?? 'music'],
		bands: 32,
		scale: 'log',
		gain: 1,
		attack: 30,
		release: 180,
		...Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined))
	} as Required<AnalysisOptions>;
	if (!Number.isInteger(config.bands) || config.bands < 1 || config.bands > 2048) {
		throw new RangeError('bands must be an integer between 1 and 2048');
	}
	for (const key of [
		'minFrequency',
		'maxFrequency',
		'minDecibels',
		'maxDecibels',
		'gain',
		'attack',
		'release'
	] as const) {
		if (!Number.isFinite(config[key])) throw new RangeError(`${key} must be finite`);
	}
	if (config.minFrequency < 0 || config.maxFrequency <= config.minFrequency) {
		throw new RangeError('Expected 0 <= minFrequency < maxFrequency');
	}
	if (config.maxDecibels <= config.minDecibels)
		throw new RangeError('maxDecibels must exceed minDecibels');
	if (config.gain < 0 || config.attack < 0 || config.release < 0)
		throw new RangeError('gain, attack and release must be non-negative');

	let fft = new Float32Array(analyser.frequencyBinCount);
	let waveform = new Float32Array(analyser.fftSize);
	const values = new Float32Array(config.bands);
	const starts = new Uint32Array(config.bands);
	const ends = new Uint32Array(config.bands);
	const frame: AudioFrame = { values, level: 0 };
	let previousTime: number | undefined;

	function mapBands() {
		const step = analyser.context.sampleRate / analyser.fftSize;
		const nyquist = analyser.context.sampleRate / 2;
		const low = Math.min(config.minFrequency, nyquist);
		const high = Math.min(config.maxFrequency, nyquist);
		const logLow = Math.max(step, low);
		const edge = (t: number) =>
			config.scale === 'linear' || high <= logLow
				? low + (high - low) * t
				: logLow * Math.pow(high / logLow, t);
		for (let i = 0; i < values.length; i++) {
			starts[i] = Math.min(fft.length - 1, Math.floor(edge(i / values.length) / step));
			ends[i] = Math.min(
				fft.length,
				Math.max(starts[i] + 1, Math.ceil(edge((i + 1) / values.length) / step))
			);
		}
	}
	mapBands();

	function smooth(current: number, target: number, dt: number) {
		const time = target > current ? config.attack : config.release;
		return time === 0 ? target : current + (target - current) * (1 - Math.exp(-dt / time));
	}

	return {
		read(time: number): AudioFrame {
			// A borrowed analyser may be reconfigured by its owner at any time.
			if (fft.length !== analyser.frequencyBinCount) {
				fft = new Float32Array(analyser.frequencyBinCount);
				waveform = new Float32Array(analyser.fftSize);
				mapBands();
			}
			const dt = previousTime === undefined ? 1000 / 60 : Math.max(0, time - previousTime);
			previousTime = time;
			analyser.getFloatFrequencyData(fft);
			for (let band = 0; band < values.length; band++) {
				let peak = -Infinity;
				for (let bin = starts[band]; bin < ends[band]; bin++) peak = Math.max(peak, fft[bin]);
				const target = amplitude(
					((peak - config.minDecibels) / (config.maxDecibels - config.minDecibels)) * config.gain
				);
				values[band] = smooth(values[band], target, dt);
			}
			analyser.getFloatTimeDomainData(waveform);
			let sum = 0;
			for (let i = 0; i < waveform.length; i++) sum += waveform[i] * waveform[i];
			frame.level = smooth(
				frame.level,
				amplitude(Math.sqrt(sum / waveform.length) * config.gain),
				dt
			);
			return frame;
		},
		reset(): AudioFrame {
			values.fill(0);
			frame.level = 0;
			previousTime = undefined;
			return frame;
		}
	};
}
