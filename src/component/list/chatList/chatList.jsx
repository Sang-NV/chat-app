import "./chatList.css";
import { useState, useEffect } from "react"; // <-- Thêm useEffect
import { useChatStore } from "../../../context/ChatContext";
import authFetch from "../../../lib/authFetch";
import { toast } from "react-toastify";
import Userinfor from "../userinfor/userinfor"; 
import AddUser from "../addUser/addUser";
// <-- Đảm bảo bạn import Userinfor nếu nó nằm trong List

const ChatList = () => {
    const [addMode, setAddMode] = useState(false);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    const { currentUser, changeChat } = useChatStore(); // Lấy hàm changeChat

    // Hàm tải danh sách chat
    const fetchChats = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const res = await authFetch('/chats');
            const data = await res.json();

            if (res.ok) {
                setChats(data);
            } else {
                toast.error(data.message || "Không thể tải danh sách chat.");
                setChats([]);
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi kết nối khi tải danh sách chat.");
        } finally {
            setLoading(false);
        }
    };

    // Tự động tải khi component được mount hoặc khi currentUser thay đổi
    useEffect(() => {
        fetchChats();
    }, [currentUser]); // Trigger lại khi currentUser thay đổi

    // Xử lý khi chọn một chat
    const handleSelectChat = (chatItem) => {
        changeChat(chatItem); // Cập nhật chat đang chọn vào Context
    };

    if (loading) {
        return <div className="loading-chatlist">Loading Chats...</div>;
    }

    return (
        <div className="chatList">
            {/* Đặt Userinfor ở đây nếu nó là một phần của List */}
            <Userinfor /> 
            
            <div className="search">
                <div className="searchBar">
                    <img src="./search.png" alt="" />
                    <input type="text" placeholder="Search" />
                </div>
                <img 
                    src={addMode ? "./minus.png" : "./plus.png"} 
                    alt="" 
                    className="add"
                    onClick={()=>setAddMode((prev) => !prev)}
                />
            </div>

            {/* Render Danh sách Chat từ API */}
            {chats.map(chat => (
                <div 
                    className="item" 
                    key={chat.chatId} 
                    onClick={() => handleSelectChat(chat)}
                >
                    <img src={chat.receiverImg || "./avatar.png"} alt="" />
                    <div className="text">
                        <span>{chat.receiverName}</span>
                        <p>{chat.lastMessage || "Start a new conversation"}</p>
                    </div>
                </div>
            ))}

            {chats.length === 0 && !loading && (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    No chats found. Add a user to start!
                </div>
            )}
            
            {addMode && <AddUser />} 
        </div>
    );
};

export default ChatList;