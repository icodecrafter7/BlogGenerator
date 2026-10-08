# Software Requirements Specification (SRS)
## Project Title: Premium AI Blog Generator ("EmpathWrite AI")
### Version: 1.0.0
### Date: June 18, 2026

---

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive specification of the functional, non-functional, database, and structural requirements for **EmpathWrite AI** (the AI Blog Generator). This premium MERN (MongoDB, Express.js, React.js, Node.js) web application moves beyond standard, robotic AI text generation by focusing on collaborative co-writing, strict humanization filters, dynamic audience persona alignment, and an ultra-polished, fluid user interface utilizing the Google Gemini API for intelligent execution.

### 1.2 Scope
The web application is structured as an end-to-end platform enabling independent content creators, copywriters, and digital marketers to:
* Manage a personal dashboard of active, draft, and completed long-form blogs.
* Conduct a granular onboarding configuration wizard detailing audience demographics, tones, and goals.
* Interact with a "Human-in-the-Loop" rich text editor that leverages real-time Server-Sent Events (SSE) to stream Gemini content.
* Refine contextually inline highlighted text to change tone, expand, shorten, or remove common "AI-isms" instantly.
* Ground AI generation using raw custom sources (links, notes) to minimize hallucinations.

### 1.3 Definitions, Acronyms, and Abbreviations
* **MERN:** MongoDB, Express.js, React.js, Node.js.
* **SSE:** Server-Sent Events (used for low-latency text streaming from the backend).
* **JWT:** JSON Web Token (used for secure, stateless session authentication).
* **CRUD:** Create, Read, Update, Delete.
* **AI-isms:** Stereotypical linguistic patterns found in LLM outputs (e.g., "Delve", "In conclusion", "Furthermore", "Testament to").
* **LLM:** Large Language Model.

---

## 2. Product Overview

### 2.1 System Perspective
EmpathWrite AI functions as a decoupled full-stack architecture. The frontend is built on React.js (Vite) and styled with Tailwind CSS, utilizing Radix UI primitives via Shadcn UI for premium accessibility and Framer Motion for state-driven micro-interactions. The backend is an Express/Node.js web service connected to a MongoDB cluster. AI capabilities are driven asynchronously through secure server-side interactions with the Google Gemini API SDK.

```
+------------------------------------------------------------+
|                       React Frontend                       |
|         (Tailwind CSS + Framer Motion + TipTap Editor)      |
+------------------------------+-----------------------------+
                               |
                   HTTP / SSE (Streaming)
                               |
+------------------------------v-----------------------------+
|                     Node.js / Express Backend              |
|        (JWT Auth + Route Controllers + Prompt Engine)       |
+--------------+------------------------------+--------------+
               |                              |
       Mongoose Drivers                 Gemini API SDK
               |                              |
+--------------v---------------+      +-------v--------------+
|       MongoDB Database       |      |    Google Gemini     |
|   (Users, Blogs, Personas)   |      |  AI Frontier Models  |
+------------------------------+      +----------------------+
```

### 2.2 Product Features
1. **Secure Session Engine:** Dedicated email/password authentication using JWT cookies, encrypted passwords (`bcrypt`), and session-protected route walls.
2. **Audience Persona & Alignment Profiler:** A wizard that creates targeted systemic prompts for the model based on specific consumer demographics.
3. **Structured Context Injection:** Input boxes for adding raw textual knowledge blocks, notes, or URLs passed to the Gemini model as grounded reference materials.
4. **Dynamic Outline Builder:** An architectural step where Gemini generates a JSON-structured blueprint (H2/H3 hierarchy) that users can reorder or tweak before long-form rendering.
5. **Human-in-the-Loop Stream Editor:** A fully customized WYSIWYG editor (TipTap) supporting inline text transformation and immediate live text insertion from an SSE connection.
6. **"Anti-AI" Post-Processor Filter:** Algorithmic and systemic sanitization rules applied during processing to enforce natural phrasing, variable sentence lengths, and conversational narrative beats.

### 2.3 User Classes and Characteristics
* **Content Creators & Bloggers:** Require rapid drafting structures but demand absolute control over voice, syntax, and alignment so their personal brand remains intact.
* **Digital Marketers / SEO Specialists:** Require high factual accuracy, systematic structure, custom grounding notes, and rapid meta-tag or snippet creation hooks.

### 2.4 Design and Implementation Constraints
* **No Client-Side Keys:** The Gemini API key must remain strictly server-side inside secure environment variables (`.env`).
* **Stateless Token Management:** Authentication must not bloat server memory; signed JWTs must manage user verification.
* **Layout Isolation:** Use proper box-sizing configurations across all scopes (`*, *::before, *::after { box-sizing: border-box; }`) to ensure fluid responsive design that gracefully scales from 320px up to 2K monitors without layout distortion.

---

## 3. Detailed Functional Requirements

### 3.1 Authentication & Workspace Dashboards
* **FR-1.1: Registration and Authentication**
  * The system must allow users to create an account using an Email, Password, and Full Name.
  * Passwords must be hashed using `bcrypt` with a minimum salt round of 10.
* **FR-1.2: Session Security**
  * Successful authentication must issue a secure HTTP-Only cookie containing an authenticated JWT valid for 7 days.
* **FR-1.3: Creator Dashboard Grid**
  * The dashboard must present a list of all blog items owned by the authenticated user, sorted by `updatedAt` in descending order.
  * Display clear card metrics: *Total Documents Created*, *Aggregate Word Count*, and *Active Drafting Hours*.

