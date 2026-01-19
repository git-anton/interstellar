document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("melody-sound");
  const missionButton = document.getElementById("mission-btn");
  const missionOverlay = document.getElementById("mission-overlay");
  const missionClose = document.getElementById("mission-close");
  const missionCanvas = document.getElementById("mission-sim");

  let audioContext = null;
  let masterGain = null;
  let noteTimer = null;
  let isStopping = false;
  let isPlaying = false;

  const melodyNotes = [55.0, 82.41, 110.0, 164.81, 123.47, 98.0, 73.42];
  let noteIndex = 0;

  const playNote = (frequency, startTime, duration) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = "sine";
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0, startTime);
    gain.gain.linearRampToValueAtTime(0.06, startTime + 0.4);
    gain.gain.linearRampToValueAtTime(0.0, startTime + duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  };

  const scheduleMelody = () => {
    if (!audioContext || isStopping) return;
    const now = audioContext.currentTime;
    const base = melodyNotes[noteIndex % melodyNotes.length];
    const intervals = [0, 7, 12];
    intervals.forEach((interval, i) => {
      const frequency = base * Math.pow(2, interval / 12);
      playNote(frequency, now + i * 0.18, 1.4);
    });
    noteIndex += 1;
    noteTimer = window.setTimeout(scheduleMelody, 1100);
  };

  const startTone = () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.0;
    masterGain.connect(audioContext.destination);
    masterGain.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 1.4);

    isStopping = false;
    scheduleMelody();
  };

  const stopTone = () => {
    if (!audioContext) return;
    isStopping = true;
    if (noteTimer) window.clearTimeout(noteTimer);
    masterGain.gain.linearRampToValueAtTime(0.0, audioContext.currentTime + 0.8);
    const contextToClose = audioContext;
    audioContext = null;
    window.setTimeout(() => {
      contextToClose.close();
    }, 900);
  };

  if (button) {
    button.addEventListener("click", () => {
      if (!isPlaying) {
        startTone();
        button.textContent = "Original ähnlicher Soundtrack stoppen";
      } else {
        stopTone();
        button.textContent = "Original ähnlicher Soundtrack hören";
      }
      isPlaying = !isPlaying;
    });
  }

  if (missionButton && missionOverlay && missionClose && missionCanvas) {
    const ctx = missionCanvas.getContext("2d");
    if (!ctx) return;
    let stars = [];
    let rafId = null;
    let simActive = false;
    let blackoutTimer = null;
    let simStartTime = 0;
    const simDuration = 8000;
    const suckDuration = 2000;
    const blackPhaseDuration = 800;
    const singularityDuration = 1500;

    const resize = () => {
      const rect = missionCanvas.getBoundingClientRect();
      missionCanvas.width = rect.width;
      missionCanvas.height = rect.height;
      const count = Math.min(220, Math.floor(rect.width / 6));
      stars = Array.from({ length: count }, () => ({
        x: (Math.random() * 2 - 1) * rect.width,
        y: (Math.random() * 2 - 1) * rect.height,
        z: Math.random() * rect.width,
      }));
    };

    const smoothStep = (t) => t * t * (3 - 2 * t);

    const render = () => {
      if (!simActive) return;
      const elapsed = performance.now() - simStartTime;
      const w = missionCanvas.width;
      const h = missionCanvas.height;
      const centerX = w / 2;
      const centerY = h / 2;
      const baseSpeed = Math.max(6, w / 120);
      const approachProgress = smoothStep(Math.min(1, elapsed / simDuration));
      const inSuck = elapsed > simDuration - suckDuration;
      const rawProgress = inSuck ? Math.min(1, (elapsed - (simDuration - suckDuration)) / suckDuration) : 0;
      const suckProgress = smoothStep(rawProgress);
      const speed = inSuck ? baseSpeed * (1 + suckProgress * 2.4) : baseSpeed;
      const zoom = 280 + approachProgress * 520;
      const tunnelStrength = 0.6 + approachProgress * 1.4;

      const fade = 0.32 + approachProgress * 0.18;
      ctx.fillStyle = `rgba(9, 14, 18, ${fade})`;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(230, 193, 138, 0.9)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();

      stars.forEach((star) => {
        const prevZ = star.z + speed;
        const sx = (star.x / star.z) * zoom + centerX;
        const sy = (star.y / star.z) * zoom + centerY;
        const px = (star.x / prevZ) * zoom + centerX;
        const py = (star.y / prevZ) * zoom + centerY;

        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);

        if (inSuck) {
          const pull = 0.95 - suckProgress * 0.18;
          star.x *= pull;
          star.y *= pull;
          star.z -= speed * 1.45;
        } else {
          star.x *= 1 - 0.002 * tunnelStrength;
          star.y *= 1 - 0.002 * tunnelStrength;
          star.z -= speed * (1 + approachProgress * 0.6);
        }
        if (star.z < 1) {
          star.x = (Math.random() * 2 - 1) * w;
          star.y = (Math.random() * 2 - 1) * h;
          star.z = w;
        }
      });

      ctx.stroke();

      drawBlackhole(approachProgress, inSuck ? suckProgress : 0);

      rafId = window.requestAnimationFrame(render);
    };

    const drawBlackhole = (progress = 1, engulfProgress = 0) => {
      const w = missionCanvas.width;
      const h = missionCanvas.height;
      const centerX = w / 2;
      const centerY = h / 2;
      if (progress <= 0.04) return;
      const eased = (progress - 0.04) / 0.96;
      const baseRadius = Math.min(w, h) * (0.02 + eased * 0.38);
      const maxRadius = Math.hypot(w, h) * 0.6;
      const radius = baseRadius + maxRadius * engulfProgress;

      const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.4, centerX, centerY, radius * 1.8);
      glow.addColorStop(0, "rgba(0, 0, 0, 0)");
      glow.addColorStop(0.6, `rgba(230, 193, 138, ${0.2 + eased * 0.3})`);
      glow.addColorStop(1, "rgba(230, 193, 138, 0.0)");

      ctx.fillStyle = "rgba(7, 10, 14, 0.35)";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      const swallow = Math.min(1, engulfProgress * 1.2);
      if (swallow > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${swallow})`;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawBlackScreen = () => {
      const w = missionCanvas.width;
      const h = missionCanvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, w, h);
    };

    const drawSingularity = () => {
      const w = missionCanvas.width;
      const h = missionCanvas.height;
      const centerX = w / 2;
      const centerY = h / 2;
      const radius = Math.min(w, h) * 0.012;

      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 6);
      glow.addColorStop(0, "rgba(255, 255, 255, 1)");
      glow.addColorStop(0.4, "rgba(220, 230, 255, 0.8)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 1)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const startSim = () => {
      if (simActive) return;
      simActive = true;
      missionOverlay.classList.add("active");
      simStartTime = performance.now();
      resize();
      render();
      if (blackoutTimer) window.clearTimeout(blackoutTimer);
      window.setTimeout(() => {
        stopSim();
        drawSingularity();
            blackoutTimer = window.setTimeout(() => {
              closeOverlay();
            }, singularityDuration);
      }, simDuration);
    };

    const stopSim = () => {
      if (!simActive) return;
      simActive = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = null;
    };

    const closeOverlay = () => {
      missionOverlay.classList.remove("active");
      ctx.clearRect(0, 0, missionCanvas.width, missionCanvas.height);
    };

    window.addEventListener("resize", resize);
    missionButton.addEventListener("click", startSim);
    missionClose.addEventListener("click", () => {
      stopSim();
      if (blackoutTimer) window.clearTimeout(blackoutTimer);
      closeOverlay();
    });
    missionOverlay.addEventListener("click", (event) => {
      if (event.target === missionOverlay) {
        stopSim();
        if (blackoutTimer) window.clearTimeout(blackoutTimer);
        closeOverlay();
      }
    });
  }
});
