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

import { useEffect, useMemo, useState } from 'react';
import { fetchRsaPublicKey, verifyOpenAiApiKey } from '../../utils/crypto';
import Input from '../ui/Input';
import CollapsibleCard from '../ui/CollapsibleCard';
import { config } from '../../config';
import Modal from '../ui/Modal';
import { debounce } from 'lodash';
import useCountDown from '../../hooks/useCountDown';
import LoadingIcon from '../ui/Loading-icon';
import useLanguage from '../../hooks/useLanguage';
import StartLink from '../ui/StartLink';
interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string) => void;
    initialApiKey?: string;
    onConfigurationUpdated?: () => void;
}

const BASE_URL = config.apiBaseUrl

export function ApiKeyModal({ isOpen, onClose, onSave, initialApiKey = '', onConfigurationUpdated }: ApiKeyModalProps) {
    // Load Gemini config from localStorage on mount
    useEffect(() => {
        const savedType = localStorage.getItem('geminiApiType') as 'public' | 'vertex';
        const savedKey = localStorage.getItem('geminiApiKey') || '';
        const savedProject = localStorage.getItem('vertexProject') || '';
        const savedRegion = localStorage.getItem('vertexRegion') || 'uswest-1';
        if (savedType) setGeminiApiType(savedType);
        if (savedKey) setGeminiApiKey(savedKey);
        if (savedProject) setVertexProject(savedProject);
        if (savedRegion) setVertexRegion(savedRegion);
    }, []);
    // Gemini configuration
    const [geminiApiType, setGeminiApiType] = useState<'public' | 'vertex'>('public');
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [vertexProject, setVertexProject] = useState('');
    const [vertexRegion, setVertexRegion] = useState('uswest-1');
    const [apiKey, setApiKey] = useState(initialApiKey);
    const [email, setEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [modalOepn, setModalOpen] = useState(false)
    const [modalContent, setModalContent] = useState('');
    const { countDown, start } = useCountDown(60);
    const [loading, setLoading] = useState(false);
    
    // OpenAI configuration
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [openaiBaseUrl, setOpenaiBaseUrl] = useState('https://api.openai.com/v1');
    const [showOpenaiApiKey, setShowOpenaiApiKey] = useState(false);
    const [verifyingKey, setVerifyingKey] = useState(false);
    const [verificationResult, setVerificationResult] = useState<{success: boolean, message: string} | null>(null);
    const [rsaPublicKey, setRsaPublicKey] = useState<string | null>(null);

    const { apikeymodel_title } = useLanguage();

    useEffect(() => {
        setApiKey(initialApiKey);
        
        // Load OpenAI configuration from localStorage
        const savedOpenaiApiKey = localStorage.getItem('openaiApiKey');
        const savedOpenaiBaseUrl = localStorage.getItem('openaiBaseUrl');
        
        if (savedOpenaiApiKey) {
            setOpenaiApiKey(savedOpenaiApiKey);
        }
        
        if (savedOpenaiBaseUrl) {
            setOpenaiBaseUrl(savedOpenaiBaseUrl);
        }
        
        // Fetch RSA public key
        const fetchPublicKey = async () => {
            try {
                const savedPublicKey = localStorage.getItem('rsaPublicKey');
                if (savedPublicKey) {
                    setRsaPublicKey(savedPublicKey);
                } else {
                    const publicKey = await fetchRsaPublicKey();
                    setRsaPublicKey(publicKey);
                    localStorage.setItem('rsaPublicKey', publicKey);
                }
            } catch (error) {
                console.error('Failed to fetch RSA public key:', error);
            }
        };
        
        fetchPublicKey();
    }, [initialApiKey]);

    const handleVerifyOpenAiKey = async () => {
        // Check if it looks like LMStudio URL
        const isLMStudio = openaiBaseUrl.toLowerCase().includes('localhost') || 
                          openaiBaseUrl.toLowerCase().includes('127.0.0.1') ||
                          openaiBaseUrl.includes(':1234') ||
                          openaiBaseUrl.includes(':1235');
        
        if (!openaiApiKey.trim() && !isLMStudio) {
            setVerificationResult({
                success: false,
                message: 'Please enter an API key or use LMStudio URL (localhost:1234)'
            });
            return;
        }
        
        if (!rsaPublicKey && !isLMStudio) {
            setVerificationResult({
                success: false,
                message: 'RSA public key not available. Please try again later.'
            });
            return;
        }
        
        setVerifyingKey(true);
        setVerificationResult(null);
        
        try {
            const isValid = await verifyOpenAiApiKey(openaiApiKey, openaiBaseUrl);
            
            setVerificationResult({
                success: isValid,
                message: isValid ? 
                    (isLMStudio ? 'LMStudio connection successful!' : 'API key is valid!') : 
                    (isLMStudio ? 'LMStudio connection failed. Please check if LMStudio server is running.' : 'Invalid API key. Please check and try again.')
            });
        } catch (error) {
            setVerificationResult({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to verify connection'
            });
        } finally {
            setVerifyingKey(false);
        }
    };

    const checkEmailValid = useMemo(
        () => debounce((value: string) => {
            console.log('checkEmailValid', value);
            const reg = /^[\w.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            setIsEmailValid(reg.test(value));
        }, 500), 
        []
    );

    const handleSendEmail = async () => {
        if (!email || email === '' || !isEmailValid)
            return;
        setLoading(true);
        const username = email?.split('@')?.[0] || '';
        const response = await fetch(`${BASE_URL}/api/user/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email
            })
        });
        const data = await response.json();
        setLoading(false);
        setModalOpen(true)
        start();
        if (!!data?.data) {
            setModalContent('Send email successfully, please check your email');
        } else {
            setModalContent(data?.message || 'Send email failed');
        }
    }

    const handleSave = () => {
        // Save the main API key
        onSave(apiKey);
        // Save Gemini config
        localStorage.setItem('geminiApiType', geminiApiType);
        if (geminiApiType === 'public') {
            localStorage.setItem('geminiApiKey', geminiApiKey);
            localStorage.removeItem('vertexProject');
            localStorage.removeItem('vertexRegion');
        } else {
            localStorage.setItem('vertexProject', vertexProject);
            localStorage.setItem('vertexRegion', vertexRegion);
            localStorage.removeItem('geminiApiKey');
        }
        // OpenAI config
        const previousOpenaiApiKey = localStorage.getItem('openaiApiKey') || '';
        const previousOpenaiBaseUrl = localStorage.getItem('openaiBaseUrl') || 'https://api.openai.com/v1';
        const hasOpenaiConfigChanged = openaiApiKey.trim() !== previousOpenaiApiKey || openaiBaseUrl !== previousOpenaiBaseUrl;
        localStorage.setItem('openaiBaseUrl', openaiBaseUrl);
        if (openaiApiKey.trim()) {
            localStorage.setItem('openaiApiKey', openaiApiKey);
        } else {
            localStorage.removeItem('openaiApiKey');
        }
        if (hasOpenaiConfigChanged && onConfigurationUpdated) {
            onConfigurationUpdated();
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-[480px] max-h-[80vh] shadow-2xl overflow-y-auto">
                <h2 className="text-xl text-gray-900 dark:text-white font-semibold mb-6">Set API Key</h2>
                
                <div className="mb-6">
                    <div className='flex flex-row justify-between'>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                        </label>
                        <div className="text-sm text-red-600 dark:text-red-300">
                            <span>{(!!email && email !== ''&& !isEmailValid) ? 'Please enter a valid email' : ''}</span>
                        </div>
                    </div>
                    <div className="relative mb-4 flex flex-row gap-2">
                        <Input
                            value={email}
                            setValue={setEmail}
                            setIsValueValid={checkEmailValid}
                            placeholder="Enter your Email"
                            className='flex-1'
                        />
                        <button
                            onClick={handleSendEmail}
                            disabled={loading || !isEmailValid || countDown > 0}
                            className={`w-28 py-2.5 ${(!loading && isEmailValid && countDown === 0) ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white' : 
                                'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'} 
                            rounded-lg font-medium transition-colors flex justify-center items-center`}
                        >
                            {loading ? <LoadingIcon /> : (countDown > 0 ? `Resend in ${countDown}s` : 'Send')}
                        </button>
                    </div>
                    <div className="text-xs text-gray-600">
                        By clicking the "Send" button below and submitting your information to us, you agree to our&nbsp;
                        <a        
                            href="https://cdn.contract.alibaba.com/terms/privacy_policy_full/20250219145958852/20250219145958852.html?lng=en"
                            target="_blank"
                            rel="noopener noreferrer"
                            className='underline underline-offset-2'
                        >
                            Privacy Policy
                        </a> and&nbsp; 
                        <a
                            href="https://cdn.contract.alibaba.com/terms/c_end_product_protocol/20250219150239949/20250219150239949.html?lng=en"
                            target="_blank"
                            rel="noopener noreferrer"
                            className='underline underline-offset-2'
                        >
                            Terms of Use
                        </a>.
                    </div>
                </div>
                {/* Main API Key */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ComfyUI Copilot API Key
                    </label>
                    <div className="relative mb-4">
                        <Input
                            isPassword={true}
                            value={apiKey}
                            setValue={setApiKey}
                            placeholder="Enter your API key"
                            className='mb-4'
                        />
                    </div>
                    <StartLink className='flex justify-start items-end'>
                        {apikeymodel_title}
                        <svg viewBox="0 0 1024 1024" className="w-4 h-4" fill='currentColor'>
                            <path d="M498.894518 100.608396c-211.824383 0-409.482115 189.041494-409.482115 422.192601 0 186.567139 127.312594 344.783581 295.065226 400.602887 21.13025 3.916193 32.039717-9.17701 32.039717-20.307512 0-10.101055 1.176802-43.343157 1.019213-78.596056-117.448946 25.564235-141.394311-49.835012-141.394311-49.835012-19.225877-48.805566-46.503127-61.793368-46.503127-61.793368-38.293141-26.233478 3.13848-25.611308 3.13848-25.611308 42.361807 2.933819 64.779376 43.443441 64.779376 43.443441 37.669948 64.574714 98.842169 45.865607 122.912377 35.094286 3.815909-27.262924 14.764262-45.918819 26.823925-56.431244-93.796246-10.665921-192.323237-46.90017-192.323237-208.673623 0-46.071292 16.498766-83.747379 43.449581-113.332185-4.379751-10.665921-18.805298-53.544497 4.076852-111.732757 0 0 35.46063-11.336186 116.16265 43.296085 33.653471-9.330506 69.783343-14.022365 105.654318-14.174837 35.869952 0.153496 72.046896 4.844332 105.753579 14.174837 80.606853-54.631248 116.00813-43.296085 116.00813-43.296085 22.935362 58.18826 8.559956 101.120049 4.180206 111.732757 27.052123 29.584806 43.443441 67.260893 43.443441 113.332185 0 162.137751-98.798167 197.850114-192.799074 208.262254 15.151072 13.088086 28.65155 38.804794 28.65155 78.17957 0 56.484456-0.459464 101.94381-0.459464 115.854635 0 11.235902 7.573489 24.381293 29.014824 20.2543C825.753867 867.330798 933.822165 709.10924 933.822165 522.700713c0-233.155201-224.12657-422.192601-434.927647-422.192601L498.894518 100.608396z">
                            </path>
                        </svg>
                    </StartLink>
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