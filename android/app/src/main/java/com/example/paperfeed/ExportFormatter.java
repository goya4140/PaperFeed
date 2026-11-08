package com.example.paperfeed;

import java.util.List;

public final class ExportFormatter {
    private ExportFormatter() {}

    public static String markdown(List<Paper> papers, ReadingStore store) {
        StringBuilder out = new StringBuilder("# PaperFeed · 我的研究空间\n\n离线课程版导出。解读为学习摘要，原始来源见各条目链接。\n\n");
        for (Paper paper : papers) {
            ReadingStore.State state = store.get(paper.id);
            out.append("## ").append(paper.name).append("\n\n").append(paper.title).append("\n\n")
                    .append("- 作者：").append(paper.authors).append("\n- 年份：").append(paper.year)
                    .append("\n- 方向：").append(paper.topic).append("\n- 来源：").append(paper.url)
                    .append("\n- 收藏：").append(state.favorite ? "是" : "否")
                    .append("\n- 已读：").append(state.read ? "是" : "否")
                    .append("\n- 分组：").append(state.folder).append("\n\n")
                    .append(paper.summary).append("\n\n### 我的笔记\n\n")
                    .append(state.note.isEmpty() ? "（暂无笔记）" : state.note).append("\n\n---\n\n");
        }
        return out.toString();
    }

    public static String bibtex(List<Paper> papers) {
        StringBuilder out = new StringBuilder();
        for (Paper paper : papers) {
            boolean article = paper.type.equals("论文");
            out.append("@misc{").append(paper.name.replaceAll("[^a-zA-Z0-9]", "")).append(paper.year)
                    .append(",\n  title = {").append(escape(paper.title)).append("},\n  author = {")
                    .append(escape(paper.authors)).append("},\n  year = {").append(paper.year)
                    .append("},\n  url = {").append(paper.url).append("},\n");
            if (article) out.append("  eprint = {").append(paper.id).append("},\n  archivePrefix = {arXiv},\n");
            out.append("  note = {PaperFeed course edition; abbreviated author list where indicated}\n}\n\n");
        }
        return out.toString();
    }

    private static String escape(String text) {
        return text.replace("\\", "\\textbackslash{}").replace("{", "\\{").replace("}", "\\}")
                .replace("&", "\\&").replace("%", "\\%").replace("_", "\\_").replace("#", "\\#");
    }
}
