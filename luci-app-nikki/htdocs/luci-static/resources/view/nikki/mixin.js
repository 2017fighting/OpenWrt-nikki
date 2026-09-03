'use strict';
'require form';
'require view';
'require uci';
'require fs';
'require network';
'require poll';
'require tools.widgets as widgets';
'require tools.nikki as nikki';

// Official Cloudflare ranges, verified live against
// https://www.cloudflare.com/ips-v4 and https://www.cloudflare.com/ips-v6 (2025-12)
const CLOUDFLARE_RANGES = [
    '173.245.48.0/20',
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    '141.101.64.0/18',
    '108.162.192.0/18',
    '190.93.240.0/20',
    '188.114.96.0/20',
    '197.234.240.0/22',
    '198.41.128.0/17',
    '162.158.0.0/15',
    '104.16.0.0/13',
    '104.24.0.0/14',
    '172.64.0.0/13',
    '131.0.72.0/22',
    '2400:cb00::/32',
    '2606:4700::/32',
    '2803:f800::/32',
    '2405:b500::/32',
    '2405:8100::/32',
    '2a06:98c0::/29',
    '2c0f:f248::/32',
];

return view.extend({
    load: () => Promise.all([
            uci.load('nikki'),
            network.getNetworks(),
        ]),
    render: (data) => {
        const networks = data[1];

        let m, s, o, so;

        m = new form.Map('nikki');

        s = m.section(form.NamedSection, 'mixin', 'mixin', _('Mixin Option'));

        s.tab('general', _('General Config'));

        o = s.taboption('general', form.ListValue, 'log_level', _('Log Level'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('silent');
        o.value('error');
        o.value('warning');
        o.value('info');
        o.value('debug');

        o = s.taboption('general', form.ListValue, 'mode', _('Mode'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('global', _('Global Mode'));
        o.value('rule', _('Rule Mode'));
        o.value('direct', _('Direct Mode'));

        o = s.taboption('general', form.ListValue, 'match_process', _('Match Process'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('off');
        o.value('strict');
        o.value('always');

        o = s.taboption('general', form.ListValue, 'outbound_interface', _('Outbound Interface'));
        o.optional = true;
        o.placeholder = _('Unmodified');

        for (const network of networks) {
            if (network.getName() === 'loopback') {
                continue;
            }
            o.value(network.getName());
        }

        o = s.taboption('general', form.ListValue, 'ipv6', 'IPv6');
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('general', form.ListValue, 'unify_delay', _('Unify Delay'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('general', form.ListValue, 'tcp_concurrent', _('TCP Concurrent'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('general', form.ListValue, 'disable_tcp_keep_alive', _('Disable TCP Keep Alive'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('general', form.Value, 'tcp_keep_alive_idle', _('TCP Keep Alive Idle'));
        o.datatype = 'uinteger';
        o.placeholder = _('Unmodified');

        o = s.taboption('general', form.Value, 'tcp_keep_alive_interval', _('TCP Keep Alive Interval'));
        o.datatype = 'uinteger';
        o.placeholder = _('Unmodified');

        s.tab('external_control', _('External Control Config'));

        o = s.taboption('external_control', form.Value, 'ui_path', _('UI Path'));
        o.placeholder = _('Unmodified');

        o = s.taboption('external_control', form.Value, 'ui_name', _('UI Name'));
        o.placeholder = _('Unmodified');

        o = s.taboption('external_control', form.Value, 'ui_url', _('UI Url'));
        o.placeholder = _('Unmodified');
        o.value('https://github.com/Zephyruso/zashboard/releases/latest/download/dist-cdn-fonts.zip', 'Zashboard (CDN Fonts)');
        o.value('https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip', 'Zashboard');
        o.value('https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip', 'MetaCubeXD');
        o.value('https://github.com/MetaCubeX/Yacd-meta/archive/refs/heads/gh-pages.zip', 'YACD');
        o.value('https://github.com/MetaCubeX/Razord-meta/archive/refs/heads/gh-pages.zip', 'Razord');
        o.value('https://github.com/2017fighting/metacubexd/releases/latest/download/metacubexd.zip', '2017fighting');

        o = s.taboption('external_control', form.Value, 'api_listen', _('API Listen'));
        o.datatype = 'ipaddrport(1)';
        o.placeholder = _('Unmodified');

        o = s.taboption('external_control', form.Value, 'api_tls_listen', _('API TLS Listen'));
        o.datatype = 'ipaddrport(1)';
        o.placeholder = _('Unmodified');

        o = s.taboption('external_control', form.Value, 'api_tls_cert', _('API TLS Cert'));
        o.placeholder = _('Unmodified');

        o = s.taboption('external_control', form.Value, 'api_tls_key', _('API TLS Key'));
        o.placeholder = _('Unmodified');

        o = s.taboption('external_control', form.Value, 'api_tls_ech_key', _('API TLS ECH Key'));
        o.placeholder = _('Unmodified');

        o = s.taboption('external_control', form.Value, 'api_secret', _('API Secret'));
        o.password = true;
        o.placeholder = _('Unmodified');

        o = s.taboption('external_control', form.ListValue, 'selection_cache', _('Save Proxy Selection'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        s.tab('inbound', _('Inbound Config'));

        o = s.taboption('inbound', form.ListValue, 'allow_lan', _('Allow Lan'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('inbound', form.Value, 'http_port', _('HTTP Port'));
        o.datatype = 'port';
        o.placeholder = _('Unmodified');

        o = s.taboption('inbound', form.Value, 'socks_port', _('SOCKS Port'));
        o.datatype = 'port';
        o.placeholder = _('Unmodified');

        o = s.taboption('inbound', form.Value, 'mixed_port', _('Mixed Port'));
        o.datatype = 'port';
        o.placeholder = _('Unmodified');

        o = s.taboption('inbound', form.Value, 'redir_port', _('Redirect Port'));
        o.datatype = 'port';
        o.placeholder = _('Unmodified');

        o = s.taboption('inbound', form.Value, 'tproxy_port', _('TPROXY Port'));
        o.datatype = 'port';
        o.placeholder = _('Unmodified');

        o = s.taboption('inbound', form.Flag, 'authentication', _('Overwrite Authentication'));
        o.rmempty = false;

        o = s.taboption('inbound', form.SectionValue, '_authentications', form.TableSection, 'authentication', _('Edit Authentications'));
        o.retain = true;
        o.depends('authentication', '1');

        o.subsection.addremove = true;
        o.subsection.anonymous = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'username', _('Username'));
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'password', _('Password'));
        so.password = true;
        so.rmempty = false;

        s.tab('tun', _('TUN Config'));

        o = s.taboption('tun', form.ListValue, 'tun_enabled', _('Enable'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('tun', form.Value, 'tun_device', _('Device Name'));
        o.placeholder = _('Unmodified');

        o = s.taboption('tun', form.ListValue, 'tun_stack', _('Stack'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('system', 'System');
        o.value('gvisor', 'gVisor');
        o.value('mixed', 'Mixed');

        o = s.taboption('tun', form.Value, 'tun_mtu', _('MTU'));
        o.datatype = 'uinteger';
        o.placeholder = _('Unmodified');

        o = s.taboption('tun', form.ListValue, 'tun_gso', _('GSO'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('tun', form.Value, 'tun_gso_max_size', _('GSO Max Size'));
        o.datatype = 'uinteger';
        o.placeholder = _('Unmodified');

        o = s.taboption('tun', form.Flag, 'tun_dns_hijack', _('Overwrite DNS Hijack'));
        o.rmempty = false;

        o = s.taboption('tun', form.DynamicList, 'tun_dns_hijacks', _('Edit DNS Hijacks'));
        o.retain = true;
        o.depends('tun_dns_hijack', '1');
        o.value('tcp://any:53');
        o.value('udp://any:53');

        s.tab('dns', _('DNS Config'));

        o = s.taboption('dns', form.ListValue, 'dns_enabled', _('Enable'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('dns', form.ListValue, 'dns_cache_algorithm', _('DNS Cache Algorithm'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('lru', _('Least Recently Used (LRU)'));
        o.value('arc', _('Adaptive Replacement Cache (ARC)'));

        o = s.taboption('dns', form.Value, 'dns_listen', _('DNS Listen'));
        o.datatype = 'ipaddrport(1)';
        o.placeholder = _('Unmodified');

        o = s.taboption('dns', form.ListValue, 'dns_ipv6', 'IPv6');
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('dns', form.ListValue, 'dns_mode', _('DNS Mode'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('redir-host', 'Redir-Host');
        o.value('fake-ip', 'Fake-IP');

        o = s.taboption('dns', form.Value, 'fake_ip_range', _('Fake-IP Range'));
        o.datatype = 'cidr4';
        o.placeholder = _('Unmodified');

        o = s.taboption('dns', form.Value, 'fake_ip6_range', _('Fake-IP6 Range'));
        o.datatype = 'cidr6';
        o.placeholder = _('Unmodified');

        o = s.taboption('dns', form.Value, 'fake_ip_ttl', _('Fake-IP TTL'));
        o.datatype = 'uinteger';
        o.placeholder = _('Unmodified');

        o = s.taboption('dns', form.Flag, 'fake_ip_filter', _('Overwrite Fake-IP Filter'));
        o.rmempty = false;

        o = s.taboption('dns', form.DynamicList, 'fake_ip_filters', _('Edit Fake-IP Filters'));
        o.retain = true;
        o.depends('fake_ip_filter', '1');

        o = s.taboption('dns', form.ListValue, 'fake_ip_filter_mode', _('Fake-IP Filter Mode'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('blacklist', _('Block Mode'));
        o.value('whitelist', _('Allow Mode'));
        o.value('rule', _('Rule Mode'));

        o = s.taboption('dns', form.ListValue, 'fake_ip_cache', _('Fake-IP Cache'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('dns', form.ListValue, 'dns_respect_rules', _('Respect Rules'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('dns', form.ListValue, 'dns_doh_prefer_http3', _('DoH Prefer HTTP/3'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('dns', form.ListValue, 'dns_system_hosts', _('Use System Hosts'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('dns', form.ListValue, 'dns_hosts', _('Use Hosts'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('dns', form.Flag, 'hosts', _('Overwrite Hosts'));
        o.rmempty = false;

        o = s.taboption('dns', form.SectionValue, '_hosts', form.TableSection, 'hosts', _('Edit Hosts'));
        o.retain = true;
        o.depends('hosts', '1');

        o.subsection.addremove = true;
        o.subsection.anonymous = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'domain_name', _('Domain Name'));
        so.rmempty = false;

        so = o.subsection.option(form.DynamicList, 'ip', 'IP');

        o = s.taboption('dns', form.Flag, 'dns_nameserver', _('Overwrite Nameserver'));
        o.rmempty = false;

        o = s.taboption('dns', form.SectionValue, '_dns_nameservers', form.TableSection, 'nameserver', _('Edit Nameservers'));
        o.retain = true;
        o.depends('dns_nameserver', '1');

        o.subsection.addremove = true;
        o.subsection.anonymous = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.rmempty = false;

        so = o.subsection.option(form.ListValue, 'type', _('Type'));
        so.value('default-nameserver');
        so.value('proxy-server-nameserver');
        so.value('direct-nameserver');
        so.value('nameserver');
        so.value('fallback');

        so = o.subsection.option(form.DynamicList, 'nameserver', _('Nameserver'));

        o = s.taboption('dns', form.Flag, 'dns_proxy_server_nameserver_policy', _('Overwrite Proxy Server Nameserver Policy'));
        o.rmempty = false;

        o = s.taboption('dns', form.SectionValue, '_dns_proxy_server_nameserver_policies', form.TableSection, 'proxy_server_nameserver_policy', _('Edit Proxy Server Nameserver Policies'));
        o.retain = true;
        o.depends('dns_proxy_server_nameserver_policy', '1');

        o.subsection.addremove = true;
        o.subsection.anonymous = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'matcher', _('Matcher'));
        so.rmempty = false;

        so = o.subsection.option(form.DynamicList, 'nameserver', _('Nameserver'));

        o = s.taboption('dns', form.ListValue, 'dns_direct_nameserver_follow_policy', _('Direct Nameserver Follow Policy'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('dns', form.Flag, 'dns_nameserver_policy', _('Overwrite Nameserver Policy'));
        o.rmempty = false;

        o = s.taboption('dns', form.SectionValue, '_dns_nameserver_policies', form.TableSection, 'nameserver_policy', _('Edit Nameserver Policies'));
        o.retain = true;
        o.depends('dns_nameserver_policy', '1');

        o.subsection.addremove = true;
        o.subsection.anonymous = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'matcher', _('Matcher'));
        so.rmempty = false;

        so = o.subsection.option(form.DynamicList, 'nameserver', _('Nameserver'));

        o = s.taboption('dns', form.Flag, 'dns_preferred_ip', _('Overwrite Preferred IP'), _('Entries configured here replace the profile dns.preferred-ip list entirely; disable to pass the profile list through'));
        o.rmempty = false;

        o = s.taboption('dns', form.SectionValue, '_dns_preferred_ips', form.GridSection, 'preferred_ip', _('Edit Preferred IP Entries'));
        o.retain = true;
        o.depends('dns_preferred_ip', '1');

        o.subsection.anonymous = true;
        o.subsection.addremove = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.default = 1;
        so.editable = true;
        so.modalonly = false;
        so.rmempty = false;

        const preferredNameOption = so = o.subsection.option(form.Value, 'name', _('Entry Name'), _('Unique persistence key of the preferred pool'));
        so.rmempty = false;
        so.modalonly = false;

        const preferredPresetOption = so = o.subsection.option(form.ListValue, 'preset', _('Preset'), _('Fill name and CIDR ranges with the official Cloudflare ranges; every field stays editable'));
        so.value('', _('Custom'));
        so.value('cloudflare', _('Cloudflare'));
        so.modalonly = true;
        so.rmempty = false;

        const preferredCidrOption = so = o.subsection.option(form.DynamicList, 'cidr', _('CIDR Ranges'), _('IPv4 and IPv6 CIDRs to match and rewrite; listing IPv6 ranges activates AAAA handling'));
        so.rmempty = false;
        so.modalonly = true;
        so.datatype = 'cidr';

        so = o.subsection.option(form.ListValue, 'ipv6', _('IPv6 Answer Mode'), _('Applies when a query matches an IPv6 CIDR of this entry'));
        so.optional = true;
        so.placeholder = _('Default (Replace)');
        so.value('replace', _('Replace'));
        so.value('block', _('Block'));
        so.modalonly = true;

        so = o.subsection.option(form.Value, 'answer_count', _('Answer Count'), _('Preferred IPs served per DNS answer'));
        so.datatype = 'range(1,16)';
        so.placeholder = _('Engine default (5)');
        so.modalonly = true;

        so = o.subsection.option(form.Value, 'ttl_cap', _('TTL Cap'), _('Seconds; caps the TTL of rewritten answers'));
        so.datatype = 'uinteger';
        so.placeholder = _('Engine default (60)');
        so.modalonly = true;

        so = o.subsection.option(form.Flag, 'persist', _('Persist Pool'), _('Store the preferred pool in cache.db across restarts'));
        so.default = 1;
        so.rmempty = false;
        so.modalonly = true;

        so = o.subsection.option(form.Value, 'speedtest_url', _('Speedtest Url'), _('Download test URL; empty uses the built-in Cloudflare test'));
        so.modalonly = true;

        so = o.subsection.option(form.Value, 'speedtest_interval', _('Speedtest Interval'), _('Minimum 1 minute'));
        so.datatype = 'uinteger';
        so.placeholder = _('Engine default (24h)');
        so.modalonly = true;

        so = o.subsection.option(form.ListValue, 'speedtest_interval_unit', _('Speedtest Interval Unit'));
        so.default = 'h';
        so.value('m', _('Minute'));
        so.value('h', _('Hour'));
        so.modalonly = true;
        so.rmempty = false;

        so = o.subsection.option(form.Flag, 'speedtest_disable_download', _('Latency Only'), _('Skip the download stage and rank by tcping latency only'));
        so.rmempty = false;
        so.modalonly = true;

        so = o.subsection.option(form.Value, 'speedtest_threads', _('Threads'), _('Concurrent tcping workers'));
        so.datatype = 'range(1,1000)';
        so.placeholder = _('Engine default (200)');
        so.modalonly = true;

        so = o.subsection.option(form.Value, 'speedtest_tcp_port', _('TCP Port'), _('Port used by tcping candidates'));
        so.datatype = 'port';
        so.placeholder = _('Engine default (443)');
        so.modalonly = true;

        so = o.subsection.option(form.Value, 'speedtest_ping_times', _('Ping Times'), _('tcping count per candidate'));
        so.datatype = 'uinteger';
        so.placeholder = _('Engine default (4)');
        so.modalonly = true;

        so = o.subsection.option(form.Value, 'speedtest_download_count', _('Download Count'), _('Candidates entering the download stage'));
        so.datatype = 'uinteger';
        so.placeholder = _('Engine default (10)');
        so.modalonly = true;

        so = o.subsection.option(form.Value, 'speedtest_download_time', _('Download Time'), _('Per-candidate download budget'));
        so.datatype = 'uinteger';
        so.modalonly = true;

        so = o.subsection.option(form.ListValue, 'speedtest_download_time_unit', _('Download Time Unit'));
        so.default = 's';
        so.value('s', _('Second'));
        so.value('m', _('Minute'));
        so.modalonly = true;
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'speedtest_max_delay', _('Max Delay'), _('Drop candidates above this average delay; empty disables'));
        so.datatype = 'uinteger';
        so.modalonly = true;

        so = o.subsection.option(form.ListValue, 'speedtest_max_delay_unit', _('Max Delay Unit'));
        so.default = 'ms';
        so.value('ms', _('Millisecond'));
        so.value('s', _('Second'));
        so.modalonly = true;
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'speedtest_min_delay', _('Min Delay'), _('Drop candidates below this average delay; empty disables'));
        so.datatype = 'uinteger';
        so.modalonly = true;

        so = o.subsection.option(form.ListValue, 'speedtest_min_delay_unit', _('Min Delay Unit'));
        so.default = 'ms';
        so.value('ms', _('Millisecond'));
        so.value('s', _('Second'));
        so.modalonly = true;
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'speedtest_max_loss_rate', _('Max Loss Rate'), _('0-1, both ends disable the filter'));
        so.datatype = 'ufloat';
        so.modalonly = true;

        so = o.subsection.option(form.Value, 'speedtest_min_speed', _('Min Speed'), _('MB/s; empty keeps all candidates'));
        so.datatype = 'ufloat';
        so.modalonly = true;

        preferredPresetOption.onchange = (ev, section_id, value) => {
            if (value !== 'cloudflare') {
                return;
            }
            const setOptionValue = (option, val) => {
                const uiElement = option.getUIElement(section_id);
                if (uiElement) {
                    uiElement.setValue(val);
                }
            };
            setOptionValue(preferredNameOption, 'cloudflare');
            setOptionValue(preferredCidrOption, CLOUDFLARE_RANGES);
        };

        s.tab('sniffer', _('Sniffer Config'));

        o = s.taboption('sniffer', form.ListValue, 'sniffer', _('Enable'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('sniffer', form.ListValue, 'sniffer_sniff_dns_mapping', _('Sniff Redir-Host'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('sniffer', form.ListValue, 'sniffer_sniff_pure_ip', _('Sniff Pure IP'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('sniffer', form.Flag, 'sniffer_force_domain_name', _('Overwrite Force Sniff Domain Name'));
        o.rmempty = false;

        o = s.taboption('sniffer', form.DynamicList, 'sniffer_force_domain_names', _('Force Sniff Domain Name'));
        o.retain = true;
        o.depends('sniffer_force_domain_name', '1');

        o = s.taboption('sniffer', form.Flag, 'sniffer_ignore_domain_name', _('Overwrite Ignore Sniff Domain Name'));
        o.rmempty = false;

        o = s.taboption('sniffer', form.DynamicList, 'sniffer_ignore_domain_names', _('Ignore Sniff Domain Name'));
        o.retain = true;
        o.depends('sniffer_ignore_domain_name', '1');

        o = s.taboption('sniffer', form.Flag, 'sniffer_sniff', _('Overwrite Sniff By Protocol'));
        o.rmempty = false;

        o = s.taboption('sniffer', form.SectionValue, '_sniffer_sniffs', form.TableSection, 'sniff', _('Sniff By Protocol'));
        o.retain = true;
        o.depends('sniffer_sniff', '1');

        o.subsection.anonymous = true;
        o.subsection.addremove = false;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.rmempty = false;

        so = o.subsection.option(form.ListValue, 'protocol', _('Protocol'));
        so.value('HTTP');
        so.value('TLS');
        so.value('QUIC');
        so.readonly = true;

        so = o.subsection.option(form.DynamicList, 'port', _('Port'));
        so.datatype = 'portrange';

        so = o.subsection.option(form.Flag, 'overwrite_destination', _('Overwrite Destination'));
        so.rmempty = false;

        s.tab('rule', _('Rule Config'));

        o = s.taboption('rule', form.Flag, 'rule_provider', _('Append Rule Provider'));
        o.rmempty = false;

        o = s.taboption('rule', form.SectionValue, '_rule_providers', form.GridSection, 'rule_provider', _('Edit Rule Providers'));
        o.retain = true;
        o.depends('rule_provider', '1');

        o.subsection.anonymous = true;
        o.subsection.addremove = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.default = 1;
        so.editable = true;
        so.modalonly = false;
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'name', _('Name'));
        so.rmempty = false;

        so = o.subsection.option(form.ListValue, 'type', _('Type'));
        so.default = 'http';
        so.rmempty = false;
        so.value('http');
        so.value('file');

        so = o.subsection.option(form.Value, 'url', _('Url'));
        so.modalonly = true;
        so.rmempty = false;
        so.depends('type', 'http');

        so = o.subsection.option(form.Value, 'node', _('Node'));
        so.default = 'DIRECT';
        so.modalonly = true;
        so.depends('type', 'http');
        so.value('GLOBAL');
        so.value('DIRECT');

        so = o.subsection.option(form.Value, 'file_size_limit', _('File Size Limit'));
        so.datatype = 'uinteger';
        so.default = 0;
        so.modalonly = true;
        so.depends('type', 'http');

        so = o.subsection.option(form.FileUpload, 'file_path', _('File Path'));
        so.modalonly = true;
        so.rmempty = false;
        so.root_directory = nikki.ruleProvidersDir;
        so.depends('type', 'file');

        so = o.subsection.option(form.ListValue, 'file_format', _('File Format'));
        so.default = 'yaml';
        so.value('mrs');
        so.value('yaml');
        so.value('text');

        so = o.subsection.option(form.ListValue, 'behavior', _('Behavior'));
        so.default = 'classical';
        so.rmempty = false;
        so.value('classical');
        so.value('domain');
        so.value('ipcidr');

        so = o.subsection.option(form.Value, 'update_interval', _('Update Interval'));
        so.datatype = 'uinteger';
        so.default = 0;
        so.modalonly = true;
        so.depends('type', 'http');

        o = s.taboption('rule', form.Flag, 'rule', _('Append Rule'));
        o.rmempty = false;

        o = s.taboption('rule', form.SectionValue, '_rules', form.TableSection, 'rule', _('Edit Rules'));
        o.retain = true;
        o.depends('rule', '1');

        o.subsection.anonymous = true;
        o.subsection.addremove = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.default = 1;
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'type', _('Type'));
        so.rmempty = false;
        so.value('RULE-SET', _('Rule Set'));
        so.value('DOMAIN', _('Domain Name'));
        so.value('DOMAIN-SUFFIX', _('Domain Name Suffix'));
        so.value('DOMAIN-WILDCARD', _('Domain Name Wildcard'));
        so.value('DOMAIN-KEYWORD', _('Domain Name Keyword'));
        so.value('DOMAIN-REGEX', _('Domain Name Regex'));
        so.value('IP-CIDR', _('Destination IP'));
        so.value('DST-PORT', _('Destination Port'));
        so.value('PROCESS-NAME', _('Process Name'));
        so.value('GEOSITE', _('Domain Name Geo'));
        so.value('GEOIP', _('Destination IP Geo'));

        so = o.subsection.option(form.Value, 'matcher', _('Matcher'));
        so.rmempty = false;
        so.depends({ 'type': /MATCH/i, '!reverse': true });

        so = o.subsection.option(form.Value, 'node', _('Node'));
        so.default = 'GLOBAL';
        so.value('GLOBAL');
        so.value('DIRECT');
        so.value('REJECT');
        so.value('REJECT-DROP');

        so = o.subsection.option(form.Flag, 'no_resolve', _('No Resolve'));
        so.rmempty = false;
        so.depends('type', /IP-CIDR6?/i);
        so.depends('type', /IP-ASN/i);
        so.depends('type', /GEOIP/i);

        s.tab('proxy', _('Proxy Config'));

        o = s.taboption('proxy', form.Flag, 'proxy_provider', _('Append Proxy Provider'), _('Providers configured here are merged into the profile proxy-providers map'));
        o.rmempty = false;

        o = s.taboption('proxy', form.SectionValue, '_proxy_providers', form.GridSection, 'proxy_provider', _('Edit Proxy Providers'));
        o.retain = true;
        o.depends('proxy_provider', '1');

        o.subsection.anonymous = true;
        o.subsection.addremove = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.default = 1;
        so.editable = true;
        so.modalonly = false;
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'name', _('Name'));
        so.rmempty = false;
        so.modalonly = false;

        so = o.subsection.option(form.ListValue, 'type', _('Type'));
        so.default = 'heybox';
        so.rmempty = false;
        so.value('heybox', _('Heybox'));

        so = o.subsection.option(form.Value, 'heybox_id', _('Heybox ID'));
        so.datatype = 'uinteger';
        so.rmempty = false;
        so.modalonly = true;
        so.depends('type', 'heybox');

        so = o.subsection.option(form.Value, 'pkey', _('Pkey'), _('Account credential; rotates on every Heybox login, update it manually. Stored in UCI as plain text'));
        so.password = true;
        so.rmempty = false;
        so.modalonly = true;
        so.depends('type', 'heybox');

        so = o.subsection.option(form.DynamicList, 'games', _('Games'), _('acc_id list from the account game library; 356 = Switch'));
        so.datatype = 'uinteger';
        so.rmempty = false;
        so.modalonly = true;
        so.depends('type', 'heybox');

        so = o.subsection.option(form.ListValue, 'isp', _('ISP'), _('Entry network of the acceleration nodes'));
        so.optional = true;
        so.placeholder = _('Default (All)');
        so.value('dianxin', _('China Telecom'));
        so.value('liantong', _('China Unicom'));
        so.value('yidong', _('China Mobile'));
        so.value('bgp', 'BGP');
        so.modalonly = true;
        so.depends('type', 'heybox');

        so = o.subsection.option(form.Value, 'api', _('API Base'), _('Optional override of the Heybox API endpoint'));
        so.modalonly = true;
        so.depends('type', 'heybox');

        so = o.subsection.option(form.Value, 'interval', _('Update Interval'), _('Seconds between node re-enumerations'));
        so.datatype = 'uinteger';
        so.placeholder = _('Engine default (600)');
        so.modalonly = true;

        so = o.subsection.option(form.Value, 'filter', _('Filter'), _('Regex on proxy names, e.g. Switch.*Japan'));
        so.modalonly = true;

        so = o.subsection.option(form.Value, 'exclude_filter', _('Exclude Filter'), _('Regex dropping matching proxy names'));
        so.modalonly = true;

        o = s.taboption('proxy', form.Flag, 'proxy_group', _('Append Proxy Group'), _('Groups configured here are prepended to the profile proxy-groups'));
        o.rmempty = false;

        o = s.taboption('proxy', form.SectionValue, '_proxy_groups', form.GridSection, 'proxy_group', _('Edit Proxy Groups'));
        o.retain = true;
        o.depends('proxy_group', '1');

        o.subsection.anonymous = true;
        o.subsection.addremove = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.default = 1;
        so.editable = true;
        so.modalonly = false;
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'name', _('Name'));
        so.rmempty = false;
        so.modalonly = false;

        so = o.subsection.option(form.ListValue, 'type', _('Type'));
        so.default = 'select';
        so.rmempty = false;
        so.value('select', _('Select'));
        so.value('url-test', _('URL Test'));
        so.value('fallback', _('Fallback'));
        so.value('load-balance', _('Load Balance'));
        so.value('relay', _('Relay'));

        so = o.subsection.option(form.DynamicList, 'proxies', _('Member Proxies'), _('DIRECT, proxy names from the profile, or other group names'));
        so.modalonly = true;
        so.value('DIRECT');

        so = o.subsection.option(form.DynamicList, 'use', _('Use Providers'), _('Provider names; heybox proxies are named Game-Node, region included'));
        so.modalonly = true;
        for (const provider of uci.sections('nikki', 'proxy_provider')) {
            if (provider.name) {
                so.value(provider.name);
            }
        }

        so = o.subsection.option(form.Value, 'url', _('Test Url'), _('Health check URL for url-test / fallback / load-balance groups'));
        so.modalonly = true;
        so.depends('type', 'url-test');
        so.depends('type', 'fallback');
        so.depends('type', 'load-balance');

        so = o.subsection.option(form.Value, 'interval', _('Test Interval'), _('Seconds between health checks'));
        so.datatype = 'uinteger';
        so.modalonly = true;
        so.depends('type', 'url-test');
        so.depends('type', 'fallback');
        so.depends('type', 'load-balance');

        s.tab('geox', _('GeoX Config'));

        o = s.taboption('geox', form.ListValue, 'geoip_format', _('GeoIP Format'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('dat', 'DAT');
        o.value('mmdb', 'MMDB');

        o = s.taboption('geox', form.ListValue, 'geodata_loader', _('GeoData Loader'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('standard', _('Standard Loader'));
        o.value('memconservative', _('Memory Conservative Loader'));

        o = s.taboption('geox', form.Value, 'geosite_url', _('GeoSite Url'));
        o.placeholder = _('Unmodified');

        o = s.taboption('geox', form.Value, 'geoip_mmdb_url', _('GeoIP(MMDB) Url'));
        o.placeholder = _('Unmodified');

        o = s.taboption('geox', form.Value, 'geoip_dat_url', _('GeoIP(DAT) Url'));
        o.placeholder = _('Unmodified');

        o = s.taboption('geox', form.Value, 'geoip_asn_url', _('GeoIP(ASN) Url'));
        o.placeholder = _('Unmodified');

        o = s.taboption('geox', form.ListValue, 'geox_auto_update', _('GeoX Auto Update'));
        o.optional = true;
        o.placeholder = _('Unmodified');
        o.value('0', _('Disable'));
        o.value('1', _('Enable'));

        o = s.taboption('geox', form.Value, 'geox_update_interval', _('GeoX Update Interval'));
        o.datatype = 'uinteger';
        o.placeholder = _('Unmodified');

        s.tab('mixin_file_content', _('Mixin File Content'));

        o = s.taboption('mixin_file_content', form.Flag, 'mixin_file_content', _('Enable'), _('Please go to the editor tab to edit the file for mixin'));
        o.rmempty = false;

        return m.render();
    }
});
