#!/usr/bin/env python3
"""Original NEON CRONIUM Chapter 1 cues; offline composition and instrument rendering.

No soundfont, recording, external sample, network call or runtime oscillator is
used. Python/numpy/scipy render reusable audio files, not the game's audio loop.
Run from the repository root: python3 art-source/audio/chapter1-score/render_score.py
"""
from pathlib import Path
import hashlib
import json
import math
import struct
import subprocess
import tempfile
import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
ASSETS = OUT / 'runtime'
SR = 44100
SEED = 20261018
PROGRAMS = {'strings': (0, 48), 'piano': (1, 0), 'bass': (2, 38),
            'pad': (3, 89), 'bell': (4, 10), 'brass': (5, 61),
            'pluck': (6, 24), 'boom': (9, 35), 'brush': (9, 42), 'rise': (8, 96)}


def event(events, at, instrument, note=60, duration=1.0, gain=.1, pan=0):
    events.append(dict(at=round(at, 6), instrument=instrument, note=note,
                       duration=round(duration, 6), gain=gain, pan=pan))


def chord(events, at, notes, duration, gain=.1, instrument='strings', spread=.55):
    for index, note in enumerate(notes):
        pan = (index / max(1, len(notes)-1) * 2-1) * spread
        event(events, at + index*.013, instrument, note, duration, gain, pan)


def opening():
    events = []
    # D-minor/add-nine identity: fragile research station -> rupture -> escape.
    harmony = [[50, 57, 60, 64, 69], [46, 53, 57, 60, 65],
               [43, 50, 57, 58, 65], [45, 52, 55, 58, 61],
               [50, 57, 60, 64, 69], [46, 53, 57, 60, 65],
               [43, 50, 57, 58, 65], [45, 52, 55, 58, 61],
               [50, 57, 60, 64, 69], [53, 60, 64, 67, 72], [50, 57, 60, 64, 69]]
    for bar, notes in enumerate(harmony):
        at = bar*2.5
        chord(events, at, notes[1:], 3.0 if bar<4 else 2.85,
              .043 if bar<3 else .060, 'pad')
        chord(events, at+.10, [n+12 for n in notes[1:]], 2.7, .022, 'strings', .75)
        event(events, at, 'bass', notes[0]-12, 2.35, .17 if bar>2 else .12, -.04)
        if bar>=4:
            pattern=[0, 2, 1, 3, 2, 1, 3, 2]
            for step, degree in enumerate(pattern):
                event(events, at+step*.3125, 'pluck', notes[degree+1]+12,
                      .80, .055 if step%2 else .073, -.38 if step%2 else .35)
        if 2<=bar<=8:
            event(events, at, 'boom', 40, 2.0, .15, -.10)
        if bar>=5:
            event(events, at+1.25, 'boom', 45, 1.15, .080, .16)
            for step in [1, 3, 5, 7]:
                event(events, at+step*.3125, 'brush', 76, .14, .018, (-1 if step%4==1 else 1)*.45)
    # A recurring five-note signature; scored phrases leave deliberate air.
    melody=[(1.25, 74, 1.00), (3.12, 69, .70), (4.0, 77, 1.1),
            (5.7, 76, .80), (7.10, 74, .95), (10.0, 74, .58),
            (10.94, 77, .58), (11.88, 81, .90), (13.12, 79, .60),
            (14.05, 77, .85), (15.0, 76, .58), (15.94, 74, 1.00),
            (17.50, 73, .95), (18.75, 69, .75), (20.0, 74, 1.30),
            (22.5, 77, 1.00), (24.0, 76, .80), (25.0, 74, 1.70)]
    for index, (at, note, duration) in enumerate(melody):
        event(events, at, 'piano', note, duration+1.1, .105 if at>=10 else .075, -.13)
        if at>=20:
            event(events, at+.018, 'strings', note-12, duration+1.25, .025, .30)
    event(events, 6.1, 'rise', 50, 2.9, .065, .15)
    event(events, 9.0, 'boom', 32, 3.9, .39, 0)
    chord(events, 9.0, [38, 50, 57, 63, 69], 2.0, .066, 'brass', .62)
    event(events, 9.03, 'bell', 86, 3.0, .043, -.22)
    event(events, 19.8, 'rise', 62, .60, .024, -.15)
    event(events, 25.0, 'bell', 81, 3.0, .025, .46)
    return dict(id='chapter1_opening_score_v1', title='Chronos: la ruptura', bpm=96,
                duration=28.0, loop=False, masterPeakDbFS=-3, events=events,
                landmarks={'emergency': 0, 'incoming': 6.1, 'rupture': 9.0, 'escape': 10.0, 'resolution': 25.0})


