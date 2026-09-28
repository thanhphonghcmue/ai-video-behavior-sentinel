# AI Video Behavior Sentinel (SENTINEL AI)

> **Hệ Thống Web Giám Sát Phân Tích Hành Vi Nhân Vật & Đánh Giá Nguy Cơ Thời Gian Thực**  
> Tích hợp trực tiếp Google AI Studio **Gemini 2.5 Flash** (File API) + OpenCV + Next.js (App Router, TypeScript).

---

## 🌟 Điểm Nổi Bật Cốt Lõi

1. **Module 1: Video Behavior Timeline & Interactive Target Jump (Split-Screen 2 Cột)**
   - **Tải lên video thực tế (MP4/WebM):** Tự động gửi video lên Google AI Studio File API (`client.files.upload`).
   - **Cắt lát hành vi tự nhiên (Dynamic Slicing):** Gemini 2.5 Flash tự động phát hiện ranh giới hành vi chính xác theo từng mốc giây (start_time đến end_time), không bị giới hạn trong các khoảng cố định 5s hay 10s.
   - **Đồng bộ 2 chiều (Two-Way Interactive Sync):**
     - **Seek on Click:** Nhấp vào bất kỳ thẻ sự kiện nào, video lập tức nhảy tới đúng mốc giây đó và tự động phát.
     - **Playhead Sync:** Khi phát video, thẻ tương ứng mốc thời gian hiện tại sẽ sáng viền đỏ rực rỡ và tự động cuộn vào tầm mắt.
   - **Bộ lọc nhân vật:** Lọc theo từng nhân vật (`Target #1`, `Target #2`...) và lọc sự cố nguy hiểm (`Chỉ Nguy Hiểm`).

2. **Module 2: Webcam Trực Tiếp & Trợ Lý Ứng Phó Khẩn Cấp (AI Copilot)**
   - **Giám sát trực tiếp:** Phân tích ảnh chụp webcam định kỳ mỗi 3.5s và cập nhật dòng thời gian tức thì mà không cần tải lại trang.
   - **Quy trình SOP 1 chạm:** Khi phát hiện hành vi có nguy cơ cao (>70%), hệ thống hiển thị cảnh báo cùng nút kích hoạt quy trình phản ứng khẩn cấp tức thì.
   - **AI Copilot Chat:** Hỏi đáp trực tiếp với Gemini 2.5 Flash về ngữ cảnh an ninh trong video.

3. **Giao Diện Tối Giản Hiện Đại (Minimalist 2-Column Split Layout)**
   - Nền trắng thanh lịch, điểm nhấn màu đỏ cảnh báo (`#D70018`), khoảng trống thoáng đãng (High Whitespace).
   - Loại bỏ hoàn toàn sidebar cồng kềnh và các widget rác gây phân tán sự chú ý.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend:** Python 3.10, FastAPI, OpenCV, Uvicorn, Google GenAI SDK (`google-genai`).
- **AI Multimodal Model:** Google Gemini 2.5 Flash (Google AI Studio).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Nhanh

### 1. Khởi động Backend (FastAPI - Port 8000)
```bash
cd backend
pip install -r requirements.txt
python server.py
# Hoặc trên Windows: py -3.10 server.py
```
> Backend sẽ chạy tại: `http://localhost:8000`

### 2. Khởi động Frontend (Next.js - Port 3000)
```bash
cd ai-threat-monitoring
npm install
npm run dev
```
> Truy cập Dashboard tại: `http://localhost:3000/dashboard`

### 3. Cấu hình Gemini API Key
- Lấy khóa API miễn phí tại: [Google AI Studio](https://aistudio.google.com/app/apikey)
- Nhấn nút **[Cài Gemini API Key]** ở góc trên thanh Header của giao diện web để dán key và kích hoạt ngay lập tức!
