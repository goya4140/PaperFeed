package com.example.paperfeed;

import android.content.Context;
import org.json.JSONArray;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class PaperRepository {
    public static final String[] TOPICS = {"Agent 记忆", "推理与规划", "编程智能体", "高效模型", "具身智能"};
    private final List<Paper> papers;

    public PaperRepository(Context context) throws Exception {
        List<Paper> loaded = new ArrayList<>();
        try (InputStream stream = context.getAssets().open("papers.json")) {
            JSONArray array = new JSONArray(read(stream));
            for (int i = 0; i < array.length(); i++) loaded.add(new Paper(array.getJSONObject(i)));
        }
        papers = Collections.unmodifiableList(loaded);
    }

    static String read(InputStream input) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int count;
        while ((count = input.read(buffer)) != -1) bytes.write(buffer, 0, count);
        return bytes.toString(StandardCharsets.UTF_8.name());
    }

    public List<Paper> all() { return papers; }

    public Paper find(String id) {
        for (Paper paper : papers) if (paper.id.equals(id)) return paper;
        return null;
    }
}
