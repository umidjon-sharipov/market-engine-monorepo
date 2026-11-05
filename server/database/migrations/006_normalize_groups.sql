-- Compatibility-first group normalization. Run after taking a database backup.
-- Legacy Groups.users/topics/defaults and Messages JSON columns remain during rollout.

ALTER TABLE "Groups"
  ALTER COLUMN url SET DEFAULT gen_random_uuid()::text;

CREATE TABLE IF NOT EXISTS "GroupMembers" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" UUID NOT NULL REFERENCES "Groups"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("groupId", "userId")
);

CREATE TABLE IF NOT EXISTS "GroupTopics" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" UUID NOT NULL REFERENCES "Groups"(id) ON DELETE CASCADE,
  url VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  logo TEXT,
  defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("groupId", url)
);

CREATE TABLE IF NOT EXISTS "GroupMemberTopicPermissions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "memberId" UUID NOT NULL REFERENCES "GroupMembers"(id) ON DELETE CASCADE,
  "topicId" UUID NOT NULL REFERENCES "GroupTopics"(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE ("memberId", "topicId")
);

CREATE TABLE IF NOT EXISTS "GroupPermissions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" UUID NOT NULL REFERENCES "Groups"(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES "Users"(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  value JSONB NOT NULL DEFAULT 'true'::jsonb,
  UNIQUE ("groupId", "userId", permission)
);

CREATE TABLE IF NOT EXISTS "GroupMessages" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" UUID NOT NULL REFERENCES "Groups"(id) ON DELETE CASCADE,
  "topicId" UUID REFERENCES "GroupTopics"(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "GroupPins" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" UUID NOT NULL REFERENCES "Groups"(id) ON DELETE CASCADE,
  "topicId" UUID REFERENCES "GroupTopics"(id) ON DELETE CASCADE,
  "messageId" UUID REFERENCES "GroupMessages"(id) ON DELETE CASCADE,
  "pinnedById" UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("groupId", "messageId")
);

CREATE INDEX IF NOT EXISTS group_members_user_idx ON "GroupMembers" ("userId");
CREATE INDEX IF NOT EXISTS group_topics_group_idx ON "GroupTopics" ("groupId");
CREATE INDEX IF NOT EXISTS group_messages_group_created_idx ON "GroupMessages" ("groupId", "createdAt");