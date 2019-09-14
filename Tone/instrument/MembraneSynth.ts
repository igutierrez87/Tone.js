import { FrequencyClass } from "../core/type/Frequency";
import { Frequency, Positive, Time } from "../core/type/Units";
import { deepMerge, optionsFromArguments } from "../core/util/Defaults";
import { readOnly, RecursivePartial } from "../core/util/Interface";
import { Monophonic } from "./Monophonic";
import { Synth, SynthOptions } from "./Synth";

export interface MembraneSynthOptions extends SynthOptions {
	pitchDecay: Time;
	octaves: Positive;
}

/**
 * MembraneSynth makes kick and tom sounds using a single oscillator
 * with an amplitude envelope and frequency ramp. A Tone.OmniOscillator
 * is routed through a Tone.AmplitudeEnvelope to the output. The drum
 * quality of the sound comes from the frequency envelope applied
 * during MembraneSynth.triggerAttack(note). The frequency envelope
 * starts at <code>note * .octaves</code> and ramps to <code>note</code>
 * over the duration of <code>.pitchDecay</code>.
 * @example
 * var synth = new MembraneSynth().toMaster();
 * synth.triggerAttackRelease("C2", "8n");
 */
export class MembraneSynth extends Synth<MembraneSynthOptions> {

	readonly name: string = "MembraneSynth";

	/**
	 * The number of octaves the pitch envelope ramps.
	 */
	octaves: Positive;

	/**
	 * The amount of time the frequency envelope takes.
	 */
	pitchDecay: Time;

	/**
	 * Portamento is ignored in this synth. use pitch decay instead.
	 */
	readonly portamento = 0;

	/**
	 * @param options the options available for the synth see defaults
	 */
	constructor(options?: RecursivePartial<MembraneSynthOptions>)
	constructor() {

		super(optionsFromArguments(MembraneSynth.getDefaults(), arguments));
		const options = optionsFromArguments(MembraneSynth.getDefaults(), arguments);

		this.pitchDecay = options.pitchDecay;
		this.octaves = options.octaves;
		readOnly(this, ["oscillator", "envelope"]);
	}

	static getDefaults(): MembraneSynthOptions {
		return deepMerge(Monophonic.getDefaults(), Synth.getDefaults(), {
			envelope : {
				attack : 0.001,
				attackCurve : "exponential",
				decay : 0.4,
				release : 1.4,
				sustain : 0.01,
			},
			octaves: 10,
			oscillator: {
				type: "sine",
			},
			pitchDecay: 0.05,
		});
	}

	setNote(note: Frequency | FrequencyClass, time?: Time): this {
		const seconds = this.toSeconds(time);
		const hertz = this.toFrequency(note instanceof FrequencyClass ? note.toFrequency() : note);
		const maxNote = hertz * this.octaves;
		this.oscillator.frequency.setValueAtTime(maxNote, seconds);
		this.oscillator.frequency.exponentialRampToValueAtTime(hertz, seconds + this.toSeconds(this.pitchDecay));
		return this;
	}

	dispose(): this {
		super.dispose();
		return this;
	}
}
