// src/api/weather.js
import axios from "axios";
import axiosRetry from 'axios-retry';
import NodeCache from "node-cache";

// Initialize cache with a TTL of 10 minutes
const weatherCache = new NodeCache({ stdTTL: 600 });

// Apply retry configuration to axios
axiosRetry(axios, {
  retries: 3, // Number of retry attempts
  retryDelay: (retryCount) => {
    return axiosRetry.exponentialDelay(retryCount);
  },
  retryCondition: (error) => {
    // Retry on network errors or 5xx status codes
    return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
  },
});

export const getWeather = async (location) => {
  // Check if the weather data is cached
  const cachedData = weatherCache.get(location);
  if (cachedData) {
    console.log(`Serving weather data for ${location} from cache.`);
    return cachedData;
  }

  const baseUrl = "https://api.openweathermap.org/data/2.5/weather";
  const apiKey = process.env.WEATHER_API_KEY; // Use environment variable for API key
  const url = `${baseUrl}?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(url);
    const weather = response.data;
    const result = {
      description: weather.weather[0].description,
      temperature: weather.main.temp,
      location: weather.name,
    };
    
    // Cache the result
    weatherCache.set(location, result);
    
    return result;
  } catch (error) {
    console.error("Error fetching weather data:", error.response ? error.response.data : error.message);
    return { 
      error: error.response && error.response.data && error.response.data.message 
             ? error.response.data.message 
             : "Unable to fetch weather data at the moment." 
    };
  }
};
