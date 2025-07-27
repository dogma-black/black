
import React from 'react';
import { Project } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onOpenSettings: () => void;
  onBackToDashboard: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onOpenSettings,
  onBackToDashboard,
  isCollapsed,
  onToggleCollapse,
}) => {
  const activeProjects = projects.filter(p => !p.isArchived);

  return (
    <aside className={`bg-base border-r border-surface flex flex-col p-4 space-y-4 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
    }`}>
      <div className={`flex items-center mb-4 ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
        </svg>
        <h1 className={`text-xl font-bold text-white whitespace-nowrap ${isCollapsed ? 'hidden' : ''}`}>CodeForge</h1>
      </div>
      
      <nav className="flex-1 flex flex-col space-y-2 overflow-y-auto">
        <button
          onClick={onBackToDashboard}
          title="Dashboard"
          className={`flex items-center space-x-3 p-2 rounded-md text-sm font-medium transition-colors ${
            !activeProjectId ? 'bg-primary text-white' : 'text-gray-400 hover:bg-surface hover:text-white'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          {ICONS.DASHBOARD}
          <span className={isCollapsed ? 'hidden' : ''}>Dashboard</span>
        </button>

        <div className="pt-4">
            <h2 className={`px-2 text-xs font-semibold text-muted uppercase tracking-wider ${isCollapsed ? 'hidden' : ''}`}>Projects</h2>
            <div className="mt-2 space-y-1">
                {activeProjects.map(project => (
                <button
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    title={project.name}
                    className={`w-full flex items-center space-x-3 p-2 rounded-md text-sm font-medium transition-colors text-left ${
                    activeProjectId === project.id ? 'bg-primary text-white' : 'text-gray-400 hover:bg-surface hover:text-white'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                >
                    {ICONS.PROJECT}
                    <span className={`truncate ${isCollapsed ? 'hidden' : ''}`}>{project.name}</span>
                </button>
                ))}
            </div>
             <button
                onClick={onCreateProject}
                title="New Project"
                className={`w-full mt-2 flex items-center space-x-3 p-2 rounded-md text-sm font-medium transition-colors text-gray-400 hover:bg-surface hover:text-white ${isCollapsed ? 'justify-center' : ''}`}
                >
                {ICONS.ADD}
                <span className={isCollapsed ? 'hidden' : ''}>New Project</span>
            </button>
        </div>
      </nav>
      
      <div className="mt-auto flex flex-col space-y-1 border-t border-surface pt-3">
        <button
          onClick={onOpenSettings}
          title="Settings"
          className={`w-full flex items-center space-x-3 p-2 rounded-md text-sm font-medium transition-colors text-gray-400 hover:bg-surface hover:text-white ${isCollapsed ? 'justify-center' : ''}`}
        >
          {ICONS.SETTINGS}
          <span className={isCollapsed ? 'hidden' : ''}>Settings</span>
        </button>

        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
          className={`w-full flex items-center space-x-3 p-2 rounded-md text-sm font-medium transition-colors text-gray-400 hover:bg-surface hover:text-white ${isCollapsed ? 'justify-center' : ''}`}
        >
          {isCollapsed ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
             </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          )}
           <span className={`${isCollapsed ? 'hidden' : ''}`}>Collapse</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;