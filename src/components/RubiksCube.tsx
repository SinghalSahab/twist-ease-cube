
import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Define the colors for each face of the Rubik's Cube
const FACE_COLORS = {
  front: '#FF0000',  // Red
  back: '#FF8C00',   // Orange
  up: '#FFFFFF',     // White
  down: '#FFFF00',   // Yellow
  right: '#0000FF',  // Blue
  left: '#00FF00'    // Green
};

interface CubieProps {
  position: [number, number, number];
  colors?: (string | null)[];
}

// A small cubie that makes up the Rubik's Cube
const Cubie: React.FC<CubieProps> = ({ position, colors = [] }) => {
  const size = 0.95;
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Change to useRef instead of useMemo for materials
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>(
    colors.map(c => new THREE.MeshStandardMaterial({ 
      color: c || '#333333',
      transparent: true,
      opacity: 1
    }))
  );

  return (
    <mesh 
      ref={meshRef}
      position={position}
      material={materialsRef.current}
      castShadow 
      receiveShadow
    >
      <boxGeometry args={[size, size, size]} />
    </mesh>
  );
};

interface RubiksCubeSceneProps {
  onCubeInitialized?: (moveData: any) => void;
  currentAnimation?: CubeAnimation | null;
  onAnimationComplete?: () => void;  // Add this
}

// Create a 3x3x3 Rubik's Cube
const RubiksCubeScene = forwardRef<any, RubiksCubeSceneProps>((props, ref) => {
  const { onCubeInitialized, currentAnimation, onAnimationComplete } = props;
  const cubeGroup = useRef<THREE.Group>(new THREE.Group());
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  
  // Expose methods to parent component using imperative handle
  useImperativeHandle(ref, () => ({
    performMove: (move: string) => {
      if (!cubeGroup.current) return;
      
      let axis: number;
      let index: number;
      let direction: number;
      
      // Parse the move notation
      switch (move) {
        case 'U': axis = 1; index = 1; direction = -1; break;
        case "U'": axis = 1; index = 1; direction = 1; break;
        case 'D': axis = 1; index = -1; direction = 1; break;
        case "D'": axis = 1; index = -1; direction = -1; break;
        case 'R': axis = 0; index = 1; direction = -1; break;
        case "R'": axis = 0; index = 1; direction = 1; break;
        case 'L': axis = 0; index = -1; direction = 1; break;
        case "L'": axis = 0; index = -1; direction = -1; break;
        case 'F': axis = 2; index = 1; direction = -1; break;
        case "F'": axis = 2; index = 1; direction = 1; break;
        case 'B': axis = 2; index = -1; direction = 1; break;
        case "B'": axis = 2; index = -1; direction = -1; break;
        default: return;
      }
      
      if (onCubeInitialized) {
        onCubeInitialized({ axis, index, direction });
      }
    }
  }));
  
  // Initialize camera position
  useEffect(() => {
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Handle animations and rotations
  useFrame((_, delta) => {
    if (currentAnimation && cubeGroup.current) {
      const isComplete = currentAnimation.update(delta);
      if (isComplete) {
        currentAnimation.finish();
        onAnimationComplete?.();
      }
    }
  });

  // Generate the 27 cubies that make up a 3x3x3 Rubik's cube
  const cubies = [];
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      const position = [x, y, z] as [number, number, number];
      const colors = [
        x === 1 ? FACE_COLORS.right : null,
        x === -1 ? FACE_COLORS.left : null,
        y === 1 ? FACE_COLORS.up : null,
        y === -1 ? FACE_COLORS.down : null,
        z === 1 ? FACE_COLORS.front : null,
        z === -1 ? FACE_COLORS.back : null
      ];
      
      cubies.push(
        <Cubie key={`${x}-${y}-${z}`} position={position} colors={colors} />
      );
    }
  }
}

  return (
    <group ref={cubeGroup}>
      {cubies}
      <OrbitControls 
        ref={controlsRef}
        enableZoom={true}
        enablePan={false}
        dampingFactor={0.2}
        rotateSpeed={0.7}
        minDistance={5}
        maxDistance={15}
      />
    </group>
  );
});

interface MoveData {
  axis: number;
  index: number;
  direction: number;
}

// Animation class to handle cube rotations
class CubeAnimation {
  group: THREE.Group;
  axis: number;
  index: number;
  direction: number;
  onComplete: () => void;
  progress: number;
  duration: number;
  rotationGroup: THREE.Group | null = null;

  constructor(group: THREE.Group, axis: number, index: number, direction: number, onComplete: () => void) {
    this.group = group;
    this.axis = axis;
    this.index = index;
    this.direction = direction;
    this.onComplete = onComplete;
    this.progress = 0;
    this.duration = 0.3;
    this.createRotationGroup();
  }

  private originalStates = new WeakMap<THREE.Mesh, {
    position: THREE.Vector3;
    materials: THREE.Material[];
    quaternion: THREE.Quaternion;
  }>();

   private faceColorTransitions = new WeakMap<THREE.Mesh, {
    startColors: THREE.Color[];
    targetColors: THREE.Color[];
  }>();
  private originalPositions = new WeakMap<THREE.Mesh, THREE.Vector3>();
  private originalQuaternions = new WeakMap<THREE.Mesh, THREE.Quaternion>();

