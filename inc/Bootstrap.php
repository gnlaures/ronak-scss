<?php
/**
 * Plugin bootstrap: load modules, install DB, REST, shortcode and auto-insert.
 */

namespace RonakSCSS;

if (!defined('ABSPATH')) {
	exit;
}

if (!class_exists('RonakSCSS\\Bootstrap')) {
	final class Bootstrap {
		const VERSION = '0.1.0';
		const DB_VERSION = '1.0.0';
		const OPTION_DB_VERSION = 'ronak_scss_db_version';
		const TEXT_DOMAIN = 'ronak-scss';

		public static function init() {
			add_action('plugins_loaded', array(__CLASS__, 'load_textdomain'));

			$missing = self::safe_requires();
			if (!empty($missing)) {
				add_action('admin_notices', function () use ($missing) {
					echo '<div class="notice notice-error"><p><strong>Ronak SCSS:</strong> missing files:</p><ul style="margin-left:18px;">';
					foreach ($missing as $m) {
						echo '<li>' . esc_html($m) . '</li>';
					}
					echo '</ul><p>Fix the file paths and reload.</p></div>';
				});
				return;
			}

			add_action('admin_init', array(__CLASS__, 'maybe_install'));

			if (class_exists('RonakSCSS\\Rest\\Compile_Controller')) {
				add_action('rest_api_init', array('RonakSCSS\\Rest\\Compile_Controller', 'register_routes'));
			}
			if (class_exists('RonakSCSS\\Shortcode')) {
				add_action('init', array('RonakSCSS\\Shortcode', 'register'));
			}
			if (class_exists('RonakSCSS\\AutoInsert')) {
				add_action('wp_enqueue_scripts', array('RonakSCSS\\AutoInsert', 'enqueue_front'));
				add_action('admin_enqueue_scripts', array('RonakSCSS\\AutoInsert', 'enqueue_admin'));
			}
			if (class_exists('RonakSCSS\\Admin\\AdminBoot')) {
				add_action('admin_enqueue_scripts', array('RonakSCSS\\Admin\\AdminBoot', 'inject_boot_data'));
			}
		}

		public static function load_textdomain() {
			load_plugin_textdomain(self::TEXT_DOMAIN, false, dirname(plugin_basename(__FILE__), 2) . '/languages');
		}

		public static function maybe_install() {
			$installed = get_option(self::OPTION_DB_VERSION);
			if ($installed !== self::DB_VERSION && class_exists('RonakSCSS\\Installer')) {
				Installer::install_tables();
				update_option(self::OPTION_DB_VERSION, self::DB_VERSION, true);
			}
		}

		private static function safe_requires() {
			$base = __DIR__;
			$files = array(
				$base . '/Utils.php',
				$base . '/DB.php',
				$base . '/Files.php',
				$base . '/Installer.php',
				$base . '/Compile_Controller.php', // path real na sua árvore
				$base . '/Shortcode.php',
				$base . '/AutoInsert.php',
				$base . '/AdminBoot.php',
			);

			$missing = array();
			foreach ($files as $f) {
				if (file_exists($f)) {
					require_once $f;
				} else {
					$missing[] = str_replace(ABSPATH, '', $f);
				}
			}
			return $missing;
		}
	}
}