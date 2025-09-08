import os

def get_system_prompt_with_context(base_prompt: str) -> str:
    """
    Loads additional context from system_prompt_context.txt and appends to the base system prompt.
    Returns the merged prompt string.
    """
    config_dir = os.path.join(os.path.dirname(__file__), '../config')
    context_parts = []
    for ext in ('.txt', '.md', '.json'):
        for fname in os.listdir(config_dir):
            if fname.startswith('system_prompt_context') and fname.endswith(ext):
                fpath = os.path.join(config_dir, fname)
                try:
                    with open(fpath, 'r', encoding='utf-8') as f:
                        content = f.read().strip()
                        if ext == '.json' and content:
                            import json
                            try:
                                json_obj = json.loads(content)
                                # If JSON is a dict or list, join all values as context
                                if isinstance(json_obj, dict):
                                    context_parts.append('\n'.join(str(v) for v in json_obj.values()))
                                elif isinstance(json_obj, list):
                                    context_parts.append('\n'.join(str(v) for v in json_obj))
                                else:
                                    context_parts.append(str(json_obj))
                            except Exception:
                                context_parts.append(content)
                        else:
                            context_parts.append(content)
                except Exception:
                    continue
    extra_context = '\n\n'.join([part for part in context_parts if part])
    if extra_context:
        return base_prompt + '\n\n' + extra_context
    else:
        return base_prompt
# Utility to get credentials for selected model/provider
def get_model_api_credentials(provider: str, model: str, config: dict) -> dict:
    """
    Returns credentials for the selected provider/model, with fallback logic:
    - For Gemini models: try Vertex JSON, then Gemini key, else error
    - For GPT models: use GPT API key, else error
    Args:
        provider: 'gemini', 'vertex', or 'chatgpt'
        model: model name string
        config: dict containing keys from frontend/localStorage
    Returns:
        dict with 'type', 'credentials', and 'error' (if any)
    """
    result = {'type': provider, 'credentials': None, 'error': None}
    if provider in ['gemini', 'vertex'] and model.startswith('gemini'):
        # Try Vertex JSON first
        vertex_json = config.get('vertexServiceAccountPath')
        if vertex_json:
            result['credentials'] = {'vertex_json': vertex_json,
                                     'vertex_project': config.get('vertexProject'),
                                     'vertex_region': config.get('vertexRegion')}
            return result
        # Fallback to Gemini API key
        gemini_key = config.get('geminiApiKey')
        if gemini_key:
            result['credentials'] = {'gemini_key': gemini_key}
            return result
        result['error'] = 'No API key loaded for Gemini (Vertex JSON or Gemini API key required)'
        return result
    elif provider == 'chatgpt' and model.startswith('gpt'):
        gpt_key = config.get('gptApiKey')
        if gpt_key:
            result['credentials'] = {'gpt_key': gpt_key}
            return result
        result['error'] = 'No API key loaded for ChatGPT (OpenAI API key required)'
        return result
    else:
        result['error'] = 'Invalid provider/model selection'
        return result
# Copyright (C) 2025 AIDC-AI
# Licensed under the MIT License.

"""
Authentication utilities for ComfyUI Copilot
"""

from typing import Optional
## Removed ComfyUI Copilot API key logic. Only Gemini, Vertex, and ChatGPT keys are supported now.
