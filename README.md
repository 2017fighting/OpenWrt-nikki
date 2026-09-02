![GitHub License](https://img.shields.io/github/license/nikkinikki-org/OpenWrt-nikki?style=for-the-badge&logo=github) ![GitHub Tag](https://img.shields.io/github/v/release/nikkinikki-org/OpenWrt-nikki?style=for-the-badge&logo=github) ![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/nikkinikki-org/OpenWrt-nikki/total?style=for-the-badge&logo=github) ![GitHub Repo stars](https://img.shields.io/github/stars/nikkinikki-org/OpenWrt-nikki?style=for-the-badge&logo=github) [![Telegram](https://img.shields.io/badge/Telegram-gray?style=for-the-badge&logo=telegram)](https://t.me/nikkinikki_org)

English | [中文](README.zh.md)

# Nikki

> **Personal fork** — `mihomo-alpha` here builds from my own mihomo fork
> (preferred-ip + heybox), pinned by commit, x86-v3 on x86_64. Published via my
> self-built feed. See [docs/adr/0001](docs/adr/0001-mihomo-from-fork-via-openwrt-feeds.md).

Transparent Proxy with Mihomo on OpenWrt.

## Prerequisites

- OpenWrt >= 24.10
- Linux Kernel >= 5.13
- firewall4

## Feature

- Transparent Proxy (Redirect/TPROXY/TUN, IPv4 and/or IPv6)
- Access Control
- Profile Mixin
- Profile Editor
- Scheduled Restart

## Install & Update

```shell
# run once — registers my signed feed (OpenWrt 25.12, x86_64 / aarch64_generic)
wget -O - https://2017fighting.github.io/openwrt-feeds/feed.sh | ash

# install / update (or use the `Software` menu in LuCI)
apk add mihomo-alpha nikki luci-app-nikki
apk add luci-i18n-nikki-zh-hans
```

## Uninstall & Reset

```shell
apk del mihomo-alpha luci-app-nikki nikki
/etc/init.d/nikki disable
rm -rf /etc/nikki /etc/config/nikki
```

## How To Use

See [Wiki](https://github.com/nikkinikki-org/OpenWrt-nikki/wiki)

## How does it work

1. Mixin and Update profile.
2. Run mihomo.
3. Set scheduled restart.
4. Set ip rule/route
5. Generate nftables and apply it.

Note that the steps above may change base on config.

## Compilation

```shell
# add feed
echo "src-git nikki https://github.com/nikkinikki-org/OpenWrt-nikki.git;main" >> "feeds.conf.default"
# update & install feeds
./scripts/feeds update -a
./scripts/feeds install -a
# make package
make package/luci-app-nikki/compile
```

The package files will be found under `bin/packages/your_architecture/nikki`.

## Dependencies

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

## Contributors

[![Contributors](https://contrib.rocks/image?repo=nikkinikki-org/OpenWrt-nikki)](https://github.com/nikkinikki-org/OpenWrt-nikki/graphs/contributors)

## Special Thanks

- [@ApoisL](https://github.com/apoiston)
- [@xishang0128](https://github.com/xishang0128)
