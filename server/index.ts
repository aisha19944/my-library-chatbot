// ✅ Necessary imports
import axios from 'axios';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// ✅ Chat memory to track conversation
let conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];

// ✅ Chat with OpenRouter (Free AI Model)
async function chatWithOpenRouter(message: string) {
  conversationHistory.push({ role: 'user', content: message });

  // Keep only the last 10 messages
  if (conversationHistory.length > 10) {
    conversationHistory = conversationHistory.slice(-10);
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3-8b-instruct', // ✅ Valid free model
        messages: [
          {
            role: 'system',
            content:
              'You are a smart academic assistant for students of Usmanu Danfodiyo University, Sokoto. Answer clearly, help with school questions, and provide helpful academic support.',
          },
          ...conversationHistory,
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiReply = response.data.choices?.[0]?.message?.content?.trim();
    conversationHistory.push({ role: 'assistant', content: aiReply });
    return aiReply || '🤖 Sorry, I couldn’t process that.';
  } catch (error: any) {
    console.error('❌ OpenRouter error:', error.response?.data || error.message);
    return '❌ Sorry, I ran into an error while thinking. Try again later.';
  }
}

// ✅ POST /chat — handle user messages
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message || '';
  console.log('📥 User message:', userMessage);

  const reply = await chatWithOpenRouter(userMessage);
  res.json({ reply });
});

// ✅ Serve your HTML interface
app.get('/', (_req, res) => {
  res.sendFile(__dirname + '/../public/index.html');
});

// ✅ Start server
app.listen(port, () => {
  console.log(`🚀 Library chatbot running at http://localhost:${port}`);
});
