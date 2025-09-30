import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh } from 'three';

interface CharacterProps {
  position: Vector3;
  path: Vector3[];
  isMoving: boolean;
  onMoveComplete: () => void;
  onPositionChange?: (newPosition: Vector3) => void;
}

const Character: React.FC<CharacterProps> = ({ position, path, isMoving, onMoveComplete, onPositionChange }) => {
  const meshRef = useRef<Mesh>(null);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<Vector3>(position.clone());
  const [targetPosition, setTargetPosition] = useState<Vector3>(position.clone());
  
  const MOVE_SPEED = 4; // units per second (adjusted for smoother diagonal movement)

  useEffect(() => {
    if (isMoving && path.length > 0) {
      setCurrentPathIndex(0);
      setCurrentPosition(position.clone());
      setTargetPosition(path[0]);
    }
  }, [isMoving, path, position]);

  useFrame((state, delta) => {
    if (!isMoving || path.length === 0 || !meshRef.current) return;

    const distance = currentPosition.distanceTo(targetPosition);
    
    if (distance < 0.15) { // Slightly larger threshold for smoother diagonal movement
      // Reached current waypoint, move to next
      const nextIndex = currentPathIndex + 1;
      
      if (nextIndex >= path.length) {
        // Path completed
        onMoveComplete();
        setCurrentPathIndex(0);
        return;
      }
      
      setCurrentPathIndex(nextIndex);
      setCurrentPosition(targetPosition.clone());
      setTargetPosition(path[nextIndex]);
    } else {
      // Move towards current target
      const direction = new Vector3().subVectors(targetPosition, currentPosition).normalize();
      const moveDistance = MOVE_SPEED * delta;
      const newPosition = currentPosition.clone().add(direction.multiplyScalar(moveDistance));
      
      setCurrentPosition(newPosition);
      
      // Update mesh position
      meshRef.current.position.copy(newPosition);
      
      // Make character face movement direction
      if (direction.length() > 0) {
        // Calculate the angle to face the movement direction
        const angle = Math.atan2(direction.x, direction.z);
        meshRef.current.rotation.y = angle;
      }
    }
  });

  // Update mesh position when not moving
  useEffect(() => {
    if (!isMoving && meshRef.current) {
      meshRef.current.position.copy(position);
      setCurrentPosition(position.clone());
      setTargetPosition(position.clone());
    }
  }, [position, isMoving]);

  return (
    <group>
      {/* Character body (simple capsule-like shape) */}
      <mesh ref={meshRef} position={position} castShadow>
        <group>
          {/* Body */}
          <mesh position={[0, 0, 0]}>
            <capsuleGeometry args={[0.3, 1]} />
            <meshLambertMaterial color="#3498db" />
          </mesh>
          
          {/* Head */}
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.2]} />
            <meshLambertMaterial color="#f39c12" />
          </mesh>
          
          {/* Eyes */}
          <mesh position={[0.1, 0.85, 0.15]}>
            <sphereGeometry args={[0.03]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh position={[-0.1, 0.85, 0.15]}>
            <sphereGeometry args={[0.03]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          
          {/* Direction indicator (shows which way character is facing) */}
          <mesh position={[0, 0.5, 0.4]}>
            <coneGeometry args={[0.1, 0.2]} />
            <meshLambertMaterial color="#e74c3c" />
          </mesh>
        </group>
      </mesh>
      
      {/* Character shadow helper */}
      <mesh position={[currentPosition.x, 0.01, currentPosition.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4]} />
        <meshBasicMaterial color="#000000" opacity={0.2} transparent />
      </mesh>
    </group>
  );
};

export default Character;