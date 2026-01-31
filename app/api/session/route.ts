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

    const isHumanOpponent = opponent?.type === 'HUMAN';
    if (isHumanOpponent) {
      console.log('[Session] Skipping DB write for HUMAN opponent');
      return NextResponse.json({ ok: true, session: { sessionId, status: action === 'start' ? 'active' : 'closed' } });
    }

    let dbAvailable = false;
    if (process.env.MONGODB_URI) {
      try {
        await dbConnect();
        dbAvailable = true;
      } catch (err) {
        console.warn('[Session] MongoDB connection failed, proceeding without DB persistence.', err);
      }
    }

    if (action === 'start') {
      if (!dbAvailable) {
        console.log('[Session] Skipping DB write (no DB connection)');
        return NextResponse.json({ ok: true, session: { sessionId, status: 'active' } });
      }
      // Create or update session to active status
      try {
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
      } catch (e) {
         console.error('[Session] DB Write Error:', e);
         // Fallback even if write fails
         return NextResponse.json({ ok: true, session: { sessionId, status: 'active' } });
      }
    }

    if (action === 'end') {
      if (!dbAvailable) {
        console.log('[Session] Skipping DB write (no DB connection)');
        return NextResponse.json({ ok: true, session: { sessionId, status: 'closed' } });
      }
      // Update session status to closed
      try {
        const session = await GameSession.findOneAndUpdate(
          { sessionId },
          { status: 'closed' },
          { new: true }
        );

        if (!session) {
          // If not found in DB but strict mode off, just say ok
          return NextResponse.json({ ok: true, session: { sessionId, status: 'closed' } });
        }

        console.log(`[Session] Ended session: ${sessionId}`);
        return NextResponse.json({
          ok: true,
          session: {
            sessionId: session.sessionId,
            status: session.status,
          },
        });
      } catch (e) {
        console.warn('[Session] DB close error:', e);
        return NextResponse.json({ ok: true, session: { sessionId, status: 'closed' } });
      }
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
