import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost', // Thay bằng host MySQL của bạn (ví dụ: 'localhost')
  port: 3306, // Cổng MySQL
  user: 'root',      // Thay bằng user của bạn
  password: 'S@n9n9uyen', // Thay bằng mật khẩu
  database: 'chatapp_db', // Tên cơ sở dữ liệu
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;