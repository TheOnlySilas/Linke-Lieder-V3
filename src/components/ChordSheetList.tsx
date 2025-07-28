import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ChordSheetListProps {
  onViewSheet: (id: Id<"chordSheets">) => void;
  onEditSheet: (id: Id<"chordSheets">) => void;
  searchQuery?: string;
  showMySheets?: boolean;
}

export function ChordSheetList({ 
  onViewSheet, 
  onEditSheet, 
  searchQuery = "",
  showMySheets = false 
}: ChordSheetListProps) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  
  const searchResults = useQuery(
    api.chordSheets.search,
    searchQuery.trim() && !showMySheets ? { query: searchQuery } : "skip"
  );
  
  const latestSheets = useQuery(
    api.chordSheets.list,
    !searchQuery.trim() && !showMySheets ? {} : "skip"
  );
  
  const mySheets = useQuery(
    api.chordSheets.myChordSheets,
    showMySheets && loggedInUser ? {} : "skip"
  );

  const chordSheets = showMySheets 
    ? mySheets 
    : searchQuery.trim() 
      ? searchResults 
      : latestSheets;

  if (chordSheets === undefined) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (chordSheets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">
          {showMySheets 
            ? "You haven't created any chord sheets yet."
            : searchQuery.trim()
              ? "No chord sheets found matching your search."
              : "No chord sheets available yet."
          }
        </div>
        {showMySheets && (
          <p className="text-gray-400 mt-2">
            Create your first chord sheet to get started!
          </p>
        )}
      </div>
    );
  }

  const title = showMySheets 
    ? "My Chord Sheets" 
    : searchQuery.trim() 
      ? `Search Results for "${searchQuery}"`
      : "Latest Chord Sheets";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <div className="text-sm text-gray-500">
          {chordSheets.length} sheet{chordSheets.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {chordSheets.map((sheet) => {
          const isOwner = loggedInUser && sheet.authorId === loggedInUser._id;
          
          return (
            <div
              key={sheet._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {sheet.title}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    by {sheet.artist}
                  </p>
                </div>
                {showMySheets && (
                  <div className="flex items-center gap-1 ml-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      sheet.isPublic ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    <span className="text-xs text-gray-500">
                      {sheet.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-500 mb-4">
                <p>by {showMySheets ? 'You' : (sheet as any).authorName || 'Unknown'}</p>
                <p>{new Date(sheet._creationTime).toLocaleDateString()}</p>
              </div>

              {sheet.tags && sheet.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {sheet.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {sheet.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{sheet.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => onViewSheet(sheet._id)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  View
                </button>
                {(showMySheets || isOwner) && (
                  <button
                    onClick={() => onEditSheet(sheet._id)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
