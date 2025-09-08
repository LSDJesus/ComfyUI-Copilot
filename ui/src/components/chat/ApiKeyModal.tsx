/*
 * @Author: 晴知 qingli.hql@alibaba-inc.com
 * @Date: 2024-12-12 21:28:03
 * @LastEditors: ai-business-hql ai.bussiness.hql@gmail.com
 * @LastEditTime: 2025-09-01 19:49:52
 * @FilePath: /comfyui_copilot/ui/src/components/chat/ApiKeyModal.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBK                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <div className="mb-1"><strong>🔗 For LMStudio:</strong> http://localhost:1234/v1 (leave API key empty)</div>
                                <div className="mb-1"><strong>🌐 For OpenAI:</strong> https://api.openai.com/v1 (requires API key)</div>
                                <div><strong>⚙️ For Custom:</strong> Any OpenAI-compatible server URL</div>
                            </div>koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// Copyright (C) 2025 AIDC-AI
// Licensed under the MIT License.

import { useEffect, useState } from 'react';
import { config } from '../../config';
interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string) => void;
    initialApiKey?: string;
    onConfigurationUpdated?: () => void;
}

const BASE_URL = config.apiBaseUrl

export function ApiKeyModal({ isOpen, onClose, onSave, initialApiKey = '', onConfigurationUpdated }: ApiKeyModalProps) {
    // Load config from localStorage on mount
    useEffect(() => {
        const savedProvider = localStorage.getItem('provider') as 'gemini' | 'vertex' | 'chatgpt';
        const savedGeminiKey = localStorage.getItem('geminiApiKey') || '';
        const savedVertexProject = localStorage.getItem('vertexProject') || '';
        const savedVertexRegion = localStorage.getItem('vertexRegion') || 'uswest-1';
        const savedVertexJson = localStorage.getItem('vertexServiceAccountPath') || '';
        const savedGptKey = localStorage.getItem('gptApiKey') || '';
        const savedModel = localStorage.getItem('model') || '';
        if (savedProvider) setProvider(savedProvider);
        if (savedGeminiKey) setGeminiApiKey(savedGeminiKey);
        if (savedVertexProject) setVertexProject(savedVertexProject);
        if (savedVertexRegion) setVertexRegion(savedVertexRegion);
        if (savedVertexJson) setVertexServiceAccountPath(savedVertexJson);
        if (savedGptKey) setGptApiKey(savedGptKey);
        if (savedModel) setModel(savedModel);
    }, []);

    const [provider, setProvider] = useState<'gemini' | 'vertex' | 'chatgpt'>('gemini');
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [vertexProject, setVertexProject] = useState('');
    const [vertexRegion, setVertexRegion] = useState('uswest-1');
    const [vertexServiceAccountPath, setVertexServiceAccountPath] = useState('');
    const [gptApiKey, setGptApiKey] = useState('');
    const [model, setModel] = useState('gemini-2.5-pro');

    const geminiModels = [
        { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    ];
    const gptModels = [
        { value: 'gpt-4.1', label: 'GPT-4.1' },
        { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    ];

    const handleSave = () => {
        localStorage.setItem('provider', provider);
        localStorage.setItem('model', model);
        if (provider === 'gemini') {
            localStorage.setItem('geminiApiKey', geminiApiKey);
            localStorage.removeItem('vertexProject');
            localStorage.removeItem('vertexRegion');
            localStorage.removeItem('vertexServiceAccountPath');
            localStorage.removeItem('gptApiKey');
        } else if (provider === 'vertex') {
            localStorage.setItem('vertexProject', vertexProject);
            localStorage.setItem('vertexRegion', vertexRegion);
            localStorage.setItem('vertexServiceAccountPath', vertexServiceAccountPath);
            localStorage.removeItem('geminiApiKey');
            localStorage.removeItem('gptApiKey');
        } else if (provider === 'chatgpt') {
            localStorage.setItem('gptApiKey', gptApiKey);
            localStorage.removeItem('geminiApiKey');
            localStorage.removeItem('vertexProject');
            localStorage.removeItem('vertexRegion');
            localStorage.removeItem('vertexServiceAccountPath');
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-[480px] max-h-[80vh] shadow-2xl overflow-y-auto">
                <h2 className="text-xl text-gray-900 dark:text-white font-semibold mb-6">Model & API Configuration</h2>
                <div className="mb-6">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Provider</label>
                    <select
                        value={provider}
                        onChange={e => setProvider(e.target.value as 'gemini' | 'vertex' | 'chatgpt')}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="gemini">Google Gemini Public</option>
                        <option value="vertex">Google Cloud Vertex</option>
                        <option value="chatgpt">ChatGPT (OpenAI)</option>
                    </select>
                </div>
                <div className="mb-6">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Model</label>
                    <select
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        {(provider === 'gemini' || provider === 'vertex') && geminiModels.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                        {provider === 'chatgpt' && gptModels.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
                {provider === 'gemini' && (
                    <div className="mb-6">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Gemini API Key</label>
                        <input
                            type="password"
                            value={geminiApiKey}
                            onChange={e => setGeminiApiKey(e.target.value)}
                            placeholder="Enter your Gemini API key"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                )}
                {provider === 'vertex' && (
                    <>
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Vertex Project ID</label>
                            <input
                                type="text"
                                value={vertexProject}
                                onChange={e => setVertexProject(e.target.value)}
                                placeholder="Enter your GCP Project ID"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Vertex Region</label>
                            <input
                                type="text"
                                value={vertexRegion}
                                onChange={e => setVertexRegion(e.target.value)}
                                placeholder="uswest-1, us-central1, etc."
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Service Account JSON Path</label>
                            <input
                                type="text"
                                value={vertexServiceAccountPath}
                                onChange={e => setVertexServiceAccountPath(e.target.value)}
                                placeholder="Path to service account JSON file"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </>
                )}
                {provider === 'chatgpt' && (
                    <div className="mb-6">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">ChatGPT API Key</label>
                        <input
                            type="password"
                            value={gptApiKey}
                            onChange={e => setGptApiKey(e.target.value)}
                            placeholder="Enter your OpenAI API key"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                )}
                <div className="flex justify-end mt-8">
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                        Save
                    </button>
                    <button
                        onClick={onClose}
                        className="ml-4 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
// All code after this line is deleted
// REMOVE ALL CODE BELOW THIS LINE
                    {/* Gemini Configuration */}
                    <CollapsibleCard 
                        title={<h3 className="text-sm text-gray-900 dark:text-white font-medium">Gemini Configuration (Public / Vertex AI)</h3>}
                        className='mb-4'
                    >
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Gemini API Type</label>
                            <select
                                value={geminiApiType}
                                onChange={e => setGeminiApiType(e.target.value as 'public' | 'vertex')}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="public">Public Gemini API</option>
                                <option value="vertex">Vertex AI (Google Cloud)</option>
                            </select>
                        </div>
                        {geminiApiType === 'public' && (
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Gemini API Key</label>
                                <input
                                    type="password"
                                    value={geminiApiKey}
                                    onChange={e => setGeminiApiKey(e.target.value)}
                                    placeholder="Enter your Gemini API key"
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        )}
                        {geminiApiType === 'vertex' && (
                            <>
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Vertex Project ID</label>
                                <input
                                    type="text"
                                    value={vertexProject}
                                    onChange={e => setVertexProject(e.target.value)}
                                    placeholder="Enter your GCP Project ID"
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Vertex Region</label>
                                <input
                                    type="text"
                                    value={vertexRegion}
                                    onChange={e => setVertexRegion(e.target.value)}
                                    placeholder="uswest-1, us-central1, etc."
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Service Account JSON Path</label>
                                <input
                                    type="text"
                                    value={vertexServiceAccountPath}
                                    onChange={e => setVertexServiceAccountPath(e.target.value)}
                                    placeholder="Path to service account JSON file"
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            </>
                        )}
                    </CollapsibleCard>
                </div>
                
                {/* LLM Configuration */}
                <CollapsibleCard 
                    title={<h3 className="text-sm text-gray-900 dark:text-white font-medium">LLM Configuration (OpenAI / LMStudio / Custom)</h3>}
                    className='mb-4'
                >
                    <div>
                        {/* API Key */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                API Key (Optional for LMStudio)
                            </label>
                            <div className="relative">
                                <input
                                    type={showOpenaiApiKey ? "text" : "password"}
                                    value={openaiApiKey}
                                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                                    placeholder="Enter your OpenAI API key (leave empty for LMStudio)"
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg pr-12 text-xs
                                    bg-gray-50 dark:bg-gray-700 
                                    text-gray-900 dark:text-white
                                    placeholder-gray-500 dark:placeholder-gray-400
                                    focus:border-blue-500 dark:focus:border-blue-400 
                                    focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20
                                    focus:outline-none"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 dark:text-gray-400 
                                    hover:text-gray-700 dark:hover:text-gray-200 transition-colors bg-transparent border-none"
                                    onClick={() => setShowOpenaiApiKey(!showOpenaiApiKey)}
                                >
                                    {showOpenaiApiKey ? (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        {/* Base URL */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Server URL
                            </label>
                            <input
                                type="text"
                                value={openaiBaseUrl}
                                onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                                placeholder="https://api.openai.com/v1 or http://localhost:1234/v1 for LMStudio"
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-xs
                                bg-gray-50 dark:bg-gray-700 
                                text-gray-900 dark:text-white
                                placeholder-gray-500 dark:placeholder-gray-400
                                focus:border-blue-500 dark:focus:border-blue-400 
                                focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20
                                focus:outline-none"
                            />
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <div className="mb-1"><strong>� For LMStudio:</strong> http://localhost:1235/v1 (leave API key empty)</div>
                                <div className="mb-1"><strong>🌐 For OpenAI:</strong> https://api.openai.com/v1 (requires API key)</div>
                                <div><strong>⚙️ For Custom:</strong> Any OpenAI-compatible server URL</div>
                            </div>
                        </div>
                        
                        {/* Verify Button */}
                        <div className="flex items-center mb-2">
                            <button
                                onClick={handleVerifyOpenAiKey}
                                return (
                                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-[480px] max-h-[80vh] shadow-2xl overflow-y-auto">
                                            <h2 className="text-xl text-gray-900 dark:text-white font-semibold mb-6">Set API Key</h2>
                                            {/* ...existing email and copilot API key code... */}
                                            {/* Gemini Configuration */}
                                            <CollapsibleCard 
                                                title={<h3 className="text-sm text-gray-900 dark:text-white font-medium">Gemini Configuration (Public / Vertex AI)</h3>}
                                                className='mb-4'
                                            >
                                                <div className="mb-4">
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Gemini API Type</label>
                                                    <select
                                                        value={geminiApiType}
                                                        onChange={e => setGeminiApiType(e.target.value as 'public' | 'vertex')}
                                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    >
                                                        <option value="public">Public Gemini API</option>
                                                        <option value="vertex">Vertex AI (Google Cloud)</option>
                                                    </select>
                                                </div>
                                                {geminiApiType === 'public' && (
                                                    <div className="mb-4">
                                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Gemini API Key</label>
                                                        <input
                                                            type="password"
                                                            value={geminiApiKey}
                                                            onChange={e => setGeminiApiKey(e.target.value)}
                                                            placeholder="Enter your Gemini API key"
                                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                )}
                                                {geminiApiType === 'vertex' && (
                                                    <>
                                                    <div className="mb-4">
                                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Vertex Project ID</label>
                                                        <input
                                                            type="text"
                                                            value={vertexProject}
                                                            onChange={e => setVertexProject(e.target.value)}
                                                            placeholder="Enter your GCP Project ID"
                                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="mb-4">
                                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Vertex Region</label>
                                                        <input
                                                            type="text"
                                                            value={vertexRegion}
                                                            onChange={e => setVertexRegion(e.target.value)}
                                                            placeholder="uswest-1, us-central1, etc."
                                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                                        />
                                                    </div>
                                                    </>
                                                )}
                                            </CollapsibleCard>
                                            {/* ...existing LLM Configuration (OpenAI / LMStudio / Custom) code... */}
                                            {/* ...existing action buttons and modal code... */}
                                        </div>
                                    </div>
                                );
                                                        onChange={e => setVertexProject(e.target.value)}
                                                        placeholder="Enter your GCP Project ID"
                                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                                <div className="mb-4">
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Vertex Region</label>
                                                    <input
                                                        type="text"
                                                        value={vertexRegion}
                                                        onChange={e => setVertexRegion(e.target.value)}
                                                        placeholder="uswest-1, us-central1, etc."
                                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                                </>
                                            )}
                                        </CollapsibleCard>
                                        {/* LLM Configuration (OpenAI / LMStudio / Custom) */}
                                        ...existing code...