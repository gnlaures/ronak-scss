<?php
namespace RonakSCSS;

if (!defined('ABSPATH')) { exit; }

if (!class_exists('RonakSCSS\\DB')) {
	final class DB {
		public static function table_snippets() {
			global $wpdb; return $wpdb->prefix . 'ronak_scss_snippets';
		}
		public static function table_compilations() {
			global $wpdb; return $wpdb->prefix . 'ronak_scss_compilations';
		}
		public static function table_pivot() {
			global $wpdb; return $wpdb->prefix . 'ronak_scss_compilation_snippets';
		}
		public static function get_compilation_by_uid($uid) {
			global $wpdb;
			$table = self::table_compilations();
			$row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE uid = %s LIMIT 1", $uid), ARRAY_A);
			return $row ? $row : null;
		}
		public static function upsert_compilation_basic($data) {
			global $wpdb;
			$table = self::table_compilations();

			$defaults = array(
				'uid' => '',
				'name' => 'Untitled compilation',
				'slug' => 'untitled-compilation',
				'active' => 0,
				'output_style' => 'compressed',
				'context' => 'none',
				'selected_post_ids' => '',
				'selected_term_ids' => '',
				'last_compiled_at' => null,
				'last_compiled_hash' => null,
				'scss_rel_path' => '',
				'css_rel_path' => '',
			);
			$data = array_merge($defaults, (array) $data);
			$existing = self::get_compilation_by_uid($data['uid']);

			if ($existing) {
				$wpdb->update(
				 $table,
				 array(
					'name' => $data['name'],
					'slug' => $data['slug'],
					'output_style' => $data['output_style'],
					'last_compiled_at' => $data['last_compiled_at'],
					'last_compiled_hash' => $data['last_compiled_hash'],
					'scss_rel_path' => $data['scss_rel_path'],
					'css_rel_path' => $data['css_rel_path'],
				 ),
				 array('uid' => $data['uid']),
				 array('%s','%s','%s','%s','%s','%s','%s'),
				 array('%s')
				);
				return (int) $existing['id'];
			}

			$wpdb->insert(
			 $table,
			 array(
				'uid' => $data['uid'],
				'name' => $data['name'],
				'slug' => $data['slug'],
				'active' => (int) $data['active'],
				'output_style' => $data['output_style'],
				'context' => $data['context'],
				'selected_post_ids' => $data['selected_post_ids'],
				'selected_term_ids' => $data['selected_term_ids'],
				'last_compiled_at' => $data['last_compiled_at'],
				'last_compiled_hash' => $data['last_compiled_hash'],
				'scss_rel_path' => $data['scss_rel_path'],
				'css_rel_path' => $data['css_rel_path'],
			 ),
			 array('%s','%s','%d','%s','%s','%s','%s','%s','%s','%s')
			);
			return (int) $wpdb->insert_id;
		}
		public static function get_active_compilations() {
			global $wpdb;
			$table = self::table_compilations();
			$rows = $wpdb->get_results("SELECT * FROM {$table} WHERE active = 1", ARRAY_A);
			return $rows ? $rows : array();
		}
	}
}