/**
 * CYBER//SYSADMIN UTILITIES DECK - CLIENT-SIDE ENGINE
 * 100% Client-side Windows Server Admin Tools
 * - DNS over HTTPS (DoH) Records Explorer
 * - Storage & RAM Precision Converter (1024 vs 1000 base)
 * - IPv4 Subnetting & Windows Server DHCP Scope Builder
 * - Cyber Admin Scratchpad (localStorage auto-save + .txt/.ps1/.bat/.reg exporter)
 * - Interactive PowerShell Arsenal Generator (Integrated with GitBook scripts)
 */

class CyberToolsEngine {
  constructor() {
    this.activeTool = 'dns';
    this.scratchpadStorageKey = 'cyber_admin_scratchpad_v1';
    this.dnsResolvers = {
      cloudflare: 'https://cloudflare-dns.com/dns-query',
      google: 'https://dns.google/resolve'
    };
  }

  init() {
    console.log('%c[CYBER-TOOLS] Initializing Sysadmin Utilities Deck...', 'color:#00f3ff; font-weight:bold;');
    this.setupTabNavigation();
    this.setupDNS();
    this.setupStorage();
    this.setupSubnet();
    this.setupScratchpad();
    this.setupPowerShellArsenal();
    this.setupNetworkArchitecture();
    console.log('%c[CYBER-TOOLS] Sysadmin Utilities Deck Ready.', 'color:#00ff66; font-weight:bold;');
  }

