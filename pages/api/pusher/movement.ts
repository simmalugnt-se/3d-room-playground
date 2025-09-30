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

  const { type, playerId, position, path, isMoving, socketId } = req.body;

  console.log(`\n🎮 Movement API called - Type: ${type}, Player: ${playerId}`);
  console.log(`🎮 Socket ID to exclude: ${socketId}`);

  try {
    if (type === 'move') {
      await pusher.trigger('presence-3d-room', 'player-moved', {
        playerId,
        position,
        path,
        isMoving: true
      }, {
        socket_id: socketId  // Exclude the sender from receiving the event
      });
      console.log('✅ Player movement event sent (excluding sender)');
    } else if (type === 'stop') {
      await pusher.trigger('presence-3d-room', 'player-stopped', {
        playerId,
        position
      }, {
        socket_id: socketId  // Exclude the sender from receiving the event
      });
      console.log('✅ Player stop event sent (excluding sender)');
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error sending movement event:', error);
    return res.status(500).json({ error: 'Failed to send movement event' });
  }
}