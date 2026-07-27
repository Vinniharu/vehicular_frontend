# Vehiculars Frontend

Vehiculars is a comprehensive vehicle management platform designed for the Nigerian market. It allows users to manage everything their car needs in one place, from document renewals to inspections and genuine spare parts. 

This repository contains the frontend Next.js application, which provides distinct portals for Customers, Staff, Agents, and Administrators.

## Overview

Vehiculars offers a seamless experience for:
- **Vehicle Particulars Renewal:** Full papers renewed and delivered.
- **Driver's Licence Processing:** Fresh applications, renewals, and reissues.
- **Number Plates:** Order and receive your plates at home.
- **Roadworthiness Express:** Certified in 48 hours without queues.
- **Tinted Permits:** Police-approved permits on your phone.
- **Pre-purchase Inspection:** Comprehensive 150-point check.
- **Spare Parts & Find a Technician:** Genuine parts and vetted mechanics.
- **Port Clearing:** Firm, all-in customs clearing quote.
- **DriveConnect Lessons:** Learn to drive with vetted instructors.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org) (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS (v4)
- **Icons:** Lucide React

## Project Structure

- `app/auth/` - Authentication flows (Login, Signup).
- `app/dashboard/` - Customer portal and wallet.
- `app/admin/` - Admin portal for system monitoring and management.
- `app/staff/` - Staff portal for application review and processing.
- `app/agent/` - Agent portal for handling service tasks and capturing.
- `app/components/` - Reusable UI components.
- `app/services/` - Landing pages for specific vehicular services.

## Getting Started

First, make sure you have the required `.env` variables configured for the backend API and other services (e.g., `NEXT_PUBLIC_API_URL`).

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Integration

This frontend communicates with the `vehicular_backend` (FastAPI). Refer to the `endpoints.md` file in the root of the repository for a complete reference of the verified REST API endpoints, roles, and status machines.

## State Machines & Roles

- **Customer:** Submits requests, pays for services, tracks progress, and manages their wallet (Monnify integration).
- **Staff:** Reviews applications (e.g., driver's licence fresh applications), enrolls in driving schools, and handles final reviews.
- **Agent:** Accepts routed offers, schedules capturing, uploads proof, and earns payouts via Monnify disbursements.
- **Admin:** Oversees metrics, manages staff and agents, and monitors transfers.
