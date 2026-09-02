![GitHub License](https://img.shields.io/github/license/nikkinikki-org/OpenWrt-nikki?style=for-the-badge&logo=github) ![GitHub Tag](https://img.shields.io/github/v/release/nikkinikki-org/OpenWrt-nikki?style=for-the-badge&logo=github) ![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/nikkinikki-org/OpenWrt-nikki/total?style=for-the-badge&logo=github) ![GitHub Repo stars](https://img.shields.io/github/stars/nikkinikki-org/OpenWrt-nikki?style=for-the-badge&logo=github) [![Telegram](https://img.shields.io/badge/Telegram-gray?style=for-the-badge&logo=telegram)](https://t.me/nikkinikki_org)

中文 | [English](README.md)

# Nikki

> **个人 fork** —— 本仓库的 `mihomo-alpha` 取自我的 mihomo fork（preferred-ip +
> 小黑盒加速），钉 commit 发布，x86_64 为 x86-v3 基线，经自建签名 feed 分发。
> 见 [docs/adr/0001](docs/adr/0001-mihomo-from-fork-via-openwrt-feeds.md)。

在 OpenWrt 上使用 Mihomo 进行透明代理。

## 环境要求

- OpenWrt >= 24.10
- Linux Kernel >= 5.13
- firewall4

## 功能

- 透明代理 (Redirect/TPROXY/TUN, IPv4 和/或 IPv6)
- 访问控制
- 配置文件混入
- 配置文件编辑器
- 定时重启

## 安装和更新

```shell
# 只需运行一次 —— 注册自建签名源（OpenWrt 25.12，x86_64 / aarch64_generic）
wget -O - https://2017fighting.github.io/openwrt-feeds/feed.sh | ash

# 安装 / 更新（也可从 LuCI 的`软件包`菜单安装）
apk add mihomo-alpha nikki luci-app-nikki
apk add luci-i18n-nikki-zh-cn
```

## 卸载并重置

```shell
apk del mihomo-alpha luci-app-nikki nikki
/etc/init.d/nikki disable
rm -rf /etc/nikki /etc/config/nikki
```

## 如何使用

查看 [Wiki](https://github.com/nikkinikki-org/OpenWrt-nikki/wiki)

## 如何工作

1. 混入并更新配置文件。
2. 启动 Mihomo。
3. 设置定时重启。
4. 配置 IP 规则/路由。
5. 生成防火墙配置并应用。

注意上述步骤可能因配置而变动。

## 编译

```shell
# 添加源
echo "src-git nikki https://github.com/nikkinikki-org/OpenWrt-nikki.git;main" >> "feeds.conf.default"
# 更新并安装源
./scripts/feeds update -a
./scripts/feeds install -a
# 编译
make package/luci-app-nikki/compile
```

编译结果可以在`bin/packages/your_architecture/nikki`内找到。

## 依赖

- ca-bundle
- curl
- yq
- firewall4
- ip-full
- kmod-inet-diag
- kmod-nft-socket
- kmod-nft-tproxy
- kmod-tun
- kmod-dummy

## 贡献者

[![贡献者](https://contrib.rocks/image?repo=nikkinikki-org/OpenWrt-nikki)](https://github.com/nikkinikki-org/OpenWrt-nikki/graphs/contributors)

## 特别感谢

- [@ApoisL](https://github.com/apoiston)
- [@xishang0128](https://github.com/xishang0128)
