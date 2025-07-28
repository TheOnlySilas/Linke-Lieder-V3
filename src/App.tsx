import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { ChordSheetList } from "./components/ChordSheetList";
import { ChordSheetEditor } from "./components/ChordSheetEditor";
import { ChordSheetViewer } from "./components/ChordSheetViewer";
import { SearchBar } from "./components/SearchBar";
import { Id } from "../convex/_generated/dataModel";

type View = "home" | "create" | "edit" | "view" | "my-sheets" | "login";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [selectedSheetId, setSelectedSheetId] = useState<Id<"chordSheets"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loggedInUser = useQuery(api.auth.loggedInUser);

  const handleViewSheet = (id: Id<"chordSheets">) => {
    setSelectedSheetId(id);
    setCurrentView("view");
  };

  const handleEditSheet = (id: Id<"chordSheets">) => {
    setSelectedSheetId(id);
    setCurrentView("edit");
  };

  const handleCreateNew = () => {
    setSelectedSheetId(null);
    setCurrentView("create");
  };

  const handleBackToHome = () => {
    setCurrentView("home");
    setSelectedSheetId(null);
    setSearchQuery("");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleShowLogin = () => {
    setCurrentView("login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button
              onClick={handleBackToHome}
              className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              ChordBook
            </button>
            <nav className="hidden md:flex items-center gap-4">
              <button
                onClick={handleBackToHome}
                className={`px-3 py-2 rounded-md transition-colors ${
                  currentView === "home"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Latest
              </button>
              {loggedInUser && (
                <>
                  <button
                    onClick={() => setCurrentView("my-sheets")}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      currentView === "my-sheets"
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    My Sheets
                  </button>
                  <button
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create New
                  </button>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {(currentView === "home" || currentView === "my-sheets") && (
              <SearchBar onSearch={handleSearch} />
            )}
            {loggedInUser ? (
              <SignOutButton />
            ) : (
              <button
                onClick={handleShowLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {currentView === "login" && !loggedInUser && (
          <div className="max-w-md mx-auto mt-20 p-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to ChordBook
              </h1>
              <p className="text-xl text-gray-600">
                Share and discover song chords and lyrics
              </p>
            </div>
            <SignInForm />
            <div className="text-center mt-4">
              <button
                onClick={handleBackToHome}
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                Continue browsing without login
              </button>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto p-6">
          {currentView === "home" && (
            <ChordSheetList
              onViewSheet={handleViewSheet}
              onEditSheet={handleEditSheet}
              searchQuery={searchQuery}
            />
          )}
          {currentView === "my-sheets" && loggedInUser && (
            <ChordSheetList
              onViewSheet={handleViewSheet}
              onEditSheet={handleEditSheet}
              showMySheets={true}
            />
          )}
          {currentView === "create" && loggedInUser && (
            <ChordSheetEditor
              onSave={handleBackToHome}
              onCancel={handleBackToHome}
            />
          )}
          {currentView === "edit" && selectedSheetId && loggedInUser && (
            <ChordSheetEditor
              sheetId={selectedSheetId}
              onSave={handleBackToHome}
              onCancel={handleBackToHome}
            />
          )}
          {currentView === "view" && selectedSheetId && (
            <ChordSheetViewer
              sheetId={selectedSheetId}
              onEdit={() => handleEditSheet(selectedSheetId)}
              onBack={handleBackToHome}
            />
          )}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
