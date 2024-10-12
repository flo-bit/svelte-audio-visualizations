import { AudioAnalysis } from './analysis/audio_analysis.js';

/**
 * Plays audio files (mp3, wav, etc.)
 * @class
 */
export class AudioFilePlayer {
	/**
	 * Creates a new AudioFilePlayer instance
	 * @param {{sampleRate?: number}} options
	 * @returns {AudioFilePlayer}
	 */
	constructor({ sampleRate = 44100 } = {}) {
		this.sampleRate = sampleRate;
		this.context = null;
		this.analyser = null;
		this.source = null;
		this.buffer = null;
		this.isPlaying = false;
		this.startTime = 0;
		this.pauseTime = 0;
	}

	/**
	 * Connects the audio context and enables output to speakers
	 * @returns {Promise<true>}
	 */
	async connect() {
		this.context = new AudioContext({
			sampleRate: this.sampleRate
		});
		if (this.context.state === 'suspended') {
			await this.context.resume();
		}
		const analyser = this.context.createAnalyser();
		analyser.fftSize = 8192;
		analyser.smoothingTimeConstant = 0.1;
		this.analyser = analyser;
		return true;
	}

	/**
	 * Loads an audio file and decodes it
	 * @param {string|ArrayBuffer|Blob} audioInput - URL string, ArrayBuffer, or Blob of the audio file
	 * @returns {Promise<void>}
	 */
	async loadFile(audioInput) {
		if (!this.context) {
			await this.connect();
		}

		let arrayBuffer;
		if (typeof audioInput === 'string') {
			// Fetch the audio file from URL
			const response = await fetch(audioInput);
			arrayBuffer = await response.arrayBuffer();
		} else if (audioInput instanceof Blob) {
			arrayBuffer = await audioInput.arrayBuffer();
		} else if (audioInput instanceof ArrayBuffer) {
			arrayBuffer = audioInput;
		} else {
			throw new Error('audioInput must be a URL string, ArrayBuffer, or Blob');
		}

		// Decode the audio data
		this.buffer = await this.context.decodeAudioData(arrayBuffer);
	}

	/**
	 * Plays the loaded audio file
	 * @returns {void}
	 */
	play() {
		if (this.isPlaying) {
			return;
		}
		if (!this.buffer) {
			throw new Error('No audio buffer loaded. Please call loadFile() first.');
		}

		this.source = this.context.createBufferSource();
		this.source.buffer = this.buffer;
		this.source.connect(this.analyser);
		this.analyser.connect(this.context.destination);

		const offset = this.pauseTime || 0;
		this.source.start(0, offset);
		this.startTime = this.context.currentTime - offset;
		this.isPlaying = true;

		this.source.onended = () => {
			this.isPlaying = false;
			this.pauseTime = 0;
		};
	}

	/**
	 * Pauses the playback
	 * @returns {void}
	 */
	pause() {
		if (!this.isPlaying) {
			return;
		}
		this.source.stop();
		this.pauseTime = this.context.currentTime - this.startTime;
		this.isPlaying = false;
	}

	/**
	 * Stops the playback and resets play position
	 * @returns {void}
	 */
	stop() {
		if (this.source) {
			this.source.stop();
		}
		this.isPlaying = false;
		this.pauseTime = 0;
	}

	/**
	 * Gets the current frequency domain data from the playing track
	 * @param {"frequency"|"music"|"voice"} [analysisType]
	 * @param {number} [minDecibels] default -100
	 * @param {number} [maxDecibels] default -30
	 * @returns {import('./analysis/audio_analysis.js').AudioAnalysisOutputType}
	 */
	getFrequencies(analysisType = 'frequency', minDecibels = -100, maxDecibels = -30) {
		if (!this.analyser) {
			throw new Error('Not connected, please call .connect() first');
		}
		return AudioAnalysis.getFrequencies(
			this.analyser,
			this.sampleRate,
			null,
			analysisType,
			minDecibels,
			maxDecibels
		);
	}
}

globalThis.AudioFilePlayer = AudioFilePlayer;
