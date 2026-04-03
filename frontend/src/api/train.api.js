import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export const getAllTrains = async () => {
  try {
    const response = await axios.get(`${API_URL}/trains`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trains:', error);
    throw error;
  }
};

export const getTrainsByBounds = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/trains/bounds`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching trains by bounds:', error);
    throw error;
  }
};

export const getTrainByNumber = async (trainNumber) => {
  try {
    const response = await axios.get(`${API_URL}/trains/${trainNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching train:', error);
    throw error;
  }
};

export const getTrainRoute = async (trainNumber) => {
  try {
    const response = await axios.get(`${API_URL}/trains/${trainNumber}/route`);
    return response.data;
  } catch (error) {
    console.error('Error fetching train route:', error);
    throw error;
  }
};

export const getTrainStatistics = async () => {
  try {
    const response = await axios.get(`${API_URL}/trains/statistics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching train statistics:', error);
    throw error;
  }
};
