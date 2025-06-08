
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, ExternalLink, MessageSquare, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskNote {
  id: string;
  content: string;
  createdAt: string;
}

interface TaskLink {
  id: string;
  url: string;
  title: string;
  createdAt: string;
}

interface TaskNotesAndLinksProps {
  notes: TaskNote[];
  links: TaskLink[];
  onAddNote: (content: string) => void;
  onRemoveNote: (noteId: string) => void;
  onAddLink: (url: string, title: string) => void;
  onRemoveLink: (linkId: string) => void;
  onOpenLink: (url: string) => void;
}

const TaskNotesAndLinks: React.FC<TaskNotesAndLinksProps> = ({
  notes,
  links,
  onAddNote,
  onRemoveNote,
  onAddLink,
  onRemoveLink,
  onOpenLink
}) => {
  const [newNote, setNewNote] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
      setShowNoteForm(false);
    }
  };

  const handleAddLink = () => {
    if (newLinkUrl.trim()) {
      const title = newLinkTitle.trim() || new URL(newLinkUrl).hostname;
      onAddLink(newLinkUrl.trim(), title);
      setNewLinkUrl('');
      setNewLinkTitle('');
      setShowLinkForm(false);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Notes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare size={20} />
              Notes
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNoteForm(!showNoteForm)}
            >
              <Plus size={16} />
              Add Note
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence>
            {showNoteForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                    Add Note
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNoteForm(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <AnimatePresence>
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-muted rounded-lg relative group"
                >
                  <p className="text-sm text-foreground pr-8">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={() => onRemoveNote(note.id)}
                  >
                    <X size={12} />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {notes.length === 0 && !showNoteForm && (
              <p className="text-center text-muted-foreground text-sm py-4">
                No notes yet. Click "Add Note" to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Links Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LinkIcon size={20} />
              Links
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLinkForm(!showLinkForm)}
            >
              <Plus size={16} />
              Add Link
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence>
            {showLinkForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <Input
                  placeholder="Enter URL (https://...)"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                />
                <Input
                  placeholder="Link title (optional)"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleAddLink} 
                    disabled={!newLinkUrl.trim() || !isValidUrl(newLinkUrl)}
                  >
                    Add Link
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowLinkForm(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <AnimatePresence>
              {links.map((link) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-muted rounded-lg relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <button
                        onClick={() => onOpenLink(link.url)}
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-2"
                      >
                        {link.title}
                        <ExternalLink size={12} />
                      </button>
                      <p className="text-xs text-muted-foreground mt-1 break-all">
                        {link.url}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ml-2"
                      onClick={() => onRemoveLink(link.id)}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {links.length === 0 && !showLinkForm && (
              <p className="text-center text-muted-foreground text-sm py-4">
                No links yet. Click "Add Link" to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskNotesAndLinks;
