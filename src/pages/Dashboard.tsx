
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { CategoryView } from "@/components/CategoryView";
import { AllEntriesView } from "@/components/AllEntriesView";
import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardNavigation } from "@/hooks/useDashboardNavigation";
import { useDashboardEntryHandlers } from "@/hooks/useDashboardEntryHandlers";
import { DashboardMainContent } from "@/components/DashboardMainContent";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useDashboardVoice } from "@/hooks/useDashboardVoice";

const Dashboard = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    searchQuery,
    setSearchQuery,
    savedEntries,
    showAddEntry,
    setShowAddEntry,
    editingEntry,
    setEditingEntry,
    fillingEntry,
    setFillingEntry,
    saveEntry,
    deleteEntry,
    editEntry,
    fillEntry,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    handleAddEntry,
    handleEnhancedVoiceInput,
    isVoiceProcessing,
    lastVoiceCommand,
    conversationState,
    hasPendingConfirmation,
    cancelCurrentOperation,
    conversationData,
    isLoading,
  } = useDashboard();

  const {
    selectedCategory,
    showDocumentCreator,
    showAllEntries,
    setShowDocumentCreator,
    handleCategorySelect,
    handleAllEntriesSelect,
    handleBackToMain,
    handleCreateDocument,
  } = useDashboardNavigation();

  const {
    handleDocumentSave,
    handleDocumentCancel,
    handleCreateEntryForCategory,
    handleAddEntryWithCategory,
  } = useDashboardEntryHandlers(
    saveEntry,
    setShowDocumentCreator,
    setShowAddEntry,
    setEditingEntry,
    setFillingEntry
  );

  // Set up voice command handling
  const { handleVoiceCommand } = useDashboardVoice({
    savedEntries,
    showAddEntry,
    setShowAddEntry,
    setEditingEntry,
    setFillingEntry,
    deleteEntry,
    editEntry,
    fillEntry,
    handleCancelEdit,
    saveEntry,
    editingEntry,
    fillingEntry,
  });

  console.log('Dashboard state:', {
    selectedCategory,
    showDocumentCreator,
    showAddEntry,
    showAllEntries,
    editingEntry: editingEntry?.title,
    fillingEntry: fillingEntry?.title,
    totalEntries: savedEntries.length,
    isLoading,
    isVoiceProcessing,
    conversationState,
    hasPendingConfirmation,
    authLoading,
    isAuthenticated,
    user: user?.email
  });

  // Check for OAuth callback in URL - don't redirect if this is an OAuth callback
  const isOAuthCallback = window.location.search.includes('code=') || 
                         window.location.hash.includes('access_token') ||
                         window.location.pathname === '/dashboard';

  // Don't redirect if we're loading or if this is an OAuth callback
  if (!isAuthenticated && !authLoading && !isOAuthCallback) {
    return <Navigate to="/login" replace />;
  }

  // Show loading state while auth is loading or entries are being loaded
  console.log('Loading check:', { authLoading, isLoading, isAuthenticated, isOAuthCallback });
  if (authLoading || (isLoading && isAuthenticated)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your entries...</p>
        </div>
      </div>
    );
  }

  const wrappedCategorySelect = (categoryName: string) => {
    handleCategorySelect(categoryName, setShowAddEntry, setEditingEntry, setFillingEntry);
  };

  const wrappedAllEntriesSelect = () => {
    handleAllEntriesSelect(setShowAddEntry, setEditingEntry, setFillingEntry);
  };

  const wrappedBackToMain = () => {
    handleBackToMain(setShowAddEntry, setEditingEntry, setFillingEntry);
  };

  return (
    <DashboardLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      userName={user?.full_name || user?.email}
      savedEntries={savedEntries}
      onAddEntry={handleAddEntryWithCategory}
      onCategorySelect={wrappedCategorySelect}
      onAllEntriesSelect={wrappedAllEntriesSelect}
      onVoiceCommand={handleVoiceCommand}
      isVoiceProcessing={isVoiceProcessing}
      lastVoiceCommand={lastVoiceCommand}
      conversationState={conversationState}
      hasPendingConfirmation={hasPendingConfirmation}
      onCancelVoice={cancelCurrentOperation}
      conversationData={conversationData}
    >
      {showAllEntries ? (
        <AllEntriesView
          entries={savedEntries}
          onBack={wrappedBackToMain}
          onEdit={editEntry}
          onDelete={deleteEntry}
          onFill={fillEntry}
          showAddEntry={showAddEntry}
          editingEntry={editingEntry}
          fillingEntry={fillingEntry}
          onSaveEntry={saveEntry}
          onCancelEdit={handleCancelEdit}
          getFormTitle={getFormTitle}
          getFormMode={getFormMode}
        />
      ) : selectedCategory ? (
        <CategoryView
          categoryName={selectedCategory}
          entries={savedEntries}
          onBack={wrappedBackToMain}
          onEdit={editEntry}
          onDelete={deleteEntry}
          onFill={fillEntry}
          onCreateEntry={handleCreateEntryForCategory}
          showDocumentCreator={showDocumentCreator}  
          showAddEntry={showAddEntry}
          editingEntry={editingEntry}
          fillingEntry={fillingEntry}
          onDocumentSave={handleDocumentSave}
          onDocumentCancel={handleDocumentCancel}
          onSaveEntry={saveEntry}
          onCancelEdit={handleCancelEdit}
          getFormTitle={getFormTitle}
          getFormMode={getFormMode}
        />
      ) : (
        <DashboardMainContent
          userName={user?.full_name || user?.email}
          userTier={user?.subscriptionTier}
          savedEntries={savedEntries}
          showDocumentCreator={showDocumentCreator}
          showAddEntry={showAddEntry}
          editingEntry={editingEntry}
          fillingEntry={fillingEntry}
          getFormTitle={getFormTitle}
          getFormMode={getFormMode}
          onDocumentSave={handleDocumentSave}
          onDocumentCancel={handleDocumentCancel}
          onSaveEntry={saveEntry}
          onCancelEdit={handleCancelEdit}
          onCategorySelect={wrappedCategorySelect}
          onAddEntry={handleAddEntryWithCategory}
          onCreateDocument={handleCreateDocument}
          onEnhancedVoiceInput={handleEnhancedVoiceInput}
          onEditEntry={editEntry}
          onFillEntry={fillEntry}
          isVoiceProcessing={isVoiceProcessing}
          lastVoiceCommand={lastVoiceCommand}
          conversationState={conversationState}
          hasPendingConfirmation={hasPendingConfirmation}
          onCancelVoice={cancelCurrentOperation}
          conversationData={conversationData}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
