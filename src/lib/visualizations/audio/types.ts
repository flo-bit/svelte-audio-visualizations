export type AudioSource = AnalyserNode | HTMLMediaElement | MediaStream;
export type AnalysisPreset = 'voice' | 'music';

export interface AnalysisOptions {
	/** Voice/music are defaults; individual options take precedence. */
	preset?: AnalysisPreset;
	bands?: number;
	minFrequency?: number;
	maxFrequency?: number;
	scale?: 'linear' | 'log';
	minDecibels?: number;
	maxDecibels?: number;
	/** Multiplier applied to normalized spectrum and RMS loudness. */
	gain?: number;
	/** Attack/release times in milliseconds. Zero disables smoothing. */
	attack?: number;
	release?: number;
}

export interface AudioProps extends AnalysisOptions {
	source: AudioSource | null | undefined;
	active?: boolean;
	/** Maximum updates per second. */
	fps?: number;
	/** Cap updates at 10 FPS when the user requests reduced motion. */
	respectReducedMotion?: boolean;
	onerror?: (error: Error) => void;
}

/** Buffers are reused. Copy values if you need to retain a historical frame. */
export interface AudioFrame {
	values: Float32Array;
	level: number;
}
