import type { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';

// Initialize Pusher server instance
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
  useTLS: true
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, playerId, socketId, ...eventData } = req.body;

  console.log(`\n🎮 Movement API called - Type: ${type}, Player: ${playerId}`);
  console.log(`🎮 Socket ID to exclude: ${socketId}`);
  console.log(`🎮 Event data:`, eventData);

  try {
    switch (type) {
      case 'move-to-target':
        await pusher.trigger('presence-3d-room', 'player-move-to-target', {
          playerId,
          startPosition: eventData.startPosition,
          targetPosition: eventData.targetPosition,
          timestamp: Date.now()
        }, {
          socket_id: socketId  // Exclude the sender from receiving the event
        });
        console.log('✅ Player move-to-target event sent (excluding sender)');
        break;
        
      case 'player-stopped':
        await pusher.trigger('presence-3d-room', 'player-stopped', {
          playerId,
          position: eventData.position,
          timestamp: Date.now()
        }, {
          socket_id: socketId  // Exclude the sender from receiving the event
        });
        console.log('✅ Player stopped event sent (excluding sender)');
        break;
        
      case 'position-sync':
        // Occasional position sync for drift correction
        await pusher.trigger('presence-3d-room', 'player-position-sync', {
          playerId,
          position: eventData.position,
          timestamp: Date.now()
        }, {
          socket_id: socketId  // Exclude the sender from receiving the event
        });
        console.log('✅ Player position sync event sent (excluding sender)');
        break;
        
      default:
        console.error('❌ Unknown movement event type:', type);
        return res.status(400).json({ error: 'Unknown event type' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error sending movement event:', error);
    return res.status(500).json({ error: 'Failed to send movement event' });
  }
}
