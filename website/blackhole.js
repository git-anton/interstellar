document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector("#blackhole-sound");
  if (!button) return;

  let audioContext = null;
  let rumbleOsc = null;
  let noiseSource = null;
  let noiseFilter = null;
  let masterGain = null;
  let lfo = null;
  let lfoGain = null;
  let isPlaying = false;

  const startSound = () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    rumbleOsc = audioContext.createOscillator();
    noiseSource = audioContext.createBufferSource();
    noiseFilter = audioContext.createBiquadFilter();
    masterGain = audioContext.createGain();
    lfo = audioContext.createOscillator();
    lfoGain = audioContext.createGain();

    rumbleOsc.type = "sine";
    rumbleOsc.frequency.value = 32;

    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 120;
    noiseFilter.Q.value = 0.7;

    lfo.type = "sine";
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 8;

    lfo.connect(lfoGain);
    lfoGain.connect(rumbleOsc.frequency);

    masterGain.gain.value = 0.0;
    masterGain.connect(audioContext.destination);

    rumbleOsc.connect(masterGain);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(masterGain);

    rumbleOsc.start();
    noiseSource.start();
    lfo.start();

    masterGain.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 1.4);
  };

  const stopSound = () => {
    if (!audioContext) return;
    masterGain.gain.linearRampToValueAtTime(0.0, audioContext.currentTime + 0.8);
    const contextToClose = audioContext;
    audioContext = null;
    window.setTimeout(() => {
      rumbleOsc.stop();
      noiseSource.stop();
      lfo.stop();
      contextToClose.close();
    }, 900);
  };

  button.addEventListener("click", () => {
    if (!isPlaying) {
      startSound();
      button.textContent = "Sound stoppen";
    } else {
      stopSound();
      button.textContent = "Schwarzes Loch Sound";
    }
    isPlaying = !isPlaying;
  });
});
