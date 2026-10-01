# Contributing to ResQDrive

Thank you for your interest in contributing to the ResQDrive Roadside Assistance platform.

## Development Workflow

1. **Fork and Clone**: Clone the repository to your local development environment.
2. **Branching**: Create a feature branch with a descriptive name:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Environment Setup**:
   - Ensure a MongoDB instance is running locally or configure `backend/.env` with your MongoDB Atlas connection string.
   - Run `npm install` inside both `backend` and `frontend` directories.
   - Run `node seed.js` in the `backend` directory to initialize standard test records.

## Coding Standards

- **Backend**:
  - Keep controllers focused strictly on request validation, calling models, and formatting JSON responses.
  - Keep models modular with schema-level validation and hooks.
  - Always verify authorization via middleware (`authMiddleware`, `roleMiddleware`, `ownershipMiddleware`) before accessing resources.
  - Return clear, standard HTTP response status codes:
    - `200 OK` for successful fetches and updates
    - `201 Created` for resource creations
    - `400 Bad Request` for invalid payloads or failed schema validations
    - `401 Unauthorized` for missing or invalid JWT tokens
    - `403 Forbidden` for role or ownership violations
    - `404 Not Found` for non-existent entities
    - `500 Internal Server Error` for unhandled exceptions

- **Frontend**:
  - Maintain the existing dark UI styling tokens defined in `frontend/src/index.css`.
  - Use semantic HTML elements and accessible form labels.
  - Keep API communications abstracted inside `frontend/src/api.js`.

## Pull Request Guidelines

- Ensure both the backend and frontend run without syntax errors:
  ```bash
  cd frontend && npm run build
  cd ../backend && node server.js
  ```
- Update documentation in `README.md` if new endpoints or schemas are introduced.
- Submit PRs targeting the `main` branch with a clear summary of your changes.

---

Maintained by **Prathamesh More**.
