import React, { useState, useMemo } from 'react';
import { Vector3 } from 'three';
import * as PF from 'pathfinding';
import Character from './Character';
import Obstacles from './Obstacles';

// Shared obstacle definitions to ensure visual and pathfinding sync
export const OBSTACLE_DEFINITIONS = [
  { type: 'box', position: [5, 1, 5], size: [2, 2, 2], color: '#ff6b6b' },
  { type: 'box', position: [-5, 0.5, -5], size: [3, 1, 1], color: '#4ecdc4' },
  { type: 'box', position: [0, 1.5, 8], size: [1, 3, 1], color: '#45b7d1' },
  { type: 'box', position: [8, 1, 0], size: [2, 2, 2], color: '#f9ca24' },
  { type: 'cylinder', position: [-8, 1, 5], size: [1.5, 2, 1.5], color: '#6c5ce7' }, // [width, height, depth]
  { type: 'sphere', position: [6, 1, -6], size: [2, 2, 2], color: '#fd79a8' }, // [width, height, depth] for pathfinding
  { type: 'box', position: [-2, 0.5, 2], size: [1.5, 1, 1.5], color: '#00b894' },
];

const ROOM_SIZE = 20;
const GRID_SIZE = 60; // Grid resolution for pathfinding (higher for smoother diagonal paths)
const SHOW_DEBUG_GRID = true; // Set to true to visualize pathfinding grid

const Room: React.FC = () => {
  // useThree hook available if needed for camera/scene access
  const [characterPosition, setCharacterPosition] = useState<Vector3>(new Vector3(0, 0.5, 0));
  const [targetPosition, setTargetPosition] = useState<Vector3 | null>(null);
  const [path, setPath] = useState<Vector3[]>([]);
  const [isMoving, setIsMoving] = useState(false);

  // Create pathfinding grid
  const { grid, finder } = useMemo(() => {
    const grid = new PF.Grid(GRID_SIZE, GRID_SIZE);
    
    // Mark obstacle positions as blocked using shared definitions
    OBSTACLE_DEFINITIONS.forEach(obstacle => {
      const x = obstacle.position[0];
      const z = obstacle.position[2];
      const width = obstacle.size[0];
      const depth = obstacle.size[2];
      
      // Add some padding around obstacles for safer pathfinding
      const padding = 0.3;
      const paddedWidth = width + padding;
      const paddedDepth = depth + padding;
      
      const startX = Math.floor((x - paddedWidth/2 + ROOM_SIZE/2) * GRID_SIZE / ROOM_SIZE);
      const endX = Math.ceil((x + paddedWidth/2 + ROOM_SIZE/2) * GRID_SIZE / ROOM_SIZE);
      const startZ = Math.floor((z - paddedDepth/2 + ROOM_SIZE/2) * GRID_SIZE / ROOM_SIZE);
      const endZ = Math.ceil((z + paddedDepth/2 + ROOM_SIZE/2) * GRID_SIZE / ROOM_SIZE);

      for (let gridX = Math.max(0, startX); gridX < Math.min(GRID_SIZE, endX); gridX++) {
        for (let gridZ = Math.max(0, startZ); gridZ < Math.min(GRID_SIZE, endZ); gridZ++) {
          grid.setWalkableAt(gridX, gridZ, false);
        }
      }
    });

    // Block room boundaries for safety
    const boundaryPadding = 2; // Grid cells from edge
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        if (x < boundaryPadding || x >= GRID_SIZE - boundaryPadding || 
            z < boundaryPadding || z >= GRID_SIZE - boundaryPadding) {
          grid.setWalkableAt(x, z, false);
        }
      }
    }

    const finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });
    return { grid, finder };
  }, []);

  // Convert world coordinates to grid coordinates
  const worldToGrid = (worldPos: Vector3) => {
    const x = Math.floor((worldPos.x + ROOM_SIZE/2) * GRID_SIZE / ROOM_SIZE);
    const z = Math.floor((worldPos.z + ROOM_SIZE/2) * GRID_SIZE / ROOM_SIZE);
    return { x: Math.max(0, Math.min(GRID_SIZE - 1, x)), z: Math.max(0, Math.min(GRID_SIZE - 1, z)) };
  };

  // Convert grid coordinates to world coordinates
  const gridToWorld = (gridX: number, gridZ: number) => {
    const x = (gridX * ROOM_SIZE / GRID_SIZE) - ROOM_SIZE/2;
    const z = (gridZ * ROOM_SIZE / GRID_SIZE) - ROOM_SIZE/2;
    return new Vector3(x, 0.5, z);
  };

  // Handle floor clicks
  const handleFloorClick = (event: any) => {
    event.stopPropagation();
    const point = event.point as Vector3;
    
    // Clamp to room bounds
    const clampedPoint = new Vector3(
      Math.max(-ROOM_SIZE/2 + 1, Math.min(ROOM_SIZE/2 - 1, point.x)),
      0.5,
      Math.max(-ROOM_SIZE/2 + 1, Math.min(ROOM_SIZE/2 - 1, point.z))
    );

    const startGrid = worldToGrid(characterPosition);
    const endGrid = worldToGrid(clampedPoint);

    // Find path using A*
    const gridCopy = grid.clone();
    const pathCoords = finder.findPath(startGrid.x, startGrid.z, endGrid.x, endGrid.z, gridCopy);

    if (pathCoords.length > 0) {
      const worldPath = pathCoords.map((coord: number[]) => gridToWorld(coord[0], coord[1]));
      setPath(worldPath);
      setTargetPosition(clampedPoint);
      setIsMoving(true);
    }
  };

  return (
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

      {/* Character */}
      <Character 
        position={characterPosition}
        path={path}
        isMoving={isMoving}
        onMoveComplete={() => {
          setIsMoving(false);
          setPath([]);
          if (targetPosition) {
            setCharacterPosition(targetPosition);
          }
        }}
      />

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
  );
};

export default Room;