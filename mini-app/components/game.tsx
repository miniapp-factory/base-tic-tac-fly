"use client";

import { useEffect, useRef, useState } from "react";

const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const PLAYER_X = 180; // center for 400 width
const PLAYER_Y = 580;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      setPlayerX((canvas.width - PLAYER_WIDTH) / 2);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (
        x >= playerX &&
        x <= playerX + PLAYER_WIDTH &&
        y >= PLAYER_Y &&
        y <= PLAYER_Y + PLAYER_HEIGHT
      ) {
        setScore((s) => s + 1);
      }
    };
    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [playerX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw player
      ctx.fillStyle = "#ff0";
      ctx.fillRect(playerX, PLAYER_Y, PLAYER_WIDTH, PLAYER_HEIGHT);
      // Draw score
      ctx.fillStyle = "#fff";
      ctx.font = "20px sans-serif";
      ctx.fillText(`Score: ${score}`, 10, 20);
      requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(0);
  }, [playerX, score]);

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
