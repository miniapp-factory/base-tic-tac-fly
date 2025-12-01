"use client";

import { useEffect, useRef, useState } from "react";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;

const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 5;

const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 10;
const BULLET_SPEED = 7;

const BLOCK_WIDTH = 40;
const BLOCK_HEIGHT = 20;
const BLOCK_SPEED = 2;
const BLOCK_SPAWN_INTERVAL = 1500;

const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 20;
const ENEMY_SPEED = 2;
const ENEMY_SPAWN_INTERVAL = 1000;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerX, setPlayerX] = useState((CANVAS_WIDTH - PLAYER_WIDTH) / 2);
  const [bullets, setBullets] = useState<{ x: number; y: number }[]>([]);
  const [blocks, setBlocks] = useState<{ x: number; y: number }[]>([]);
  const [enemies, setEnemies] = useState<{ x: number; y: number }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Handle key events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.code === "ArrowLeft") {
        setPlayerX((prev) => Math.max(prev - PLAYER_SPEED, 0));
      } else if (e.code === "ArrowRight") {
        setPlayerX((prev) => Math.min(prev + PLAYER_SPEED, CANVAS_WIDTH - PLAYER_WIDTH));
      } else if (e.code === "Space") {
        // shoot
        setBullets((prev) => [
          ...prev,
          { x: playerX + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2, y: CANVAS_HEIGHT - PLAYER_HEIGHT - BULLET_HEIGHT },
        ]);
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
    let lastBlockSpawn = Date.now();

    const update = () => {
      // Move bullets
      setBullets((prev) =>
        prev
          .map((b) => ({ ...b, y: b.y - BULLET_SPEED }))
          .filter((b) => b.y + BULLET_HEIGHT > 0)
      );

      // Move blocks
      setBlocks((prev) =>
        prev
          .map((b) => ({ ...b, y: b.y + BLOCK_SPEED }))
          .filter((b) => b.y < CANVAS_HEIGHT)
      );

      // Move enemies
      setEnemies((prev) =>
        prev.map((e) => {
          let newX = e.x + ENEMY_SPEED;
          if (newX > CANVAS_WIDTH) newX = -ENEMY_WIDTH;
          return { x: newX, y: e.y };
        })
      );

      // Spawn blocks
      if (Date.now() - lastBlockSpawn > BLOCK_SPAWN_INTERVAL) {
        const x = Math.random() * (CANVAS_WIDTH - BLOCK_WIDTH);
        setBlocks((prev) => [...prev, { x, y: -BLOCK_HEIGHT }]);
        lastBlockSpawn = Date.now();
      }

      // Spawn enemies
      if (Date.now() - lastBlockSpawn > ENEMY_SPAWN_INTERVAL) {
        const x = Math.random() * (CANVAS_WIDTH - ENEMY_WIDTH);
        setEnemies((prev) => [...prev, { x, y: -ENEMY_HEIGHT }]);
        lastBlockSpawn = Date.now();
      }

      // Collision detection
      setBullets((prevBullets) => {
        const remainingBullets = [...prevBullets];
        setBlocks((prevBlocks) => {
          const remainingBlocks = [...prevBlocks];
          remainingBullets.forEach((b, bi) => {
            remainingBlocks.forEach((blk, bi2) => {
              if (
                b.x < blk.x + BLOCK_WIDTH &&
                b.x + BULLET_WIDTH > blk.x &&
                b.y < blk.y + BLOCK_HEIGHT &&
                b.y + BULLET_HEIGHT > blk.y
              ) {
                // hit block
                remainingBullets.splice(bi, 1);
                remainingBlocks.splice(bi2, 1);
                setScore((s) => s + 1);
              }
            });
          });
          return remainingBlocks;
        });
        setEnemies((prevEnemies) => {
          const remainingEnemies = [...prevEnemies];
          remainingBullets.forEach((b, bi) => {
            remainingEnemies.forEach((enm, ei) => {
              if (
                b.x < enm.x + ENEMY_WIDTH &&
                b.x + BULLET_WIDTH > enm.x &&
                b.y < enm.y + ENEMY_HEIGHT &&
                b.y + BULLET_HEIGHT > enm.y
              ) {
                // hit enemy
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

      // Check if any block reaches bottom
      if (blocks.some((b) => b.y + BLOCK_HEIGHT >= CANVAS_HEIGHT)) {
        setGameOver(true);
      }

      // Draw
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw player
      ctx.fillStyle = "#ff0";
      ctx.fillRect(playerX, CANVAS_HEIGHT - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT);

      // Draw bullets
      ctx.fillStyle = "#fff";
      bullets.forEach((b) => ctx.fillRect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT));

      // Draw blocks
      ctx.fillStyle = "#f00";
      blocks.forEach((b) => ctx.fillRect(b.x, b.y, BLOCK_WIDTH, BLOCK_HEIGHT));

      // Draw enemies
      ctx.fillStyle = "#0f0";
      enemies.forEach((e) => ctx.fillRect(e.x, e.y, ENEMY_WIDTH, ENEMY_HEIGHT));

      // Draw score
      ctx.fillStyle = "#fff";
      ctx.font = "20px sans-serif";
      ctx.fillText(`Score: ${score}`, 10, 20);

      if (!gameOver) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#fff";
        ctx.font = "36px sans-serif";
        ctx.fillText("Game Over", CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT / 2);
        ctx.font = "24px sans-serif";
        ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT / 2 + 40);
      }
    };

    animationFrameId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animationFrameId);
  }, [playerX, bullets, blocks, score, gameOver]);

  const restart = () => {
    setScore(0);
    setBullets([]);
    setBlocks([]);
    setGameOver(false);
    setPlayerX((CANVAS_WIDTH - PLAYER_WIDTH) / 2);
  };

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-300 bg-blue-200"
      />
      <div className="absolute top-2 left-2 text-sm text-white bg-black bg-opacity-50 p-2 rounded">Use ←/→ to move, Space to shoot</div>
      <p className="mt-4 text-lg">Score: {score}</p>
      {gameOver && (
        <button
          onClick={restart}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
        >
          Restart
        </button>
      )}
    </div>
  );
}
