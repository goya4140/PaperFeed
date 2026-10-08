import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const researchSpaces = sqliteTable('research_spaces', {
  owner: text('owner').primaryKey(),
  data: text('data').notNull(),
  revision: integer('revision').notNull().default(1),
  updatedAt: text('updated_at').notNull(),
});
