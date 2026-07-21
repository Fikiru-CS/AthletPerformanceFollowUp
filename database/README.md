# Database Setup Guide

## Prerequisites
- PostgreSQL 14+ installed
- `psql` CLI tool

## Setup Steps

### 1. Create the database
```bash
psql -U postgres -c "CREATE DATABASE apts_db;"
```

### 2. Run the schema
```bash
psql -U postgres -d apts_db -f schema.sql
```

### 3. Verify tables
```bash
psql -U postgres -d apts_db -c "\dt"
```

## Environment Variable (used by backend)
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/apts_db
```

## Tables Overview
| Table              | Purpose                                    |
|--------------------|--------------------------------------------|
| users              | Athlete accounts                           |
| training_sessions  | Each recorded run/training session         |
| kilometer_splits   | Per-km breakdown within a session          |

## Key Design Choices
- UUID primary keys for security and scalability
- Indexed on user_id + training_date for fast dashboard queries
- avg_speed and avg_pace auto-calculated in the backend
- ON DELETE CASCADE ensures clean removal of child records
