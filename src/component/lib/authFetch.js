// lib/authFetch.js

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Hàm fetch được bảo vệ bằng JWT.
 * Tự động lấy token từ Local Storage và thêm vào header Authorization.
 */
const authFetch = async (endpoint, options = {}) => {
    // 1. Lấy token từ Local Storage
    const token = localStorage.getItem('userToken');

    // 2. Chuẩn bị headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    // 3. Thêm Authorization header nếu có token
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 4. Gọi API
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: headers,
    });
    
    // Xử lý lỗi 401 (Unauthenticated)
    if (response.status === 401) {
        // TODO: Xóa token và chuyển hướng người dùng về trang đăng nhập
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        // window.location.href = '/login'; 
        throw new Error("Phiên làm việc hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
    }

    return response;
};

export default authFetch;