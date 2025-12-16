import "./userinfor.css"
import { useChatStore } from "../../context/ChatContext";

const Userinfor = () => {
  const { currentUser, logout } = useChatStore();

  if (!currentUser) return null; // Hoặc hiển thị loading/placeholder

  return (
    <div className='userinfor'>
      <div className="user">
        {/* Dùng ảnh thật hoặc ảnh mặc định */}
        <img src={currentUser.imgUrl || "./avatar.png"} alt="" /> 
        <h2>{currentUser.username}</h2>
      </div>
      <div className="icons">
        <img src="./more.png" alt="" />
        <img src="./video.png" alt="" />
        <img src="./edit.png" alt="" />
        {/* Thêm nút Logout tạm thời để test */}
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>
    </div>
  )
}
export default Userinfor