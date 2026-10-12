import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

async function testApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Testing key presence:', Boolean(apiKey), 'Length:', apiKey?.length);
  
  const models = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'];

  for (const model of models) {
    try {
      console.log(`\nAttempting call with model: ${model}...`);
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents: 'قل مرحباً واذكر أنك تعمل بنجاح',
      });
      console.log(`SUCCESS with ${model}!`);
      console.log('Response:', response.text);
      return;
    } catch (err: any) {
      console.error(`FAILED with ${model}:`);
      console.error('Status:', err.status || err.code || err.statusCode);
      console.error('Message:', err.message);
    }
  }
}

testApiKey();
