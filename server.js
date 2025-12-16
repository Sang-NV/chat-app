// server.js (API Server) - Root level Node.js server
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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use(cors());
app.use(bodyParser.json());

// JWT secret (use env var in production)
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
// server.js (Thêm API sau khi đã định nghĩa authMiddleware)

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

// server.js (Thêm vào sau authMiddleware)
// server.js (Thêm vào sau authMiddleware)

// API 4: Tạo chat mới
app.post('/api/chats', authMiddleware, async (req, res) => {
    const { receiverId } = req.body;
    const senderId = req.userId; // ID người gửi lấy từ Token

    if (!receiverId) {
        return res.status(400).json({ message: 'Receiver ID is required.' });
    }
    
    // Tạm thời kiểm tra người nhận có tồn tại không
    const [receiverCheck] = await db.execute('SELECT id FROM users WHERE id = ?', [receiverId]);
    if (receiverCheck.length === 0) {
         return res.status(404).json({ message: 'Receiver user not found.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // 1. Kiểm tra chat đã tồn tại chưa (Tuyển chọn, có thể bỏ qua để đơn giản)
        // Đây là logic phức tạp hơn, có thể làm sau.

        // 2. Tạo bản ghi Chat mới trong bảng 'chats'
        const [chatResult] = await connection.execute('INSERT INTO chats (createdAt, updatedAt) VALUES (CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
        const chatId = chatResult.insertId; // Lấy ID vừa tạo

        // 3. Tạo bản ghi liên kết cho Người gửi (user_chats)
        await connection.execute(
            'INSERT INTO user_chats (user_id, chat_id, last_message_id) VALUES (?, ?, NULL)',
            [senderId, chatId]
        );

        // 4. Tạo bản ghi liên kết cho Người nhận (user_chats)
        await connection.execute(
            'INSERT INTO user_chats (user_id, chat_id, last_message_id) VALUES (?, ?, NULL)',
            [receiverId, chatId]
        );

        await connection.commit();
        res.status(201).json({ 
            message: "Chat created successfully!", 
            chatId: chatId 
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error creating chat:", error);
        res.status(500).json({ message: "Error creating chat." });
    } finally {
        connection.release();
    }
});
// API Gửi Tin Nhắn
app.post('/api/messages', authMiddleware, async (req, res) => {
    // 1. Nhận dữ liệu
    const { chatId, content } = req.body;
    const senderId = req.userId; // ID người gửi lấy từ JWT (An toàn)

    if (!chatId || !content) {
        return res.status(400).json({ message: 'Chat ID and content are required.' });
    }

    // 2. Bắt đầu Transaction (Quan trọng)
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // A. Ghi Tin Nhắn Mới vào bảng 'messages'
        const [messageResult] = await connection.execute(
            'INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)',
            [chatId, senderId, content]
        );
        const newMessageId = messageResult.insertId;

        // B. Cập nhật bảng 'chats' (Cập nhật thời gian cuối cùng của chat)
        // Điều này giúp sắp xếp danh sách chat theo thời gian tin nhắn cuối cùng.
        await connection.execute(
            'UPDATE chats SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [chatId]
        );

        // C. Cập nhật bảng 'user_chats' (Cập nhật tin nhắn cuối cùng cho cả 2 người)
        // Đây là cách chúng ta biết tin nhắn cuối cùng là gì để hiển thị trong danh sách chat.
        await connection.execute(
            'UPDATE user_chats SET last_message_id = ? WHERE chat_id = ?',
            [newMessageId, chatId]
        );

        // 3. Commit Transaction nếu mọi thứ thành công
        await connection.commit();

        res.status(201).json({ 
            message: "Message sent successfully.", 
            messageId: newMessageId 
        });

    } catch (error) {
        // 4. Rollback nếu có lỗi SQL
        await connection.rollback();
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Error sending message." });
    } finally {
        connection.release();
    }
});

// server.js (Thêm vào sau các API Đăng nhập/Tạo chat)

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


