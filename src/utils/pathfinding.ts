import { Vector3 } from 'three';
import * as PF from 'pathfinding';

// Shared obstacle definitions to ensure consistency across all clients
export const OBSTACLE_DEFINITIONS = [
  { type: 'box', position: [5, 1, 5], size: [2, 2, 2], color: '#ff6b6b' },
  { type: 'box', position: [-5, 0.5, -5], size: [3, 1, 1], color: '#4ecdc4' },
  { type: 'box', position: [0, 1.5, 8], size: [1, 3, 1], color: '#45b7d1' },
  { type: 'box', position: [8, 1, 0], size: [2, 2, 2], color: '#f9ca24' },
  { type: 'cylinder', position: [-8, 1, 5], size: [1.5, 2, 1.5], color: '#6c5ce7' },
  { type: 'sphere', position: [6, 1, -6], size: [2, 2, 2], color: '#fd79a8' },
  { type: 'box', position: [-2, 0.5, 2], size: [1.5, 1, 1.5], color: '#00b894' },
];

export const ROOM_SIZE = 20;
export const GRID_SIZE = 60; // Must be identical across all clients!

// Create the pathfinding grid (this must be identical on all clients)
export const createPathfindingGrid = () => {
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

  return grid;
};

// Create the pathfinder (must use identical settings)
export const createPathfinder = () => {
  return new PF.AStarFinder({
    allowDiagonal: true,
    dontCrossCorners: true
  });
};

// Convert world coordinates to grid coordinates
export const worldToGrid = (worldPos: Vector3) => {
  const x = Math.floor((worldPos.x + ROOM_SIZE/2) * GRID_SIZE / ROOM_SIZE);
  const z = Math.floor((worldPos.z + ROOM_SIZE/2) * GRID_SIZE / ROOM_SIZE);
  return { x: Math.max(0, Math.min(GRID_SIZE - 1, x)), z: Math.max(0, Math.min(GRID_SIZE - 1, z)) };
};

// Convert grid coordinates to world coordinates
export const gridToWorld = (gridX: number, gridZ: number) => {
  const x = (gridX * ROOM_SIZE / GRID_SIZE) - ROOM_SIZE/2;
  const z = (gridZ * ROOM_SIZE / GRID_SIZE) - ROOM_SIZE/2;
  return new Vector3(x, 0.5, z);
};

// Main pathfinding function - this is what all clients will use
export const calculatePath = (startPosition: Vector3, targetPosition: Vector3): Vector3[] => {
  const grid = createPathfindingGrid();
  const finder = createPathfinder();
  
  const startGrid = worldToGrid(startPosition);
  const endGrid = worldToGrid(targetPosition);

  // Find path using A*
  const gridCopy = grid.clone();
  const pathCoords = finder.findPath(startGrid.x, startGrid.z, endGrid.x, endGrid.z, gridCopy);

  if (pathCoords.length > 0) {
    return pathCoords.map((coord: number[]) => gridToWorld(coord[0], coord[1]));
  }
  
  return []; // No path found
};

// Utility to clamp target position to room bounds
export const clampToRoomBounds = (position: Vector3): Vector3 => {
  return new Vector3(
    Math.max(-ROOM_SIZE/2 + 1, Math.min(ROOM_SIZE/2 - 1, position.x)),
    0.5,
    Math.max(-ROOM_SIZE/2 + 1, Math.min(ROOM_SIZE/2 - 1, position.z))
  );
};