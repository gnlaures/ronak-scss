<?php
namespace RonakSCSS;

if (!defined('ABSPATH')) { exit; }

if (!class_exists('RonakSCSS\\Installer')) {
	final class Installer {
		public static function install_tables() {
			global $wpdb;
			require_once ABSPATH . 'wp-admin/includes/upgrade.php';

			$charset = $wpdb->get_charset_collate();

			$snippets = DB::table_snippets();
			$compilations = DB::table_compilations();
			$pivot = DB::table_pivot();

			$sql_snippets = "CREATE TABLE {$snippets} (
				id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
				uid VARCHAR(32) NOT NULL UNIQUE,
				title VARCHAR(191) NOT NULL,
				category VARCHAR(64) DEFAULT '' NOT NULL,
				content LONGTEXT NOT NULL,
				updated_at DATETIME NULL,
				updated_by BIGINT UNSIGNED NULL,
				PRIMARY KEY  (id),
				KEY uid_idx (uid)
			) {$charset};";

			$sql_compilations = "CREATE TABLE {$compilations} (
				id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
				uid VARCHAR(32) NOT NULL UNIQUE,
				name VARCHAR(191) NOT NULL,
				slug VARCHAR(191) NOT NULL,
				active TINYINT(1) NOT NULL DEFAULT 0,
				output_style VARCHAR(16) NOT NULL DEFAULT 'compressed',
				context VARCHAR(32) NOT NULL DEFAULT 'none',
				selected_post_ids TEXT NULL,
				selected_term_ids TEXT NULL,
				last_compiled_at DATETIME NULL,
				last_compiled_hash VARCHAR(16) NULL,
				scss_rel_path VARCHAR(255) NULL,
				css_rel_path VARCHAR(255) NULL,
				PRIMARY KEY  (id),
				KEY uid_idx (uid)
			) {$charset};";

			$sql_pivot = "CREATE TABLE {$pivot} (
				compilation_id BIGINT UNSIGNED NOT NULL,
				snippet_id BIGINT UNSIGNED NOT NULL,
				sort_index INT NOT NULL DEFAULT 0,
				PRIMARY KEY (compilation_id, snippet_id),
				KEY sort_idx (sort_index)
			) {$charset};";

			dbDelta($sql_snippets);
			dbDelta($sql_compilations);
			dbDelta($sql_pivot);
		}
	}
}