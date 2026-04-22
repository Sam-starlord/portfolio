const toggle = document.getElementById("theme-toggle");
const canvas = document.getElementById("constellation-canvas");

if (toggle) {
  toggle.addEventListener("click", () => {
    const currentTheme = document.body.dataset.theme;
    document.body.dataset.theme = currentTheme === "cool" ? "warm" : "cool";
  });
}

if (canvas) {
  const context = canvas.getContext("2d");
  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false,
    dragging: false,
    radius: 180
  };
  let animationFrame = 0;
  let stars = [];
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  const orbitNodes = Array.from({ length: 6 }, (_, index) => ({
    angle: (Math.PI * 2 * index) / 6,
    radius: 34 + index * 9
  }));

  function createStars(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      size: Math.random() * 1.8 + 0.6,
      twinkle: Math.random() * Math.PI * 2
    }));
  }

  function getThemeColors() {
    const isCool = document.body.dataset.theme === "cool";
    return isCool
      ? {
          line: "255, 170, 245",
          glow: "255, 208, 250",
          node: "246, 235, 255"
        }
      : {
          line: "116, 217, 255",
          glow: "155, 240, 255",
          node: "233, 244, 255"
        };
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = createStars(Math.max(70, Math.floor((width * height) / 14000)));
  }

  function setPointer(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }

  function clearPointer() {
    pointer.active = false;
    pointer.dragging = false;
  }

  function updateStars(time) {
    for (const star of stars) {
      const dx = pointer.x - star.x;
      const dy = pointer.y - star.y;
      const distance = Math.hypot(dx, dy) || 1;
      const influence = pointer.active ? Math.max(0, 1 - distance / pointer.radius) : 0;
      const pull = pointer.dragging ? 0.055 : 0.025;

      star.baseX += star.vx;
      star.baseY += star.vy;

      if (star.baseX < -20) star.baseX = width + 20;
      if (star.baseX > width + 20) star.baseX = -20;
      if (star.baseY < -20) star.baseY = height + 20;
      if (star.baseY > height + 20) star.baseY = -20;

      star.x += (star.baseX - star.x) * 0.03 + (dx / distance) * influence * pointer.radius * pull;
      star.y += (star.baseY - star.y) * 0.03 + (dy / distance) * influence * pointer.radius * pull;
      star.twinkle += 0.015;
    }

    drawScene(time);
    animationFrame = requestAnimationFrame(updateStars);
  }

  function drawScene(time) {
    context.clearRect(0, 0, width, height);
    const colors = getThemeColors();

    for (let i = 0; i < stars.length; i += 1) {
      const star = stars[i];
      const alpha = 0.45 + Math.sin(time * 0.001 + star.twinkle) * 0.25;

      context.beginPath();
      context.fillStyle = `rgba(${colors.node}, ${alpha})`;
      context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      context.fill();

      for (let j = i + 1; j < stars.length; j += 1) {
        const neighbor = stars[j];
        const dx = neighbor.x - star.x;
        const dy = neighbor.y - star.y;
        const distance = Math.hypot(dx, dy);
        const maxDistance = pointer.dragging ? 135 : 92;

        if (distance < maxDistance) {
          const strength = 1 - distance / maxDistance;
          context.beginPath();
          context.strokeStyle = `rgba(${colors.line}, ${strength * (pointer.dragging ? 0.35 : 0.18)})`;
          context.lineWidth = pointer.dragging ? 1.15 : 0.7;
          context.moveTo(star.x, star.y);
          context.lineTo(neighbor.x, neighbor.y);
          context.stroke();
        }
      }
    }

    drawConstellationMesh(colors);
    drawPointerOrbit(time, colors);

    if (pointer.active) {
      const gradient = context.createRadialGradient(
        pointer.x,
        pointer.y,
        0,
        pointer.x,
        pointer.y,
        pointer.radius
      );
      gradient.addColorStop(0, `rgba(${colors.line}, ${pointer.dragging ? 0.18 : 0.12})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(pointer.x, pointer.y, pointer.radius, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawConstellationMesh(colors) {
    if (!pointer.active) {
      return;
    }

    const nearest = stars
      .map((star) => ({
        star,
        distance: Math.hypot(pointer.x - star.x, pointer.y - star.y)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6)
      .map((item) => item.star);

    if (nearest.length < 3) {
      return;
    }

    for (let i = 0; i < nearest.length - 2; i += 1) {
      const a = nearest[i];
      const b = nearest[i + 1];
      const c = nearest[i + 2];
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.lineTo(c.x, c.y);
      context.closePath();
      context.fillStyle = `rgba(${colors.line}, ${pointer.dragging ? 0.085 : 0.04})`;
      context.fill();
      context.strokeStyle = `rgba(${colors.glow}, ${pointer.dragging ? 0.2 : 0.1})`;
      context.lineWidth = 0.7;
      context.stroke();
    }
  }

  function drawPointerOrbit(time, colors) {
    if (!pointer.active) {
      return;
    }

    const orbitRadius = pointer.dragging ? 72 : 52;
    const orbitPoints = orbitNodes.map((node, index) => {
      const angle = node.angle + time * 0.0012 * (index % 2 === 0 ? 1 : -1);
      const radius = pointer.dragging ? node.radius + 10 : node.radius;
      return {
        x: pointer.x + Math.cos(angle) * Math.min(orbitRadius + radius * 0.18, pointer.radius - 18),
        y: pointer.y + Math.sin(angle) * Math.min(orbitRadius + radius * 0.18, pointer.radius - 18)
      };
    });

    context.beginPath();
    context.strokeStyle = `rgba(${colors.glow}, ${pointer.dragging ? 0.28 : 0.14})`;
    context.lineWidth = 1;
    context.arc(pointer.x, pointer.y, orbitRadius, 0, Math.PI * 2);
    context.stroke();

    for (let i = 0; i < orbitPoints.length; i += 1) {
      const point = orbitPoints[i];
      const next = orbitPoints[(i + 1) % orbitPoints.length];

      context.beginPath();
      context.strokeStyle = `rgba(${colors.line}, ${pointer.dragging ? 0.3 : 0.14})`;
      context.lineWidth = 0.85;
      context.moveTo(point.x, point.y);
      context.lineTo(next.x, next.y);
      context.stroke();

      context.beginPath();
      context.fillStyle = `rgba(${colors.glow}, 0.9)`;
      context.arc(point.x, point.y, pointer.dragging ? 2.6 : 2, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.strokeStyle = `rgba(${colors.line}, ${pointer.dragging ? 0.22 : 0.1})`;
      context.moveTo(pointer.x, pointer.y);
      context.lineTo(point.x, point.y);
      context.stroke();
    }
  }

  resize();
  animationFrame = requestAnimationFrame(updateStars);

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", setPointer);
  window.addEventListener("pointerdown", (event) => {
    setPointer(event);
    pointer.dragging = true;
  });
  window.addEventListener("pointerup", () => {
    pointer.dragging = false;
  });
  window.addEventListener("pointerleave", clearPointer);
  window.addEventListener("blur", clearPointer);
}
