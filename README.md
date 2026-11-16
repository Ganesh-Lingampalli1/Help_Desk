# Help Desk Ticket Management System

An enterprise-grade, full-stack IT Support & Help Desk platform built with **Flask**, **MySQL / SQLAlchemy**, **React (Vite)**, and **Tailwind CSS**. Designed with a clean, high-contrast white aesthetic, strict server-side Role-Based Access Control (RBAC), configurable SLA deadlines, file attachment protection, audit logging, and real-time operational analytics.

---

## Table of Contents
1. [Key Features](#key-features)
2. [Technology Stack](#technology-stack)
3. [Architecture & Workflow](#architecture--workflow)
4. [Database Schema & Models](#database-schema--models)
5. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
6. [SLA Target Engine](#sla-target-engine)
7. [Getting Started (Windows PowerShell)](#getting-started-windows-powershell)
   - [Prerequisites](#prerequisites)
   - [Backend Setup](#1-backend-setup)
   - [Database Setup & Migrations](#2-database-setup--migrations)
   - [Demo Data & Admin Creation](#3-demo-data--admin-creation)
   - [Frontend Setup](#4-frontend-setup)
8. [Pre-configured Demo Accounts](#pre-configured-demo-accounts)
9. [REST API Documentation](#rest-api-documentation)
10. [Automated Testing (Pytest)](#automated-testing-pytest)
11. [Docker Deployment](#docker-deployment)
12. [Troubleshooting Guide](#troubleshooting-guide)

---

## Key Features

- **Strict Server-Side RBAC**: Three distinct user roles (`employee`, `agent`, `admin`) enforced at the API controller layer with custom Python decorators.
- **Audited Ticket Lifecycle**: Complete state machine tracking transitions (`Open` &rarr; `Assigned` &rarr; `In Progress` &rarr; `Pending` &rarr; `Resolved` &rarr; `Closed`) with mandatory resolution notes and immutable history logs.
- **Private Internal Notes**: Agents and Administrators can leave private internal notes on tickets that are cryptographically isolated and invisible to employees.
- **Automated SLA Engine**: Dynamic resolution deadlines calculated based on ticket priority (Critical: 4h, High: 8h, Medium: 24h, Low: 48h) with visual overdue flags.
- **Secure File Storage**: Upload support for screenshots and diagnostic logs (PNG, JPG, PDF, DOCX, TXT, ZIP up to 5MB) stored with randomized UUIDs and IDOR authorization checks.
- **In-App Notification Feed**: Live notifications on ticket assignments, status updates, new comments, and SLA breaches.
- **Real-Time Analytics & Reporting**: Interactive Recharts dashboards showing 7-day creation trends, category distribution, status breakdowns, and agent resolution throughput.
- **Clean Enterprise White UI**: Tailored white layout with subtle borders, restrained blue accents, responsive navigation, and Lucide React icons (no dark theme).

---

## Technology Stack

### Backend
- **Language**: Python 3.11+ / 3.12
- **Framework**: Flask (Application Factory Pattern)
- **ORM**: Flask-SQLAlchemy 3.x
- **Authentication**: Flask-JWT-Extended
- **Database**: MySQL 8.0 (with zero-config SQLite development fallback)
- **Migrations**: Flask-Migrate (Alembic)
- **Password Security**: Werkzeug PBKDF2-SHA256 password hashing
- **Rate Limiting**: Flask-Limiter
- **CORS**: Flask-CORS
- **Testing**: Pytest (24 unit/integration tests with 100% pass rate)

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS v3 (Enterprise White Theme)
- **Routing**: React Router v6
- **HTTP Client**: Axios with global JWT interceptors
- **Icons**: Lucide React
- **Visualizations**: Recharts (Line, Bar, Pie charts)
- **Notifications**: React Hot Toast

### DevOps
- Docker & Docker Compose (Multi-container orchestration for MySQL, Flask, and Nginx)

---

## Architecture & Workflow

```
+-----------------------------------------------------------------------+
|                           React Vite Frontend                         |
|  (Clean White Theme / Tailwind CSS / Recharts / Context Providers)    |
+-----------------------------------------------------------------------+
                                   |
                             Axios (JWT)
                                   v
+-----------------------------------------------------------------------+
|                            Flask REST API                             |
|  /api/v1/auth | /api/v1/tickets | /api/v1/comments | /api/v1/admin    |
+-----------------------------------------------------------------------+
        |                 |                   |                |
   Auth Decorator   SLA Engine         File Handler       Stats Service
   (@role_required) (TicketService)    (Safe UUID MIME)   (DB Metrics)
        \                 |                   |                /
         v                v                   v               v
+-----------------------------------------------------------------------+
|                        Flask-SQLAlchemy Models                        |
|   User | Ticket | Comment | Attachment | TicketHistory | Notification |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    Database (MySQL 8.0 / SQLite)                      |
+-----------------------------------------------------------------------+
```

### Ticket State Machine
```
[ Open ] ------(Assign)------> [ Assigned ]
   |                                |
(Start Work)                   (Start Work)
   |                                |
   v                                v
+---------------------------------------+
|             In Progress               | <-----+
+---------------------------------------+       |
   |                  |                         |
(Wait Info)      (Resolve)                  (Reopen)
   |                  |                         |
   v                  v                         |
[ Pending ]     [ Resolved ] -------------------+
                      |
                   (Close)
                      |
                      v
                  [ Closed ]
```

---

## Database Schema & Models

```mermaid
erDiagram
    User ||--o{ Ticket : creates
    User ||--o{ Ticket : assigned_to
    User ||--o{ Comment : writes
    User ||--o{ Attachment : uploads
    User ||--o{ TicketHistory : changes
    User ||--o{ Notification : receives
    Ticket ||--o{ Comment : contains
    Ticket ||--o{ Attachment : includes
    Ticket ||--o{ TicketHistory : logs
    Ticket ||--o{ Notification : triggers

    User {
        int id PK
        string email UK
        string full_name
        string password_hash
        string role "employee | agent | admin"
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    Ticket {
        int id PK
        string ticket_number UK
        string title
        text description
        string category "Hardware | Software | Network | Account Access | Other"
        string priority "Low | Medium | High | Critical"
        string status "Open | Assigned | In Progress | Pending | Resolved | Closed"
        int created_by FK
        int assigned_to FK
        text resolution_notes
        datetime due_at
        datetime resolved_at
        datetime closed_at
        datetime created_at
        datetime updated_at
    }

    Comment {
        int id PK
        int ticket_id FK
        int user_id FK
        text message
        boolean is_internal
        datetime created_at
    }

    Attachment {
        int id PK
        int ticket_id FK
        int uploaded_by FK
        string original_filename
        string stored_filename
        string content_type
        int file_size
        datetime created_at
    }

    TicketHistory {
        int id PK
        int ticket_id FK
        int changed_by FK
        string old_status
        string new_status
        text description
        datetime created_at
    }

    Notification {
        int id PK
        int user_id FK
        int ticket_id FK
        string message
        boolean is_read
        datetime created_at
    }
```

---

## Role-Based Access Control (RBAC)

| Feature / Action | Employee | Support Agent | Administrator |
|---|:---:|:---:|:---:|
| Self-Registration (public) | Yes (forced `employee`) | No | No |
| Create Ticket & Attach Files | Yes | Yes | Yes |
| View Own Tickets | Yes | Yes | Yes |
| View Other Employees' Tickets | **No (IDOR protected)** | Yes | Yes |
| Claim Unassigned Tickets | No | Yes | Yes |
| Reassign Tickets to Any Agent | No | No | Yes |
| Update Status & Priority | Limited (Reopen only) | Yes | Yes |
| Resolve Ticket (with notes) | No | Yes | Yes |
| Post Public Comments | Yes | Yes | Yes |
| Post Private Internal Notes | **No** | Yes | Yes |
| View Private Internal Notes | **No (Hidden by backend)**| Yes | Yes |
| View Ticket History / Audit Log | Yes | Yes | Yes |
| Manage Users (Create/Edit/Deactivate)| No | No | Yes |
| View Analytics & SLA Reports | No | No | Yes |
| System Settings & Configuration | No | No | Yes |

---

## SLA Target Engine

Every ticket automatically calculates its target resolution timestamp (`due_at`) upon creation or priority adjustment:

| Priority Level | SLA Window | Description / Impact |
|---|:---:|---|
| **Critical** | **4 Hours** | Production outage, security breach, total service failure |
| **High** | **8 Hours** | Severely degraded functionality with no immediate workaround |
| **Medium** | **24 Hours** | Standard operational issue with reasonable workaround |
| **Low** | **48 Hours** | General technical inquiry, cosmetic fix, routine account setup |

The application automatically checks SLA deadlines and flags breached or pending tickets in both the agent and administrator dashboards.

---

## Getting Started (Windows PowerShell)

### Prerequisites
- Python 3.11 or 3.12 installed (`python --version`)
- Node.js 18+ and npm installed (`node -v`)
- MySQL 8.0 Server (Optional: if MySQL is not installed, the application automatically uses SQLite without any configuration)

---

### 1. Backend Setup

Open a Windows PowerShell terminal in the project directory:

```powershell
# Navigate to the backend folder
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip and install all required packages
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
```

#### Optional: Configure MySQL in `backend/.env`
If using MySQL, configure the database connection string:
```ini
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=helpdesk_db
DATABASE_URL=mysql+pymysql://root:your_password@127.0.0.1:3306/helpdesk_db
```
> **Note**: If `DB_PASSWORD` is blank or MySQL is not running, the application will automatically initialize a local SQLite database at `backend/instance/helpdesk.db` for instant development.

---

### 2. Database Setup & Migrations

Initialize the database schema using Flask CLI commands:

```powershell
# Initialize tables directly
python run.py init-db

# Or run Alembic database migrations
flask --app run.py db upgrade
```

---

### 3. Demo Data & Admin Creation

Seed realistic demonstration accounts, tickets, comments, internal notes, and audit history:

```powershell
# Seed complete demo data
python run.py seed-data

# Or manually provision an administrator account:
python run.py create-admin --name "System Administrator" --email "admin@company.com" --password "Admin@123456"
```

Start the Flask backend server:
```powershell
python run.py
```
*Backend will be running on `http://127.0.0.1:5000`.*

---

### 4. Frontend Setup

Open a **second** Windows PowerShell terminal:

```powershell
# Navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Run Vite development server
npm run dev
```
*Frontend will be running on `http://127.0.0.1:5173`.*

---

## Pre-configured Demo Accounts

The `seed-data` command provisions the following test accounts:

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@helpdesk.com` | `Admin@123456` | Full platform access, user management, reassignments, analytics |
| **Support Agent** | `agent.sarah@helpdesk.com` | `Agent@123456` | Queue claim, ticket resolution, private internal notes |
| **Employee** | `employee.david@company.com` | `Employee@123456` | Submit tickets, attach files, track progress |

> **Pro-Tip**: The login page (`/login`) includes **1-Click Demo Buttons** that instantly auto-fill credentials for each role for quick testing.

---

## REST API Documentation

All API endpoints are versioned under `/api/v1`.

### Authentication Endpoints (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|:---:|---|
| `POST` | `/auth/register` | Public | Register new employee account (rate limited: 5/min) |
| `POST` | `/auth/login` | Public | Authenticate user & return JWT token (rate limited: 5/min) |
| `POST` | `/auth/logout` | Authenticated | Invalidate client session |
| `GET` | `/auth/me` | Authenticated | Retrieve profile of currently authenticated user |
| `PATCH`| `/auth/change-password` | Authenticated | Change user account password |

### Ticket Endpoints (`/api/v1/tickets`)
| Method | Endpoint | Access | Description |
|---|---|:---:|---|
| `POST` | `/tickets` | Authenticated | Create a new support ticket |
| `GET` | `/tickets` | Authenticated | List tickets (filtered by role; supports search, sort, pagination)|
| `GET` | `/tickets/<id>` | Authenticated | View ticket details (IDOR protected for employees) |
| `PATCH`| `/tickets/<id>` | Staff/Admin | Update ticket metadata (category, priority) |
| `PATCH`| `/tickets/<id>/status` | Staff/Admin/Owner | Transition status (`In Progress`, `Pending`, `Resolved`, `Closed`, `Reopen`) |
| `POST` | `/tickets/<id>/assign` | Staff/Admin | Assign ticket to an agent or claim unassigned |
| `GET` | `/tickets/stats` | Authenticated | Real-time counts for open, assigned, in-progress, resolved |
| `GET` | `/tickets/<id>/history` | Authenticated | View immutable status audit trail |

### Comments & Attachments
| Method | Endpoint | Access | Description |
|---|---|:---:|---|
| `GET` | `/tickets/<id>/comments` | Authenticated | Get comment thread (internal notes hidden from employees) |
| `POST` | `/tickets/<id>/comments` | Authenticated | Post public comment or private internal note (`agent`/`admin` only) |
| `POST` | `/tickets/<id>/attachments` | Authenticated | Upload screenshot or diagnostic file (max 5MB) |
| `GET` | `/tickets/<id>/attachments/<att_id>/download`| Authenticated | Secure file download with token validation |

### Administration & Analytics (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
|---|---|:---:|---|
| `GET` | `/admin/dashboard` | Admin | High-level KPIs, user metrics, category/status breakdown |
| `GET` | `/admin/analytics` | Admin | 7-day trend, SLA compliance %, overdue count, agent throughput |
| `GET` | `/admin/users` | Admin | List user accounts with role & active status filters |
| `POST` | `/admin/users` | Admin | Provision a new user account (employee, agent, or admin) |
| `PATCH`| `/admin/users/<id>` | Admin | Update user details, role, or toggle active status (soft-delete) |
| `GET` | `/admin/agents` | Admin | Retrieve list of active agents for assignment dropdowns |

---

## Automated Testing (Pytest)

The test suite runs against an isolated, in-memory SQLite database without modifying production data.

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pytest -v
```

### Test Suite Results (24 Passed / 0 Failures)
- `tests/test_auth.py`:
  - `test_user_registration_success` [PASSED]
  - `test_public_registration_cannot_escalate_role` [PASSED]
  - `test_registration_duplicate_email` [PASSED]
  - `test_login_success` [PASSED]
  - `test_login_invalid_credentials` [PASSED]
  - `test_login_deactivated_user` [PASSED]
  - `test_get_current_user_profile` [PASSED]
  - `test_change_password` [PASSED]
- `tests/test_tickets.py`:
  - `test_create_ticket_success` [PASSED]
  - `test_ticket_ownership_isolation` [PASSED]
  - `test_agent_and_admin_can_view_all_tickets` [PASSED]
  - `test_ticket_assignment_workflow` [PASSED]
  - `test_ticket_status_transitions_and_resolution_notes` [PASSED]
- `tests/test_comments_and_notes.py`:
  - `test_internal_notes_isolation_for_employees` [PASSED]
  - `test_employee_cannot_create_internal_note` [PASSED]
- `tests/test_attachments.py`:
  - `test_upload_valid_attachment` [PASSED]
  - `test_upload_disallowed_file_extension` [PASSED]
  - `test_attachment_idor_protection` [PASSED]
- `tests/test_admin.py`:
  - `test_admin_dashboard_metrics` [PASSED]
  - `test_admin_user_management_crud` [PASSED]
  - `test_admin_analytics_endpoint` [PASSED]
  - `test_non_admin_forbidden_on_admin_routes` [PASSED]
- `tests/test_sla_and_notifications.py`:
  - `test_sla_calculation_on_ticket_creation` [PASSED]
  - `test_notifications_workflow` [PASSED]

---

## Docker Deployment

To launch the full stack (MySQL 8.0, Flask Gunicorn API, and React Nginx SPA) in containerized mode:

```bash
# Build and start all services in detached mode
docker-compose up --build -d

# Check running containers
docker-compose ps

# Run database migrations inside the backend container
docker-compose exec backend flask db upgrade

# Seed demo data inside the container
docker-compose exec backend python run.py seed-data

# View logs
docker-compose logs -f
```

- **Frontend**: `http://localhost`
- **Backend API**: `http://localhost:5000`
- **MySQL Port**: `localhost:3306`

To shut down the containers:
```bash
docker-compose down -v
```

---

## Troubleshooting Guide

### 1. `Cannot connect to MySQL database on port 3306`
- **Solution**: The application includes automatic fallback to SQLite. If MySQL is not running or no password is provided in `.env`, it automatically writes to `backend/instance/helpdesk.db` without throwing connection errors. To force MySQL, verify MySQL service is running and update `DATABASE_URL` in `backend/.env`.

### 2. `Execution of scripts is disabled on this system (PowerShell)`
- **Solution**: Run PowerShell as Administrator and execute:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### 3. `CORS Error or 401 Unauthorized in frontend`
- **Solution**: In development mode, Vite's dev server automatically proxies `/api` requests to `http://127.0.0.1:5000`. Ensure the backend server is running on port 5000. Verify the token exists in `localStorage`.

### 4. `Uploaded files return 404 or access denied`
- **Solution**: Uploaded files are stored in `backend/uploads/` with randomized UUID keys. Ensure the user accessing the download link is either the ticket creator, the assigned support agent, or an administrator.

---

## License
MIT License. Built for enterprise IT support and ticket management.
