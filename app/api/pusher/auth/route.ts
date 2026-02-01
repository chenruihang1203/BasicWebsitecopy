import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const socketId = body.get('socket_id') as string;
    const channelName = body.get('channel_name') as string;

    if (!socketId || !channelName) {
      console.error('Missing socket_id or channel_name');
      return new Response('Missing socket_id or channel_name', { status: 400 });
    }

    console.log('Auth request for channel:', channelName);

    // Support for presence channels
    if (channelName.startsWith('presence-')) {
      // Extract userName from custom params (sent from client auth.params)
      const userName = body.get('user_name') as string || 'Anonymous';
      const userId = body.get('user_id') as string || `user_${Date.now()}`;
      const userFaction = body.get('user_faction') as string || null;

      console.log('Presence auth for user:', userName, 'with ID:', userId);

      const presenceData = {
        user_id: userId,
        user_info: {
          name: userName,
          faction: userFaction,
        },
      };

      const authResponse = pusher.authorizeChannel(socketId, channelName, presenceData);
      console.log('Auth response generated successfully');
      return NextResponse.json(authResponse);
    }

    // Standard private channel auth
    console.log('Private channel auth');
    const authResponse = pusher.authenticate(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
