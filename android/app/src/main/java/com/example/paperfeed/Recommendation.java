package com.example.paperfeed;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/** Transparent, deterministic rules. No trained model and no synthetic popularity scores. */
public final class Recommendation {
    private Recommendation() {}
    public static List<Paper> filter(List<Paper> papers, String query, String topic, Set<String> interests,
                                     Set<String> liked, Set<String> less, Set<String> saved, boolean newest) {
        List<Paper> result = new ArrayList<>();
        for (Paper paper : papers) {
            if (paper.matches(query) && (topic.equals("全部") || topic.equals(paper.topic))) result.add(paper);
        }
        Comparator<Paper> comparator = newest
                ? Comparator.comparingInt((Paper p) -> p.year).reversed()
                : Comparator.comparingInt((Paper p) -> score(p, interests, liked, less, saved)).reversed();
        // Stable sort keeps the curated order when scores are equal.
        result.sort(comparator);
        return result;
    }

    private static int score(Paper paper, Set<String> interests, Set<String> liked, Set<String> less, Set<String> saved) {
        return (interests.contains(paper.topic) ? 30 : 0) + (liked.contains(paper.id) ? 20 : 0)
                + (saved.contains(paper.id) ? 5 : 0) - (less.contains(paper.id) ? 100 : 0);
    }
}
