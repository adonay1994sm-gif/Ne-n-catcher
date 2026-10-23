"""Original NEON CRONIUM combat foley, reproducible without samples or soundfonts.

Python 3 + NumPy/SciPy + FFmpeg. This is an offline authoring tool, not runtime
code. Each material has its own temporal/spectral construction; two seeded
performances prevent identical repeated impacts. No third-party sound is used.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import tempfile
import wave

import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
RATE = 48000
GAP = .12


def filtered_noise(t, rng, lo, hi):
    source = rng.normal(0, 1, len(t))
    sos = butter(3, [lo, hi], btype='bandpass', fs=RATE, output='sos')
    result = sosfilt(sos, source)
    return result / max(.001, np.sqrt(np.mean(result * result)))


def env(t, attack, decay):
    return (1 - np.exp(-t / attack)) * np.exp(-t / decay)


def sweep(t, start, end, duration):
    ratio = np.clip(t / duration, 0, 1)
    frequency = start * (end / start) ** ratio
    return np.sin(2 * np.pi * np.cumsum(frequency) / RATE)


def metal(t, variant, rng):
    # A short tool-like attack, followed by inharmonic plate modes and grit.
    out = filtered_noise(t, rng, 1700, 14000) * env(t, .0007, .027) * .24
    for freq, strength, decay in [(711, .35, .14), (1167, .27, .095),
                                  (1973, .19, .065), (3211, .12, .044)]:
        out += np.sin(2 * np.pi * freq * (1 + variant * .028) * t) * env(t, .0007, decay) * strength
    out += sweep(t, 180, 49, .07) * env(t, .001, .048) * .6
    return out


def build(name, seconds, variant):
    t = np.arange(round(seconds * RATE)) / RATE
    rng = np.random.default_rng(160718 + variant * 97 + sum(map(ord, name)))
    if name == 'phaser':
        # Capacitor snap, falling ion ribbon and a separate breath of hot gas.
        out = sweep(t, 1650 + variant * 170, 210 + variant * 30, .12) * env(t, .001, .042) * .40
        out += sweep(t, 490, 90, .07) * env(t, .001, .035) * .28
        out += filtered_noise(t, rng, 1400, 11500) * env(t, .0015, .047) * .13
    elif name == 'enemy-phaser':
        # Atlas network emitter: a clipped rail discharge and two resonant
        # plasma bands. A compact physical attack, not a collision sound or
        # the player's falling ribbon. Variants stay within a 3% pitch range.
        shift = 1 + variant * .025
        out = filtered_noise(t, rng, 1900, 12500) * env(t, .0006, .013) * .24
        out += sweep(t, 1250 * shift, 410 * shift, .10) * env(t, .0011, .036) * .33
        out += sweep(t, 360 * shift, 130 * shift, .09) * env(t, .0015, .043) * .42
        out += filtered_noise(t, rng, 650, 4300) * env(t, .003, .053) * .12
        out += np.sin(2 * np.pi * 310 * shift * t) * env(t, .004, .046) * .11
    elif name == 'enemy-heavy':
        # Heavy containment cannon: contactor snap, recoil pressure and hot
        # barrel exhaust. It is emitted after charge, never used as its warning.
        shift = 1 + variant * .022
        out = filtered_noise(t, rng, 1500, 13000) * env(t, .0007, .015) * .24
        out += sweep(t, 200 * shift, 51 * shift, .15) * env(t, .001, .095) * .64
        out += sweep(t, 950 * shift, 180 * shift, .19) * env(t, .002, .075) * .24
        out += filtered_noise(t, rng, 90, 2100) * env(t, .004, .13) * .29
        out += filtered_noise(t, rng, 1200, 6100) * env(t, .013, .086) * .12
    elif name == 'missile-launch':
        # Igniter crack + ejector thump + a sustained accelerating exhaust.
        out = filtered_noise(t, rng, 1300, 14500) * env(t, .0008, .025) * .36
        out += sweep(t, 145, 42, .11) * env(t, .001, .070) * .55
        out += filtered_noise(t, rng, 140, 3900) * env(t, .019, .16) * .38
        out += sweep(t, 86, 250 + variant * 35, .4) * env(t, .022, .14) * .17
    elif name == 'impact-metal':
        out = metal(t, variant, rng)
    elif name == 'impact-plasma':
        # Electrical sputter has no resonant steel plate, unlike metal hits.
        gate = .35 + .65 * np.sin(2 * np.pi * (72 + variant * 13) * t) ** 4
        out = filtered_noise(t, rng, 600, 15000) * env(t, .001, .09) * gate * .40
        out += sweep(t, 650, 70, .17) * env(t, .002, .085) * .40
        out += sweep(t, 1070, 140, .13) * env(t, .004, .06) * .16
    elif name == 'hull-hit':
        # Close cockpit structure: lower resonances and dull pressure, no beep.
        out = metal(t, variant, rng) * .30
        out += filtered_noise(t, rng, 60, 1900) * env(t, .001, .13) * .45
        for freq, amp in [(67, .55), (109, .30), (183, .14)]:
            out += np.sin(2 * np.pi * (freq + variant * 2) * t) * env(t, .002, .12) * amp
    elif name == 'enemy-break':
        # Pressure transient, separated secondary fractures, then debris tail.
        out = sweep(t, 135, 30, .22) * env(t, .001, .15) * .55
        out += filtered_noise(t, rng, 55, 6000) * env(t, .002, .18) * .48
        for delay, amp in [(.075, .21), (.145, .18), (.245, .10)]:
            local = np.maximum(0, t - delay - variant * .008)
            out += filtered_noise(t, rng, 700, 13500) * env(local, .001, .028) * amp * (t >= delay + variant * .008)
    elif name == 'atlas-charge':
        # Heavy servos unlock first; rising unstable energy announces the cycle.
        out = metal(t, variant, rng) * .38
        out += filtered_noise(t, rng, 100, 1500) * env(t, .02, .23) * .25
        out += sweep(t, 95, 630 + variant * 45, .65) * np.sin(np.pi * np.clip(t / .78, 0, 1)) ** 2 * .32
        out += sweep(t, 151, 1011, .65) * env(t, .07, .22) * .10
    elif name == 'atlas-collapse':
        # Multiple authored internal failures, deep hull breakup, residual arcs.
        out = np.zeros_like(t)
        for delay, strength in [(0, .7), (.135, .5), (.31, .35), (.56, .24)]:
            local = np.maximum(0, t - delay)
            out += sweep(local, 113 - delay * 45, 26, .2) * env(local, .001, .20) * strength * (t >= delay)
            out += filtered_noise(t, rng, 55, 8000) * env(local, .003, .17) * strength * .52 * (t >= delay)
        out += filtered_noise(t, rng, 1800, 15000) * env(t, .08, .35) * (.2 + .8 * np.sin(t * 123) ** 6) * .17
    else:
        raise ValueError(name)

    # Bounded original waveform, clean endpoints; no sample clipping or click.
    out = np.tanh(out * 1.15)
    fade = min(round(.008 * RATE), len(out) // 2)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    out *= .70 / max(.00001, np.max(np.abs(out)))
    return out


def write_wav(path, samples):
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(3)
        output.setframerate(RATE)
        values = np.round(samples * (2 ** 23 - 1)).astype(np.int32)
        encoded = (values[:, None] >> (np.arange(3) * 8)) & 255
        output.writeframes(encoded.astype(np.uint8).tobytes())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    specifications = [('phaser', .20, .15, 1, .045, 3),
                      ('missile-launch', .58, .31, 5, .25, 2),
                      ('impact-metal', .44, .23, 3, .04, 3),
                      ('impact-plasma', .40, .23, 3, .04, 3),
                      ('hull-hit', .58, .29, 6, .12, 2),
                      ('enemy-break', .95, .31, 5, .10, 2),
                      ('atlas-charge', .88, .28, 7, .30, 1),
                      ('atlas-collapse', 1.85, .40, 9, 1, 1),
                      ('enemy-phaser', .28, .19, 2, .055, 3),
                      ('enemy-heavy', .62, .28, 5, .16, 2)]
    track, cues, stems = [], {}, []
    cursor = 0
    for name, seconds, gain, priority, cooldown, polyphony in specifications:
        variants = []
        for variant in range(2):
            samples = build(name, seconds, variant)
            target = ROOT / 'masters' / f'{name}-{variant + 1:02}.wav'
            write_wav(target, samples)
            variants.append({'offset': round(cursor / RATE, 6), 'duration': round(len(samples) / RATE, 6)})
            stems.append({'cue': name, 'variant': variant + 1, 'path': str(target.relative_to(ROOT)),
                          'samples': len(samples), 'peakDbfs': round(20 * np.log10(np.max(np.abs(samples))), 3),
                          'rmsDbfs': round(20 * np.log10(np.sqrt(np.mean(samples ** 2))), 3),
                          'clippedSamples': int(np.sum(np.abs(samples) >= 1)), 'sha256': sha(target)})
            track.extend([samples, np.zeros(round(GAP * RATE))])
            cursor += len(samples) + round(GAP * RATE)
        cues[name] = {'variants': variants, 'gain': gain, 'priority': priority, 'cooldown': cooldown, 'polyphony': polyphony}
    atlas = np.concatenate(track)
    master = ROOT / 'combat_sfx_atlas_v2.wav'
    write_wav(master, atlas)
    runtime = REPO / 'assets' / 'combat_sfx_atlas_v2.m4a'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(master), '-map_metadata', '-1',
                    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', str(runtime)], check=True)
    manifest = {'version': 2, 'src': 'assets/combat_sfx_atlas_v2.m4a', 'sampleRate': RATE,
                'channels': 1, 'duration': round(len(atlas) / RATE, 6), 'gap': GAP, 'cues': cues}
    (REPO / 'assets' / 'combat_sfx_atlas_v2.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (ROOT / 'measurements.json').write_text(json.dumps({'sampleRate': RATE, 'channels': 1,
        'atlasSamples': len(atlas), 'duration': len(atlas) / RATE,
        'estimatedDecodedFloat32Bytes': len(atlas) * 4,
        'masterBytes': master.stat().st_size, 'masterSha256': sha(master),
        'runtimeBytes': runtime.stat().st_size, 'runtimeSha256': sha(runtime), 'stems': stems}, indent=2) + '\n')
    with tempfile.TemporaryDirectory(prefix='neon-combat-aac-') as folder:
        decoded_path = Path(folder) / 'decoded.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(runtime), '-c:a', 'pcm_f32le', str(decoded_path)], check=True)
        rate, decoded = wavfile.read(decoded_path)
    measurements = {'decoder': subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True).stdout.splitlines()[0],
                    'sampleRate': rate, 'channels': 1, 'duration': len(decoded) / rate,
                    'samples': len(decoded), 'peakDbfs': float(20 * np.log10(np.max(np.abs(decoded)))),
                    'clippedSamples': int(np.sum(np.abs(decoded) >= 1)), 'cues': []}
    for name, definition in cues.items():
        for index, segment in enumerate(definition['variants']):
            section = decoded[round(segment['offset'] * rate):round((segment['offset'] + segment['duration']) * rate)]
            spectrum = np.abs(np.fft.rfft(section * np.hanning(len(section)))) ** 2
            freqs = np.fft.rfftfreq(len(section), 1 / rate)
            onset = np.nonzero(np.abs(section) > .005)[0]
            measurements['cues'].append({'cue': name, 'variant': index + 1, 'duration': len(section) / rate,
                'rmsDbfs': float(20 * np.log10(np.sqrt(np.mean(section ** 2)))),
                'spectralCentroidHz': float(np.sum(spectrum * freqs) / np.sum(spectrum)),
                'onsetSeconds': float(onset[0] / rate) if len(onset) else None,
                'peakDbfs': float(20 * np.log10(np.max(np.abs(section))))})
    (ROOT / 'aac-decode-measurements.json').write_text(json.dumps(measurements, indent=2) + '\n')
    print(json.dumps({'runtime': str(runtime), 'bytes': runtime.stat().st_size,
                      'seconds': len(atlas) / RATE, 'stems': len(stems)}))


if __name__ == '__main__':
    main()
