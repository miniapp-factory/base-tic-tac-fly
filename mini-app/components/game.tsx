"use client";

import { useEffect, useRef, useState } from "react";

const GRAVITY = 0.6;
const JUMP_STRENGTH = -10;
const OBSTACLE_GAP = 150;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_SPEED = 2;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [birdY, setBirdY] = useState(200);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [obstacles, setObstacles] = useState<
    { x: number; height: number }[]
  >([]);
  const [gameOver, setGameOver] = useState(false);

  // Handle jump
  const handleJump = () => {
    if (!gameOver) {
      setBirdVelocity(JUMP_STRENGTH);
    }
  };

  // Add event listeners for space or click
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") handleJump();
    };
    const handleClick = () => handleJump();

    window.addEventListener("keydown", handleKey);
    canvas.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("keydown", handleKey);
      canvas.removeEventListener("click", handleClick);
    };
  }, [handleJump, gameOver]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      // Update bird physics
      setBirdVelocity((v) => v + GRAVITY);
      setBirdY((y) => y + birdVelocity);

      // Add new obstacle
      if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < 400) {
        const height = Math.random() * (canvas.height - OBSTACLE_GAP - 100) + 50;
        setObstacles((prev) => [
          ...prev,
          { x: canvas.width, height, passed: false },
        ]);
      }

      // Move obstacles
      setObstacles((prev) =>
        prev
          .map((o) => ({ ...o, x: o.x - OBSTACLE_SPEED }))
          .filter((o) => o.x + OBSTACLE_WIDTH > 0)
      );

      // Collision detection
      const birdRect = { x: 50, y: birdY, width: 30, height: 30 };
      for (const o of obstacles) {
        const topRect = { x: o.x, y: 0, width: OBSTACLE_WIDTH, height: o.height };
        const bottomRect = {
          x: o.x,
          y: o.height + OBSTACLE_GAP,
          width: OBSTACLE_WIDTH,
          height: canvas.height - o.height - OBSTACLE_GAP,
        };
        if (
          rectIntersect(birdRect, topRect) ||
          rectIntersect(birdRect, bottomRect)
        ) {
          setGameOver(true);
          break;
        }
      }

      // Score
      for (const o of obstacles) {
        if (!o.passed && o.x + OBSTACLE_WIDTH < birdRect.x) {
          o.passed = true;
          setScore((s) => s + 1);
        }
      }

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw bird
      ctx.fillStyle = "#ff0";
      ctx.fillRect(birdRect.x, birdRect.y, birdRect.width, birdRect.height);

      // Draw obstacles
      ctx.fillStyle = "#0f0";
      for (const o of obstacles) {
        ctx.fillRect(o.x, 0, OBSTACLE_WIDTH, o.height);
        ctx.fillRect(
          o.x,
          o.height + OBSTACLE_GAP,
          OBSTACLE_WIDTH,
          canvas.height - o.height - OBSTACLE_GAP
        );
      }

      // Draw score
      ctx.fillStyle = "#fff";
      ctx.font = "24px sans-serif";
      ctx.fillText(`Score: ${score}`, 10, 30);

      if (!gameOver) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.font = "36px sans-serif";
        ctx.fillText("Game Over", canvas.width / 2 - 80, canvas.height / 2);
        ctx.font = "24px sans-serif";
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 80, canvas.height / 2 + 40);
      }
    };

    animationFrameId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animationFrameId);
  }, [birdVelocity, obstacles, score, gameOver, birdY]);

  const rectIntersect = (
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ) => {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  };

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={400}
        height={600}
        className="border border-gray-300 bg-blue-200"
      />
      <p className="mt-4 text-lg">Score: {score}</p>
    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";

const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 20;
const ENEMY_SPEED = 2;
const ENEMY_SPAWN_INTERVAL = 2000;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(0);
  const [bullets, setBullets] = useState<{ x: number; y: number }[]>([]);
  const [enemies, setEnemies] = useState<{ x: number; y: number; dir: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);

  // Initialize player position
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      setPlayerX((canvas.width - PLAYER_WIDTH) / 2);
    }
  }, []);

  // Handle key events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.code === "ArrowLeft") {
        setPlayerX((prev) => Math.max(prev - PLAYER_SPEED, 0));
      } else if (e.code === "ArrowRight") {
        setPlayerX((prev) => Math.min(prev + PLAYER_SPEED, 400 - PLAYER_WIDTH));
      } else if (e.code === "Space") {
        // shoot
        setBullets((prev) => [...prev, { x: playerX + PLAYER_WIDTH / 2, y: 580 }]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerX, gameOver]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastEnemySpawn = Date.now();

    const update = () => {
      // Move bullets
      setBullets((prev) =>
        prev
          .map((b) => ({ ...b, y: b.y - BULLET_SPEED }))
          .filter((b) => b.y > 0)
      );

      // Move enemies
      setEnemies((prev) =>
        prev
          .map((e) => ({ ...e, x: e.x + e.dir * ENEMY_SPEED }))
          .filter((e) => e.x > -ENEMY_WIDTH && e.x < 400)
      );

      // Spawn enemies
      if (Date.now() - lastEnemySpawn > ENEMY_SPAWN_INTERVAL) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = side === -1 ? -ENEMY_WIDTH : 400;
        setEnemies((prev) => [...prev, { x, y: 0, dir: side }]);
        lastEnemySpawn = Date.now();
      }

      // Collision detection
      setBullets((prevBullets) => {
        const remainingBullets = [...prevBullets];
        setEnemies((prevEnemies) => {
          const remainingEnemies = [...prevEnemies];
          remainingBullets.forEach((b, bi) => {
            remainingEnemies.forEach((e, ei) => {
              if (
                b.x > e.x &&
                b.x < e.x + ENEMY_WIDTH &&
                b.y > e.y &&
                b.y < e.y + ENEMY_HEIGHT
              ) {
                // hit
                remainingBullets.splice(bi, 1);
                remainingEnemies.splice(ei, 1);
                setScore((s) => s + 1);
              }
            });
          });
          return remainingEnemies;
        });
        return remainingBullets;
      });

      // Check collision with player
      enemies.forEach((e) => {
        if (
          e.x < playerX + PLAYER_WIDTH &&
          e.x + ENEMY_WIDTH > playerX &&
          e.y < 580 + PLAYER_HEIGHT &&
          e.y + ENEMY_HEIGHT > 580
        ) {
          setGameOver(true);
        }
      });

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw player
      ctx.fillStyle = "#ff0";
      ctx.fillRect(playerX, 580, PLAYER_WIDTH, PLAYER_HEIGHT);

      // Draw bullets
      ctx.fillStyle = "#fff";
      bullets.forEach((b) => ctx.fillRect(b.x, b.y, 4, 10));

      // Draw enemies
      ctx.fillStyle = "#f00";
      enemies.forEach((e) => ctx.fillRect(e.x, e.y, ENEMY_WIDTH, ENEMY_HEIGHT));

      // Draw score
      ctx.fillStyle = "#fff";
      ctx.font = "20px sans-serif";
      ctx.fillText(`Score: ${score}`, 10, 20);

      if (!gameOver) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.font = "36px sans-serif";
        ctx.fillText("Game Over", canvas.width / 2 - 80, canvas.height / 2);
        ctx.font = "24px sans-serif";
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 80, canvas.height / 2 + 40);
      }
    };

    animationFrameId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animationFrameId);
  }, [playerX, bullets, enemies, score, gameOver]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={400}
        height={600}
        className="border border-gray-300 bg-blue-200"
      />
      <p className="mt-4 text-lg">Score: {score}</p>
    </div>
  );
}
