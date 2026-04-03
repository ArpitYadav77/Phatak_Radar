import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export const getAllPhataks = async () => {
  try {
    const response = await axios.get(`${API_URL}/phataks`);
    return response.data;
  } catch (error) {
    console.error('Error fetching phataks:', error);
    throw error;
  }
};

export const getPhatakById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/phataks/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching phatak:', error);
    throw error;
  }
};

export const createPhatak = async (phatakData) => {
  try {
    const response = await axios.post(`${API_URL}/phataks`, phatakData);
    return response.data;
  } catch (error) {
    console.error('Error creating phatak:', error);
    throw error;
  }
};

export const updatePhatak = async (id, phatakData) => {
  try {
    const response = await axios.put(`${API_URL}/phataks/${id}`, phatakData);
    return response.data;
  } catch (error) {
    console.error('Error updating phatak:', error);
    throw error;
  }
};

export const deletePhatak = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/phataks/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting phatak:', error);
    throw error;
  }
};

export const fetchPhataksByBounds = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/phataks`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching phataks by bounds:', error);
    throw error;
  }
};
