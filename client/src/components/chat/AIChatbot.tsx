import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { usePlan } from "@/hooks/usePlan";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Brain, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hi! I'm your AI Money Coach. I can help you analyze your spending, plan budgets, and answer financial questions. What would you like to know?",
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  
  const { toast } = useToast();
  const { requiresPlan } = usePlan();
  
  const canUseAI = requiresPlan('pro');

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", { 
        message,
        contextFlags: { page: window.location.pathname }
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        content: data.response,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    if (!canUseAI) {
      toast({
        title: "Upgrade Required",
        description: "AI Money Coach is available with Pro and Premium plans",
        variant: "destructive",
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          data-testid="button-open-chat"
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-full w-14 h-14 shadow-lg shadow-emerald-500/25"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 bg-slate-800/95 backdrop-blur-sm border-slate-700/50 shadow-2xl">
        {/* Chat Header */}
        <CardHeader className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Gary</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-xs text-emerald-400">Online</span>
                  {!canUseAI && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                      Pro
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              data-testid="button-close-chat"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Chat Messages */}
        <CardContent className="p-0">
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {!canUseAI && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-sm font-medium">Upgrade Required</span>
                </div>
                <p className="text-amber-400/80 text-xs">
                  AI Money Coach is available with Pro and Premium plans
                </p>
                <Button 
                  data-testid="button-upgrade-chat"
                  size="sm" 
                  className="mt-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => window.location.href = '/subscribe'}
                >
                  Upgrade Now
                </Button>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} data-testid={`message-${message.id}`}>
                {message.isBot ? (
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Brain className="w-3 h-3 text-white" />
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 max-w-xs">
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2 justify-end">
                    <div className="bg-emerald-600 rounded-lg p-3 max-w-xs">
                      <p className="text-sm text-white leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-3 h-3 text-white" />
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex space-x-2">
              <Input
                data-testid="input-chat-message"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={canUseAI ? "Ask me anything about your finances..." : "Upgrade to chat with AI..."}
                disabled={!canUseAI || chatMutation.isPending}
                className="flex-1 bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:ring-emerald-500"
              />
              <Button
                data-testid="button-send-message"
                onClick={handleSendMessage}
                disabled={!canUseAI || !inputMessage.trim() || chatMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
