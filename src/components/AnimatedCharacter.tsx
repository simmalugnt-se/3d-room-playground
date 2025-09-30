import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Vector3, Group } from 'three';

interface AnimatedCharacterProps {
  position: Vector3;
  path: Vector3[];
  isMoving: boolean;
  onMoveComplete: () => void;
}

const AnimatedCharacter: React.FC<AnimatedCharacterProps> = ({ 
  position, 
  path, 
  isMoving, 
  onMoveComplete 
}) => {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF('/models/soldier.glb');
  const { actions } = useAnimations(animations, group);
  
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<Vector3>(position.clone());
  const [targetPosition, setTargetPosition] = useState<Vector3>(position.clone());
  
  const MOVE_SPEED = 4; // units per second

  // Animation control
  useEffect(() => {
    if (actions) {
      // Debug: Log available animations
      console.log('Available animations:', Object.keys(actions));
      console.log('Character is moving:', isMoving);
      
      // Stop all animations first
      Object.values(actions).forEach(action => action?.stop());
      
      if (isMoving) {
        // Try common walking animation names
        const walkAction = actions['Walk'] || actions['Running'] || actions['walk'] || actions['run'];
        
        if (walkAction) {
          console.log('Playing walk animation');
          walkAction.reset().play();
        } else {
          console.log('No walk animation found, trying first available');
          const firstAction = Object.values(actions)[0];
          if (firstAction) {
            firstAction.reset().play();
          }
        }
      } else {
        // Try common idle animation names
        const idleAction = actions['Idle'] || actions['idle'] || actions['TPose'];
        
        if (idleAction) {
          console.log('Playing idle animation');
          idleAction.reset().play();
        } else {
          console.log('No idle animation found');
        }
      }
    }
  }, [isMoving, actions]);

  // Path management
  useEffect(() => {
    if (isMoving && path.length > 0) {
      setCurrentPathIndex(0);
      setCurrentPosition(position.clone());
      setTargetPosition(path[0]);
    }
  }, [isMoving, path, position]);

  // Animation loop
  useFrame((state, delta) => {
    if (!isMoving || path.length === 0 || !group.current) return;

    const distance = currentPosition.distanceTo(targetPosition);
    
    if (distance < 0.15) {
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
      group.current.position.copy(newPosition);
      group.current.position.y = 0; // Keep on ground
      
      // Make character face movement direction
      if (direction.length() > 0) {
        const angle = Math.atan2(direction.x, direction.z);
        group.current.rotation.y = angle;
      }
    }
  });

  // Update position when not moving
  useEffect(() => {
    if (!isMoving && group.current) {
      group.current.position.copy(position);
      group.current.position.y = 0; // Keep on ground
      setCurrentPosition(position.clone());
      setTargetPosition(position.clone());
    }
  }, [position, isMoving]);

  // Set initial position and scale
  useEffect(() => {
    if (group.current) {
      group.current.position.copy(position);
      group.current.scale.setScalar(1); // Keep original scale for now
      group.current.position.y = 0; // Make sure it's on the ground
    }
  }, []);

  return (
    <group>
      <primitive 
        ref={group}
        object={scene.clone()} 
        castShadow
        receiveShadow
      />
      
      {/* Character shadow helper */}
      <mesh position={[currentPosition.x, 0.01, currentPosition.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4]} />
        <meshBasicMaterial color="#000000" opacity={0.2} transparent />
      </mesh>
    </group>
  );
};

// Preload the model
useGLTF.preload('/models/soldier.glb');

export default AnimatedCharacter;