
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateIcon } from 'lucide-react';

interface CubeControlsProps {
  onMoveClick: (move: string) => void;
}

const MoveButton = ({ move, label, onClick, icon }: { move: string; label?: string; onClick: (move: string) => void; icon?: React.ReactNode }) => {
  const isPrimeMove = move.includes("'");
  
  return (
    <Button 
      onClick={() => onClick(move)}
      className={`relative px-4 py-2 ${isPrimeMove ? 'bg-rubik-button-hover' : 'bg-rubik-button'} hover:bg-rubik-button-hover text-white font-medium rounded-md transition-all duration-200 shadow-md hover:shadow-lg`}
      size="sm"
    >
      {icon ? (
        <span className="flex items-center">
          {icon}
          <span className="ml-1">{label || move}</span>
        </span>
      ) : (
        <span>{label || move}</span>
      )}
    </Button>
  );
};

const CubeControls: React.FC<CubeControlsProps> = ({ onMoveClick }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-gray-100 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Cube Controls</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-center font-semibold mb-1">Up Face</h3>
          <div className="flex justify-center gap-2">
            <MoveButton move="U" onClick={onMoveClick} icon={<ArrowUp size={16} />} />
            <MoveButton move="U'" onClick={onMoveClick} icon={<ArrowUp size={16} />} />
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <h3 className="text-center font-semibold mb-1">Down Face</h3>
          <div className="flex justify-center gap-2">
            <MoveButton move="D" onClick={onMoveClick} icon={<ArrowDown size={16} />} />
            <MoveButton move="D'" onClick={onMoveClick} icon={<ArrowDown size={16} />} />
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <h3 className="text-center font-semibold mb-1">Left Face</h3>
          <div className="flex justify-center gap-2">
            <MoveButton move="L" onClick={onMoveClick} icon={<ArrowLeft size={16} />} />
            <MoveButton move="L'" onClick={onMoveClick} icon={<ArrowLeft size={16} />} />
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <h3 className="text-center font-semibold mb-1">Right Face</h3>
          <div className="flex justify-center gap-2">
            <MoveButton move="R" onClick={onMoveClick} icon={<ArrowRight size={16} />} />
            <MoveButton move="R'" onClick={onMoveClick} icon={<ArrowRight size={16} />} />
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <h3 className="text-center font-semibold mb-1">Front Face</h3>
          <div className="flex justify-center gap-2">
            <MoveButton move="F" onClick={onMoveClick} icon={<RotateIcon size={16} />} />
            <MoveButton move="F'" onClick={onMoveClick} icon={<RotateIcon size={16} />} />
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <h3 className="text-center font-semibold mb-1">Back Face</h3>
          <div className="flex justify-center gap-2">
            <MoveButton move="B" onClick={onMoveClick} icon={<RotateIcon size={16} />} />
            <MoveButton move="B'" onClick={onMoveClick} icon={<RotateIcon size={16} />} />
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Click a button to rotate that face. Prime (') moves rotate counter-clockwise.</p>
      </div>
    </div>
  );
};

export default CubeControls;
