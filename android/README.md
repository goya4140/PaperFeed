# PaperFeed 安卓离线课程版

使用 Java 和 XML 开发的安卓课程展示应用。包含兴趣选择、论文发现与搜索、结构化学习摘要、收藏分组、已读记录、私人笔记、Markdown 与 BibTeX 导出，以及每篇论文独立的本机讨论留言区。

## 运行

在 Android Studio 中打开本目录 `android/`，等待 Gradle 同步，然后运行 `app`。首次构建需要下载 SDK、Gradle 和依赖；核心功能运行时离线。SDK 路径由各自电脑的 Android Studio 配置，仓库不包含 `local.properties`。

工程保留已通过本地构建的工具链：AGP 9.4.1、Gradle 9.6.0、编译及目标 SDK 37、最低 SDK 24。Java 源码级别为 11；Gradle daemon 的 Java 25 工具链由 `gradle/gradle-daemon-jvm.properties` 声明，工具链下载使用 Foojay resolver。请安装相应 SDK 并允许 Gradle 下载所需工具链。最低版本声明不代表已经覆盖所有旧设备。

命令行构建时，将 `JAVA_HOME` 指向合适的 JDK，设置 `ANDROID_HOME` 或本机 SDK 配置后执行：

```sh
./gradlew :app:assembleDebug :app:testDebugUnitTest :app:lintDebug :app:assembleDebugAndroidTest
```

Windows 使用 `gradlew.bat`。APK 输出到 `app/build/outputs/apk/debug/app-debug.apk`。源代码仓库不包含构建缓存或安装包二进制。

## 演示路线

1. 在“发现”搜索 Reflexion 或 MemGPT，按兴趣方向筛选。
2. 打开详情，阅读研究问题、方法与阅读边界，收藏并标记已读。
3. 写下私人笔记并选择收藏分组，在“知识库”检索和筛选记录。
4. 点击详情中的“论文讨论”，填写可选昵称并发布留言。留言非空、最多 1000 字符，按论文分别保存在本机，最新在前；退出后仍可查看。
5. 在“我的”调整兴趣、查看实际统计，并导出 Markdown 或 BibTeX 文件。

## 内容与功能边界

内置 12 条固定内容：8 篇论文与 4 篇官方历史文章的简短中文学习摘要，并附原始来源。没有内置论文全文或 PDF。打开原文由外部浏览器联网完成。

“朗读解读”调用设备的离线中文文字转语音服务，没有预录配音。未安装离线语音时提供提示，初始化有八秒超时回退；实际中文声音输出尚需在支持该语音的设备上验证。

本版为独立的离线课程客户端，不连接仓库现有 Web/iOS 后台。没有账号或云同步，讨论留言不会发送给其他用户；真实多人交流需要后续接入共享服务。收藏、笔记、阅读状态与留言保存在 SQLite，兴趣保存在本机偏好设置。数据库版本 2 采用新增讨论表的迁移方式保留版本 1 的数据。

## 代码与资料

- `app/src/main/java/com/example/paperfeed/`：主页面、详情、讨论、数据存储、内容读取、排序和导出。
- `app/src/main/res/layout/`：Java/XML 页面和条目布局。
- `app/src/main/assets/papers.json`：内置内容及来源链接。
- `app/src/androidTest/`：设备验收测试，包含数据库升级与讨论区操作。
- `docs/screenshots/`：模拟器真实界面截图；讨论截图含测试期间发布的课程演示留言。
- `docs/`：简版与图文版 Word 应用简介。

此前在 Pixel_10a 模拟器执行了原有 9 项设备检查及新增 4 项讨论区测试，均通过；Word 简介已进行分页预览。新增测试执行方式为覆盖安装后运行 instrumentation，避免卸载已有应用。真实手机及旧版 Android 的兼容性未完整覆盖。

若 Windows 模拟器出现界面控件存在但画面黑屏，可尝试在设备设置中使用软件图形渲染并冷启动；本项目使用 SwiftShader 后恢复显示。该处理属于本机模拟器配置，不修改设备数据。
