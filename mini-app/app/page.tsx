"use client";

import { description, title } from "@/lib/metadata";
import { generateMetadata } from "@/lib/farcaster-embed";
import Game from "@/components/game";
import { useState } from "react";

export { generateMetadata };

export default function Home() {
  const [started, setStarted] = useState(false);
  return (
    <main className="flex flex-col gap-3 place-items-center place-content-center px-4 grow">
      <span className="text-2xl">{title}</span>
      <span className="text-muted-foreground">{description}</span>
      {!started && (
        <>
          <p className="text-center">
            Use arrow keys to move the Base logo and spacebar to shoot. Destroy
            enemies before they reach the bottom!
          </p>
          <button
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded"
            onClick={() => setStarted(true)}
          >
            Start Game
          </button>
        </>
      )}
      {started && <Game />}
    </main>
  );
}
