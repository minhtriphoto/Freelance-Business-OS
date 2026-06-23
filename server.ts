import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI API Route
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
         return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }
      
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const { history, message, appContext } = req.body;
      
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: `Bạn là trợ lý AI thông minh cho hệ thống Freelance Business OS (dùng cho các freelancer). 
Đây là dữ liệu ngữ cảnh hiện tại của ứng dụng (dự án, khách hàng, giao dịch):
\`\`\`json
${JSON.stringify(appContext || {})}
\`\`\`
Bạn không được tự ý sửa đổi dữ liệu (chỉ cung cấp hướng dẫn, template tin nhắn, hợp đồng, báo giá, hoặc trả lời câu hỏi phân tích doanh thu).
Khi người dùng hỏi về:
1. "Nhập brief khách hàng và tự đề xuất báo giá." -> Bạn phân tích yêu cầu đó và gợi ý các hạng mục, chi phí, hoặc các gói dịch vụ cơ bản cần thiết (dựa trên ngữ cảnh).
2. "Tạo hợp đồng đơn giản từ thông tin job." -> Đưa ra một biểu mẫu hợp đồng text ngắn ngọn để điền thông tin 2 bên.
3. "Viết tin nhắn gửi báo giá cho khách." -> Trả lời 1 mẫu email/tin nhắn chào giá chuyên nghiệp.
4. "Viết tin nhắn nhắc thanh toán (lịch sự / chuyên nghiệp / cứng rắn)." -> Gợi ý đoạn chat đòi nợ các kiểu khác nhau.
5. "Phân tích job nào lời, job nào lỗ / báo cáo doanh thu." -> Dựa vào dữ liệu ngữ cảnh trên, tính toán doanh thu/chi phí và tóm tắt những dự án lời/lỗ để báo cáo.
6. "Gợi ý dịch vụ nên tăng giá." -> Phân tích các dự án trong hệ thống để xem dịch vụ nào đang bán tốt hoặc tốn nhiều thời gian.
7. "Gợi ý chăm sóc lại khách cũ." -> Xem xét dữ liệu khách hàng cũ để đưa template kịch bản hỏi thăm/ưu đãi dịch vụ.
8. "Danh sách checklist lập hộ kinh doanh." -> Kể ra các thủ tục thuế, giấy tờ, mặt bằng cần chuẩn bị cơ bản.
9. "Cảnh báo dữ liệu thiếu." -> Nhìn vào dữ liệu dự án (vd chưa có hợp đồng, chưa thanh toán) để nhắc nhở người dùng bằng cách liệt kê danh sách dự án cần chú ý.
Giữ thái độ nhiệt tình, lịch sự, chuyên nghiệp. Không dùng markdown quá phức tạp, giữ format rõ ràng dễ đọc.
`,
        },
      });

      // Pass previous history if provided
      if (history && Array.isArray(history)) {
        for (const msg of history) {
            await chat.sendMessage({ message: msg.message });
        }
      }
      
      const response = await chat.sendMessage({ message: message });
      res.json({ text: response.text });
      
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Something went wrong" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:\${PORT}`);
  });
}

startServer();
