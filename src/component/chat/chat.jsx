import "./chat.css"
import EmojiPicker from "emoji-picker-react"
import { useEffect, useRef } from "react"
import { useState } from "react"

const Chat = () => {
const [open, setOpen] = useState(false)
const [text, setText] = useState("")

const endRef = useRef(null)

useEffect(() => {
  endRef.current?.scrollIntoView({behavior: "smooth"})
}, [])

const handleEmoji = e =>{
  setText(prev => prev + e.emoji);
  setOpen(false);
}

console.log(text)

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

export default Chat