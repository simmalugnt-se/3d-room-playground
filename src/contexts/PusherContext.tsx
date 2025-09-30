import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Pusher, { Channel } from 'pusher-js';
import { Vector3 } from 'three';

export interface Player {
  id: string;
  position: { x: number; y: number; z: number };
  color: string;
  isMoving: boolean;
  path: Vector3[];
  name: string;
}

interface PusherContextType {
  currentPlayer: Player | null;
  otherPlayers: Map<string, Player>;
  isConnected: boolean;
  sendMovement: (position: Vector3, path: Vector3[]) => void;
  sendStop: (position: Vector3) => void;
  memberCount: number;
}

const PusherContext = createContext<PusherContextType>({
  currentPlayer: null,
  otherPlayers: new Map(),
  isConnected: false,
  sendMovement: () => {},
  sendStop: () => {},
  memberCount: 0
});

export const usePusher = () => {
  const context = useContext(PusherContext);
  if (!context) {
    throw new Error('usePusher must be used within a PusherProvider');
  }
  return context;
};

interface PusherProviderProps {
  children: React.ReactNode;
}

// Character colors for visual distinction
const characterColors = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
  '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
  '#f1c40f', '#e91e63', '#00bcd4', '#4caf50'
];

export const PusherProvider: React.FC<PusherProviderProps> = ({ children }) => {
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<Map<string, Player>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    // Use environment variables for Pusher credentials
    const pusherKey = process.env.REACT_APP_PUSHER_KEY;
    const pusherCluster = process.env.REACT_APP_PUSHER_CLUSTER;
    
    if (!pusherKey || !pusherCluster) {
      console.error('Pusher credentials missing! Please set REACT_APP_PUSHER_KEY and REACT_APP_PUSHER_CLUSTER in your .env file');
      return;
    }
    
    const pusherInstance = new Pusher(pusherKey, {
      cluster: pusherCluster
    });

    setPusher(pusherInstance);

    // Connection state
    pusherInstance.connection.bind('connected', () => {
      console.log('Connected to Pusher');
      setIsConnected(true);
      
      // Create current player when connected
      const socketId = pusherInstance.connection.socket_id || 'unknown';
      const playerColor = characterColors[socketId.hashCode() % characterColors.length];
      const player: Player = {
        id: socketId,
        position: { x: 0, y: 0.5, z: 0 },
        color: playerColor,
        isMoving: false,
        path: [],
        name: `Player ${socketId.substring(0, 6)}`
      };
      setCurrentPlayer(player);
    });

    pusherInstance.connection.bind('disconnected', () => {
      console.log('Disconnected from Pusher');
      setIsConnected(false);
    });

    // Subscribe to the regular channel for the 3D room
    const roomChannel = pusherInstance.subscribe('3d-room');
    setChannel(roomChannel);

    // Handle successful subscription
    roomChannel.bind('pusher:subscription_succeeded', () => {
      console.log('Successfully subscribed to 3D room');
      
      // Announce joining after successful subscription
      if (currentPlayer) {
        roomChannel.trigger('client-player-joined', {
          playerId: currentPlayer.id,
          playerData: currentPlayer
        });
      }
    });

    // Handle player joined
    roomChannel.bind('client-player-joined', (data: {
      playerId: string;
      playerData: Player;
    }) => {
      if (data.playerId !== pusherInstance.connection.socket_id) {
        console.log('Player joined:', data.playerId);
        setMemberCount(prev => prev + 1);
        
        setOtherPlayers(prev => {
          const newMap = new Map(prev);
          newMap.set(data.playerId, {
            ...data.playerData,
            path: [] // Reset path for new players
          });
          return newMap;
        });
      }
    });

    // Handle player left (we'll need to implement this via a heartbeat or timeout)
    roomChannel.bind('client-player-left', (data: {
      playerId: string;
    }) => {
      if (data.playerId !== pusherInstance.connection.socket_id) {
        console.log('Player left:', data.playerId);
        setMemberCount(prev => prev - 1);
        
        setOtherPlayers(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.playerId);
          return newMap;
        });
      }
    });

    // Handle player movement
    roomChannel.bind('client-player-moved', (data: {
      playerId: string;
      position: { x: number; y: number; z: number };
      path: { x: number; y: number; z: number }[];
      isMoving: boolean;
    }) => {
      if (data.playerId !== pusherInstance.connection.socket_id) {
        setOtherPlayers(prev => {
          const newMap = new Map(prev);
          const player = newMap.get(data.playerId);
          if (player) {
            player.position = data.position;
            player.isMoving = data.isMoving;
            player.path = data.path.map(p => new Vector3(p.x, p.y, p.z));
          }
          return newMap;
        });
      }
    });

    // Handle player stopped
    roomChannel.bind('client-player-stopped', (data: {
      playerId: string;
      position: { x: number; y: number; z: number };
    }) => {
      if (data.playerId !== pusherInstance.connection.socket_id) {
        setOtherPlayers(prev => {
          const newMap = new Map(prev);
          const player = newMap.get(data.playerId);
          if (player) {
            player.position = data.position;
            player.isMoving = false;
            player.path = [];
          }
          return newMap;
        });
      }
    });

    return () => {
      // Announce leaving before disconnecting
      if (roomChannel && isConnected) {
        roomChannel.trigger('client-player-left', {
          playerId: pusherInstance.connection.socket_id
        });
      }
      roomChannel.unbind_all();
      pusherInstance.unsubscribe('3d-room');
      pusherInstance.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMovement = useCallback((position: Vector3, path: Vector3[]) => {
    if (channel && isConnected) {
      channel.trigger('client-player-moved', {
        playerId: pusher?.connection.socket_id,
        position: { x: position.x, y: position.y, z: position.z },
        path: path.map(p => ({ x: p.x, y: p.y, z: p.z })),
        isMoving: true
      });
    }
  }, [channel, isConnected, pusher]);

  const sendStop = useCallback((position: Vector3) => {
    if (channel && isConnected) {
      channel.trigger('client-player-stopped', {
        playerId: pusher?.connection.socket_id,
        position: { x: position.x, y: position.y, z: position.z }
      });
    }
  }, [channel, isConnected, pusher]);

  const value: PusherContextType = {
    currentPlayer,
    otherPlayers,
    isConnected,
    sendMovement,
    sendStop,
    memberCount
  };

  return (
    <PusherContext.Provider value={value}>
      {children}
    </PusherContext.Provider>
  );
};

// Helper extension for string hashing
declare global {
  interface String {
    hashCode(): number;
  }
}

// eslint-disable-next-line no-extend-native
String.prototype.hashCode = function() {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};