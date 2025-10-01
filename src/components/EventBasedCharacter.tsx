import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh } from 'three';
import { Player } from '../contexts/PusherContext';

interface EventBasedCharacterProps {
  player: Player;
  color?: string;
  name?: string;
}

const EventBasedCharacter: React.FC<EventBasedCharacterProps> = ({ 
  player, 
  color = '#3498db', 
  name = 'Player' 
}) => {
  const meshRef = useRef<Mesh>(null);
  const [interpolatedPosition, setInterpolatedPosition] = useState<Vector3>(
    new Vector3(player.position.x, player.position.y, player.position.z)
  );
  const [facingDirection, setFacingDirection] = useState<number>(0);

  // Calculate interpolated position based on movement events
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (player.isMoving && player.targetPosition && player.velocity && player.movementStartTime) {
      // Calculate time elapsed since movement started
      const currentTime = Date.now();
      const elapsedTime = (currentTime - player.movementStartTime) / 1000; // Convert to seconds
      
      const startPos = new Vector3(player.position.x, player.position.y, player.position.z);
      const targetPos = new Vector3(player.targetPosition.x, player.targetPosition.y, player.targetPosition.z);
      
      // Calculate expected distance traveled
      const totalDistance = startPos.distanceTo(targetPos);
      const expectedDistance = Math.min(player.velocity * elapsedTime, totalDistance);
      
      if (expectedDistance >= totalDistance) {
        // Movement should be complete
        setInterpolatedPosition(targetPos.clone());
        setFacingDirection(Math.atan2(targetPos.x - startPos.x, targetPos.z - startPos.z));
      } else {
        // Interpolate position based on velocity and time
        const direction = new Vector3().subVectors(targetPos, startPos).normalize();
        const newPosition = startPos.clone().add(direction.multiplyScalar(expectedDistance));
        
        setInterpolatedPosition(newPosition);
        setFacingDirection(Math.atan2(direction.x, direction.z));
      }
    } else {
      // Not moving, use current position
      const currentPos = new Vector3(player.position.x, player.position.y, player.position.z);
      setInterpolatedPosition(currentPos);
    }

    // Update mesh position
    meshRef.current.position.copy(interpolatedPosition);
    meshRef.current.rotation.y = facingDirection;
  });

  // Handle position updates from sync events
  useEffect(() => {
    if (!player.isMoving) {
      const syncPos = new Vector3(player.position.x, player.position.y, player.position.z);
      setInterpolatedPosition(syncPos);
    }
  }, [player.position, player.isMoving]);

  const characterColor = color || player.color || '#3498db';
  const displayName = name || player.name || 'Player';

  return (
    <group>
      {/* Character body (simple capsule-like shape) */}
      <mesh ref={meshRef} castShadow>
        <group>
          {/* Body */}
          <mesh position={[0, 0, 0]}>
            <capsuleGeometry args={[0.3, 1]} />
            <meshLambertMaterial color={characterColor} />
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

          {/* Movement indicator when moving */}
          {player.isMoving && (
            <mesh position={[0, 1.5, 0]}>
              <sphereGeometry args={[0.1]} />
              <meshBasicMaterial color="#00ff00" opacity={0.7} transparent />
            </mesh>
          )}
        </group>
      </mesh>
      
      {/* Character shadow helper */}
      <mesh 
        position={[interpolatedPosition.x, 0.01, interpolatedPosition.z]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.4]} />
        <meshBasicMaterial color="#000000" opacity={0.2} transparent />
      </mesh>
      
      {/* Name tag (optional) */}
      {displayName && (
        <mesh position={[interpolatedPosition.x, 2.2, interpolatedPosition.z]}>
          <planeGeometry args={[2, 0.3]} />
          <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
        </mesh>
      )}
    </group>
  );
};

export default EventBasedCharacter;