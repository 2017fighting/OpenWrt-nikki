# fork 特性以一等表单进覆写页，mixin.yaml 保持兜底

preferred-ip（`dns.preferred-ip`）与 heybox 代理提供者这两个 fork 特有配置，以
UCI 表单（luci-app-nikki 覆写页）+ `mixin.uc` 发射的方式一等落地，而不是只教
用户写 mixin.yaml。理由：两者都是结构化、凭据型、要反复改的配置（测速地址、
每次登录轮换的 pkey），手写 YAML 的出错面——缩进、顶层/dns 归属、duration 三
态写法——恰是用户最容易踩的坑：preferred-ip 写在顶层会被核心**静默忽略**（透
传缺省姿态），本特性第一次上手就栽在这里。

## Considered Options

- 只写文档、走 mixin.yaml 逃生舱——拒绝：静默失败 + duration 形态坑常在，
  UI 不兜住等于坑常在；且 mixin.yaml 无法给 LuCI 管理的优选条目补高级测速
  参数（见下），逃生舱在这条路上是断的。
- 独立菜单页——拒绝：覆写页已是「改配置」的心智入口；优选条目按 dns 归属
  放 dns tab，代理提供者/代理分组放新增 proxy tab，菜单树零增项。
- 运行时探测核心能力再显隐（可上游化路线）——拒绝：三件套固定来自本 fork
  源，探测是死代码。

## Consequences

- LuCI 发出的 `dns.preferred-ip` 列表在 yq 深合并下**整体替换** profile/mixin
  的同名列表（数组语义）；条目一个不配或总开关关闭则不发射该键、透传
  profile。有意为之，不做 `nikki-preferred-ip` 前置合并——订阅源带该键的
  场景不存在，为它加前置机制是过度设计。副作用：优选条目一旦进表单，其
  高级测速参数只能也在表单里改（mixin.yaml 补不进去），故表单做全字段。
- 代理分组走既有 `nikki-proxy-groups` 前置合并（与订阅分组共存）；UCI 与
  mixin.yaml 同时使用该前置键时 UCI 侧胜出（深合并后入），二选一使用。
  heybox 条目经 `proxy-providers` map 深合并追加，与订阅自带提供者共存。
- heybox 的 health-check 与 override 不进表单：前者被核心无视（UDP-echo
  探活），后者要时经 mixin.yaml 的 `proxy-providers.<name>.override` 深合并
  补齐，与 UCI 条目不冲突。
- 新增 ucode 助手 `uci_double()`（字符串→double，防御式回退 `int()`）：
  mihomo 对 max-loss-rate/min-speed 做原生数值解码，yq 不会替字符串转型；
  `int()` 截断会把 0.3 变 0（=阈值关闭），所以不能复用 `uci_int()`。
