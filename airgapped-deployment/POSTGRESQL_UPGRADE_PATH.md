# PostgreSQL Upgrade Path for GustoPOS

## 📋 Overview

Currently, GustoPOS uses **SQLite** for the airgapped macOS deployment. This guide documents the upgrade path to **PostgreSQL** for scenarios where:

- **Multiple bars** need to sync data
- **Multiple machines** need to access the same database
- **Higher concurrency** is required (many staff users simultaneously)
- **Professional backup/replication** is needed

---

## When to Upgrade to PostgreSQL

### ✅ Keep SQLite if:
- Single MacBook Pro running locally
- Offline operation required
- Data storage <500MB
- Simple, single-user scenarios
- No complex reporting

### 🔄 Upgrade to PostgreSQL if:
- Multiple staff using simultaneously on Wi-Fi
- Multi-bar chains (separate instances per bar)
- Real-time data sync across devices
- Advanced backup/replication needed
- Enterprise database requirements

---

## Architecture Changes

### SQLite Model (Current)
```
MacBook Pro
  ├── Node.js API
  ├── Express Server
  └── SQLite Database (local file)
```

### PostgreSQL Model (Future)
```
Server/Mac Mini (Database Server)
  └── PostgreSQL Database (persistent)
     
Staff MacBook Pro #1 (API Server)
  ├── Node.js API
  └── Express Server → PostgreSQL Server

Staff MacBook Pro #2 (API Server)
  ├── Node.js API
  └── Express Server → PostgreSQL Server

Wi-Fi Network
  └── Mobile Apps (Tablets/Phones) → Any API Server
```

---

## Migration Steps (For Future Implementation)

### Phase 1: Database Layer Changes

**Files to modify:**
- `lib/db/src/index.ts` - Switch from LibSQL to PostgreSQL driver
- `lib/db/src/schema/gusto.ts` - Ensure schema is PostgreSQL-compatible
- Migration scripts - Update for PostgreSQL Drizzle ORM

**Actions:**
1. Replace `@libsql/client` with `pg` or `@neondatabase/serverless`
2. Update `createClient()` configuration for PostgreSQL connection string
3. Ensure all Drizzle ORM features work with PostgreSQL
4. Run migrations against PostgreSQL database

### Phase 2: API Server Changes

**Files to modify:**
- `artifacts/api-server/src/index.ts` - Update connection pooling
- `artifacts/api-server/src/lib/logger.ts` - Add query logging (optional)
- Environment variables - Add PostgreSQL credentials

**New environment variables:**
```env
DATABASE_URL=postgresql://user:password@host:5432/gustopos
# or for cloud databases:
DATABASE_URL=postgresql://user:password@db.example.com:5432/gustopos?sslmode=require
```

### Phase 3: Deployment Changes

**Option A: Self-Hosted PostgreSQL**
- Set up PostgreSQL server on Mac Mini
- Configure network access (VPC/firewall)
- Multiple API servers connect to same database
- Data is centralized

**Option B: Cloud PostgreSQL**
- Use managed service (Neon, Render, Railway, AWS RDS)
- API servers in cloud connect to PostgreSQL
- Multiple bars can use different databases
- Automatic backups/replication

**Option C: Hybrid**
- Primary PostgreSQL in cloud (main office)
- Replica on local machine (offline capability)
- Sync when internet available

### Phase 4: Testing

- Unit tests for database layer
- Integration tests with PostgreSQL test instance
- Performance tests (SQLite vs PostgreSQL)
- Concurrent user tests

### Phase 5: Documentation

- Connection string examples
- PostgreSQL installation guide
- Migration from SQLite guide
- Backup/restore procedures

---

## Migration from SQLite to PostgreSQL

### For Existing Customers

1. **Backup SQLite database:**
   ```bash
   cp ~/.gustopos/data/gusto.db ~/backup-before-migration.db
   ```

2. **Export SQLite data:**
   ```bash
   sqlite3 ~/.gustopos/data/gusto.db .dump > sqlite-export.sql
   ```

3. **Create PostgreSQL database:**
   ```bash
   createdb gustopos
   ```

4. **Import data:**
   - Use Drizzle ORM migrations or manual SQL scripts
   - Verify data integrity
   - Test application

5. **Update connection string:**
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/gustopos
   ```

6. **Restart API server:**
   ```bash
   ~/.gustopos/stop.sh
   ~/.gustopos/start.sh
   ```

### Data Consistency

- Verify record counts before/after migration
- Test all major workflows (tabs, inventory, reporting)
- Validate foreign key relationships
- Check for data type conversions

---

## Performance Considerations

### SQLite Advantages
- No separate server needed
- Minimal resource overhead
- Instant backups (just copy file)
- Zero configuration

### PostgreSQL Advantages
- Multi-user concurrent access
- Advanced indexing/query optimization
- Row-level security
- Connection pooling
- Better scaling

---

## Timeline Estimate

If needed, PostgreSQL upgrade could be implemented in future phases:

- **Phase 1 (DB Changes):** 2-3 days
- **Phase 2 (API Updates):** 1-2 days
- **Phase 3 (Deployment):** 2-3 days
- **Phase 4 (Testing):** 3-5 days
- **Phase 5 (Documentation):** 1-2 days

**Total: 1-2 weeks for a production-ready PostgreSQL deployment**

---

## Recommendation

For the **MacBook Pro airgapped deployment** in the current scenario:

1. **Start with SQLite** (current implementation)
   - Meets all offline requirements
   - Zero setup complexity
   - Sufficient for single-location bar

2. **Monitor usage patterns**
   - If performance is good, stay with SQLite
   - If concurrency becomes issue, upgrade

3. **Document upgrade path** (this document)
   - Keep code PostgreSQL-compatible
   - Use Drizzle ORM for database abstraction
   - Test migration scripts quarterly

4. **Plan PostgreSQL for Phase 3** (if multi-location needed)
   - When scaling to multiple bars
   - When mobile app needs real-time sync
   - When cloud backup becomes critical

---

## SQL Compatibility Checklist

For PostgreSQL readiness, ensure:

- [ ] No SQLite-specific SQL syntax used
- [ ] Use Drizzle ORM query builder (not raw SQL)
- [ ] Test with PostgreSQL dialect
- [ ] Document any database-specific features
- [ ] Create migration scripts for schema changes
- [ ] Test connection pooling settings
- [ ] Verify performance with 100+ concurrent users

---

## Questions for Future Planning

Before implementing PostgreSQL:

1. **Multi-location need?** - How many bars/locations?
2. **Concurrent users?** - How many staff simultaneously?
3. **Hosting preference?** - Self-hosted or cloud?
4. **Compliance?** - Any data residency requirements?
5. **Budget?** - Managed service cost acceptable?
6. **Timeline?** - When would upgrade be needed?

---

## Resources

- [Drizzle ORM PostgreSQL Docs](https://orm.drizzle.team/docs/get-started-postgresql)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Connection Pooling with PgBouncer](https://www.pgbouncer.org/)
- [PostgreSQL Docker Setup](https://hub.docker.com/_/postgres)

---

**This document provides the foundation for a future PostgreSQL migration while maintaining SQLite as the current production database for airgapped scenarios.**
