package com.example.paperfeed;

import org.json.JSONException;
import org.json.JSONObject;
import java.util.Locale;

/** A bundled research entry. The explanation is editorial, not a full paper translation. */
public final class Paper {
    public final String id, name, title, authors, topic, type, url, summary;
    public final String question, method, takeaway, caution, steps;
    public final int year, minutes;

    public Paper(JSONObject json) throws JSONException {
        id = json.getString("id"); name = json.getString("name");
        title = json.getString("title"); authors = json.getString("authors");
        topic = json.getString("topic"); type = json.getString("type");
        url = json.getString("url"); summary = json.getString("summary");
        question = json.getString("question"); method = json.getString("method");
        takeaway = json.getString("takeaway"); caution = json.getString("caution");
        steps = json.getString("steps"); year = json.getInt("year");
        minutes = json.getInt("minutes");
    }

    public boolean matches(String query) {
        String text = name + " " + title + " " + authors + " " + topic + " " + summary;
        return text.toLowerCase(Locale.ROOT).contains(query.trim().toLowerCase(Locale.ROOT));
    }

    public String narration() {
        return name + "。" + summary + "。研究问题。" + question
                + "。核心方法。" + method + "。阅读收获。" + takeaway + "。阅读边界。" + caution;
    }
}
