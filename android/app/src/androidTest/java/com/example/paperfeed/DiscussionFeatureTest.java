package com.example.paperfeed;

import android.content.Context;
import android.content.Intent;
import android.database.sqlite.SQLiteDatabase;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.File;
import java.io.FileOutputStream;
import static org.junit.Assert.*;
import static androidx.test.espresso.Espresso.*;
import static androidx.test.espresso.action.ViewActions.*;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.*;

@RunWith(AndroidJUnit4.class)
public class DiscussionFeatureTest {
    private Context context() { return InstrumentationRegistry.getInstrumentation().getTargetContext(); }
    @Test public void upgradePreservesNotesAndSeparatesPersistentDiscussions() {
        String database="discussion-migration-"+System.nanoTime()+".db";
        SQLiteDatabase old=SQLiteDatabase.openOrCreateDatabase(context().getDatabasePath(database),null);
        old.execSQL("CREATE TABLE reading_state (paper_id TEXT PRIMARY KEY, favorite INTEGER NOT NULL DEFAULT 0, read_flag INTEGER NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT '', folder TEXT NOT NULL DEFAULT '未分组', feedback INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT 0)");
        old.execSQL("INSERT INTO reading_state(paper_id,favorite,note) VALUES('paper-a',1,'升级前的私人笔记')");
        old.setVersion(1); old.close();
        ReadingStore store=new ReadingStore(context(),database,"discussion-test");
        assertEquals("升级前的私人笔记",store.get("paper-a").note);
        assertTrue(store.get("paper-a").favorite);
        store.addDiscussion("paper-a","我","第一个问题");
        store.addDiscussion("paper-a","我","第二个问题");
        store.addDiscussion("paper-b","","另一篇论文的留言"); store.close();
        store=new ReadingStore(context(),database,"discussion-test");
        assertEquals(2,store.discussions("paper-a").size());
        assertEquals("第二个问题",store.discussions("paper-a").get(0).body);
        assertEquals(1,store.discussions("paper-b").size());
        assertEquals("我",store.discussions("paper-b").get(0).author);
        assertTrue(store.discussions("paper-c").isEmpty()); store.close();
    }
    @Test public void blankMessagesAreRejected() {
        ReadingStore store=new ReadingStore(context(),"discussion-validation-"+System.nanoTime()+".db","discussion-test");
        try {
            store.addDiscussion("paper-a","我","  \n  "); fail("Blank message should be rejected");
        } catch (IllegalArgumentException expected) { assertTrue(store.discussions("paper-a").isEmpty()); }
        finally { store.close(); }
    }
    @Test public void postingSurvivesActivityRecreation() throws Exception {
        Intent intent=new Intent(context(),DiscussionActivity.class).putExtra("paper_id","2303.11366");
        String sample="课程演示：把失败经验保存下来，可以帮助智能体改进下一次尝试。";
        try(ActivityScenario<DiscussionActivity> scenario=ActivityScenario.launch(intent)) {
            onView(withId(R.id.discussion_paper)).check(matches(withText("Reflexion")));
            onView(withId(R.id.discussion_send)).perform(click());
            onView(withId(R.id.discussion_input)).check(matches(hasErrorText("请先输入留言内容")));
            onView(withId(R.id.discussion_author)).perform(replaceText("演示同学"));
            onView(withId(R.id.discussion_input)).perform(replaceText(sample)); androidx.test.espresso.Espresso.closeSoftKeyboard();
            onView(withId(R.id.discussion_send)).perform(click());
            scenario.recreate();
            onView(withId(R.id.discussion_list)).check(matches(hasDescendant(withText(sample))));
            File folder=new File(context().getExternalFilesDir(null),"verification"); folder.mkdirs();
            try(FileOutputStream stream=new FileOutputStream(new File(folder,"discussion.png"))) {
                android.graphics.Bitmap bitmap=InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();
                assertNotNull(bitmap); bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG,100,stream);
            }
        }
    }
    @Test public void detailOpensItsOwnDiscussion() {
        Intent intent=new Intent(context(),DetailActivity.class).putExtra("paper_id","2310.08560");
        try(ActivityScenario<DetailActivity> scenario=ActivityScenario.launch(intent)) {
            onView(withId(R.id.discussion_button)).perform(scrollTo(),click());
            onView(withId(R.id.discussion_paper)).check(matches(withText("MemGPT")));
            onView(withId(R.id.discussion_back)).perform(click());
        }
    }
}
