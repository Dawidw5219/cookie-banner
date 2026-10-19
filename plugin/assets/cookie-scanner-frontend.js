/**
 * Cookie Scanner — Frontend collector.
 *
 * Loaded when scan mode is active. Collects cookies + storage,
 * shows only NEW cookies (not already in the database) in a
 * draggable floating panel. Two counters: total vs caught.
 *
 * Also detects tracking scripts via DOM inspection and network
 * activity (PerformanceObserver), and reports them to the backend.
 */
(function () {
	'use strict';

	const config = window.__cookieScanConfig;
	if (!config || !config.restUrl) return;

	const INTERVAL = config.interval || 3000;
	const MAX_VISIBLE = 5;
	const pageUrl = window.location.href.split('?')[0];
	let knownKeys = new Set();       // All cookies seen on this page load.
	let existingKeys = new Set();    // Cookies that were already in DB before scan.
	let caughtItems = [];            // Only genuinely new cookies.
	let totalInDb = 0;
	let caughtCount = 0;
	let panelExpanded = true;
	let lastNewAt = Date.now();
	let ready = false;

	/* ── Tracker detection ────────────────────── */
	const trackerDb = config.trackerDb || {};
	const detectedTrackers = new Set();   // tracker IDs already sent to backend
	let trackerCount = 0;

	/** Check if a URL matches any pattern in the tracker database. */
	function matchTracker(url) {
		if (!url) return null;
		const lower = url.toLowerCase();
		for (const [name, tracker] of Object.entries(trackerDb)) {
			const patterns = (tracker.scriptPatterns || []).concat(tracker.networkPatterns || []);
			for (const pattern of patterns) {
				if (lower.includes(pattern.toLowerCase())) {
					return { id: tracker.id, name: name, tracker: tracker };
				}
			}
		}
		return null;
	}

	/** Collect trackers from existing script/iframe/img elements. */
	function scanDomForTrackers() {
		const found = [];
		const elements = document.querySelectorAll('script[src], iframe[src], img[src]');
		for (const el of elements) {
			const src = el.getAttribute('src') || '';
			const match = matchTracker(src);
			if (match && !detectedTrackers.has(match.id)) {
				detectedTrackers.add(match.id);
				found.push({
					tracker_id: match.id,
					name: match.name,
					category: match.tracker.category,
					description: match.tracker.description,
					privacy_link: match.tracker.privacyLink || '',
					detected_via: el.tagName.toLowerCase(),
					detected_url: src.substring(0, 200),
					page: pageUrl,
				});
			}
		}
		return found;
	}

	/** Collect trackers from performance resource entries. */
	function scanPerformanceForTrackers() {
		const found = [];
		try {
			const entries = performance.getEntriesByType('resource');
			for (const entry of entries) {
				const match = matchTracker(entry.name);
				if (match && !detectedTrackers.has(match.id)) {
					detectedTrackers.add(match.id);
					found.push({
						tracker_id: match.id,
						name: match.name,
						category: match.tracker.category,
						description: match.tracker.description,
						privacy_link: match.tracker.privacyLink || '',
						detected_via: 'network',
						detected_url: entry.name.substring(0, 200),
						page: pageUrl,
					});
				}
			}
		} catch (e) { /* PerformanceObserver may not be available */ }
		return found;
	}

	/** Send detected trackers to backend. */
	async function reportTrackers(trackers) {
		if (trackers.length === 0) return;
		trackerCount += trackers.length;
		updateTrackerBadge();
		try {
			const baseUrl = config.restUrl.replace(/\/scan$/, '');
			await fetch(baseUrl + '/trackers', {
				method: 'POST',
				headers: { 'X-WP-Nonce': config.nonce, 'Content-Type': 'application/json' },
				body: JSON.stringify(trackers),
			});

			// In audit mode, also record which trackers loaded despite deny-all.
			if (config.auditMode) {
				const ids = trackers.map(function(t) { return t.tracker_id; });
				await fetch(baseUrl + '/audit-detections', {
					method: 'POST',
					headers: { 'X-WP-Nonce': config.nonce, 'Content-Type': 'application/json' },
					body: JSON.stringify({ ids: ids }),
				});
			}
		} catch (e) { /* Silently fail */ }
	}

	/** MutationObserver to catch dynamically injected scripts. */
	const trackerObserver = new MutationObserver(function (mutations) {
		const found = [];
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node.nodeType !== 1) continue;
				const src = node.getAttribute && node.getAttribute('src');
				if (src) {
					const match = matchTracker(src);
					if (match && !detectedTrackers.has(match.id)) {
						detectedTrackers.add(match.id);
						found.push({
							tracker_id: match.id,
							name: match.name,
							category: match.tracker.category,
							description: match.tracker.description,
							privacy_link: match.tracker.privacyLink || '',
							detected_via: node.tagName.toLowerCase(),
							detected_url: src.substring(0, 200),
							page: pageUrl,
						});
					}
				}
			}
		}
		if (found.length > 0) reportTrackers(found);
	});
	trackerObserver.observe(document.documentElement, { childList: true, subtree: true });

	/* ── Styles ───────────────────────────────── */
	const style = document.createElement('style');
	style.textContent = `
		@keyframes cs-pulse{0%,100%{opacity:1}50%{opacity:0.4}}
		@keyframes cs-fly{
			0%{transform:translateX(80px) scale(0.3);opacity:0}
			40%{transform:translateX(-4px) scale(1.05);opacity:1}
			100%{transform:translateX(0) scale(1);opacity:1}
		}
		@keyframes cs-chomp{
			0%{transform:rotate(0)}
			20%{transform:rotate(-12deg) scale(1.2)}
			40%{transform:rotate(6deg)}
			60%{transform:rotate(0) scale(1)}
		}
		@keyframes cs-bump{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
		#cs-panel{
			position:fixed;bottom:20px;right:20px;z-index:2147483647;
			width:280px;
			background:#111827;color:#fff;
			border-radius:16px;
			font:13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
			box-shadow:0 8px 32px rgba(0,0,0,0.3);
			overflow:hidden;cursor:default;user-select:none;
		}
		#cs-panel.cs-collapsed{width:auto}
		#cs-panel.cs-collapsed .cs-body,
		#cs-panel.cs-collapsed .cs-status,
		#cs-panel.cs-collapsed .cs-footer{display:none!important}
		#cs-panel .cs-header{
			display:flex;align-items:center;gap:8px;
			padding:10px 14px;cursor:move;
		}
		#cs-panel .cs-dot{
			width:8px;height:8px;border-radius:50%;background:#34d399;
			animation:cs-pulse 1.5s infinite;flex-shrink:0;
		}
		#cs-panel .cs-title{font-weight:600;font-size:12px;flex:1;white-space:nowrap}
		#cs-panel .cs-counters{display:flex;gap:4px;align-items:center}
		#cs-panel .cs-badge{
			padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;
			min-width:16px;text-align:center;
		}
		#cs-panel .cs-badge-total{background:rgba(255,255,255,0.1);color:#9ca3af}
		#cs-panel .cs-badge-caught{background:#059669;color:#fff}
		#cs-panel .cs-badge-caught.cs-bump{animation:cs-bump 0.3s ease-out}
		#cs-panel .cs-toggle{
			background:none;border:none;color:#6b7280;cursor:pointer;
			padding:2px;display:flex;transition:transform 0.2s;
		}
		#cs-panel.cs-collapsed .cs-toggle{transform:rotate(180deg)}
		#cs-panel .cs-status{
			padding:5px 14px;font-size:11px;text-align:center;
			border-bottom:1px solid rgba(255,255,255,0.06);
			display:none;
		}
		#cs-panel .cs-status.cs-idle{display:block;color:#fbbf24;background:rgba(251,191,36,0.08)}
		#cs-panel .cs-status.cs-allclear{display:block;color:#34d399;background:rgba(52,211,153,0.08)}
		#cs-panel .cs-body{padding:4px 14px 8px;max-height:180px;overflow-y:auto}
		#cs-panel .cs-item{
			display:flex;align-items:center;gap:6px;
			padding:5px 0;border-top:1px solid rgba(255,255,255,0.06);
			animation:cs-fly 0.4s ease-out;
		}
		#cs-panel .cs-item:first-child{border-top:none}
		#cs-panel .cs-cookie-icon{font-size:14px;flex-shrink:0;animation:cs-chomp 0.5s ease-out}
		#cs-panel .cs-name{
			font-family:ui-monospace,monospace;font-size:11px;
			color:#e5e7eb;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
		}
		#cs-panel .cs-src{
			font-size:9px;color:#6b7280;background:rgba(255,255,255,0.08);
			padding:1px 5px;border-radius:3px;flex-shrink:0;
		}
		#cs-panel .cs-time{font-size:9px;color:#4b5563;flex-shrink:0;white-space:nowrap}
		#cs-panel .cs-empty{color:#6b7280;font-size:11px;padding:6px 0;text-align:center}
		#cs-panel .cs-footer{
			padding:6px 14px;border-top:1px solid rgba(255,255,255,0.08);
			display:flex;align-items:center;justify-content:space-between;
			font-size:10px;color:#4b5563;
		}
		#cs-panel .cs-stop{
			background:#dc2626;color:#fff;border:none;cursor:pointer;
			padding:3px 10px;border-radius:5px;font-size:10px;font-weight:600;
			transition:background 0.2s;
		}
		#cs-panel .cs-stop:hover{background:#b91c1c}
		#cs-panel .cs-tracker-row{
			display:flex;align-items:center;gap:6px;
			padding:4px 0;border-top:1px solid rgba(255,255,255,0.06);
			animation:cs-fly 0.4s ease-out;
		}
		#cs-panel .cs-tracker-row:first-child{border-top:none}
		#cs-panel .cs-tracker-icon{font-size:12px;flex-shrink:0}
		#cs-panel .cs-tracker-name{font-size:11px;color:#e5e7eb;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
		#cs-panel .cs-badge-tracker{background:#7c3aed;color:#fff}
	`;
	document.head.appendChild(style);

	/* ── Panel HTML ───────────────────────────── */
	const panel = document.createElement('div');
	panel.id = 'cs-panel';
	panel.innerHTML = `
		<div class="cs-header">
			<span class="cs-dot"></span>
			<span class="cs-title">Cookie Scanner</span>
			<div class="cs-counters">
				<span class="cs-badge cs-badge-caught" id="cs-caught" title="New cookies caught">0</span>
				<span style="color:#4b5563;font-size:10px">/</span>
				<span class="cs-badge cs-badge-total" id="cs-total" title="Total in database">0</span>
				<span class="cs-badge cs-badge-tracker" id="cs-trackers" title="Tracking scripts detected" style="display:none">0</span>
			</div>
			<button class="cs-toggle" title="Toggle">
				<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
				</svg>
			</button>
		</div>
		<div class="cs-status" id="cs-status"></div>
		<div class="cs-body" id="cs-body">
			<div class="cs-empty">Loading…</div>
		</div>
		<div class="cs-footer">
			<span>${pageUrl.replace(/https?:\/\/[^/]+/, '') || '/'}</span>
			<button class="cs-stop" id="cs-stop" title="Stop scanning and see results">Stop</button>
		</div>
	`;
	document.body.appendChild(panel);

	const caughtEl = document.getElementById('cs-caught');
	const totalEl = document.getElementById('cs-total');
	const trackerBadgeEl = document.getElementById('cs-trackers');

	function updateTrackerBadge() {
		if (trackerBadgeEl && trackerCount > 0) {
			trackerBadgeEl.textContent = trackerCount;
			trackerBadgeEl.style.display = '';
			trackerBadgeEl.classList.remove('cs-bump');
			void trackerBadgeEl.offsetWidth;
			trackerBadgeEl.classList.add('cs-bump');
		}
	}
	const bodyEl = document.getElementById('cs-body');
	const statusEl = document.getElementById('cs-status');
	const stopBtn = document.getElementById('cs-stop');
	const toggleBtn = panel.querySelector('.cs-toggle');

	/* ── Load existing cookies from DB ────────── */
	(async function loadExisting() {
		try {
			const baseUrl = config.restUrl.replace(/\/scan$/, '');
			const res = await fetch(baseUrl + '/cookies', {
				headers: { 'X-WP-Nonce': config.nonce },
			});
			const data = await res.json();
			const cookies = data.cookies || [];
			totalInDb = cookies.length;
			cookies.forEach((c) => existingKeys.add(c.name + '|' + (c.source || 'cookie')));
			if (totalEl) totalEl.textContent = totalInDb;
		} catch (e) { /* ignore */ }
		ready = true;
		renderCaught();
		scan();
	})();

	/* ── Stop button ─────────────────────────── */
	stopBtn.addEventListener('click', async () => {
		stopBtn.textContent = '…';
		try {
			await fetch(config.restUrl.replace('/scan', '/scan-mode'), {
				method: 'POST',
				headers: { 'X-WP-Nonce': config.nonce, 'Content-Type': 'application/json' },
				body: JSON.stringify({ active: false }),
			});
		} catch (e) { /* ignore */ }
		window.location.href = config.adminUrl || '/wp-admin/options-general.php?page=cookie-banner-wp#cookies-table';
	});

	/* ── Idle status timer ────────────────────── */
	function updateIdleStatus() {
		const elapsed = Math.round((Date.now() - lastNewAt) / 1000);
		if (caughtCount === 0 && elapsed > 5) {
			statusEl.textContent = 'No new cookies found yet — browse more pages';
			statusEl.className = 'cs-status cs-idle';
		} else if (elapsed < 5) {
			statusEl.textContent = '';
			statusEl.className = 'cs-status';
		} else if (elapsed < 60) {
			statusEl.textContent = 'No new cookies for ' + elapsed + 's — try other pages';
			statusEl.className = 'cs-status cs-idle';
		} else {
			const mins = Math.floor(elapsed / 60);
			statusEl.textContent = 'No new cookies for ' + mins + 'm — looks complete!';
			statusEl.className = 'cs-status cs-allclear';
		}
	}
	setInterval(updateIdleStatus, 1000);

	/* ── Toggle expand/collapse ───────────────── */
	toggleBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		panelExpanded = !panelExpanded;
		panel.classList.toggle('cs-collapsed', !panelExpanded);
	});

	/* ── Draggable ────────────────────────────── */
	const header = panel.querySelector('.cs-header');
	let dragging = false, dragX = 0, dragY = 0;

	header.addEventListener('mousedown', (e) => {
		if (e.target.closest('.cs-toggle')) return;
		dragging = true;
		dragX = e.clientX - panel.offsetLeft;
		dragY = e.clientY - panel.offsetTop;
		panel.style.transition = 'none';
	});
	document.addEventListener('mousemove', (e) => {
		if (!dragging) return;
		panel.style.left = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, e.clientX - dragX)) + 'px';
		panel.style.top = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, e.clientY - dragY)) + 'px';
		panel.style.right = 'auto';
		panel.style.bottom = 'auto';
	});
	document.addEventListener('mouseup', () => {
		if (dragging) { dragging = false; panel.style.transition = ''; }
	});

	/* ── Render caught items ─────────────────── */
	const srcLabels = { cookie: 'Cookie', localStorage: 'LS', sessionStorage: 'SS' };

	function timeAgo(ts) {
		const s = Math.round((Date.now() - ts) / 1000);
		if (s < 5) return 'now';
		if (s < 60) return s + 's';
		return Math.floor(s / 60) + 'm';
	}

	function renderCaught() {
		if (caughtItems.length === 0) {
			const totalText = totalInDb > 0
				? '<div style="font-size:20px;margin-bottom:4px">✅</div>' +
				  '<div>No new cookies on this page</div>' +
				  '<div style="color:#4b5563;margin-top:2px">' + totalInDb + ' cookie' + (totalInDb !== 1 ? 's' : '') + ' already in your database</div>'
				: '<div style="font-size:20px;margin-bottom:4px">👀</div>' +
				  '<div>Scanning for cookies…</div>' +
				  '<div style="color:#4b5563;margin-top:2px">Browse your site to discover them</div>';
			bodyEl.innerHTML = '<div class="cs-empty" style="padding:12px 0">' + totalText + '</div>';
			return;
		}

		bodyEl.innerHTML = caughtItems
			.slice(-MAX_VISIBLE)
			.reverse()
			.map((item) =>
				`<div class="cs-item">
					<span class="cs-cookie-icon">🍪</span>
					<span class="cs-name" title="${item.name}">${item.name}</span>
					<span class="cs-src">${srcLabels[item.source] || item.source}</span>
					<span class="cs-time">${timeAgo(item._ts)}</span>
				</div>`
			)
			.join('');
	}

	setInterval(() => { if (caughtItems.length > 0) renderCaught(); }, 5000);

	/* ── Cookie parser ────────────────────────── */
	function parseCookies() {
		const items = [];
		const raw = document.cookie;
		if (!raw) return items;
		raw.split(';').forEach((pair) => {
			const idx = pair.indexOf('=');
			if (idx < 1) return;
			const name = pair.substring(0, idx).trim();
			const value = pair.substring(idx + 1).trim();
			items.push({ name, value: value.substring(0, 50), domain: window.location.hostname, source: 'cookie', page: pageUrl });
		});
		return items;
	}

	/* ── Storage scanner ──────────────────────── */
	function scanStorage(storage, source) {
		const items = [];
		try {
			for (let i = 0; i < storage.length; i++) {
				const name = storage.key(i);
				if (!name) continue;
				const value = (storage.getItem(name) || '').substring(0, 50);
				items.push({ name, value, domain: window.location.hostname, source, page: pageUrl });
			}
		} catch (e) { /* Storage may be blocked */ }
		return items;
	}

	/* ── Collect & send ───────────────────────── */
	async function scan() {
		if (!ready) return;

		const all = [
			...parseCookies(),
			...scanStorage(localStorage, 'localStorage'),
			...scanStorage(sessionStorage, 'sessionStorage'),
		];

		// Filter to items not yet seen on this page load.
		const fresh = all.filter((item) => {
			const key = item.name + '|' + item.source;
			if (knownKeys.has(key)) return false;
			knownKeys.add(key);
			return true;
		});

		if (fresh.length === 0) return;

		// Separate genuinely new (not in DB) from already-known.
		const now = Date.now();
		const genuinelyNew = [];
		for (const item of fresh) {
			const dbKey = item.name + '|' + item.source;
			if (!existingKeys.has(dbKey)) {
				item._ts = now;
				genuinelyNew.push(item);
				existingKeys.add(dbKey); // Don't count twice.
			}
		}

		if (genuinelyNew.length > 0) {
			lastNewAt = now;
			caughtCount += genuinelyNew.length;
			totalInDb += genuinelyNew.length;
			caughtItems.push(...genuinelyNew);
			if (caughtItems.length > MAX_VISIBLE) {
				caughtItems = caughtItems.slice(-MAX_VISIBLE);
			}
			renderCaught();

			// Animate the caught badge.
			if (caughtEl) {
				caughtEl.textContent = caughtCount;
				caughtEl.classList.remove('cs-bump');
				void caughtEl.offsetWidth; // Force reflow.
				caughtEl.classList.add('cs-bump');
			}
			if (totalEl) totalEl.textContent = totalInDb;
		}

		// Update empty state even if no genuinely new items.
		if (genuinelyNew.length === 0 && caughtItems.length === 0) {
			renderCaught();
		}

		// Always send all fresh items to the API (even already-known ones update last_seen).
		try {
			await fetch(config.restUrl, {
				method: 'POST',
				headers: { 'X-WP-Nonce': config.nonce, 'Content-Type': 'application/json' },
				body: JSON.stringify(fresh),
			});
		} catch (e) { /* Silently fail */ }
	}

	/** Combined tracker scan — DOM + performance entries. */
	async function scanTrackers() {
		const found = [
			...scanDomForTrackers(),
			...scanPerformanceForTrackers(),
		];
		await reportTrackers(found);
	}

	// Scan every INTERVAL (initial scan triggered after loadExisting).
	setInterval(scan, INTERVAL);
	// Tracker scan — first run + periodic.
	scanTrackers();
	setInterval(scanTrackers, INTERVAL);
})();
