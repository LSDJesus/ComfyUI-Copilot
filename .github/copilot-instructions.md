## Architecture & Major Components
- **Backend (`backend/`)**: Python (aiohttp, requests). Handles agent logic, workflow management, authentication, and model API integration. Key modules:
  - `controller/`: API endpoints for chat, workflow, expert, and model interactions.
  - `service/`: Implements agent logic (debugging, workflow rewriting, parameter tools).
  - `utils/`: Shared utilities (auth, logging, context loading, gateway integrations).
  - `dao/`: Database access for experts and workflows.
- **Frontend (`ui/`)**: React/TypeScript. Provides chat, workflow, and debug interfaces.
  - `src/components/chat/ApiKeyModal.tsx`: API key/provider selection logic.
  - `src/components/debug/`: Modular parameter debug interface (see below).
- **Debug Interface (`ui/src/components/debug/`)**:
  - Refactored for modularity: types, utilities, styles, screens, modals are separated for maintainability and reusability.
  - Use `ParameterDebugInterfaceV2.tsx` for new features; utilities in `utils/` are shared across components.

## Developer Workflows
- **Build Frontend**: Use Vite (`vite.config.ts`). Run `npm install` then `npm run build` in `ui/`.
- **Backend**: Python 3.10+. Install dependencies from `requirements.txt`. Start server via main entrypoint (see README for details).
- **Testing**: Python tests in root (e.g., `test_download_api.py`). Frontend tests (if present) are in `ui/src/`.
- **Debugging**: Use the debug interface in `ui/src/components/debug/` for parameter and workflow inspection.

## Project-Specific Patterns
- **System Prompt Context**: Backend loads system prompt context from `.txt`, `.md`, or `.json` files in `backend/config/`.
- **API Key Management**: No legacy Copilot key logic; use config-driven selection for Gemini, Vertex, ChatGPT.
- **Workflow Rewriting**: Agents can optimize workflows based on user descriptions (parameters, nodes, logic).
- **Streaming Responses**: Chat/model endpoints support streaming for real-time feedback.
- **Modular UI**: Debug interface is split into types, utilities, styles, screens, and modals for maintainability.

## Integration Points
- **External APIs**: Integrates with Google Gemini, Vertex, and OpenAI ChatGPT via backend config and credential logic.
- **Database**: Uses SQLite (`backend/data/`) for expert and workflow storage.
- **Assets**: Images and GIFs in `assets/` for UI and documentation.

## Key Files & Directories
- `backend/controller/llm_api.py`, `conversation_api.py`: Main backend endpoints.
- `backend/utils/auth_utils.py`: Credential and context loading logic.
- `ui/src/components/chat/ApiKeyModal.tsx`: Provider/model selection UI.
- `ui/src/components/debug/`: Parameter debug interface (see README).
- `requirements.txt`, `pyproject.toml`: Python dependencies.
- `ui/package.json`: Frontend dependencies.

## Example Patterns
- To add a new debug utility, place it in `ui/src/components/debug/utils/` and update exports in `index.ts`.
- To extend system prompt context, add a `.txt`, `.md`, or `.json` file to `backend/config/`.
- For new model providers, update `auth_utils.py` and the frontend modal logic.

---

_If any section is unclear or missing important details, please provide feedback so this guide can be improved._
