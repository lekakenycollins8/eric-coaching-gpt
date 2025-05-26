# 🚀 AI Coding Assistant Instructions for Next.js Full-Stack Development

When generating code or providing assistance for this Next.js full-stack application (with `server` and `web` subdirectories), please adhere to the following principles and practices:

---

## 🛡️ 1. Security First (OWASP Top 10 as a Baseline)

* **Input Validation (Server-Side is Key):**
    * Validate **all** incoming data on the server-side (API Routes, Server Actions), even if client-side validation exists.
    * Use established validation libraries (e.g., Zod, Joi) for schema definition and enforcement.
    * Sanitize inputs to prevent XSS (Cross-Site Scripting). While React helps, be mindful of `dangerouslySetInnerHTML` and direct DOM manipulation.
    * Protect against SQL/NoSQL injection by using ORMs (e.g., Prisma, Drizzle ORM) or parameterized queries. Never construct queries with string concatenation from user input.
* **Authentication & Authorization:**
    * Implement robust authentication (e.g., NextAuth.js, Lucia Auth, or a managed service like Ory, Clerk).
    * Ensure strong password policies and secure session management (e.g., short-lived tokens, HttpOnly, Secure, SameSite cookies).
    * Enforce proper authorization checks on **all** server-side operations and API endpoints. Verify user roles and permissions before accessing or modifying resources.
    * Protect against CSRF (Cross-Site Request Forgery) attacks. NextAuth.js provides some protection, but be aware of custom form submissions.
* **API Security:**
    * Secure API routes (Route Handlers) with authentication and authorization middleware.
    * Use HTTPS exclusively.
    * Implement rate limiting to prevent abuse.
    * Validate `Content-Type` and request origins where applicable.
* **Secrets Management:**
    * **Never** hardcode secrets (API keys, database credentials, etc.) in the codebase.
    * Use environment variables (`.env.local`, `.env.production.local`) and ensure they are **not** committed to version control (except for non-sensitive defaults in a `.env.example` file).
    * Access environment variables securely using `process.env.VARIABLE_NAME` on the server-side. Be cautious about exposing them to the client-side (use `NEXT_PUBLIC_` prefix only when absolutely necessary and for non-sensitive data).
* **Dependency Management:**
    * Regularly audit dependencies for known vulnerabilities (e.g., `npm audit`, `yarn audit`).
    * Keep dependencies up-to-date, especially security-related ones.
    * Use trusted package repositories.
* **Error Handling & Logging (Security Context):**
    * Avoid leaking sensitive information in error messages (e.g., stack traces, database errors) to the client. Provide generic error messages.
    * Log security-relevant events (e.g., failed login attempts, unauthorized access attempts) on the server.
* **HTTP Security Headers:**
    * Implement appropriate HTTP security headers (e.g., `Content-Security-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`, `Referrer-Policy`) in `next.config.js` or middleware.
* **Server-Side Request Forgery (SSRF):**
    * Be cautious when making requests from the server to external URLs based on user input. Validate and sanitize URLs.
* **File Uploads:**
    * Validate file types, sizes, and scan for malware if handling user-uploaded files. Store them securely, preferably outside the webroot.

---

## 🧱 2. Separation of Concerns (SoC)

* **Server (`server` subdirectory) vs. Web (`web` subdirectory):**
    * Maintain a clear distinction between frontend (`web`) and backend (`server`) logic. While Next.js blurs this, aim for logical separation.
    * The `web` directory should primarily contain UI components, client-side logic, page definitions, and static assets.
    * The `server` directory (or `app/api`, `lib/server`, `server/actions` etc. within the `app` router structure) should house API route handlers, server actions, database logic, business logic, and authentication/authorization services.
* **React Server Components (RSC) & Client Components:**
    * Use RSCs (`async/await` components by default in the `app` router) for data fetching, direct database access, and accessing server-only resources.
    * Use Client Components (`'use client'`) for interactivity, browser-only APIs (e.g., `useState`, `useEffect`, `localStorage`), and event listeners.
    * Pass data from Server Components to Client Components as props.
    * Minimize the amount of code in Client Components to reduce bundle sizes.
* **Server Actions:**
    * Use Server Actions for form submissions and server-side mutations directly from client components, reducing the need for explicit API route handlers for these cases. Keep them focused and secure.
    * Use the `'use server'` directive at the top of the file or for individual functions.
* **`server-only` and `client-only` Packages:**
    * Utilize the `server-only` package to ensure specific modules are never bundled for the client (e.g., database clients, secret keys).
    * Use the `client-only` package for modules that should only run in the browser.
* **Modular Design:**
    * Break down features into smaller, reusable modules/components with well-defined responsibilities.
    * Organize files logically by feature or type within the `server` and `web` subdirectories.
    * **UI Components:** Small, reusable, and presentational.
    * **Container/Page Components:** Compose UI components, fetch data (often via RSCs or hooks calling Server Actions/API routes), and manage page-specific state.
    * **Services/Utilities:** Abstract business logic, API interactions, and utility functions into separate modules.
    * **Database Queries:** Centralize database interactions (e.g., in a `lib/db` or `server/db` directory).

---

## 📈 3. Scalability

* **Stateless API Routes/Server Actions:**
    * Design API routes and Server Actions to be stateless wherever possible. This allows for easier horizontal scaling. Store session state in a database or distributed cache if needed.
* **Efficient Data Fetching:**
    * Fetch only the data needed for a given page or component.
    * Utilize Next.js data fetching methods (RSCs, `generateStaticParams` for SSG, Server Actions) effectively.
    * Implement pagination, filtering, and sorting for large datasets.
