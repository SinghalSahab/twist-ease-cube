
import React, { useRef, useState } from 'react';
import RubiksCube from '@/components/RubiksCube';
import CubeControls from '@/components/CubeControls';

const Index = () => {
  const cubeRef = useRef<any>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const handleMoveClick = (move: string) => {
    if (cubeRef.current && !isAnimating) {
      setIsAnimating(true);
      cubeRef.current.performMove(move);
      
      // Reset animation state after a delay to cover the animation duration
      setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Slightly longer than the animation duration (500ms)
    }
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-gradient-to-b from-rubik-background to-gray-900">
      <header className="w-full py-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight animate-fade-in">
          Interactive Rubik's Cube
        </h1>
        <p className="mt-2 text-gray-300 opacity-90">Rotate, twist and solve!</p>
      </header>
      
      <main className="w-full max-w-6xl mx-auto flex-grow flex flex-col items-center justify-center p-4">
        <div className="h-[500px] w-full mb-8 bg-opacity-30 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
          <RubiksCube ref={cubeRef} />
        </div>
        
        <CubeControls onMoveClick={handleMoveClick} isAnimating={isAnimating} />
      </main>
      
      <footer className="w-full py-4 text-center text-gray-400 text-sm">
        <p>Drag to rotate the entire cube. Use buttons to make Rubik's cube moves.</p>
      </footer>
    </div>
  );
};

export default Index;
