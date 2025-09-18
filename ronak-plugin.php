<?php
/**
 * Plugin Name: Ronak SCSS
 * Description: SCSS manager and utilities for WordPress.
 * Version: 0.1.0
 * Author: gnlaures
 * Author URI: https://github.com/gnlaures
 * Plugin URI: https://github.com/gnlaures/ronak-scss
 * Text Domain: ronak-scss
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
	exit;
}

/* Optional hard disable via wp-config.php:
   define('RONAK_SCSS_HARD_DISABLE', true);
*/
if (defined('RONAK_SCSS_HARD_DISABLE') && RONAK_SCSS_HARD_DISABLE) {
	add_action('admin_notices', function () {
		echo '<div class="notice notice-error"><p><strong>Ronak SCSS:</strong> temporarily disabled (HARD_DISABLE).</p></div>';
	});
	return;
}

/* Constants */
define('RONAK_SCSS_VERSION', '0.1.0');
define('RONAK_SCSS_FILE', __FILE__);
define('RONAK_SCSS_DIR', plugin_dir_path(__FILE__));
define('RONAK_SCSS_URL', plugin_dir_url(__FILE__));

/* i18n */
add_action('plugins_loaded', function () {
	load_plugin_textdomain('ronak-scss', false, dirname(plugin_basename(__FILE__)) . '/languages');
});

/* Admin menu */
add_action('admin_menu', function () {
	$capability = 'manage_options';
	$icon_url   = RONAK_SCSS_URL . 'media/icon.svg';

	add_menu_page(
		__('Ronak SCSS', 'ronak-scss'),
		__('Ronak SCSS', 'ronak-scss'),
		$capability,
		'ronak-scss',
		'ronak_scss_render_snippets',
		$icon_url,
		65
	);

	add_submenu_page(
		'ronak-scss',
		__('Snippets', 'ronak-scss'),
		__('Snippets', 'ronak-scss'),
		$capability,
		'ronak-scss',
		'ronak_scss_render_snippets'
	);

	add_submenu_page(
		'ronak-scss',
		__('Compilations', 'ronak-scss'),
		__('Compilations', 'ronak-scss'),
		$capability,
		'ronak-scss-compilations',
		'ronak_scss_render_compilations'
	);

	add_submenu_page(
		'ronak-scss',
		__('CSS Manager', 'ronak-scss'),
		__('CSS Manager', 'ronak-scss'),
		$capability,
		'ronak-scss-cssmanager',
		'ronak_scss_render_cssmanager'
	);

	add_submenu_page(
		'ronak-scss',
		__('Help', 'ronak-scss'),
		__('Help', 'ronak-scss'),
		$capability,
		'ronak-scss-help',
		'ronak_scss_render_help'
	);
});

/* Page loader */
function ronak_scss_include_page($relative_path, $title = '') {
	$file = RONAK_SCSS_DIR . $relative_path;

	echo '<div class="wrap ronak-scss-wrap">';
	if (!empty($title)) {
		echo '<h1>' . esc_html($title) . '</h1>';
	}

	if (file_exists($file)) {
		include $file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingCustomConstant
	} else {
		echo '<p>' . esc_html__('Page file not found.', 'ronak-scss') . '</p>';
	}

	echo '</div>';
}

/* Renderers */
function ronak_scss_render_snippets()     { ronak_scss_include_page('pages/snippets.php', __('Snippets', 'ronak-scss')); }
function ronak_scss_render_compilations() { ronak_scss_include_page('pages/compilations.php', __('Compilations', 'ronak-scss')); }
function ronak_scss_render_cssmanager()   { ronak_scss_include_page('pages/cssmanager.php', __('CSS Manager', 'ronak-scss')); }
function ronak_scss_render_help()         { ronak_scss_include_page('pages/help.php', __('Help', 'ronak-scss')); }

/* Body class */
add_filter('admin_body_class', function ($classes) {
	if (ronak_scss_is_plugin_screen()) {
		$classes .= ' is-ronak-scss-plugin';
	}
	return $classes;
});

function ronak_scss_is_plugin_screen() {
	if (!function_exists('get_current_screen')) {
		return false;
	}
	$screen = get_current_screen();
	if (!$screen || empty($screen->id)) {
		return false;
	}
	return (false !== strpos($screen->id, 'ronak-scss'));
}

