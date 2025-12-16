import Chat from "./component/chat/chat"
import Detail from "./component/detail/detail"
import List from "./component/list/list"
import Login from "./component/login/login"
import Notification from "./component/notification/notification"
import { useState, useEffect } from "react";
import { ChatProvider, useChatStore } from "./component/context/ChatContext";

const AppContent = () => {
    const { currentUser, isLoading, loginSuccess } = useChatStore();

    if (isLoading) {
        // Có thể thêm hiệu ứng loading tại đây
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className='container'>
            {currentUser ? ( 
                <>
                    <List />
                    {/* Chat và Detail chỉ hiển thị khi có user */}
                    <Chat />
                    <Detail />
                </>
            ) : (
                // Truyền hàm loginSuccess vào Login
                <Login onAuthSuccess={loginSuccess} />
            )}
            <Notification />
        </div>
    )
}

// Bọc AppContent bằng Provider
const App = () => {
    return (
        <ChatProvider>
            <AppContent />
        </ChatProvider>
    );
};

export default App