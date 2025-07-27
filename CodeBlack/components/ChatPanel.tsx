import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AiSettings, AiProvider } from '../types';
import { ICONS } from '../constants';

interface ChatPanelProps {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string, files: File[]) => void;
  aiProvider: AiProvider;
  setAiProvider: (provider: AiProvider) => void;
  settings: AiSettings;
}

const FileAttachmentPill = ({ name }: { name: string }) => (
  <div className="flex items-center space-x-2 bg-blue-900 bg-opacity-70 rounded-full px-2 py-1 mt-1 text-xs text-blue-200 max-w-full">
    <div className="w-4 h-4 flex-shrink-0">{ICONS.FILE}</div>
    <span className="truncate" title={name}>{name}</span>
  </div>
);


const ChatPanel: React.FC<ChatPanelProps> = ({ chatHistory, isLoading, error, onSendMessage, aiProvider, setAiProvider, settings }) => {
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [chatHistory, isLoading, error]);

  const handleSend = () => {
    if ((input.trim() || attachedFiles.length > 0) && !isLoading) {
      onSendMessage(input.trim(), attachedFiles);
      setInput('');
      setAttachedFiles([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(event.target.files!)]);
    }
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileName: string) => {
    setAttachedFiles(prev => prev.filter(f => f.name !== fileName));
  };


  return (
    <div className="bg-base flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between border-b border-surface p-3 bg-surface">
        <div className="flex items-center space-x-2">
            {ICONS.CHAT}
            <h2 className="font-semibold text-white">AI Assistant</h2>
        </div>
        <div title={
            !settings.ollamaApiUrl && aiProvider === 'ollama' ? 'Set Ollama API URL in Settings' :
            !settings.coremlApiUrl && aiProvider === 'coreml' ? 'Set Llama 3 API URL in Settings' :
            'Select AI Provider'
        }>
            <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as AiProvider)}
                className="bg-base border border-gray-600 rounded-md py-1 px-2 text-xs text-gray-200 focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-70"
                disabled={isLoading}
            >
                <option value="gemini">Gemini</option>
                <option value="ollama" disabled={!settings.ollamaApiUrl}>Ollama</option>
                <option value="coreml" disabled={!settings.coremlApiUrl}>Llama 3 (Mac)</option>
            </select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-4 py-2 max-w-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-surface text-gray-300'}`}>
              {msg.content && <pre className="text-sm whitespace-pre-wrap font-sans">{msg.content}</pre>}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className={`pt-2 space-y-1 ${msg.content ? 'mt-2 border-t border-white/20' : ''}`}>
                    {msg.attachments.map((file, idx) => (
                        <FileAttachmentPill key={idx} name={file.name} />
                    ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2 bg-surface text-gray-300">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
              </div>
            </div>
          </div>
        )}
         {error && (
            <div className="flex justify-start">
                <div className="rounded-lg px-4 py-2 max-w-sm bg-red-900/50 text-red-300 border border-red-700">
                    <p className="text-sm font-semibold mb-1">Generation Failed</p>
                    <pre className="text-sm whitespace-pre-wrap font-sans">{error}</pre>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-surface p-4 bg-base flex-shrink-0">
        {attachedFiles.length > 0 && (
            <div className="mb-2 p-2 border border-dashed border-gray-600 rounded-md">
                <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                        <div key={index} className="bg-surface px-2 py-1 rounded-full text-xs flex items-center gap-2">
                            <span className="max-w-xs truncate">{file.name}</span>
                            <button onClick={() => removeFile(file.name)} className="text-gray-400 hover:text-white">
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the component you want to build..."
            rows={3}
            className="w-full bg-surface border border-gray-600 rounded-lg p-2 pl-10 pr-12 text-sm text-gray-200 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
            disabled={isLoading}
          />
           <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || aiProvider !== 'gemini'}
            className="absolute left-2 bottom-2 p-2 rounded-full text-gray-400 hover:text-white hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={aiProvider === 'gemini' ? "Attach files (images, designs, etc.)" : "Attachments only supported by Gemini"}
          >
            {ICONS.ATTACHMENT}
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
            className="absolute right-2 bottom-2 p-2 rounded-full bg-primary text-white disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
          >
            {ICONS.SEND}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;