/* Admin assets */
add_action('admin_enqueue_scripts', function () {
	if (!ronak_scss_is_plugin_screen()) {
		return;
	}

	$current_page = isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : '';

	wp_register_style('ronak-scss-core', RONAK_SCSS_URL . 'assets/css/core.css', array(), RONAK_SCSS_VERSION);
	wp_enqueue_style('ronak-scss-core');

	wp_register_script('ronak-scss-core', RONAK_SCSS_URL . 'assets/js/core.js', array(), RONAK_SCSS_VERSION, true);
	wp_enqueue_script('ronak-scss-core');

	// Compute output base URL using Files (if loaded), fallback to uploads.
	$output_base = trailingslashit(content_url('uploads/ronak-scss'));
	if (class_exists('RonakSCSS\\Files')) {
		$output_base = trailingslashit(\RonakSCSS\Files::base_url());
	}

	wp_localize_script(
		'ronak-scss-core',
		'RonakSCSS',
		array(
			'pluginUrl'     => RONAK_SCSS_URL,
			'ajaxUrl'       => admin_url('admin-ajax.php'),
			'nonce'         => wp_create_nonce('ronak_scss_nonce'),
			'outputBaseUrl' => $output_base,
			// Add REST boot data here so the UI always has it.
			'rest'          => array(
				'baseUrl'   => esc_url_raw(rest_url()),
				'namespace' => 'ronak-scss/v1',
				'nonce'     => wp_create_nonce('wp_rest'),
			),
		)
	);

	if ('ronak-scss' === $current_page) {
		$code_editor_settings = wp_enqueue_code_editor(
			array(
				'type'       => 'text/x-scss',
				'codemirror' => array(
					'mode'         => 'text/x-scss',
					'lineNumbers'  => true,
					'lineWrapping' => true,
					'indentUnit'   => 2,
					'tabSize'      => 2,
					'theme'        => 'material-darker',
				),
			)
		);
		if ($code_editor_settings) {
			wp_enqueue_script('code-editor');
			wp_enqueue_style('code-editor');
			wp_enqueue_style(
				'ronak-scss-cm-theme',
				'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/material-darker.min.css',
				array('code-editor'),
				RONAK_SCSS_VERSION
			);
			wp_localize_script('ronak-scss-core', 'RonakSCSS_CodeEditor', $code_editor_settings);
		}

		wp_enqueue_style('ronak-scss-snippets', RONAK_SCSS_URL . 'assets/css/snippets.css', array('ronak-scss-core'), RONAK_SCSS_VERSION);
		wp_enqueue_script('ronak-scss-snippets', RONAK_SCSS_URL . 'assets/js/snippets.js', array('ronak-scss-core'), RONAK_SCSS_VERSION, true);
	}

	if ('ronak-scss-compilations' === $current_page) {
		wp_enqueue_style('ronak-scss-compilations', RONAK_SCSS_URL . 'assets/css/compilations.css', array('ronak-scss-core'), RONAK_SCSS_VERSION);
		wp_enqueue_script('ronak-scss-compilations', RONAK_SCSS_URL . 'assets/js/compilations.js', array('ronak-scss-core'), RONAK_SCSS_VERSION, true);
	}

	if ('ronak-scss-cssmanager' === $current_page) {
		wp_enqueue_style('ronak-scss-cssmanager', RONAK_SCSS_URL . 'assets/css/cssmanager.css', array('ronak-scss-core'), RONAK_SCSS_VERSION);
		wp_enqueue_script('ronak-scss-cssmanager', RONAK_SCSS_URL . 'assets/js/cssmanager.js', array('ronak-scss-core'), RONAK_SCSS_VERSION, true);
	}

	if ('ronak-scss-help' === $current_page) {
		wp_enqueue_style('ronak-scss-help', RONAK_SCSS_URL . 'assets/css/help.css', array('ronak-scss-core'), RONAK_SCSS_VERSION);
		wp_enqueue_script('ronak-scss-help', RONAK_SCSS_URL . 'assets/js/help.js', array('ronak-scss-core'), RONAK_SCSS_VERSION, true);
	}
});

/* Safe boot: never fatal if files are missing */
add_action('plugins_loaded', function () {
	$base = RONAK_SCSS_DIR . 'inc/';
	$files = array(
		$base . 'Utils.php',
		$base . 'DB.php',
		$base . 'Files.php',
		$base . 'Installer.php',
		$base . 'Compile_Controller.php', // fix: real path in your tree
		$base . 'Shortcode.php',
		$base . 'AutoInsert.php',
		$base . 'AdminBoot.php',          // fix: real path in your tree
		$base . 'Bootstrap.php',
	);

	$missing = array();
	foreach ($files as $f) {
		if (file_exists($f)) {
			require_once $f;
		} else {
			$missing[] = str_replace(ABSPATH, '', $f);
		}
	}

	if (!empty($missing)) {
		add_action('admin_notices', function () use ($missing) {
			echo '<div class="notice notice-error"><p><strong>Ronak SCSS:</strong> missing files:</p><ul style="margin-left:18px;">';
			foreach ($missing as $m) {
				echo '<li>' . esc_html($m) . '</li>';
			}
			echo '</ul><p>Fix the file paths to enable DB/REST/shortcode.</p></div>';
		});
		return;
	}

	if (class_exists('RonakSCSS\\Bootstrap')) {
		\RonakSCSS\Bootstrap::init();
	} else {
		add_action('admin_notices', function () {
			echo '<div class="notice notice-error"><p><strong>Ronak SCSS:</strong> Bootstrap class not found. Check inc/Bootstrap.php.</p></div>';
		});
	}
}, 1);

/* Activation: install DB without referencing Bootstrap constants */
register_activation_hook(__FILE__, function () {
	$installer = RONAK_SCSS_DIR . 'inc/Installer.php';
	$db        = RONAK_SCSS_DIR . 'inc/DB.php';
	if (file_exists($db))        require_once $db;
	if (file_exists($installer)) require_once $installer;
	if (class_exists('RonakSCSS\\Installer')) {
		\RonakSCSS\Installer::install_tables();
		update_option('ronak_scss_db_version', '1.0.0', true);
	}
});