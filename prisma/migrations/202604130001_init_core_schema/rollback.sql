-- WARNING: This rollback is destructive and will remove all data in these tables.
-- Apply only in local/dev recovery scenarios.

DROP TABLE IF EXISTS "LeadTag";
DROP TABLE IF EXISTS "Tag";
DROP TABLE IF EXISTS "Lead";
DROP TABLE IF EXISTS "Membership";
DROP TABLE IF EXISTS "Workspace";
DROP TABLE IF EXISTS "User";
DROP TYPE IF EXISTS "MembershipRole";
