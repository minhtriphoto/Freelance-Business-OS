import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Chào bạn! Tôi là Freelance OS Assistant. Tôi có thể giúp gì cho bạn?\n\nBạn có thể thử hỏi tôi:\n- "Tạo báo giá từ brief..."\n- "Mẫu hợp đồng dịch vụ Media"\n- "Viết email nhắc thanh toán lịch sự"\n- "Các bước khai báo thuế hộ kinh doanh cá thể"'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Build history for the API - convert previous messages to expected structure
      const history = messages
        .filter(m => m.role === 'user') // Currently simple approach, just pass all user messages as history if needed. Actually the api in server.ts expects [{message: ""}, ...] which is sequentially user inputs. Wait, the server.ts expects simply an array of past messages to send before current.
        // Let's modify the server to just keep state if we want, or pass role/content pair. 
        // In my current server.ts, it loops through history and calls `chat.sendMessage({ message: msg.message })` which implies they are all just user messages in sequence. To do it correctly, I should adjust server.ts to accept role+parts or just not use history for now, or just pass user messages. 
        // For simplicity, let's just pass the last few interactions as a single prompt context, or leave history empty in this basic version and rely on the model's single-turn memory, or update server.ts.
        .map(m => ({ message: m.content })); // This is a bit hacky for a chat history

      // A better way is to send the entire context and history to the API.

      const appStateContext = {
        projects: JSON.parse(localStorage.getItem('freelance_os_projects') || '[]'),
        clients: JSON.parse(localStorage.getItem('freelance_os_clients') || '[]'),
        transactions: JSON.parse(localStorage.getItem('freelance_os_transactions') || '[]')
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: userMessage,
          appContext: appStateContext 
        })
      });

      if (!res.ok) {
        throw new Error('Sự cố kết nối với AI');
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', content: data.text }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', content: `Lỗi: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-green-mid hover:bg-brand-green-light text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-40 active:scale-95"
      >
        <MessageSquare size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 md:w-96 bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex flex-col z-50 overflow-hidden"
            style={{ height: '500px', maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Header */}
            <div className="bg-brand-green-mid px-5 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">Freelance Assistant</h3>
                  <p className="text-3xs text-brand-green-mid-dark/60 font-medium">Sẵn sàng hỗ trợ bạn</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-brand-green-mid/10 text-brand-green-mid'}`}>
                      {msg.role === 'user' ? <UserIcon size={12} className="text-slate-500" /> : <Bot size={12} />}
                    </div>
                    <div 
                      className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap shadow-3xs ${
                        msg.role === 'user' 
                          ? 'bg-slate-800 text-white rounded-tr-sm' 
                          : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%] flex-row">
                    <div className="w-6 h-6 rounded-full bg-brand-green-mid/10 text-brand-green-mid flex items-center justify-center shrink-0 mt-1">
                      <Bot size={12} />
                    </div>
                    <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-3xs">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
              <form 
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:border-brand-green-mid/50 focus-within:bg-white transition-all shadow-inner-sm"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Hỏi AI..."
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs focus:outline-hidden text-slate-800"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
