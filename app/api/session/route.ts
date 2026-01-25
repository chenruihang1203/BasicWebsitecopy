/**
 * Session Lifecycle API
 * Handles session start/end actions for chat conversations
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GameSession from '@/models/GameSession';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, action, opponent } = body;

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: 'sessionId and action are required' },
        { status: 400 }
      );
    }

    if (!['start', 'end'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "start" or "end"' },
        { status: 400 }
      );
    }

    await dbConnect();

    if (action === 'start') {
      // Create or update session to active status
      const session = await GameSession.findOneAndUpdate(
        { sessionId },
        {
          sessionId,
          status: 'active',
          startTime: new Date(),
          modelId: opponent?.modelId || undefined,
          actualOpponent: opponent?.type === 'HUMAN' ? 'HUMAN' : 'AI',
        },
        { upsert: true, new: true }
      );

      console.log(`[Session] Started session: ${sessionId}`);
      return NextResponse.json({
        ok: true,
        session: {
          sessionId: session.sessionId,
          status: session.status,
        },
      });
    }

    if (action === 'end') {
      // Update session status to closed
      const session = await GameSession.findOneAndUpdate(
        { sessionId },
        { status: 'closed' },
        { new: true }
      );

      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      console.log(`[Session] Ended session: ${sessionId}`);
      return NextResponse.json({
        ok: true,
        session: {
          sessionId: session.sessionId,
          status: session.status,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Session] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
