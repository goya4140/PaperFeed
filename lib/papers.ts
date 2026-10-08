export type Paper = {
  id: string;
  kind?: '论文' | '研究博客' | '技术报告' | '项目发布';
  publisher?: string;
  sourceUrl?: string;
  name: string;
  title: string;
  authors: string[];
  date: string;
  topic: string;
  tags: string[];
  summary: string;
  problem: string;
  method: string;
  result: string;
  caution: string;
  steps: string[];
  reason: string;
  quality: number;
  interest: number;
  votes: number;
  project?: string;
  color: string;
  question: string;
  take: string;
};
export const papers: Paper[] = [
  {
    id: '2303.11366',
    name: 'Reflexion',
    title: 'Reflexion: Language Agents with Verbal Reinforcement Learning',
    authors: [
      'Noah Shinn',
      'Federico Cassano',
      'Edward Berman',
      'Ashwin Gopinath',
      'Karthik Narasimhan',
      'Shunyu Yao',
    ],
    date: '2023-03-20',
    topic: 'Agent Memory',
    tags: ['Language Agents', 'Reflection'],
    summary:
      'Agent 犯过的错，能不能成为下一次的经验？Reflexion 把任务反馈写成语言记忆，让后续尝试有所依据。',
    problem:
      '试错学习通常需要大量样本和参数训练。语言 Agent 是否可以通过文字反馈改进决策？',
    method:
      '执行任务后生成反思文本，放入情景记忆缓冲区；下一轮尝试读取这些反馈，而不更新模型权重。',
    result:
      '论文在决策、编程与推理任务上评估该框架，并比较不同反馈方式的效果。',
    caution:
      '阅读时应区分单次推理能力与多次尝试后的表现，检查反馈来源及重试预算。',
    steps: ['执行任务', '评价反馈', '语言反思', '记忆 → 重试'],
    reason: '与你的 Agent Memory 方向相关，也连接了 ReAct 的执行循环。',
    quality: 91,
    interest: 98,
    votes: 128,
    color: 'orange',
    question: '反思文本怎样避免把偶然失败误当作通用经验？',
    take: '我更想看失败反馈的质量，而不是只看反思次数。错误解释本身也可能被记住。',
  },
  {
    id: '2310.08560',
    name: 'MemGPT',
    title: 'MemGPT: Towards LLMs as Operating Systems',
    authors: [
      'Charles Packer',
      'Sarah Wooders',
      'Kevin Lin',
      'Vivian Fang',
      'Shishir G. Patil',
      'Ion Stoica',
      'Joseph E. Gonzalez',
    ],
    date: '2023-10-12',
    topic: 'Agent Memory',
    tags: ['Long Context', 'Memory Management'],
    summary:
      '借用操作系统的分层内存思想，让有限上下文里的模型管理长期信息。重点是“何时取用”，而不只是“存多少”。',
    problem:
      '长文档与跨会话对话往往超出模型上下文容量。全部历史无法一直放在当前输入中。',
    method:
      '通过虚拟上下文管理调度不同层级的记忆，并利用中断控制模型与用户之间的执行流程。',
    result: '研究在文档分析和多轮、跨会话对话中评估了这套记忆管理方案。',
    caution:
      '关注检索与记忆调度的额外开销；扩大可访问的记忆不等于模型总能取对信息。',
    steps: ['当前上下文', '记忆调度', '外部存储', '检索 → 对话'],
    reason: '你关注了 Agent Memory；可与 Reflexion 的反思记忆对照阅读。',
    quality: 89,
    interest: 96,
    votes: 96,
    project: 'https://research.memgpt.ai/',
    color: 'blue',
    question: '什么信息应该留在上下文，什么信息适合换出？',
    take: '分层存储很直观，但值得单独评估的是调度策略：何时读取、何时忘记。',
  },
  {
    id: '2210.03629',
    name: 'ReAct',
    title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
    authors: [
      'Shunyu Yao',
      'Jeffrey Zhao',
      'Dian Yu',
      'Nan Du',
      'Izhak Shafran',
      'Karthik Narasimhan',
      'Yuan Cao',
    ],
    date: '2022-10-06',
    topic: 'Agent Systems',
    tags: ['Reasoning', 'Tool Use'],
    summary:
      '让推理与行动交替发生：先想一步，再调用工具，用观察到的结果修正接下来的计划。',
    problem:
      '单独生成推理或行动计划，难以同时处理外部信息和动态变化的任务环境。',
    method:
      '在同一轨迹中交错生成推理文本和任务动作，让环境观察参与下一步决策。',
    result: '论文覆盖问答、事实核验和交互决策任务，并展示了可追踪的行动轨迹。',
    caution: '阅读时留意工具与环境设置，以及轨迹可读性和推理正确性之间的区别。',
    steps: ['Thought', 'Action', 'Observation', '下一轮推理'],
    reason: '构建 Agent 执行循环的基础阅读，与你的 Agent Systems 兴趣匹配。',
    quality: 96,
    interest: 91,
    votes: 246,
    project: 'https://react-lm.github.io/',
    color: 'violet',
    question: '工具调用失败时，推理轨迹会纠错还是继续放大错误？',
    take: '我会把工具响应异常也放进评估，不只测理想环境中的成功路径。',
  },
  {
    id: '2305.16291',
    name: 'Voyager',
    title: 'Voyager: An Open-Ended Embodied Agent with Large Language Models',
    authors: [
      'Guanzhi Wang',
      'Yuqi Xie',
      'Yunfan Jiang',
      'Ajay Mandlekar',
      'Chaowei Xiao',
      'Yuke Zhu',
      'Linxi Fan',
      'Anima Anandkumar',
    ],
    date: '2023-05-25',
    topic: 'Agent Systems',
    tags: ['Lifelong Learning', 'Skill Library'],
    summary:
      '把探索中学到的技能保存为可执行代码。Voyager 在 Minecraft 中积累、检索并组合这些技能。',
    problem:
      '开放环境没有固定的任务终点，Agent 需要不断发现目标，并复用已有能力。',
    method:
      '结合自动课程、可增长的技能代码库和基于环境反馈的迭代提示，使用 GPT-4 生成与改进程序。',
    result: '论文报告了 Minecraft 中探索、技能积累及在新世界中复用技能的结果。',
    caution:
      '将 Minecraft 内的迁移与跨领域泛化分开看，技能库还依赖执行环境和代码接口。',
    steps: ['自动课程', '生成代码', '环境反馈', '技能库'],
    reason: '从语言记忆走向可执行技能，为长期 Agent 提供另一种思路。',
    quality: 93,
    interest: 88,
    votes: 183,
    project: 'https://voyager.minedojo.org/',
    color: 'green',
    question: '技能库变大之后，如何避免检索出不适用的程序？',
    take: '技能的前置条件值得和代码一起保存，否则复用容易变成新的调试负担。',
  },
  {
    id: '2407.04620',
    name: 'TTT Layers',
    title:
      'Learning to (Learn at Test Time): RNNs with Expressive Hidden States',
    authors: [
      'Yu Sun',
      'Xinhao Li',
      'Karan Dalal',
      'Jiarui Xu',
      'Arjun Vikram',
      'Genghan Zhang',
      'Yann Dubois',
      'Xinlei Chen',
      'Xiaolong Wang',
      'Sanmi Koyejo',
      'Tatsunori Hashimoto',
      'Carlos Guestrin',
    ],
    date: '2024-07-05',
    topic: 'Test-Time Learning',
    tags: ['Sequence Modeling', 'Long Context'],
    summary:
      '如果 RNN 的隐藏状态本身就是一个小模型呢？TTT 用测试序列上的自监督学习来更新它。',
    problem: '注意力的长序列开销较大，而传统 RNN 的固定隐藏状态表达能力有限。',
    method:
      '把隐藏状态设为可学习模型，把状态更新写成自监督学习步骤，提出 TTT-Linear 和 TTT-MLP。',
    result:
      '论文在 125M 至 1.3B 参数规模进行比较；TTT 层能从更长上下文继续获益。',
    caution:
      'TTT-MLP 存在内存 I/O 挑战；不要把隐藏状态更新等同于任意大模型的在线微调。',
    steps: ['输入序列', '自监督目标', '更新隐藏模型', '预测'],
    reason: '跨方向发现：从文本记忆到可学习状态，探索另一种记忆形式。',
    quality: 92,
    interest: 84,
    votes: 154,
    color: 'rose',
    question: '隐藏状态更新和通常说的 test-time adaptation 有什么区别？',
    take: '这里更新的是序列层的隐藏模型，最好先把训练循环与推理循环画开。',
  },
  {
    id: '2310.06770',
    name: 'SWE-bench',
    title: 'SWE-bench: Can Language Models Resolve Real-World GitHub Issues?',
    authors: [
      'Carlos E. Jimenez',
      'John Yang',
      'Alexander Wettig',
      'Shunyu Yao',
      'Kexin Pei',
      'Ofir Press',
      'Karthik Narasimhan',
    ],
    date: '2023-10-10',
    topic: 'Agent Systems',
    tags: ['Evaluation', 'Code Agents'],
    summary:
      '从生成一段代码，到修复一个真实仓库的问题。SWE-bench 把 GitHub issue 与对应修复连接成评估任务。',
    problem:
      '短代码生成测试难以覆盖理解仓库、跨文件修改和执行验证这些软件工程环节。',
    method:
      '从 12 个 Python 仓库整理 2,294 个 issue 与对应 pull request，要求模型修改代码库以解决问题。',
    result:
      '原论文展示了当时模型在真实软件问题上的局限，为后续研究提供可执行的评估框架。',
    caution:
      '原论文结果不是当前排行榜。比较系统时需要核对数据版本、工具权限和计算预算。',
    steps: ['GitHub issue', '定位代码', '生成补丁', '测试验证'],
    reason: '你的 Agent Systems 方向需要贴近实际任务的评估视角。',
    quality: 94,
    interest: 90,
    votes: 207,
    project: 'https://www.swebench.com/',
    color: 'blue',
    question: '同一个模型，不同执行框架的结果应该如何公平比较？',
    take: '至少同时报告任务版本、工具集合和重试预算，单个成功率不够解释差异。',
  },
  {
    id: '2405.04434',
    name: 'DeepSeek-V2',
    kind: '技术报告',
    publisher: 'DeepSeek-AI',
    title:
      'DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model',
    authors: ['DeepSeek-AI'],
    date: '2024-05-07',
    topic: 'Efficient Models',
    tags: ['MoE', 'Model Architecture'],
    summary:
      '将 MLA 与稀疏专家架构结合，关注大模型训练成本和推理效率之间的取舍。',
    problem:
      '更大模型带来训练与推理成本，参数规模和实际激活计算量并不是同一件事。',
    method:
      '采用 Multi-head Latent Attention 和 DeepSeekMoE；总参数量 236B，每个 token 激活 21B。',
    result: '模型支持 128K 上下文，论文将效率与模型能力一起报告。',
    caution:
      '参数激活量不能直接推导实际延迟，还要考虑硬件、并行策略与服务负载。',
    steps: ['输入 token', 'MLA', '稀疏专家', '输出'],
    reason: '探索不同方向：模型效率会影响长程 Agent 的实际使用成本。',
    quality: 97,
    interest: 65,
    votes: 319,
    color: 'violet',
    question: '激活参数更少，线上延迟就一定更低吗？',
    take: '我会看真实 batch 和硬件配置。理论计算量只是其中一个变量。',
  },
  {
    id: '2301.04104',
    name: 'DreamerV3',
    title: 'Mastering Diverse Domains through World Models',
    authors: [
      'Danijar Hafner',
      'Jurgis Pasukonis',
      'Jimmy Ba',
      'Timothy Lillicrap',
    ],
    date: '2023-01-10',
    topic: 'World Models',
    tags: ['Reinforcement Learning', 'Planning'],
    summary:
      '先学习环境如何变化，再在想象出的未来中改进行为。DreamerV3 研究同一套配置跨任务学习。',
    problem: '强化学习方法迁移到新领域，往往需要大量手工调整与试验。',
    method:
      '学习环境模型，在模型想象的轨迹上优化行为，并通过归一化等机制改善跨领域学习稳定性。',
    result:
      '论文在 150 多个任务上使用同一配置，并报告了 Minecraft 中从零收集钻石的结果。',
    caution:
      '世界模型误差会影响规划。阅读时应区分模型内想象与真实环境中的表现。',
    steps: ['环境观察', '学习世界模型', '想象轨迹', '改进行为'],
    reason: '跨领域探索：用世界模型理解 Agent 的长程规划。',
    quality: 95,
    interest: 71,
    votes: 221,
    project: 'https://danijar.com/project/dreamerv3/',
    color: 'green',
    question: '想象轨迹越长，模型误差对策略的影响会更大吗？',
    take: '多步误差和探索策略需要一起看，短期预测准确不一定意味着长期决策可靠。',
  },
  {
    id: 'anthropic-agents',
    name: 'Building effective agents',
    title: 'Building effective agents：什么时候需要 Agent？',
    authors: ['Anthropic'],
    date: '2024-12-19',
    topic: 'Agent Systems',
    kind: '研究博客',
    publisher: 'Anthropic',
    sourceUrl:
      'https://www.anthropic.com/engineering/building-effective-agents',
    tags: ['Workflow', 'Architecture'],
    summary:
      '流程明确，就先用工作流；步骤需要由模型动态决定，再考虑 Agent。这篇工程文章帮助你判断复杂度是否值得。',
    problem: '所有任务都交给自主 Agent，会不会付出不必要的成本？',
    method:
      '区分预定义工作流和模型动态决策，介绍提示链、路由、并行、协调者与评估迭代等模式。',
    result: '这是基于工程经验的设计建议，不是统一实验条件下的性能排行榜。',
    caution: '文章发布于 2024 年；工具生态已经变化，架构原则需要结合任务验证。',
    steps: ['任务边界', '选择模式', '工具接口', '评估迭代'],
    question: '你的任务中，哪些步骤真的需要模型决定？',
    take: '编辑解读：先做可测量的简单流程，再让失败案例决定需要增加哪种自主性。',
    reason: '从 ReAct 的行动循环走向工程架构。',
    quality: 90,
    interest: 88,
    votes: 76,
    color: 'orange',
  },
  {
    id: 'openai-o1',
    name: 'Learning to reason',
    title: 'Learning to reason with LLMs：把计算花在回答之前',
    authors: ['OpenAI'],
    date: '2024-09-12',
    topic: 'Test-Time Learning',
    kind: '研究博客',
    publisher: 'OpenAI',
    sourceUrl: 'https://openai.com/index/learning-to-reason-with-llms/',
    tags: ['Reasoning', 'Inference Compute'],
    summary:
      '训练时学会推理策略，回答时投入更多计算。o1 的研究发布让“推理预算”成为观察模型能力的一个维度。',
    problem: '模型能否通过更充分的推理处理困难问题？',
    method:
      '官方介绍用强化学习改进推理策略，并研究训练计算与测试时计算的影响。',
    result:
      '官方报告数学、编程及科学问答等评估；不同采样和选择预算对应不同结果。',
    caution:
      '测试时增加计算不等于测试时更新权重；也不等于 TTT 层。不要跨预算比较分数。',
    steps: ['问题', '推理计算', '检查策略', '答案'],
    question: '增加推理时间时，你会同时记录哪些成本？',
    take: '编辑解读：为实际任务画出准确率、延迟与成本曲线，比只选最高分更有帮助。',
    reason: '连接测试时计算与 Test-Time Learning，理解两者边界。',
    quality: 95,
    interest: 80,
    votes: 138,
    color: 'rose',
  },
  {
    id: 'openai-deep-research',
    name: 'Deep research',
    title: 'Deep research：从搜索结果到可追溯的研究报告',
    authors: ['OpenAI'],
    date: '2025-02-02',
    topic: 'Agent Systems',
    kind: '项目发布',
    publisher: 'OpenAI',
    sourceUrl: 'https://openai.com/index/introducing-deep-research/',
    tags: ['Research Agents', 'Web Browsing'],
    summary:
      '一个复杂问题，需要多轮搜索、阅读和综合。Deep research 的发布展示了长程研究 Agent 的产品形态。',
    problem: '搜索到资料以后，谁来判断下一步要查什么？',
    method:
      '发布文章介绍结合网页浏览、数据分析和多步推理，随发现的信息调整研究路径。',
    result:
      '系统生成包含引用的报告；这是产品发布与官方评估，不能当作所有任务的独立验证。',
    caution:
      '可能出现事实错误或来源判断失误。这里解读最初发布，不代表当前套餐与可用能力。',
    steps: ['研究问题', '搜索阅读', '调整路径', '引用报告'],
    question: '有引用的报告，怎样判断引用真的支持结论？',
    take: '编辑解读：评估研究 Agent 应逐条核查证据链，而不只是看报告长度。',
    reason: '与你关注的 Agent Systems 和工具使用相关。',
    quality: 93,
    interest: 89,
    votes: 102,
    color: 'blue',
  },
  {
    id: 'gemini-robotics',
    name: 'Gemini Robotics',
    title: 'Gemini Robotics：语言模型开始输出物理动作',
    authors: ['Carolina Parada'],
    date: '2025-03-12',
    topic: 'World Models',
    kind: '项目发布',
    publisher: 'Google DeepMind',
    sourceUrl:
      'https://deepmind.google/blog/gemini-robotics-brings-ai-into-the-physical-world/',
    tags: ['Robotics', 'VLA'],
    summary:
      '理解一句指令，还要把它变成机器人动作。Gemini Robotics 将视觉、语言与动作连接起来。',
    problem: '数字世界里的理解能力，怎样进入不断变化的物理环境？',
    method:
      '官方介绍基于 Gemini 2.0 的视觉语言动作模型，以及侧重空间理解的 Robotics-ER。',
    result:
      '发布材料展示泛化、交互与灵巧操作的实验和示例；需要结合技术报告查看条件。',
    caution:
      '演示成功不等于任意机器人、任意环境都能可靠工作。物理执行仍需独立验证。',
    steps: ['视觉与指令', '空间理解', '动作生成', '环境反馈'],
    question: '从仿真到真实机器人，哪些失败不能靠语言反思解决？',
    take: '编辑解读：与 DreamerV3 对照，区分预测环境和直接生成动作这两种路径。',
    reason: '连接 World Models 与 Agent Systems 的具身行动。',
    quality: 94,
    interest: 74,
    votes: 115,
    color: 'green',
  },
];
export const topics = [
  {
    name: 'Agent Memory',
    desc: '长期记忆、经验复用与遗忘机制',
    color: 'orange',
    prompt: 'Agent 怎样记住有用的经验？',
  },
  {
    name: 'Agent Systems',
    desc: '推理、工具调用与真实任务评估',
    color: 'blue',
    prompt: '从能回答，走向能完成任务。',
  },
  {
    name: 'Test-Time Learning',
    desc: '推理阶段的学习与序列建模',
    color: 'rose',
    prompt: '让计算过程本身成为学习。',
  },
  {
    name: 'World Models',
    desc: '环境建模、想象与长程规划',
    color: 'green',
    prompt: '行动之前，先理解可能的未来。',
  },
  {
    name: 'Efficient Models',
    desc: '稀疏专家、注意力与推理成本',
    color: 'violet',
    prompt: '每一次推理，都值得更高效。',
  },
];
export const threads = [
  {
    id: 't1',
    paper: '2303.11366',
    person: '林一',
    initials: 'LY',
    role: 'Agent 方向研究生',
    kind: '问题',
    title: '反思越多，真的就越好吗？',
    text: '最近在做一个带记忆的工具 Agent。反思有时会把偶然错误写成固定规则，后面反而更容易绕远路。大家会怎样筛掉这种记忆？',
    reply:
      '可以先给记忆加适用条件，再用不同任务验证。我会把“发生了什么”和“为什么失败”分别保存。',
    replyPerson: '陈可',
    replies: 12,
    likes: 28,
    color: 'orange',
  },
  {
    id: 't2',
    paper: '2310.06770',
    person: '周然',
    initials: 'ZR',
    role: '开发者 · Code Agents',
    kind: '复现',
    title: '跑 SWE-bench 前，先把环境固定下来',
    text: '模型以外的因素太多了：测试环境、工具返回、补丁格式、重试次数。我准备把这些配置和每条轨迹一起记录，方便对比。',
    reply:
      '同意。失败最好也分类：定位错误、补丁错误和执行环境错误，后续改进方向完全不一样。',
    replyPerson: '许宁',
    replies: 8,
    likes: 19,
    color: 'blue',
  },
  {
    id: 't3',
    paper: '2310.08560',
    person: '陈可',
    initials: 'CK',
    role: '独立研究者',
    kind: '讨论',
    title: '长期记忆里，是否应该有“主动遗忘”？',
    text: '如果用户的目标已经变了，旧偏好是不是应该自然衰减？只讨论怎么记住，可能还少了信息冲突和过期这一半。',
    reply:
      '可以把时间和来源也纳入记忆元数据。删除不是唯一选项，降低检索优先级也值得试。',
    replyPerson: '林一',
    replies: 6,
    likes: 24,
    color: 'green',
  },
  {
    id: 't4',
    paper: '2407.04620',
    person: '许宁',
    initials: 'XN',
    role: '序列建模研究者',
    kind: '阅读笔记',
    title: '把 TTT 的两个学习循环分开画，突然清楚了',
    text: '一个是外层的训练，一个是序列处理时更新隐藏状态。先搞清楚哪些参数在什么时候变化，再读实现会轻松很多。',
    reply: '这个视角很有用，也避免把 TTT 层和普通推理时微调混在一起。',
    replyPerson: '周然',
    replies: 4,
    likes: 16,
    color: 'rose',
  },
];
export const collections = [
  {
    id: 'reading',
    name: '稍后细读',
    desc: '值得空出一段时间的论文',
    color: 'orange',
  },
  { id: 'agents', name: 'Agent 研究', desc: '记忆、执行与评估', color: 'blue' },
  {
    id: 'ideas',
    name: '灵感与交叉方向',
    desc: '还没想好怎么用，但很有意思',
    color: 'green',
  },
];
export function source(p: Paper) {
  return p.sourceUrl || `https://arxiv.org/abs/${p.id}`;
}
