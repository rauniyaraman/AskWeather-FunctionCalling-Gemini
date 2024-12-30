// src/models/geminiModel.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getWeatherFunctionDeclaration, echoFunctionDeclaration } from "../extensions/support-utils.js";
import dotenv from 'dotenv';

dotenv.config(); // Ensure environment variables are loaded

// console.log("Loading Function Declarations:", getWeatherFunctionDeclaration, echoFunctionDeclaration);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY); // Use environment variable

const generativeModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  tools: {
    functionDeclarations: [getWeatherFunctionDeclaration, echoFunctionDeclaration],
  },
});

console.log("Generative Model Initialized with Function Declarations.");

export { generativeModel };
