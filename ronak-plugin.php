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

/* Plugin constants */
define('RONAK_SCSS_VERSION', '0.1.0');
define('RONAK_SCSS_FILE', __FILE__);
define('RONAK_SCSS_DIR', plugin_dir_path(__FILE__));
define('RONAK_SCSS_URL', plugin_dir_url(__FILE__));

/* Includes */
$inc_api = RONAK_SCSS_DIR . 'inc/api.php';
$inc_cpt = RONAK_SCSS_DIR . 'inc/cpt.php';
if (file_exists($inc_api)) {
    require_once $inc_api;
}
if (file_exists($inc_cpt)) {
    require_once $inc_cpt;
}

/* Admin menu */
add_action('admin_menu', 'ronak_scss_register_admin_menu');
function ronak_scss_register_admin_menu()
{
    $capability = 'manage_options';
    $icon_url   = RONAK_SCSS_URL . 'media/icon.svg';

    add_menu_page(
        __('Ronak SCSS', 'ronak-scss'),
        __('Ronak SCSS', 'ronak-scss'),
        $capability,
        'ronak-scss',
        'ronak_scss_render_css_manager',
        $icon_url,
        65
    );

    // Duplicate to keep parent menu clickable
    add_submenu_page(
        'ronak-scss',
        __('CSS Manager', 'ronak-scss'),
        __('CSS Manager', 'ronak-scss'),
        $capability,
        'ronak-scss',
        'ronak_scss_render_css_manager'
    );

    add_submenu_page(
        'ronak-scss',
        __('Snippets', 'ronak-scss'),
        __('Snippets', 'ronak-scss'),
        $capability,
        'ronak-scss-snippets',
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
        __('Settings', 'ronak-scss'),
        __('Settings', 'ronak-scss'),
        $capability,
        'ronak-scss-settings',
        'ronak_scss_render_settings'
    );

    add_submenu_page(
        'ronak-scss',
        __('Help', 'ronak-scss'),
        __('Help', 'ronak-scss'),
        $capability,
        'ronak-scss-help',
        'ronak_scss_render_help'
    );
}

/* Admin page callbacks */
function ronak_scss_render_css_manager()
{
    ronak_scss_include_page('pages/css-manager.php', __('CSS Manager', 'ronak-scss'));
}

function ronak_scss_render_snippets()
{
    ronak_scss_include_page('pages/snippets.php', __('Snippets', 'ronak-scss'));
}

function ronak_scss_render_compilations()
{
    ronak_scss_include_page('pages/compilations.php', __('Compilations', 'ronak-scss'));
}

function ronak_scss_render_settings()
{
    ronak_scss_include_page('pages/settings.php', __('Settings', 'ronak-scss'));
}

function ronak_scss_render_help()
{
    ronak_scss_include_page('pages/help.php', __('Help', 'ronak-scss'));
}

/* Simple page include with wrapper */
function ronak_scss_include_page($relative_path, $title = '')
{
    $file = RONAK_SCSS_DIR . $relative_path;

    echo '<div class="wrap ronak-scss-wrap">';
    if (!empty($title)) {
        echo '<h1>' . esc_html($title) . '</h1>';
    }

    if (file_exists($file)) {
        include $file;
    } else {
        echo '<p>' . esc_html__('Page file not found.', 'ronak-scss') . '</p>';
    }

    echo '</div>';
}

/* Admin assets (only on plugin screens) */
add_action('admin_enqueue_scripts', 'ronak_scss_admin_assets');
function ronak_scss_admin_assets()
{
    if (!ronak_scss_is_plugin_screen()) {
        return;
    }

    wp_enqueue_style(
        'ronak-scss-ui',
        RONAK_SCSS_URL . 'assets/ui.css',
        [],
        RONAK_SCSS_VERSION
    );

    wp_enqueue_script(
        'ronak-scss-ui',
        RONAK_SCSS_URL . 'assets/ui.js',
        ['jquery'],
        RONAK_SCSS_VERSION,
        true
    );

    wp_enqueue_script(
        'ronak-scss-plugin',
        RONAK_SCSS_URL . 'assets/ronak-plugin.js',
        ['jquery'],
        RONAK_SCSS_VERSION,
        true
    );

    wp_localize_script('ronak-scss-plugin', 'RonakSCSS', [
        'pluginUrl' => RONAK_SCSS_URL,
        'ajaxUrl'   => admin_url('admin-ajax.php'),
        'nonce'     => wp_create_nonce('ronak_scss_nonce'),
    ]);
}

/* Detect if current screen is from this plugin */
function ronak_scss_is_plugin_screen(): bool
{
    if (!function_exists('get_current_screen')) {
        return false;
    }
    $screen = get_current_screen();
    if (!$screen || empty($screen->id)) {
        return false;
    }
    return (strpos($screen->id, 'ronak-scss') !== false);
}

/* i18n */
add_action('plugins_loaded', function () {
    load_plugin_textdomain('ronak-scss', false, dirname(plugin_basename(__FILE__)) . '/languages');
});
