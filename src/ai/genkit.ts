import {genkit} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/googleai';
import {initializeApp} from 'firebase/app';

// This must be called before other Firebase services are used.
initializeApp({
  apiKey: "AIzaSyBzhvxseOkSsfSPNd19qyOxkma4Lk6hoG8",
  authDomain: "linksafe-dg5bq.firebaseapp.com",
  projectId: "linksafe-dg5bq",
  storageBucket: "linksafe-dg5bq.firebasestorage.app",
  messagingSenderId: "793839426344",
  appId: "1:793839426344:web:8f6f88b012a00b0af00e1d"
});

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
});
