'''
Author: ai-business-hql qingli.hql@alibaba-inc.com
Date: 2025-07-14 16:46:20
LastEditors: ai-business-hql qingli.hql@alibaba-inc.com
LastEditTime: 2025-08-11 16:08:07
FilePath: /comfyui_copilot/backend/controller/llm_api.py
Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
'''
# Copyright (C) 2025 AIDC-AI
# Licensed under the MIT License.

import json
from typing import List, Dict, Any
from aiohttp import web
from ..utils.globals import LLM_DEFAULT_BASE_URL, LMSTUDIO_DEFAULT_BASE_URL, is_lmstudio_url
import server
import requests
from ..utils.logger import log


@server.PromptServer.instance.routes.get("/api/model_config")
async def list_models(request):
    """
    List available LLM models
    
    Returns:
        JSON response with models list in the format expected by frontend:
        {
            "models": [
                {"name": "model_name", "image_enable": boolean},
                ...
            ]
        }
    """
    try:
        log.info("Received list_models request")
        # Gather config from headers
        config = {
            'provider': request.headers.get('Provider', 'gemini'),
            'model': request.headers.get('Model', 'gemini-2.5-pro'),
            'vertexServiceAccountPath': request.headers.get('Vertex-Service-Account-Path', ''),
            'vertexProject': request.headers.get('Vertex-Project', ''),
            'vertexRegion': request.headers.get('Vertex-Region', ''),
            'geminiApiKey': request.headers.get('Gemini-Api-Key', ''),
            'gptApiKey': request.headers.get('Gpt-Api-Key', ''),
            'openaiBaseUrl': request.headers.get('Openai-Base-Url', LLM_DEFAULT_BASE_URL)
        }
        provider = config['provider']
        model = config['model']
        from ..utils.auth_utils import get_model_api_credentials
        creds_result = get_model_api_credentials(provider, model, config)
        if creds_result['error']:
            log.error(f"Model credential error: {creds_result['error']}")
            return web.json_response({"error": creds_result['error']}, status=400)

        llm_config = []
        # Gemini/Vertex logic
        if provider in ['gemini', 'vertex'] and model.startswith('gemini'):
            if 'vertex_json' in creds_result['credentials']:
                # Use Vertex AI endpoint and service account
                from ..utils.vertex_auth import get_vertex_access_token
                access_token = get_vertex_access_token(creds_result['credentials']['vertex_json'])
                endpoint = f"https://{creds_result['credentials']['vertex_region']}-aiplatform.googleapis.com/v1/projects/{creds_result['credentials']['vertex_project']}/locations/{creds_result['credentials']['vertex_region']}/publishers/google/models"
                headers = {"Authorization": f"Bearer {access_token}"}
                response = requests.get(endpoint, headers=headers)
                if response.status_code == 200:
                    models = response.json()
                    for m in models.get('models', []):
                        model_id = m['name'].split('/')[-1]
                        llm_config.append({
                            "label": model_id,
                            "name": model_id,
                            "image_enable": True
                        })
                    llm_config.append({
                        "label": "gemini-2.0-flash",
                        "name": "gemini-2.0-flash",
                        "image_enable": True
                    })
                else:
                    return web.json_response({"error": f"Vertex API error: {response.text}"}, status=500)
            elif 'gemini_key' in creds_result['credentials']:
                endpoint = "https://generativelanguage.googleapis.com/v1beta/models"
                params = {"key": creds_result['credentials']['gemini_key']}
                response = requests.get(endpoint, params=params)
                if response.status_code == 200:
                    models = response.json()
                    for m in models.get('models', []):
                        llm_config.append({
                            "label": m['name'],
                            "name": m['name'],
                            "image_enable": True
                        })
                    llm_config.append({
                        "label": "gemini-2.0-flash",
                        "name": "gemini-2.0-flash",
                        "image_enable": True
                    })
                else:
                    return web.json_response({"error": f"Gemini API error: {response.text}"}, status=500)
        elif provider == 'chatgpt' and model.startswith('gpt'):
            # Use OpenAI API
            openai_api_key = creds_result['credentials']['gpt_key']
            openai_base_url = config['openaiBaseUrl']
            request_url = f"{openai_base_url}/models"
            headers = {"Authorization": f"Bearer {openai_api_key}"}
            response = requests.get(request_url, headers=headers)
            if response.status_code == 200:
                models = response.json()
                for m in models.get('data', []):
                    llm_config.append({
                        "label": m['id'],
                        "name": m['id'],
                        "image_enable": True
                    })
            else:
                return web.json_response({"error": f"OpenAI API error: {response.text}"}, status=500)
        else:
            return web.json_response({"error": "Invalid provider/model selection"}, status=400)

        return web.json_response({"models": llm_config})
    except Exception as e:
        log.error(f"Error in list_models: {str(e)}")
        return web.json_response({"error": f"Failed to list models: {str(e)}"}, status=500)


@server.PromptServer.instance.routes.get("/verify_openai_key")
async def verify_openai_key(req):
    """
    Verify if an OpenAI API key is valid by calling the OpenAI models endpoint
    Also supports LMStudio verification (which may not require an API key)
    
    Returns:
        JSON response with success status and message
    """
    try:
        openai_api_key = req.headers.get('Openai-Api-Key')
        openai_base_url = req.headers.get('Openai-Base-Url', 'https://api.openai.com/v1')
        
        # Check if this is LMStudio
        is_lmstudio = is_lmstudio_url(openai_base_url)
        
        # For LMStudio, API key might not be required
        if not openai_api_key and not is_lmstudio:
            return web.json_response({
                "success": False, 
                "message": "No API key provided"
            })
        
        # Use a direct HTTP request instead of the OpenAI client
        # This gives us more control over the request method and error handling
        headers = {}
        if not is_lmstudio or (is_lmstudio and openai_api_key):
            # Include Authorization header for OpenAI API or LMStudio with API key
            headers["Authorization"] = f"Bearer {openai_api_key}"
        
        # Make a simple GET request to the models endpoint
        response = requests.get(f"{openai_base_url}/models", headers=headers)
        
        # Check if the request was successful
        if response.status_code == 200:
            success_message = "API key is valid" if not is_lmstudio else "LMStudio connection successful"
            return web.json_response({
                "success": True, 
                "data": True, 
                "message": success_message
            })
        else:
            log.error(f"API validation failed with status code: {response.status_code}")
            error_message = f"Invalid API key: HTTP {response.status_code} - {response.text}"
            if is_lmstudio:
                error_message = f"LMStudio connection failed: HTTP {response.status_code} - {response.text}"
            return web.json_response({
                "success": False, 
                "data": False,
                "message": error_message
            })
            
    except Exception as e:
        log.error(f"Error verifying API key/connection: {str(e)}")
        error_message = f"Invalid API key: {str(e)}"
        if 'base_url' in locals() and is_lmstudio_url(locals().get('openai_base_url', '')):
            error_message = f"LMStudio connection error: {str(e)}"
        return web.json_response({
            "success": False, 
            "data": False, 
            "message": error_message
        })