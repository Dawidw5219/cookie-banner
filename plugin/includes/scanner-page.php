<?php
/**
 * Cookie Scanner — Admin page template.
 *
 * Variables provided by cookie4_scanner_render_section():
 *   $cookies, $last_scan, $scan_active, $total, $categorized, $uncategorized
 *
 * @package Cookie_Banner_WP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$categories = [ 'Functional', 'Analytics', 'Marketing', 'Security', 'Personalization', 'Unknown' ];
$category_colors = [
	'Functional'      => 'bg-emerald-100 text-emerald-800',
	'Analytics'       => 'bg-blue-100 text-blue-800',
	'Marketing'       => 'bg-purple-100 text-purple-800',
	'Security'        => 'bg-amber-100 text-amber-800',
	'Personalization' => 'bg-pink-100 text-pink-800',
	'Unknown'         => 'bg-red-50 text-red-700 !border-red-300',
];
$source_labels = [
	'cookie'         => 'Cookie',
	'localStorage'   => 'Local Storage',
	'sessionStorage' => 'Session Storage',
];
?>

<div role="region" aria-label="<?php esc_attr_e( 'Cookie Scanner', 'cookie-banner-wp' ); ?>">

		<!-- Stats Cards -->
		<div class="w-full grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-10 opacity-0 animate-[slideUp_0.3s_ease-out_0.1s_forwards]">
			<!-- Total cookies -->
			<div class="rounded-xl bg-white p-6 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
				<div class="flex items-start space-x-4">
					<div class="shrink-0 w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/>
						</svg>
					</div>
					<div class="flex-1 !text-left">
						<dt id="stat-total" class="text-3xl font-bold text-gray-900 tracking-tight"><?php echo esc_html( $total ); ?></dt>
						<dd class="text-sm font-medium text-gray-500 mt-1.5 !ml-0"><?php esc_html_e( 'Total Detected', 'cookie-banner-wp' ); ?></dd>
					</div>
				</div>
			</div>

			<!-- Categorized -->
			<div class="rounded-xl bg-white p-6 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
				<div class="flex items-start space-x-4">
					<div class="shrink-0 w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
						</svg>
					</div>
					<div class="flex-1 !text-left">
						<dt id="stat-categorized" class="text-3xl font-bold text-gray-900 tracking-tight"><?php echo esc_html( $categorized ); ?></dt>
						<dd class="text-sm font-medium text-gray-500 mt-1.5 !ml-0"><?php esc_html_e( 'Auto-categorized', 'cookie-banner-wp' ); ?></dd>
					</div>
				</div>
			</div>

			<!-- Uncategorized -->
			<div class="rounded-xl bg-white p-6 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
				<div class="flex items-start space-x-4">
					<div class="shrink-0 w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
						</svg>
					</div>
					<div class="flex-1 !text-left">
						<dt id="stat-uncategorized" class="text-3xl font-bold text-gray-900 tracking-tight"><?php echo esc_html( $uncategorized ); ?></dt>
						<dd class="text-sm font-medium text-gray-500 mt-1.5 !ml-0"><?php esc_html_e( 'Needs Review', 'cookie-banner-wp' ); ?></dd>
					</div>
				</div>
			</div>

			<!-- Trackers -->
			<div class="rounded-xl bg-white p-6 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
				<div class="flex items-start space-x-4">
					<div class="shrink-0 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788"/>
						</svg>
					</div>
					<div class="flex-1 !text-left">
						<dt id="stat-trackers" class="text-3xl font-bold text-gray-900 tracking-tight"><?php echo esc_html( $tracker_count ); ?></dt>
						<dd class="text-sm font-medium text-gray-500 mt-1.5 !ml-0"><?php esc_html_e( 'Trackers', 'cookie-banner-wp' ); ?></dd>
					</div>
				</div>
			</div>

			<!-- Last Scan -->
			<div class="rounded-xl bg-white p-6 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
				<div class="flex items-start space-x-4">
					<div class="shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
						</svg>
					</div>
					<div class="flex-1 !text-left">
						<dt id="stat-last-scan" class="text-lg font-bold text-gray-900 tracking-tight">
							<?php echo $last_scan ? esc_html( $last_scan ) : '<span class="text-gray-400">' . esc_html__( 'Never', 'cookie-banner-wp' ) . '</span>'; ?>
						</dt>
						<dd class="text-sm font-medium text-gray-500 mt-1.5 !ml-0"><?php esc_html_e( 'Last Scan', 'cookie-banner-wp' ); ?></dd>
					</div>
				</div>
			</div>
		</div>

		<!-- Scanner Controls -->
		<div class="w-full mb-10 opacity-0 animate-[slideUp_0.3s_ease-out_0.2s_forwards]">
			<div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
				<div class="p-6 border-b border-gray-200">
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-lg font-semibold text-gray-900"><?php esc_html_e( 'Scanner Controls', 'cookie-banner-wp' ); ?></h2>
							<p class="text-sm text-gray-600 mt-1"><?php esc_html_e( 'Open your site with scan mode to detect cookies. Browse all pages as both logged-in and logged-out user.', 'cookie-banner-wp' ); ?></p>
						</div>
						<div id="scan-status" class="flex items-center gap-2">
							<?php if ( $scan_active ) : ?>
								<span class="relative flex h-3 w-3">
									<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
									<span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
								</span>
								<span class="text-sm font-medium text-emerald-700"><?php esc_html_e( 'Scanning', 'cookie-banner-wp' ); ?></span>
							<?php else : ?>
								<span class="relative flex h-3 w-3">
									<span class="relative inline-flex rounded-full h-3 w-3 bg-gray-300"></span>
								</span>
								<span class="text-sm font-medium text-gray-500"><?php esc_html_e( 'Inactive', 'cookie-banner-wp' ); ?></span>
							<?php endif; ?>
						</div>
					</div>
				</div>

				<div class="p-6">
					<div class="flex flex-wrap gap-3">
						<?php if ( $scan_active ) : ?>
						<button id="btn-stop-scan"
								type="button"
								class="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"/>
							</svg>
							<?php esc_html_e( 'Stop Scan', 'cookie-banner-wp' ); ?>
						</button>
						<?php else : ?>
						<button id="btn-start-scan"
								type="button"
								class="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
							</svg>
							<?php esc_html_e( 'Start Scan', 'cookie-banner-wp' ); ?>
						</button>
						<?php endif; ?>

						<a href="<?php echo esc_url( home_url( '/' ) ); ?>"
						   target="_blank"
						   rel="noopener"
						   class="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium transition-colors !no-underline hover:!text-gray-700">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
							</svg>
							<?php esc_html_e( 'Open Site', 'cookie-banner-wp' ); ?>
						</a>

						<button id="btn-refresh"
								type="button"
								class="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium transition-colors">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"/>
							</svg>
							<?php esc_html_e( 'Refresh Results', 'cookie-banner-wp' ); ?>
						</button>

						<?php if ( $total > 0 ) : ?>
						<button id="btn-clear"
								type="button"
								class="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-red-50 border border-gray-300 hover:border-red-300 rounded-lg text-gray-700 hover:text-red-700 font-medium transition-colors">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
							</svg>
							<?php esc_html_e( 'Clear All', 'cookie-banner-wp' ); ?>
						</button>
						<?php endif; ?>
					</div>

					<!-- How it works -->
					<div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
						<h4 class="text-sm font-medium text-gray-900 mb-2"><?php esc_html_e( 'How it works', 'cookie-banner-wp' ); ?></h4>
						<ol class="text-sm text-gray-600 space-y-1 list-decimal list-inside">
							<li><?php esc_html_e( 'Click "Start Scan" — scan mode activates across all browser tabs', 'cookie-banner-wp' ); ?></li>
							<li><?php esc_html_e( 'Click "Open Site" and browse: visit pages, interact with features, watch videos, open chat widgets', 'cookie-banner-wp' ); ?></li>
							<li><?php esc_html_e( 'The scanner detects cookies, localStorage and sessionStorage entries every 3 seconds', 'cookie-banner-wp' ); ?></li>
							<li><?php esc_html_e( 'Come back here and click "Refresh Results" to see what was found', 'cookie-banner-wp' ); ?></li>
							<li><?php esc_html_e( 'Click "Stop Scan" when done — the scanner stops on all tabs', 'cookie-banner-wp' ); ?></li>
						</ol>
					</div>
				</div>
			</div>
		</div>

		<!-- Detected Tracking Services -->
		<div class="w-full mb-10 opacity-0 animate-[slideUp_0.3s_ease-out_0.25s_forwards]">
			<div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
				<div class="p-6 border-b border-gray-200">
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-lg font-semibold text-gray-900">
								<?php esc_html_e( 'Detected Services', 'cookie-banner-wp' ); ?>
								<?php if ( $tracker_count > 0 ) : ?>
									<span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><?php echo esc_html( $tracker_count ); ?></span>
								<?php endif; ?>
							</h2>
							<p class="text-sm text-gray-600 mt-1"><?php esc_html_e( 'Tracking scripts and services detected on your site during scanning.', 'cookie-banner-wp' ); ?></p>
						</div>
						<!-- Audit Mode Toggle -->
						<div class="flex items-center gap-3">
							<?php if ( $audit_active ) : ?>
								<span class="relative flex h-3 w-3">
									<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
									<span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
								</span>
								<span class="text-sm font-medium text-amber-700"><?php esc_html_e( 'Audit Active', 'cookie-banner-wp' ); ?></span>
								<button id="btn-stop-audit"
										type="button"
										class="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"/>
									</svg>
									<?php esc_html_e( 'Stop Audit', 'cookie-banner-wp' ); ?>
								</button>
							<?php else : ?>
								<button id="btn-start-audit"
										type="button"
										title="<?php esc_attr_e( 'Block all consents and check which trackers still load', 'cookie-banner-wp' ); ?>"
										class="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-800 text-sm font-medium rounded-lg transition-colors">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
									</svg>
									<?php esc_html_e( 'Audit Consent', 'cookie-banner-wp' ); ?>
								</button>
							<?php endif; ?>
						</div>
					</div>
				</div>

				<?php
				// Tracker icon SVGs map.
				$tracker_icons = [
					'ga4'       => '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10Z" fill="#E37400"/><path d="M12 7v10M7 12h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
					'gtm'       => '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#4285F4"/><path d="M8 12l4 4 4-4M12 8v8" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
					'meta'      => '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#1877F2"/><path d="M12 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM12 18.5v-8M8.5 14l7 0" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>',
					'hotjar'    => '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#FF3C00"/><path d="M12 6c-2 0-4 2-4 4 0 3 4 8 4 8s4-5 4-8c0-2-2-4-4-4Z" fill="#fff"/></svg>',
					'clarity'   => '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#5C2D91"/><circle cx="12" cy="12" r="4" fill="#fff" opacity="0.9"/><circle cx="12" cy="12" r="2" fill="#5C2D91"/></svg>',
					'tiktok'    => '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#010101"/><path d="M15 8a3 3 0 0 0 3 3v2a5 5 0 0 1-3-1v5a4 4 0 1 1-4-4v2a2 2 0 1 0 2 2V6h2v2Z" fill="#fff"/></svg>',
					'linkedin'  => '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2"/><path d="M8 10v7M8 7h.01M11 17v-4c0-1.5 1-2 2-2s2 .5 2 2v4M11 10v7" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
					'pinterest' => '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#E60023"/><path d="M12 7c-3 0-5 2.5-5 5 0 1.5.8 2.8 2 3.5l1-3.5c0-1 1-2 2-2s2 1 2 2-1 4-1 4" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>',
					'snapchat'  => '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#FFFC00"/><path d="M12 8c-1.5 0-3 1-3 3v1l-1 .5 1 .5c-.5 2-2 3-2 3h10s-1.5-1-2-3l1-.5-1-.5v-1c0-2-1.5-3-3-3Z" fill="#fff" stroke="#333" stroke-width="0.5"/></svg>',
					'hubspot'   => '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#FF7A59"/><circle cx="12" cy="12" r="3" fill="#fff"/><circle cx="12" cy="12" r="1.5" fill="#FF7A59"/><path d="M12 6v3M12 15v3M6 12h3M15 12h3" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>',
					'gads'      => '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#4285F4"/><path d="M7 17l5-10 5 10" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 14h6" stroke="#FBBC04" stroke-width="2" stroke-linecap="round"/></svg>',
					'twitter'   => '<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#000"/><path d="M7 17L17 7M13 7h4M7 17h4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
				];

				$audit_status_classes = [
					'ok'        => 'bg-emerald-100 text-emerald-800 border-emerald-200',
					'violation' => 'bg-red-100 text-red-800 border-red-200',
				];
				$audit_status_labels = [
					'ok'        => __( 'Respects consent', 'cookie-banner-wp' ),
					'violation' => __( 'Loads without consent', 'cookie-banner-wp' ),
				];
				?>

				<div class="p-6">
					<?php if ( $tracker_count === 0 ) : ?>
						<div class="p-8 text-center">
							<svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
							</svg>
							<h3 class="text-base font-medium text-gray-900 mb-1"><?php esc_html_e( 'No tracking services detected', 'cookie-banner-wp' ); ?></h3>
							<p class="text-sm text-gray-500"><?php esc_html_e( 'Start a scan and browse your site to detect tracking scripts.', 'cookie-banner-wp' ); ?></p>
						</div>
					<?php else : ?>
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							<?php foreach ( array_values( $trackers ) as $tracker ) :
								$icon_key   = $tracker['tracker_id'] ?? '';
								$icon_svg   = $tracker_icons[ $icon_key ] ?? '<div class="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs font-bold">' . strtoupper( mb_substr( $tracker['name'] ?? '?', 0, 2 ) ) . '</div>';
								$cat_class  = $category_colors[ $tracker['category'] ] ?? 'bg-gray-100 text-gray-700';
								$audit_st   = $tracker['audit_status'] ?? '';
								$page_count = count( $tracker['pages'] ?? [] );
							?>
							<div class="rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
								<div class="flex items-start gap-3">
									<div class="shrink-0"><?php echo $icon_svg; ?></div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-1">
											<h4 class="text-sm font-semibold text-gray-900 truncate"><?php echo esc_html( $tracker['name'] ?? '' ); ?></h4>
										</div>
										<div class="flex flex-wrap items-center gap-1.5 mb-2">
											<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium <?php echo esc_attr( $cat_class ); ?>">
												<?php echo esc_html( $tracker['category'] ?? '' ); ?>
											</span>
											<?php if ( $audit_st && isset( $audit_status_classes[ $audit_st ] ) ) : ?>
												<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border <?php echo esc_attr( $audit_status_classes[ $audit_st ] ); ?>">
													<?php if ( $audit_st === 'ok' ) : ?>
														<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
													<?php else : ?>
														<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/></svg>
													<?php endif; ?>
													<?php echo esc_html( $audit_status_labels[ $audit_st ] ); ?>
												</span>
											<?php endif; ?>
										</div>
										<p class="text-xs text-gray-500 mb-2 line-clamp-2"><?php echo esc_html( $tracker['description'] ?? '' ); ?></p>
										<div class="flex items-center justify-between text-[10px] text-gray-400">
											<span>
												<?php if ( $page_count > 0 ) : ?>
													<?php echo esc_html( $page_count ); ?> <?php echo esc_html( _n( 'page', 'pages', $page_count, 'cookie-banner-wp' ) ); ?>
												<?php endif; ?>
											</span>
											<?php if ( ! empty( $tracker['privacy_link'] ) ) : ?>
												<a href="<?php echo esc_url( $tracker['privacy_link'] ); ?>" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 transition-colors">
													<?php esc_html_e( 'Privacy', 'cookie-banner-wp' ); ?>
													<svg class="inline w-2.5 h-2.5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
												</a>
											<?php endif; ?>
										</div>
									</div>
								</div>
							</div>
							<?php endforeach; ?>
						</div>

						<!-- Audit mode explanation -->
						<div class="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
							<h4 class="text-sm font-medium text-amber-900 mb-1"><?php esc_html_e( 'Consent Audit', 'cookie-banner-wp' ); ?></h4>
							<p class="text-xs text-amber-700">
								<?php esc_html_e( 'Click "Audit Consent" to force deny-all mode and check which trackers still load without user consent. Browse your site during audit, then stop to see results. Trackers that load despite denied consent are marked as violations.', 'cookie-banner-wp' ); ?>
							</p>
						</div>
					<?php endif; ?>
				</div>
			</div>
		</div>

		<!-- Cookie Table -->
		<div class="w-full mb-10 opacity-0 animate-[slideUp_0.3s_ease-out_0.3s_forwards]">
			<div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
				<div class="p-6 border-b border-gray-200">
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-lg font-semibold text-gray-900"><?php esc_html_e( 'Detected Cookies & Storage', 'cookie-banner-wp' ); ?></h2>
							<p class="text-sm text-gray-600 mt-1"><?php esc_html_e( 'All cookies and storage entries found during scanning sessions', 'cookie-banner-wp' ); ?></p>
						</div>
						<!-- Filter -->
						<div class="flex items-center gap-2">
							<select id="filter-category" class="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
								<option value=""><?php esc_html_e( 'All categories', 'cookie-banner-wp' ); ?></option>
								<?php foreach ( $categories as $cat ) : ?>
									<option value="<?php echo esc_attr( $cat ); ?>"><?php echo esc_html( $cat ); ?></option>
								<?php endforeach; ?>
							</select>
							<select id="filter-source" class="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
								<option value=""><?php esc_html_e( 'All sources', 'cookie-banner-wp' ); ?></option>
								<option value="cookie">Cookie</option>
								<option value="localStorage">Local Storage</option>
								<option value="sessionStorage">Session Storage</option>
							</select>
						</div>
					</div>
					<!-- Scope checkboxes -->
					<div class="flex items-center gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/50">
						<label class="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
							<input type="checkbox" id="filter-admin" class="rounded" />
							<?php esc_html_e( 'Show admin cookies', 'cookie-banner-wp' ); ?>
							<span class="text-gray-400">(wp-settings, wp-admin)</span>
						</label>
						<label class="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
							<input type="checkbox" id="filter-logged-in" class="rounded" />
							<?php esc_html_e( 'Show logged-in cookies', 'cookie-banner-wp' ); ?>
							<span class="text-gray-400">(wordpress_logged_in, wordpress_sec)</span>
						</label>
					</div>

				<div class="overflow-x-auto">
					<?php if ( $total === 0 ) : ?>
						<div class="p-12 text-center">
							<svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
							</svg>
							<h3 class="text-lg font-medium text-gray-900 mb-1"><?php esc_html_e( 'No cookies detected yet', 'cookie-banner-wp' ); ?></h3>
							<p class="text-sm text-gray-500"><?php esc_html_e( 'Start scanning your site to discover cookies and storage entries.', 'cookie-banner-wp' ); ?></p>
						</div>
					<?php else : ?>
						<table id="cookies-table" class="w-full text-sm text-left">
							<thead class="text-xs text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
								<tr>
									<th class="px-6 py-3 font-medium"><?php esc_html_e( 'Name', 'cookie-banner-wp' ); ?></th>
									<th class="px-6 py-3 font-medium"><?php esc_html_e( 'Source', 'cookie-banner-wp' ); ?></th>
									<th class="px-6 py-3 font-medium"><?php esc_html_e( 'Category', 'cookie-banner-wp' ); ?></th>
									<th class="px-6 py-3 font-medium"><?php esc_html_e( 'Platform', 'cookie-banner-wp' ); ?></th>
									<th class="px-6 py-3 font-medium"><?php esc_html_e( 'Description', 'cookie-banner-wp' ); ?></th>
									<th class="px-6 py-3 font-medium"><?php esc_html_e( 'Retention', 'cookie-banner-wp' ); ?></th>
									<th class="px-6 py-3 font-medium"><?php esc_html_e( 'Pages', 'cookie-banner-wp' ); ?></th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-100">
								<?php foreach ( array_values( $cookies ) as $idx => $cookie ) :
									$cat_class = $category_colors[ $cookie['category'] ] ?? $category_colors['Unknown'];
									$source_label = $source_labels[ $cookie['source'] ] ?? $cookie['source'];
									$page_count = count( $cookie['pages'] ?? [] );
								?>
								<?php $wp_scope = $cookie['wp_scope'] ?? cookie4_classify_wp_cookie( $cookie['name'] ); ?>
								<tr class="cookie-row hover:bg-gray-50 transition-colors"
									data-category="<?php echo esc_attr( $cookie['category'] ); ?>"
									data-source="<?php echo esc_attr( $cookie['source'] ); ?>"
									data-wp-scope="<?php echo esc_attr( $wp_scope ); ?>">
									<td class="px-6 py-4">
										<div class="font-mono text-sm font-medium text-gray-900"><?php echo esc_html( $cookie['name'] ); ?></div>
										<?php if ( ! empty( $cookie['domain'] ) ) : ?>
											<div class="text-xs text-gray-400 mt-0.5"><?php echo esc_html( $cookie['domain'] ); ?></div>
										<?php endif; ?>
									</td>
									<td class="px-6 py-4">
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
											<?php echo esc_html( $source_label ); ?>
										</span>
									</td>
										<td class="px-6 py-4">
											<select class="category-select text-xs border rounded-lg px-2 py-1 <?php echo esc_attr( $cat_class ); ?> focus:outline-none focus:ring-2 focus:ring-gray-900"
													data-cookie="<?php echo esc_attr( $cookie['name'] ); ?>">
												<?php foreach ( $categories as $cat ) : ?>
													<option value="<?php echo esc_attr( $cat ); ?>" <?php selected( $cookie['category'], $cat ); ?>>
														<?php echo esc_html( $cat ); ?>
													</option>
												<?php endforeach; ?>
											</select>
										</td>
									<td class="px-6 py-4 text-gray-600">
										<?php
										$platform     = $cookie['platform'] ?? '';
										$privacy_link = $cookie['privacy_link'] ?? '';
										if ( $platform && $privacy_link ) :
										?>
											<a href="<?php echo esc_url( $privacy_link ); ?>" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
												<?php echo esc_html( $platform ); ?>
												<svg class="inline w-3 h-3 ml-0.5 -mt-0.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
											</a>
										<?php else : ?>
											<?php echo esc_html( $platform ?: '—' ); ?>
										<?php endif; ?>
									</td>
									<td class="px-6 py-4 text-gray-600 max-w-xs">
										<div class="truncate" title="<?php echo esc_attr( $cookie['description'] ); ?>">
											<?php echo esc_html( $cookie['description'] ?: '—' ); ?>
										</div>
									</td>
									<td class="px-6 py-4 text-gray-600 whitespace-nowrap">
										<?php echo esc_html( $cookie['retention'] ?: '—' ); ?>
									</td>
									<td class="px-6 py-4 text-gray-600 whitespace-nowrap">
										<?php if ( $page_count > 0 ) : ?>
											<span class="cursor-help" title="<?php echo esc_attr( implode( "\n", $cookie['pages'] ) ); ?>">
												<?php echo esc_html( $page_count ); ?> <?php echo esc_html( _n( 'page', 'pages', $page_count, 'cookie-banner-wp' ) ); ?>
											</span>
										<?php else : ?>
											—
										<?php endif; ?>
									</td>
								</tr>
								<?php endforeach; ?>
							</tbody>
						</table>
					<?php endif; ?>
				</div>
			</div>
		</div>

		<!-- Add Cookie Manually -->
		<div class="w-full mb-10 opacity-0 animate-[slideUp_0.3s_ease-out_0.35s_forwards]">
			<div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
				<div class="p-6 border-b border-gray-200">
					<h2 class="text-lg font-semibold text-gray-900"><?php esc_html_e( 'Add Cookie Manually', 'cookie-banner-wp' ); ?></h2>
					<p class="text-sm text-gray-600 mt-1"><?php esc_html_e( 'Add cookies that were not detected by the scanner (e.g. third-party cookies loaded via external scripts).', 'cookie-banner-wp' ); ?></p>
				</div>
				<div class="p-6">
					<form id="add-cookie-form" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						<div>
							<label class="block text-xs font-medium text-gray-700 mb-1"><?php esc_html_e( 'Cookie Name', 'cookie-banner-wp' ); ?> <span class="text-red-500">*</span></label>
							<input type="text" name="name" required placeholder="_ga" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
						</div>
						<div>
							<label class="block text-xs font-medium text-gray-700 mb-1"><?php esc_html_e( 'Category', 'cookie-banner-wp' ); ?></label>
							<select name="category" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
								<?php foreach ( $categories as $cat ) : ?>
									<option value="<?php echo esc_attr( $cat ); ?>"><?php echo esc_html( $cat ); ?></option>
								<?php endforeach; ?>
							</select>
						</div>
						<div>
							<label class="block text-xs font-medium text-gray-700 mb-1"><?php esc_html_e( 'Provider', 'cookie-banner-wp' ); ?></label>
							<input type="text" name="platform" placeholder="Google Analytics" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
						</div>
						<div class="sm:col-span-2">
							<label class="block text-xs font-medium text-gray-700 mb-1"><?php esc_html_e( 'Purpose / Description', 'cookie-banner-wp' ); ?></label>
							<input type="text" name="description" placeholder="<?php esc_attr_e( 'Used to distinguish users for analytics', 'cookie-banner-wp' ); ?>" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
						</div>
						<div>
							<label class="block text-xs font-medium text-gray-700 mb-1"><?php esc_html_e( 'Retention', 'cookie-banner-wp' ); ?></label>
							<input type="text" name="retention" placeholder="2 years" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
						</div>
						<div class="sm:col-span-2 lg:col-span-3 flex items-end">
							<button type="submit" id="btn-add-cookie" class="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
								<?php esc_html_e( 'Add Cookie', 'cookie-banner-wp' ); ?>
							</button>
							<span id="add-cookie-msg" class="ml-3 text-sm text-emerald-600 hidden"><?php esc_html_e( 'Cookie added!', 'cookie-banner-wp' ); ?></span>
						</div>
					</form>
				</div>
			</div>
		</div>

		<!-- Attribution -->
		<div class="w-full text-center mt-2 mb-6 opacity-0 animate-[slideUp_0.3s_ease-out_0.4s_forwards]">
			<p class="text-xs text-gray-400">
				<?php
					echo wp_kses(
						sprintf(
							/* translators: %s: link to Open Cookie Database */
							__( 'Cookie data powered by %s (Apache 2.0)', 'cookie-banner-wp' ),
							'<a href="https://github.com/jkwakman/Open-Cookie-Database" target="_blank" rel="noopener" class="underline hover:text-gray-600 transition-colors">Open Cookie Database</a>'
						),
						[ 'a' => [ 'href' => [], 'target' => [], 'rel' => [], 'class' => [] ] ]
					);
				?>
			</p>
		</div>

