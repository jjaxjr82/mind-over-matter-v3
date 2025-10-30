import { useState, useEffect, useRef } from 'react';
import { Send, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface FollowUpChatProps {
  conversation: Message[];
  onFollowUp: (question: string) => void;
  isLoading: boolean;
}

const FollowUpChat = ({ conversation, onFollowUp, isLoading }: FollowUpChatProps) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onFollowUp(input);
      setInput('');
    }
  };

  return (
    <div className="mt-6 p-4 bg-secondary border border-border rounded-lg space-y-4">
      <h3 className="font-semibold text-lg text-foreground">Discuss this Insight</h3>
      <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
        {conversation.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-card text-foreground'
                : 'bg-primary/20 text-foreground'
            }`}
          >
            <p className="text-sm">{msg.text}</p>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
          placeholder="Ask a follow-up question..."
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
};

export default FollowUpChat;
