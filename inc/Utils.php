<?php
namespace RonakSCSS;

if (!defined('ABSPATH')) { exit; }

if (!class_exists('RonakSCSS\\Utils')) {
	final class Utils {
		public static function djb2($text) {
			$hash = 5381;
			$len  = strlen($text);
			for ($i = 0; $i < $len; $i++) {
				$hash = (($hash << 5) + $hash) ^ ord($text[$i]);
				$hash &= 0xFFFFFFFF;
			}
			return sprintf('%u', $hash);
		}
		public static function sanitize_uid($uid) {
			return preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) $uid);
		}
		public static function sanitize_slug($slug) {
			$slug = sanitize_title((string) $slug);
			return $slug === '' ? 'untitled-compilation' : $slug;
		}
		public static function now_mysql() {
			return current_time('mysql');
		}
	}
}