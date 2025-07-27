
import React, { useState, useCallback } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { Project, AiSettings } from './types';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ProjectView from './components/ProjectView';
import SettingsModal from './components/SettingsModal';
import { INITIAL_PROJECTS } from './constants';

function App() {
  const [projects, setProjects] = useLocalStorage<Project[]>('codeforge-projects', INITIAL_PROJECTS);
  const [settings, setSettings] = useLocalStorage<AiSettings>('codeforge-settings', {
    ollamaApiUrl: '',
    coremlApiUrl: '',
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
  };

  const handleBackToDashboard = () => {
    setActiveProjectId(null);
  };

  const handleCreateProject = () => {
    const newProject: Project = {
      id: new Date().toISOString(),
      name: `New Project ${projects.length + 1}`,
      files: [],
      chatHistory: [],
      lastUpdated: new Date().toISOString(),
      isArchived: false,
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  };
  
  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prevProjects => 
        prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  }, [setProjects]);

  const handleDeleteProject = (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (window.confirm(`Are you sure you want to permanently delete "${projectToDelete?.name}"? This action cannot be undone.`)) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (activeProjectId === projectId) {
            setActiveProjectId(null);
        }
    }
  };

  const handleArchiveProject = (projectId: string, archive: boolean) => {
     setProjects(prev => prev.map(p => p.id === projectId ? { ...p, isArchived: archive, lastUpdated: new Date().toISOString() } : p));
     if (activeProjectId === projectId) {
        setActiveProjectId(null);
     }
  };
  
  const handleRenameProject = (projectId: string, newName: string) => {
    if (newName && newName.trim() !== '') {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: newName.trim(), lastUpdated: new Date().toISOString() } : p));
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  return (
    <div className="flex h-screen w-full bg-base font-sans">
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onBackToDashboard={handleBackToDashboard}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeProject ? (
          <ProjectView 
            key={activeProject.id} 
            project={activeProject}
            updateProject={updateProject}
            settings={settings}
            onRename={handleRenameProject}
            onArchive={handleArchiveProject}
            onDelete={handleDeleteProject}
          />
        ) : (
          <DashboardView 
            projects={projects} 
            onSelectProject={handleSelectProject} 
            onRename={handleRenameProject}
            onArchive={handleArchiveProject}
            onDelete={handleDeleteProject}
          />
        )}
      </main>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
      />
    </div>
  );
}

export default App;