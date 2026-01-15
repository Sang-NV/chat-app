import http from 'http'; 
import { Server } from 'socket.io';
import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import db from './src/component/database/db.js'; // Kết nối MySQL (ESM import)
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import process from 'process';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_KEY';

// 1. API Đăng Ký Người Dùng
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, imgUrl } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
        // Băm (Hash) mật khẩu
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Chèn dữ liệu người dùng vào bảng 'users'
        const [userResult] = await db.execute(
            'INSERT INTO users (username, email, password_hash, imgUrl) VALUES (?, ?, ?, ?)',
            [username, email, password_hash, imgUrl]
        );

        const newUserId = userResult.insertId;

        // Trả về thành công
        return res.status(201).json({ 
            message: "Account created successfully!", 
            userId: newUserId 
        });

    } catch (error) {
        // Lỗi: Ví dụ, email đã tồn tại (nếu cột email được đặt là UNIQUE)
        console.error("Registration error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Email already in use." });
        }
        return res.status(500).json({ message: "Internal server error." });
    }
});

// Cấu hình lưu trữ cho Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Tệp sẽ được lưu vào thư mục 'uploads'
        cb(null, uploadsDir); 
    },
    filename: (req, file, cb) => {
        // Đảm bảo tên tệp là duy nhất (dùng timestamp + tên gốc)
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const uploadMiddleware = multer({ storage: storage });

// 3. API Đăng Nhập Người Dùng
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // B1: Tìm người dùng theo email
        const [rows] = await db.execute('SELECT id, username, email, password_hash, imgUrl FROM users WHERE email = ?', [email]);
        
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials (User not found).' });
        }

        // B2: So sánh mật khẩu đã băm (hash)
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials (Wrong password).' });
        }

        // B3: Tạo JWT (JSON Web Token)
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '1d' } // Token hết hạn sau 1 ngày
        );

        // B4: Trả về token và thông tin người dùng
        return res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                imgUrl: user.imgUrl
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// 2. API Tải Lên Tệp (Avatar)
app.post('/api/upload', uploadMiddleware.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
    }

    const publicUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;

    return res.status(200).json({ 
        message: "File uploaded successfully.",
        imgUrl: publicUrl
    });
});