* **Caching:**
    * Leverage Next.js caching strategies (Full Route Cache, Data Cache, Request Memoization).
    * Use `cache`, `revalidateTag`, `revalidatePath` for fine-grained control.
    * Consider external caching layers (e.g., Redis, Varnish) for frequently accessed, non-dynamic data if performance bottlenecks arise.
* **Database Optimization:**
    * Use efficient database queries and indexing.
    * Consider connection pooling.
    * Choose appropriate database technology based on application needs (SQL vs. NoSQL).
* **Asynchronous Operations:**
    * Utilize `async/await` for non-blocking I/O operations (database queries, external API calls) to improve throughput.
* **Serverless Functions (if applicable):**
    * Next.js API Routes and Server Actions deploy well to serverless environments (e.g., Vercel, AWS Lambda), which offer automatic scaling. Design them with this in mind (e.g., cold start considerations).
* **Load Balancing:**
    * If self-hosting, ensure a load balancer is in place to distribute traffic across multiple application instances.
* **Code Splitting:**
    * Next.js does automatic code splitting per page. Leverage dynamic imports (`next/dynamic`) for components or libraries that are not immediately needed to reduce initial load times.

---

## 🛠️ 4. Maintainability

* **Consistent Code Style & Formatting:**
    * Use a linter (e.g., ESLint) and a formatter (e.g., Prettier) with agreed-upon configurations. Integrate them into the development workflow (e.g., pre-commit hooks).
* **Clear Naming Conventions:**
    * Use descriptive and consistent names for variables, functions, components, files, and folders.
* **Modularity and Reusability (as mentioned in SoC):**
    * Create small, focused functions and components.
    * DRY (Don't Repeat Yourself) principle: Abstract common logic into reusable utilities or services.
* **Comments and Documentation:**
    * Write clear comments for complex logic or non-obvious code sections.
    * Maintain JSDoc or TSDoc for functions and components, especially for APIs and shared utilities.
    * Keep external documentation (e.g., READMEs, wikis) updated.
* **TypeScript (Highly Recommended):**
    * Use TypeScript for static typing to catch errors early, improve code readability, and enhance refactoring capabilities. Define clear types and interfaces.
* **Configuration Management:**
    * Centralize application configuration. Avoid magic numbers or hardcoded strings; use constants or environment variables.
* **Version Control (Git):**
    * Use Git for version control.
    * Follow a consistent branching strategy (e.g., Gitflow, GitHub Flow).
    * Write clear and descriptive commit messages.
* **Testing:**
    * Write unit tests (e.g., Jest, Vitest) for individual functions, components (especially UI logic and business logic).
    * Write integration tests to verify interactions between components and services.
    * Consider end-to-end tests (e.g., Cypress, Playwright) for critical user flows.
    * Aim for good test coverage.
* **Refactoring:**
    * Regularly refactor code to improve structure, readability, and performance, and to remove technical debt.

---

## ✨ 5. Best Practices for Customer-Facing Software

* **User Experience (UX) & Performance:**
    * Prioritize fast load times (LCP, FCP, TTI). Optimize images (`next/image`), use code splitting, and minimize bundle sizes.
    * Ensure responsive design for various devices.
    * Provide clear user feedback for actions (e.g., loading states, success/error messages).
    * Implement accessibility (a11y) best practices (semantic HTML, ARIA attributes, keyboard navigation).
* **Reliability & Error Handling:**
    * Implement comprehensive error handling on both client and server.
    * Use Next.js error boundaries (`error.tsx`) for graceful error recovery in the UI.
    * Log errors effectively for debugging (consider client-side error tracking services like Sentry or LogRocket).
* **Clear and Consistent API Design (if exposing public APIs):**
    * Follow RESTful principles or GraphQL best practices.
    * Use consistent naming, status codes, and error responses.
    * Version your APIs if breaking changes are anticipated.
* **Internationalization (i18n) & Localization (l10n):**
    * If targeting multiple regions/languages, plan for i18n from the start. Next.js has built-in i18n routing support.
* **Data Integrity and Privacy:**
    * Protect user data rigorously. Comply with relevant data privacy regulations (e.g., GDPR, CCPA).
    * Encrypt sensitive data at rest and in transit.
* **Thorough Testing (as mentioned in Maintainability):**
    * Customer-facing applications demand high reliability. Testing is crucial.
* **Monitoring & Analytics:**
    * Implement application performance monitoring (APM) and user analytics to understand usage patterns, identify issues, and gather insights for improvement.
* **Documentation:**
    * Provide clear user documentation if necessary.
    * Maintain up-to-date internal technical documentation.
* **CI/CD (Continuous Integration/Continuous Deployment):**
    * Automate testing and deployment pipelines to ensure consistent and reliable releases.

---

## 🤖 Instructions Specific to AI Assistance

* **Be Explicit:** Clearly state the context (Next.js version, App Router vs. Pages Router, specific files/modules involved).
* **Request Specific Patterns:** Ask for code implementing specific design patterns (e.g., "Generate a Server Action for this form, ensuring proper validation with Zod").
* **Iterative Refinement:** Use the AI for initial drafts, then critically review and refine. Ask the AI to explain its reasoning or suggest alternatives.
* **Security Scrutiny:** **Always critically review AI-generated code for security vulnerabilities**, especially related to input handling, authentication, authorization, and data access. Ask: "Are there any security vulnerabilities in this code? How can it be made more secure?"
* **Performance Considerations:** Ask about the performance implications of suggested code.
* **Test Generation:** Request the AI to help generate unit tests or test cases for the code it produces.
* **Focus on Idempotency:** For mutating operations, ask for idempotent solutions where appropriate.