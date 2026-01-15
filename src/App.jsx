// App.jsx
import Chat from "./component/chat/chat"
import Detail from "./component/detail/detail"
import List from "./component/list/list"
import Login from "./component/login/login"
import Notification from "./component/notification/notification"
// IMPORT CHAT CONTEXT
import { ChatProvider, useChatStore } from "./component/context/ChatContext" 
// IMPORT useEffect nếu cần logic đăng nhập

const AppContent = () => { // Tạo component con để sử dụng hook
  // B1: Dùng Context để quản lý trạng thái người dùng
  const { currentUser, isLoading, loginSuccess } = useChatStore();

  if (isLoading) {
    return <div className="loading">Loading...</div>; // Hiển thị loading
  }

  return (
    <div className='container'>
      {currentUser ? ( // Thay thế biến user = false bằng currentUser
        <>
          <List />
          <Chat />
          <Detail />
        </>
      ) : (
        // Truyền hàm callback loginSuccess nếu Login không dùng Context trực tiếp
        <Login onAuthSuccess={loginSuccess} />
      )}
      <Notification />
    </div>
  )
}

const App = () => {
  return (
    // Bọc toàn bộ ứng dụng bằng ChatProvider
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  )
}

export default App