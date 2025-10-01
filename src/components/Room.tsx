import React, { useState, useMemo, useEffect } from 'react';
import { Vector3 } from 'three';
import { usePusher } from '../contexts/PusherContext';
import SimpleAnimatedCharacter from './SimpleAnimatedCharacter';
import Obstacles from './Obstacles';
import { 
  OBSTACLE_DEFINITIONS, 
  ROOM_SIZE, 
  GRID_SIZE, 
  calculatePath, 
  clampToRoomBounds,
  createPathfindingGrid,
  worldToGrid,
  gridToWorld
} from '../utils/pathfinding';

const SHOW_DEBUG_GRID = true; // Set to true to visualize pathfinding grid

const Room: React.FC = () => {
  const { currentPlayer, otherPlayers, sendMoveToTarget, sendPlayerStopped, sendPositionSync, isConnected } = usePusher();
  
  
  const [characterPosition, setCharacterPosition] = useState<Vector3>(new Vector3(0, 0.5, 0));
  const [targetPosition, setTargetPosition] = useState<Vector3 | null>(null);
  const [path, setPath] = useState<Vector3[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [lastSyncedPosition, setLastSyncedPosition] = useState<Vector3>(new Vector3(0, 0.5, 0));
  
  // Periodic position sync for drift correction - disabled for now since event-based movement should be accurate
  // If you experience position drift, you can re-enable this
  /*
  useEffect(() => {
    if (!isConnected) return;
    
    const syncInterval = setInterval(() => {
      // Only sync when not moving and position has actually changed
      if (!isMoving) {
        const distance = characterPosition.distanceTo(lastSyncedPosition);
        if (distance > 0.5) { // Only sync if moved more than 0.5 units since last sync
          sendPositionSync(characterPosition);
          setLastSyncedPosition(characterPosition.clone());
          console.log('📡 Position sync sent - distance moved:', distance.toFixed(2));
        }
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(syncInterval);
  }, [isConnected, isMoving, characterPosition, lastSyncedPosition, sendPositionSync]);
  */

  // Create pathfinding grid for debug visualization (using shared utilities)
  const grid = useMemo(() => createPathfindingGrid(), []);

  // Handle floor clicks (simplified with distributed pathfinding)
  const handleFloorClick = (event: any) => {
    event.stopPropagation();
    const point = event.point as Vector3;
    
    // Clamp to room bounds using shared utility
    const clampedPoint = clampToRoomBounds(point);
    
    // Calculate path locally using shared utility
    const worldPath = calculatePath(characterPosition, clampedPoint);

    if (worldPath.length > 0) {
      setPath(worldPath);
      setTargetPosition(clampedPoint);
      setIsMoving(true);
      
      // Send simple move-to-target event (other clients will calculate their own paths)
      if (isConnected) {
        sendMoveToTarget(characterPosition, clampedPoint);
      }
    } else {
      console.warn('No path found to target position');
    }
  };

  return (
    <>
      {/* Debug Info */}
      <mesh position={[-9, 8, 0]}>
        <planeGeometry args={[4, 1]} />
        <meshBasicMaterial color="#000000" opacity={0.7} transparent />
      </mesh>
      {/* Text would go here in a real implementation, for now just a visual indicator */}
      <mesh position={[-9, 8, 0.1]}>
        <boxGeometry args={[0.2 * (otherPlayers.size + 1), 0.2, 0.02]} />
        <meshBasicMaterial color={isConnected ? '#00ff00' : '#ff0000'} />
      </mesh>
      
      <group>
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={handleFloorClick}
      >
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshLambertMaterial color="#cccccc" />
      </mesh>


      {/* Obstacles */}
      <Obstacles />

      {/* Simple Animated Character */}
      <SimpleAnimatedCharacter 
        position={characterPosition}
        path={path}
        isMoving={isMoving}
        onMoveComplete={() => {
          setIsMoving(false);
          setPath([]);
          if (targetPosition) {
            setCharacterPosition(targetPosition);
            setLastSyncedPosition(targetPosition.clone()); // Update synced position
            // Send stop event to other players
            if (isConnected) {
              sendPlayerStopped(targetPosition);
            }
          }
        }}
        color={currentPlayer?.color}
        name={currentPlayer?.name}
      />

      {/* Other Players */}
      {Array.from(otherPlayers.values()).map(player => (
        <SimpleAnimatedCharacter
          key={player.id}
          player={player}
          useEventBasedMovement={true}
        />
      ))}

      {/* Path visualization (optional - shows the calculated path) */}
      {path.length > 1 && (
        <group>
          {path.map((point, index) => (
            <mesh key={index} position={point}>
              <sphereGeometry args={[0.08]} />
              <meshBasicMaterial color="#ff4757" opacity={0.7} transparent />
            </mesh>
          ))}
          {/* Path lines connecting waypoints */}
          {path.slice(1).map((point, index) => {
            const prevPoint = path[index];
            const midPoint = new Vector3().lerpVectors(prevPoint, point, 0.5);
            const distance = prevPoint.distanceTo(point);
            
            return (
              <mesh key={`line-${index}`} position={midPoint}>
                <boxGeometry args={[0.02, 0.02, distance]} />
                <meshBasicMaterial color="#ff4757" opacity={0.5} transparent />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Debug: Pathfinding grid visualization */}
      {SHOW_DEBUG_GRID && (
        <group>
          {Array.from({ length: GRID_SIZE }, (_, x) =>
            Array.from({ length: GRID_SIZE }, (_, z) => {
              const worldPos = gridToWorld(x, z);
              const isWalkable = grid.isWalkableAt(x, z);
              
              return (
                <mesh
                  key={`debug-${x}-${z}`}
                  position={[worldPos.x, 0.05, worldPos.z]}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <planeGeometry args={[ROOM_SIZE / GRID_SIZE * 0.8, ROOM_SIZE / GRID_SIZE * 0.8]} />
                  <meshBasicMaterial 
                    color={isWalkable ? '#00ff00' : '#ff0000'} 
                    opacity={0.3} 
                    transparent 
                  />
                </mesh>
              );
            })
          ).flat()}
        </group>
      )}
      </group>
    </>
  );
};

export default Room;