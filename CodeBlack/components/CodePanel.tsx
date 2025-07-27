import React, { useState, useEffect } from 'react';
import { ProjectFile } from '../types';

interface CodePanelProps {
  files: ProjectFile[];
  fileType: 'html' | 'css' | 'javascript';
}

const CodePanel: React.FC<CodePanelProps> = ({ files, fileType }) => {
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  useEffect(() => {
    if (files && files.length > 0) {
      if (!files.find(f => f.id === activeFileId)) {
        setActiveFileId(files[0].id);
      }
    } else {
      setActiveFileId(null);
    }
  }, [files, activeFileId]);

  const activeFile = files.find(file => file.id === activeFileId);

  const renderContent = () => {
    if (files.length === 0) {
        let fileTypeName = 'files';
        switch (fileType) {
            case 'html': fileTypeName = 'HTML'; break;
            case 'css': fileTypeName = 'CSS'; break;
            case 'javascript': fileTypeName = 'JavaScript'; break;
        }
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted p-4">
          <p className="text-sm text-center">No {fileTypeName} files generated yet.</p>
          <p className="text-xs text-center mt-2">Use the AI assistant to generate code.</p>
        </div>
      );
    }

    if (!activeFile) {
      return null;
    }

    return (
      <pre className="text-sm whitespace-pre font-mono p-4 overflow-auto h-full">
        <code className={`language-${activeFile.type}`}>
          {activeFile.content}
        </code>
      </pre>
    );
  };

  return (
    <div className="bg-base flex flex-col h-full overflow-hidden">
      {files.length > 1 && (
        <div className="flex-shrink-0 border-b border-surface bg-base overflow-x-auto">
          <div className="flex space-x-1 p-1">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center space-x-1 whitespace-nowrap ${
                  activeFileId === file.id ? 'bg-primary text-white' : 'text-gray-400 hover:bg-surface'
                }`}
              >
                <span className="truncate max-w-32">{file.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto bg-[#0d1117]">
        {renderContent()}
      </div>
    </div>
  );
};

export default CodePanel;