  /* ================= NAVIGATION TABS ================= */
  setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tools-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const toolId = btn.getAttribute('data-tool');
        this.switchTool(toolId);
        if (window.cyberSFX) window.cyberSFX.playClick();
      });
    });
  }

  switchTool(toolId) {
    this.activeTool = toolId;
    const tabBtns = document.querySelectorAll('.tools-tab-btn');
    const panels = document.querySelectorAll('.tool-panel');

    tabBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tool') === toolId);
    });

    panels.forEach(p => {
      p.classList.toggle('active', p.id === `tool-panel-${toolId}`);
    });

    // Update URL hash without reload if on tools view
    if (window.location.hash.startsWith('#/tools')) {
      history.replaceState(null, '', `#/tools/${toolId}`);
    }
  }

  /* ================= 1. LIVE DNS CHECKER (DoH) ================= */
  setupDNS() {
    const btnQuery = document.getElementById('btn-dns-query');
    const btnQueryAll = document.getElementById('btn-dns-query-all');
    const inputDomain = document.getElementById('dns-input-domain');
    const selectType = document.getElementById('dns-select-type');
    const selectResolver = document.getElementById('dns-select-resolver');
    const resultsContainer = document.getElementById('dns-results-box');

    if (!btnQuery || !inputDomain) return;

    // Presets click handling
    document.querySelectorAll('.dns-preset').forEach(chip => {
      chip.addEventListener('click', () => {
        const domain = chip.getAttribute('data-domain');
        const type = chip.getAttribute('data-type') || 'A';
        inputDomain.value = domain;
        selectType.value = type;
        if (window.cyberSFX) window.cyberSFX.playClick();
        this.runDnsQuery();
      });
    });

    // Enter key trigger
    inputDomain.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.runDnsQuery();
      }
    });

    btnQuery.addEventListener('click', () => {
      this.runDnsQuery();
    });

    if (btnQueryAll) {
      btnQueryAll.addEventListener('click', () => {
        this.runDnsMultiQuery();
      });
    }
  }

  async runDnsQuery() {
    const inputDomain = document.getElementById('dns-input-domain');
    const selectType = document.getElementById('dns-select-type');
    const selectResolver = document.getElementById('dns-select-resolver');
    const resultsContainer = document.getElementById('dns-results-box');

    let domain = inputDomain.value.trim();
    if (!domain) {
      inputDomain.focus();
      return;
    }
    // Remove protocol or trailing slashes if pasted
    domain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

    const type = selectType.value;
    const resolver = selectResolver.value;

    resultsContainer.innerHTML = `
      <div style="padding:20px; text-align:center; color:var(--text-muted); font-family:var(--font-mono);">
        <div class="cyber-spinner" style="margin:0 auto 10px;"></div>
        <div>[QUERYING DOH VIA ${resolver.toUpperCase()}] ${type} records for ${domain}...</div>
      </div>
    `;

    if (window.cyberSFX) window.cyberSFX.playClick();

    const startTime = performance.now();
    try {
      const records = await this.fetchDnsRecords(domain, type, resolver);
      const latency = Math.round(performance.now() - startTime);

      if (!records || records.length === 0) {
        resultsContainer.innerHTML = `
          <div class="dns-record-card" style="border-left-color:var(--secondary);">
            <div class="dns-rec-top">
              <span class="dns-rec-type">${type} RECORD</span>
              <span class="res-badge warning">NO RECORDS RETURNED</span>
            </div>
            <div class="dns-rec-data" style="color:var(--text-muted); font-size:12px;">
              No ${type} resource records found for <code>${domain}</code>. (Resolved in ${latency}ms)
            </div>
          </div>
        `;
        if (window.cyberSFX) window.cyberSFX.playError();
        return;
      }

      let cardsHtml = '<div class="dns-results-grid">';
      records.forEach(rec => {
        cardsHtml += `
          <div class="dns-record-card">
            <div class="dns-rec-top">
              <span class="dns-rec-type">${rec.typeName || type}</span>
              <span class="dns-rec-ttl">TTL: ${rec.TTL || 300}s</span>
            </div>
            <div class="dns-rec-data">${this.escapeHtml(rec.data)}</div>
          </div>
        `;
      });
      cardsHtml += '</div>';

      resultsContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted);">
            RESOLVED ${records.length} RECORD(S) VIA ${resolver.toUpperCase()} (${latency}ms)
          </span>
          <span class="res-badge success">200 NOERROR</span>
        </div>
        ${cardsHtml}
      `;
      if (window.cyberSFX) window.cyberSFX.playConfirm();

    } catch (err) {
      resultsContainer.innerHTML = `
        <div class="dns-record-card" style="border-left-color:#ff003c;">
          <div class="dns-rec-top">
            <span class="dns-rec-type" style="color:#ff003c;">QUERY FAILED</span>
            <span class="res-badge danger">ERR_RESOLVE</span>
          </div>
          <div class="dns-rec-data" style="font-size:12px; color:#ff8080;">
            ${err.message || 'Network request failed or blocked by browser.'}
          </div>
        </div>
      `;
      if (window.cyberSFX) window.cyberSFX.playError();
    }
  }

  async runDnsMultiQuery() {
    const inputDomain = document.getElementById('dns-input-domain');
    const selectResolver = document.getElementById('dns-select-resolver');
    const resultsContainer = document.getElementById('dns-results-box');

    let domain = inputDomain.value.trim();
    if (!domain) {
      inputDomain.focus();
      return;
    }
    domain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    const resolver = selectResolver.value;
    const types = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME'];

    resultsContainer.innerHTML = `
      <div style="padding:20px; text-align:center; color:var(--text-muted); font-family:var(--font-mono);">
        <div class="cyber-spinner" style="margin:0 auto 10px;"></div>
        <div>[MULTI-RECORD AUDIT] Querying A, AAAA, MX, TXT, NS, CNAME for ${domain}...</div>
      </div>
    `;

    if (window.cyberSFX) window.cyberSFX.playClick();

    const startTime = performance.now();
    const queryPromises = types.map(t => this.fetchDnsRecords(domain, t, resolver).then(res => ({ type: t, records: res })).catch(() => ({ type: t, records: [] })));

    const results = await Promise.all(queryPromises);
    const latency = Math.round(performance.now() - startTime);

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted);">
          MULTI-RECORD AUDIT FOR <strong>${domain}</strong> (${latency}ms)
        </span>
        <span class="res-badge success">AUDIT COMPLETE</span>
      </div>
      <div class="dns-results-grid">
    `;

    let totalFound = 0;
    results.forEach(({ type, records }) => {
      if (records && records.length > 0) {
        totalFound += records.length;
        records.forEach(rec => {
          html += `
            <div class="dns-record-card">
              <div class="dns-rec-top">
                <span class="dns-rec-type">${type}</span>
                <span class="dns-rec-ttl">TTL: ${rec.TTL || 300}s</span>
              </div>
              <div class="dns-rec-data">${this.escapeHtml(rec.data)}</div>
            </div>
          `;
        });
      }
    });

    if (totalFound === 0) {
      html += `
        <div class="dns-record-card" style="grid-column: 1 / -1;">
          <div class="dns-rec-data" style="color:var(--text-muted);">No DNS records found across common record types.</div>
        </div>
      `;
    }

    html += '</div>';
    resultsContainer.innerHTML = html;
    if (window.cyberSFX) window.cyberSFX.playConfirm();
  }

  async fetchDnsRecords(domain, type, resolver = 'cloudflare') {
    const typeMap = {
      1: 'A', 28: 'AAAA', 5: 'CNAME', 15: 'MX', 16: 'TXT', 2: 'NS', 12: 'PTR', 33: 'SRV', 6: 'SOA'
    };

    let url;
    let headers = {};

    if (resolver === 'google') {
      url = `${this.dnsResolvers.google}?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`;
    } else {
      url = `${this.dnsResolvers.cloudflare}?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`;
      headers = { 'accept': 'application/dns-json' };
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`DoH server responded with HTTP ${response.status}`);
    }
    const data = await response.json();

    if (!data.Answer) {
      return [];
    }

    return data.Answer.map(ans => ({
      name: ans.name,
      type: ans.type,
      typeName: typeMap[ans.type] || type,
      TTL: ans.TTL,
      data: ans.data
    }));
  }

  /* ================= 2. STORAGE & RAM CONVERTER ================= */
  setupStorage() {
    const inputVal = document.getElementById('storage-input-val');
    const selectUnit = document.getElementById('storage-select-unit');

    if (!inputVal) return;

    const calculateAll = () => {
      const rawVal = parseFloat(inputVal.value);
      if (isNaN(rawVal) || rawVal < 0) return;

      const unit = selectUnit.value;
      this.renderStorageOutputs(rawVal, unit);
    };

    inputVal.addEventListener('input', calculateAll);
    selectUnit.addEventListener('change', calculateAll);

    // Storage Presets (RAM, Disks)
    document.querySelectorAll('.storage-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-val');
        const unit = btn.getAttribute('data-unit');
        inputVal.value = val;
        selectUnit.value = unit;
        calculateAll();
        if (window.cyberSFX) window.cyberSFX.playClick();
      });
    });

    // Pagefile Calculator
    const inputRam = document.getElementById('pagefile-input-ram');
    if (inputRam) {
      const calcPagefile = () => {
        const ramGb = parseFloat(inputRam.value) || 0;
        const minMb = Math.round(ramGb * 1024 * 1.5);
        const maxMb = Math.round(ramGb * 1024 * 3.0);
        const crashDumpMb = Math.round(ramGb * 1024 + 257); // Kernel memory dump buffer

        const resEl = document.getElementById('pagefile-results');
        if (resEl) {
          resEl.innerHTML = `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; margin-top:8px;">
              <div class="subnet-item">
                <div class="sub-label">MINIMUM RECOMMENDED</div>
                <div class="sub-val">${minMb.toLocaleString()} MB <span style="font-size:11px; color:var(--text-muted);">(${(minMb/1024).toFixed(1)} GB)</span></div>
              </div>
              <div class="subnet-item">
                <div class="sub-label">MAXIMUM RECOMMENDED</div>
                <div class="sub-val">${maxMb.toLocaleString()} MB <span style="font-size:11px; color:var(--text-muted);">(${(maxMb/1024).toFixed(1)} GB)</span></div>
              </div>
              <div class="subnet-item">
                <div class="sub-label">COMPLETE CRASH DUMP MIN</div>
                <div class="sub-val">${crashDumpMb.toLocaleString()} MB</div>
              </div>
            </div>
          `;
        }
      };
      inputRam.addEventListener('input', calcPagefile);
      calcPagefile();
    }

    // IOPS to Throughput Calculator
    const inputIops = document.getElementById('iops-input-val');
    const selectBlock = document.getElementById('iops-select-block');
    if (inputIops && selectBlock) {
      const calcThroughput = () => {
        const iops = parseFloat(inputIops.value) || 0;
        const blockKb = parseFloat(selectBlock.value) || 4;
        const mbSec = (iops * blockKb) / 1024;
        const gbSec = mbSec / 1024;

        const resEl = document.getElementById('iops-result-val');
        if (resEl) {
          resEl.innerHTML = `${mbSec.toFixed(2)} MB/s <span style="font-size:12px; color:var(--secondary);">(${gbSec.toFixed(3)} GB/s)</span>`;
        }
      };
      inputIops.addEventListener('input', calcThroughput);
      selectBlock.addEventListener('change', calcThroughput);
      calcThroughput();
    }

    // Initial run
    calculateAll();
  }

  renderStorageOutputs(val, unit) {
    // Multipliers to bytes (Base 1000 decimal vs Base 1024 binary)
    const decMultipliers = {
      B: 1,
      KB: 1000,
      MB: 1000 ** 2,
      GB: 1000 ** 3,
      TB: 1000 ** 4,
      PB: 1000 ** 5
    };

    const binMultipliers = {
      B: 1,
      KB: 1024,
      MB: 1024 ** 2,
      GB: 1024 ** 3,
      TB: 1024 ** 4,
      PB: 1024 ** 5
    };

    // Calculate total bytes assuming input was in standard binary or decimal
    const totalBytesBinary = val * binMultipliers[unit];
    const totalBytesDecimal = val * decMultipliers[unit];

    // Decimal outputs
    const decB = totalBytesDecimal;
    const decKB = totalBytesDecimal / decMultipliers.KB;
    const decMB = totalBytesDecimal / decMultipliers.MB;
    const decGB = totalBytesDecimal / decMultipliers.GB;
    const decTB = totalBytesDecimal / decMultipliers.TB;
    const decPB = totalBytesDecimal / decMultipliers.PB;

    // Binary outputs (GiB/TiB as seen in Windows)
    const binB = totalBytesBinary;
    const binKiB = totalBytesBinary / binMultipliers.KB;
    const binMiB = totalBytesBinary / binMultipliers.MB;
    const binGiB = totalBytesBinary / binMultipliers.GB;
    const binTiB = totalBytesBinary / binMultipliers.TB;
    const binPiB = totalBytesBinary / binMultipliers.PB;

    // Update Output Cards
    const setCard = (id, mainVal, subVal) => {
      const el = document.getElementById(id);
      if (el) {
        el.querySelector('.unit-value').textContent = mainVal;
        el.querySelector('.unit-sub').textContent = subVal;
      }
    };

    setCard('card-bytes', Math.round(binB).toLocaleString() + ' B', Math.round(decB).toLocaleString() + ' Dec B');
    setCard('card-mb', binMiB.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' MiB', decMB.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' MB');
    setCard('card-gb', binGiB.toLocaleString(undefined, { maximumFractionDigits: 3 }) + ' GiB', decGB.toLocaleString(undefined, { maximumFractionDigits: 3 }) + ' GB');
    setCard('card-tb', binTiB.toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' TiB', decTB.toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' TB');

    // Windows Disk Reality Callout
    const calloutEl = document.getElementById('storage-diff-text');
    if (calloutEl) {
      if (unit === 'GB' || unit === 'TB') {
        const vendorVal = val;
        const vendorUnit = unit;
        const windowsVal = (vendorVal * decMultipliers[vendorUnit]) / binMultipliers[vendorUnit];
        const lostPct = (((vendorVal - windowsVal) / vendorVal) * 100).toFixed(2);

        calloutEl.innerHTML = `
          A <strong>${vendorVal} ${vendorUnit}</strong> advertised disk drive appears as approximately 
          <strong style="color:var(--primary);">${windowsVal.toFixed(2)} ${vendorUnit === 'TB' ? 'TiB' : 'GiB'}</strong> in Windows Disk Management. 
          The apparent ~${lostPct}% reduction is due to hard drive vendors marketing in base-1000 while Windows formats in base-1024 binary.
        `;
      } else {
        calloutEl.innerHTML = `
          <strong>Base-1024 vs Base-1000:</strong> Operating systems (Windows Server, Hyper-V, NTFS) calculate in powers of 2 (1024), 
          whereas network bandwidth and raw storage drive packaging use base 10 (1000).
        `;
      }
    }
  }

  /* ================= 3. SUBNET & WINDOWS DHCP SCOPE CALCULATOR ================= */
  setupSubnet() {
    const inputIp = document.getElementById('subnet-input-ip');
    const inputCidr = document.getElementById('subnet-input-cidr');
    const sliderCidr = document.getElementById('subnet-slider-cidr');
    const cidrValDisplay = document.getElementById('subnet-cidr-val');

    if (!inputIp || !sliderCidr) return;

    const runSubnetCalc = () => {
      const ipStr = inputIp.value.trim() || '192.168.1.100';
      const cidr = parseInt(sliderCidr.value, 10);
      cidrValDisplay.textContent = `/${cidr}`;
      if (inputCidr) inputCidr.value = cidr;

      this.calculateSubnet(ipStr, cidr);
    };

    sliderCidr.addEventListener('input', runSubnetCalc);
    inputIp.addEventListener('input', runSubnetCalc);

    if (inputCidr) {
      inputCidr.addEventListener('change', () => {
        sliderCidr.value = inputCidr.value;
        runSubnetCalc();
      });
    }

    // Subnet Presets
    document.querySelectorAll('.subnet-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        inputIp.value = btn.getAttribute('data-ip');
        sliderCidr.value = btn.getAttribute('data-cidr');
        runSubnetCalc();
        if (window.cyberSFX) window.cyberSFX.playClick();
      });
    });

    // DHCP Scope Form Listeners
    const dhcpScopeName = document.getElementById('dhcp-scope-name');
    const dhcpExcludeCount = document.getElementById('dhcp-exclude-count');
    const dhcpGateway = document.getElementById('dhcp-gateway-type');

    [dhcpScopeName, dhcpExcludeCount, dhcpGateway].forEach(el => {
      if (el) el.addEventListener('input', () => this.generateDhcpScope());
    });

    // Initial calculation
    runSubnetCalc();
  }

  calculateSubnet(ipStr, cidr) {
    const ipParts = ipStr.split('.').map(p => parseInt(p, 10));
    if (ipParts.length !== 4 || ipParts.some(p => isNaN(p) || p < 0 || p > 255)) {
      return; // invalid IP
    }

    const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const maskInt = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    const wildcardInt = (~maskInt) >>> 0;

    const netInt = (ipInt & maskInt) >>> 0;
    const bcastInt = (netInt | wildcardInt) >>> 0;

    const totalAddresses = Math.pow(2, 32 - cidr);
    const usableHosts = cidr >= 31 ? 0 : Math.max(0, totalAddresses - 2);

    const firstHostInt = cidr >= 31 ? netInt : netInt + 1;
    const lastHostInt = cidr >= 31 ? bcastInt : bcastInt - 1;

    const intToIp = (num) => [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join('.');

    const subnetMaskStr = intToIp(maskInt);
    const wildcardStr = intToIp(wildcardInt);
    const netStr = intToIp(netInt);
    const bcastStr = intToIp(bcastInt);
    const firstHostStr = intToIp(firstHostInt);
    const lastHostStr = intToIp(lastHostInt);

    // IP Class & RFC 1918 Private status
    let ipClass = 'Unknown';
    const firstOctet = ipParts[0];
    if (firstOctet >= 1 && firstOctet <= 126) ipClass = 'Class A';
    else if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'Class B';
    else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'Class C';
    else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'Class D (Multicast)';
    else if (firstOctet >= 240) ipClass = 'Class E (Experimental)';

    let isPrivate = false;
    if (firstOctet === 10) isPrivate = true;
    else if (firstOctet === 172 && ipParts[1] >= 16 && ipParts[1] <= 31) isPrivate = true;
    else if (firstOctet === 192 && ipParts[1] === 168) isPrivate = true;
    else if (firstOctet === 127) isPrivate = true; // Loopback

    // Update Output fields
    this.setText('sub-net-id', netStr);
    this.setText('sub-net-mask', subnetMaskStr);
    this.setText('sub-wildcard', wildcardStr);
    this.setText('sub-bcast', bcastStr);
    this.setText('sub-first-host', usableHosts > 0 ? firstHostStr : 'N/A');
    this.setText('sub-last-host', usableHosts > 0 ? lastHostStr : 'N/A');
    this.setText('sub-usable-hosts', usableHosts.toLocaleString());
    this.setText('sub-total-hosts', totalAddresses.toLocaleString());
    this.setText('sub-ip-type', `${ipClass} // ${isPrivate ? 'PRIVATE (RFC 1918)' : 'PUBLIC INTERNET'}`);

    // Binary Visualization
    const binaryContainer = document.getElementById('subnet-binary-display');
    if (binaryContainer) {
      const toBin8 = (n) => n.toString(2).padStart(8, '0');
      const ipBinStr = ipParts.map(toBin8).join('');

      let binHtml = '';
      for (let i = 0; i < 32; i++) {
        if (i > 0 && i % 8 === 0) binHtml += ' &middot; ';
        const bit = ipBinStr[i];
        const isNet = i < cidr;
        binHtml += `<span class="binary-bit ${isNet ? 'net-bit' : 'host-bit'}">${bit}</span>`;
      }

      binaryContainer.innerHTML = `
        <div style="font-family:var(--font-mono); font-size:13px; letter-spacing:1px; line-height:1.8;">
          ${binHtml}
        </div>
        <div style="font-size:10px; color:var(--text-muted); margin-top:6px; display:flex; gap:16px;">
          <span><span class="binary-bit net-bit">■</span> NETWORK BITS: ${cidr}</span>
          <span><span class="binary-bit host-bit">■</span> HOST BITS: ${32 - cidr}</span>
        </div>
      `;
    }

    // Store current state for DHCP Scope Generator
    this.currentSubnet = {
      ipStr,
      cidr,
      subnetMaskStr,
      netStr,
      bcastStr,
      firstHostStr,
      lastHostStr,
      usableHosts,
      ipParts,
      netInt
    };

    this.generateDhcpScope();
  }

  generateDhcpScope() {
    if (!this.currentSubnet || this.currentSubnet.usableHosts < 4) return;

    const scopeNameInput = document.getElementById('dhcp-scope-name');
    const excludeCountInput = document.getElementById('dhcp-exclude-count');
    const gatewaySelect = document.getElementById('dhcp-gateway-type');
    const outputBox = document.getElementById('dhcp-ps-output');

    if (!outputBox) return;

    const scopeName = (scopeNameInput && scopeNameInput.value.trim()) || 'LAN_Scope';
    const excludeCount = (excludeCountInput && parseInt(excludeCountInput.value, 10)) || 10;
    const isFirstGateway = gatewaySelect ? gatewaySelect.value === 'first' : true;

    const s = this.currentSubnet;
    const gatewayIp = isFirstGateway ? s.firstHostStr : s.lastHostStr;

    // Calculate static reserve range
    const intToIp = (num) => [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join('.');

    const startExcludeIp = s.firstHostStr;
    const endExcludeInt = s.netInt + excludeCount;
    const endExcludeIp = intToIp(endExcludeInt);

    // PowerShell Commands for Windows Server DHCP Role
    const psScript = `# Windows Server DHCP Scope Automation Script
# Generated by CYBER//SYSADMIN Utilities Deck
Import-Module DhcpServer -ErrorAction SilentlyContinue

$ScopeID     = "${s.netStr}"
$ScopeName   = "${scopeName}"
$SubnetMask  = "${s.subnetMaskStr}"
$StartRange  = "${s.firstHostStr}"
$EndRange    = "${s.lastHostStr}"
$Gateway     = "${gatewayIp}"
$DnsServers  = @("${gatewayIp}", "8.8.8.8")

Write-Host "Configuring DHCP Scope on Windows Server..." -ForegroundColor Cyan

# 1. Create DHCP Scope
Add-DhcpServerv4Scope -Name $ScopeName \`
    -StartRange $StartRange \`
    -EndRange $EndRange \`
    -SubnetMask $SubnetMask \`
    -State Active \`
    -Description "Automated Scope created via CYBER//SYSADMIN"

# 2. Add Static Exclusion Range for Gateways, Switches & Servers (.1 to .${excludeCount})
Add-DhcpServerv4ExclusionRange -ScopeId $ScopeID \`
    -StartRange "${startExcludeIp}" \`
    -EndRange "${endExcludeIp}"

# 3. Configure Scope Options (Router 003, DNS 006)
Set-DhcpServerv4OptionValue -ScopeId $ScopeID -OptionId 3 -Value $Gateway
Set-DhcpServerv4OptionValue -ScopeId $ScopeID -OptionId 6 -Value $DnsServers

Write-Host "DHCP Scope '$ScopeName' ($ScopeID) successfully active!" -ForegroundColor Green
`;

    outputBox.textContent = psScript;

    // Hook copy button
    const copyBtn = document.getElementById('btn-copy-dhcp-ps');
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(psScript);
        this.copyConfirm(copyBtn);
      };
    }
  }

  /* ================= 4. ADMIN SCRATCHPAD & EXPORTER ================= */
  setupScratchpad() {
    const textarea = document.getElementById('scratchpad-textarea');
    const lineNumbers = document.getElementById('scratchpad-lines');
    const statChars = document.getElementById('scratchpad-chars');
    const statWords = document.getElementById('scratchpad-words');
    const statLines = document.getElementById('scratchpad-line-count');
    const btnClear = document.getElementById('btn-scratchpad-clear');
    const btnCopy = document.getElementById('btn-scratchpad-copy');

    if (!textarea) return;

    // Restore from localStorage
    const saved = localStorage.getItem(this.scratchpadStorageKey);
    if (saved !== null) {
      textarea.value = saved;
    } else {
      // Default welcome text
      textarea.value = `# ======================================================
# CYBER//SYSADMIN ADMIN SCRATCHPAD & QUICK EXPORTER
# Auto-saved to browser storage. Write snippets or paste configs.
# Click buttons below to download directly as .txt, .ps1, .bat, or .reg.
# ======================================================

Get-Service | Where-Object { $_.Status -eq "Running" -and $_.StartType -eq "Automatic" }
`;
    }

    const updateStatsAndLines = () => {
      const text = textarea.value;
      localStorage.setItem(this.scratchpadStorageKey, text);

      // Line numbers
      const lines = text.split('\n');
      const lineCount = lines.length;
      let lineHtml = '';
      for (let i = 1; i <= lineCount; i++) {
        lineHtml += `${i}<br>`;
      }
      if (lineNumbers) lineNumbers.innerHTML = lineHtml;

      // Stats
      if (statLines) statLines.textContent = lineCount;
      if (statChars) statChars.textContent = text.length;
      if (statWords) {
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        statWords.textContent = words;
      }
    };

    textarea.addEventListener('input', updateStatsAndLines);
    textarea.addEventListener('scroll', () => {
      if (lineNumbers) lineNumbers.scrollTop = textarea.scrollTop;
    });

    // Tab key support in textarea
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        updateStatsAndLines();
      }
    });

    // Clear
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('Clear scratchpad content?')) {
          textarea.value = '';
          updateStatsAndLines();
          if (window.cyberSFX) window.cyberSFX.playClick();
        }
      });
    }

    // Copy
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(textarea.value);
        this.copyConfirm(btnCopy);
      });
    }

    // Download handlers
    const setupDownload = (btnId, filename, mimeType) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', () => {
          const content = textarea.value;
          const blob = new Blob([content], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          if (window.cyberSFX) window.cyberSFX.playConfirm();
          if (window.cyberApp) window.cyberApp.showToast(`[DOWNLOAD] Saved ${filename}`, 'success');
        });
      }
    };

    setupDownload('btn-download-txt', 'sysadmin-notes.txt', 'text/plain');
    setupDownload('btn-download-ps1', 'AutomationScript.ps1', 'text/plain');
    setupDownload('btn-download-bat', 'ServerRun.bat', 'text/plain');
    setupDownload('btn-download-reg', 'ServerHardening.reg', 'text/plain');

    // Sample Template Loaders
    document.querySelectorAll('.scratchpad-template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-tpl');
        this.loadScratchpadTemplate(type);
        updateStatsAndLines();
        if (window.cyberSFX) window.cyberSFX.playClick();
      });
    });

    updateStatsAndLines();
  }

  loadScratchpadTemplate(type) {
    const textarea = document.getElementById('scratchpad-textarea');
    if (!textarea) return;

    if (type === 'ps1') {
      textarea.value = `<#
.SYNOPSIS
    Automated Windows Server Maintenance Routine
.DESCRIPTION
    Standardized PowerShell template with robust error handling,
    logging, and credential validation.
.PARAMETER ComputerName
    Target machine name (default: localhost)
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$ComputerName = $env:COMPUTERNAME,

    [Parameter(Mandatory=$false)]
    [string]$LogDirectory = "C:\\AdminLogs"
)

# Initialize Environment
$ErrorActionPreference = "Stop"
if (!(Test-Path $LogDirectory)) {
    New-Item -ItemType Directory -Path $LogDirectory | Out-Null
}

$Timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$LogFile = Join-Path $LogDirectory "Maintenance_$Timestamp.log"

function Write-AdminLog {
    param([string]$Message, [string]$Level = "INFO")
    $Entry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Message"
    Write-Host $Entry
    Add-Content -Path $LogFile -Value $Entry
}

try {
    Write-AdminLog "Starting maintenance on $ComputerName"
    
    # 1. Check Free Disk Space on C:
    $drive = Get-PSDrive C
    $freeGb = [math]::Round($drive.Free / 1GB, 2)
    Write-AdminLog "C: Drive free space: $freeGb GB"

    # 2. Check Stopped Automatic Services
    $faultedServices = Get-Service | Where-Object { $_.StartType -eq "Automatic" -and $_.Status -ne "Running" }
    if ($faultedServices) {
        Write-AdminLog "Detected $($faultedServices.Count) stopped automatic services!" "WARNING"
    } else {
        Write-AdminLog "All automatic services running smoothly."
    }

    Write-AdminLog "Maintenance complete successfully." "SUCCESS"
} catch {
    Write-AdminLog "Fatal execution error: $_" "ERROR"
    exit 1
}
`;
    } else if (type === 'bat') {
      textarea.value = `@echo off
:: ====================================================
:: Windows Server Batch Maintenance Script
:: Must be executed with Administrator privileges
:: ====================================================
title Windows Server Maintenance Script

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script requires Administrator privileges.
    echo Right-click and choose "Run as administrator".
    pause
    exit /b 1
)

echo [INFO] Flushing DNS Resolver Cache...
ipconfig /flushdns

echo [INFO] Restarting Windows Print Spooler Service...
net stop spooler
net start spooler

echo [SUCCESS] Tasks finished successfully.
pause
`;
    } else if (type === 'reg') {
      textarea.value = `Windows Registry Editor Version 5.00

; ========================================================
; Windows Server Hardening Registry Tweak
; 1. Enables RDP with Network Level Authentication (NLA)
; 2. Disables insecure SMBv1 protocol
; ========================================================

; Enable Remote Desktop
[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server]
"fDenyTSConnections"=dword:00000000

; Enforce Network Level Authentication (NLA)
[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp]
"UserAuthentication"=dword:00000001

; Disable SMBv1 Protocol for Ransomware Protection
[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters]
"SMB1"=dword:00000000
`;
    } else if (type === 'robocopy') {
      textarea.value = `@echo off
:: Robust Enterprise Robocopy File Server Migration Template
set SOURCE="D:\\Shares\\ProductionData"
set DESTINATION="\\\\BackupServer01\\DataBackup"
set LOG="C:\\AdminLogs\\Robocopy_Migration_%date:~10,4%%date:~4,2%%date:~7,2%.log"

echo Starting multi-threaded Robocopy synchronization...
robocopy %SOURCE% %DESTINATION% /E /ZB /COPYALL /DCOPY:DAT /MT:16 /R:1 /W:1 /NP /TEE /LOG:%LOG%

echo Robocopy finished with Exit Code: %errorlevel%
pause
`;
    }
  }

  /* ================= 5. POWERSHELL ARSENAL (INTEGRATED WITH GITBOOK) ================= */
  setupPowerShellArsenal() {
    const scriptTabs = document.querySelectorAll('.ps-script-tab');
    const paramContainer = document.getElementById('ps-params-container');
    const codeOutput = document.getElementById('ps-generated-code');
    const btnCopy = document.getElementById('btn-copy-ps-code');
    const btnDownload = document.getElementById('btn-download-ps-code');
    const linkDoc = document.getElementById('btn-ps-view-doc');

    let currentScriptId = 'audit';

    const scriptDefinitions = {
      audit: {
        title: 'Windows Server Security Audit Script',
        docPath: 'windows-server/powershell-scripts/windows-server-audit-script.md',
        renderParams: () => `
          <div class="cyber-form-row">
            <div class="cyber-form-group">
              <label class="cyber-label">// REPORT OUTPUT PATH</label>
              <input type="text" id="p-audit-path" class="cyber-input" value="C:\\SecurityAudit">
            </div>
            <div class="cyber-form-group">
              <label class="cyber-label">// DETECT EDR (SOPHOS / DEFENDER)</label>
              <select id="p-audit-edr" class="cyber-select-box">
                <option value="true">YES - FULL EDR AUDIT</option>
                <option value="false">NO - SKIP EDR CHECK</option>
              </select>
            </div>
            <div class="cyber-form-group">
              <label class="cyber-label">// DETECT BACKUP SOFTWARE</label>
              <select id="p-audit-backup" class="cyber-select-box">
                <option value="true">YES - ACRONIS & VEEAM</option>
                <option value="false">NO - SKIP</option>
              </select>
            </div>
          </div>
        `,
        generateCode: () => {
          const path = document.getElementById('p-audit-path')?.value || 'C:\\SecurityAudit';
          const edr = document.getElementById('p-audit-edr')?.value === 'true';
          const backup = document.getElementById('p-audit-backup')?.value === 'true';

          return `<#
.SYNOPSIS
    CloudTechtiq Windows Security Auditor Wrapper
    Reference: sys-admin-book/windows-server/powershell-scripts/windows-server-audit-script.md
#>

$AuditFolder = "${path}"
if (!(Test-Path $AuditFolder)) { New-Item -Path $AuditFolder -ItemType Directory | Out-Null }
$Timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$ReportFile = Join-Path $AuditFolder "WindowsSecurityAudit_$Timestamp.html"

Write-Host "[*] Auditing System Info & Hotfixes..." -ForegroundColor Cyan
$OS = Get-CimInstance Win32_OperatingSystem
$Uptime = (Get-Date) - $OS.LastBootUpTime

Write-Host "[*] Checking Network & Firewall Status..." -ForegroundColor Cyan
$FWProfiles = Get-NetFirewallProfile | Select-Object Name, Enabled

${edr ? `Write-Host "[*] Detecting EDR Solutions (Sophos / Defender)..." -ForegroundColor Yellow
$SophosServices = Get-Service | Where-Object { $_.Name -like "*Sophos*" }
$DefenderActive = (Get-MpComputerStatus).RealTimeProtectionEnabled
` : '# EDR Check Disabled'}

${backup ? `Write-Host "[*] Detecting Backup Services (Acronis, Veeam, Windows Backup)..." -ForegroundColor Yellow
$BackupServices = Get-Service | Where-Object { $_.Name -match "Acronis|Veeam|wbengine" }
` : '# Backup Check Disabled'}

Write-Host "[*] Auditing Local Administrators..." -ForegroundColor Cyan
$LocalAdmins = Get-LocalGroupMember -Group "Administrators" -ErrorAction SilentlyContinue

Write-Host "[+] Security Audit Completed! Report saved to: $ReportFile" -ForegroundColor Green
`;
        }
      },

      iis: {
        title: 'IIS Log Parser — Extract Client IPs (Port 80/443)',
        docPath: 'windows-server/powershell-scripts/iis-log-parser-extract-client-ips-for-requests-served-on-s-port-80-or-443.md',
        renderParams: () => `
          <div class="cyber-form-row">
            <div class="cyber-form-group">
              <label class="cyber-label">// IIS LOGS ROOT FOLDER</label>
              <input type="text" id="p-iis-path" class="cyber-input" value="C:\\inetpub\\logs\\LogFiles">
            </div>
            <div class="cyber-form-group">
              <label class="cyber-label">// EXPORT CSV DIRECTORY</label>
              <input type="text" id="p-iis-out" class="cyber-input" value="C:\\Logs">
            </div>
            <div class="cyber-form-group">
              <label class="cyber-label">// TARGET SERVER PORTS</label>
              <input type="text" id="p-iis-ports" class="cyber-input" value="80, 443">
            </div>
          </div>
        `,
        generateCode: () => {
          const root = document.getElementById('p-iis-path')?.value || 'C:\\inetpub\\logs\\LogFiles';
          const out = document.getElementById('p-iis-out')?.value || 'C:\\Logs';
          const ports = document.getElementById('p-iis-ports')?.value || '80, 443';

          return `# Parse-IISLogs-Ports.ps1
# Scans IIS W3C log files and extracts client IPs for ports ${ports}
# Reference: sys-admin-book/windows-server/powershell-scripts/iis-log-parser...

$IISLogRoot = "${root}"
$OutputFolder = "${out}"
if (!(Test-Path $OutputFolder)) { New-Item -Path $OutputFolder -ItemType Directory | Out-Null }

$timestamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
$OutputFile = Join-Path $OutputFolder "iis_clients_ports_$timestamp.csv"

"Timestamp,ClientIP,ServerPort,Method,Uri,Status,SiteLogFile" | Out-File -FilePath $OutputFile -Encoding utf8

$logFiles = Get-ChildItem -Path $IISLogRoot -Recurse -Filter *.log -ErrorAction SilentlyContinue

foreach ($file in $logFiles) {
    Write-Host "Scanning log: $($file.Name)..." -ForegroundColor Gray
    Get-Content -Path $file -Encoding utf8 | ForEach-Object {
        $line = $_.Trim()
        if ($line.StartsWith('#')) { return }
        $parts = $line.Split(' ')
        # Standard W3C fields: [0]=date, [1]=time, [2]=c-ip, [6]=s-port
        if ($parts.Count -ge 8) {
            $clientIp = $parts[8]
            $serverPort = $parts[6]
            if ($serverPort -in @(${ports})) {
                "$($parts[0]) $($parts[1]),$clientIp,$serverPort,$($parts[3]),$($parts[4]),$($parts[10]),$($file.Name)" | Add-Content -Path $OutputFile
            }
        }
    }
}

Write-Host "Finished! Client IP log written to: $OutputFile" -ForegroundColor Green
`;
        }
      },

      sql: {
        title: 'MS SQL Automated Backup & Retention Cleanup',
        docPath: 'database-servers/powershell-scripts/automating-weekly-ms-sql-database-backups-using-powershell-and-task-scheduler.md',
        renderParams: () => `
          <div class="cyber-form-row">
            <div class="cyber-form-group">
              <label class="cyber-label">// SQL INSTANCE</label>
              <input type="text" id="p-sql-instance" class="cyber-input" value="localhost">
            </div>
            <div class="cyber-form-group">
              <label class="cyber-label">// BACKUP DIRECTORY</label>
              <input type="text" id="p-sql-dir" class="cyber-input" value="D:\\SQLBackups">
            </div>
            <div class="cyber-form-group">
              <label class="cyber-label">// RETENTION PERIOD (DAYS)</label>
              <input type="number" id="p-sql-days" class="cyber-input" value="7" min="1" max="365">
            </div>
          </div>
        `,
        generateCode: () => {
          const instance = document.getElementById('p-sql-instance')?.value || 'localhost';
          const dir = document.getElementById('p-sql-dir')?.value || 'D:\\SQLBackups';
          const days = document.getElementById('p-sql-days')?.value || '7';

          return `# Automated MS SQL Database Backup & Old Backup Purge
# Reference: sys-admin-book/database-servers/powershell-scripts/automating-weekly-ms-sql-database-backups...

Import-Module SqlServer -ErrorAction SilentlyContinue

$SqlInstance = "${instance}"
$BackupFolder = "${dir}"
$RetentionDays = ${days}
$DateStamp = (Get-Date).ToString("yyyyMMdd_HHmmss")

if (!(Test-Path $BackupFolder)) { New-Item -ItemType Directory -Path $BackupFolder | Out-Null }

# 1. Query all User Databases (Exclude system DBs)
$Query = "SELECT name FROM sys.databases WHERE name NOT IN ('master','tempdb','model','msdb') AND state_desc = 'ONLINE'"
$Databases = Invoke-Sqlcmd -ServerInstance $SqlInstance -Query $Query

foreach ($db in $Databases) {
    $dbName = $db.name
    $bakFile = Join-Path $BackupFolder "$($dbName)_Full_$DateStamp.bak"
    Write-Host "Backing up database: $dbName to $bakFile..." -ForegroundColor Cyan
    Backup-SqlDatabase -ServerInstance $SqlInstance -Database $dbName -BackupFile $bakFile -CompressionOption On
}

# 2. Cleanup backups older than retention days
Write-Host "Purging backups older than $RetentionDays days..." -ForegroundColor Yellow
$Cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupFolder -Filter "*.bak" | Where-Object { $_.LastWriteTime -lt $Cutoff } | ForEach-Object {
    Write-Host "Deleting old backup: $($_.Name)" -ForegroundColor DarkGray
    Remove-Item $_.FullName -Force
}

Write-Host "MS SQL Backup routine finished successfully!" -ForegroundColor Green
`;
        }
      },

      monitor: {
        title: 'Continuous Server Health & TCP Connection Monitor',
        docPath: 'windows-server/server-monitoring-scripts/powershell-script-for-continuous-server-monitoring.md',
        renderParams: () => `
          <div class="cyber-form-row">
            <div class="cyber-form-group">
              <label class="cyber-label">// CPU ALERT THRESHOLD (%)</label>
              <input type="number" id="p-mon-cpu" class="cyber-input" value="85" min="50" max="99">
            </div>
            <div class="cyber-form-group">
              <label class="cyber-label">// MEMORY ALERT THRESHOLD (%)</label>
              <input type="number" id="p-mon-ram" class="cyber-input" value="90" min="50" max="99">
            </div>
            <div class="cyber-form-group">
              <label class="cyber-label">// MONITORED TCP PORTS</label>
              <input type="text" id="p-mon-ports" class="cyber-input" value="80, 443, 3389, 53">
            </div>
            <div class="cyber-form-group">
              <label class="cyber-label">// CHECK INTERVAL (SEC)</label>
              <input type="number" id="p-mon-int" class="cyber-input" value="10" min="2" max="300">
            </div>
          </div>
        `,
        generateCode: () => {
          const cpu = document.getElementById('p-mon-cpu')?.value || '85';
          const ram = document.getElementById('p-mon-ram')?.value || '90';
          const ports = document.getElementById('p-mon-ports')?.value || '80, 443, 3389, 53';
          const interval = document.getElementById('p-mon-int')?.value || '10';

          return `# Continuous Server Health & TCP Connection Monitor
# Reference: sys-admin-book/windows-server/server-monitoring-scripts/...

$CpuThreshold = ${cpu}
$RamThreshold = ${ram}
$CheckIntervalSec = ${interval}
$MonitoredPorts = @(${ports})

Clear-Host
Write-Host "=== CYBER//SYSADMIN ACTIVE SERVER MONITOR ===" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to terminate monitor stream.\n"

while ($true) {
    $Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    
    # 1. CPU Utilization
    $CpuLoad = [math]::Round((Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average, 1)

    # 2. RAM Utilization
    $OsInfo = Get-CimInstance Win32_OperatingSystem
    $TotalRam = $OsInfo.TotalVisibleMemorySize
    $FreeRam = $OsInfo.FreePhysicalMemory
    $RamUsagePct = [math]::Round((($TotalRam - $FreeRam) / $TotalRam) * 100, 1)

    # 3. Active TCP Connections on target ports
    $ActiveConnections = Get-NetTCPConnection -State Established -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in $MonitoredPorts }

    # Display Status Line
    $CpuColor = if ($CpuLoad -gt $CpuThreshold) { "Red" } else { "Green" }
    $RamColor = if ($RamUsagePct -gt $RamThreshold) { "Red" } else { "Green" }

    Write-Host "[$Timestamp] " -NoNewline
    Write-Host "CPU: $CpuLoad% " -ForegroundColor $CpuColor -NoNewline
    Write-Host "| RAM: $RamUsagePct% " -ForegroundColor $RamColor -NoNewline
    Write-Host "| Active Monitored TCP Connections: $($ActiveConnections.Count)" -ForegroundColor Cyan

    Start-Sleep -Seconds $CheckIntervalSec
}
`;
        }
      },

      m365: {
        title: 'M365 & Microsoft Graph Guest User Cleaner',
        docPath: 'email-and-office-365/automation/delete-all-the-guest-users-from-m365-tenant.md',
        renderParams: () => `
          <div class="cyber-form-row">
            <div class="cyber-form-group">
              <label class="cyber-label">// EXECUTION MODE</label>
              <select id="p-m365-mode" class="cyber-select-box">
                <option value="whatif">WHAT-IF (SIMULATION / DRY RUN - SAFE)</option>
                <option value="live">LIVE EXECUTION (PERMANENT DELETE)</option>
              </select>
            </div>
            <div class="cyber-form-group">
              <label class="cyber-label">// USER FILTER TYPE</label>
              <select id="p-m365-filter" class="cyber-select-box">
                <option value="guest">GUEST USERS (#EXT#@)</option>
                <option value="inactive">INACTIVE USERS (> 90 DAYS)</option>
              </select>
            </div>
          </div>
        `,
        generateCode: () => {
          const mode = document.getElementById('p-m365-mode')?.value || 'whatif';
          const isWhatIf = mode === 'whatif';

          return `# Microsoft Graph Automation: Guest User Cleanup
# Reference: sys-admin-book/email-and-office-365/automation/delete-all-the-guest-users-from-m365-tenant.md

# 1. Connect to Microsoft Graph
Connect-MgGraph -Scopes "User.ReadWrite.All"

Write-Host "Fetching all Guest Users from M365 Tenant..." -ForegroundColor Cyan
$GuestUsers = Get-MgUser -Filter "userType eq 'Guest'" -All

Write-Host "Found $($GuestUsers.Count) guest accounts." -ForegroundColor Yellow

foreach ($user in $GuestUsers) {
    ${isWhatIf ? `Write-Host "[WHAT-IF] Would remove guest: $($user.DisplayName) ($($user.UserPrincipalName))" -ForegroundColor Gray` : `try {
        Write-Host "Removing guest: $($user.DisplayName)..." -ForegroundColor Yellow
        Remove-MgUser -UserId $user.Id -Confirm:$false
        Write-Host "Successfully deleted $($user.UserPrincipalName)" -ForegroundColor Green
    } catch {
        Write-Host "Error deleting $($user.UserPrincipalName): $_" -ForegroundColor Red
    }`}
}

Write-Host "Operation finished." -ForegroundColor Cyan
`;
        }
      },

      robocopy: {
        title: 'Robocopy Enterprise Server Migration Builder',
        docPath: 'windows-server/task-scheduler/iis-app-pool-recycle-powershell-+-task-scheduler.md',
        renderParams: () => `
          <div class="cyber-form-row">
            <div class="cyber-form-group">
              <label class="cyber-label">// SOURCE DIRECTORY</label>
              <input type="text" id="p-robo-src" class="cyber-input" value="E:\\CompanyShares">
            </div>
            <div class="cyber-form-group">
              <label class="cyber-label">// DESTINATION DIRECTORY (UNC / LOCAL)</label>
              <input type="text" id="p-robo-dst" class="cyber-input" value="\\\\FileServer02\\TargetShare">
            </div>
            <div class="cyber-form-group">
              <label class="cyber-label">// MULTI-THREADING (THREADS)</label>
              <input type="number" id="p-robo-mt" class="cyber-input" value="16" min="1" max="128">
            </div>
            <div class="cyber-form-group">
              <label class="cyber-label">// MIRROR MODE</label>
              <select id="p-robo-mode" class="cyber-select-box">
                <option value="/MIR">/MIR - EXACT MIRROR (Deletes extra in dest)</option>
                <option value="/E">/E - SUBDIRECTORIES (Preserves extra in dest)</option>
              </select>
            </div>
          </div>
        `,
        generateCode: () => {
          const src = document.getElementById('p-robo-src')?.value || 'E:\\CompanyShares';
          const dst = document.getElementById('p-robo-dst')?.value || '\\\\FileServer02\\TargetShare';
          const mt = document.getElementById('p-robo-mt')?.value || '16';
          const mode = document.getElementById('p-robo-mode')?.value || '/MIR';

          return `@echo off
:: ===================================================================
:: Robocopy Enterprise High-Performance Migration
:: Features: Multi-threaded (/MT:${mt}), Restartable (/ZB), Full ACLs (/COPYALL)
:: ===================================================================

set SRC="${src}"
set DST="${dst}"
set LOG="C:\\AdminLogs\\Robocopy_Migration_%date:~10,4%%date:~4,2%%date:~7,2%.log"

if not exist "C:\\AdminLogs" mkdir "C:\\AdminLogs"

echo [START] Initiating Robocopy migration from %SRC% to %DST%...
robocopy %SRC% %DST% ${mode} /ZB /COPYALL /DCOPY:DAT /MT:${mt} /R:1 /W:1 /NP /TEE /LOG:%LOG%

echo.
echo [COMPLETED] Exit Code: %errorlevel% (0-1 = Success, 2-3 = Extras copied, 8+ = Error)
pause
`;
        }
      }
    };

    const updateArsenalUI = () => {
      const def = scriptDefinitions[currentScriptId];
      if (!def) return;

      paramContainer.innerHTML = def.renderParams();
      codeOutput.textContent = def.generateCode();

      if (linkDoc) {
        linkDoc.href = `#/${def.docPath}`;
      }

      // Rebind input events on newly injected param fields
      paramContainer.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', () => {
          codeOutput.textContent = def.generateCode();
        });
        input.addEventListener('change', () => {
          codeOutput.textContent = def.generateCode();
        });
      });
    };

    scriptTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        scriptTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentScriptId = tab.getAttribute('data-script');
        updateArsenalUI();
        if (window.cyberSFX) window.cyberSFX.playClick();
      });
    });

    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(codeOutput.textContent);
        this.copyConfirm(btnCopy);
      });
    }

    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        const isBat = currentScriptId === 'robocopy';
        const filename = isBat ? `${currentScriptId}-migration.bat` : `${currentScriptId}-automation.ps1`;
        const blob = new Blob([codeOutput.textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (window.cyberSFX) window.cyberSFX.playConfirm();
        if (window.cyberApp) window.cyberApp.showToast(`[DOWNLOAD] Saved ${filename}`, 'success');
      });
    }

    updateArsenalUI();
  }

  /* ================= 6. INTERACTIVE NETWORK ARCHITECTURE BUILDER ================= */
  setupNetworkArchitecture() {
    const canvas = document.getElementById('netarch-canvas');
    const nodesLayer = document.getElementById('netarch-nodes-layer');
    const svgLayer = document.getElementById('netarch-svg-layer');
    const paletteBtns = document.querySelectorAll('.palette-item-btn[data-type]');

    // Inspector elements
    const emptyInspector = document.getElementById('netarch-inspector-empty');
    const formInspector = document.getElementById('netarch-inspector-form');
    const inputLabel = document.getElementById('netarch-input-label');
    const selectZone = document.getElementById('netarch-select-zone');
    const inputIp = document.getElementById('netarch-input-ip');
    const inputPorts = document.getElementById('netarch-input-ports');
    const selectStatus = document.getElementById('netarch-select-status');
    const inspectBadge = document.getElementById('netarch-inspect-badge');
    const btnLinkSource = document.getElementById('btn-netarch-link-source');
    const btnDeleteThis = document.getElementById('btn-netarch-delete-this');

    // Stats
    const statNodes = document.getElementById('netarch-stat-nodes');
    const statLinks = document.getElementById('netarch-stat-links');
    const statZones = document.getElementById('netarch-stat-zones');

    // Toolbar buttons
    const btnConnectMode = document.getElementById('btn-netarch-connect-mode');
    const btnDeleteNode = document.getElementById('btn-netarch-delete-node');
    const btnClear = document.getElementById('btn-netarch-clear');
    const btnExportPng = document.getElementById('btn-netarch-export-png');
    const btnExportMermaid = document.getElementById('btn-netarch-export-mermaid');
    const btnTpl3Tier = document.getElementById('btn-netarch-tpl-3tier');
    const btnTplZeroTrust = document.getElementById('btn-netarch-tpl-zerotrust');
    const btnTplCorpLan = document.getElementById('btn-netarch-tpl-corplan');

    // Mermaid modal elements
    const mermaidModal = document.getElementById('netarch-mermaid-modal');
    const mermaidCode = document.getElementById('netarch-mermaid-code');
    const btnCloseModal = document.getElementById('btn-netarch-close-modal');
    const btnCopyMermaid = document.getElementById('btn-netarch-copy-mermaid');

    if (!canvas || !nodesLayer || !svgLayer) return;

    const COMPONENT_DEFS = {
      internet: { name: 'Internet / WAN', icon: '🌐', zone: 'public', ip: '0.0.0.0/0', ports: 'Any / 443' },
      waf: { name: 'Cloud WAF', icon: '🛡️', zone: 'public', ip: '104.16.24.1/24', ports: '80, 443 (OWASP)' },
      firewall: { name: 'Edge Firewall', icon: '🔥', zone: 'dmz', ip: '192.168.1.1/24', ports: 'Stateful SPI, NAT' },
      vpn: { name: 'VPN Gateway', icon: '🔒', zone: 'dmz', ip: '192.168.1.5/24', ports: '500, 4500 (IPsec)' },
      loadbalancer: { name: 'Load Balancer', icon: '⚖️', zone: 'dmz', ip: '192.168.1.10/24', ports: '80, 443, 8443' },
      proxy: { name: 'Reverse Proxy', icon: '🔄', zone: 'dmz', ip: '192.168.1.15/24', ports: '80, 443, 8080' },
      switch: { name: 'Core L3 Switch', icon: '🖧', zone: 'private', ip: '10.0.0.2/24', ports: 'VLAN 10, 20, 30' },
      iis: { name: 'Windows IIS Web', icon: '🪟', zone: 'private', ip: '10.0.10.10/24', ports: '80, 443 (TLS 1.3)' },
      dc: { name: 'Active Directory DC', icon: '🔑', zone: 'private', ip: '10.0.0.10/24', ports: '53 (DNS), 88, 389' },
      linux: { name: 'Linux App Server', icon: '🐧', zone: 'private', ip: '10.0.10.20/24', ports: '22, 5000, 8080' },
      k8s: { name: 'K8s Cluster Node', icon: '☸️', zone: 'private', ip: '10.0.20.10/24', ports: '6443, 10250, NodePort' },
      sql: { name: 'MS SQL Server', icon: '🗄️', zone: 'database', ip: '10.0.30.10/24', ports: '1433 (TDS), 5022 (AG)' },
      postgres: { name: 'PostgreSQL DB', icon: '🐘', zone: 'database', ip: '10.0.30.20/24', ports: '5432 (PostgreSQL)' },
      storage: { name: 'SAN S2D Storage', icon: '💾', zone: 'database', ip: '10.0.30.50/24', ports: '3260 (iSCSI), 445 (SMB3)' }
    };

    let nodeCounter = 0;
    const state = {
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isConnectingMode: false,
      connectSourceId: null
    };

    // Update Global Stats HUD
    const updateStats = () => {
      if (statNodes) statNodes.textContent = state.nodes.length;
      if (statLinks) statLinks.textContent = state.edges.length;
      if (statZones) {
        const uniqueZones = new Set(state.nodes.map(n => n.zone));
        statZones.textContent = uniqueZones.size;
      }
    };

    // Render SVG connector wires
    const renderEdges = () => {
      svgLayer.innerHTML = '';
      const cRect = canvas.getBoundingClientRect();
      const svgW = cRect.width || canvas.clientWidth || 800;
      const svgH = cRect.height || canvas.clientHeight || 580;
      svgLayer.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);

      state.edges.forEach(edge => {
        const fromNode = state.nodes.find(n => n.id === edge.from);
        const toNode = state.nodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) return;

        const x1 = fromNode.x + 70;
        const y1 = fromNode.y + 35;
        const x2 = toNode.x + 70;
        const y2 = toNode.y + 35;

        // SVG Group for edge
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-edge-id', edge.id);
        g.style.cursor = 'pointer';

        // Invisible wider stroke for easy hover/clicking
        const hitLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hitLine.setAttribute('x1', x1);
        hitLine.setAttribute('y1', y1);
        hitLine.setAttribute('x2', x2);
        hitLine.setAttribute('y2', y2);
        hitLine.setAttribute('stroke', 'transparent');
        hitLine.setAttribute('stroke-width', '16');
        hitLine.style.pointerEvents = 'stroke';

        // Visible glowing neon line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('class', 'netarch-connector-line');

        // Animated pulse packet moving along line
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('r', '3');
        dot.setAttribute('class', 'netarch-pulse-dot');
        const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        anim.setAttribute('path', `M ${x1} ${y1} L ${x2} ${y2}`);
        anim.setAttribute('dur', '2s');
        anim.setAttribute('repeatCount', 'indefinite');
        dot.appendChild(anim);

        g.appendChild(hitLine);
        g.appendChild(line);
        g.appendChild(dot);

        // Click on connector line to delete edge
        g.addEventListener('click', (e) => {
          e.stopPropagation();
          state.edges = state.edges.filter(ed => ed.id !== edge.id);
          renderEdges();
          updateStats();
          if (window.cyberSFX) window.cyberSFX.playClick();
          if (window.cyberApp) window.cyberApp.showToast('[LINK] Network cable disconnected', 'info');
        });

        svgLayer.appendChild(g);
      });
    };

    // Update Inspector form values based on selected node
    const updateInspector = () => {
      const selected = state.nodes.find(n => n.id === state.selectedNodeId);
      if (!selected) {
        if (emptyInspector) emptyInspector.style.display = 'block';
        if (formInspector) formInspector.style.display = 'none';
        if (inspectBadge) inspectBadge.textContent = 'READY';
        return;
      }

      if (emptyInspector) emptyInspector.style.display = 'none';
      if (formInspector) formInspector.style.display = 'flex';

      if (inputLabel) inputLabel.value = selected.name;
      if (selectZone) selectZone.value = selected.zone;
      if (inputIp) inputIp.value = selected.ip;
      if (inputPorts) inputPorts.value = selected.ports;
      if (selectStatus) selectStatus.value = selected.status;
      if (inspectBadge) {
        inspectBadge.textContent = selected.status;
        inspectBadge.className = selected.status === 'ONLINE' || selected.status === 'ACTIVE' 
          ? 'res-badge success' : 'res-badge';
      }
    };

    // Synchronize selected node DOM card with state
    const updateNodeDOM = (node) => {
      const el = nodesLayer.querySelector(`.netarch-node[data-id="${node.id}"]`);
      if (!el) return;

      const titleEl = el.querySelector('.node-title');
      const ipEl = el.querySelector('.node-ip');
      const tagEl = el.querySelector('.node-zone-tag');

      if (titleEl) titleEl.textContent = node.name;
      if (ipEl) ipEl.textContent = node.ip || '0.0.0.0';
      if (tagEl) {
        tagEl.textContent = node.zone.toUpperCase();
        tagEl.className = `node-zone-tag ${node.zone}`;
      }
    };

    // Select a node
    const selectNode = (nodeId) => {
      state.selectedNodeId = nodeId;
      nodesLayer.querySelectorAll('.netarch-node').forEach(el => {
        el.classList.toggle('selected', el.getAttribute('data-id') === nodeId);
      });
      updateInspector();
    };

    // Create and attach a node to canvas
    const addNode = (type, x, y, customProps = {}) => {
      const def = COMPONENT_DEFS[type] || COMPONENT_DEFS.iis;
      nodeCounter++;
      const id = 'node_' + nodeCounter;

      const node = {
        id,
        type,
        name: customProps.name || `${def.name} #${nodeCounter}`,
        icon: def.icon,
        zone: customProps.zone || def.zone,
        ip: customProps.ip || def.ip,
        ports: customProps.ports || def.ports,
        status: customProps.status || 'ONLINE',
        x: Math.max(10, Math.min(canvas.clientWidth - 150, x)),
        y: Math.max(10, Math.min(canvas.clientHeight - 80, y))
      };

      state.nodes.push(node);

      // Create DOM node element
      const el = document.createElement('div');
      el.className = 'netarch-node';
      el.setAttribute('data-id', node.id);
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;

      el.innerHTML = `
        <div class="node-header">
          <span class="node-icon">${node.icon}</span>
          <span class="node-title">${this.escapeHtml(node.name)}</span>
        </div>
        <div class="node-ip">${this.escapeHtml(node.ip)}</div>
        <div>
          <span class="node-zone-tag ${node.zone}">${node.zone.toUpperCase()}</span>
        </div>
      `;

      // Dragging logic
      let isDragging = false;
      let startMouseX = 0;
      let startMouseY = 0;
      let startNodeX = 0;
      let startNodeY = 0;
      let dragMoved = false;

      el.addEventListener('mousedown', (e) => {
        if (state.isConnectingMode) return;
        isDragging = true;
        dragMoved = false;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        startNodeX = node.x;
        startNodeY = node.y;

        const onMouseMove = (ev) => {
          if (!isDragging) return;
          const dx = ev.clientX - startMouseX;
          const dy = ev.clientY - startMouseY;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            dragMoved = true;
          }
          const cWidth = canvas.clientWidth || 800;
          const cHeight = canvas.clientHeight || 580;
          node.x = Math.max(6, Math.min(cWidth - 146, startNodeX + dx));
          node.y = Math.max(6, Math.min(cHeight - 76, startNodeY + dy));
          el.style.left = `${node.x}px`;
          el.style.top = `${node.y}px`;
          renderEdges();
        };

        const onMouseUp = () => {
          isDragging = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });

      // Node Click Handler
      el.addEventListener('click', (e) => {
        e.stopPropagation();

        if (state.isConnectingMode) {
          if (!state.connectSourceId) {
            // First node clicked: set as source
            state.connectSourceId = node.id;
            nodesLayer.querySelectorAll('.netarch-node').forEach(n => {
              n.classList.toggle('connecting-source', n.getAttribute('data-id') === node.id);
            });
            if (window.cyberSFX) window.cyberSFX.playClick();
            if (window.cyberApp) window.cyberApp.showToast(`[CONNECT] Source: ${node.name}. Now click target node.`, 'info');
          } else if (state.connectSourceId === node.id) {
            // Clicked same node: cancel
            state.connectSourceId = null;
            el.classList.remove('connecting-source');
            if (window.cyberSFX) window.cyberSFX.playClick();
          } else {
            // Second node clicked: create connection edge
            const sourceId = state.connectSourceId;
            const targetId = node.id;
            const edgeExists = state.edges.some(
              ed => (ed.from === sourceId && ed.to === targetId) || (ed.from === targetId && ed.to === sourceId)
            );

            if (!edgeExists) {
              state.edges.push({
                id: `${sourceId}_${targetId}`,
                from: sourceId,
                to: targetId
              });
              renderEdges();
              updateStats();
              if (window.cyberSFX) window.cyberSFX.playConfirm();
              if (window.cyberApp) window.cyberApp.showToast('[CONNECT] Network uplink established!', 'success');
            }

            state.connectSourceId = null;
            nodesLayer.querySelectorAll('.netarch-node').forEach(n => n.classList.remove('connecting-source'));
          }
          return;
        }

        // Standard select mode
        selectNode(node.id);
        if (window.cyberSFX) window.cyberSFX.playClick();
      });

      nodesLayer.appendChild(el);
      selectNode(node.id);
      renderEdges();
      updateStats();
      return node;
    };

    // Delete a node and all connected edges
    const deleteNode = (nodeId) => {
      if (!nodeId) return;
      state.nodes = state.nodes.filter(n => n.id !== nodeId);
      state.edges = state.edges.filter(e => e.from !== nodeId && e.to !== nodeId);

      const el = nodesLayer.querySelector(`.netarch-node[data-id="${nodeId}"]`);
      if (el) el.remove();

      if (state.selectedNodeId === nodeId) {
        state.selectedNodeId = null;
        updateInspector();
      }
      if (state.connectSourceId === nodeId) {
        state.connectSourceId = null;
      }

      renderEdges();
      updateStats();
      if (window.cyberSFX) window.cyberSFX.playClick();
      if (window.cyberApp) window.cyberApp.showToast('[DELETE] Node decommissioned', 'info');
    };

    // Clear entire canvas
    const clearAll = () => {
      state.nodes = [];
      state.edges = [];
      state.selectedNodeId = null;
      state.connectSourceId = null;
      nodesLayer.innerHTML = '';
      svgLayer.innerHTML = '';
      updateInspector();
      updateStats();
      if (window.cyberSFX) window.cyberSFX.playClick();
    };

    // Toggle Connect Nodes Mode
    const toggleConnectMode = () => {
      state.isConnectingMode = !state.isConnectingMode;
      state.connectSourceId = null;
      nodesLayer.querySelectorAll('.netarch-node').forEach(n => n.classList.remove('connecting-source'));

      if (btnConnectMode) {
        if (state.isConnectingMode) {
          btnConnectMode.innerHTML = `<span style="color:#00ff66;">🔗 CONNECT NODES: ON</span>`;
          btnConnectMode.style.borderColor = '#00ff66';
          if (window.cyberApp) window.cyberApp.showToast('[MODE] Connect mode ON: Click source node then target node', 'info');
        } else {
          btnConnectMode.innerHTML = `<span>🔗 CONNECT NODES: OFF</span>`;
          btnConnectMode.style.borderColor = '';
        }
      }
      if (window.cyberSFX) window.cyberSFX.playClick();
    };

    // Palette Click Handlers
    paletteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        // Spawn near center with slight random offset
        const cW = canvas.clientWidth || 800;
        const cH = canvas.clientHeight || 580;
        const spawnX = Math.round(cW / 2 - 70 + (Math.random() * 80 - 40));
        const spawnY = Math.round(cH / 2 - 40 + (Math.random() * 80 - 40));

        addNode(type, spawnX, spawnY);
        if (window.cyberSFX) window.cyberSFX.playClick();
        if (window.cyberApp) window.cyberApp.showToast(`[ADDED] ${COMPONENT_DEFS[type]?.name || type}`, 'success');
      });
    });

    // Inspector Realtime Input Syncing
    if (inputLabel) {
      inputLabel.addEventListener('input', (e) => {
        const node = state.nodes.find(n => n.id === state.selectedNodeId);
        if (node) {
          node.name = e.target.value;
          updateNodeDOM(node);
        }
      });
    }

    if (selectZone) {
      selectZone.addEventListener('change', (e) => {
        const node = state.nodes.find(n => n.id === state.selectedNodeId);
        if (node) {
          node.zone = e.target.value;
          updateNodeDOM(node);
          updateStats();
        }
      });
    }

    if (inputIp) {
      inputIp.addEventListener('input', (e) => {
        const node = state.nodes.find(n => n.id === state.selectedNodeId);
        if (node) {
          node.ip = e.target.value;
          updateNodeDOM(node);
        }
      });
    }

    if (inputPorts) {
      inputPorts.addEventListener('input', (e) => {
        const node = state.nodes.find(n => n.id === state.selectedNodeId);
        if (node) {
          node.ports = e.target.value;
        }
      });
    }

    if (selectStatus) {
      selectStatus.addEventListener('change', (e) => {
        const node = state.nodes.find(n => n.id === state.selectedNodeId);
        if (node) {
          node.status = e.target.value;
          if (inspectBadge) {
            inspectBadge.textContent = node.status;
            inspectBadge.className = node.status === 'ONLINE' || node.status === 'ACTIVE' 
              ? 'res-badge success' : 'res-badge';
          }
        }
      });
    }

    if (btnLinkSource) {
      btnLinkSource.addEventListener('click', () => {
        if (!state.selectedNodeId) return;
        state.isConnectingMode = true;
        state.connectSourceId = state.selectedNodeId;
        nodesLayer.querySelectorAll('.netarch-node').forEach(n => {
          n.classList.toggle('connecting-source', n.getAttribute('data-id') === state.selectedNodeId);
        });
        if (btnConnectMode) {
          btnConnectMode.innerHTML = `<span style="color:#00ff66;">🔗 CONNECT NODES: ON</span>`;
          btnConnectMode.style.borderColor = '#00ff66';
        }
        if (window.cyberSFX) window.cyberSFX.playClick();
        if (window.cyberApp) window.cyberApp.showToast('[CONNECT] Click target node to create link', 'info');
      });
    }

    if (btnDeleteThis) {
      btnDeleteThis.addEventListener('click', () => {
        deleteNode(state.selectedNodeId);
      });
    }

    if (btnDeleteNode) {
      btnDeleteNode.addEventListener('click', () => {
        deleteNode(state.selectedNodeId);
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('Clear all network architecture nodes and links?')) {
          clearAll();
        }
      });
    }

    if (btnConnectMode) {
      btnConnectMode.addEventListener('click', toggleConnectMode);
    }

    // Deselect when clicking empty canvas
    canvas.addEventListener('click', (e) => {
      if (e.target === canvas || e.target === svgLayer || e.target.id === 'netarch-nodes-layer') {
        if (state.isConnectingMode) {
          state.connectSourceId = null;
          nodesLayer.querySelectorAll('.netarch-node').forEach(n => n.classList.remove('connecting-source'));
        } else {
          state.selectedNodeId = null;
          nodesLayer.querySelectorAll('.netarch-node').forEach(n => n.classList.remove('selected'));
          updateInspector();
        }
      }
    });

    // ================= TOPOLOGY TEMPLATES =================
    const loadTemplate = (nodesData, edgesData) => {
      clearAll();
      const idMap = {};

      nodesData.forEach(nd => {
        const created = addNode(nd.type, nd.x, nd.y, {
          name: nd.name,
          zone: nd.zone,
          ip: nd.ip,
          ports: nd.ports,
          status: nd.status || 'ONLINE'
        });
        idMap[nd.templateId] = created.id;
      });

      edgesData.forEach(ed => {
        const fromId = idMap[ed.from];
        const toId = idMap[ed.to];
        if (fromId && toId) {
          state.edges.push({
            id: `${fromId}_${toId}`,
            from: fromId,
            to: toId
          });
        }
      });

      renderEdges();
      updateStats();
      if (state.nodes.length) {
        selectNode(state.nodes[0].id);
      }
    };

    if (btnTpl3Tier) {
      btnTpl3Tier.addEventListener('click', () => {
        loadTemplate([
          { templateId: 'wan', type: 'internet', name: 'INTERNET / WAN', zone: 'public', ip: '0.0.0.0/0', ports: 'Any / HTTPS', x: 30, y: 50 },
          { templateId: 'waf', type: 'waf', name: 'CLOUD-WAF-01', zone: 'public', ip: '104.16.24.1', ports: '80, 443 (OWASP)', x: 30, y: 220 },
          { templateId: 'fw', type: 'firewall', name: 'EDGE-FW-01', zone: 'dmz', ip: '192.168.1.1/24', ports: 'Stateful SPI', x: 230, y: 135 },
          { templateId: 'lb', type: 'loadbalancer', name: 'LB-HAPROXY-01', zone: 'dmz', ip: '192.168.1.10/24', ports: '80, 443, 8443', x: 420, y: 135 },
          { templateId: 'iis1', type: 'iis', name: 'WEB-IIS-01', zone: 'private', ip: '10.0.10.11/24', ports: '80, 443 SSL', x: 610, y: 50 },
          { templateId: 'iis2', type: 'iis', name: 'WEB-IIS-02', zone: 'private', ip: '10.0.10.12/24', ports: '80, 443 SSL', x: 610, y: 220 },
          { templateId: 'api', type: 'linux', name: 'APP-API-CORE', zone: 'private', ip: '10.0.10.30/24', ports: '5000, 8000', x: 790, y: 135 },
          { templateId: 'sql', type: 'sql', name: 'SQL-PROD-AG', zone: 'database', ip: '10.0.30.10/24', ports: '1433 (AG Replica)', x: 790, y: 310 },
          { templateId: 'san', type: 'storage', name: 'SAN-ARRAY-01', zone: 'database', ip: '10.0.30.50/24', ports: '3260 iSCSI, SMB3', x: 610, y: 310 }
        ], [
          { from: 'wan', to: 'waf' },
          { from: 'waf', to: 'fw' },
          { from: 'fw', to: 'lb' },
          { from: 'lb', to: 'iis1' },
          { from: 'lb', to: 'iis2' },
          { from: 'iis1', to: 'api' },
          { from: 'iis2', to: 'api' },
          { from: 'api', to: 'sql' },
          { from: 'sql', to: 'san' }
        ]);
        if (window.cyberSFX) window.cyberSFX.playConfirm();
        if (window.cyberApp) window.cyberApp.showToast('[TOPOLOGY] Loaded 3-Tier Enterprise Web App', 'success');
      });
    }

    if (btnTplZeroTrust) {
      btnTplZeroTrust.addEventListener('click', () => {
        loadTemplate([
          { templateId: 'wan', type: 'internet', name: 'INTERNET / WAN', zone: 'public', ip: '0.0.0.0/0', ports: 'Any', x: 40, y: 140 },
          { templateId: 'fw', type: 'firewall', name: 'EDGE-FW-01', zone: 'dmz', ip: '192.168.1.1/24', ports: 'Stateful SPI', x: 230, y: 140 },
          { templateId: 'proxy', type: 'proxy', name: 'REVERSE-PROXY-01', zone: 'dmz', ip: '192.168.1.15/24', ports: '443 mTLS', x: 420, y: 60 },
          { templateId: 'vpn', type: 'vpn', name: 'ZERO-TRUST-GW', zone: 'dmz', ip: '192.168.1.5/24', ports: 'IPsec / Wireguard', x: 420, y: 220 },
          { templateId: 'sw', type: 'switch', name: 'CORE-SW-01', zone: 'private', ip: '10.0.0.2/24', ports: '802.1Q VLANs', x: 610, y: 140 },
          { templateId: 'dc', type: 'dc', name: 'DC01-AD-PROD', zone: 'private', ip: '10.0.0.10/24', ports: 'Kerberos, LDAPS', x: 800, y: 60 },
          { templateId: 'iis', type: 'iis', name: 'INTRANET-PORTAL', zone: 'private', ip: '10.0.10.15/24', ports: '443 HTTPS', x: 800, y: 220 },
          { templateId: 'san', type: 'storage', name: 'SAN-ENCRYPTED-S2D', zone: 'database', ip: '10.0.30.50/24', ports: 'BitLocker / SMB3', x: 800, y: 350 }
        ], [
          { from: 'wan', to: 'fw' },
          { from: 'fw', to: 'proxy' },
          { from: 'fw', to: 'vpn' },
          { from: 'proxy', to: 'sw' },
          { from: 'vpn', to: 'sw' },
          { from: 'sw', to: 'dc' },
          { from: 'sw', to: 'iis' },
          { from: 'iis', to: 'san' }
        ]);
        if (window.cyberSFX) window.cyberSFX.playConfirm();
        if (window.cyberApp) window.cyberApp.showToast('[TOPOLOGY] Loaded Zero-Trust DMZ Architecture', 'success');
      });
    }

    if (btnTplCorpLan) {
      btnTplCorpLan.addEventListener('click', () => {
        loadTemplate([
          { templateId: 'wan', type: 'internet', name: 'REMOTE BRANCHES', zone: 'public', ip: 'WAN Gateway', ports: 'SD-WAN', x: 40, y: 140 },
          { templateId: 'vpn', type: 'vpn', name: 'HQ-IPSEC-VPN', zone: 'dmz', ip: '192.168.1.5/24', ports: '500, 4500 UDP', x: 230, y: 140 },
          { templateId: 'sw', type: 'switch', name: 'CORE-SW-L3', zone: 'private', ip: '10.0.0.2/24', ports: '48p 10GbE SFP+', x: 420, y: 140 },
          { templateId: 'dc1', type: 'dc', name: 'DC01-PRIMARY-FSMO', zone: 'private', ip: '10.0.0.10/24', ports: 'DNS, Kerberos, AD DS', x: 620, y: 50 },
          { templateId: 'dc2', type: 'dc', name: 'DC02-REPLICA-DNS', zone: 'private', ip: '10.0.0.11/24', ports: 'AD Replication', x: 620, y: 175 },
          { templateId: 'k8s', type: 'k8s', name: 'K8S-MICROSERVICES', zone: 'private', ip: '10.0.20.0/24', ports: '6443 API', x: 620, y: 300 },
          { templateId: 'pg', type: 'postgres', name: 'POSTGRESQL-HA', zone: 'database', ip: '10.0.30.20/24', ports: '5432 / Patroni', x: 810, y: 300 }
        ], [
          { from: 'wan', to: 'vpn' },
          { from: 'vpn', to: 'sw' },
          { from: 'sw', to: 'dc1' },
          { from: 'sw', to: 'dc2' },
          { from: 'sw', to: 'k8s' },
          { from: 'k8s', to: 'pg' }
        ]);
        if (window.cyberSFX) window.cyberSFX.playConfirm();
        if (window.cyberApp) window.cyberApp.showToast('[TOPOLOGY] Loaded Corporate AD & LAN', 'success');
      });
    }

    // ================= MERMAID EXPORTER =================
    const generateMermaidCode = () => {
      if (!state.nodes.length) {
        return '%% [EMPTY TOPOLOGY]\nflowchart TD\n  Start["No nodes on canvas. Add components from palette."]';
      }

      let code = 'flowchart TD\n';

      const zones = {
        public: { title: '🌐 Public Internet & Cloud Perimeter', nodes: [] },
        dmz: { title: '🛡️ Demilitarized Zone (DMZ)', nodes: [] },
        private: { title: '🏢 Internal Corporate LAN & Application Tier', nodes: [] },
        database: { title: '🗄️ Secure Database & Enterprise Storage Tier', nodes: [] }
      };

      state.nodes.forEach(n => {
        const z = zones[n.zone] || zones.private;
        z.nodes.push(n);
      });

      Object.entries(zones).forEach(([zKey, zData]) => {
        if (zData.nodes.length > 0) {
          code += `  subgraph ${zKey.toUpperCase()} ["${zData.title}"]\n`;
          zData.nodes.forEach(n => {
            const cleanName = n.name.replace(/["\\]/g, '');
            const cleanIp = (n.ip || '').replace(/["\\]/g, '');
            code += `    ${n.id}["${n.icon} ${cleanName}<br/><code>${cleanIp}</code>"]\n`;
          });
          code += `  end\n\n`;
        }
      });

      if (state.edges.length > 0) {
        code += `  %% Inter-zone network traffic uplinks\n`;
        state.edges.forEach(e => {
          code += `  ${e.from} --> ${e.to}\n`;
        });
      }

      return code;
    };

    if (btnExportMermaid && mermaidModal && mermaidCode) {
      btnExportMermaid.addEventListener('click', () => {
        const code = generateMermaidCode();
        mermaidCode.textContent = code;
        mermaidModal.style.display = 'flex';
        if (window.cyberSFX) window.cyberSFX.playClick();
      });

      if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
          mermaidModal.style.display = 'none';
        });
      }

      if (btnCopyMermaid) {
        btnCopyMermaid.addEventListener('click', () => {
          navigator.clipboard.writeText(mermaidCode.textContent).then(() => {
            this.copyConfirm(btnCopyMermaid);
          });
        });
      }
    }

    // ================= PNG BLUEPRINT EXPORTER =================
    if (btnExportPng) {
      btnExportPng.addEventListener('click', () => {
        if (!state.nodes.length) {
          if (window.cyberApp) window.cyberApp.showToast('[ERROR] Canvas is empty!', 'error');
          return;
        }

        const outCanvas = document.createElement('canvas');
        const width = 1200;
        const height = 800;
        outCanvas.width = width;
        outCanvas.height = height;
        const ctx = outCanvas.getContext('2d');

        // Background
        ctx.fillStyle = '#03060f';
        ctx.fillRect(0, 0, width, height);

        // Cyber Grid Lines
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
        ctx.lineWidth = 1;
        const gridSize = 25;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Header Title
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#00f3ff';
        ctx.fillText('CYBER//SYSADMIN NETWORK ARCHITECTURE TOPOLOGY', 30, 40);

        ctx.font = '12px monospace';
        ctx.fillStyle = '#8b9bb4';
        ctx.fillText(`Generated: ${new Date().toISOString()} | Nodes: ${state.nodes.length} | Links: ${state.edges.length}`, 30, 65);

        // Scale factors from DOM canvas to 1200x800 blueprint
        const cRect = canvas.getBoundingClientRect();
        const scaleX = width / Math.max(cRect.width, 1);
        const scaleY = height / Math.max(cRect.height, 1);

        // Draw Links
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 8;

        state.edges.forEach(edge => {
          const fromNode = state.nodes.find(n => n.id === edge.from);
          const toNode = state.nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return;

          const x1 = (fromNode.x + 70) * scaleX;
          const y1 = (fromNode.y + 35) * scaleY;
          const x2 = (toNode.x + 70) * scaleX;
          const y2 = (toNode.y + 35) * scaleY;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        });

        // Reset shadow
        ctx.shadowBlur = 0;

        // Draw Nodes
        const zoneColors = {
          public: '#00f3ff',
          dmz: '#ffb700',
          private: '#00ff66',
          database: '#ff007f'
        };

        state.nodes.forEach(node => {
          const nx = node.x * scaleX;
          const ny = node.y * scaleY;
          const nw = 140 * scaleX;
          const nh = 68 * scaleY;

          // Box Background
          ctx.fillStyle = 'rgba(12, 18, 34, 0.94)';
          ctx.fillRect(nx, ny, nw, nh);

          const accentColor = zoneColors[node.zone] || '#00f3ff';

          // Box Border
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(nx, ny, nw, nh);

          // Left Accent Strip
          ctx.fillStyle = accentColor;
          ctx.fillRect(nx, ny, 4 * scaleX, nh);

          // Node Title
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(11 * scaleX)}px monospace`;
          ctx.fillText(`${node.icon} ${node.name}`.slice(0, 18), nx + 10 * scaleX, ny + 20 * scaleY);

          // Node IP
          ctx.fillStyle = '#8b9bb4';
          ctx.font = `${Math.round(10 * scaleX)}px monospace`;
          ctx.fillText(node.ip || '0.0.0.0', nx + 10 * scaleX, ny + 40 * scaleY);

          // Zone Tag
          ctx.fillStyle = accentColor;
          ctx.font = `bold ${Math.round(9 * scaleX)}px monospace`;
          ctx.fillText(`[${node.zone.toUpperCase()}] ${node.status}`, nx + 10 * scaleX, ny + 58 * scaleY);
        });

        // Download PNG Blob
        outCanvas.toBlob(blob => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `network-topology-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          if (window.cyberSFX) window.cyberSFX.playConfirm();
          if (window.cyberApp) window.cyberApp.showToast('[EXPORT] Network architecture PNG downloaded!', 'success');
        });
      });
    }

    // Load initial default 3-Tier topology
    setTimeout(() => {
      if (btnTpl3Tier) btnTpl3Tier.click();
    }, 100);
  }

  /* ================= UTILITY HELPERS ================= */
  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  copyConfirm(btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span>COPIED!</span>`;
    btn.style.borderColor = '#00ff66';
    btn.style.color = '#00ff66';
    if (window.cyberSFX) window.cyberSFX.playConfirm();
    if (window.cyberApp) window.cyberApp.showToast('[CLIPBOARD] Copied to clipboard!', 'success');
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 1500);
  }
}

window.cyberTools = new CyberToolsEngine();
