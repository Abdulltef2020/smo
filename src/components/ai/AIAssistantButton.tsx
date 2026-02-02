import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { AIAssistantDialog } from './AIAssistantDialog';

interface AIAssistantButtonProps {
  context?: Record<string, unknown>;
}

export function AIAssistantButton({ context }: AIAssistantButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-primary to-primary/80"
        size="icon"
      >
        <Bot className="w-6 h-6" />
      </Button>
      
      <AIAssistantDialog 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        context={context}
      />
    </>
  );
}
