import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Challenge {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface ChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenges: Challenge[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (name: string, description: string) => void;
}

const ChallengesModal = ({
  isOpen,
  onClose,
  challenges,
  onToggle,
  onDelete,
  onAdd,
}: ChallengesModalProps) => {
  const [newChallengeName, setNewChallengeName] = useState('');
  const [newChallengeDesc, setNewChallengeDesc] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newChallengeName.trim() || !newChallengeDesc.trim()) return;
    onAdd(newChallengeName, newChallengeDesc);
    setNewChallengeName('');
    setNewChallengeDesc('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-card border-8 border-border w-full max-w-4xl h-[85vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b-4 border-border">
          <h2 className="text-xl font-black text-foreground uppercase tracking-wider">Core Challenges ({challenges.length})</h2>
          <button onClick={onClose} className="p-2 border-4 border-foreground hover:bg-muted">
            <X className="h-5 w-5 text-foreground" />
          </button>
        </header>

        {/* Add New Form */}
        <div className="p-4 border-b-4 border-border bg-secondary/30">
          <div className="grid grid-cols-12 gap-2">
            <Input
              type="text"
              placeholder="Challenge name..."
              value={newChallengeName}
              onChange={(e) => setNewChallengeName(e.target.value)}
              className="col-span-3"
            />
            <Input
              type="text"
              placeholder="Description..."
              value={newChallengeDesc}
              onChange={(e) => setNewChallengeDesc(e.target.value)}
              className="col-span-7"
            />
            <Button 
              onClick={handleAdd} 
              disabled={!newChallengeName.trim() || !newChallengeDesc.trim()}
              className="col-span-2"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Table */}
        <ScrollArea className="flex-1">
          {challenges.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground font-bold uppercase text-sm">
              No challenges yet. Add your first challenge above.
            </div>
          ) : (
            <div className="border-b border-border">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 p-2 bg-secondary/50 border-b-2 border-border font-black text-xs uppercase tracking-wider sticky top-0">
                <div className="col-span-1 flex items-center justify-center">Active</div>
                <div className="col-span-3">Name</div>
                <div className="col-span-7">Description</div>
                <div className="col-span-1 flex items-center justify-center">Delete</div>
              </div>
              {/* Table Rows */}
              {challenges.map((challenge) => (
                <div 
                  key={challenge.id} 
                  className="grid grid-cols-12 gap-2 p-2 border-b border-border hover:bg-secondary/30 transition-colors"
                >
                  <div className="col-span-1 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={challenge.is_active}
                      onChange={() => onToggle(challenge.id)}
                      className="h-4 w-4 border-2 border-foreground bg-background text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>
                  <div className="col-span-3 flex items-center">
                    <p className="font-bold text-sm text-foreground break-words">{challenge.name}</p>
                  </div>
                  <div className="col-span-7 flex items-center">
                    <p className="text-sm text-muted-foreground break-words">{challenge.description}</p>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => onDelete(challenge.id)}
                      className="p-1.5 border-2 border-destructive hover:bg-destructive/20 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default ChallengesModal;