def voyage():
    events=[]
    harmony=[[50, 57, 60, 64, 69], [46, 53, 57, 60, 65],
             [53, 60, 64, 67, 72], [48, 55, 60, 62, 67],
             [43, 50, 57, 58, 65], [41, 50, 57, 60, 64],
             [51, 58, 62, 65, 69], [45, 52, 57, 59, 64]]
    for bar in range(16):
        at=bar*3; notes=harmony[bar%8]
        chord(events, at, notes[1:], 3.6, .041, 'pad', .70)
        if bar%2==0:
            chord(events, at+.15, [notes[2]+12, notes[3]+12], 5.6, .018, 'strings', .65)
        event(events, at, 'bass', notes[0]-12, 2.6, .14, -.08)
        event(events, at+1.5, 'bass', notes[0], .90, .052, .06)
        # Sixteenth-note pickup/pause avoids a constant one-note metronome.
        positions=[0, .75, 1.125, 1.875, 2.25, 2.625]
        degrees=[1, 3, 2, 4, 2, 3] if bar%2==0 else [2, 1, 3, 2, 4, 3]
        for index,(position,degree) in enumerate(zip(positions,degrees)):
            event(events, at+position, 'pluck', notes[degree]+12, .95,
                  .043+(index%3)*.008, -.40 if index%2 else .40)
        event(events, at, 'boom', 40, 1.30, .070, -.14)
        if bar%4!=3:event(events, at+1.5, 'boom', 48, .75, .030, .17)
        for beat in range(4):
            event(events, at+beat*.75+.375, 'brush', 76, .13, .014+(beat%2)*.004,
                  -.45 if beat%2 else .45)
        if bar in [3, 7, 11, 15]:
            event(events, at+2.25, 'bell', notes[3]+24, 2.2, .023, .60)
        if bar%8 in [1, 3, 5]:
            event(events, at+.75, 'piano', notes[3]+12, 1.8, .063, -.10)
            event(events, at+1.875, 'piano', notes[2]+12, 1.6, .052, .12)
    # Melody is a development of the opening, not a different stock cue.
    for at,note,duration in [(0,74,1.35),(1.5,69,1.10),(3,77,1.45),(4.875,76,1.15),
        (6,74,1.35),(7.5,72,1.10),(9,69,1.70),(12,70,1.40),(13.875,69,1.0),
        (15,67,1.35),(18,65,1.15),(19.5,64,1.20),(21,69,1.70),
        (24,74,1.4),(25.5,77,1.1),(27,81,1.3),(28.875,79,1.1),
        (30,77,1.4),(31.5,76,1.0),(33,74,1.5),(36,70,1.5),
        (38.25,69,1.0),(39,67,1.35),(42,64,1.1),(43.5,69,1.35),(45,73,1.75)]:
        event(events,at,'piano',note,duration+1.1,.066 if at<24 else .077,-.08)
    return dict(id='chapter1_voyage_score_v1',title='El rastro entre las estrellas',bpm=80,
                duration=48.0,loop=True,masterPeakDbFS=-7,events=events,
                landmarks={'departure':0,'space':12,'development':24,'approach':36,'loopEnd':48})


def envelope(count, attack=.01, release=.2):
    result=np.ones(count,dtype=np.float64)
    a=min(count,int(SR*attack)); r=min(count-a,int(SR*release))
    if a:result[:a]=np.sin(np.linspace(0,np.pi/2,a))**2
    if r:result[-r:]=np.cos(np.linspace(0,np.pi/2,r))**2
    return result


