import "./chat.css"
import EmojiPicker from "emoji-picker-react"
import { io } from "socket.io-client";
import { useEffect, useRef } from "react"
import { useState } from "react"
import authFetch from '../lib/authFetch'; 
import { toast } from "react-toastify";
import {useChatStore} from "../context/ChatContext"

const socket = io("http://localhost:5000");

const Chat = () => {
    const [open, setOpen] = useState(false)
    const [text, setText] = useState("")
    const [isSending, setIsSending] = useState(false); 
    const [messages, setMessages] = useState([]); 
    const [loading, setLoading] = useState(true);

    const { currentChat, currentUser, refreshChatList } = useChatStore(); 

    const endRef = useRef(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages]);
    
    // 1. Tải lịch sử tin nhắn khi chat thay đổi (currentChat.chatId)
    useEffect(() => {
        if (!currentChat.chatId) {
            setLoading(false);
            setMessages([]);
            return;
        }
        // 1. Đăng ký Socket ID (B5)
        // Gửi ID người dùng hiện tại lên server để mapping socket
        socket.emit('register', currentUser.id);

        // 2. Fetch lịch sử tin nhắn (B4)
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const res = await authFetch(`/messages/${currentChat.chatId}`);
                const data = await res.json();
                if (res.ok) {
                    setMessages(data);
                }
            } catch (err) {
                console.error("Lỗi tải tin nhắn:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // 3. Lắng nghe tin nhắn mới từ Socket (B5)
        const handleReceiveMessage = (message) => {
            // Cả người gửi và người nhận đều nghe sự kiện này (receiveMessage hoặc messageSentConfirmation)
            // Chỉ cập nhật state nếu tin nhắn thuộc chat đang mở
            if (message.chatId === currentChat.chatId) {
                setMessages(prev => [...prev, message]);
                // Refresh ChatList để cập nhật lastMessage ngay lập tức
                refreshChatList(); 
            } else {
                 // Nếu tin nhắn từ chat khác, vẫn refresh list để hiển thị thông báo/lastMessage mới
                 refreshChatList(); 
            }
        };

        // Lắng nghe tin nhắn đến (từ người nhận)
        socket.on('receiveMessage', handleReceiveMessage);
        // Lắng nghe xác nhận gửi thành công (từ người gửi)
        socket.on('messageSentConfirmation', handleReceiveMessage); 

        return () => {
            // Dọn dẹp listener khi component unmount hoặc chatId thay đổi
            socket.off('receiveMessage', handleReceiveMessage);
            socket.off('messageSentConfirmation', handleReceiveMessage);
        };
    }, [currentChat.chatId, currentUser, refreshChatList]);



    const handleEmoji = e => {
      setText(prev => prev + e.emoji);
      setOpen(false);
    }

    // 2. Xử lý gửi tin nhắn
    const handleSend = async () => {
        // Cần đảm bảo có text, không đang gửi, và đã chọn chat
        if (!text || isSending || !currentChat.chatId) return;

        setIsSending(true);
        
        try {
            // POST tới API /api/messages (Đã được tạo ở bước trước)
            const res = await authFetch('/messages', {
                method: 'POST',
                body: { 
                    chatId: currentChat.chatId, 
                    content: text,
                    // THÊM receiverId: Cần thiết cho logic Backend (cập nhật last_message và Socket.IO ở Bước 5)
                    receiverId: currentChat.receiver.id, 
                },
            });

            if (res.ok) {
              
                setText(""); 

                
            } else {
                const data = await res.json();
                toast.error(data.message || "Gửi tin nhắn thất bại.");
            }
        } catch (err) {
            toast.error(err.message || "Lỗi mạng hoặc Token hết hạn.");
        } finally {
            setIsSending(false);
        }
    }

    // Xử lý khi chưa chọn chat
    if (!currentChat.isChatOpen) {
        return <div className='chat' style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <h2 style={{color: 'gray'}}>Please select a chat to start messaging.</h2>
        </div>;
    }

    if (loading) {
         return <div className='chat'>Loading messages...</div>;
    }


    return (
        <div className='chat'>
            <div className="top">
                <div className="user">
                    <img src={currentChat.receiver.imgUrl || "./avatar.png"} alt="" />
                    <div className="texts">
                        <span>{currentChat.receiver.username}</span>
                        <p>Online</p>
                    </div>
                </div>
                <div className="icons">
                    <img src="./phone.png" alt="" />
                    <img src="./video.png" alt="" />
                    <img src="./info.png" alt="" />
                </div>
            </div>
            
            <div className="center">
                {messages.map((m) => (
                    <div 
                        className={m.sender_id === currentUser.id ? "message own" : "message"} 
                        key={m.id} 
                    >
                        {m.sender_id !== currentUser.id && <img src={currentChat.receiver.imgUrl || "./avatar.png"} alt="" />}
                        <div className="text">
                            <p>{m.content}</p>
                            <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                        </div>
                    </div>
                ))}
                
                <div ref={endRef}></div>
            </div>

            <div className="bottom">
                <div className="icons">
                    <img src="./img.png" alt="" />
                    <img src="./camera.png" alt="" />
                    <img src="./mic.png" alt="" />
                </div>
                <input 
                    type="text" 
                    placeholder="Type a message ..." 
                    value={text}
                    onChange={e=>setText(e.target.value)} 
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSend();
                    }}
                />
                <div className="emoji">
                    <img src="./emoji.png" alt=""onClick={() => setOpen((prev) => !prev)}/>
                    <div className="picker">
                        <EmojiPicker open={open} onEmojiClick={handleEmoji}/>
                    </div>
                </div>
                
                <button 
                    className="sendButton" 
                    onClick={handleSend} 
                    disabled={isSending || !text}
                >
                    {isSending ? "Sending..." : "Send"}
                </button>
            </div>
        </div>
    )
}

export default Chat