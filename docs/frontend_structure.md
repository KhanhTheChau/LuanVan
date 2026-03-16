# Frontend Architecture & Structure

This document outlines the React frontend structure and architectural decisions for the AI Plant Disease Detection system based on specifications (System/06 and System/07).

## 1. Directory Structure
```
frontend/src/
├── components/          # Reusable UI elements (Header, Footer, UploadBox, etc.)
├── context/             # Global React Contexts (AppContext for Predict pipeline)
├── layouts/             # Structural Page Wrappers (UserLayout, AdminLayout)
├── pages/               # Main application views/pages
│   ├── admin/           # Administrative pages (Dashboard, Dataset, Analyze, Unlearn)
│   ├── HomePage.jsx
│   ├── PredictPage.jsx  # Core Inference Page (combines components and context)
│   ├── GuidePage.jsx
│   ├── PolicyPage.jsx
│   ├── AboutPage.jsx
├── router/              # Contains the React Router wrapper configuring Routes
├── services/            # Axios API wrappers (api.js)
├── App.jsx              # Main React Root Component encapsulating Router/Context
└── main.jsx             # Original ReactDOM Entry Point
```

## 2. Layouts
The application uses two nested layout layers depending on the user's role:

- **UserLayout:** Wrap routes related to the public facing users (`/`, `/predict`, `/guide`, etc.). It includes a horizontal `Header` at the top, a centered main `Outlet` content area, and a `Footer` at the bottom.
- **AdminLayout:** Wraps routes related to the research center (`/admin/*`). It enforces a left-aligned vertical `Sidebar` for quick navigation between control panels and right-aligned main `Outlet`.

## 3. Global State Management
The system largely eschews cumbersome Global Variable definitions in favor of **React Context (`AppContext.jsx`)**. 
Particularly on the `PredictPage`, `AppContext` centrally holds:
- The preview URL of the uploaded image
- The JSON prediction result (label, confidence)
- The base-64 encoded Grad-CAM visualization image
This context allows sibling components (`UploadBox`, `PredictionCard`, `GradCAMViewer`) to seamlessly exchange prediction state without deep prop-drilling or messy root states.

## 4. Routing Hierarchy
The core routing tree located in `AppRouter.jsx` splits the application securely:

*   `/` -> `HomePage`
*   `/predict` -> `PredictPage`
*   `/guide` -> `GuidePage`
*   `/pol` -> `PolicyPage`
*   `/about` -> `AboutPage`
*   `/admin/dashboard` -> `DashboardPage`
*   `/admin/dataset` -> `DatasetPage`
*   `/admin/analyze` -> `AnalyzePage`
*   `/admin/unlearn` -> `UnlearnPage`

## 5. Development Details
The frontend leverages `Vite` for quick bundling, `Tailwindcss` for responsive clean layouts, and `Lucide React` for optimized modern iconography.
Axios forms the base communication layer with the backend Python Flask server over port `5000`.
