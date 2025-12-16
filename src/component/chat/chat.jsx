import "./chat.css"
import EmojiPicker from "emoji-picker-react"
import { useEffect, useRef } from "react"
import { useState } from "react"
import authFetch from '../lib/authFetch'; // Import hàm tiện ích
import { toast } from "react-toastify";

const CHAT_ID = 1;
const Chat = () => {
const [open, setOpen] = useState(false)
const [text, setText] = useState("")
const [isSending, setIsSending] = useState(false); // Trạng thái gửi

const endRef = useRef(null)

useEffect(() => {
  endRef.current?.scrollIntoView({behavior: "smooth"})
}, [])

const handleEmoji = e =>{
  setText(prev => prev + e.emoji);
  setOpen(false);
}

console.log(text)

const handleSend = async () => {
    if (!text || isSending) return; // Không gửi nếu trống hoặc đang gửi

    setIsSending(true);
    
    try {
        const res = await authFetch('/messages', {
            method: 'POST',
            body: JSON.stringify({
                chatId: CHAT_ID, // Thay bằng ID chat thực tế
                content: text,
            }),
        });

        const data = await res.json();
        
        if (res.ok) {
            toast.success("Tin nhắn đã được gửi!");
            setText(""); // Xóa nội dung input
            // TODO: Tại đây sẽ là logic hiển thị tin nhắn mới ngay lập tức (Socket.IO)
        } else {
            toast.error(data.message || "Gửi tin nhắn thất bại.");
        }
    } catch (err) {
        console.error("Lỗi gửi tin nhắn:", err);
        toast.error(err.message || "Lỗi mạng hoặc Token hết hạn.");
    } finally {
        setIsSending(false);
    }
  }

  return (
    <div className='chat'>
      <div className="top">
        <div className="user">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <span>SNV</span>
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
        <div className="message">
          <img src="./avatar.png" alt="" />
          <div className="text">
            <p>Hello</p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message own">
          <div className="text">
            <p>Hello</p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message">
          <img src="./avatar.png" alt="" />
          <div className="text">
            <p>Hello</p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message own">
          <div className="text">
            <img src="https://pixabay.com/illustrations/draw-nature-landscape-free-image-3583548/" alt="" />
            <p>Helloskhfjsnkfsirknksjnjkw</p>
            <span>1 min ago</span>
          </div>
        </div>
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <img src="./img.png" alt="" />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input type="text" placeholder="Type a message ..." 
        value={text}
        onChange={e=>setText(e.target.value)} />
        <div className="emoji">
          <img src="./emoji.png" alt=""onClick={() => setOpen((prev) => !prev)}/>
          <div className="picker">
          <EmojiPicker open={open} onEmojiClick={handleEmoji}/>
          </div>
        </div>
        
        <button className="sendButton">Send</button>
      </div>
    </div>
  )
}

// (Giả định bạn đã tạo file lib/authFetch.js)


const handleSend = async (chatId, content) => {
    // chatId và content là dữ liệu từ input

    try {
        const res = await authFetch('/messages', { // Tự động thêm Token
            method: 'POST',
            body: JSON.stringify({
                chatId: chatId,
                content: content,
            }),
        });

        const data = await res.json();
        
        if (res.ok) {
            // Xử lý thành công
            // (Tuy nhiên, để hiển thị real-time, bạn cần bước Socket.IO tiếp theo)
        } else {
            // Xử lý lỗi
        }
    } catch (err) {
        // Xử lý lỗi mạng/token hết hạn
    }
}

export default Chat