# OpenWrt-nikki（个人 fork）

nikki 透明代理栈的 OpenWrt 包仓库 fork。本词汇表只收本上下文特有的概念。

## Language

**变体（Variant）**:
上游 mihomo 包的双通道概念：`meta`（稳定版）与 `alpha`（Alpha 线）。本 fork 已删除 meta 通道，`mihomo-alpha` 是 `mihomo` 虚拟包的唯一提供者。
_Avoid_: 版本、分支、频道

**虚拟包 mihomo**:
由变体包以 `PROVIDES` 声明的提供者名；`nikki` 依赖它而非任何一个具体变体。
_Avoid_: mihomo 二进制、mihomo 核心（泛指程序本体时另说）

**fork 源**:
`alpha` 变体的取源目标 `2017fighting/mihomo`：上游 Alpha 基 + preferred-ip 与 heybox 两个特性，其余变体仍取自 MetaCubeX。
_Avoid_: 私有源、自建源

**三件套**:
设备上透明代理栈的完整包集合：`mihomo-alpha`（fork 源）+ `nikki` + `luci-app-nikki`。由个人 feed 全量提供，不与官方 feed 混用。
_Avoid_: nikki 全家桶、代理套件

**桥**:
openwrt-feeds 以钉住 commit 的 src-git 引用本仓库的方式取得三件套；本仓库是三件套的唯一事实源。
_Avoid_: 同步、拷贝

**代理提供者**:
按类型枚举代理节点的具名来源，首个类型为小黑盒账号（节点名由「游戏-节点」构成）。分组通过 use 引用它，与订阅（整份 profile 的获取渠道）互不取代。
_Avoid_: 订阅源、节点列表

**代理分组**:
命名的节点选择策略单元（select/url-test 等型），成员可为节点名、DIRECT 或对代理提供者的 use 引用；与 profile 既有分组前置拼接、互不覆盖。
_Avoid_: 策略组、代理组（面板叫法）
