import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface ChordSheetEditorProps {
  sheetId?: Id<"chordSheets">;
  onSave: () => void;
  onCancel: () => void;
}

export function ChordSheetEditor({ sheetId, onSave, onCancel }: ChordSheetEditorProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isPreview, setIsPreview] = useState(false);

  const existingSheet = useQuery(
    api.chordSheets.getById,
    sheetId ? { id: sheetId } : "skip"
  );

  const createSheet = useMutation(api.chordSheets.create);
  const updateSheet = useMutation(api.chordSheets.update);

  useEffect(() => {
    if (existingSheet) {
      setTitle(existingSheet.title);
      setArtist(existingSheet.artist);
      setContent(existingSheet.content);
      setTags(existingSheet.tags?.join(", ") || "");
      setIsPublic(existingSheet.isPublic);
    }
  }, [existingSheet]);

  const handleSave = async () => {
    if (!title.trim() || !artist.trim()) {
      toast.error("Please fill in title and artist");
      return;
    }

    try {
      const tagArray = tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      if (sheetId) {
        await updateSheet({
          id: sheetId,
          title: title.trim(),
          artist: artist.trim(),
          content,
          tags: tagArray.length > 0 ? tagArray : undefined,
          isPublic,
        });
        toast.success("Chord sheet updated!");
      } else {
        await createSheet({
          title: title.trim(),
          artist: artist.trim(),
          content,
          tags: tagArray.length > 0 ? tagArray : undefined,
          isPublic,
        });
        toast.success("Chord sheet created!");
      }
      onSave();
    } catch (error) {
      toast.error("Failed to save chord sheet");
    }
  };

  const insertChord = (chord: string) => {
    const textarea = document.getElementById("content-editor") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + `[${chord}]` + content.substring(end);
      setContent(newContent);
      
      // Set cursor position after the inserted chord
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + chord.length + 2, start + chord.length + 2);
      }, 0);
    }
  };

  const commonChords = ["C", "D", "E", "F", "G", "A", "B", "Am", "Dm", "Em", "Fm", "Gm", "C7", "D7", "G7"];

  const renderPreview = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      if (line.trim() === '') {
        return <div key={lineIndex} className="h-4"></div>;
      }

      // Parse chords and lyrics
      const parts = [];
      let currentIndex = 0;
      const chordRegex = /\[([^\]]+)\]/g;
      let match;

      while ((match = chordRegex.exec(line)) !== null) {
        // Add text before chord
        if (match.index > currentIndex) {
          parts.push({
            type: 'text',
            content: line.substring(currentIndex, match.index)
          });
        }
        
        // Add chord
        parts.push({
          type: 'chord',
          content: match[1]
        });
        
        currentIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (currentIndex < line.length) {
        parts.push({
          type: 'text',
          content: line.substring(currentIndex)
        });
      }

      return (
        <div key={lineIndex} className="relative mb-2">
          <div className="flex items-start">
            {parts.map((part, partIndex) => (
              <span key={partIndex} className="relative">
                {part.type === 'chord' && (
                  <span className="absolute -top-5 text-blue-600 font-semibold text-sm">
                    {part.content}
                  </span>
                )}
                <span className={part.type === 'chord' ? 'text-transparent' : ''}>
                  {part.type === 'chord' ? '_'.repeat(part.content.length) : part.content}
                </span>
              </span>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {sheetId ? "Edit Chord Sheet" : "Create New Chord Sheet"}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              {isPreview ? "Edit" : "Preview"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Song Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter song title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Artist *
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter artist name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="rock, acoustic, beginner"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <select
              value={isPublic ? "public" : "private"}
              onChange={(e) => setIsPublic(e.target.value === "public")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {!isPreview && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Insert Chords
            </label>
            <div className="flex flex-wrap gap-2">
              {commonChords.map((chord) => (
                <button
                  key={chord}
                  onClick={() => insertChord(chord)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  {chord}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <div className="text-xs text-gray-500 mb-2">
            Use [ChordName] to insert chords. Example: [Am]Hello [F]world [C]lyrics
          </div>
          
          {isPreview ? (
            <div className="w-full h-96 p-4 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto font-mono text-sm leading-relaxed">
              {renderPreview(content)}
            </div>
          ) : (
            <textarea
              id="content-editor"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter your lyrics with chords...

Example:
[C]Twinkle, twinkle, [F]little [C]star
[F]How I [C]wonder [G]what you [C]are
[C]Up a[F]bove the [C]world so [G]high
[C]Like a [F]diamond [G]in the [C]sky"
            />
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {sheetId ? "Update" : "Create"} Chord Sheet
          </button>
        </div>
      </div>
    </div>
  );
}
