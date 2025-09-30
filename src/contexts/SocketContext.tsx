import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Vector3 } from 'three';

export interface Player {
  id: string;
  position: { x: number; y: number; z: number };
  color: string;
  isMoving: boolean;
  path: Vector3[];
  name: string;
}

interface SocketContextType {
  socket: Socket | null;
  currentPlayer: Player | null;
  otherPlayers: Map<string, Player>;
  isConnected: boolean;
  sendMovement: (position: Vector3, path: Vector3[]) => void;
  sendStop: (position: Vector3) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  currentPlayer: null,
  otherPlayers: new Map(),
  isConnected: false,
  sendMovement: () => {},
  sendStop: () => {}
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<Map<string, Player>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the Socket.IO server
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Connection established
    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
      setIsConnected(true);
    });

    // Receive current player data
    newSocket.on('playerData', (playerData: Omit<Player, 'path'>) => {
      const player: Player = {
        ...playerData,
        path: []
      };
      setCurrentPlayer(player);
      console.log('Received player data:', player);
    });

    // Receive existing players
    newSocket.on('existingPlayers', (players: Omit<Player, 'path'>[]) => {
      const playersMap = new Map<string, Player>();
      players.forEach(p => {
        playersMap.set(p.id, { ...p, path: [] });
      });
      setOtherPlayers(playersMap);
      console.log('Received existing players:', players.length);
    });

    // New player joined
    newSocket.on('playerJoined', (player: Omit<Player, 'path'>) => {
      setOtherPlayers(prev => {
        const newMap = new Map(prev);
        newMap.set(player.id, { ...player, path: [] });
        return newMap;
      });
      console.log('Player joined:', player.name);
    });

    // Player moved
    newSocket.on('playerMoved', (data: {
      id: string;
      position: { x: number; y: number; z: number };
      path: { x: number; y: number; z: number }[];
      isMoving: boolean;
    }) => {
      setOtherPlayers(prev => {
        const newMap = new Map(prev);
        const player = newMap.get(data.id);
        if (player) {
          player.position = data.position;
          player.isMoving = data.isMoving;
          player.path = data.path.map(p => new Vector3(p.x, p.y, p.z));
        }
        return newMap;
      });
    });

    // Player stopped
    newSocket.on('playerStopped', (data: {
      id: string;
      position: { x: number; y: number; z: number };
    }) => {
      setOtherPlayers(prev => {
        const newMap = new Map(prev);
        const player = newMap.get(data.id);
        if (player) {
          player.position = data.position;
          player.isMoving = false;
          player.path = [];
        }
        return newMap;
      });
    });

    // Player left
    newSocket.on('playerLeft', (playerId: string) => {
      setOtherPlayers(prev => {
        const newMap = new Map(prev);
        newMap.delete(playerId);
        return newMap;
      });
      console.log('Player left:', playerId);
    });

    // Handle disconnection
    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const sendMovement = (position: Vector3, path: Vector3[]) => {
    if (socket && isConnected) {
      socket.emit('playerMove', {
        position: { x: position.x, y: position.y, z: position.z },
        path: path.map(p => ({ x: p.x, y: p.y, z: p.z })),
        isMoving: true
      });
    }
  };

  const sendStop = (position: Vector3) => {
    if (socket && isConnected) {
      socket.emit('playerStop', {
        position: { x: position.x, y: position.y, z: position.z }
      });
    }
  };

  const value: SocketContextType = {
    socket,
    currentPlayer,
    otherPlayers,
    isConnected,
    sendMovement,
    sendStop
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};