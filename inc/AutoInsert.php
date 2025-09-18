<?php
namespace RonakSCSS;

if (!defined('ABSPATH')) { exit; }

if (!class_exists('RonakSCSS\\AutoInsert')) {
	final class AutoInsert {
		public static function enqueue_front() {
			if (is_admin()) return;
			self::enqueue_by_context('frontend');
		}
		public static function enqueue_admin() {
			if (!is_admin()) return;
			self::enqueue_by_context('admin');
		}
		private static function enqueue_by_context($area) {
			if (!class_exists('RonakSCSS\\DB') || !class_exists('RonakSCSS\\Files')) return;
			$rows = DB::get_active_compilations();
			if (!$rows) return;

			foreach ($rows as $c) {
				$uid = (string) $c['uid'];
				$slug = (string) ($c['slug'] ? $c['slug'] : 'untitled-compilation');
				$context = (string) ($c['context'] ? $c['context'] : 'none');
				$ver = (string) ($c['last_compiled_hash'] ? $c['last_compiled_hash'] : '1');

				$should = false;
				if ($area === 'frontend') {
					if ($context === 'all_frontend' || $context === 'all_pages') $should = true;
					elseif ($context === 'selected_areas') $should = self::matches_selected_areas((string) $c['selected_post_ids'], (string) $c['selected_term_ids']);
				} else {
					if ($context === 'admin_area' || $context === 'all_pages') $should = true;
				}
				if (!$should) continue;

				$paths = Files::paths($uid, $slug);
				if (!file_exists($paths['css_file'])) continue;

				$handle = 'ronak-scss-' . $uid;
				wp_enqueue_style($handle, $paths['css_url'], array(), $ver);
			}
		}
		private static function matches_selected_areas($postIds, $termIds) {
			$post_ok = false; $term_ok = false;
			if (is_singular()) {
				$current_id = get_queried_object_id();
				$ids = array_filter(array_map('absint', array_map('trim', explode(',', (string) $postIds))));
				$post_ok = $current_id && in_array($current_id, $ids, true);
			}
			if (is_category() || is_tag() || is_tax()) {
				$term = get_queried_object();
				if ($term && isset($term->term_id)) {
					$tids = array_filter(array_map('absint', array_map('trim', explode(',', (string) $termIds))));
					$term_ok = in_array((int) $term->term_id, $tids, true);
				}
			}
			return $post_ok || $term_ok;
		}
	}
}