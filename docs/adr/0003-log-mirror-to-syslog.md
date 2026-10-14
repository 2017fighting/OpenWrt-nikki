# 日志镜像到路由器 syslog：两个受监督跟随者，默认关闭

本包把生命周期日志与核心日志写进 `/var/log/nikki/{app,core}.log`。这两个文件在
tmpfs 上，重启即失；`scheduled_clear` 默认每五分钟检查、超过 1 MB 就就地清空，
按实测行量约两天一轮。于是路由上最需要事后阅读的一份记录（代理核心自己的
warning/error，两天实测 4963 条 warning、74 条 error）既读不到、也活不过一周。

本包因此加一个开关 `log.mirror_to_syslog`（默认关，出现在既有日志页的
Log Config 标签里）：打开后两个受监督的跟随者实例各自跟随一个文件，把行交给
路由器 syslog——app 日志用标签 `nikki-app`、核心日志用 `nikki-core`——再由路由器
既有的 syslog 远程转发通道送进集群的 Log Intake（home-ops ADR-0018）。集群侧
零改动：字段模型不变（`app` 来自标签，`msg` 是原行），因此一条查询可以同时
跨到 pod 与喂它的路由器。文件仍是事实源，日志页照旧；关闭时行为与今天逐字节
一致——没有新进程，也没有新的文件读取。

关键取舍：

- **跟随者不在代理的 stdout 路径上**。核心今天是
  `/bin/sh -c "$PROG -d $RUN_DIR >> $CORE_LOG_PATH 2>&1"`。若把 `| logger` 接在
  这条命令里，syslog 写端一死，Go 程序写 stdout 得到 SIGPIPE 即致命——日志搬运工
  就获得了杀死代理的权力。跟随者改为读文件，这一失败只终止记录。
- **按名跟随（`tail -F`）**：定时清空是就地截断（`echo -n > file`），busybox
  `tail -F` 检测到文件变小后从头重读，跟随不因此结束。
- **app 日志回看 30 行、核心日志只发新行**：两者是两种流。app 日志的启动/失败行
  （Enabled、Profile Check failed、Test failed……）写在 procd 启动跟随者之前，不回看
  就永远进不了 store；它流量极小（实测一个月 583 行），回看 30 行既盖住实测 18-20
  行的完整启动块、又把跟随者重启时的重发限制在 30 行以内。核心日志是高流量日志，
  重发（尤其跟随者重启时）比漏掉开头几行更糟，而漏掉的那几行仍在本地的核心日志里。
- **受监督、重试无上限**（`respawn 3600 5 -1`）：procd 裸 `respawn` 是 3600 秒内
  5 次后放弃，跟随者会静默地停止记录；`-1` 正是 OpenWrt 自己给 `logd` 的写法。
- **跟随者自己收拾自己的管道**：procd 只杀它跟踪的那个 pid，不杀那个 pid 起的
  管道（实例不在自己的进程组里，`SELF_PGRP=1`）。若只写 `tail … | logger …`，
  停服务会把 tail 与 logger 留成孤儿，下一次启动就会把每行发两遍（每次重启多
  一对）。因此命令写成 `trap 'kill $(jobs -p)' TERM INT; tail … | logger … & wait`：
  停止时跟随者收掉自己的两个进程，任一端死亡时另一端也随之结束并由 procd 重启。
- **两个标签，不做级别映射**：所有行同一个 syslog priority，核心自己的
  `time=` / `level=` 原样留在消息里，级别在查询时解析——这是 ADR-0018 的契约，
  逐行 fork 一个 `logger` 去换一个消息里已有的字段不值得。

## Considered Options

- 在核心的 stdout 路径上内联 `| logger`——拒绝：见上，SIGPIPE 会让日志搬运工
  能杀代理。
- 用 procd 自己的 `stdout 1` 把输出转进 syslog——拒绝：procd 的 syslog 标签是
  进程名加 pid（实测 `sh[6523]`），两个跟随者只能得到 `tail[pid]`，集群侧的
  `app` 字段既不稳定也不可区分；它也同样把读端交给别人（procd），还会取代文件
  重定向，而文件必须继续是事实源、日志页必须继续可用。
- 一个日志文件两个实例（tail 写 FIFO、logger 读 FIFO）——拒绝：满足「每个受
  监督进程都是真身」，但把「两个跟随者」变成四个实例，且 FIFO 的启动会阻塞。
- 只写 `tail … | logger …`、在 `cleanup()` 里按命令行找残留进程杀掉——拒绝：
  默认 busybox 不启用 `pkill`（ImmortalWrt 的 `.config` 里 `PKILL` 未开），
  而逐 `/proc` 匹配命令行是自造 pkill。
- 把跟随者放进一个单独的 procd 服务（镜像与代理的服务生命周期解耦）——拒绝：
  多一个 init 脚本、多一条 Makefile 安装行与一套启停/触发器，换来的只是下面
  那条已知缺口；缺口记在案更便宜。
- 让核心自己写 syslog 或文件——拒绝：核心只有 stdout 一个 sink（`log/` 与
  `main.go` 里没有 syslog/journald/文件输出，配置里也没有对应键）。
- 只给 app 日志加镜像（`log()` 助手顺手 `logger`）——拒绝：核心日志才是这份
  记录的主角，两套机制换不来任何好处。
- 集群侧直接读文件（collector 挂 NFS/ssh 取文件）——拒绝：新通道；ADR-0018
  的契约就是「一条摄取路径、路由器 syslog 已在流」。
- 跟随者直接发到 Log Intake——拒绝：绕开路由器自己的 syslog 环与 logread 转发，
  且要在包内维护第二个地址字面量。
- 逐行把 `level=` 映射成 syslog severity——拒绝：每行一次 fork，换来的是消息里
  已有的字段，且与 ADR-0018 的查询时解析相矛盾。

## Consequences

- **记录从此依赖路由器自己的远程转发者**，而它是 `/etc/init.d/log` 里一个
  **没有 respawn 的实例**（`logread -f -r … -u`）——OpenWrt「远程日志重启后不再
  发送」那一类静默死亡。本能力继承该脆弱性：记录在案，不在本包内修，集群侧
  的沉默监控另立。
- 记录从打开开关那一刻开始，不回填文件里已有的历史；app 日志的当前启动块
  是唯一例外（回看 30 行，见上）。
- 每个跟随者是一对 `tail` + `logger` 进程；关掉开关时它们都不存在，代理的
  写路径逐字节不变。
- **已知缺口**：跟随者在核心实例之前注册，但**在** profile/subscription 的
  失败返回之后——一次因配置错误而拒绝启动（找不到 profile/subscription 文件、
  Profile Check/Test 失败）不会留下跟随者，那次尝试只在本地的 app 日志里。
  这是有意的：早注册会让一个没起来核心的服务显示为 running，而失败行仍会在
  下一次成功启动的 30 行回看里进 store（文件未被清空时）。
- 本地的 1 MB 定时清空仍只是本地文件的界，不再是记录的界。
- syslog 头是路由器收到该行的时间；行内自带的时间戳原样保留在消息里。
- 两个标签是集群侧 `app` 字段的来源，改名等于改查询契约，两边必须同时改。
- 行量及其对存储与保留的影响按 home-ops #105 的测量再决定是否过滤。
- `PKG_RELEASE` 随本改动递增：feed 重建后设备上 `apk upgrade` 才会真正装上它。
