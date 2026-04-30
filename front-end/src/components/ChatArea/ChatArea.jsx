import { Send, Plus, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import "./ChatArea.css";


const ChatArea = ({ 
  messages, 
  inputValue, 
  onInputChange, 
  onSendMessage, 
  onKeyPress, 
  userProfile,
  isLoading = false  
}) => {
  return (
    <div className="chat-area">
      <ScrollArea className="chat-area-scroll">
        {messages.length === 0 ? (
          <div className="chat-area-empty">
            <div className="chat-area-empty-content">
              <h2 className="chat-area-empty-title">
                Where should we begin?
              </h2>
            </div>
          </div>
        ) : (
          <div className="chat-area-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "chat-message",
                  message.sender === "user" ? "chat-message-user" : "chat-message-bot",
                  message.isError && "chat-message-error"
                )}
              >
                {message.sender === "bot" && (
                  <Avatar className="chat-message-avatar">
                    <AvatarFallback className="chat-message-avatar-bot">AI</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "chat-message-bubble",
                    message.sender === "user"
                      ? "chat-message-bubble-user"
                      : "chat-message-bubble-bot",
                    message.isError && "bg-red-100 border-red-300"
                  )}
                >
                  <p className="chat-message-text">{message.text}</p>
                  
                  {/* Show metadata for bot responses */}
                  {message.sender === "bot" && !message.isError && (
                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-3">
                      {message.contextUsed !== undefined && (
                        <span>📚 {message.contextUsed} worklogs used</span>
                      )}
                      {message.processingTime && (
                        <span>⚡ {message.processingTime}</span>
                      )}
                    </div>
                  )}
                </div>
                {message.sender === "user" && (
                  <Avatar className="chat-message-avatar">
                    <AvatarImage src={userProfile?.profilePicture || "/placeholder.jpeg"} />
                    <AvatarFallback>{userProfile?.name?.substring(0, 2).toUpperCase() || "GA"}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {/* Loading Indicator - AI is thinking */}
            {isLoading && (
              <div className="chat-message chat-message-bot">
                <Avatar className="chat-message-avatar">
                  <AvatarFallback className="chat-message-avatar-bot">AI</AvatarFallback>
                </Avatar>
                <div className="chat-message-bubble chat-message-bubble-bot">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing worklogs and generating response...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="chat-area-input-wrapper">
        <div className="chat-area-input-container">
          <div className="chat-area-input">
            
            <Input
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="Ask Anything"
              className="chat-area-input-field"
            />
            <Button
              size="icon"
              className="chat-area-send-button"
              onClick={onSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="chat-area-send-icon" />
              )}
            </Button>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;

