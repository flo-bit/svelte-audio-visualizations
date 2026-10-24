import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connectSource, resumeAudio } from '../../src/lib/visualizations/audio/source';

class Node {
	connect = vi.fn();
	disconnect = vi.fn();
}
class Context {
	static instances: Context[] = [];
	state = 'suspended';
	destination = new Node();
	mediaNode = new Node();
	streamNode = new Node();
	analyser = new Node();
	createMediaElementSource = vi.fn(() => this.mediaNode);
	createMediaStreamSource = vi.fn(() => this.streamNode);
	createAnalyser = vi.fn(() => this.analyser);
	resume = vi.fn(async () => {
		this.state = 'running';
	});
	close = vi.fn(async () => {
		this.state = 'closed';
	});
	constructor() {
		Context.instances.push(this);
	}
}
class MediaElement {}
class Stream {
	stop = vi.fn();
}
class Analyser extends Node {
	context = new Context();
	fftSize = 4096;
	smoothingTimeConstant = 0.7;
}

beforeEach(() => {
	Context.instances = [];
	vi.stubGlobal('AudioContext', Context);
	vi.stubGlobal('HTMLMediaElement', MediaElement);
	vi.stubGlobal('AnalyserNode', Analyser);
});
afterEach(() => vi.unstubAllGlobals());

describe('source ownership', () => {
	it('does not modify or disconnect borrowed analysers', async () => {
		const analyser = new Analyser();
		const connection = connectSource(analyser as unknown as AnalyserNode);
		await connection.resume();
		connection.dispose();
		expect(analyser.context.resume).not.toHaveBeenCalled();
		expect(analyser.fftSize).toBe(4096);
		expect(analyser.smoothingTimeConstant).toBe(0.7);
		expect(analyser.disconnect).not.toHaveBeenCalled();
		expect(analyser.context.close).not.toHaveBeenCalled();
		await resumeAudio(analyser as unknown as AnalyserNode);
		expect(analyser.context.resume).toHaveBeenCalledTimes(1);
	});
	it('closes owned stream contexts without stopping input tracks or monitoring audio', async () => {
		const stream = new Stream();
		const connection = connectSource(stream as unknown as MediaStream);
		const context = Context.instances[0];
		await connection.resume();
		expect(context.streamNode.connect).toHaveBeenCalledWith(context.analyser);
		expect(context.analyser.connect).not.toHaveBeenCalled();
		connection.dispose();
		connection.dispose();
		expect(context.close).toHaveBeenCalledTimes(1);
		expect(stream.stop).not.toHaveBeenCalled();
	});
	it('reuses a media-element route across remounts and preserves playback on detach', async () => {
		const element = new MediaElement() as HTMLMediaElement;
		await resumeAudio(element);
		const first = connectSource(element);
		first.dispose();
		const second = connectSource(element);
		second.dispose();
		expect(Context.instances).toHaveLength(1);
		const context = Context.instances[0];
		expect(context.createMediaElementSource).toHaveBeenCalledTimes(1);
		expect(context.mediaNode.connect).toHaveBeenCalledWith(context.destination);
		expect(context.mediaNode.disconnect).toHaveBeenCalledWith(context.analyser);
		expect(context.mediaNode.disconnect).not.toHaveBeenCalledWith(context.destination);
		expect(context.close).not.toHaveBeenCalled();
	});
	it('closes a context if media attachment fails', () => {
		class FailingContext extends Context {
			createMediaElementSource = vi.fn((): Node => {
				throw new Error('Already attached');
			});
		}
		vi.stubGlobal('AudioContext', FailingContext);
		expect(() => connectSource(new MediaElement() as HTMLMediaElement)).toThrow('Already attached');
		expect(Context.instances[0].close).toHaveBeenCalledTimes(1);
	});
});
