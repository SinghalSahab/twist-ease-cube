
import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
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
  const size = 0.95; // Slightly smaller than 1 to create gaps between cubies
  const geometry = new THREE.BoxGeometry(size, size, size);
  
  // Create materials for each face
  const materials = [
    new THREE.MeshStandardMaterial({ color: colors[0] || '#333333' }), // Right
    new THREE.MeshStandardMaterial({ color: colors[1] || '#333333' }), // Left
    new THREE.MeshStandardMaterial({ color: colors[2] || '#333333' }), // Top
    new THREE.MeshStandardMaterial({ color: colors[3] || '#333333' }), // Bottom
    new THREE.MeshStandardMaterial({ color: colors[4] || '#333333' }), // Front
    new THREE.MeshStandardMaterial({ color: colors[5] || '#333333' })  // Back
  ];

  return (
    <mesh position={position} geometry={geometry} material={materials} castShadow receiveShadow>
      <boxGeometry args={[size, size, size]} />
    </mesh>
  );
};

interface RubiksCubeSceneProps {
  onCubeInitialized?: (moveData: any) => void;
  currentAnimation?: CubeAnimation | null;
}

// Create a 3x3x3 Rubik's Cube
const RubiksCubeScene = forwardRef<any, RubiksCubeSceneProps>((props, ref) => {
  const { onCubeInitialized, currentAnimation } = props;
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
  useFrame((state, delta) => {
    if (currentAnimation && cubeGroup.current) {
      // Apply current animation if there is one
      currentAnimation.update(delta);
    }
  });

  // Generate the 27 cubies that make up a 3x3x3 Rubik's cube
  const cubies = [];
  const positions = [-1, 0, 1];
  
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      for (let z = 0; z < 3; z++) {
        const position = [positions[x], positions[y], positions[z]] as [number, number, number];
        const colors = [
          x === 2 ? FACE_COLORS.right : null,  // Right face (x = 1)
          x === 0 ? FACE_COLORS.left : null,   // Left face (x = -1)
          y === 2 ? FACE_COLORS.up : null,     // Up face (y = 1)
          y === 0 ? FACE_COLORS.down : null,   // Down face (y = -1)
          z === 2 ? FACE_COLORS.front : null,  // Front face (z = 1)
          z === 0 ? FACE_COLORS.back : null    // Back face (z = -1)
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
  rotationGroup: THREE.Group;

  constructor(group: THREE.Group, axis: number, index: number, direction: number, onComplete: () => void) {
    this.group = group;
    this.axis = axis;
    this.index = index;
    this.direction = direction;
    this.onComplete = onComplete;
    this.progress = 0;
    this.duration = 0.5; // Animation duration in seconds
    this.rotationGroup = this.createRotationGroup();
  }

  createRotationGroup() {
    const rotationGroup = new THREE.Group();
    
    // Find all cubies that belong to the layer we want to rotate
    this.group.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        // Check if the cubie is on the specific layer
        if (Math.round(child.position[this.axis]) === this.index) {
          // Clone position to avoid reference issues
          const pos = child.position.clone();
          // Remove from main group, add to rotation group
          this.group.remove(child);
          rotationGroup.add(child);
          // Maintain position
          child.position.copy(pos);
        }
      }
    });

    this.group.add(rotationGroup);
    return rotationGroup;
  }

  update(delta: number) {
    this.progress += delta / this.duration;

    if (this.progress >= 1) {
      this.progress = 1;
      this.finish();
      return true;
    }

    // Easing function for smooth animation
    const eased = this.easeInOutCubic(this.progress);
    const angle = (Math.PI / 2) * eased * this.direction;

    // Apply rotation based on axis
    if (this.axis === 0) { // X axis
      this.rotationGroup.rotation.x = angle;
    } else if (this.axis === 1) { // Y axis
      this.rotationGroup.rotation.y = angle;
    } else if (this.axis === 2) { // Z axis
      this.rotationGroup.rotation.z = angle;
    }

    return false;
  }

  easeInOutCubic(x: number) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  finish() {
    // Reintegrate cubies into the main group after rotation
    while (this.rotationGroup.children.length > 0) {
      const child = this.rotationGroup.children[0];
      const worldPos = new THREE.Vector3();
      child.getWorldPosition(worldPos);
      
      this.rotationGroup.remove(child);
      this.group.add(child);
      
      // Round position to fix floating point errors
      child.position.x = Math.round(worldPos.x);
      child.position.y = Math.round(worldPos.y);
      child.position.z = Math.round(worldPos.z);
    }
    
    // Remove the rotation group
    this.group.remove(this.rotationGroup);
    
    if (this.onComplete) {
      this.onComplete();
    }
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

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    performMove: (move: string) => {
      if (sceneRef.current) {
        sceneRef.current.performMove(move);
      }
    },
    isAnimating: () => isAnimating
  }));

  // Process the move queue
  useEffect(() => {
    if (moveQueue.length > 0 && cubeGroup && !currentAnimation) {
      setIsAnimating(true);
      
      const nextMove = moveQueue[0];
      const newMoveQueue = [...moveQueue];
      newMoveQueue.shift();
      
      const animation = new CubeAnimation(
        cubeGroup,
        nextMove.axis,
        nextMove.index,
        nextMove.direction,
        () => {
          setCurrentAnimation(null);
          setMoveQueue(newMoveQueue);
          if (newMoveQueue.length === 0) {
            setIsAnimating(false);
          }
        }
      );
      
      setCurrentAnimation(animation);
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
