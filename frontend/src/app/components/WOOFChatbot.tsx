import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface Message {
  id: string;
  text: string;
  sender: "user" | "woof";
  timestamp: Date;
}

export function WOOFChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm WOOF, your Autonomous Revenue Intelligence assistant. How can I help you today?",
      sender: "woof",
      timestamp: new Date(),
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const quickPrompts = [
    "Explain today's forecast",
    "Why was this bundle suggested?",
    "What's our quietest hour this week?",
  ];

  // Listen for open chatbot event
  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true);
    };
    
    window.addEventListener("openWoofChatbot", handleOpenChatbot);
    
    return () => {
      window.removeEventListener("openWoofChatbot", handleOpenChatbot);
    };
  }, []);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsThinking(true);

    // Simulate WOOF response
    setTimeout(() => {
      const woofMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Based on your query about "${text}", I've analyzed the current data. Your cafe sector is performing 12% above forecast today, primarily driven by strong afternoon sales. I recommend maintaining current inventory levels and consider extending happy hour to 4-6 PM to capitalize on this momentum.`,
        sender: "woof",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, woofMessage]);
      setIsThinking(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-xl hover:shadow-2xl transition-all z-50 flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #F53799 0%, #3AE4FA 100%)",
          }}
        >
          <MessageCircle className="w-8 h-8 text-white" strokeWidth={2} />
        </button>
      )}

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed right-6 bottom-6 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header with Gradient */}
          <div
            className="p-5 flex items-center justify-between"
            style={{
              background: "linear-gradient(135deg, #F53799 0%, #3AE4FA 100%)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#F53799]" strokeWidth={2} />
              </div>
              <div className="text-white">
                <div className="text-base font-bold">Ask WOOF</div>
                <div className="text-xs opacity-90">AI Revenue Assistant</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-[#F53799] to-[#D42A7D] text-white"
                      : "bg-white text-[#223047] shadow-sm"
                  }`}
                  style={{ lineHeight: "1.6" }}
                >
                  <div className="text-sm">{msg.text}</div>
                </div>
              </div>
            ))}
            
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#F53799] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-[#F53799] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-[#F53799] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-3 bg-white border-t border-gray-200">
            <div className="flex flex-col gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-[#223047] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage(message);
                  }
                }}
                placeholder="Ask WOOF anything..."
                className="flex-1 border-gray-300 focus-visible:ring-[#F53799]"
              />
              <Button
                onClick={() => handleSendMessage(message)}
                className="bg-gradient-to-r from-[#F53799] to-[#3AE4FA] hover:opacity-90 rounded-full"
                size="icon"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
