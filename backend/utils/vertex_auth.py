# Copyright (C) 2025 AIDC-AI
# Licensed under the MIT License.

"""
Google Service Account Auth Utility for Vertex AI Gemini
"""
import json
import os
import google.auth
from google.oauth2 import service_account
import google.auth.transport.requests

SERVICE_ACCOUNT_PATH = os.path.join(os.path.dirname(__file__), '../assets/gen-lang-client-0514922099-be4d31210a1b.json')
VERTEX_SCOPE = ["https://www.googleapis.com/auth/cloud-platform"]

def get_vertex_access_token(service_account_path=None):
    """
    Load service account JSON and return an OAuth2 access token for Vertex AI
    Args:
        service_account_path: Optional path to service account JSON file
    """
    path = service_account_path or SERVICE_ACCOUNT_PATH
    credentials = service_account.Credentials.from_service_account_file(
        path,
        scopes=VERTEX_SCOPE
    )
    auth_req = google.auth.transport.requests.Request()
    credentials.refresh(auth_req)
    return credentials.token
