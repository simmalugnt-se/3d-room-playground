import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { Player } from '../contexts/PusherContext';

interface SimpleAnimatedCharacterProps {
  position?: Vector3;
  path?: Vector3[];
  isMoving?: boolean;
  onMoveComplete?: () => void;
  color?: string;
  name?: string;
  // New props for event-based movement
  player?: Player;
  useEventBasedMovement?: boolean;
}

const SimpleAnimatedCharacter: React.FC<SimpleAnimatedCharacterProps> = ({ 
  position, 
  path = [], 
  isMoving = false, 
  onMoveComplete = () => {},
  color = '#3498db',
  name = 'Player',
  player,
  useEventBasedMovement = false
}) => {
  const groupRef = useRef<Group>(null);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [animationTime, setAnimationTime] = useState(0);
  
  // Determine which movement system to use
  const effectivePosition = player ? new Vector3(player.position.x, player.position.y, player.position.z) : (position || new Vector3(0, 0.5, 0));
  const effectiveIsMoving = player ? player.isMoving : isMoving;
  const effectiveColor = player?.color || color;
  const effectiveName = player?.name || name;
  
  const [currentPosition, setCurrentPosition] = useState<Vector3>(effectivePosition.clone());
  const [targetPosition, setTargetPosition] = useState<Vector3>(effectivePosition.clone());
  const [interpolatedPosition, setInterpolatedPosition] = useState<Vector3>(effectivePosition.clone());
  const [facingDirection, setFacingDirection] = useState<number>(0);
  
  const MOVE_SPEED = 4;

  // Path management for traditional path-based movement
  useEffect(() => {
    if (!useEventBasedMovement && effectiveIsMoving && path.length > 0) {
      console.log('Starting traditional movement with path:', path);
      setCurrentPathIndex(0);
      setCurrentPosition(effectivePosition.clone());
      setTargetPosition(path[0]);
    }
  }, [effectiveIsMoving, path, effectivePosition, useEventBasedMovement]);
  
  // Path management for event-based movement
  useEffect(() => {
    if (useEventBasedMovement && player && player.isMoving && player.path && player.path.length > 0) {
      console.log('Starting event-based movement with path:', player.path);
      setCurrentPathIndex(0);
      setCurrentPosition(new Vector3(player.position.x, player.position.y, player.position.z));
      setTargetPosition(player.path[0]);
    }
  }, [useEventBasedMovement, player?.isMoving, player?.path, player?.position, player]);

  // Animation loop
  useFrame((state, delta) => {
    setAnimationTime(prev => prev + delta);
    
    if (!groupRef.current) return;

    if (useEventBasedMovement && player) {
      // Event-based movement - use path if available, otherwise interpolate directly
      if (player.isMoving) {
        if (player.path && player.path.length > 0) {
          // Use path-based movement (similar to traditional path following)
          const distance = currentPosition.distanceTo(targetPosition);
          
          if (distance < 0.15) {
            const nextIndex = currentPathIndex + 1;
            
            if (nextIndex >= player.path.length) {
              // Path completed - use target position if available (from stop event), otherwise current position
              const finalPos = player.targetPosition 
                ? new Vector3(player.targetPosition.x, player.targetPosition.y, player.targetPosition.z)
                : new Vector3(player.position.x, player.position.y, player.position.z);
              setInterpolatedPosition(finalPos);
              setCurrentPosition(finalPos);
              groupRef.current.position.copy(finalPos);
              
              // Update player's position to match where we actually ended up
              if (player.targetPosition) {
                player.position = {
                  x: finalPos.x,
                  y: finalPos.y, 
                  z: finalPos.z
                };
              }
              return;
            }
            
            setCurrentPathIndex(nextIndex);
            setCurrentPosition(targetPosition.clone());
            setTargetPosition(player.path[nextIndex]);
          } else {
            const direction = new Vector3().subVectors(targetPosition, currentPosition).normalize();
            const moveDistance = MOVE_SPEED * delta;
            const newPosition = currentPosition.clone().add(direction.multiplyScalar(moveDistance));
            
            setCurrentPosition(newPosition);
            setInterpolatedPosition(newPosition);
            groupRef.current.position.copy(newPosition);
            
            if (direction.length() > 0) {
              const angle = Math.atan2(direction.x, direction.z);
              groupRef.current.rotation.y = angle;
              setFacingDirection(angle);
            }
          }
        } else if (player.targetPosition && player.velocity && player.movementStartTime) {
          // Fallback to direct interpolation if no path
          const currentTime = Date.now();
          const elapsedTime = (currentTime - player.movementStartTime) / 1000;
          
          const startPos = new Vector3(player.position.x, player.position.y, player.position.z);
          const targetPos = new Vector3(player.targetPosition.x, player.targetPosition.y, player.targetPosition.z);
          
          const totalDistance = startPos.distanceTo(targetPos);
          const expectedDistance = Math.min(player.velocity * elapsedTime, totalDistance);
          
          if (expectedDistance >= totalDistance) {
            setInterpolatedPosition(targetPos.clone());
            setFacingDirection(Math.atan2(targetPos.x - startPos.x, targetPos.z - startPos.z));
          } else {
            const direction = new Vector3().subVectors(targetPos, startPos).normalize();
            const newPosition = startPos.clone().add(direction.multiplyScalar(expectedDistance));
            setInterpolatedPosition(newPosition);
            setFacingDirection(Math.atan2(direction.x, direction.z));
          }
          
          groupRef.current.position.copy(interpolatedPosition);
          groupRef.current.rotation.y = facingDirection;
        }
      } else {
        // Not moving, use current position
        const currentPos = new Vector3(player.position.x, player.position.y, player.position.z);
        setInterpolatedPosition(currentPos);
        groupRef.current.position.copy(currentPos);
      }
    } else {
      // Traditional path-based movement
      if (!effectiveIsMoving || path.length === 0) {
        return;
      }

      const distance = currentPosition.distanceTo(targetPosition);
      
      if (distance < 0.15) {
        const nextIndex = currentPathIndex + 1;
        
        if (nextIndex >= path.length) {
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
        const direction = new Vector3().subVectors(targetPosition, currentPosition).normalize();
        const moveDistance = MOVE_SPEED * delta;
        const newPosition = currentPosition.clone().add(direction.multiplyScalar(moveDistance));
        
        setCurrentPosition(newPosition);
        groupRef.current.position.copy(newPosition);
        
        if (direction.length() > 0) {
          const angle = Math.atan2(direction.x, direction.z);
          groupRef.current.rotation.y = angle;
        }
      }
    }
  });

  // Update position when not moving (for both movement systems)
  useEffect(() => {
    if (!effectiveIsMoving && groupRef.current) {
      console.log('Setting position to:', effectivePosition);
      groupRef.current.position.copy(effectivePosition);
      setCurrentPosition(effectivePosition.clone());
      setTargetPosition(effectivePosition.clone());
      if (useEventBasedMovement) {
        setInterpolatedPosition(effectivePosition.clone());
      }
    }
  }, [effectivePosition, effectiveIsMoving, useEventBasedMovement]);

  // Handle position updates from sync events for event-based movement
  useEffect(() => {
    if (useEventBasedMovement && player && !player.isMoving) {
      const syncPos = new Vector3(player.position.x, player.position.y, player.position.z);
      setInterpolatedPosition(syncPos);
    }
  }, [player?.position, player?.isMoving, useEventBasedMovement, player]);
  
  // Handle player stop events - smoothly transition to final position
  useEffect(() => {
    if (useEventBasedMovement && player && !player.isMoving && player.path.length === 0 && groupRef.current) {
      // Player has stopped moving and path is cleared - ensure we're at the correct final position
      const finalPos = new Vector3(player.position.x, player.position.y, player.position.z);
      setInterpolatedPosition(finalPos);
      setCurrentPosition(finalPos);
      groupRef.current.position.copy(finalPos);
      setCurrentPathIndex(0);
      console.log('🎯 Player stopped, positioned at:', finalPos);
    }
  }, [useEventBasedMovement, player?.isMoving, player?.path?.length, player?.position, player]);

  // Walking animation - simple bobbing
  const walkBob = effectiveIsMoving ? Math.sin(animationTime * 8) * 0.1 : 0;
  
  // Idle animation - subtle breathing and swaying
  const idleBreathe = !effectiveIsMoving ? Math.sin(animationTime * 2) * 0.03 : 0;
  const idleSway = !effectiveIsMoving ? Math.sin(animationTime * 1.5) * 0.02 : 0;
  const idleHeadBob = !effectiveIsMoving ? Math.sin(animationTime * 3) * 0.01 : 0;

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[idleSway, 1 + walkBob + idleBreathe, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.8]} />
        <meshLambertMaterial color={effectiveColor} />
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
      <mesh position={[-0.15 + idleSway * 0.3, 0.3, effectiveIsMoving ? Math.sin(animationTime * 10) * 0.1 : 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.6]} />
        <meshLambertMaterial color="#2c3e50" />
      </mesh>
      
      {/* Right Leg */}
      <mesh position={[0.15 + idleSway * 0.3, 0.3, effectiveIsMoving ? -Math.sin(animationTime * 10) * 0.1 : 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.6]} />
        <meshLambertMaterial color="#2c3e50" />
      </mesh>
      
      {/* Left Arm */}
      <mesh position={[
        -0.4 + idleSway, 
        1.2 + walkBob + idleBreathe, 
        effectiveIsMoving ? Math.sin(animationTime * 8) * 0.15 : Math.sin(animationTime * 2.5) * 0.03
      ]} castShadow>
        <capsuleGeometry args={[0.06, 0.5]} />
        <meshLambertMaterial color="#e67e22" />
      </mesh>
      
      {/* Right Arm */}
      <mesh position={[
        0.4 + idleSway, 
        1.2 + walkBob + idleBreathe, 
        effectiveIsMoving ? -Math.sin(animationTime * 8) * 0.15 : -Math.sin(animationTime * 2.5) * 0.03
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
        <meshBasicMaterial color={effectiveColor} />
      </mesh>
      
      {/* Movement indicator for event-based movement */}
      {useEventBasedMovement && effectiveIsMoving && (
        <mesh position={[idleSway, 1.5 + walkBob + idleBreathe, 0]}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#00ff00" opacity={0.7} transparent />
        </mesh>
      )}
    </group>
  );
};

export default SimpleAnimatedCharacter;