def voice(item):
    instrument=item['instrument']; duration=item['duration']
    count=max(2,int(round(duration*SR))); t=np.arange(count)/SR
    f=440*2**((item['note']-69)/12)
    digest=hashlib.sha256(json.dumps(item,sort_keys=True).encode()).digest()
    random=np.random.default_rng(SEED+int.from_bytes(digest[:4],'little'))
    noise=random.standard_normal(count)
    if instrument=='pluck':
        # Karplus-Strong: a filtered noise excitation circulates through a
        # fractional-loss string delay. It is not a triggered sine beep.
        period=max(3,int(round(SR/f)))
        excitation=np.zeros(count); excitation[:period]=noise[:period]*.30
        # Process whole delay periods; a dense IIR denominator would waste
        # thousands of zero-coefficient multiplies on each rendered sample.
        history=np.concatenate([np.zeros(1),excitation])
        for begin in range(period,count,period):
            end=min(count,begin+period)
            history[begin+1:end+1]+=.495*(history[begin-period+1:end-period+1]+
                                                       history[begin-period:end-period])
        value=history[1:]
        value=signal.sosfilt(signal.butter(2,min(f*7,7000),fs=SR,output='sos'),value)
        value*=envelope(count,.004,.22)
    elif instrument in ('pad','strings','brass'):
        value=np.zeros(count)
        harmonics=7 if instrument=='pad' else 11
        vibrato=.0013*np.sin(2*np.pi*4.7*t)
        for detune,weight in [(-.0017,.27),(0,.46),(.0015,.27)]:
            phase=2*np.pi*f*(1+detune)*t+vibrato*np.sin(2*np.pi*f*t)*.2
            for harmonic in range(1,harmonics+1):
                falloff=1.75 if instrument=='pad' else 1.35 if instrument=='strings' else 1.1
                if f*harmonic>15000:break
                value+=np.sin(phase*harmonic+harmonic*.07)*weight/(harmonic**falloff)
        cutoff=1800 if instrument=='pad' else 4500 if instrument=='strings' else 2400
        value=signal.sosfilt(signal.butter(2,cutoff,fs=SR,output='sos'),value)*.32
        if instrument=='strings':
            value+=signal.sosfilt(signal.butter(2,[800,5000],btype='bandpass',fs=SR,output='sos'),noise)*.012
        value*=envelope(count,.24 if instrument!='brass' else .075,.65)
    elif instrument=='piano':
        modulator=2.0*np.exp(-t*2.5)*np.sin(2*np.pi*f*2.002*t)
        value=np.sin(2*np.pi*f*t+modulator)*np.exp(-t*1.40)*.44
        value+=np.sin(2*np.pi*f*3.005*t)*np.exp(-t*3.9)*.08
        value*=envelope(count,.006,.35)
    elif instrument=='bell':
        value=sum(np.sin(2*np.pi*f*ratio*t)*np.exp(-t*decay)*gain for ratio,decay,gain in
                  [(1,1.2,.40),(2.756,2.5,.18),(5.404,3.6,.08),(7.98,5.4,.025)])
        value*=envelope(count,.005,.40)
    elif instrument=='bass':
        value=np.sin(2*np.pi*f*t)*.62
        for harmonic in range(2,7):value+=np.sin(2*np.pi*f*harmonic*t)*.11/harmonic
        value=np.tanh(value*1.2)*np.exp(-t*.36)*envelope(count,.025,.25)
    elif instrument=='boom':
        phase=2*np.pi*(42*t+38*.09*(1-np.exp(-t/.09)))
        value=np.sin(phase)*np.exp(-t*4)*.75
        value+=np.sin(2*np.pi*93*t)*np.exp(-t*8)*.18
        value+=signal.sosfilt(signal.butter(2,1800,fs=SR,output='sos'),noise)*np.exp(-t*25)*.18
        value*=envelope(count,.003,.22)
    elif instrument=='brush':
        value=signal.sosfilt(signal.butter(2,[4500,11000],btype='bandpass',fs=SR,output='sos'),noise)
        value*=np.exp(-t*34)*envelope(count,.003,.04)*.38
    elif instrument=='rise':
        value=signal.sosfilt(signal.butter(2,[220,4200],btype='bandpass',fs=SR,output='sos'),noise)
        value*=np.linspace(.01,1,count)**2*envelope(count,.1,.015)*.28
        value+=np.sin(2*np.pi*(f*t+f*.6*t*t/max(.1,duration)))*np.linspace(0,.055,count)
    else:raise ValueError(instrument)
    return value.astype(np.float32)


def reverb(dry):
    # Parallel feedback combs and two all-pass diffusers; source is authored
    # from scratch, with no borrowed impulse response or convolution sample.
    wet=np.zeros_like(dry)
    for channel in [0,1]:
        summed=np.zeros(len(dry),dtype=np.float32)
        for ms,feedback in [(31.1,.83),(37.3,.81),(41.7,.79),(47.9,.77)]:
            delay=int(SR*(ms+channel*1.7)/1000)
            comb=dry[:,channel].copy()
            for begin in range(delay,len(comb),delay):
                end=min(len(comb),begin+delay)
                comb[begin:end]+=feedback*comb[begin-delay:end-delay]
            summed+=comb*.095
        for ms in [5.3,1.7]:
            delay=int(SR*(ms+channel*.3)/1000)
            incoming=summed.copy();summed=incoming*-.5
            for begin in range(delay,len(summed),delay):
                end=min(len(summed),begin+delay)
                summed[begin:end]+=incoming[begin-delay:end-delay]+.5*summed[begin-delay:end-delay]
        wet[:,channel]=signal.sosfilt(signal.butter(2,5800,fs=SR,output='sos'),summed)
    return wet