</div><!-- cookie scanner region -->

<script>
(function () {
	'use strict';

	if (typeof cookie4Scanner === 'undefined') return;

	var restUrl = cookie4Scanner.restUrl;
	var nonce   = cookie4Scanner.nonce;
	var siteUrl = cookie4Scanner.siteUrl;

	function api(endpoint, method, body) {
		var opts = {
			method: method || 'GET',
			headers: { 'X-WP-Nonce': nonce },
		};
		if (body) {
			opts.headers['Content-Type'] = 'application/json';
			opts.body = JSON.stringify(body);
		}
		return fetch(restUrl + endpoint, opts).then(function (r) { return r.json(); });
	}

	function bindClick(id, fn) {
		var el = document.getElementById(id);
		if (el) el.addEventListener('click', fn);
	}

	/* Scanner controls */
	bindClick('btn-start-scan', function () {
		api('scan-mode', 'POST', { active: true }).then(function () {
			window.open(siteUrl, '_blank');
			location.reload();
		});
	});

	bindClick('btn-stop-scan', function () {
		api('scan-mode', 'POST', { active: false }).then(function () {
			location.reload();
		});
	});

	bindClick('btn-refresh', function () {
		location.reload();
	});

	bindClick('btn-clear', function () {
		if (!confirm('Clear all scanned cookies and trackers?')) return;
		Promise.all([
			api('cookies', 'DELETE'),
			fetch(restUrl + 'trackers', { method: 'DELETE', headers: { 'X-WP-Nonce': nonce } }).catch(function () {}),
		]).then(function () {
			location.reload();
		});
	});

	/* Audit mode */
	bindClick('btn-start-audit', function () {
		Promise.all([
			api('scan-mode', 'POST', { active: true }),
			api('audit-mode', 'POST', { active: true }),
		]).then(function () {
			window.open(siteUrl, '_blank');
			location.reload();
		});
	});

	bindClick('btn-stop-audit', function () {
		Promise.all([
			api('scan-mode', 'POST', { active: false }),
			api('audit-mode', 'POST', { active: false }),
		]).then(function () {
			location.reload();
		});
	});

	/* Category select */
	document.querySelectorAll('.category-select').forEach(function (sel) {
		sel.addEventListener('change', function () {
			var cookieName = sel.getAttribute('data-cookie');
			api('cookies/' + encodeURIComponent(cookieName) + '/category', 'PATCH', {
				category: sel.value,
			});
			var colorMap = {
				Functional: 'bg-emerald-100 text-emerald-800',
				Analytics: 'bg-blue-100 text-blue-800',
				Marketing: 'bg-purple-100 text-purple-800',
				Security: 'bg-amber-100 text-amber-800',
				Personalization: 'bg-pink-100 text-pink-800',
				Unknown: 'bg-red-50 text-red-700 !border-red-300',
			};
			sel.className = sel.className.replace(/bg-\S+|text-\S+|!border-\S+/g, '');
			sel.className += ' ' + (colorMap[sel.value] || '');
		});
	});

	/* Table filtering */
	function filterTable() {
		var cat = (document.getElementById('filter-category') || {}).value || '';
		var src = (document.getElementById('filter-source') || {}).value || '';
		var showAdmin = (document.getElementById('filter-admin') || {}).checked;
		var showLoggedIn = (document.getElementById('filter-logged-in') || {}).checked;

		document.querySelectorAll('.cookie-row').forEach(function (row) {
			var rowCat = row.getAttribute('data-category');
			var rowSrc = row.getAttribute('data-source');
			var rowScope = row.getAttribute('data-wp-scope');

			var visible = true;
			if (cat && rowCat !== cat) visible = false;
			if (src && rowSrc !== src) visible = false;
			if (rowScope === 'admin' && !showAdmin) visible = false;
			if (rowScope === 'logged_in' && !showLoggedIn) visible = false;

			row.style.display = visible ? '' : 'none';
		});
	}

	['filter-category', 'filter-source', 'filter-admin', 'filter-logged-in'].forEach(function (id) {
		var el = document.getElementById(id);
		if (el) el.addEventListener('change', filterTable);
	});
	filterTable();

	/* Add cookie form */
	var form = document.getElementById('add-cookie-form');
	if (form) {
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var fd = new FormData(form);
			api('cookies/add', 'POST', {
				name: fd.get('name'),
				category: fd.get('category'),
				platform: fd.get('platform'),
				description: fd.get('description'),
				retention: fd.get('retention'),
			}).then(function () {
				var msg = document.getElementById('add-cookie-msg');
				if (msg) {
					msg.classList.remove('hidden');
					setTimeout(function () { msg.classList.add('hidden'); }, 2000);
				}
				form.reset();
			});
		});
	}
})();
</script>
