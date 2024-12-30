// src/extensions/support-utils.js
import { getWeather } from "../api/weather.js";

// Function Declaration for getWeather
export const getWeatherFunctionDeclaration = {
  name: "getWeather",
  description: "Fetches weather information",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "The location to fetch weather for",
      },
    },
    required: ["location"],
  },
};

// Function Declaration for echo
export const echoFunctionDeclaration = {
  name: "echo",
  description: "Echoes back the provided message",
  parameters: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "The message to echo back",
      },
    },
    required: ["message"],
  },
};

// Map functions by name for dynamic execution
export const questionWeather = {
  getWeather: async ({ location }) => {
    if (typeof location !== 'string') {
      throw new Error("Invalid type for 'location'. Expected a string.");
    }
    return await getWeather(location);
  },
  echo: async ({ message }) => {
    if (typeof message !== 'string') {
      throw new Error("Invalid type for 'message'. Expected a string.");
    }
    return message;
  },
};