def render(cue):
    length=cue['duration']; cycles=3 if cue['loop'] else 1
    dry=np.zeros((int((length*cycles+5)*SR),2),dtype=np.float32)
    # Identical per-event seeds on every cycle give a periodic source, so the
    # center render already contains its real previous chord/reverb tails.
    for item in cue['events']:
        mono=voice(item)*item['gain']
        pan=(item['pan']+1)*np.pi/4
        stereo=np.column_stack([mono*np.cos(pan),mono*np.sin(pan)])
        for cycle in range(cycles):
            begin=int(round((item['at']+cycle*length)*SR));end=begin+len(stereo)
            dry[begin:end]+=stereo
    mix=dry+reverb(dry)*.66
    # A quiet, musical stereo echo on the complete score is less intrusive
    # than audible ping-pong on every transient.
    delay=int(SR*(.375 if cue['loop'] else .46875))
    mix[delay:,0]+=dry[:-delay,1]*.070
    mix[delay*2:,1]+=dry[:-delay*2,0]*.050
    if cue['loop']:
        mix=mix[int(length*SR):int(length*2*SR)].copy()
    else:
        mix=mix[:int(length*SR)].copy()
        fade=int(.9*SR);mix[-fade:]*=np.cos(np.linspace(0,np.pi/2,fade))[:,None]**2
        mix[:int(.025*SR)]*=np.linspace(0,1,int(.025*SR))[:,None]
    # Gentle analogue-style bus saturation, never hard sample clipping.
    return (np.tanh(mix*1.12)*.85).astype(np.float32)


def varlen(number):
    result=[number&127];number>>=7
    while number:result.insert(0,(number&127)|128);number>>=7
    return bytes(result)


def write_midi(cue,path):
    ppq=480;tempo=round(60000000/cue['bpm'])
    events=[(0,b'\xff\x51\x03'+tempo.to_bytes(3,'big'))]
    for instrument,(channel,program) in PROGRAMS.items():
        if channel!=9:events.append((0,bytes([0xc0|channel,program])))
    for item in cue['events']:
        channel,_=PROGRAMS[item['instrument']]
        at=round(item['at']*cue['bpm']/60*ppq)
        end=round((item['at']+item['duration']*.8)*cue['bpm']/60*ppq)
        velocity=max(12,min(115,round(item['gain']*330)))
        events.extend([(at,bytes([0x90|channel,item['note'],velocity])),
                       (end,bytes([0x80|channel,item['note'],0]))])
    track=bytearray();last=0
    for tick,data in sorted(events,key=lambda pair:pair[0]):
        track+=varlen(tick-last)+data;last=tick
    track+=b'\x00\xff\x2f\x00'
    path.write_bytes(b'MThd'+struct.pack('>IHHH',6,0,1,ppq)+b'MTrk'+struct.pack('>I',len(track))+track)


def main():
    OUT.mkdir(parents=True,exist_ok=True);ASSETS.mkdir(exist_ok=True)
    for cue in [opening(),voyage()]:
        raw=render(cue)
        peak=float(np.max(np.abs(raw)))
        # Measured original mix gets constant gain only. Avoid time-varying
        # automatic loudness processing that can expose a seam in the loop.
        target_peak=10**(cue['masterPeakDbFS']/20)
        raw*=target_peak/max(peak,1e-9)
        with tempfile.TemporaryDirectory(prefix='neon-score-') as temporary:
            premaster=Path(temporary)/'float.wav';wavfile.write(premaster,SR,raw)
            master=OUT/f"{cue['id']}.wav"
            subprocess.run(['ffmpeg','-v','error','-y','-i',str(premaster),'-c:a','pcm_s24le',str(master)],check=True)
            export=ASSETS/f"{cue['id']}.m4a"
            subprocess.run(['ffmpeg','-v','error','-y','-i',str(master),'-c:a','aac','-b:a','112k',
                            '-ar',str(SR),'-movflags','+faststart',str(export)],check=True)
        write_midi(cue,OUT/f"{cue['id']}.mid")
        (OUT/f"{cue['id']}.json").write_text(json.dumps(cue,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({'id':cue['id'],'duration':cue['duration'],'events':len(cue['events']),
          'sampleRate':SR,'channels':2,'peakDbFS':float(20*np.log10(np.max(np.abs(raw)))),
          'rmsDbFS':float(20*np.log10(np.sqrt(np.mean(raw**2)))),
          'seamDelta':float(np.max(np.abs(raw[0]-raw[-1]))) if cue['loop'] else None,
          'runtimeBytes':export.stat().st_size,'masterBytes':master.stat().st_size,
          'runtimeSha256':hashlib.sha256(export.read_bytes()).hexdigest()}),flush=True)


if __name__=='__main__':main()
