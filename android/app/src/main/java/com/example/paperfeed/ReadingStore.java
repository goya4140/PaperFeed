package com.example.paperfeed;

import android.content.ContentValues;
import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/** Offline user state. Structured reading data lives in SQLite; preferences hold interests. */
public final class ReadingStore extends SQLiteOpenHelper {
    private final SharedPreferences preferences;

    public ReadingStore(Context context) {
        this(context, "paperfeed.db", "paperfeed_preferences");
    }

    ReadingStore(Context context, String databaseName, String preferenceName) {
        super(context.getApplicationContext(), databaseName, null, 2);
        preferences = context.getApplicationContext().getSharedPreferences(preferenceName, Context.MODE_PRIVATE);
    }

    @Override public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE reading_state (paper_id TEXT PRIMARY KEY, favorite INTEGER NOT NULL DEFAULT 0, "
                + "read_flag INTEGER NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT '', "
                + "folder TEXT NOT NULL DEFAULT '未分组', feedback INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT 0)");
        createDiscussions(db);
    }

    @Override public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        if (oldVersion < 2) createDiscussions(db);
    }

    private static void createDiscussions(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS discussions (id INTEGER PRIMARY KEY AUTOINCREMENT, paper_id TEXT NOT NULL, author TEXT NOT NULL, body TEXT NOT NULL, created_at INTEGER NOT NULL)");
        db.execSQL("CREATE INDEX IF NOT EXISTS discussions_paper ON discussions(paper_id, id)");
    }

    public long addDiscussion(String paperId, String author, String body) {
        String content = body.trim();
        String name = author.trim();
        if (paperId.trim().isEmpty() || content.isEmpty() || content.length() > 1000 || name.length() > 20)
            throw new IllegalArgumentException("留言内容或昵称不符合要求");
        ContentValues values = new ContentValues();
        values.put("paper_id", paperId); values.put("author", name.isEmpty() ? "我" : name);
        values.put("body", content); values.put("created_at", System.currentTimeMillis());
        return getWritableDatabase().insertOrThrow("discussions", null, values);
    }

    public java.util.List<Discussion> discussions(String paperId) {
        java.util.List<Discussion> result = new java.util.ArrayList<>();
        try (Cursor c = getReadableDatabase().query("discussions", null, "paper_id = ?", new String[]{paperId}, null, null, "id DESC")) {
            while (c.moveToNext()) result.add(new Discussion(c.getLong(c.getColumnIndexOrThrow("id")),
                    c.getString(c.getColumnIndexOrThrow("author")), c.getString(c.getColumnIndexOrThrow("body")),
                    c.getLong(c.getColumnIndexOrThrow("created_at"))));
        }
        return result;
    }

    public static final class Discussion {
        public final long id, createdAt;
        public final String author, body;
        Discussion(long id, String author, String body, long createdAt) {
            this.id=id; this.author=author; this.body=body; this.createdAt=createdAt;
        }
    }

    public State get(String id) {
        try (Cursor cursor = getReadableDatabase().query("reading_state", null, "paper_id = ?", new String[]{id}, null, null, null)) {
            if (!cursor.moveToFirst()) return new State();
            State state = new State();
            state.favorite = cursor.getInt(cursor.getColumnIndexOrThrow("favorite")) == 1;
            state.read = cursor.getInt(cursor.getColumnIndexOrThrow("read_flag")) == 1;
            state.note = cursor.getString(cursor.getColumnIndexOrThrow("note"));
            state.folder = cursor.getString(cursor.getColumnIndexOrThrow("folder"));
            state.feedback = cursor.getInt(cursor.getColumnIndexOrThrow("feedback"));
            return state;
        }
    }

    private void update(String id, ContentValues values) {
        SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try {
            ContentValues initial = new ContentValues(); initial.put("paper_id", id);
            db.insertWithOnConflict("reading_state", null, initial, SQLiteDatabase.CONFLICT_IGNORE);
            values.put("updated_at", System.currentTimeMillis());
            db.update("reading_state", values, "paper_id = ?", new String[]{id});
            db.setTransactionSuccessful();
        } finally { db.endTransaction(); }
    }

    public void favorite(String id, boolean value) {
        ContentValues values = new ContentValues(); values.put("favorite", value ? 1 : 0); update(id, values);
    }
    public void read(String id, boolean value) {
        ContentValues values = new ContentValues(); values.put("read_flag", value ? 1 : 0); update(id, values);
    }
    public void note(String id, String value) {
        ContentValues values = new ContentValues(); values.put("note", value); update(id, values);
    }
    public void folder(String id, String value) {
        ContentValues values = new ContentValues(); values.put("folder", value); update(id, values);
    }
    public void feedback(String id, int value) {
        ContentValues values = new ContentValues(); values.put("feedback", value); update(id, values);
    }
    public int count(String where) {
        // where is always a fixed expression chosen by the application, never user input.
        try (Cursor cursor = getReadableDatabase().rawQuery("SELECT COUNT(*) FROM reading_state WHERE " + where, null)) {
            cursor.moveToFirst(); return cursor.getInt(0);
        }
    }
    public Set<String> interests() {
        return new HashSet<>(preferences.getStringSet("interests", new HashSet<>(Arrays.asList(PaperRepository.TOPICS[0], PaperRepository.TOPICS[1]))));
    }
    public void interests(Set<String> values) {
        if (!preferences.edit().putStringSet("interests", new HashSet<>(values)).putBoolean("onboarded", true).commit())
            throw new IllegalStateException("兴趣设置未能保存");
    }
    public boolean onboarded() { return preferences.getBoolean("onboarded", false); }

    public static final class State {
        public boolean favorite, read;
        public String note = "", folder = "未分组";
        public int feedback;
    }
}
