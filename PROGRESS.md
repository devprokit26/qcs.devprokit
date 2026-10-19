# PROGRESS

## DONE

### Navigation / Routing
- src/routes/index.tsx -- /cartons and /expenses routes registered with lazy-loading + ProtectedRoute
- ErrorBoundary wraps all routes; unknown URLs show NotFoundPage (404)
- Sidebar.tsx -- admins bypass all permission checks (full access)
- ProtectedRoute.tsx -- admin bypass added
- AuthContext.tsx -- hasPermission grants admin full access

### Pages (exist and complete)
- CartonsPage.tsx -- stock summary, movements log, add/edit types, RECEIVED/USED/ADJUSTMENT movements
- ExpensesPage.tsx -- KPI cards (today/week/month), category breakdown, full CRUD, date/category filters
- NotFoundPage.tsx -- custom 404
- ErrorBoundary.tsx -- catches and displays React render errors

### Cartons and Shipments Integration
- ShipmentModal.tsx -- added 'Cartons / Boxes Used' section at bottom of form
  - Add Carton button adds rows with carton-type dropdown + quantity input
  - Carton lines saved as cartonsUsed: CartonUsedLine[] on the shipment
- shipmentMockService.ts -- applyCartonsUsed() now called after createShipment and updateShipment
  - On create: posts USED movements for each carton line
  - On update: posts USED movements for the delta (only newly added qty)

### Users
- seedData.ts -- admin user has all permissions including cartons and expenses
- UsersPage.tsx + UserModal.tsx -- both cartons and expenses page keys in permission checkboxes

### Tests
- 20/20 tests passing
- 0 TypeScript errors

## REMAINING

### Phase 2: Backend
- Create /backend -- Node 20, Express, TypeScript
- Prisma schema (PostgreSQL 16)
- Express REST API controllers
- Auth middleware (JWT)

### Phase 3: Frontend to Backend
- Create src/services/rest/ REST implementations
- Wire src/services/index.ts to use VITE_USE_MOCK=false

### Phase 4: Deploy-Ready
- docker-compose.yml
- Nginx config
- CI/CD workflow

## BUGS FIXED

1. Cartons/Expenses sidebar links caused full-page reload -- Routes added to routes/index.tsx
2. Admin had no cartons/expenses permissions -- seedData + admin bypass in Auth/Sidebar/ProtectedRoute
3. No 404 page -- Added NotFoundPage + catch-all route
4. No error boundary -- Added ErrorBoundary wrapping all routes
5. Shipments had no carton usage tracking -- Added cartonsUsed to ShipmentModal + applyCartonsUsed in service