### 3.2 Audience Alignment & Onboarding Wizard
* **FR-2.1: Multi-Step Configuration Wizard**
  * The application must present a form UI to capture generation metrics:
    * **Topic/Working Title:** (Text input, required)
    * **Target Demographic:** (Dropdown/Select: Tech Enthusiasts, Corporate Executives, Casual Readers, Students)
    * **Primary Objective:** (Select: Inform/Educate, Persuade/Sell, Entertain, Storytelling)
    * **Narrative Tone:** (Select: Empathetic, Conversational, Witty, Academic, Highly Technical)
* **FR-2.2: Context Injection Grounding Box**
  * Provide an optional rich text area allowing users to paste up to 8,000 characters of raw bulleted facts, research data, or rough concepts.
  * The backend must automatically prepend this block as `[GROUNDING CONTEXT]` within the systemic instruction packet passed to the Gemini model.

### 3.3 Dynamic Outline Builder
* **FR-3.1: Structural Blueprint Generation**
  * Before generating full paragraphs, the system must trigger a fast call to Gemini to return a clean outline.
  * The prompt structure must leverage Gemini's Structured Outputs feature to enforce a strict JSON schema format:
    ```json
    {
      "title": "String",
      "sections": [
        { "heading": "String", "level": 2, "brief_intent": "String" }
      ]
    }
    ```
* **FR-3.2: Outline Customization Interface**
  * The user must view this structured outline in an interactive sidebar or list component. Users can toggle individual sections on/off, change heading labels, or append manual headings before triggering the full draft generation.

### 3.4 Interactive Rich Text Stream Workspace
* **FR-4.1: Real-Time SSE Stream Integration**
  * When the user triggers "Generate Draft", the backend must initiate a Server-Sent Events connection (`text/event-stream`).
  * The frontend must parse incoming tokens incrementally and append them immediately to the active editor state, mimicking a real-time typing layout.
* **FR-4.2: Inline AI Command Context Menu**
  * Highlighting a block of text within the workspace must render a sleek, floating action menu.
  * Options included in the floating action menu:
    * **Humanize Phrasing:** Strips programmatic sentence structures and introduces realistic structural variance.
    * **Change Tone:** Changes the selected block into any user-selected secondary voice preset.
    * **Expand / Elaborate:** Inject relevant analogies or explanatory points.
    * **Condense:** Simplifies paragraphs into hard-hitting, crisp insights.

### 3.5 Systemic "Anti-AI-ism" Phrasing Engine
* **FR-5.1: System Prompt Optimization Architecture**
  * The core prompt template submitted to the Gemini API must include explicit strict negative-constraint directives:
    > "CRITICAL: You must bypass corporate clichés and robotic structural patterns. Never use introductory filler phrases like 'In today's fast-paced digital landscape', 'It is important to remember', 'Moreover', or 'Furthermore'. Avoid repeating the main keyword unnaturally. Write with conversational cadence, using varied sentence lengths (alternating short, punched statements with occasional descriptive complex sentences) to ensure a high human-readability profile."

---

## 4. Non-Functional Requirements

### 4.1 UI/UX & Visual Aesthetic Mandates
* **Design Language:** Modern, premium dark/light mode layout inspired by high-end engineering interfaces (Linear/Vercel-like aesthetics).
* **Typography:** Clean, legible sans-serif stacks (Inter / Plus Jakarta Sans) with crisp contrast controls.
* **Micro-interactions:** Complete layout animations powered by Framer Motion. Loading indicators should show shimmering text pulses instead of standard circles.

### 4.2 Performance and Latency
* **Streaming Throughput:** The server must pipe tokens from Gemini to the client within 200ms of the initial handshake request.
* **Database Query Performance:** All queries querying user documents or configuration lookups must resolve in under 50ms, ensured via targeted multi-key MongoDB compound indexing.

### 4.3 Security Profiles
* **Secure Environment Separation:** Database credentials, JWT tokens, and Google Gemini API keys must never be committed to source control; they must be managed strictly via runtime system environment configurations.
* **Sanitization Layer:** All input injected into the database or compiled into dynamic rich text must pass through an Express input validator and DOMPurify on the client to completely mitigate Cross-Site Scripting (XSS).

---

## 5. Database Schema & API Contracts

### 5.1 Database Entities (Mongoose Schemas)

#### User Collection
```javascript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
```

#### Blog Collection
```javascript
const BlogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  configuration: {
    targetAudience: { type: String, required: true },
    objective: { type: String, required: true },
    tone: { type: String, required: true },
    groundingContext: { type: String, default: "" }
  },
  outline: { type: Array, default: [] },
  content: { type: String, default: "" },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
```

### 5.2 Application API Endpoints

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/signup` | Creates user account, returns JWT cookie. | No |
| **POST** | `/api/auth/login` | Validates credentials, returns JWT cookie. | No |
| **POST** | `/api/auth/logout` | Clears local session authentication cookie. | Yes |
| **GET** | `/api/blogs` | Retrieves all blogs for current logged-in user. | Yes |
| **POST** | `/api/blogs` | Creates an empty new blog shell item. | Yes |
| **POST** | `/api/blogs/:id/outline` | Generates a JSON blog structural blueprint using Gemini. | Yes |
| **GET** | `/api/blogs/:id/stream` | Initiates an SSE text stream to pipe content. | Yes |
| **PUT** | `/api/blogs/:id/save` | Persists text updates from active rich editor. | Yes |
| **POST** | `/api/blogs/inline-edit` | Transforms specific block sections (Expand, Humanize).| Yes |