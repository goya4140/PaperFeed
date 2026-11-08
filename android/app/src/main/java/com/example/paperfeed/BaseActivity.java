package com.example.paperfeed;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;
import androidx.activity.EdgeToEdge;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowCompat;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public abstract class BaseActivity extends AppCompatActivity {
    protected ReadingStore store;
    protected PaperRepository repository;
    private String pendingExport;
    private boolean loadFailed;
    private final ActivityResultLauncher<Intent> exportLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null
                        && result.getData().getData() != null && pendingExport != null) {
                    try (OutputStream output = getContentResolver().openOutputStream(result.getData().getData(), "wt")) {
                        if (output == null) throw new IllegalStateException("无法打开保存位置");
                        output.write(pendingExport.getBytes(StandardCharsets.UTF_8));
                        output.flush();
                        toast("文件已导出");
                    } catch (Exception error) { toast("导出失败，请选择其他保存位置"); }
                }
                pendingExport = null;
            });

    @Override protected void onCreate(Bundle state) {
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        super.onCreate(state);
        EdgeToEdge.enable(this);
        getWindow().getDecorView().setBackgroundColor(Color.rgb(246, 245, 240));
        if (state != null) pendingExport = state.getString("pending_export");
        store = new ReadingStore(this);
        try { repository = new PaperRepository(this); }
        catch (Exception error) {
            loadFailed = true;
            new com.google.android.material.dialog.MaterialAlertDialogBuilder(this)
                    .setTitle("内置内容无法读取").setMessage("请重新安装完整的课程版安装包。")
                    .setPositiveButton("关闭", (dialog, which) -> finish()).setCancelable(false).show();
        }
    }

    protected boolean ready() { return !loadFailed; }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).setAppearanceLightStatusBars(true);
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).setAppearanceLightNavigationBars(true);
        }
    }
    protected void applyInsets() {
        View root = findViewById(R.id.main);
        ViewCompat.setOnApplyWindowInsetsListener(root, (view, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets keyboard = insets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, keyboard.bottom));
            return WindowInsetsCompat.CONSUMED;
        });
    }

    protected void export(String text, boolean bibtex, String name) {
        pendingExport = text;
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(bibtex ? "application/x-bibtex" : "text/markdown");
        intent.putExtra(Intent.EXTRA_TITLE, name + (bibtex ? ".bib" : ".md"));
        try { exportLauncher.launch(intent); }
        catch (android.content.ActivityNotFoundException error) {
            pendingExport = null; toast("设备上没有可用的文件保存器");
        }
    }

    protected void toast(String message) { Toast.makeText(this, message, Toast.LENGTH_SHORT).show(); }
    protected int dp(float value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    @Override protected void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state); state.putString("pending_export", pendingExport);
    }
    @Override protected void onDestroy() { if (store != null) store.close(); super.onDestroy(); }
}
