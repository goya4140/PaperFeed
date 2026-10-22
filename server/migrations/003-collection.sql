CREATE TABLE collection_runs(id TEXT PRIMARY KEY,sourceKey TEXT NOT NULL,query TEXT NOT NULL,topic TEXT NOT NULL,pageSize INTEGER NOT NULL,nextStart INTEGER NOT NULL DEFAULT 0,total INTEGER,status TEXT NOT NULL DEFAULT 'pending',processed INTEGER NOT NULL DEFAULT 0,changed INTEGER NOT NULL DEFAULT 0,error TEXT,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);
CREATE INDEX collection_source ON collection_runs(sourceKey,createdAt DESC);
CREATE TABLE collection_watermarks(sourceKey TEXT PRIMARY KEY,updatedThrough TEXT NOT NULL);
CREATE TABLE source_limits(source TEXT PRIMARY KEY,nextRequestAt INTEGER NOT NULL);
ALTER TABLE source_limits ADD COLUMN owner TEXT;
ALTER TABLE source_limits ADD COLUMN leaseUntil INTEGER;
CREATE TABLE collection_schedule(sourceKey TEXT PRIMARY KEY,lastAttemptAt INTEGER NOT NULL);
