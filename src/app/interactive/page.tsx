'use client';

import React, { useState } from 'react';
import { 
  GitBranch, 
  Plus, 
  Trash2, 
  Play, 
  Save, 
  Clock,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Choice {
  id: string;
  label: string;
  next_video_url: string;
}

interface Node {
  id: string;
  timestamp: string;
  choices: Choice[];
}

export default function InteractiveEditorPage() {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: '1',
      timestamp: '02:10',
      choices: [
        { id: 'c1', label: 'Go to the Forest', next_video_url: 'forest_clip.mp4' },
        { id: 'c2', label: 'Stay at the Bridge', next_video_url: 'bridge_clip.mp4' }
      ]
    }
  ]);

  const addNode = () => {
    setNodes([...nodes, { 
      id: Date.now().toString(), 
      timestamp: '00:00', 
      choices: [{ id: Date.now().toString() + 'c', label: '', next_video_url: '' }] 
    }]);
  };

  const removeNode = (id: string) => setNodes(nodes.filter(n => n.id !== id));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <GitBranch className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interactive Editor</h1>
            <p className="text-muted-foreground mt-1">Configure branching paths and decision timelines.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 bg-muted rounded-xl font-semibold border border-border flex items-center gap-2">
            <Play className="w-4 h-4" />
            Preview
          </button>
          <button className="px-5 py-2.5 bg-brand-gradient text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20">
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {nodes.map((node, index) => (
          <div key={node.id} className="relative group">
            {index !== nodes.length - 1 && (
              <div className="absolute left-10 top-full h-6 w-0.5 bg-border -z-10" />
            )}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:border-primary/50 transition-colors">
              <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg">
                    SPLIT {index + 1}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    At timestamp: 
                    <input 
                      type="text" 
                      value={node.timestamp} 
                      className="bg-muted border border-border rounded px-2 py-0.5 text-foreground w-16 outline-none focus:ring-1 ring-primary"
                    />
                  </div>
                </div>
                <button onClick={() => removeNode(node.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {node.choices.map((choice, i) => (
                    <div key={choice.id} className="p-4 bg-muted/50 rounded-xl border border-border space-y-3 relative group/choice">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Choice {i + 1}</div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Text Label</label>
                        <input 
                          placeholder="e.g. Enter the Cave"
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-primary"
                          value={choice.label}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Next Video Clip</label>
                        <div className="flex items-center gap-2">
                          <input 
                            placeholder="Select clip..."
                            className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none"
                            value={choice.next_video_url}
                          />
                          <button className="p-2 border border-border rounded-lg hover:bg-card">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all p-6">
                    <Plus className="w-5 h-5" />
                    Add Path
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={addNode}
          className="w-full py-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
        >
          <Plus className="w-6 h-6" />
          Add Decision Node
        </button>
      </div>
    </div>
  );
}
