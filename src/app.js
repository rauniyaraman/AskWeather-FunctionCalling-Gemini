// src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generativeModel } from "./models/geminiModel.js";
import { questionWeather } from "./extensions/support-utils.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// For ES Modules, __dirname is not available. We need to construct it.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors()); // Enable CORS if frontend is on a different origin
app.use(express.json()); // Parse JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// API Endpoint to handle user queries
app.post('/api/query', async (req, res) => {
  const userQuery = req.body.query;

  if (!userQuery) {
    return res.status(400).json({ error: "No query provided." });
  }

  try {
    // Start a chat session with the correct API key
    const chat = generativeModel.startChat({
      apiKey: process.env.GOOGLE_API_KEY // Ensure this matches your .env
    });

    // Send the user's query to the model
    const result = await chat.sendMessage(userQuery);
    console.log("Raw Result:", JSON.stringify(result, null, 2));

    const response = result.response;

    // Check if functionCalls is a function before invoking
    if (typeof response.functionCalls === 'function') {
      const requestedFunctions = await response.functionCalls();
      console.log("Requested Functions:", JSON.stringify(requestedFunctions, null, 2));

      if (Array.isArray(requestedFunctions) && requestedFunctions.length > 0) {
        const aiSelfCall = requestedFunctions[0];
        console.log("Function Call Detected:", JSON.stringify(aiSelfCall, null, 2));

        if (aiSelfCall) {
          console.log("Executing Function Call:", aiSelfCall.name);
          // Check if the function exists in questionWeather
          if (questionWeather[aiSelfCall.name]) {
            // Dynamic argument validation based on function name
            let isValid = true;
            switch (aiSelfCall.name) {
              case 'getWeather':
                if (!aiSelfCall.args || !aiSelfCall.args.location) {
                  console.error("Missing 'location' argument in 'getWeather' function call.");
                  isValid = false;
                }
                break;
              case 'echo':
                if (!aiSelfCall.args || !aiSelfCall.args.message) {
                  console.error("Missing 'message' argument in 'echo' function call.");
                  isValid = false;
                }
                break;
              default:
                console.error(`Unhandled function: ${aiSelfCall.name}`);
                isValid = false;
            }

            if (!isValid) {
              return res.status(400).json({ error: "Invalid function call parameters." });
            }

            // Execute the requested function with its arguments
            const functionResult = await questionWeather[aiSelfCall.name](aiSelfCall.args);
            console.log("Function Result:", JSON.stringify(functionResult, null, 2));

            // Handle potential errors from the function
            if (functionResult.error) {
              console.log(`Error: ${functionResult.error}`);
              return res.status(500).json({ error: `Failed to process function call: ${functionResult.error}` });
            } else {
              // Send the function's response back to the model
              const followUp = await chat.sendMessage([{
                functionResponse: { 
                  name: aiSelfCall.name, 
                  response: functionResult 
                }
              }]);

              // Get the final response text
              if (typeof followUp.response.text === 'function') {
                const finalResponse = await followUp.response.text();
                console.log("Final Model Response:", finalResponse);
                return res.json({ response: finalResponse });
              } else {
                console.error("response.text is not a function.");
                return res.status(500).json({ error: "Failed to retrieve final response from the model." });
              }
            }
          } else {
            console.error(`Function '${aiSelfCall.name}' not found in 'questionWeather'.`);
            return res.status(400).json({ error: `Function '${aiSelfCall.name}' not supported.` });
          }
        } else {
          console.log("No valid function call found.");
          // If no function call, just display the model's response
          if (typeof response.text === 'function') {
            const modelText = await response.text();
            console.log("Model Response:", modelText);
            return res.json({ response: modelText });
          } else {
            console.error("response.text is not a function.");
            return res.status(500).json({ error: "Failed to retrieve response from the model." });
          }
        }
      } else {
        console.log("No function calls requested by the model.");
        // If no function call, just display the model's response
        if (typeof response.text === 'function') {
          const modelText = await response.text();
          console.log("Model Response:", modelText);
          return res.json({ response: modelText });
        } else {
          console.error("response.text is not a function.");
          return res.status(500).json({ error: "Failed to retrieve response from the model." });
        }
      }
    } else {
      console.error("response.functionCalls is not a function.");
      // Handle cases where functionCalls is not available
      if (typeof response.text === 'function') {
        const modelText = await response.text();
        console.log("Model Response:", modelText);
        return res.json({ response: modelText });
      } else {
        console.error("response.text is not a function.");
        return res.status(500).json({ error: "Failed to retrieve response from the model." });
      }
    }
  } catch (error) {
    console.error("An error occurred in handleUserQuery:", error);
    // Check if it's a 503 error from Google Generative AI
    if (error.status === 503) {
      // Implement exponential backoff or inform the frontend to retry
      return res.status(503).json({ error: "The service is currently unavailable. Please try again later." });
    }
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Catch-all route to serve index.html for undefined routes (useful for single-page applications)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
