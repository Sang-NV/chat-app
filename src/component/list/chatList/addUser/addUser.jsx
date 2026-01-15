import "./addUser.css"
import { useState } from "react";
import authFetch from "../../../lib/authFetch"; 
import { toast } from "react-toastify";
import { useChatStore } from "../../../context/ChatContext";const AddUser = ({ setAddMode }) => { 
    const [user, setUser] = useState(null); 
    const [loading, setLoading] = useState(false);
    const { refreshChatList } = useChatStore(); 

    const handleSearch = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get("username");

        if (!username) return;

        setLoading(true);
        setUser(null); // Reset user cũ
        
        try {
            // Gọi API GET /api/users/search
            const res = await authFetch(`/users/search?username=${username}`);
            const data = await res.json();
            
            if (res.ok) {
                setUser(data);
            } else {
                 toast.info(data.message || `No user found with username: ${username}.`);
            }
        } catch (err) {
            toast.error("Network error during search.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddChat = async () => {
        if (!user || loading) return;

        setLoading(true);
        try {
            // Gọi API POST /api/chats (để tạo chat)
            const res = await authFetch('/chats', {
                method: 'POST',
                body: { 
                    receiverId: user.id, // ID của người dùng vừa tìm thấy
                },
            });

            const data = await res.json();

            if (res.ok) {
                if(data.message === 'Chat already exists.'){
                     toast.info(`Chat with ${user.username} already exists.`);
                } else {
                     toast.success(`Chat with ${user.username} created successfully!`);
                }
                
                refreshChatList(); // Yêu cầu ChatList tải lại dữ liệu để hiển thị chat mới
                setAddMode(false); // Đóng modal
            } else {
                 toast.error(data.message || "Failed to create chat.");
            }
        } catch (err) {
            toast.error("Network error during chat creation.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='addUser'>
            <form onSubmit={handleSearch}>
                <input type="text" placeholder="Username" name="username" />
                <button disabled={loading}>
                    {loading ? "Searching..." : "Search"}
                </button>
            </form>
            
            {/* Hiển thị kết quả tìm kiếm */}
            {user && ( 
                <div className="user">
                    <div className="detail">
                        <img src={user.imgUrl || "./avatar.png"} alt="" />
                        <span>{user.username}</span>
                    </div>
                    <button onClick={handleAddChat} disabled={loading}>
                        {loading ? "Adding..." : "Add User"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AddUser