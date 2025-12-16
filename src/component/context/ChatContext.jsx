// src/context/ChatContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import authFetch from '../lib/authFetch'; 

const ChatContext = createContext();

// Khởi tạo trạng thái chat rỗng
const INITIAL_CHAT_STATE = {
    chatId: null,
    receiver: null, // Chứa {id, username, imgUrl} của người nhận
    isChatOpen: false,
};

export const ChatProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentChat, setCurrentChat] = useState(INITIAL_CHAT_STATE);
    const [isLoading, setIsLoading] = useState(true);

    // B1. Hàm tải thông tin người dùng hiện tại
    const fetchCurrentUser = async () => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            setCurrentUser(null);
            setIsLoading(false);
            return;
        }

        try {
            // Sử dụng API /api/users/me đã có trong server.js
            const res = await authFetch('/users/me'); 
            const data = await res.json();

            if (res.ok) {
                setCurrentUser(data);
            } else {
                localStorage.removeItem('userToken');
                localStorage.removeItem('userData');
                setCurrentUser(null);
            }
        } catch (err) {
            console.error("Fetch current user error:", err);
            setCurrentUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // B2. Xử lý đăng nhập/đăng ký thành công
    const loginSuccess = (userData) => {
        // Hàm này được gọi từ login.jsx
        setCurrentUser(userData);
        setIsLoading(false);
    };

    // B3. Xử lý đăng xuất
    const logout = () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        setCurrentUser(null);
        setCurrentChat(INITIAL_CHAT_STATE);
        // Có thể cần reload trang hoặc chuyển về màn hình Login
    };

    // B4. Chọn một chat trong ChatList
    const changeChat = (chatItem) => {
        // chatItem là object lấy từ API GET /api/chats
        setCurrentChat({
            chatId: chatItem.chatId,
            receiver: {
                id: chatItem.receiverId,
                username: chatItem.receiverName,
                imgUrl: chatItem.receiverImg,
            },
            isChatOpen: true,
        });
    };

    // Kiểm tra trạng thái người dùng khi khởi động
    useEffect(() => {
        fetchCurrentUser();
    }, []);

    return (
        <ChatContext.Provider value={{
            currentUser,
            currentChat,
            isLoading,
            loginSuccess,
            logout,
            changeChat
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChatStore = () => useContext(ChatContext);