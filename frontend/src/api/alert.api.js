import axios from 'axios';

const API_URL = window.location.origin + "/api";

export const getAlerts = async () => {
  try {
    const response = await axios.get(`${API_URL}/alerts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
};

export const postAlert = async (alertData) => {
  try {
    const response = await axios.post(`${API_URL}/alerts`, alertData);
    return response.data;
  } catch (error) {
    console.error('Error posting alert:', error);
    return null;
  }
};
