// userinfor.jsx
import "./userinfor.css"
import { useChatStore } from "../../context/ChatContext";

const Userinfor = () => {
  // B1: Lấy thông tin người dùng và hàm logout từ Context
  const { currentUser, logout } = useChatStore();

  if (!currentUser) return null; // Không hiển thị nếu chưa có user

  return (
    <div className='userinfor'>
      <div className="user">
        <img src={currentUser.imgUrl || "./avatar.png"} alt="" />
        <h2>{currentUser.username}</h2>
      </div>
      <div className="icons">
        <img src="./more.png" alt="" />
        <img src="./video.png" alt="" />
        <img src="./edit.png" alt="" />
        {/* Thêm nút Logout */}
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>
    </div>
  )
}
export default Userinfor