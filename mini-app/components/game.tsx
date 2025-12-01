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
