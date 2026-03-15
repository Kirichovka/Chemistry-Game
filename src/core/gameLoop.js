export function createGameLoop({ canvas, store }) {
  const context = canvas.getContext('2d');
  const particles = Array.from({ length: 48 }, (_, index) => ({
    angle: (index / 48) * Math.PI * 2,
    radius: 90 + (index % 6) * 12,
    speed: 0.0015 + (index % 5) * 0.0004,
    size: 1.5 + (index % 4),
  }));

  let animationFrameId = null;

  function resize() {
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  function draw(timestamp) {
    const state = store.getState();
    const { width, height } = canvas.getBoundingClientRect();
    const centerX = width * 0.5;
    const centerY = height * 0.45;
    const oxygen = state.world.parameters.oxygen;
    const water = state.world.parameters.water;
    const life = state.world.parameters.lifeComplexity;

    context.clearRect(0, 0, width, height);

    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      30,
      centerX,
      centerY,
      220,
    );
    gradient.addColorStop(0, `rgba(${40 + life}, ${120 + water}, ${180 + oxygen}, 0.85)`);
    gradient.addColorStop(1, 'rgba(8, 17, 34, 0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(centerX, centerY, 220, 0, Math.PI * 2);
    context.fill();

    particles.forEach((particle) => {
      const angle = particle.angle + timestamp * particle.speed;
      const x = centerX + Math.cos(angle) * particle.radius;
      const y = centerY + Math.sin(angle) * particle.radius * 0.6;

      context.fillStyle = `rgba(${110 + oxygen}, ${170 + water}, ${200 + life}, 0.6)`;
      context.beginPath();
      context.arc(x, y, particle.size, 0, Math.PI * 2);
      context.fill();
    });

    if (state.settings.animationsEnabled) {
      animationFrameId = window.requestAnimationFrame(draw);
    }
  }

  function start() {
    resize();
    if (!animationFrameId) {
      animationFrameId = window.requestAnimationFrame(draw);
    }
  }

  function stop() {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  window.addEventListener('resize', resize);

  return {
    start,
    stop,
    resize,
  };
}
