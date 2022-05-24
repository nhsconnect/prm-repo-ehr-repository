-- Give just enough permissions for migration role to change data in the SequelizeMeta table
GRANT SELECT, INSERT ON "SequelizeMeta" TO migration_role;

-- Needs to execute after database was migrated
GRANT SELECT, INSERT, UPDATE, DELETE ON health_checks TO application_role;

GRANT SELECT, INSERT ON health_records TO application_role;
REVOKE UPDATE, DELETE ON health_records FROM application_role;

GRANT SELECT, INSERT ON messages TO application_role;
REVOKE UPDATE, DELETE ON  messages FROM application_role;
