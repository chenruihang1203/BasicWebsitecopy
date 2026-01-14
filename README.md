# Strategic Turing Test Game - MVP

A research data collection platform where players chat with an AI opponent and try to detect if they're talking to a human or AI.

## 🎯 Features

- **Time-Limited Conversations**: 5-turn chat sessions
- **Research Data Collection**: All messages, timestamps, and decisions logged to MongoDB
- **AI Integration**: Uses OpenAI GPT-4 via Vercel AI SDK
- **Scoring System**: Points for correct guesses + speed bonuses
- **Modern UI**: Beautiful Tailwind CSS interface

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **AI**: Vercel AI SDK (OpenAI provider)
- **Styling**: Tailwind CSS

## 📦 Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

3. **Configure your `.env.local` file**:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   OPENAI_API_KEY=your_openai_api_key
   ```

   - Get MongoDB URI from [MongoDB Atlas](https://cloud.mongodb.com)
   - Get OpenAI API Key from [OpenAI Platform](https://platform.openai.com)

## 🚀 Running the Application

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # AI chat endpoint with data logging
│   │   └── game/
│   │       ├── init/route.ts      # Game session initialization
│   │       └── submit/route.ts    # Player guess submission
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main game UI
│   └── globals.css                # Global styles
├── lib/
│   └── db.ts                      # MongoDB connection helper
├── models/
│   └── GameSession.ts             # Mongoose schema for game data
├── .env.example                   # Environment variables template
├── next.config.mjs                # Next.js configuration
├── package.json                   # Dependencies
├── tailwind.config.ts             # Tailwind CSS configuration
└── tsconfig.json                  # TypeScript configuration
```

## 🎮 How It Works

1. **Game Initialization**: When a player starts, a unique session is created in MongoDB
2. **Chat Flow**: Each message exchange is logged with timestamps via the `onFinish` callback
3. **Decision Time**: After 5 turns, player makes their guess (Human or AI)
4. **Scoring**: 
   - Base score: 100 points for correct guess
   - Speed bonus: Up to 50 points for quick detection
   - Message bonus: Up to 25 points for efficient detection
5. **Data Storage**: All interaction data stored for research purposes

## 🔬 Research Data Collected

Each game session captures:
- Unique session ID
- Start timestamp
- All messages with timestamps
- Player's final guess
- Decision timestamp
- Correctness of guess
- Final score

## 📊 Database Schema

```typescript
{
  sessionId: String (unique)
  startTime: Date
  messages: [{
    role: 'user' | 'assistant'
    content: String
    timestamp: Date
  }]
  playerGuess: 'AI' | 'HUMAN'
  actualOpponent: 'AI'
  isCorrect: Boolean
  decisionTime: Date
  score: Number
}
```

## 🤖 AI Configuration

The AI is prompted to:
- Act naturally like a human
- Use casual language and occasional slang
- Show personality and opinions
- Keep responses brief and conversational
- Not be too perfect (subtle human-like imperfections)

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

Ensure your platform supports:
- Node.js 18+
- Next.js 14+
- Environment variables
- MongoDB connection

## 📝 License

MIT

## 🙏 Acknowledgments

Built for research purposes to study human detection of AI in conversational contexts.