// Phục vụ tệp tĩnh (Cần thiết để trình duyệt hiển thị hình ảnh)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Middleware để xác thực Token JWT
const authMiddleware = (req, res, next) => {
    // 1. Lấy Token từ Header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token missing or invalid format.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Giải mã và Xác minh Token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 3. Gắn thông tin người dùng vào đối tượng request
        // Các API sau middleware này có thể truy cập req.userId
        req.userId = decoded.id; 
        
        // 4. Cho phép request đi tiếp
        next();
    } catch (error) {
        console.error("JWT verification failed:", error);
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

// server.js (Thêm API Tìm kiếm Người dùng)

app.get('/api/users/search', authMiddleware, async (req, res) => {
    const { username } = req.query;
    const currentUserId = req.userId;

    if (!username) {
        return res.status(400).json({ message: 'Username query parameter is required.' });
    }

    try {
        // Tìm người dùng KHÁC user hiện tại bằng username
        const [users] = await db.execute(
            'SELECT id, username, imgUrl FROM users WHERE username = ? AND id != ? LIMIT 1',
            [username, currentUserId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Trả về thông tin user tìm thấy
        res.status(200).json(users[0]);

    } catch (error) {
        console.error("Error searching user:", error);
        res.status(500).json({ message: "Error searching user." });
    }
});

app.get('/api/users/me', authMiddleware, async (req, res) => {
    try {
        // Lấy userId từ token đã được giải mã bởi middleware
        const userId = req.userId; 

        // Truy vấn dữ liệu người dùng từ MySQL
        const [rows] = await db.execute('SELECT id, username, email, imgUrl FROM users WHERE id = ?', [userId]);

        const user = rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json(user);

    } catch (error) {
        console.error("Fetch user data error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// server.js (Thêm API Tạo Chat mới)

app.post('/api/chats', authMiddleware, async (req, res) => {
    const { receiverId } = req.body;
    const senderId = req.userId; // Người dùng hiện tại

    if (!receiverId) {
        return res.status(400).json({ message: 'Receiver ID is required.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Kiểm tra chat đã tồn tại chưa
        const [existingChat] = await connection.execute(`
            SELECT uc1.chat_id 
            FROM user_chats uc1
            JOIN user_chats uc2 ON uc1.chat_id = uc2.chat_id
            WHERE uc1.user_id = ? AND uc2.user_id = ?
        `, [senderId, receiverId]);
        
        if (existingChat.length > 0) {
            await connection.rollback();
            return res.status(200).json({ 
                message: 'Chat already exists.', 
                chatId: existingChat[0].chat_id 
            });
        }

        // 2. Tạo chat mới
        const [chatResult] = await connection.execute(
            'INSERT INTO chats (createdAt) VALUES (NOW())'
        );
        const newChatId = chatResult.insertId;

        // 3. Thêm cả hai người dùng vào chat
        await connection.execute(
            'INSERT INTO user_chats (chat_id, user_id) VALUES (?, ?), (?, ?)',
            [newChatId, senderId, newChatId, receiverId]
        );

        await connection.commit();

        res.status(201).json({ message: 'Chat created successfully.', chatId: newChatId });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error creating chat:", error);
        res.status(500).json({ message: "Error creating chat." });
    } finally {
        if (connection) connection.release();
    }
});
// server.js (Thêm API Kiểm tra Trạng thái Chặn)

app.get('/api/users/block/status/:otherUserId', authMiddleware, async (req, res) => {
    const blockerId = req.userId; // Người dùng hiện tại
    const blockedId = req.params.otherUserId;

    if (!blockedId) {
        return res.status(400).json({ message: 'Missing user ID to check block status.' });
    }

    try {
        // Kiểm tra xem blockerId (người dùng hiện tại) có chặn blockedId (người nhận) không
        const [rows] = await db.execute(
            'SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
            [blockerId, blockedId]
        );

        const isBlocked = rows.length > 0;
        
        // Cần thêm kiểm tra xem người nhận có chặn mình không (để hiển thị trạng thái chặn 2 chiều)
        const [receiverBlockedMe] = await db.execute(
            'SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
            [blockedId, blockerId]
        );
        const amIBlocked = receiverBlockedMe.length > 0;


        return res.status(200).json({ 
            isBlockedByMe: isBlocked, // Tôi chặn họ
            amIBlocked: amIBlocked // Họ chặn tôi
        });

    } catch (error) {
        console.error("Error checking block status:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// HÀM KIỂM TRA CHẶN (Block Check Helper)
const isBlocked = async (user1Id, user2Id) => {
    // Kiểm tra xem user1Id có chặn user2Id không
    const [rows] = await db.execute(
        'SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
        [user1Id, user2Id]
    );
    return rows.length > 0;
};

// API Gửi Tin Nhắn (ĐÃ CHỈNH SỬA)
app.post('/api/messages', authMiddleware, async (req, res) => {
    const { chatId, content } = req.body;
    const senderId = req.userId;

    if (!chatId || !content) {
        return res.status(400).json({ message: 'Chat ID and content are required.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Xác định receiverId (người nhận)
        const [participants] = await connection.execute(
            'SELECT user_id FROM user_chats WHERE chat_id = ? AND user_id != ?',
            [chatId, senderId]
        );
        const receiverId = participants.length > 0 ? participants[0].user_id : null;

        if (!receiverId) {
             await connection.rollback();
             return res.status(404).json({ message: 'Chat participants not found.' });
        }
        
        // 🚨 KIỂM TRA QUY TẮC CHẶN 🚨

        // 1. Kiểm tra Người nhận chặn Người gửi (Họ chặn mình)
        const receiverBlockedSender = await isBlocked(receiverId, senderId);

        // 2. Kiểm tra Người gửi chặn Người nhận (Mình chặn họ)
        const senderBlockedReceiver = await isBlocked(senderId, receiverId);

        if (receiverBlockedSender || senderBlockedReceiver) {
         await connection.rollback();
    
         // Vô hiệu hóa tin nhắn nếu chặn xảy ra ở bất kỳ chiều nào
         return res.status(200).json({ 
        message: "Message processing silently failed (blocked in one direction)." 
    });
}

        // A. Ghi Tin Nhắn Mới vào bảng 'messages'
        const [messageResult] = await connection.execute(
            'INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)',
            [chatId, senderId, content]
        );
        const newMessageId = messageResult.insertId;

        // B. Cập nhật bảng 'chats'
        await connection.execute(
            'UPDATE chats SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [chatId]
        );

        // C. Cập nhật bảng 'user_chats'
        await connection.execute(
            'UPDATE user_chats SET last_message_id = ? WHERE chat_id = ?',
            [newMessageId, chatId]
        );

        await connection.commit();

        // =============== LOGIC SOCKET.IO (Vẫn thực hiện như cũ) ===============
        const messagePayload = {
            id: newMessageId, 
            chatId: chatId,
            sender_id: senderId,
            content: content,
            createdAt: new Date().toISOString(), 
        };

        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receiveMessage', messagePayload);
        }

        const senderSocketId = userSocketMap[senderId];
        if (senderSocketId && senderSocketId !== receiverSocketId) {
            io.to(senderSocketId).emit('messageSentConfirmation', messagePayload);
        }

        res.status(201).json({ 
            message: "Message sent successfully.", 
            messageId: newMessageId 
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Error sending message." });
    } finally {
        connection.release();
    }
});


// API 5: Lấy Danh sách Chat của người dùng hiện tại
app.get('/api/chats', authMiddleware, async (req, res) => {
    const userId = req.userId; // ID người dùng hiện tại từ JWT

    try {
        // Truy vấn phức tạp: Lấy thông tin chat, người nhận (receiver), và tin nhắn cuối cùng
        const [rows] = await db.execute(`
            SELECT 
                c.id AS chatId,
                c.updatedAt,
                u2.id AS receiverId,
                u2.username AS receiverName,
                u2.imgUrl AS receiverImg,
                m.content AS lastMessage,
                m.sender_id AS lastMessageSenderId
            FROM user_chats uc1
            JOIN chats c ON uc1.chat_id = c.id
            -- Tìm người dùng còn lại trong chat
            JOIN user_chats uc2 ON uc2.chat_id = c.id AND uc2.user_id != uc1.user_id
            -- Lấy thông tin của người dùng còn lại (người nhận)
            JOIN users u2 ON uc2.user_id = u2.id
            -- Lấy nội dung tin nhắn cuối cùng (LEFT JOIN để bao gồm cả chat mới chưa có tin nhắn)
            LEFT JOIN messages m ON uc1.last_message_id = m.id
            WHERE uc1.user_id = ?
            ORDER BY c.updatedAt DESC
        `, [userId]);

        // rows chứa danh sách chat với đầy đủ thông tin cần thiết
        res.status(200).json(rows);

    } catch (error) {
        console.error("Error fetching chat list:", error);
        res.status(500).json({ message: "Error fetching chat list." });
    }
});


app.get('/api/messages/:chatId', authMiddleware, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.userId; // ID người dùng hiện tại

    try {
        // 1. Kiểm tra quyền truy cập: Đảm bảo người dùng thuộc về chat này
        const [accessCheck] = await db.execute(
            'SELECT user_id FROM user_chats WHERE chat_id = ? AND user_id = ?',
            [chatId, userId]
        );

        if (accessCheck.length === 0) {
            return res.status(403).json({ message: 'Access denied to this chat.' });
        }

        // 2. Lấy danh sách tin nhắn
        const [messages] = await db.execute(
            'SELECT id, sender_id, content, createdAt FROM messages WHERE chat_id = ? ORDER BY createdAt ASC',
            [chatId]
        );

        res.status(200).json(messages);

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Error fetching messages." });
    }
});

const server = http.createServer(app); // <-- Tạo HTTP server từ Express app
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Thay bằng domain Frontend của bạn (thường là 5173 hoặc 3000)
        methods: ["GET", "POST"],
    },
});

let userSocketMap = {}; // Lưu trữ: { userId: socketId }

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Khi người dùng gửi ID của họ (sau khi đăng nhập)
    socket.on('register', (userId) => {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
        // Xóa user khỏi map khi họ ngắt kết nối
        for (const userId in userSocketMap) {
            if (userSocketMap[userId] === socket.id) {
                delete userSocketMap[userId];
                console.log(`User ${userId} disconnected.`);
                break;
            }
        }
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

// API Chặn Người dùng
app.post('/api/users/block', authMiddleware, async (req, res) => {
    const { blockedId } = req.body;
    const blockerId = req.userId; // Người thực hiện hành động chặn

    if (!blockedId || blockedId === blockerId) {
        return res.status(400).json({ message: 'Invalid or missing user ID to block.' });
    }

    try {
        // 1. Kiểm tra xem người dùng đã bị chặn chưa
        const [existingBlock] = await db.execute(
            'SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
            [blockerId, blockedId]
        );

        if (existingBlock.length > 0) {
            return res.status(200).json({ message: 'User is already blocked.' });
        }

        // 2. Thêm quan hệ chặn vào bảng 'blocks'
        await db.execute(
            'INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)',
            [blockerId, blockedId]
        );

        // 3. (TÙY CHỌN): Có thể xóa luôn chat hiện tại giữa 2 người nếu tồn tại
        // Tuy nhiên, việc xóa chat là quyết định thiết kế. Thường thì chỉ ngăn tin nhắn mới.

        return res.status(201).json({ message: 'User blocked successfully.' });

    } catch (error) {
        console.error("Error blocking user:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// API Bỏ Chặn Người dùng
app.post('/api/users/unblock', authMiddleware, async (req, res) => {
    const { unblockedId } = req.body;
    const blockerId = req.userId; // Người thực hiện hành động bỏ chặn

    if (!unblockedId) {
        return res.status(400).json({ message: 'Missing user ID to unblock.' });
    }

    try {
        // Xóa quan hệ chặn khỏi bảng 'blocks'
        const [result] = await db.execute(
            'DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
            [blockerId, unblockedId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Block relationship not found.' });
        }

        return res.status(200).json({ message: 'User unblocked successfully.' });

    } catch (error) {
        console.error("Error unblocking user:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

server.listen(PORT, () => { // <-- Sửa
    console.log(`Server is running on port ${PORT}`);
});

