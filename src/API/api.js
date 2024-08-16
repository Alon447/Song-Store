import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api/',
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token'); // Retrieve the token from wherever you've stored it
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
