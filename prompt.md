Act as a Senior Full Stack Developer. I need to build a "Strategic Turing Test Game" MVP.

**Tech Stack:**
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Database: MongoDB (using Mongoose ODM)
- AI Integration: Vercel AI SDK (using OpenAI provider)
- Styling: Tailwind CSS

**Game Concept:**
A player enters a chat room and plays a short, time-limited conversation (e.g., 5 turns) against a hidden opponent. The opponent is an AI. The player must guess if the opponent is Human or AI.
**Crucial Goal:** This is a research data collection platform. We must log every message, timestamp, and the final user decision to the database.

**Please generate the core code files for this MVP. Follow these specific requirements:**

1.  **Database Connection (`lib/db.ts`):**
    - Create a standard Mongoose connection helper that caches the connection (to prevent cold start issues in Next.js).

2.  **Data Schema (`models/GameSession.ts`):**
    - Create a Mongoose schema to store the game session.
    - Fields needed:
        - `sessionId`: String (unique)
        - `startTime`: Date
        - `messages`: Array of objects `{ role: 'user' | 'assistant', content: string, timestamp: Date }`
        - `playerGuess`: String ('AI' | 'HUMAN')
        - `actualOpponent`: String ('AI')
        - `isCorrect`: Boolean
        - `decisionTime`: Date (When the user made the guess)
        - `score`: Number

3.  **AI Chat Route (`app/api/chat/route.ts`):**
    - Use the Vercel AI SDK (`streamText` or `OpenAIStream`).
    - **CRITICAL DATA COLLECTION STEP:** Inside the `onFinish` callback of the stream, you must connect to MongoDB and update the current `GameSession` with the new messages (both user input and AI response) and their timestamps. This ensures we capture the conversation flow for research.
    - The AI system prompt should tell it to act like a casual human to try and pass the Turing test.

4.  **Game End/Score Route (`app/api/game/submit/route.ts`):**
    - A POST route that receives the `sessionId`, `playerGuess`, and `decisionTime`.
    - It should update the database with the guess.
    - Calculate a score: Base score + bonus for speed (if correct).
    - Return the result (Correct/Incorrect) and the score.

5.  **Main Game UI (`app/page.tsx`):**
    - Use the `useChat` hook from `ai/react`.
    - Display a simple chat interface.
    - Show a "Turn Count" or "Timer".
    - Provide two buttons: "Guess Human" and "Guess AI".
    - When the game starts, generate a `sessionId` and create a blank document in MongoDB.
    - When a guess is made, call the submit route and show the Game Over screen with the score.

Please write the full code for these files.