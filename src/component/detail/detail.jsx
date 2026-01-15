import "./detail.css"
import { useChatStore } from "../context/ChatContext";
import authFetch from "../lib/authFetch";

const Detail = () => {
    // 1. Lấy thông tin chat hiện tại, người dùng hiện tại và hàm logout
    const { currentChat, updateBlockState, logout } = useChatStore();

    // Ẩn component nếu chưa chọn chat
    if (!currentChat.isChatOpen) {
        return <div className='detail' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'gray' }}>Select a chat for details.</p>
        </div>;
    }

    // Lấy thông tin người nhận
    const receiver = currentChat.receiver;
    const { isBlockedByMe, amIBlockedByReceiver} = currentChat;

    const handleBlock = async () => {
        const blockedId = receiver.id;
        const action = isBlockedByMe ? 'unblock' : 'block';
        const apiEndpoint = `/users/${action}`; // Sử dụng authFetch

        try {
            const bodyKey = isBlockedByMe ? 'unblockedId' : 'blockedId';

            const res = await authFetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ [bodyKey]: blockedId })
            });

            if (res.ok) {
                // Cập nhật trạng thái chặn trong Global Store
                // Đảo ngược trạng thái 'isBlockedByMe'
                updateBlockState({ isBlockedByMe: !isBlockedByMe }); 
                console.log(`User ${isBlockedByMe ? 'unblocked' : 'blocked'} successfully!`);
                // TODO: Cập nhật UI của ChatInput (trong component khác) dựa vào trạng thái mới này.

            } else {
                console.error("Failed to update block status:", await res.json());
            }

        } catch (err) {
            console.error("Request error during block/unblock:", err);
        }
    };

    const buttonText = isBlockedByMe ? 'Unblock User' : 'Block User';
    
    return (
        <div className='detail'>
            <div className="user">
                {/* Hiển thị ảnh và tên người nhận */}
                <img src={receiver.imgUrl || "./avatar.png"} alt="" />
                <h2>{receiver.username}</h2>
                <p>Online</p> {/* Trạng thái online tĩnh */}
            </div>
            <div className="info">
                
                {/* CHAT SETTING */}
                <div className="option">
                    <div className="title">
                        <span>Chat Setting</span>
                        <img src="./arrowUp.png" alt="" />
                    </div>
                </div>
                
                {/* PRIVACY & HELP */}
                <div className="option">
                    <div className="title">
                        <span>Privacy & help</span>
                        <img src="./arrowUp.png" alt="" />
                    </div>
                </div>
                
                {/* SHARED PHOTO (Giữ nguyên tĩnh cho demo UI) */}
                <div className="option">
                    <div className="title">
                        <span>Shared photo</span>
                        <img src="./arrowDown.png" alt="" />
                    </div>
                    <div className="photo">
                        <div className="photoItem">
                            <div className="photoDetail">
                                <img src="https://cdn.pixabay.com/photo/2024/05/26/10/15/bird-8788491_1280.jpg" alt="" />
                                <span>Photo_2025_2.png</span>
                            </div>
                            <img src="./download.png" alt="" className="icon"/>
                        </div>
                        {/* ... Các photo item khác ... */}
                    </div>
                </div>
                
                {/* SHARED FILES */}
                <div className="option">
                    <div className="title">
                        <span>Shared Files</span>
                        <img src="./arrowUp.png" alt="" />
                    </div>
                </div>

                {/* Nút Block User */}
                <button onClick={handleBlock}>{buttonText}</button>
                
              
            </div>
        </div>
    );
}

export default Detail