
import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../types';
import { ICONS } from '../constants';

interface DashboardViewProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onArchive: (id: string, archive: boolean) => void;
  onDelete: (id: string) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
  <div className="bg-surface p-6 rounded-lg">
    <h3 className="text-sm font-medium text-muted">{title}</h3>
    <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    <p className="mt-1 text-sm text-muted">{description}</p>
  </div>
);

const ProjectListItem: React.FC<{ 
    project: Project; 
    onSelect: () => void; 
    onRename: () => void; 
    onArchive: () => void; 
    onDelete: () => void;
}> = ({ project, onSelect, onRename, onArchive, onDelete }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <li className="relative flex items-center justify-between px-4 py-4 sm:px-6 hover:bg-gray-800/50 transition-colors duration-150">
            <button onClick={onSelect} className="flex items-center min-w-0 flex-1 group">
                <div className="flex-shrink-0">
                    <span className={`flex items-center justify-center h-12 w-12 rounded-full ${project.isArchived ? 'bg-gray-600/30 text-gray-400' : 'bg-primary/20 text-primary'}`}>
                        {ICONS.PROJECT}
                    </span>
                </div>
                <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                    <div>
                        <p className={`text-sm font-medium truncate ${project.isArchived ? 'text-gray-400' : 'text-primary group-hover:underline'}`}>{project.name}</p>
                        <p className="mt-2 flex items-center text-sm text-muted">
                            <span className="truncate">Last updated: {new Date(project.lastUpdated).toLocaleDateString()}</span>
                        </p>
                    </div>
                </div>
            </button>
            <div className="flex-shrink-0 flex items-center space-x-2">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <div className="relative" ref={menuRef}>
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(prev => !prev); }} className="p-2 rounded-full hover:bg-surface text-muted hover:text-white">
                        {ICONS.MORE_VERTICAL}
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-base border border-surface rounded-md shadow-lg z-10">
                            <button onClick={onRename} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-surface flex items-center gap-3">Rename</button>
                            <button onClick={onArchive} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-surface flex items-center gap-3">
                                {project.isArchived ? ICONS.UNARCHIVE : ICONS.ARCHIVE}
                                {project.isArchived ? 'Un-archive' : 'Archive'}
                            </button>
                            <div className="border-t border-surface my-1"></div>
                            <button onClick={onDelete} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/50 hover:text-red-300 flex items-center gap-3">
                                {ICONS.TRASH}
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
};

const DashboardView: React.FC<DashboardViewProps> = ({ projects, onSelectProject, onRename, onArchive, onDelete }) => {
    const activeProjects = projects.filter(p => !p.isArchived).sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    const archivedProjects = projects.filter(p => p.isArchived).sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    
    const handleRename = (project: Project) => {
        const newName = prompt('Enter new project name:', project.name);
        if (newName && newName.trim() !== '') {
            onRename(project.id, newName);
        }
    };
    
    return (
        <div className="flex-1 p-8 overflow-y-auto bg-[#111113]">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-muted">Welcome back! Here's an overview of your work.</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Active Projects" value={activeProjects.length} description="Total projects managed" />
                <StatCard title="Archived Projects" value={archivedProjects.length} description="Projects in archive" />
                <StatCard title="Total Files" value={projects.reduce((acc, p) => acc + p.files.length, 0)} description="Across all projects" />
            </div>
            
            <div className="mt-10">
                <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
                <div className="mt-4 bg-surface rounded-lg shadow">
                    {activeProjects.length > 0 ? (
                        <ul role="list" className="divide-y divide-gray-700">
                            {activeProjects.map(project => (
                                <ProjectListItem 
                                    key={project.id}
                                    project={project}
                                    onSelect={() => onSelectProject(project.id)}
                                    onRename={() => handleRename(project)}
                                    onArchive={() => onArchive(project.id, true)}
                                    onDelete={() => onDelete(project.id)}
                                />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted py-8">No active projects. Create one to get started!</p>
                    )}
                </div>
            </div>

            {archivedProjects.length > 0 && (
                 <div className="mt-10">
                    <h2 className="text-xl font-semibold text-white">Archived Projects</h2>
                    <div className="mt-4 bg-surface rounded-lg shadow">
                        <ul role="list" className="divide-y divide-gray-700">
                           {archivedProjects.map(project => (
                                <ProjectListItem 
                                    key={project.id}
                                    project={project}
                                    onSelect={() => onSelectProject(project.id)}
                                    onRename={() => handleRename(project)}
                                    onArchive={() => onArchive(project.id, false)}
                                    onDelete={() => onDelete(project.id)}
                                />
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardView;