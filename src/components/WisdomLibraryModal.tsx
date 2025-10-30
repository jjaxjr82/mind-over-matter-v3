import { useState, useMemo } from 'react';
import { X, Plus, Trash2, ChevronRight, Search, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WisdomEntry {
  id: string;
  name: string;
  description: string;
  tag: string;
  is_active: boolean;
}

interface WisdomLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: WisdomEntry[];
  onToggle: (id: string) => void;
  onAdd: (name: string, description: string, tag: string) => void;
  onDelete: (id: string) => void;
}

const WisdomLibraryModal = ({ isOpen, onClose, entries, onToggle, onAdd, onDelete }: WisdomLibraryModalProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTag, setNewTag] = useState('');

  const { toast } = useToast();

  // Filter and group entries
  const filteredAndGroupedEntries = useMemo(() => {
    let filtered = entries;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.tag?.toLowerCase().includes(query)
      );
    }

    if (showActiveOnly) {
      filtered = filtered.filter(e => e.is_active);
    }

    const grouped: Record<string, WisdomEntry[]> = {};
    filtered.forEach(entry => {
      const tag = entry.tag || 'Uncategorized';
      if (!grouped[tag]) {
        grouped[tag] = [];
      }
      grouped[tag].push(entry);
    });

    return grouped;
  }, [entries, searchQuery, showActiveOnly]);

  if (!isOpen) return null;

  const selectedEntry = entries.find(e => e.id === selectedId);

  const handleAiAnalyze = async () => {
    if (!aiInput.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-wisdom-source', {
        body: { userInput: aiInput }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      setNewName(data.name);
      setNewDescription(data.description);
      setNewTag(data.tag);
      setAiInput('');
      
      toast({
        title: "AI Analysis Complete",
        description: "Review and adjust the details below."
      });
    } catch (error) {
      console.error('Error analyzing source:', error);
      toast({
        title: "Error",
        description: "Failed to analyze source. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAdd = () => {
    if (!newName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a source name.",
        variant: "destructive"
      });
      return;
    }
    onAdd(newName.trim(), newDescription.trim(), newTag.trim());
    setNewName('');
    setNewDescription('');
    setNewTag('');
    setAiInput('');
    setShowAddForm(false);
    toast({
      title: "Source Added",
      description: `${newName} has been added to your library.`
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-card border-8 border-border w-full max-w-5xl h-[85vh] grid grid-rows-[auto_1fr]">
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b-4 border-border">
          <h2 className="text-xl font-black text-foreground uppercase tracking-wider">
            Wisdom Sources ({entries.length})
          </h2>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => {
                setShowAddForm(true);
                setSelectedId(null);
              }}
              size="sm"
              className="border-4 border-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
            <button onClick={onClose} className="p-2 border-4 border-foreground hover:bg-muted">
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </header>

        {/* Main Content - CSS Grid Layout */}
        <div className="grid grid-cols-[280px_1fr] min-h-0">
          {/* Left Panel - Source List */}
          <div className="border-r-4 border-border grid grid-rows-[auto_1fr] min-h-0">
            {/* Search & Filter Controls */}
            <div className="p-2 border-b-2 border-border bg-secondary/50 space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">Show Active Only</span>
                <Checkbox
                  checked={showActiveOnly}
                  onCheckedChange={(checked) => setShowActiveOnly(checked as boolean)}
                />
              </div>
            </div>

            {/* Source List - Native Scrolling */}
            <div className="overflow-y-auto">
              {entries.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No sources yet
                </div>
              ) : Object.keys(filteredAndGroupedEntries).length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No sources match your filters
                </div>
              ) : (
                <div>
                  {Object.entries(filteredAndGroupedEntries).sort(([a], [b]) => {
                    if (a === 'Uncategorized') return 1;
                    if (b === 'Uncategorized') return -1;
                    return a.localeCompare(b);
                  }).map(([tag, tagEntries]) => (
                    <div key={tag}>
                      <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-2 py-1 border-b-2 border-border">
                        <span className="text-xs font-black text-foreground uppercase tracking-wider">
                          {tag} ({tagEntries.length})
                        </span>
                      </div>
                      {tagEntries.map((entry) => (
                        <div
                          key={entry.id}
                          onClick={() => setSelectedId(entry.id)}
                          className={`w-full flex items-center gap-2 p-2 border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer ${
                            selectedId === entry.id ? 'bg-secondary' : ''
                          }`}
                        >
                          <Checkbox
                            checked={entry.is_active}
                            onCheckedChange={() => onToggle(entry.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{entry.name}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Content Area */}
          <div className="min-h-0 overflow-y-auto">
            {showAddForm ? (
              <div className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <Button
                    onClick={() => setShowAddForm(false)}
                    variant="ghost"
                    size="sm"
                    className="border-2 border-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <h3 className="text-lg font-black text-foreground uppercase">Add New Source</h3>
                </div>

                <div className="space-y-6 max-w-2xl">
                  {/* AI Quick Add */}
                  <div className="p-4 border-4 border-primary bg-primary/5">
                    <label className="block text-sm font-black text-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Quick Add
                    </label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="text"
                        placeholder="Type anything... e.g., Barack Obama, Meditations, Stoicism"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiAnalyze()}
                        disabled={isAnalyzing}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleAiAnalyze} 
                        disabled={!aiInput.trim() || isAnalyzing}
                        size="lg"
                      >
                        {isAnalyzing ? (
                          <span className="animate-spin">⚡</span>
                        ) : (
                          <Sparkles className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      AI will auto-fill the details below
                    </p>
                  </div>

                  {/* AI Results - Only show if AI has populated fields */}
                  {(newName || newDescription || newTag) && (
                    <div className="space-y-4">
                      <div className="text-xs font-black text-primary uppercase tracking-wider mb-4">
                        Review AI Results
                      </div>
                      <div>
                        <label className="block text-xs font-black text-foreground mb-2 uppercase tracking-wider">
                          Source Name *
                        </label>
                        <Input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-foreground mb-2 uppercase tracking-wider">
                          Description
                        </label>
                        <Textarea
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-foreground mb-2 uppercase tracking-wider">
                          Category
                        </label>
                        <Input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button onClick={() => {
                          setShowAddForm(false);
                          setNewName('');
                          setNewDescription('');
                          setNewTag('');
                          setAiInput('');
                        }} variant="outline" className="flex-1">
                          Cancel
                        </Button>
                        <Button onClick={handleAdd} disabled={!newName.trim()} className="flex-1">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Source
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedEntry ? (
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-muted-foreground uppercase mb-2 block">Name</label>
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-wider">{selectedEntry.name}</h3>
                  </div>
                  {selectedEntry.description && (
                    <div>
                      <label className="text-xs font-black text-muted-foreground uppercase mb-2 block">Description</label>
                      <p className="text-sm text-foreground leading-relaxed">{selectedEntry.description}</p>
                    </div>
                  )}
                  {selectedEntry.tag && (
                    <div>
                      <label className="text-xs font-black text-muted-foreground uppercase mb-2 block">Category</label>
                      <div>
                        <span className="inline-block px-4 py-2 text-sm font-black bg-primary text-background uppercase tracking-wider">
                          {selectedEntry.tag}
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-black text-muted-foreground uppercase mb-2 block">Status</label>
                    <p className="text-sm text-foreground">
                      {selectedEntry.is_active ? '✓ Active' : '○ Inactive'}
                    </p>
                  </div>
                  <div className="pt-4 border-t-2 border-border">
                    <Button 
                      onClick={() => onDelete(selectedEntry.id)} 
                      variant="destructive"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Source
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-6">
                <div className="text-muted-foreground">
                  <p className="text-lg font-bold mb-2">No source selected</p>
                  <p className="text-sm">Select a source from the list to view details</p>
                  <p className="text-sm">or click "Add Source" to add a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WisdomLibraryModal;
