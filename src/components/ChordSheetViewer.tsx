import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ChordSheetViewerProps {
  sheetId: Id<"chordSheets">;
  onEdit: () => void;
  onBack: () => void;
}

export function ChordSheetViewer({ sheetId, onEdit, onBack }: ChordSheetViewerProps) {
  const chordSheet = useQuery(api.chordSheets.getById, { id: sheetId });
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (chordSheet === undefined) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (chordSheet === null) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">Chord sheet not found or not accessible.</div>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIndex) => {
      if (line.trim() === '') {
        return <div key={lineIndex} className="h-6"></div>;
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
        <div key={lineIndex} className="relative mb-4 leading-relaxed">
          <div className="flex items-start flex-wrap">
            {parts.map((part, partIndex) => (
              <span key={partIndex} className="relative inline-block">
                {part.type === 'chord' && (
                  <span className="absolute -top-6 text-blue-600 font-bold text-sm whitespace-nowrap">
                    {part.content}
                  </span>
                )}
                <span className={`text-gray-800 ${part.type === 'chord' ? 'text-transparent select-none' : ''}`}>
                  {part.type === 'chord' ? '_'.repeat(Math.max(part.content.length, 2)) : part.content}
                </span>
              </span>
            ))}
          </div>
        </div>
      );
    });
  };

  const canEdit = loggedInUser && chordSheet.authorId === loggedInUser._id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-start mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          {canEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {chordSheet.title}
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            by {chordSheet.artist}
          </p>
          <div className="flex justify-center items-center gap-4 text-sm text-gray-500">
            <span>by {chordSheet.authorName}</span>
            <span>•</span>
            <span>{new Date(chordSheet._creationTime).toLocaleDateString()}</span>
          </div>
        </div>

        {chordSheet.tags && chordSheet.tags.length > 0 && (
          <div className="flex justify-center flex-wrap gap-2 mb-8">
            {chordSheet.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="font-mono text-base leading-loose bg-gray-50 p-6 rounded-lg">
          {renderContent(chordSheet.content)}
        </div>
      </div>
    </div>
  );
}
