
import React from 'react';
import { AiSettings } from '../types';
import { ICONS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AiSettings;
  setSettings: React.Dispatch<React.SetStateAction<AiSettings>>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, setSettings }) => {
  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-muted hover:text-white">
            {ICONS.CLOSE}
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="text-sm text-gray-400 bg-base p-3 rounded-md">
            <p>Note: Gemini API usage is configured via environment variables and does not require settings here.</p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Ollama (Qwen)</h3>
            <label htmlFor="ollamaApiUrl" className="block text-sm font-medium text-gray-400 mb-1">
              API URL
            </label>
            <input
              type="text"
              id="ollamaApiUrl"
              name="ollamaApiUrl"
              value={settings.ollamaApiUrl}
              onChange={handleChange}
              placeholder="e.g., http://localhost:11434"
              className="w-full bg-base border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Llama 3 (CoreML on Mac)</h3>
            <p className="text-xs text-gray-400 mb-2">
              Run Llama 3 locally on your MacBook using a CoreML model. You'll need a separate server (e.g., using MLX) to expose the model via an API endpoint.
            </p>
            <label htmlFor="coremlApiUrl" className="block text-sm font-medium text-gray-400 mb-1">
              API Endpoint
            </label>
            <input
              type="text"
              id="coremlApiUrl"
              name="coremlApiUrl"
              value={settings.coremlApiUrl}
              onChange={handleChange}
              placeholder="e.g., http://127.0.0.1:8080/v1/chat/completions"
              className="w-full bg-base border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-base/50 border-t border-gray-700 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
