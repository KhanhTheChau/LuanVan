import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

export const predictSingle = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await api.post('/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getDataset = async (limit = 50, skip = 0, isNoisy = null) => {
    const params = { limit, skip };
    if (isNoisy !== null) params.is_noisy = isNoisy;
    const response = await api.get('/dataset', { params });
    return response.data;
};

export const startUnlearning = async (config) => {
    const response = await api.post('/unlearn/start', config);
    return response.data;
};

export const getUnlearnStatus = async (jobId) => {
    const response = await api.get(`/unlearn/status/${jobId}`);
    return response.data;
};

export default api;
