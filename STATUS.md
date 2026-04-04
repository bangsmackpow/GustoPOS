# Project Status & Roadmap

Current status and future trajectory for GustoPOS.

## 🚀 Current Progress

### **Core Systems (Done/Stable)**
- [x] **Monorepo Architecture**: Unified codebase for API, Web, and Desktop.
- [x] **Relational Data Model**: Full schema for Ingredients, Drinks, Recipes, and Tabs.
- [x] **POS Basics**: Create tabs, add orders, and track total amounts.
- [x] **Inventory Tracking**: Recipe-based stock deduction (ml-level precision).
- [x] **Multi-Currency Support**: Exchange rate handling for MXN, USD, and CAD.
- [x] **Offline Resilience**: TanStack Query persistence and Offline PWA support.
- [x] **Desktop Distribution**: Electron builder configured for Mac and Windows.
- [x] **Disaster Recovery**: Litestream configured for Cloudflare R2 replication.

---

## 🗺️ Roadmap (Planned Features)

### **Phase 1: Operational Excellence**
- [ ] **Shift-End Reports**: Automatic calculation of cash-on-hand vs. system totals.
- [ ] **Kitchen/Bar Display System (KDS)**: Real-time order tickets for bartenders.
- [ ] **Printer Integration**: Support for ESC/POS thermal printers for receipts.

### **Phase 2: Customer Retention**
- [ ] **Customer Profiles**: Track local regulars and their "usual" orders.
- [ ] **Loyalty Program**: Digital punch cards or points system.

### **Phase 3: Deep Analytics**
- [ ] **Waste Tracking**: Log "spills" or "comped" drinks to refine profit margins.
- [ ] **Staff Performance**: Sales leaderboards and average ticket times.

---

## ⚠️ Known Issues / Technical Debt
- **Permissions**: Roles (Admin, Bartender) exist in the DB but need granular enforcement in the UI.
- **Validation**: Need stricter input masks for currency and unit amounts in inventory.
- **Offline Sync**: Manual "Sync Status" indicator needed in the UI for peace of mind.
