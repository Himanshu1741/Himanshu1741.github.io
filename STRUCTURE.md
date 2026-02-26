# Professional Folder Structure

This project is organized by layer and runtime boundary.

## Root
- `client/`: Next.js frontend app
- `server/`: Express + Socket.IO backend app
- `database/`: SQL schema and DB scripts

## Client
- `src/pages/`: Route-level pages (Next.js router)
- `src/components/common/`: Shared/reusable components (NotificationBell, NewUserGuide)
- `src/components/layout/`: Layout shell components (Navbar)
- `src/components/project/`: Project-domain UI blocks (TaskBoard, ChatBox, FileUpload, ProjectCopilot)
- `src/services/`: API client and socket layer
- `src/styles/`: Global styles and tokens
- `package.json` and build config files remain at `client/` root

## Server
- `src/server.js`: Backend entrypoint
- `src/config/`: DB and file-upload configuration
- `src/controllers/`: Request handlers and business logic grouped by domain
- `src/middleware/`: Auth and admin middleware
- `src/models/`: Sequelize ORM models
- `src/routes/`: API route definitions
- `src/services/`: Backend service modules (e.g. githubService)
- `scripts/`: Dev utility scripts (e.g. test-connection.js)
- `uploads/`: User-uploaded files
- `package.json` and env files remain at `server/` root

## Database
- `schema.sql`: Schema and manual SQL operations
