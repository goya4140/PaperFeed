package com.example.paperfeed;

import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/** Per-paper local discussion demo. No account or network transport is implied. */
public class DiscussionActivity extends BaseActivity {
    private Paper paper;
    private EditText author, message;
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (!ready()) return;
        paper=repository.find(getIntent().getStringExtra("paper_id"));
        if (paper==null) { finish(); return; }
        setContentView(R.layout.activity_discussion); applyInsets();
        ((TextView)findViewById(R.id.discussion_paper)).setText(paper.name);
        findViewById(R.id.discussion_back).setOnClickListener(v -> finish());
        author=findViewById(R.id.discussion_author);
        message=findViewById(R.id.discussion_input);
        author.setText(getPreferences(MODE_PRIVATE).getString("author", ""));
        findViewById(R.id.discussion_send).setOnClickListener(v -> publish());
        render();
    }
    private void publish() {
        if (message.getText().toString().trim().isEmpty()) {
            message.setError(getString(R.string.discussion_required)); return;
        }
        try {
            store.addDiscussion(paper.id,author.getText().toString(),message.getText().toString());
        } catch (Exception error) { toast(getString(R.string.discussion_error)); return; }
        getPreferences(MODE_PRIVATE).edit().putString("author",author.getText().toString().trim()).apply();
        message.setText(""); message.clearFocus();
        ((InputMethodManager)getSystemService(INPUT_METHOD_SERVICE)).hideSoftInputFromWindow(message.getWindowToken(),0);
        render();
        ((android.widget.ScrollView)findViewById(R.id.discussion_scroll)).smoothScrollTo(0,0);
        toast(getString(R.string.discussion_success));
    }
    private void render() {
        List<ReadingStore.Discussion> entries=store.discussions(paper.id);
        ((TextView)findViewById(R.id.discussion_count)).setText(getString(R.string.discussion_count,entries.size()));
        findViewById(R.id.discussion_empty).setVisibility(entries.isEmpty()?View.VISIBLE:View.GONE);
        LinearLayout list=findViewById(R.id.discussion_list); list.removeAllViews();
        SimpleDateFormat date=new SimpleDateFormat("MM-dd HH:mm",Locale.CHINA);
        for (ReadingStore.Discussion entry:entries) {
            View card=getLayoutInflater().inflate(R.layout.item_discussion,list,false);
            ((TextView)card.findViewById(R.id.comment_author)).setText(entry.author);
            ((TextView)card.findViewById(R.id.comment_time)).setText(date.format(new Date(entry.createdAt)));
            ((TextView)card.findViewById(R.id.comment_body)).setText(entry.body);
            list.addView(card);
        }
    }
}
