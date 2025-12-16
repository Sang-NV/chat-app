import "./login.css";
import { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import upload from "../lib/upload";
import { useChatStore } from "../context/ChatContext";

const Login = () => {
    const [avatar, setAvatar] = useState({
        File: null,
        URL:""
    });

    const [loading,setloading] = useState(false)

    const handleAvatar = (e) => {
        if(e.target.files[0]){
        setAvatar({
            File: e.target.files[0],
            URL: URL.createObjectURL(e.target.files[0])
        });
        }
    };
    
    const {loginSuccess} = useChatStore();

  const handldeRegister = async (e) => {
    e.preventDefault();
    setloading(true);

    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);
    
    if (!username || !email || !password) {
        toast.error("Please enter all details!");
        setloading(false);
        return;
    }

    try {
        let imgUrl = avatar.URL || "./avatar.png";

        // B1: Tải ảnh lên (nếu có tệp)
        if (avatar.File) {
            // Thay thế Firebase Storage upload bằng API upload mới
            imgUrl = await upload(avatar.File); 
        }

        // B2: Gọi API đăng ký (Thay thế Firebase Auth và Firestore)
        const res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, imgUrl }),
        });

        const data = await res.json();

        if (res.ok) {
            toast.success(data.message); // Hiển thị "Account created successfully!"
        } else {
            // Xử lý lỗi từ server (ví dụ: email đã tồn tại)
            toast.error(data.message || "Registration failed.");
        }
            
    } catch (err) {
        console.log(err);
        toast.error(err.message);
    } finally {
        setloading(false);
    }
};

   const handleLogin = async (e) => {
        e.preventDefault();
        setloading(true);
        
        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData);
        
        if (!email || !password) {
            toast.error("Please enter email and password!");
            setloading(false);
            return;
        }

        try {
            // Gọi API đăng nhập backend
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                
                // LƯU Ý QUAN TRỌNG: Lưu token vào Local Storage hoặc Redux/Context
                // để sử dụng cho các yêu cầu API sau này (ví dụ: gửi tin nhắn, lấy danh sách chat).
                localStorage.setItem("userToken", data.token);
                 // Lưu thông tin người dùng để dùng cho trạng thái (state)
                localStorage.setItem("userData", JSON.stringify(data.user)); 

                   // TODO: Cập nhật UserContext hoặc chuyển hướng
                // Chuyển hướng người dùng sang trang chính (ví dụ: '/')
                // window.location.href = "/";
                // ===================================================
            loginSuccess(data.user); // Cập nhật trạng thái đăng nhập trong Context

            } else {
                // Hiển thị lỗi từ server
                toast.error(data.message || "Login failed.");
            }

        } catch (err) {
            console.error(err);
            toast.error("An unexpected error occurred during login.");
        } finally {
            setloading(false);
        }
        
    }
        
  return (
    <div className="login">
        <div className="item">
            <h2>Wellcome back</h2>
            <form onSubmit={handleLogin}>
                <input type="text" placeholder="Email" name="email" />
                <input type="password" placeholder="Password" name="password" />
                <button>Sign In</button>
            </form>
        </div>
        <div className="separator"></div>
        <div className="item">
            <h2>Create an Account</h2>
            <form onSubmit={handldeRegister}>
                <label htmlFor="file">
                    <img src={avatar.URL || "./avatar.png"} alt="" />
                    Upload an image</label>
                <input type="file" id="file" style={{display:"none"}} onChange={handleAvatar}/>
                <input type="text" placeholder="Username" name="username" />
                <input type="text" placeholder="Email" name="email" />
                <input type="password" placeholder="Password" name="password" />
                <button>Sign Up</button>
            </form>
        </div>
    </div>
  );

}
export default Login;