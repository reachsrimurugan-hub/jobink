# System Architecture - WorkLink / Jobink

This document presents the cleaned system architecture diagram and workflow for the **WorkLink (Jobink)** hyperlocal part-time job marketplace. All detailed component responsibilities have been removed to provide a clean, high-level structural overview.

---

## 1. Interactive Mermaid Diagram

Below is the clean architecture diagram representing the layered structure, external integrations, and database collections:

```mermaid
graph TD
    %% Styling definitions
    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1,font-weight:bold;
    classDef frontend fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#047857,font-weight:bold;
    classDef backend fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#c2410c,font-weight:bold;
    classDef database fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px,color:#6d28d9,font-weight:bold;
    classDef external fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#be123c,font-weight:bold;
    classDef workflow fill:#f8fafc,stroke:#64748b,stroke-width:1.5px,color:#334155;

    %% Layers
    subgraph Client_Layer ["CLIENT LAYER"]
        Worker["Worker (Mobile/Web App)"]:::client
        Employer["Employer (Mobile/Web App)"]:::client
        Admin["Admin Dashboard (Web)"]:::client
    end

    subgraph Frontend_Layer ["FRONTEND LAYER"]
        FE_Tech["React.js, Vite, Tailwind CSS,<br>React Router, Progressive Web App (PWA)"]:::frontend
    end

    subgraph Backend_Layer ["BACKEND / SERVICE LAYER"]
        subgraph Business_Logic ["Business Logic Layer"]
            FirebaseAuth["Firebase Authentication (Phone OTP)"]:::backend
            FirebaseFCM["Firebase Cloud Messaging"]:::backend
            GeoapifyAPI["Geoapify Places API (Location Search)"]:::backend
        end
    end

    subgraph Database_Layer ["DATABASE LAYER (Cloud Firestore)"]
        Users[("Users")]:::database
        Jobs[("Jobs")]:::database
        Applications[("Applications")]:::database
        Notifications[("Notifications")]:::database
        Reviews[("Reviews")]:::database
        Skills[("Skills")]:::database
    end

    subgraph External_Services ["EXTERNAL SERVICES"]
        GeoapifyService["Geoapify Places API"]:::external
        FCMService["Firebase Cloud Messaging (FCM)"]:::external
        PushService["Browser Push Notification Service"]:::external
    end

    %% Relationships / Flow
    Worker <--> |HTTPS| FE_Tech
    Employer <--> |HTTPS| FE_Tech
    Admin <--> |HTTPS| FE_Tech

    FE_Tech <--> |Authentication / Data| Business_Logic
    FE_Tech <--> |API Calls| GeoapifyService
    FE_Tech <--> FCMService

    Business_Logic <--> |Database Read/Write| Database_Layer
    Business_Logic --> |Push Notifications| FCMService
    Business_Logic --> |Push Notifications| PushService
```

---

## 2. Core Architectural Layers

1. **Client Layer**: Accessible interfaces for users (Workers and Employers) and platform administrators (Admin Dashboard).
2. **Frontend Layer**: Built using React.js and Vite. It is compiled as a Progressive Web App (PWA) for native-like performance on mobile devices.
3. **Backend / Service Layer**: Handles authentication verification, location APIs, and notification management.
4. **Database Layer**: A Cloud Firestore Database structured with six collection documents: `Users`, `Jobs`, `Applications`, `Notifications`, `Reviews`, and `Skills`.
5. **External Services**: Integrated third-party APIs for mapping, geolocation routing, and push notification messaging.

---

## 3. Workflow Sequence

Below is the linear workflow indicating how a job progresses from creation to payment:

```mermaid
graph LR
    classDef step fill:#f8fafc,stroke:#475569,stroke-width:1.5px,color:#0f172a;
    
    W_Browse["Worker Browses Jobs"]:::step --> Apply["Apply"]:::step
    Apply --> E_Accept["Employer Accepts"]:::step
    E_Accept --> W_Start["Work Started"]:::step
    W_Start --> W_Complete["Work Completed"]:::step
    W_Complete --> E_Pay["Employer Marks Paid"]:::step
    E_Pay --> W_Confirm["Worker Confirms Payment"]:::step
```

---

## 4. Visual Diagram Mockup

Below is a generated visual mockup of the clean system architecture diagram:

![System Architecture Mockup](file:///C:/Users/hp/.gemini/antigravity-ide/brain/31633ae4-db40-45ec-b201-7fdb8c427f0e/system_architecture_1783519493071.png)
