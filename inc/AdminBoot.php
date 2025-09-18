<?php
namespace RonakSCSS\Admin;

if (!defined('ABSPATH')) { exit; }

if (!class_exists('RonakSCSS\\Admin\\AdminBoot')) {
	final class AdminBoot {
		public static function inject_boot_data($hook = '') {
			$page = isset($_GET['page']) ? sanitize_text_field((string) $_GET['page']) : '';
			if ($page !== 'ronak-scss-cssmanager') return;

			// Ensure our core handle exists, attach inline to it (not jquery).
			if (!wp_script_is('ronak-scss-core', 'enqueued')) {
				wp_enqueue_script('ronak-scss-core');
			}

			$rest = array(
				'baseUrl'   => esc_url_raw(rest_url()),
				'namespace' => 'ronak-scss/v1',
				'nonce'     => wp_create_nonce('wp_rest'),
			);

			wp_add_inline_script(
				'ronak-scss-core',
				'window.RonakSCSS = window.RonakSCSS || {}; window.RonakSCSS.rest = ' . wp_json_encode($rest) . ';',
				'after'
			);
		}
	}
}