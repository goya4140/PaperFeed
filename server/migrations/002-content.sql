CREATE TABLE topics(id TEXT PRIMARY KEY,name TEXT NOT NULL,description TEXT NOT NULL,prompt TEXT NOT NULL DEFAULT '');
CREATE TABLE papers(id TEXT PRIMARY KEY,topic TEXT NOT NULL REFERENCES topics(id),source TEXT NOT NULL,sourceId TEXT NOT NULL,latestVersion INTEGER NOT NULL DEFAULT 1,publishedAt TEXT NOT NULL,updatedAt TEXT NOT NULL,ingestedAt TEXT NOT NULL,visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','withdrawn')),featured INTEGER NOT NULL DEFAULT 0,data TEXT NOT NULL,UNIQUE(source,sourceId));
CREATE TABLE paper_versions(paperId TEXT NOT NULL REFERENCES papers(id),version INTEGER NOT NULL,updatedAt TEXT NOT NULL,ingestedAt TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(paperId,version));
CREATE TABLE interpretations(id TEXT PRIMARY KEY,paperId TEXT NOT NULL REFERENCES papers(id),paperVersion INTEGER NOT NULL,status TEXT NOT NULL CHECK(status IN ('draft','published','withdrawn')),data TEXT NOT NULL,provenance TEXT NOT NULL DEFAULT '{}',createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL,publishedAt TEXT);
CREATE UNIQUE INDEX one_published_interpretation ON interpretations(paperId) WHERE status='published';
CREATE TABLE tasks(id TEXT PRIMARY KEY,kind TEXT NOT NULL,dedupeKey TEXT NOT NULL UNIQUE,payload TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','succeeded','failed')),attempts INTEGER NOT NULL DEFAULT 0,maxAttempts INTEGER NOT NULL DEFAULT 3,availableAt INTEGER NOT NULL,leaseUntil INTEGER,owner TEXT,progress TEXT NOT NULL DEFAULT '{}',result TEXT,error TEXT,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);
CREATE INDEX tasks_available ON tasks(status,availableAt);
CREATE INDEX papers_date ON papers(publishedAt DESC,id);
CREATE TABLE content_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
