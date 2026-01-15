import AddUser from "./addUser/addUser";
import "./chatList.css";
import { useState, useEffect } from "react";
import { useChatStore } from "../../context/ChatContext";
import authFetch from "../../lib/authFetch";
import { toast } from "react-toastify";
import Userinfor from "../userinfor/userinfor"; 

const ChatList = () => {
  const [addMode, setAddMode] = useState(false);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  // B3: Lấy trạng thái từ Context
  const { currentUser, currentChat, changeChat, isRefreshingChats } = useChatStore();

  // B3: Hàm tải danh sách chat
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
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      // Tải lại khi người dùng đăng nhập hoặc khi có yêu cầu refresh (tạo chat mới)
      fetchChats();
  }, [currentUser, isRefreshingChats]); 

  // Xử lý khi chọn một chat
  const handleSelectChat = (chatItem) => {
      changeChat(chatItem); // Cập nhật chat đang chọn vào Context
  };
  
  if (loading) {
      return (
        <div className="chatList">
           <Userinfor />
           <div style={{ padding: '20px', textAlign: 'center' }}>Loading Chats...</div>
        </div>
      );
  }

  return(
   <div className="chatList">
    <Userinfor /> 
    <div className="search">
        <div className="searchBar">
            <img src="./search.png" alt="" />
            <input type="text" placeholder="Search" />
        </div>
        <img src={addMode ? "./minus.png" : "./plus.png"} alt="" className="add"
        onClick={()=>setAddMode((prev) => !prev)}/>
    </div>
    
    {/* Render Danh sách Chat từ API */}
    {chats.map(chat => (
        <div 
            className={`item ${currentChat.chatId === chat.chatId ? 'selected' : ''}`} 
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
    
    {/* Truyền setAddMode xuống AddUser */}
    {addMode && <AddUser setAddMode={setAddMode} />} 
  </div>
)}
export default ChatList;