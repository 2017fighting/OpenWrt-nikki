# mihomo 改由个人 fork 供应，经 openwrt-feeds 三件套接管

`mihomo-alpha` 的 `PKG_SOURCE_URL` 指向 `2017fighting/mihomo`（上游 Alpha 基 +
preferred-ip 与 heybox 两个特性），钉住 commit（现为 `09d045e3`）；`mihomo-meta`
包、`.github/workflows/`（含每天会把 pin 改回上游的 dependabot）与设备端三脚本
（install.sh / uninstall.sh / feed.sh）一并删除。本仓库不再是面向官方 feed 的
发行仓库，而是 openwrt-feeds 以钉 commit 的 src-git 引用的三件套
（mihomo-alpha + nikki + luci-app-nikki）的唯一事实源。

## Considered Options

- 设备层高版本覆盖（不换源、双 feed 并存）——拒绝：`mihomo` 虚拟包双提供者，
  apk 解析歧义长期存在，版本号军备赛。
- 物理拷贝包目录进 openwrt-feeds——拒绝：两处真相，必然漂移。
- 休眠保留 mihomo-meta——拒绝：build plan 只编三件套，永远不会构建它，留着
  只是误导。

## Consequences

- 与上游 nikkinikki-org 只能按需 cherry-pick：mihomo-alpha Makefile 被改的
  五行（URL / 版本 / hash / BuildVersion / v3）与上游 dependabot 每周重写的
  行重叠，定期 merge 必然冲突；被删的 workflows 与脚本也可能随 cherry-pick
  带回，需随手丢弃。
- `mihomo-alpha` Makefile 的 `CONFLICTS:=mihomo-meta` 有意保留：与上游保持
  最小 diff，且防设备上残留的 meta 包挡道。
- GOAMD64=v3 在 Makefile 内声明（与 fork CI 一致），x86_64 产物要求 x86-v3
  CPU；aarch64 不受影响。
- 升级循环：rebase mihomo fork → push → bump 本仓库 pin → push → bump
  openwrt-feeds 桥上的 commit → CI 出包 → 设备 `apk upgrade`。
