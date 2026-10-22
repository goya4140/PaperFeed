ALTER TABLE tasks ADD COLUMN activeKey TEXT;
CREATE UNIQUE INDEX task_active_key ON tasks(activeKey) WHERE status IN ('pending','processing');
CREATE TABLE task_events(id INTEGER PRIMARY KEY AUTOINCREMENT,taskId TEXT NOT NULL REFERENCES tasks(id),event TEXT NOT NULL,attempt INTEGER NOT NULL,message TEXT,createdAt TEXT NOT NULL);
