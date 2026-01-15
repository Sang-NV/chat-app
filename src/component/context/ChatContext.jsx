import { createContext, useContext, useState, useEffect } from 'react';
import authFetch from '../lib/authFetch'; 

const ChatContext = createContext();

const INITIAL_CHAT_STATE = {
    chatId: null,
    receiver: null, 
    isChatOpen: false,
    isBlockedByMe: false,
    amIBlockedByReceiver: false
};

// Hàm tải trạng thái chặn
const fetchBlockStatus = async (receiverId) => {
    try {
        const res = await authFetch(`/users/block/status/${receiverId}`); // Sử dụng API đã tạo
        if (res.ok) {
            const data = await res.json();
            return {
                isBlockedByMe: data.isBlockedByMe,
                amIBlockedByReceiver: data.amIBlocked,
            };
        }
    } catch (err) {
        console.error("Error fetching block status:", err);
    }
    return { isBlockedByMe: false, amIBlockedByReceiver: false };
};

export const ChatProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentChat, setCurrentChat] = useState(INITIAL_CHAT_STATE);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshingChats, setIsRefreshingChats] = useState(false); 

    // Hàm tải thông tin người dùng hiện tại
    const fetchCurrentUser = async () => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            setCurrentUser(null);
            setIsLoading(false);
            return;
        }
        try {
            const res = await authFetch('/users/me'); 
            const data = await res.json();
            if (res.ok) {
                setCurrentUser(data);
            } else {
                localStorage.removeItem('userToken');
                setCurrentUser(null);
            }
        } catch (err) {
            setCurrentUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const loginSuccess = (userData) => {
        setCurrentUser(userData);
        setIsLoading(false);
        setIsRefreshingChats(prev => !prev); 
    };

    const logout = () => {
        localStorage.removeItem('userToken');
        setCurrentUser(null);
        setCurrentChat(INITIAL_CHAT_STATE);
    };

    const changeChat = async (chatItem) =>  {
        setIsLoading(true);
        const receiverInfo = {
            id: chatItem.receiverId,
            username: chatItem.receiverName,
            imgUrl: chatItem.receiverImg,
        };
        // 1. Tải trạng thái chặn mới nhất
        const blockStatus = await fetchBlockStatus(receiverInfo.id);

        setCurrentChat({
            chatId: chatItem.chatId,
            receiver: {
                id: chatItem.receiverId,
                username: chatItem.receiverName,
                imgUrl: chatItem.receiverImg,
            },
            isChatOpen: true,
            isBlockedByMe: blockStatus.isBlockedByMe,
            amIBlockedByReceiver: blockStatus.amIBlockedByReceiver
        });

        setIsLoading(false);
    };
    
    const refreshChatList = () => {
        setIsRefreshingChats(prev => !prev);
    }

    const updateBlockState = (newBlockStatus) => {
    setCurrentChat(prev => ({
        ...prev,
        isBlockedByMe: newBlockStatus.isBlockedByMe !== undefined ? newBlockStatus.isBlockedByMe : prev.isBlockedByMe,
        amIBlockedByReceiver: newBlockStatus.amIBlockedByReceiver !== undefined ? newBlockStatus.amIBlockedByReceiver : prev.amIBlockedByReceiver,
    }));
};

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    return (
        <ChatContext.Provider value={{
            currentUser,
            currentChat,
            isLoading,
            isRefreshingChats,
            loginSuccess,
            logout,
            changeChat,
            refreshChatList,
            updateBlockState
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChatStore = () => useContext(ChatContext);