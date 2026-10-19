# VIEK Client Management System - Debugging Assessment

**Candidate:** Victor Dakoh  
**Assessment:** Technical Debugging Assessment (Full-Stack Software Development Intern)

## 1. Setup & Run Instructions

**Prerequisites:** Node.js installed on your machine.

### Start the Backend
1. Navigate to the server directory: `cd server`
2. Install dependencies: `npm install`
3. Start the Express server: `npm start`
*(The backend runs on http://localhost:4000)*

### Start the Frontend
1. Open a new terminal and navigate to the client directory: `cd client`
2. Install dependencies: `npm install`
3. Start the Vite development server: `npm run dev`
*(The frontend runs on http://localhost:5173)*

---

## 2. Bugs Identified, Root Causes, & Solutions

### Frontend Issues
* **Bug:** Application crashes with a white screen on startup (`ReferenceError: React is not defined`).
  * **Root Cause:** Vite was missing its configuration file to utilize the `@vitejs/plugin-react` dependency.
  * **Solution:** Created `vite.config.js` and imported/registered the React plugin to compile JSX properly.
* **Bug:** Fatal crash during render (`Cannot read properties of undefined (reading 'map')`).
  * **Root Cause:** State variables `projects` and `clients` were initialized as `undefined` or improperly parsed, causing `.map()` to fail on initial render.
  * **Solution:** Initialized `useState([])` with empty arrays and added safe fallbacks.
* **Bug:** Missing client list and broken POST requests.
  * **Root Cause:** `loadClients` expected `result.clients` while the API returned `{ data: clients }`. Additionally, `addClient` omitted the `"Content-Type": "application/json"` header, causing the backend to ignore the request body.
  * **Solution:** Aligned the frontend property access paths with the API contract and added the missing HTTP headers.

### Backend Issues
* **Bug:** Deleting a client always returns 404 Not Found, and filtering projects returns an empty array.
  * **Root Cause:** Express parses `req.params.id` and `req.query.clientId` as strings. The filter functions used strict equality (`===` / `!==`) against numeric IDs in the data arrays (e.g., `"1" !== 1` is always true).
  * **Solution:** Explicitly cast URL parameters and queries to numbers using `Number()` before performing logical comparisons.
* **Bug:** Creating new clients creates duplicate IDs.
  * **Root Cause:** ID generation relied on `clients.length + 1`. Deleting a client and adding a new one caused ID collisions.
  * **Solution:** Implemented a safe incremental ID generator (`Math.max(...clients.map(c => c.id)) + 1`).

---

## 3. Testing

After applying the fixes, the application was systematically tested across the following flows:

* **Authentication Flow:** Verified invalid credentials trigger an error UI, valid credentials generate a token, and unhandled 401 Unauthorized responses gracefully clear local storage and redirect to the login screen. Added and verified a manual logout function.
* **Client Management (CRUD):** Successfully added new clients (verified input validation), verified they appear in the UI, and successfully deleted clients.
* **Data Integrity & Project Filtering:** Selected specific clients from the dropdown to ensure projects filtered correctly. Deleted an actively selected client to ensure the frontend filter resets and the backend cleans up orphaned projects correctly.

---

## 4. Security

### Immediate Concerns Addressed
1. **Plaintext Password Exposure:** The `/api/login` endpoint originally returned the entire user object in the JSON response, leaking the plaintext password over the network.
   * **Fix:** Destructured and stripped the password field before sending the response payload.
2. **Missing Input Validation:** Replaced vulnerable raw inputs with `.trim()` formatting, regex-based email validation, and duplicate email checks to prevent malformed data insertion.
3. **Information Leakage:** The global error handler passed raw `err.message` strings directly to the client.
   * **Fix:** Safely logged stack traces internally and returned generic 500/400 messages to the client.

### Production Recommendations
To make this application production-ready, the following architectural upgrades are necessary:
* **Authentication Hardening:** Implement Argon2 or bcrypt for password hashing. Replace the hardcoded `"demo-token"` with signed JSON Web Tokens (JWTs) stored in HttpOnly cookies to mitigate XSS attacks.
* **Network & API Security:** Enforce strict CORS origins, integrate Helmet.js to secure HTTP headers, and apply rate-limiting to the `/api/login` endpoint to prevent brute-force attacks.
* **Database Layer:** Transition from in-memory arrays to a relational database (e.g., PostgreSQL) utilizing parameterized queries or an ORM to prevent SQL Injection.

---

## 5. Reflection

* **The issue that required the most investigation:** The silent failures associated with JavaScript type coercion in the Express route handlers. Coming from a primary background in strongly-typed environments like Java and Spring Boot, identifying that `req.params.id` was passing as a string and failing the strict equality `!==` check against numeric IDs required deliberate network payload inspection.
* **General debugging approach:** I utilized a systematic, layer-by-layer isolation strategy. I began by standardizing the workspace and ensuring the server could start. For each feature, I analyzed the network tab to verify the exact payload contracts between the client and server. Once the backend data logic was secure and sanitized, I stabilized the React component lifecycle to ensure state matched the incoming data structures.
* **Unresolved issues:** None. All intended features are fully functional, resilient to runtime errors, and secure against basic injection and data leakage.