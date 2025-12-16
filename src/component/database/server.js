// server.js (API Server) - converted to ESM
import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import db from './db.js'; // Kết nối MySQL (ESM import)
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

// JWT secret (use env var in production)
const JWT_SECRET = (typeof process !== 'undefined' && process.env?.JWT_SECRET) || 'YOUR_SUPER_SECRET_KEY';

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

        // Tương đương với việc tạo document 'userchats' trống trong Firestore
        // (Trong MySQL, bạn có thể tạo một bản ghi cơ bản hoặc bỏ qua nếu logic chat phức tạp hơn)
        // Ví dụ tạo bản ghi userchats:
        // await db.execute('INSERT INTO userchats (user_id, chats_data) VALUES (?, ?)', [newUserId, '[]']);


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

// ... (các API khác như Login, Upload sẽ được thêm vào bên dưới)

import jwt from 'jsonwebtoken';

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Cấu hình lưu trữ cho Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Tệp sẽ được lưu vào thư mục 'uploads'
        cb(null, 'uploads/'); 
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

// ... (Các đoạn code cũ: import, app.use, API Register, API Upload)

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
        // Lưu trữ thông tin cơ bản của người dùng (không bao gồm mật khẩu băm) trong token
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

// ... (app.listen)