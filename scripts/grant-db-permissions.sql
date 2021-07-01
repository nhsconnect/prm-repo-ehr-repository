-- Give just enough permissions for migration role to change data in the SequelizeMeta table
GRANT SELECT, INSERT ON "SequelizeMeta" TO migration_role;

-- Needs to execute after database was migrated
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO application_role;
