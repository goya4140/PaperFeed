package com.example.paperfeed;

import android.content.Intent;
import android.content.res.ColorStateList;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.content.ContextCompat;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

public class MainActivity extends BaseActivity {
    private int tab = R.id.nav_discover, libraryFilter;
    private String discoverQuery = "", libraryQuery = "", topic = "全部", folder = "全部分组";
    private boolean newest;
    private View page;
    private BottomNavigationView navigation;
    private OnBackPressedCallback backCallback;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (!ready()) return;
        if (state != null) {
            tab = state.getInt("tab", tab); libraryFilter = state.getInt("library_filter");
            discoverQuery = state.getString("discover_query", ""); libraryQuery = state.getString("library_query", "");
            topic = state.getString("topic", "全部"); folder = state.getString("folder", "全部分组");
            newest = state.getBoolean("newest");
        }
        setContentView(R.layout.activity_main); applyInsets();
        navigation = findViewById(R.id.bottom_nav);
        navigation.setOnItemSelectedListener(item -> {
            boolean changed = tab != item.getItemId();
            tab = item.getItemId();
            if (changed) hideKeyboard();
            renderPage(false);
            if (backCallback != null) backCallback.setEnabled(tab != R.id.nav_discover);
            return true;
        });
        navigation.setSelectedItemId(tab);
        backCallback = new OnBackPressedCallback(tab != R.id.nav_discover) {
            @Override public void handleOnBackPressed() { navigation.setSelectedItemId(R.id.nav_discover); }
        };
        getOnBackPressedDispatcher().addCallback(this, backCallback);
        if (!store.onboarded() && state == null) findViewById(R.id.main).post(() -> interests(true));
    }

    @Override protected void onResume() { super.onResume(); if (page != null && ready()) renderPage(true); }

    private void renderPage(boolean retainScroll) {
        int scroll = 0;
        if (retainScroll && page instanceof ScrollView) scroll = page.getScrollY();
        int layout = tab == R.id.nav_discover ? R.layout.page_discover
                : tab == R.id.nav_explore ? R.layout.page_explore
                : tab == R.id.nav_library ? R.layout.page_library : R.layout.page_profile;
        FrameLayout container = findViewById(R.id.page_container);
        container.removeAllViews();
        page = getLayoutInflater().inflate(layout, container, false); container.addView(page);
        if (tab == R.id.nav_discover) setupDiscover();
        else if (tab == R.id.nav_explore) setupExplore();
        else if (tab == R.id.nav_library) setupLibrary();
        else setupProfile();
        final int position = scroll;
        if (position > 0) page.post(() -> { if (page instanceof ScrollView) ((ScrollView) page).scrollTo(0, position); });
    }

    private void setupDiscover() {
        setupSearch(discoverQuery, false);
        List<String> topics = new ArrayList<>(); topics.add("全部"); topics.addAll(Arrays.asList(PaperRepository.TOPICS));
        chips(topics, topic, selected -> { topic = selected; setupDiscoverChips(); populateDiscover(); });
        TextView sort = page.findViewById(R.id.sort_button);
        sort.setText(newest ? "年份优先 ↓" : "兴趣优先 ↓");
        sort.setOnClickListener(view -> {
            newest = !newest; sort.setText(newest ? "年份优先 ↓" : "兴趣优先 ↓"); populateDiscover();
        });
        populateDiscover();
    }

    private void setupDiscoverChips() {
        List<String> topics = new ArrayList<>(); topics.add("全部"); topics.addAll(Arrays.asList(PaperRepository.TOPICS));
        chips(topics, topic, selected -> { topic = selected; setupDiscoverChips(); populateDiscover(); });
    }

    private void setupSearch(String value, boolean library) {
        EditText input = page.findViewById(R.id.search_input);
        input.setText(value);
        if (library) input.setHint("搜索收藏、笔记或论文");
        input.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (library) { libraryQuery = s.toString(); populateLibrary(); }
                else { discoverQuery = s.toString(); populateDiscover(); }
            }
            @Override public void afterTextChanged(Editable s) {}
        });
        input.setOnEditorActionListener((view, actionId, event) -> { hideKeyboard(); input.clearFocus(); return true; });
    }

    private void populateDiscover() {
        Set<String> likes = new HashSet<>(), less = new HashSet<>(), saved = new HashSet<>();
        for (Paper paper : repository.all()) {
            ReadingStore.State state = store.get(paper.id);
            if (state.feedback > 0) likes.add(paper.id);
            if (state.feedback < 0) less.add(paper.id);
            if (state.favorite) saved.add(paper.id);
        }
        List<Paper> papers = Recommendation.filter(repository.all(), discoverQuery, topic, store.interests(), likes, less, saved, newest);
        ((TextView) page.findViewById(R.id.result_label)).setText(papers.size() + " 条内容 · " + (newest ? "按原始发布年份排序" : "依据兴趣与个人反馈排序"));
        renderCards(papers, false);
    }

    private void setupExplore() {
        LinearLayout list = page.findViewById(R.id.topic_list);
        String[] descriptions = {"经验如何留下来，又如何被重新想起？", "让思考、工具与行动形成闭环。", "从生成代码，走向理解与修复项目。", "寻找模型能力与计算成本的平衡。", "把语言与感知，连接到物理行动。"};
        Set<String> interests = store.interests();
        for (int i = 0; i < PaperRepository.TOPICS.length; i++) {
            String direction = PaperRepository.TOPICS[i]; int count = 0;
            for (Paper paper : repository.all()) if (paper.topic.equals(direction)) count++;
            View item = getLayoutInflater().inflate(R.layout.item_topic, list, false);
            ((TextView) item.findViewById(R.id.topic_number)).setText("DIRECTION / 0" + (i + 1));
            ((TextView) item.findViewById(R.id.topic_name)).setText(direction);
            ((TextView) item.findViewById(R.id.topic_description)).setText(descriptions[i]);
            ((TextView) item.findViewById(R.id.topic_count)).setText(count + " 条精选内容" + (interests.contains(direction) ? " · 已加入兴趣" : "") + "    ↗");
            item.setOnClickListener(view -> { topic = direction; discoverQuery = ""; navigation.setSelectedItemId(R.id.nav_discover); });
            list.addView(item);
        }
        page.findViewById(R.id.manage_interests).setOnClickListener(view -> interests(false));
    }

    private void setupLibrary() {
        setupSearch(libraryQuery, true);
        libraryChips();
        page.findViewById(R.id.folder_filter).setOnClickListener(view -> {
            TreeSet<String> folders = new TreeSet<>(); folders.add("未分组");
            for (Paper paper : repository.all()) folders.add(store.get(paper.id).folder);
            List<String> choices = new ArrayList<>(); choices.add("全部分组"); choices.addAll(folders);
            new MaterialAlertDialogBuilder(this).setTitle("按收藏分组查看")
                    .setItems(choices.toArray(new String[0]), (dialog, which) -> { folder = choices.get(which); populateLibrary(); }).show();
        });
        populateLibrary();
    }

    private void libraryChips() {
        List<String> filters = Arrays.asList("全部记录", "我的收藏", "有笔记", "已读");
        chips(filters, filters.get(libraryFilter), selected -> { libraryFilter = filters.indexOf(selected); libraryChips(); populateLibrary(); });
    }

    private void populateLibrary() {
        List<Paper> papers = new ArrayList<>();
        String needle = libraryQuery.trim().toLowerCase(java.util.Locale.ROOT);
        for (Paper paper : repository.all()) {
            ReadingStore.State state = store.get(paper.id);
            boolean active = state.favorite || state.read || !state.note.isEmpty();
            boolean filter = libraryFilter == 0 ? active : libraryFilter == 1 ? state.favorite
                    : libraryFilter == 2 ? !state.note.isEmpty() : state.read;
            if (filter && (folder.equals("全部分组") || folder.equals(state.folder))
                    && (paper.matches(needle) || state.note.toLowerCase(java.util.Locale.ROOT).contains(needle))) papers.add(paper);
        }
        ((TextView) page.findViewById(R.id.library_summary)).setText(store.count("favorite = 1") + " 篇收藏  /  "
                + store.count("note <> ''") + " 篇笔记  /  " + store.count("read_flag = 1") + " 篇已读");
        ((TextView) page.findViewById(R.id.result_label)).setText(papers.size() + " 条记录");
        ((TextView) page.findViewById(R.id.folder_filter)).setText(folder + " ▾");
        renderCards(papers, true);
    }

    private void renderCards(List<Paper> papers, boolean library) {
        LinearLayout list = page.findViewById(R.id.paper_list); list.removeAllViews();
        if (papers.isEmpty()) {
            TextView empty = new TextView(this); empty.setTextAppearance(R.style.PF_Body);
            boolean filtered = library ? !libraryQuery.isEmpty() || libraryFilter != 0 || !folder.equals("全部分组")
                    : !discoverQuery.isEmpty() || !topic.equals("全部");
            empty.setText(filtered ? "没有找到匹配的内容\n点击这里清除筛选，重新发现。" : "这里将收好你的每一次发现。\n收藏论文或写下笔记后，就能在这里找到。\n\n去发现内容  ↗");
            empty.setPadding(dp(22), dp(32), dp(22), dp(32)); empty.setBackgroundResource(R.drawable.bg_soft);
            empty.setOnClickListener(view -> {
                if (filtered) {
                    if (library) { libraryQuery = ""; libraryFilter = 0; folder = "全部分组"; }
                    else { discoverQuery = ""; topic = "全部"; }
                    renderPage(false);
                } else navigation.setSelectedItemId(R.id.nav_discover);
            });
            list.addView(empty); return;
        }
        Set<String> interests = store.interests();
        for (Paper paper : papers) {
            ReadingStore.State state = store.get(paper.id);
            View card = getLayoutInflater().inflate(R.layout.item_paper, list, false);
            card.setTag("paper:" + paper.id);
            ((TextView) card.findViewById(R.id.card_topic)).setText(paper.topic);
            ((TextView) card.findViewById(R.id.card_meta)).setText(paper.type + " · " + paper.year + " · " + paper.minutes + " 分钟");
            ((TextView) card.findViewById(R.id.card_name)).setText(paper.name);
            ((TextView) card.findViewById(R.id.card_summary)).setText(paper.summary);
            String reason = library ? state.folder + (state.read ? " · 已读" : " · 待读")
                    : state.feedback < 0 ? "已降低推荐优先级" : state.feedback > 0 ? "你想多看这类内容"
                    : interests.contains(paper.topic) ? "来自你的研究兴趣" : "探索兴趣之外的灵感";
            ((TextView) card.findViewById(R.id.card_reason)).setText(reason);
            if (library && !state.note.isEmpty()) {
                TextView note = card.findViewById(R.id.card_note); note.setVisibility(View.VISIBLE); note.setText("我的笔记 · " + state.note);
            }
            ImageButton save = card.findViewById(R.id.card_save);
            save.setImageTintList(ColorStateList.valueOf(ContextCompat.getColor(this, state.favorite ? R.color.forest : R.color.muted)));
            save.setSelected(state.favorite); save.setAlpha(state.favorite ? 1f : 0.7f);
            save.setContentDescription((state.favorite ? "取消收藏 " : "收藏 ") + paper.name);
            save.setOnClickListener(view -> {
                boolean value = !store.get(paper.id).favorite; store.favorite(paper.id, value);
                toast(value ? "已加入收藏" : "已取消收藏");
                if (library) populateLibrary(); else populateDiscover();
            });
            card.setOnClickListener(view -> startActivity(new Intent(this, DetailActivity.class).putExtra("paper_id", paper.id)));
            list.addView(card);
        }
    }

    private void setupProfile() {
        ((TextView) page.findViewById(R.id.stat_read)).setText(store.count("read_flag = 1") + "\n已读");
        ((TextView) page.findViewById(R.id.stat_saved)).setText(store.count("favorite = 1") + "\n收藏");
        ((TextView) page.findViewById(R.id.stat_notes)).setText(store.count("note <> ''") + "\n笔记");
        List<String> selected = new ArrayList<>();
        for (String interest : PaperRepository.TOPICS) if (store.interests().contains(interest)) selected.add(interest);
        ((TextView) page.findViewById(R.id.interests_summary)).setText(android.text.TextUtils.join("  /  ", selected));
        page.findViewById(R.id.manage_interests).setOnClickListener(view -> interests(false));
        page.findViewById(R.id.export_markdown).setOnClickListener(view -> exportLibrary(false));
        page.findViewById(R.id.export_bibtex).setOnClickListener(view -> exportLibrary(true));
        page.findViewById(R.id.about_button).setOnClickListener(view -> new MaterialAlertDialogBuilder(this)
                .setTitle("PaperFeed · 好奇心的下一站")
                .setMessage("Java / XML 原生安卓离线课程版\n\n内置 8 篇论文与 4 篇官方文章的学习摘要。所有内容均随安装包提供。\n\n收藏、阅读记录、分组与笔记保存在本机 SQLite 数据库；兴趣保存在本机偏好设置。卸载或清除应用数据会失去这些记录，请先导出。\n\n推荐使用可解释的兴趣与反馈规则。朗读依赖设备已安装的离线中文语音。\n\n本版没有账号、云同步或真人社区。")
                .setPositiveButton("继续探索", null).show());
    }

    private void exportLibrary(boolean bibtex) {
        List<Paper> papers = new ArrayList<>();
        for (Paper paper : repository.all()) {
            ReadingStore.State state = store.get(paper.id);
            if (state.favorite || state.read || !state.note.isEmpty()) papers.add(paper);
        }
        if (papers.isEmpty()) { toast("先收藏论文或写一条笔记，再导出知识库"); return; }
        export(bibtex ? ExportFormatter.bibtex(papers) : ExportFormatter.markdown(papers, store), bibtex, "PaperFeed-library");
    }

    private interface Selection { void pick(String value); }
    private void chips(List<String> labels, String selected, Selection callback) {
        LinearLayout row = page.findViewById(R.id.filter_chips); row.removeAllViews();
        for (String label : labels) {
            TextView chip = new TextView(this); chip.setText(label); chip.setTextSize(12);
            boolean active = selected.equals(label);
            chip.setBackgroundResource(active ? R.drawable.bg_chip_on : R.drawable.bg_chip_off);
            chip.setTextColor(ContextCompat.getColor(this, active ? R.color.white : R.color.muted));
            chip.setPadding(dp(15), dp(13), dp(15), dp(13));
            chip.setSelected(active); chip.setContentDescription(label + (active ? "，已选中" : ""));
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            params.setMarginEnd(dp(8)); row.addView(chip, params);
            chip.setOnClickListener(view -> callback.pick(label));
        }
    }

    private void interests(boolean onboarding) {
        Set<String> chosen = store.interests(); boolean[] checks = new boolean[PaperRepository.TOPICS.length];
        for (int i = 0; i < checks.length; i++) checks[i] = chosen.contains(PaperRepository.TOPICS[i]);
        androidx.appcompat.app.AlertDialog dialog = new MaterialAlertDialogBuilder(this)
                .setTitle(onboarding ? "从你的好奇心开始" : "调整研究兴趣")
                .setMultiChoiceItems(PaperRepository.TOPICS, checks, (whichDialog, which, checked) -> checks[which] = checked)
                .setPositiveButton(onboarding ? "开始探索" : "保存兴趣", null)
                .setCancelable(!onboarding).create();
        if (!onboarding) dialog.setButton(android.content.DialogInterface.BUTTON_NEGATIVE, "取消", (d, which) -> d.dismiss());
        dialog.setOnShowListener(ignored -> dialog.getButton(android.content.DialogInterface.BUTTON_POSITIVE).setOnClickListener(view -> {
            Set<String> values = new HashSet<>();
            for (int i = 0; i < checks.length; i++) if (checks[i]) values.add(PaperRepository.TOPICS[i]);
            if (values.isEmpty()) { toast("至少选择一个感兴趣的方向"); return; }
            try { store.interests(values); dialog.dismiss(); renderPage(true); }
            catch (Exception error) { toast("兴趣保存失败，请重试"); }
        }));
        dialog.show();
    }

    private void hideKeyboard() {
        View focus = getCurrentFocus();
        if (focus != null) {
            ((InputMethodManager) getSystemService(INPUT_METHOD_SERVICE)).hideSoftInputFromWindow(focus.getWindowToken(), 0);
            focus.clearFocus();
        }
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state); state.putInt("tab", tab); state.putInt("library_filter", libraryFilter);
        state.putString("discover_query", discoverQuery); state.putString("library_query", libraryQuery);
        state.putString("topic", topic); state.putString("folder", folder); state.putBoolean("newest", newest);
    }
}
