import { useEffect, useRef } from "react";

type OceanCanvasProps = {
  paused: boolean;
  sailing: boolean;
  sailingDuration: number;
  wind: 1 | 2 | 3;
};

type OceanScene = {
  width: number;
  height: number;
  horizon: number;
  rowCount: number;
  columnCount: number;
  cellSize: number;
};

type OceanPoint = {
  x: number;
  y: number;
  depth: number;
  row: number;
  worldColumn: number;
};

const HORIZON_HEIGHT = 158;
const CELL_COLORS = ["#0c70b8", "#126fb5", "#1979ba", "#0b67ae", "#207fbe", "#0a61aa"];
const IDLE_FLOW_SPEED = 7;
const VISIBLE_WATER_PERSPECTIVE_SCALE = 0.58;

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function traceRoundedShape(context: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>) {
  const tension = 0.78;
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const following = points[(index + 2) % points.length];
    const controlOne = {
      x: current.x + ((next.x - previous.x) / 6) * tension,
      y: current.y + ((next.y - previous.y) / 6) * tension,
    };
    const controlTwo = {
      x: next.x - ((following.x - current.x) / 6) * tension,
      y: next.y - ((following.y - current.y) / 6) * tension,
    };

    context.bezierCurveTo(controlOne.x, controlOne.y, controlTwo.x, controlTwo.y, next.x, next.y);
  }

  context.closePath();
}

