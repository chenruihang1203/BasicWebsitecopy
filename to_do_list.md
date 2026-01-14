Created 10 todos

## 📋 **Next To-Do List** (10 Tasks)

### 🔑 **Critical Setup (Do First)**

**1. Add MongoDB Connection String** 🔴  
→ **File**: Create `.env.local` in project root  
→ **Add**: `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name`  
→ **Reference**: db.ts (already exists and uses this variable)

**2. Add OpenAI API Key** 🔴  
→ **File**: Same `.env.local`  
→ **Add**: `OPENAI_API_KEY=sk-...your-key`  
→ **Reference**: route.ts (already exists and needs this)

---

### 🔌 **Backend API Integration**

**3. Create User Authentication API**  
→ **Create**: route.ts  
→ **Purpose**: Login/register endpoints  
→ **Update**: page.tsx to fetch real user data

**4. Replace Mock Users with Real API** ⚡  
→ **File to modify**: page.tsx (line ~38, replace `mockUsers`)  
→ **Create endpoint**: route.ts  
→ **MongoDB**: Query Users collection  
→ **Example**:
```typescript
useEffect(() => {
  fetch('/api/users/list')
    .then(res => res.json())
    .then(data => setUsers(data));
}, []);
```

**5. Replace Mock Messages with Real Chat API** ⚡  
→ **File to modify**: page.tsx (line ~56, replace `initialMockMessages`)  
→ **Create endpoints**:  
  - GET `/api/chat/messages/[userId]` - fetch conversation  
  - POST `/api/chat/send` - save to MongoDB Messages collection

**6. Integrate Real-time Chat (Optional)**  
→ **Technology**: Socket.io or WebSockets  
→ **Create**: route.ts  
→ **Update**: Message sending in page.tsx

**7. Create User Profile API Endpoints**  
→ **Create**: route.ts  
→ **Methods**: GET (fetch), PUT (update)  
→ **Replace**: `mockUserProfile` in page.tsx

---

### 🗄️ **Database Schema**

**8. Add MongoDB Schema Models**  
→ **Create in models folder**:
  - `User.ts` - name, email, bio, avatar, status
  - `Message.ts` - senderId, receiverId, text, timestamp  
  - `Conversation.ts` - participants, lastMessage  
→ **Template**: Use existing GameSession.ts as reference

---

### 📦 **Dependencies & Testing**

**9. Install Required Dependencies**  
→ **Run if needed**: `npm install next-auth bcryptjs jsonwebtoken socket.io`  
→ **Already installed**: mongoose, @ai-sdk/openai, @ai-sdk/react, ai

**10. Test API Integration**  
→ **Create**: `/api/test-db` endpoint to verify MongoDB connection  
→ **Test**: User list, message send/receive, profile updates  
→ **Check**: Browser console & Network tab for errors

---

## 🎯 **Quick Start Guide**

1. **Right now**: Create `.env.local` with MongoDB + OpenAI keys (Tasks #1-2)
2. **Test connection**: Run `npm run dev` and check if it starts without errors
3. **Next**: Create API endpoints one by one (Tasks #4-7)
4. **Finally**: Replace mock data with API calls in page.tsx

Would you like me to help you create any of these files or implement specific functionality?