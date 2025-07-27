
import React from 'react';
import { ProjectFile } from '../types';
import { ICONS } from '../constants';

interface PreviewPanelProps {
  files: ProjectFile[];
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ files }) => {
  const htmlContent = files.filter(f => f.type === 'html').map(f => f.content).join('\n');
  const cssContent = files.filter(f => f.type === 'css').map(f => f.content).join('\n');
  const jsContent = files.filter(f => f.type === 'javascript').map(f => f.content).join('\n');
  
  const hasContent = files && files.length > 0;

  const srcDoc = hasContent
    ? `
    <html>
      <head>
        <style>${cssContent}</style>
      </head>
      <body>
        ${htmlContent}
        <script type="module">${jsContent}</script>
      </body>
    </html>
    `
    : '';

  return (
    <div className="bg-base flex flex-col h-full">
      <div className="flex-shrink-0 flex items-center space-x-2 border-b border-surface p-3 bg-surface">
        {ICONS.PREVIEW}
        <h2 className="font-semibold text-white">Live Preview</h2>
      </div>
      <div className="flex-1 bg-white relative">
        {hasContent ? (
            <iframe
            srcDoc={srcDoc}
            title="Live Preview"
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-0"
            />
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 bg-gray-100">
                <div className="w-16 h-16 text-gray-400">{ICONS.PREVIEW}</div>
                <h3 className="mt-4 text-lg font-medium text-gray-600">Preview will appear here</h3>
                <p className="mt-1 text-sm text-center">The rendered output of your generated code will be displayed in this panel.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;