  createRotationGroup() {
    this.rotationGroup = new THREE.Group();
    const axisVector = new THREE.Vector3(
      this.axis === 0 ? 1 : 0,
      this.axis === 1 ? 1 : 0,
      this.axis === 2 ? 1 : 0
    );

     this.group.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const position = child.position.clone();
        if (Math.round(position.getComponent(this.axis)) === this.index) {
          // Store original position and rotation
          this.originalPositions.set(child, position.clone());
          this.originalQuaternions.set(child, child.quaternion.clone());
          
          // Move to rotation group
          this.group.remove(child);
          this.rotationGroup!.add(child);
          
          // Center the cubie relative to rotation axis
          child.position.sub(axisVector.clone().multiplyScalar(this.index));
        }
      }
    });

    // Position the rotation group correctly
    this.rotationGroup.position.copy(axisVector.multiplyScalar(this.index));
    this.group.add(this.rotationGroup);
  }


  update(delta: number): boolean {
    if (!this.rotationGroup) return true;

    this.progress = Math.min(this.progress + delta / this.duration, 1);
    const eased = this.easeInOutCubic(this.progress);
    const angle = (Math.PI / 2) * eased * this.direction;

    // Apply rotation
    if (this.axis === 0) this.rotationGroup.rotation.x = angle;
    if (this.axis === 1) this.rotationGroup.rotation.y = angle;
    if (this.axis === 2) this.rotationGroup.rotation.z = angle;

    // Return true if animation is complete
    return this.progress >= 1;
  }
  finish() {
    if (!this.rotationGroup) return;

    const axisVector = new THREE.Vector3(
      this.axis === 0 ? 1 : 0,
      this.axis === 1 ? 1 : 0,
      this.axis === 2 ? 1 : 0
    );

    while (this.rotationGroup.children.length > 0) {
      const child = this.rotationGroup.children[0] as THREE.Mesh;
      const originalPosition = this.originalPositions.get(child);
      const originalQuaternion = this.originalQuaternions.get(child);

      if (originalPosition && originalQuaternion) {
        // Calculate new position
        const newPosition = originalPosition.clone();
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
          axisVector,
          (Math.PI / 2) * this.direction
        );
        newPosition.applyMatrix4(rotationMatrix);

        // Snap to grid
        newPosition.x = Math.round(newPosition.x);
        newPosition.y = Math.round(newPosition.y);
        newPosition.z = Math.round(newPosition.z);

        // Restore child to main group
        child.position.copy(newPosition);
        child.quaternion.copy(originalQuaternion);
        child.rotation.set(0, 0, 0); // Reset any leftover rotation
        child.updateMatrixWorld();
      }

      this.rotationGroup.remove(child);
      this.group.add(child);
    }

    // Clean up
    this.group.remove(this.rotationGroup);
    this.rotationGroup = null;
    this.originalPositions = new WeakMap();
    this.originalQuaternions = new WeakMap();
    this.onComplete();
  }

  easeInOutCubic(x: number) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
}
// Main component that wraps everything
const RubiksCube = forwardRef<any, {}>((props, ref) => {
  const sceneRef = useRef<any>(null);
  const [cubeGroup, setCubeGroup] = useState<THREE.Group | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<CubeAnimation | null>(null);
  const [moveQueue, setMoveQueue] = useState<Array<MoveData>>([]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Handle cube initialization
  const handleCubeInitialized = (moveData: MoveData) => {
    setMoveQueue(prevQueue => [...prevQueue, moveData]);
  };
   console.log('Move queue:', moveQueue);
  console.log('Cube group:', cubeGroup);
  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    performMove: (move: string) => {
      if (sceneRef.current) {
        sceneRef.current.performMove(move);
      }
    },
    isAnimating: () => isAnimating
  }));
   console.log('Animation status:', isAnimating);
  // Process the move queue
  useEffect(() => {
    if (moveQueue.length > 0 && cubeGroup && !currentAnimation) {
      setIsAnimating(true);
      console.log('Processing move queue:', moveQueue);
      const nextMove = moveQueue[0];
      const newMoveQueue = [...moveQueue];
      newMoveQueue.shift();
      console.log('Next move:', nextMove);
      console.log('Current animation:', currentAnimation);
      console.log('New move queue:', newMoveQueue);
      const animation = new CubeAnimation(
  cubeGroup,
  nextMove.axis,
  nextMove.index,
  nextMove.direction,
  () => {
    // This callback is now called by finish()
    setCurrentAnimation(null);
    setMoveQueue(newMoveQueue);
    if (newMoveQueue.length === 0) {
      setIsAnimating(false);
    }
  }
);
setCurrentAnimation(animation);
      console.log('Starting animation:', animation);
    }
  }, [moveQueue, cubeGroup, currentAnimation]);

  // Set up Three.js scene when the first layer is found
  const handleSceneMount = (state: any) => {
    const scene = state.scene;
    // Find the Group object by traversing the scene
    scene.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Group && !(object instanceof THREE.Scene)) {
        setCubeGroup(object);
      }
    });
  };

  return (
    <div className="h-full w-full">
      <Canvas shadows onCreated={handleSceneMount}>
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={0.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <RubiksCubeScene 
          ref={sceneRef}
          onCubeInitialized={handleCubeInitialized}
          currentAnimation={currentAnimation}
        />
      </Canvas>
    </div>
  );
});

export default RubiksCube;
