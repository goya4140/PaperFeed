package com.example.paperfeed;

import android.content.Context;
import android.content.Intent;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import static androidx.test.espresso.Espresso.closeSoftKeyboard;
import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.action.ViewActions.replaceText;
import static androidx.test.espresso.action.ViewActions.scrollTo;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.withId;
import static androidx.test.espresso.matcher.ViewMatchers.withText;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class PaperFeedAcceptanceTest {
    private Context context() { return InstrumentationRegistry.getInstrumentation().getTargetContext(); }

    @Test public void bundledContentHasTwelveUniqueAttributedEntries() throws Exception {
        PaperRepository repository = new PaperRepository(context());
        assertEquals(12, repository.all().size());
        Set<String> ids = new HashSet<>(); int academic = 0;
        for (Paper paper : repository.all()) {
            assertTrue(ids.add(paper.id)); assertTrue(paper.url.startsWith("https://"));
            assertFalse(paper.question.isEmpty()); assertFalse(paper.caution.isEmpty());
            assertEquals(4, paper.steps.split("\\|").length);
            if (paper.type.equals("论文")) academic++;
        }
        assertEquals(8, academic);
    }

    @Test public void searchFindsAuthorAndTitleCaseInsensitively() throws Exception {
        PaperRepository repository = new PaperRepository(context());
        List<Paper> result = Recommendation.filter(repository.all(), "  mEmGpT  ", "全部", Collections.emptySet(), Collections.emptySet(), Collections.emptySet(), Collections.emptySet(), false);
        assertEquals(1, result.size()); assertEquals("2310.08560", result.get(0).id);
        result = Recommendation.filter(repository.all(), "Gonzalez", "全部", Collections.emptySet(), Collections.emptySet(), Collections.emptySet(), Collections.emptySet(), false);
        assertEquals(1, result.size());
        assertTrue(repository.find("2310.08560").matches("Joseph E. Gonzalez"));
    }

    @Test public void recommendationRespectsInterestsAndNegativeFeedback() throws Exception {
        PaperRepository repository = new PaperRepository(context());
        List<Paper> result = Recommendation.filter(repository.all(), "", "全部", new HashSet<>(Arrays.asList("Agent 记忆")), Collections.emptySet(), Collections.singleton("2303.11366"), Collections.emptySet(), false);
        assertEquals("2310.08560", result.get(0).id);
        assertEquals("2303.11366", result.get(result.size() - 1).id);
        assertEquals(12, result.size());
        result = Recommendation.filter(repository.all(), "", "具身智能", Collections.emptySet(), Collections.emptySet(), Collections.emptySet(), Collections.emptySet(), true);
        assertEquals(2, result.size()); assertEquals("gemini-robotics", result.get(0).id);
    }

    @Test public void notesAndReadingStateSurviveDatabaseReopen() {
        String database = "paperfeed-acceptance-only.db", preferences = "paperfeed-acceptance-only";
        ReadingStore first = new ReadingStore(context(), database, preferences);
        first.favorite("fixture", true); first.read("fixture", true);
        first.note("fixture", "课程验证：记忆与反馈\n中文笔记可以跨重启保留。");
        first.folder("fixture", "课程参考"); first.feedback("fixture", -1);
        first.interests(Collections.singleton("高效模型")); first.close();
        ReadingStore second = new ReadingStore(context(), database, preferences);
        ReadingStore.State state = second.get("fixture");
        assertTrue(state.favorite); assertTrue(state.read);
        assertEquals("课程参考", state.folder); assertEquals(-1, state.feedback);
        assertTrue(state.note.contains("中文笔记")); assertTrue(second.interests().contains("高效模型"));
        second.close();
    }

    @Test public void exportContainsNotesAndRealSourceCitations() throws Exception {
        ReadingStore isolated = new ReadingStore(context(), "paperfeed-export-only.db", "paperfeed-export-only");
        Paper paper = new PaperRepository(context()).find("2303.11366");
        isolated.note(paper.id, "我的课程笔记"); isolated.favorite(paper.id, true);
        String markdown = ExportFormatter.markdown(Collections.singletonList(paper), isolated);
        assertTrue(markdown.contains("我的课程笔记")); assertTrue(markdown.contains(paper.url));
        String bibtex = ExportFormatter.bibtex(Collections.singletonList(paper));
        assertTrue(bibtex.contains("eprint = {2303.11366}")); assertTrue(bibtex.contains("archivePrefix = {arXiv}"));
        Paper blog = new PaperRepository(context()).find("effective-agents");
        assertFalse(ExportFormatter.bibtex(Collections.singletonList(blog)).contains("archivePrefix"));
        isolated.close();
    }

    @Test public void detailEditsPersistAcrossActivityRecreation() {
        ReadingStore originalStore = new ReadingStore(context());
        String id = "2303.11366"; ReadingStore.State original = originalStore.get(id);
        Intent intent = new Intent(context(), DetailActivity.class).putExtra("paper_id", id);
        try (ActivityScenario<DetailActivity> scenario = ActivityScenario.launch(intent)) {
            onView(withId(R.id.favorite_button)).perform(click());
            onView(withId(R.id.favorite_button)).check(matches(withText(original.favorite ? "加入收藏" : "已收藏 ✓")));
            onView(withId(R.id.read_button)).perform(click());
            onView(withId(R.id.note_input)).perform(scrollTo(), replaceText("课程验证：反馈可以成为记忆。"));
            closeSoftKeyboard();
            onView(withId(R.id.save_note)).perform(scrollTo(), click());
            scenario.recreate();
            onView(withId(R.id.note_input)).check(matches(withText("课程验证：反馈可以成为记忆。")));
            scenario.onActivity(activity -> activity.setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
            onView(withId(R.id.favorite_button)).check(matches(withText(original.favorite ? "加入收藏" : "已收藏 ✓")));
            scenario.onActivity(activity -> activity.setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
            assertEquals(!original.favorite, originalStore.get(id).favorite);
            assertEquals(!original.read, originalStore.get(id).read);
        } finally {
            originalStore.note(id, original.note); originalStore.favorite(id, original.favorite);
            originalStore.read(id, original.read); originalStore.close();
        }
    }

    @Test public void discoverSearchAndNavigationSurviveRecreation() {
        ReadingStore store = new ReadingStore(context());
        // Read-only defaults are accepted for the UI test, just as in the first-run dialog.
        if (!store.onboarded()) store.interests(store.interests());
        store.close();
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            onView(withId(R.id.search_input)).perform(scrollTo(), replaceText("MemGPT"));
            closeSoftKeyboard();
            onView(withId(R.id.card_name)).check(matches(withText("MemGPT")));
            scenario.recreate();
            onView(withId(R.id.search_input)).check(matches(withText("MemGPT")));
            onView(withId(R.id.nav_library)).perform(click());
            onView(withId(R.id.library_summary)).check(matches(isDisplayed()));
            onView(withId(R.id.nav_profile)).perform(click());
            onView(withId(R.id.stat_read)).check(matches(isDisplayed()));
            onView(withId(R.id.nav_explore)).perform(click());
            onView(withId(R.id.manage_interests)).perform(scrollTo(), click());
            onView(withText("保存兴趣")).perform(click());
        }
    }

    @Test public void voiceInitializationHasABoundedFallback() {
        Intent intent = new Intent(context(), DetailActivity.class).putExtra("paper_id", "2310.08560");
        try (ActivityScenario<DetailActivity> scenario = ActivityScenario.launch(intent)) {
            onView(withId(R.id.speech_button)).perform(scrollTo(), click());
            onView(withId(R.id.speech_button)).perform(new androidx.test.espresso.ViewAction() {
                @Override public org.hamcrest.Matcher<android.view.View> getConstraints() { return isDisplayed(); }
                @Override public String getDescription() { return "wait for device voice readiness or the eight-second fallback"; }
                @Override public void perform(androidx.test.espresso.UiController ui, android.view.View view) { ui.loopMainThreadForAtLeast(9500); }
            });
            scenario.onActivity(activity -> {
                String label = ((android.widget.TextView) activity.findViewById(R.id.speech_button)).getText().toString();
                assertTrue(label.equals("朗读解读") || label.equals("停止朗读"));
            });
        }
    }
}
