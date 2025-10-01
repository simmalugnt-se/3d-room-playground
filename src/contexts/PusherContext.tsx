import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Pusher, { Channel } from 'pusher-js';
import { Vector3 } from 'three';

export interface Player {
  id: string;
  position: { x: number; y: number; z: number };
  color: string;
  isMoving: boolean;
  // Event-based movement properties
  targetPosition?: { x: number; y: number; z: number };
  velocity?: number;
  movementStartTime?: number;
  lastSyncTime?: number;
  // Legacy path for backward compatibility during transition
  path: Vector3[];
  name: string;
}

interface PusherContextType {
  currentPlayer: Player | null;
  otherPlayers: Map<string, Player>;
  isConnected: boolean;
  // Distributed pathfinding methods
  sendMoveToTarget: (startPosition: Vector3, targetPosition: Vector3) => Promise<void>;
  sendPlayerStopped: (position: Vector3) => Promise<void>;
  sendPositionSync: (position: Vector3) => Promise<void>;
  memberCount: number;
}

const PusherContext = createContext<PusherContextType>({
  currentPlayer: null,
  otherPlayers: new Map(),
  isConnected: false,
  sendMoveToTarget: async () => {},
  sendPlayerStopped: async () => {},
  sendPositionSync: async () => {},
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Use environment variables for Pusher credentials
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    
    if (!pusherKey || !pusherCluster) {
      console.error('Pusher credentials missing! Please set NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER in your .env file');
      return;
    }
    
    const pusherInstance = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: '/api/pusher/auth'
    });

    setPusher(pusherInstance);

    // Connection state
    pusherInstance.connection.bind('connected', () => {
      console.log('Connected to Pusher');
      setIsConnected(true);
    });

    pusherInstance.connection.bind('disconnected', () => {
      console.log('Disconnected from Pusher');
      setIsConnected(false);
    });

    // Subscribe to the presence channel for the 3D room
    console.log('🔄 Attempting to subscribe to presence-3d-room channel...');
    console.log('🔑 Using auth endpoint:', '/api/pusher/auth');
    
    const roomChannel = pusherInstance.subscribe('presence-3d-room');
    setChannel(roomChannel);
    
    // Add generic error handler for the channel
    roomChannel.bind('pusher:subscription_error', (error: any) => {
      console.error('❌ Presence channel subscription error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    });
    
    // Add more detailed connection debugging
    pusherInstance.connection.bind('error', (error: any) => {
      console.error('❌ Pusher connection error:', error);
    });
    
    pusherInstance.connection.bind('state_change', (states: any) => {
      console.log('🔄 Pusher connection state change:', states.previous, '→', states.current);
    });

    // Handle successful subscription to presence channel  
    
    roomChannel.bind('pusher:subscription_succeeded', (members: any) => {
      console.log('🎉 Successfully subscribed to presence 3D room!');
      console.log('📊 Full members object:', members);
      console.log('📊 Member count:', members?.count);
      console.log('📊 Members:', members?.members);
      console.log('🗺️ My socket ID:', pusherInstance.connection.socket_id);
      
      // Create current player when subscription is ready
      const socketId = pusherInstance.connection.socket_id || 'unknown';
      
      // Extract current user's ID from presence channel membership
      let myUserId = socketId; // Fallback to socket ID
      if (members && members.members) {
        // Find the member entry that matches our socket (it should be the one we just joined)
        const memberEntries = Object.entries(members.members);
        const myMemberEntry = memberEntries.find(([memberId, memberInfo]) => 
          memberEntries.length === 1 || memberId !== socketId
        );
        if (myMemberEntry) {
          myUserId = myMemberEntry[0];
          console.log('🆔 Found my user ID in members:', myUserId);
        }
      }
      
      setCurrentUserId(myUserId);
      console.log('🆔 Current user ID set to:', myUserId);
      
      const playerColor = characterColors[socketId.hashCode() % characterColors.length];
      const player: Player = {
        id: myUserId, // Use presence channel user ID
        position: { x: 0, y: 0.5, z: 0 },
        color: playerColor,
        isMoving: false,
        path: [],
        name: `Player ${myUserId.substring(0, 6)}`
      };
      setCurrentPlayer(player);
      console.log('Current player created with user ID:', player);
      
      // Process existing members (if any)
      if (members && members.members) {
        console.log('Processing existing members:', Object.keys(members.members));
        Object.keys(members.members).forEach(memberId => {
          if (memberId !== socketId) {
            console.log('Adding existing member:', memberId);
            const memberInfo = members.members[memberId];
            const existingPlayer: Player = {
              id: memberId,
              position: { x: 0, y: 0.5, z: 0 },
              color: characterColors[memberId.hashCode() % characterColors.length],
              isMoving: false,
              path: [],
              name: memberInfo?.user_info?.name || memberInfo?.name || `Player ${memberId.substring(0, 6)}`
            };
            
            setOtherPlayers(prev => {
              const newMap = new Map(prev);
              newMap.set(memberId, existingPlayer);
              return newMap;
            });
          }
        });
        setMemberCount(members.count || 0);
      }
    });


    // Handle presence channel member added
    roomChannel.bind('pusher:member_added', (member: any) => {
      console.log('🆕 Member added:', member);
      console.log('🆔 Member ID:', member.id);
      console.log('ℹ️ Member info:', member.info);
      console.log('🔗 My socket ID:', pusherInstance.connection.socket_id);
      
      const memberId = member.id;
      if (memberId !== pusherInstance.connection.socket_id) {
        console.log('✅ Adding new member as player:', memberId);
        
        const newPlayer: Player = {
          id: memberId,
          position: { x: 0, y: 0.5, z: 0 },
          color: characterColors[memberId.hashCode() % characterColors.length],
          isMoving: false,
          path: [],
          name: member.info?.user_info?.name || member.info?.name || `Player ${memberId.substring(0, 6)}`
        };
        
        setOtherPlayers(prev => {
          const newMap = new Map(prev);
          newMap.set(memberId, newPlayer);
          console.log('📊 Updated other players after member added. Size:', newMap.size);
          console.log('📊 All other players:', Array.from(newMap.entries()));
          return newMap;
        });
      }
    });

    // Handle presence channel member removed
    roomChannel.bind('pusher:member_removed', (member: any) => {
      console.log('Member removed:', member);
      const memberId = member.id;
      if (memberId !== pusherInstance.connection.socket_id) {
        console.log('Removing member:', memberId);
        
        setOtherPlayers(prev => {
          const newMap = new Map(prev);
          newMap.delete(memberId);
          console.log('Updated other players after member removed:', newMap);
          return newMap;
        });
      }
    });

    // Handle player move to target (distributed pathfinding)
    roomChannel.bind('player-move-to-target', (data: {
      playerId: string;
      startPosition: { x: number; y: number; z: number };
      targetPosition: { x: number; y: number; z: number };
      timestamp: number;
    }) => {
      console.log('📨 Received move-to-target event:', data);
      console.log('📨 From player:', data.playerId);
      console.log('📨 My socket ID:', pusherInstance.connection.socket_id);
      
      if (data.playerId !== pusherInstance.connection.socket_id) {
        console.log('✅ Processing move-to-target for other player');
        setOtherPlayers(prev => {
          const newMap = new Map(prev);
          const player = newMap.get(data.playerId);
          
          if (player) {
            // Set the target - the character component will calculate the path locally
            player.position = data.startPosition;
            player.targetPosition = data.targetPosition;
            player.isMoving = true;
            player.movementStartTime = data.timestamp;
            player.lastSyncTime = Date.now();
            // Clear existing path - it will be recalculated by the component
            player.path = [];
            console.log('✅ Player will move from', data.startPosition, 'to', data.targetPosition);
          } else {
            console.warn('⚠️ Player not found in otherPlayers map:', data.playerId);
            console.warn('⚠️ Available players:', Array.from(newMap.keys()));
          }
          
          return newMap;
        });
      } else {
        console.log('🙅 Ignoring own move-to-target event');
      }
    });

    // Handle player stopped
    roomChannel.bind('player-stopped', (data: {
      playerId: string;
      position: { x: number; y: number; z: number };
      timestamp: number;
    }) => {
      if (data.playerId !== pusherInstance.connection.socket_id) {
        console.log('Received player movement stop:', data);
        setOtherPlayers(prev => {
          const newMap = new Map(prev);
          const player = newMap.get(data.playerId);
          if (player) {
            // Don't immediately overwrite position - let the character component finish its movement
            // Only update the target position so the character knows where to end up
            if (player.isMoving && player.targetPosition) {
              // Update the final target position to ensure accuracy
              player.targetPosition = data.position;
            } else {
              // Player wasn't moving, safe to update position directly
              player.position = data.position;
            }
            
            // Clear movement state
            player.isMoving = false;
            player.velocity = undefined;
            player.movementStartTime = undefined;
            player.lastSyncTime = Date.now();
            
            // Clear path after a short delay to allow movement to complete
            setTimeout(() => {
              setOtherPlayers(currentPlayers => {
                const updatedMap = new Map(currentPlayers);
                const currentPlayer = updatedMap.get(data.playerId);
                if (currentPlayer && !currentPlayer.isMoving) {
                  currentPlayer.path = [];
                  currentPlayer.targetPosition = undefined;
                  // Ensure position is set to the final stop position
                  currentPlayer.position = data.position;
                }
                return updatedMap;
              });
            }, 100); // Small delay to let character component finish
            
            console.log('✅ Player movement stopped, final position will be:', data.position);
          }
          return newMap;
        });
      }
    });
    
    // Handle position sync for drift correction
    roomChannel.bind('player-position-sync', (data: {
      playerId: string;
      position: { x: number; y: number; z: number };
      timestamp: number;
    }) => {
      if (data.playerId !== pusherInstance.connection.socket_id) {
        console.log('Received player position sync:', data);
        setOtherPlayers(prev => {
          const newMap = new Map(prev);
          const player = newMap.get(data.playerId);
          if (player) {
            // Only sync if not currently moving or if significant drift
            if (!player.isMoving) {
              player.position = data.position;
              player.lastSyncTime = Date.now();
            }
          }
          return newMap;
        });
      }
    });

    return () => {
      // Clean up connections
      roomChannel.unbind_all();
      pusherInstance.unsubscribe('presence-3d-room');
      pusherInstance.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMoveToTarget = useCallback(async (startPosition: Vector3, targetPosition: Vector3) => {
    if (pusher && isConnected && currentUserId) {
      console.log('🚀 Sending move-to-target via API:', { startPosition, targetPosition });
      console.log('🚀 Using user ID:', currentUserId);
      
      const movementData = {
        type: 'move-to-target',
        playerId: currentUserId,  // Use presence channel user ID
        socketId: pusher.connection.socket_id,  // For excluding sender
        startPosition: { x: startPosition.x, y: startPosition.y, z: startPosition.z },
        targetPosition: { x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }
      };
      
      try {
        const response = await fetch('/api/pusher/movement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(movementData)
        });
        
        if (response.ok) {
          console.log('✅ Move-to-target sent via API successfully');
        } else {
          console.error('❌ Failed to send move-to-target via API:', response.status);
        }
      } catch (error) {
        console.error('❌ Error sending move-to-target via API:', error);
      }
    } else {
      console.warn('⚠️ Cannot send move-to-target - missing requirements:', { pusher: !!pusher, isConnected, currentUserId });
    }
  }, [pusher, isConnected, currentUserId]);

  const sendPlayerStopped = useCallback(async (position: Vector3) => {
    if (pusher && isConnected && currentUserId) {
      console.log('🛑 Sending player-stopped via API:', { position });
      
      const stopData = {
        type: 'player-stopped',
        playerId: currentUserId,  // Use presence channel user ID
        socketId: pusher.connection.socket_id,  // For excluding sender
        position: { x: position.x, y: position.y, z: position.z }
      };
      
      try {
        const response = await fetch('/api/pusher/movement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stopData)
        });
        
        if (response.ok) {
          console.log('✅ Player-stopped sent via API successfully');
        } else {
          console.error('❌ Failed to send player-stopped via API:', response.status);
        }
      } catch (error) {
        console.error('❌ Error sending player-stopped via API:', error);
      }
    }
  }, [pusher, isConnected, currentUserId]);
  
  const sendPositionSync = useCallback(async (position: Vector3) => {
    if (pusher && isConnected && currentUserId) {
      console.log('📡 Sending position sync via API:', { position });
      
      const syncData = {
        type: 'position-sync',
        playerId: currentUserId,  // Use presence channel user ID
        socketId: pusher.connection.socket_id,  // For excluding sender
        position: { x: position.x, y: position.y, z: position.z }
      };
      
      try {
        const response = await fetch('/api/pusher/movement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(syncData)
        });
        
        if (response.ok) {
          console.log('✅ Position sync sent via API successfully');
        } else {
          console.error('❌ Failed to send position sync via API:', response.status);
        }
      } catch (error) {
        console.error('❌ Error sending position sync via API:', error);
      }
    }
  }, [pusher, isConnected, currentUserId]);

  const value: PusherContextType = {
    currentPlayer,
    otherPlayers,
    isConnected,
    sendMoveToTarget,
    sendPlayerStopped,
    sendPositionSync,
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