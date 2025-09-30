import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';

interface SimpleAnimatedCharacterProps {
  position: Vector3;
  path: Vector3[];
  isMoving: boolean;
  onMoveComplete: () => void;
  color?: string;
  name?: string;
}

const SimpleAnimatedCharacter: React.FC<SimpleAnimatedCharacterProps> = ({ 
  position, 
  path, 
  isMoving, 
  onMoveComplete,
  color = '#3498db',
  name = 'Player'
}) => {
  const groupRef = useRef<Group>(null);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<Vector3>(position.clone());
  const [targetPosition, setTargetPosition] = useState<Vector3>(position.clone());
  const [animationTime, setAnimationTime] = useState(0);
  
  const MOVE_SPEED = 4;

  // Path management
  useEffect(() => {
    if (isMoving && path.length > 0) {
      console.log('Starting movement with path:', path);
      setCurrentPathIndex(0);
      setCurrentPosition(position.clone());
      setTargetPosition(path[0]);
    }
  }, [isMoving, path, position]);

  // Animation loop
  useFrame((state, delta) => {
    setAnimationTime(prev => prev + delta);
    
    if (!isMoving || path.length === 0 || !groupRef.current) {
      return;
    }

    const distance = currentPosition.distanceTo(targetPosition);
    
    if (distance < 0.15) {
      // Reached current waypoint, move to next
      const nextIndex = currentPathIndex + 1;
      
      if (nextIndex >= path.length) {
        // Path completed
        console.log('Path completed');
        onMoveComplete();
        setCurrentPathIndex(0);
        return;
      }
      
      console.log(`Moving to waypoint ${nextIndex}`);
      setCurrentPathIndex(nextIndex);
      setCurrentPosition(targetPosition.clone());
      setTargetPosition(path[nextIndex]);
    } else {
      // Move towards current target
      const direction = new Vector3().subVectors(targetPosition, currentPosition).normalize();
      const moveDistance = MOVE_SPEED * delta;
      const newPosition = currentPosition.clone().add(direction.multiplyScalar(moveDistance));
      
      setCurrentPosition(newPosition);
      
      // Update group position - this should definitely work
      groupRef.current.position.copy(newPosition);
      
      // Make character face movement direction
      if (direction.length() > 0) {
        const angle = Math.atan2(direction.x, direction.z);
        groupRef.current.rotation.y = angle;
      }
    }
  });

  // Update position when not moving
  useEffect(() => {
    if (!isMoving && groupRef.current) {
      console.log('Setting position to:', position);
      groupRef.current.position.copy(position);
      setCurrentPosition(position.clone());
      setTargetPosition(position.clone());
    }
  }, [position, isMoving]);

  // Walking animation - simple bobbing
  const walkBob = isMoving ? Math.sin(animationTime * 8) * 0.1 : 0;
  
  // Idle animation - subtle breathing and swaying
  const idleBreathe = !isMoving ? Math.sin(animationTime * 2) * 0.03 : 0;
  const idleSway = !isMoving ? Math.sin(animationTime * 1.5) * 0.02 : 0;
  const idleHeadBob = !isMoving ? Math.sin(animationTime * 3) * 0.01 : 0;

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh position={[idleSway, 1 + walkBob + idleBreathe, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.8]} />
        <meshLambertMaterial color={color} />
      </mesh>
      
      {/* Head */}
      <mesh position={[idleSway, 1.6 + walkBob + idleBreathe + idleHeadBob, 0]} castShadow>
        <sphereGeometry args={[0.2]} />
        <meshLambertMaterial color="#f39c12" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.1 + idleSway, 1.65 + walkBob + idleBreathe + idleHeadBob, 0.15]}>
        <sphereGeometry args={[0.03]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.1 + idleSway, 1.65 + walkBob + idleBreathe + idleHeadBob, 0.15]}>
        <sphereGeometry args={[0.03]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Left Leg */}
      <mesh position={[-0.15 + idleSway * 0.3, 0.3, isMoving ? Math.sin(animationTime * 10) * 0.1 : 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.6]} />
        <meshLambertMaterial color="#2c3e50" />
      </mesh>
      
      {/* Right Leg */}
      <mesh position={[0.15 + idleSway * 0.3, 0.3, isMoving ? -Math.sin(animationTime * 10) * 0.1 : 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.6]} />
        <meshLambertMaterial color="#2c3e50" />
      </mesh>
      
      {/* Left Arm */}
      <mesh position={[
        -0.4 + idleSway, 
        1.2 + walkBob + idleBreathe, 
        isMoving ? Math.sin(animationTime * 8) * 0.15 : Math.sin(animationTime * 2.5) * 0.03
      ]} castShadow>
        <capsuleGeometry args={[0.06, 0.5]} />
        <meshLambertMaterial color="#e67e22" />
      </mesh>
      
      {/* Right Arm */}
      <mesh position={[
        0.4 + idleSway, 
        1.2 + walkBob + idleBreathe, 
        isMoving ? -Math.sin(animationTime * 8) * 0.15 : -Math.sin(animationTime * 2.5) * 0.03
      ]} castShadow>
        <capsuleGeometry args={[0.06, 0.5]} />
        <meshLambertMaterial color="#e67e22" />
      </mesh>
      
      {/* Direction indicator (shows which way character is facing) */}
      <mesh position={[idleSway, 1.2 + walkBob + idleBreathe, 0.4]}>
        <coneGeometry args={[0.1, 0.2]} />
        <meshLambertMaterial color="#e74c3c" />
      </mesh>
      
      {/* Character shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4]} />
        <meshBasicMaterial color="#000000" opacity={0.2} transparent />
      </mesh>
      
      {/* Floating name label */}
      <mesh position={[idleSway, 2.5 + walkBob + idleBreathe, 0]}>
        <planeGeometry args={[1, 0.3]} />
        <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
      </mesh>
      
      {/* Name text placeholder (visual indicator) */}
      <mesh position={[idleSway, 2.6 + walkBob + idleBreathe, 0]}>
        <boxGeometry args={[0.8, 0.1, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
};

export default SimpleAnimatedCharacter;