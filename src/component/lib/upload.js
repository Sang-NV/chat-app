// lib/upload.js (CẬP NHẬT)
const upload = async (file) => {
    const formData = new FormData();
    formData.append("file", file); // Tên 'file' phải khớp với Multer (uploadMiddleware.single('file'))

    try {
        const res = await fetch("http://localhost:5000/api/upload", {
            method: "POST",
            body: formData,
            // Không cần Content-Type: multipart/form-data, trình duyệt sẽ tự đặt
        });

        const data = await res.json();

        if (res.ok) {
            // Backend trả về imgUrl
            return data.imgUrl; 
        } else {
            throw new Error(data.message || "Upload failed");
        }
    } catch (err) {
        console.error(err);
        throw new Error("Upload failed due to network or server error.");
    }
};

export default upload;