import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Project, ChatMessage, ProjectFile, AiSettings, AiProvider } from '../types';
import ChatPanel from './ChatPanel';
import CodePanel from './CodePanel';
import PreviewPanel from './PreviewPanel';
import { generateCode } from '../services/geminiService';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ICONS } from '../constants';

interface ProjectViewProps {
  project: Project;
  updateProject: (project: Project) => void;
  settings: AiSettings;
  onRename: (projectId: string, newName: string) => void;
  onArchive: (projectId: string, archive: boolean) => void;
  onDelete: (projectId: string) => void;
}

const CodeTab = ({ title, fileType, isActive, onClick, fileCount }: {
    title: string;
    fileType: 'html' | 'css' | 'javascript';
    isActive: boolean;
    onClick: () => void;
    fileCount: number;
}) => {
    const getIcon = () => {
        if (fileType === 'html') return <span className="font-mono text-orange-400 w-5 text-center">&lt;/&gt;</span>;
        if (fileType === 'css') return <span className="font-mono text-blue-400 w-5 text-center">#</span>;
        if (fileType === 'javascript') return <span className="font-mono text-yellow-400 w-5 text-center">JS</span>;
        return null;
    }
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActive
                ? 'border-primary text-white'
                : 'border-transparent text-muted hover:text-white'
            }`}
        >
            {getIcon()}
            <span>{title}</span>
            {fileCount > 0 && <span className="text-xs bg-gray-700 text-gray-300 rounded-full px-2 py-0.5">{fileCount}</span>}
        </button>
    )
}

const ProjectHeaderActions = ({ project, onArchive, onDelete }: { 
    project: Project;
    onArchive: (projectId: string, archive: boolean) => void;
    onDelete: (projectId: string) => void;
}) => {
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
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setMenuOpen(prev => !prev)}
                className="p-2 rounded-full hover:bg-surface text-muted hover:text-white"
                title="Project actions"
            >
                {ICONS.MORE_VERTICAL}
            </button>
            {menuOpen && (
                 <div className="absolute right-0 mt-2 w-48 bg-base border border-surface rounded-md shadow-lg z-20">
                    <button onClick={() => { onArchive(project.id, !project.isArchived); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-surface flex items-center gap-3">
                        {project.isArchived ? ICONS.UNARCHIVE : ICONS.ARCHIVE}
                        {project.isArchived ? 'Un-archive' : 'Archive'}
                    </button>
                    <div className="border-t border-surface my-1"></div>
                    <button onClick={() => { onDelete(project.id); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/50 hover:text-red-300 flex items-center gap-3">
                        {ICONS.TRASH}
                        Delete Project
                    </button>
                </div>
            )}
        </div>
    );
};

const ProjectView: React.FC<ProjectViewProps> = ({ project, updateProject, settings, onRename, onArchive, onDelete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'javascript'>('html');
  const [aiProvider, setAiProvider] = useState<AiProvider>('gemini');
  const [panelVisibility, setPanelVisibility] = useState({
    chat: true,
    code: true,
    preview: true,
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
        nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameSave = () => {
    if (projectName.trim()) {
        onRename(project.id, projectName.trim());
    } else {
        setProjectName(project.name); // revert if empty
    }
    setIsEditingName(false);
  };
  
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNameSave();
    if (e.key === 'Escape') {
        setProjectName(project.name);
        setIsEditingName(false);
    }
  };

  const togglePanel = (panel: 'chat' | 'code' | 'preview') => {
    setPanelVisibility(prev => {
        const newState = { ...prev, [panel]: !prev[panel] };
        if (Object.values(newState).every(v => !v)) {
            return { ...prev, [panel]: true };
        }
        return newState;
    });
  };

  const handleSendMessage = useCallback(async (prompt: string, files: File[]) => {
    setIsLoading(true);
    setError(null);

    const visualFiles: File[] = [];
    const textFiles: File[] = [];
    const otherFileNames: string[] = [];
    
    const textMimeTypes = [ 'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/javascript', 'application/json', 'text/xml', 'application/xml', 'text/markdown' ];

    for (const file of files) {
        if (file.type.startsWith('image/')) visualFiles.push(file);
        else if (textMimeTypes.includes(file.type) || file.name.match(/\.(ts|tsx|js|jsx|html|css|scss|json|md|txt)$/i)) textFiles.push(file);
        else otherFileNames.push(file.name);
    }

    let finalPrompt = prompt;
    if (otherFileNames.length > 0) finalPrompt += `\n\n[System Note: The following binary files were also uploaded for contextual reference only: ${otherFileNames.join(', ')}. Their content cannot be processed directly.]`;
    
    const userMessage: ChatMessage = { role: 'user', content: prompt, attachments: files.map(f => ({ name: f.name, type: f.type })) };
    const historyWithUserMessage = [...project.chatHistory, userMessage];
    updateProject({ ...project, chatHistory: historyWithUserMessage, lastUpdated: new Date().toISOString() });

    try {
      const generatedFiles = await generateCode(aiProvider, finalPrompt, project.chatHistory, visualFiles, textFiles, settings);
      const modelResponseContent = `I've generated ${generatedFiles.length} file(s) for you using ${aiProvider}. You can see them in the editor panels and the live preview.`;
      const newFiles: ProjectFile[] = generatedFiles.map(file => ({ ...file, id: file.name }));
      const modelMessage: ChatMessage = { role: 'model', content: modelResponseContent };
      updateProject({ ...project, files: newFiles, chatHistory: [...historyWithUserMessage, modelMessage], lastUpdated: new Date().toISOString() });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      const modelErrorMessage: ChatMessage = { role: 'model', content: `Error: ${errorMessage}` };
      const historyWithError = [...historyWithUserMessage, modelErrorMessage];
      updateProject({ ...project, chatHistory: historyWithError, lastUpdated: new Date().toISOString() });
    } finally {
      setIsLoading(false);
    }
  }, [project, updateProject, aiProvider, settings]);
  
  const handleDownload = async () => {
    if (project.files.length === 0) return;
    setIsDownloading(true);
    try {
        const zip = new JSZip();
        project.files.forEach(file => zip.file(file.name, file.content));
        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, `${project.name.replace(/\s+/g, '_')}.zip`);
    } catch (err) {
        console.error("Error creating zip file:", err);
        alert("An error occurred while preparing the download.");
    } finally {
        setIsDownloading(false);
    }
  };

  const htmlFiles = project.files.filter((f) => f.type === 'html');
  const cssFiles = project.files.filter((f) => f.type === 'css');
  const jsFiles = project.files.filter((f) => f.type === 'javascript');

  let activeFiles: ProjectFile[];
    switch (activeCodeTab) {
        case 'css': activeFiles = cssFiles; break;
        case 'javascript': activeFiles = jsFiles; break;
        case 'html': default: activeFiles = htmlFiles; break;
    }
    
  const { chat, code, preview } = panelVisibility;
  const visibleCount = [chat, code, preview].filter(Boolean).length;
  let chatClass = '', codeClass = '', previewClass = '';

  if (visibleCount === 3) { chatClass = 'lg:col-span-3'; codeClass = 'lg:col-span-5'; previewClass = 'lg:col-span-4'; } 
  else if (visibleCount === 2) {
      if (chat && code) { chatClass = 'lg:col-span-4'; codeClass = 'lg:col-span-8'; }
      else if (chat && preview) { chatClass = 'lg:col-span-5'; previewClass = 'lg:col-span-7'; }
      else if (code && preview) { codeClass = 'lg:col-span-6'; previewClass = 'lg:col-span-6'; }
  } else if (visibleCount === 1) {
      if (chat) chatClass = 'lg:col-span-12';
      if (code) codeClass = 'lg:col-span-12';
      if (preview) previewClass = 'lg:col-span-12';
  }

  const PanelToggleButton = ({ panel, icon }: { panel: 'chat' | 'code' | 'preview', icon: JSX.Element }) => (
    <button title={panelVisibility[panel] ? `Hide ${panel}` : `Show ${panel}`} onClick={() => togglePanel(panel)} className={`p-2 rounded-md transition-colors ${ panelVisibility[panel] ? 'bg-primary text-white' : 'text-muted hover:bg-gray-600 hover:text-white' }`}>
        {icon}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col h-full">
        <header className="flex-shrink-0 bg-base border-b border-surface px-4 py-3 flex justify-between items-center space-x-4">
            {isEditingName ? (
                <input
                    ref={nameInputRef}
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={handleNameKeyDown}
                    className="text-lg font-semibold bg-surface text-white rounded-md px-2 py-0.5 -my-0.5 border-2 border-primary focus:outline-none"
                />
            ) : (
                <h1 onClick={() => setIsEditingName(true)} className="text-lg font-semibold text-white truncate cursor-pointer" title="Click to rename">{project.name}</h1>
            )}
            <div className="flex-grow"></div>
            <div className="flex items-center space-x-2">
                 <ProjectHeaderActions project={project} onArchive={onArchive} onDelete={onDelete} />
                <div className="flex items-center space-x-1 p-1 bg-surface rounded-lg">
                    <PanelToggleButton panel="chat" icon={ICONS.CHAT} />
                    <PanelToggleButton panel="code" icon={ICONS.CODE} />
                    <PanelToggleButton panel="preview" icon={ICONS.PREVIEW} />
                </div>
                <button onClick={handleDownload} disabled={project.files.length === 0 || isDownloading} className="flex items-center space-x-2 px-3 py-1.5 bg-surface text-sm text-gray-300 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isDownloading ? ( <> <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span>Zipping...</span> </>
                    ) : ( <> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> <span>Download</span> </> )}
                </button>
            </div>
        </header>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-px bg-surface overflow-hidden min-h-0">
            {chat && (
                <div className={`h-full flex flex-col ${chatClass}`}>
                    <ChatPanel chatHistory={project.chatHistory} isLoading={isLoading} error={error} onSendMessage={handleSendMessage} aiProvider={aiProvider} setAiProvider={setAiProvider} settings={settings} />
                </div>
            )}
            {code && (
                <div className={`h-full flex flex-col bg-surface ${codeClass}`}>
                    <div className="flex-shrink-0 flex items-center border-b border-surface bg-base">
                        <CodeTab title="HTML" fileType="html" isActive={activeCodeTab === 'html'} onClick={() => setActiveCodeTab('html')} fileCount={htmlFiles.length} />
                        <CodeTab title="CSS" fileType="css" isActive={activeCodeTab === 'css'} onClick={() => setActiveCodeTab('css')} fileCount={cssFiles.length} />
                        <CodeTab title="JavaScript" fileType="javascript" isActive={activeCodeTab === 'javascript'} onClick={() => setActiveCodeTab('javascript')} fileCount={jsFiles.length} />
                    </div>
                    <div className="flex-1 flex flex-col min-h-0">
                        <CodePanel key={activeCodeTab} files={activeFiles} fileType={activeCodeTab} />
                    </div>
                </div>
            )}
            {preview && (
                <div className={`h-full flex flex-col ${previewClass}`}>
                    <PreviewPanel files={project.files} />
                </div>
            )}
        </div>
    </div>
  );
};

export default ProjectView;