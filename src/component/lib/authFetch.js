// src/lib/authFetch.js

const API_BASE_URL = 'http://localhost:5000/api'; // Thay đổi nếu server chạy cổng khác

const authFetch = (endpoint, options = {}) => {
    const token = localStorage.getItem('userToken');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    // Chuỗi hoá body nếu là object và không phải GET/HEAD
    if (config.body && typeof config.body !== 'string' && config.method !== 'GET' && config.method !== 'HEAD') {
        config.body = JSON.stringify(config.body);
    }
    
    return fetch(`${API_BASE_URL}${endpoint}`, config);
};

export default authFetch;