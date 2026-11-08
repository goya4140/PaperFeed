package com.example.paperfeed;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.core.content.ContextCompat;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class DetailActivity extends BaseActivity {
    private Paper paper;
    private EditText noteInput;
    private String savedNote;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable autoSave = () -> saveNote(false);
    private TextToSpeech speech;
    private boolean speaking, speechReady, speechPending, active;
    private int speechGeneration;
    private final Runnable speechTimeout = () -> {
        if (speechPending && !speechReady) {
            speechGeneration++;
            stopSpeech();
            if (speech != null) { speech.shutdown(); speech = null; }
            toast("设备语音服务暂未就绪，可继续阅读文字");
        }
    };

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (!ready()) return;
        paper = repository.find(getIntent().getStringExtra("paper_id"));
        if (paper == null) { toast("没有找到这篇内容"); finish(); return; }
        setContentView(R.layout.activity_detail); applyInsets();
        findViewById(R.id.detail_back).setOnClickListener(view -> finish());
        findViewById(R.id.detail_more).setOnClickListener(view -> more());
        text(R.id.detail_topic, paper.topic + " / " + paper.type);
        text(R.id.detail_name, paper.name); text(R.id.detail_title, paper.title);
        text(R.id.detail_meta, paper.year + " 年原始发布 · 约 " + paper.minutes + " 分钟 · 已内置离线解读");
        text(R.id.detail_authors, paper.authors.replace(" and ", " · "));
        text(R.id.detail_summary, paper.summary); text(R.id.detail_question, paper.question);
        text(R.id.detail_method, paper.method); text(R.id.detail_takeaway, paper.takeaway);
        text(R.id.detail_caution, paper.caution);
        text(R.id.source_link, "原始来源 ↗\n" + paper.url);
        findViewById(R.id.source_link).setOnClickListener(view -> source());
        LinearLayout steps = findViewById(R.id.flow_steps);
        int index = 1;
        for (String step : paper.steps.split("\\|")) {
            TextView item = new TextView(this); item.setTextAppearance(R.style.PF_Body);
            item.setText(String.format(Locale.ROOT, "%02d   %s", index++, step));
            item.setTextColor(ContextCompat.getColor(this, R.color.forest));
            item.setPadding(dp(16), dp(12), dp(16), dp(12)); item.setBackgroundResource(R.drawable.bg_soft);
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            params.bottomMargin = dp(6); steps.addView(item, params);
        }
        noteInput = findViewById(R.id.note_input);
        savedNote = store.get(paper.id).note; noteInput.setText(savedNote);
        noteInput.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                handler.removeCallbacks(autoSave); handler.postDelayed(autoSave, 600);
                text(R.id.note_status, "正在保存到本机…");
            }
            @Override public void afterTextChanged(Editable s) {}
        });
        findViewById(R.id.save_note).setOnClickListener(view -> {
            saveNote(true);
            ((InputMethodManager) getSystemService(INPUT_METHOD_SERVICE)).hideSoftInputFromWindow(noteInput.getWindowToken(), 0);
            noteInput.clearFocus();
        });
        findViewById(R.id.read_button).setOnClickListener(view -> {
            store.read(paper.id, !store.get(paper.id).read); updateState();
        });
        findViewById(R.id.favorite_button).setOnClickListener(view -> {
            boolean favorite = !store.get(paper.id).favorite;
            store.favorite(paper.id, favorite); updateState(); toast(favorite ? "已加入收藏" : "已取消收藏");
        });
        findViewById(R.id.folder_button).setOnClickListener(view -> chooseFolder());
        findViewById(R.id.feedback_like).setOnClickListener(view -> feedback(1));
        findViewById(R.id.feedback_less).setOnClickListener(view -> feedback(-1));
        findViewById(R.id.speech_button).setOnClickListener(view -> toggleSpeech());
        findViewById(R.id.discussion_button).setOnClickListener(view -> startActivity(
                new Intent(this, DiscussionActivity.class).putExtra("paper_id", paper.id)));
        updateState();
    }

    private void text(int id, String value) { ((TextView) findViewById(id)).setText(value); }

    private void updateState() {
        ReadingStore.State state = store.get(paper.id);
        text(R.id.read_button, state.read ? "已读 ✓" : "标记已读");
        text(R.id.favorite_button, state.favorite ? "已收藏 ✓" : "加入收藏");
        findViewById(R.id.favorite_button).setSelected(state.favorite);
        findViewById(R.id.read_button).setSelected(state.read);
        text(R.id.folder_button, "收藏分组：" + state.folder);
        text(R.id.feedback_like, state.feedback == 1 ? "想多看 ✓" : "想多看");
        text(R.id.feedback_less, state.feedback == -1 ? "少推荐 ✓" : "少推荐");
        tintFeedback(R.id.feedback_like, state.feedback == 1);
        tintFeedback(R.id.feedback_less, state.feedback == -1);
    }

    private void tintFeedback(int id, boolean selected) {
        MaterialButton button = findViewById(id);
        button.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(this, selected ? R.color.mint : R.color.paper)));
        button.setSelected(selected);
    }

    private void feedback(int value) {
        store.feedback(paper.id, store.get(paper.id).feedback == value ? 0 : value);
        updateState(); toast("已更新你的个人推荐偏好");
    }

    private void saveNote(boolean notify) {
        handler.removeCallbacks(autoSave);
        if (noteInput == null || paper == null) return;
        String value = noteInput.getText().toString();
        try {
            if (!value.equals(savedNote)) { store.note(paper.id, value); savedNote = value; }
            text(R.id.note_status, value.isEmpty() ? "笔记仅保存在本机，输入后自动保存。" : "已保存在本机 · " + value.length() + " 字符");
            if (notify) toast("笔记已保存");
        } catch (Exception error) {
            text(R.id.note_status, "保存失败，文字仍在输入框中，请重试。");
            if (notify) toast("保存失败，请重试");
        }
    }

    private void chooseFolder() {
        Set<String> groups = new LinkedHashSet<>();
        Collections.addAll(groups, "未分组", "课程参考", "待读清单", "研究灵感");
        for (Paper item : repository.all()) groups.add(store.get(item.id).folder);
        List<String> labels = new ArrayList<>(groups); labels.add("＋ 新建分组");
        new MaterialAlertDialogBuilder(this).setTitle("选择收藏分组")
                .setItems(labels.toArray(new String[0]), (dialog, which) -> {
                    if (which == labels.size() - 1) newFolder(); else assignFolder(labels.get(which));
                }).setNegativeButton("取消", null).show();
    }

    private void newFolder() {
        EditText input = new EditText(this); input.setSingleLine(true); input.setHint("例如：毕业设计参考");
        input.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(24)});
        LinearLayout box = new LinearLayout(this); box.setPadding(dp(24), dp(4), dp(24), 0);
        box.addView(input, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        androidx.appcompat.app.AlertDialog dialog = new MaterialAlertDialogBuilder(this).setTitle("新建收藏分组")
                .setView(box).setPositiveButton("保存", null).setNegativeButton("取消", null).create();
        dialog.setOnShowListener(ignored -> dialog.getButton(android.content.DialogInterface.BUTTON_POSITIVE).setOnClickListener(view -> {
            String value = input.getText().toString().trim();
            if (value.isEmpty() || value.equals("全部分组")) { input.setError("请输入其他分组名称"); return; }
            assignFolder(value); dialog.dismiss();
        }));
        dialog.show();
    }

    private void assignFolder(String folder) {
        store.folder(paper.id, folder); store.favorite(paper.id, true);
        updateState(); toast("已收藏到「" + folder + "」");
    }

    private void more() {
        String[] actions = {"复制引用", "导出本篇笔记 · Markdown", "导出本篇引用 · BibTeX", "设置收藏分组", "在浏览器查看原始来源"};
        new MaterialAlertDialogBuilder(this).setTitle(paper.name).setItems(actions, (dialog, which) -> {
            saveNote(false);
            if (which == 0) {
                String citation = paper.authors + " (" + paper.year + "). " + paper.title + ". " + paper.url;
                ((ClipboardManager) getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText(paper.name, citation));
                toast("引用已复制");
            } else if (which == 1) export(ExportFormatter.markdown(Collections.singletonList(paper), store), false, paper.name.replaceAll("[^a-zA-Z0-9-]", "-") + "-notes");
            else if (which == 2) export(ExportFormatter.bibtex(Collections.singletonList(paper)), true, paper.name.replaceAll("[^a-zA-Z0-9-]", "-") + "-citation");
            else if (which == 3) chooseFolder();
            else source();
        }).show();
    }

    private void source() {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(paper.url))); }
        catch (android.content.ActivityNotFoundException error) { toast("未找到可以打开链接的浏览器"); }
    }

    private void toggleSpeech() {
        if (speaking || speechPending) { stopSpeech(); return; }
        if (speechReady) { speak(); return; }
        speechPending = true; text(R.id.speech_button, "正在准备设备语音…");
        if (speech != null) speech.shutdown();
        int generation = ++speechGeneration;
        handler.removeCallbacks(speechTimeout); handler.postDelayed(speechTimeout, 8000);
        speech = new TextToSpeech(getApplicationContext(), status -> {
            if (generation != speechGeneration || speech == null || isDestroyed()) return;
            handler.removeCallbacks(speechTimeout);
            if (status != TextToSpeech.SUCCESS || isFinishing() || isDestroyed()) {
                runOnUiThread(() -> { if (!isDestroyed()) { stopSpeech(); toast("设备语音服务暂不可用"); } }); return;
            }
            speech.setLanguage(Locale.SIMPLIFIED_CHINESE);
            Voice offline = null;
            Set<Voice> voices = speech.getVoices();
            if (voices != null) for (Voice voice : voices) {
                if (voice.getLocale().getLanguage().equals("zh") && !voice.isNetworkConnectionRequired()) {
                    offline = voice; break;
                }
            }
            if (offline == null || speech.setVoice(offline) != TextToSpeech.SUCCESS) {
                runOnUiThread(() -> { if (!isDestroyed()) { stopSpeech(); toast("设备尚未安装离线中文语音，可继续阅读文字"); } }); return;
            }
            speechReady = true; speech.setSpeechRate(0.95f);
            speech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) {}
                @Override public void onDone(String id) { runOnUiThread(() -> { if (!isDestroyed()) stopSpeech(); }); }
                @Override public void onError(String id) { runOnUiThread(() -> { if (!isDestroyed()) { stopSpeech(); toast("语音播放失败"); } }); }
            });
            runOnUiThread(() -> { if (active && speechPending && !isDestroyed()) speak(); });
        });
    }

    private void speak() {
        speechPending = false;
        int result = speech.speak(paper.narration(), TextToSpeech.QUEUE_FLUSH, null, paper.id);
        speaking = result == TextToSpeech.SUCCESS;
        text(R.id.speech_button, speaking ? "停止朗读" : "朗读解读");
        ((MaterialButton) findViewById(R.id.speech_button)).setIconResource(speaking ? R.drawable.ic_stop : R.drawable.ic_play);
        if (!speaking) toast("语音播放失败");
    }

    private void stopSpeech() {
        handler.removeCallbacks(speechTimeout);
        speechPending = false; speaking = false;
        if (speech != null) speech.stop();
        if (paper != null && findViewById(R.id.speech_button) != null) {
            text(R.id.speech_button, "朗读解读");
            ((MaterialButton) findViewById(R.id.speech_button)).setIconResource(R.drawable.ic_play);
        }
    }

    @Override protected void onResume() {
        super.onResume(); active = true;
        if (paper != null && findViewById(R.id.discussion_button) != null)
            text(R.id.discussion_button, getString(R.string.discussion_entry, store.discussions(paper.id).size()));
    }
    @Override protected void onPause() { active = false; saveNote(false); stopSpeech(); super.onPause(); }
    @Override protected void onDestroy() {
        speechGeneration++; handler.removeCallbacks(autoSave); handler.removeCallbacks(speechTimeout);
        if (speech != null) speech.shutdown(); super.onDestroy();
    }
}