function hash(row: number, column: number, salt = 0) {
  let value = Math.imul(row + 101 + salt * 17, 374761393) ^ Math.imul(column + 307 - salt * 13, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function createOceanScene(width: number, height: number): OceanScene {
  const horizon = Math.min(HORIZON_HEIGHT, height * 0.34);
  const seaHeight = Math.max(1, height - horizon);
  const cellSize = 168;

  return {
    width,
    height,
    horizon,
    rowCount: Math.max(11, Math.ceil(seaHeight / 92) + 3),
    columnCount: Math.max(24, Math.ceil(width / (cellSize * 0.21)) + 10),
    cellSize,
  };
}

function projectOceanPoint(
  scene: OceanScene,
  row: number,
  screenColumn: number,
  worldColumn: number,
  flowRemainder: number,
  time: number,
  energy: number,
): OceanPoint {
  const depth = row / (scene.rowCount - 1);
  const perspective = Math.pow(depth, 1.48);
  const scale = mix(0.21, 1.18, Math.pow(depth, 0.88));
  const jitterX = (hash(row, worldColumn, 1) - 0.5) * scene.cellSize * mix(0.32, 0.46, depth);
  const jitterY = (hash(row, worldColumn, 2) - 0.5) * mix(5, 44, perspective);
  const wave =
    Math.sin(time * (0.32 + depth * 0.28) + hash(row, worldColumn, 3) * Math.PI * 2) *
    mix(0.5, 4.5, perspective) *
    (1 + energy * 0.1);
  const centeredColumn = screenColumn - (scene.columnCount - 1) / 2;

  return {
    x: scene.width / 2 + (centeredColumn * scene.cellSize - flowRemainder + jitterX) * scale,
    y: scene.horizon + 5 + perspective * (scene.height - scene.horizon + 64) + jitterY + wave,
    depth,
    row,
    worldColumn,
  };
}

function buildPointGrid(scene: OceanScene, flow: number, time: number, energy: number) {
  const baseWorldColumn = Math.floor(flow / scene.cellSize);
  const flowRemainder = flow % scene.cellSize;

  return Array.from({ length: scene.rowCount }, (_, row) =>
    Array.from({ length: scene.columnCount }, (_, column) =>
      projectOceanPoint(scene, row, column, baseWorldColumn + column, flowRemainder, time, energy),
    ),
  );
}

function traceCell(context: CanvasRenderingContext2D, topLeft: OceanPoint, topRight: OceanPoint, bottomRight: OceanPoint, bottomLeft: OceanPoint) {
  context.beginPath();
  context.moveTo(topLeft.x, topLeft.y);
  context.lineTo(topRight.x, topRight.y);
  context.lineTo(bottomRight.x, bottomRight.y);
  context.lineTo(bottomLeft.x, bottomLeft.y);
  context.closePath();
}

function drawOrganicEdge(context: CanvasRenderingContext2D, from: OceanPoint, to: OceanPoint, salt: number, energy: number) {
  const depth = (from.depth + to.depth) / 2;
  const foamChance = mix(0.22, 0.66, Math.pow(depth, 0.72));
  const edgeHash = hash(from.row + to.row, from.worldColumn + to.worldColumn, salt);

  if (edgeHash >= foamChance) {
    return;
  }

  const controlHash = hash(from.row + to.row, from.worldColumn + to.worldColumn, salt + 11) - 0.5;
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const length = Math.max(1, Math.hypot(deltaX, deltaY));
  const curve = controlHash * mix(5, 44, depth);
  const controlX = (from.x + to.x) / 2 + (-deltaY / length) * curve;
  const controlY = (from.y + to.y) / 2 + (deltaX / length) * curve;
  const baseWidth = mix(1.4, 14.5, Math.pow(depth, 0.86));
  const fragmentSeed = hash(from.row + to.row, from.worldColumn + to.worldColumn, salt + 19);
  const fragmentMode = hash(from.row + to.row, from.worldColumn + to.worldColumn, salt + 29);
  const fragmentVariation = hash(from.row + to.row, from.worldColumn + to.worldColumn, salt + 23);
  const fragmentStart = fragmentMode < 0.4 ? 0 : fragmentMode < 0.78 ? 0.28 + fragmentSeed * 0.2 : 0.12 + fragmentSeed * 0.34;
  const fragmentEnd = fragmentMode < 0.4 ? 0.54 + fragmentVariation * 0.34 : fragmentMode < 0.78 ? 1 : Math.min(0.9, fragmentStart + 0.22 + fragmentVariation * 0.26);
  const startsConnected = fragmentStart === 0;
  const endsConnected = fragmentEnd === 1;
  const pointOnCurve = (amount: number) => {
    const inverse = 1 - amount;
    return {
      x: inverse * inverse * from.x + 2 * inverse * amount * controlX + amount * amount * to.x,
      y: inverse * inverse * from.y + 2 * inverse * amount * controlY + amount * amount * to.y,
    };
  };
  const sampleCount = Math.max(7, Math.min(20, Math.ceil((length * (fragmentEnd - fragmentStart)) / Math.max(3, baseWidth * 0.9))));
  const innerRadiusScale = mix(0.58, 0.86, edgeHash / foamChance);
  const outerThickness = mix(1.4, 5.2, Math.pow(depth, 0.82)) * (1 + energy * 0.025);
  const sharedSamples = Array.from({ length: sampleCount + 1 }, (_, step) => {
    const localAmount = step / sampleCount;
    const amount = mix(fragmentStart, fragmentEnd, localAmount);
    const point = pointOnCurve(amount);
    const startEnvelope = startsConnected ? 1 : mix(0.42, 1, Math.min(1, localAmount * 3.2));
    const endEnvelope = endsConnected ? 1 : mix(0.42, 1, Math.min(1, (1 - localAmount) * 3.2));
    const texture =
      0.72 +
      Math.sin((step + fragmentSeed * 7) * 1.71) * 0.16 +
      (hash(from.row + step, from.worldColumn - step, salt + 47) - 0.5) * 0.18;

    return {
      ...point,
      radius: Math.max(0.8, baseWidth * innerRadiusScale * startEnvelope * endEnvelope * texture),
    };
  });
  const drawFoamLayer = (color: string, alpha: number, radiusOffset: number) => {
    const samples = sharedSamples.map((sample) => ({ ...sample, radius: sample.radius + radiusOffset }));

    const leftEdge = samples.map((sample, index) => {
      const previous = samples[Math.max(0, index - 1)];
      const next = samples[Math.min(samples.length - 1, index + 1)];
      const tangentX = next.x - previous.x;
      const tangentY = next.y - previous.y;
      const tangentLength = Math.max(1, Math.hypot(tangentX, tangentY));
      return {
        x: sample.x + (-tangentY / tangentLength) * sample.radius,
        y: sample.y + (tangentX / tangentLength) * sample.radius,
      };
    });
    const rightEdge = samples.map((sample, index) => {
      const previous = samples[Math.max(0, index - 1)];
      const next = samples[Math.min(samples.length - 1, index + 1)];
      const tangentX = next.x - previous.x;
      const tangentY = next.y - previous.y;
      const tangentLength = Math.max(1, Math.hypot(tangentX, tangentY));
      return {
        x: sample.x - (-tangentY / tangentLength) * sample.radius,
        y: sample.y - (tangentX / tangentLength) * sample.radius,
      };
    });

    const firstSample = samples[0];
    const secondSample = samples[1];
    const lastSample = samples[samples.length - 1];
    const beforeLastSample = samples[samples.length - 2];
    const startLength = Math.max(1, Math.hypot(secondSample.x - firstSample.x, secondSample.y - firstSample.y));
    const endLength = Math.max(1, Math.hypot(lastSample.x - beforeLastSample.x, lastSample.y - beforeLastSample.y));
    const startCap = {
      x: firstSample.x - ((secondSample.x - firstSample.x) / startLength) * firstSample.radius,
      y: firstSample.y - ((secondSample.y - firstSample.y) / startLength) * firstSample.radius,
    };
    const endCap = {
      x: lastSample.x + ((lastSample.x - beforeLastSample.x) / endLength) * lastSample.radius,
      y: lastSample.y + ((lastSample.y - beforeLastSample.y) / endLength) * lastSample.radius,
    };
    const outline = [...leftEdge, endCap, ...rightEdge.reverse(), startCap];

    traceRoundedShape(context, outline);
    context.fillStyle = color;
    context.globalAlpha = alpha;
    context.fill();
  };

  drawFoamLayer("#6cc9e7", mix(0.34, 0.62, depth), outerThickness);
  drawFoamLayer("#f5fdff", mix(0.68, 0.98, depth), 0);
}

function drawHorizon(context: CanvasRenderingContext2D, scene: OceanScene, time: number, energy: number) {
  const amplitude = 0.9 + energy * 0.42;
  const points: Array<[number, number]> = [];

  for (let x = -12; x <= scene.width + 12; x += 10) {
    points.push([
      x,
      scene.horizon + Math.sin(x * 0.027 + time * 0.34) * amplitude + Math.sin(x * 0.071 - time * 0.19) * amplitude * 0.38,
    ]);
  }

  const stroke = (offsetY: number, color: string, width: number, alpha: number) => {
    context.beginPath();
    points.forEach(([x, y], index) => (index === 0 ? context.moveTo(x, y + offsetY) : context.lineTo(x, y + offsetY)));
    context.strokeStyle = color;
    context.globalAlpha = alpha;
    context.lineWidth = width;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke();
  };

  stroke(3.5, "#69c6e8", 6, 0.68);
  stroke(0, "#e4faff", 2.2, 0.96);
}

function drawOcean(context: CanvasRenderingContext2D, scene: OceanScene, flow: number, time: number, energy: number) {
  context.clearRect(0, 0, scene.width, scene.height);

  const gradient = context.createLinearGradient(0, scene.horizon, 0, scene.height);
  gradient.addColorStop(0, "#48b4e4");
  gradient.addColorStop(0.24, "#2c9bd7");
  gradient.addColorStop(0.58, "#1176c2");
  gradient.addColorStop(1, "#064e9e");
  context.fillStyle = gradient;
  context.fillRect(0, scene.horizon, scene.width, scene.height - scene.horizon);

  context.save();
  context.beginPath();
  context.rect(0, scene.horizon, scene.width, scene.height - scene.horizon);
  context.clip();

  const points = buildPointGrid(scene, flow, time, energy);

  for (let row = 0; row < scene.rowCount - 1; row += 1) {
    for (let column = 0; column < scene.columnCount - 1; column += 1) {
      const topLeft = points[row][column];
      const topRight = points[row][column + 1];
      const bottomRight = points[row + 1][column + 1];
      const bottomLeft = points[row + 1][column];
      const depth = (topLeft.depth + bottomRight.depth) / 2;
      const colorIndex = Math.floor(hash(row, topLeft.worldColumn, 8) * CELL_COLORS.length);

      traceCell(context, topLeft, topRight, bottomRight, bottomLeft);
      context.fillStyle = CELL_COLORS[colorIndex];
      context.globalAlpha = mix(0.2, 0.6, depth);
      context.fill();
    }
  }

  for (let row = 0; row < scene.rowCount - 1; row += 1) {
    for (let column = 0; column < scene.columnCount; column += 1) {
      drawOrganicEdge(context, points[row][column], points[row + 1][column], 31, energy);
    }
  }

  context.restore();
  context.globalAlpha = 1;
  drawHorizon(context, scene, time, energy);
  context.globalAlpha = 1;
}

export function OceanCanvas({ paused, sailing, sailingDuration, wind }: OceanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionRef = useRef({ paused, sailing, sailingDuration, wind });

  useEffect(() => {
    motionRef.current = { paused, sailing, sailingDuration, wind };
  }, [paused, sailing, sailingDuration, wind]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;

    if (!canvas || !host) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });

    if (!context) {
      return;
    }

    let scene = createOceanScene(1, 1);
    let animationFrame = 0;
    let flow = 0;
    let currentSpeed = 0;
    let currentEnergy = 0;
    let previousTime = performance.now();
    let lastDrawTime = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const width = Math.max(1, Math.round(host.clientWidth));
      const height = Math.max(1, Math.round(host.clientHeight));
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      scene = createOceanScene(width, height);
      drawOcean(context, scene, flow, performance.now() / 1000, currentEnergy);
    };

    const render = (timestamp: number) => {
      const delta = Math.min(50, timestamp - previousTime) / 1000;
      previousTime = timestamp;
      const motion = motionRef.current;
      const islandStepRatio = window.innerWidth <= 700 ? 0.58 : 0.48;
      const islandDistance = window.innerWidth * islandStepRatio * motion.wind;
      const islandSpeed = motion.sailingDuration > 0 ? islandDistance / (motion.sailingDuration / 1000) : 0;
      const targetSpeed = reducedMotion.matches
        ? 0
        : motion.paused
          ? 0
          : motion.sailing
            ? islandSpeed / VISIBLE_WATER_PERSPECTIVE_SCALE
            : IDLE_FLOW_SPEED;
      const targetEnergy = motion.sailing && !motion.paused ? motion.wind : 0;
      const easing = 1 - Math.exp(-delta * 3.8);

      currentSpeed = targetSpeed;
      currentEnergy += (targetEnergy - currentEnergy) * easing;
      flow += currentSpeed * delta;

      const frameInterval = reducedMotion.matches ? 250 : 1000 / 40;
      if (!document.hidden && timestamp - lastDrawTime >= frameInterval) {
        drawOcean(context, scene, flow, timestamp / 1000, currentEnergy);
        lastDrawTime = timestamp;
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas className="bateau-game__ocean" ref={canvasRef} aria-hidden="true" />;
}
