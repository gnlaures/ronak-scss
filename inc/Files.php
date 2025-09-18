<?php
namespace RonakSCSS;

if (!defined('ABSPATH')) { exit; }

if (!class_exists('RonakSCSS\\Files')) {
	final class Files {
		private static $rootDir = null;
		private static $rootUrl = null;

		private static function init_root() {
			if (self::$rootDir !== null && self::$rootUrl !== null) {
				return;
			}

			$uploads = wp_upload_dir(null, false);
			$uploadsRoot = trailingslashit($uploads['basedir']) . 'ronak-scss/';
			$uploadsUrl  = trailingslashit($uploads['baseurl']) . 'ronak-scss/';

			// Prefer uploads; if cannot create or not writable, fallback to plugin dir.
			$useUploads = true;
			if (!is_dir($uploadsRoot)) {
				$useUploads = wp_mkdir_p($uploadsRoot);
			}
			if ($useUploads && !is_writable($uploadsRoot)) {
				$useUploads = false;
			}

			if ($useUploads) {
				self::$rootDir = $uploadsRoot;
				self::$rootUrl = $uploadsUrl;
				return;
			}

			// Fallback to plugin generated directory.
			$pluginRoot = trailingslashit(RONAK_SCSS_DIR) . 'generated/';
			$pluginUrl  = trailingslashit(RONAK_SCSS_URL) . 'generated/';
			if (!is_dir($pluginRoot)) {
				wp_mkdir_p($pluginRoot);
			}
			self::$rootDir = $pluginRoot;
			self::$rootUrl = $pluginUrl;
		}

		public static function base_dir() {
			self::init_root();
			return self::$rootDir;
		}

		public static function base_url() {
			self::init_root();
			return self::$rootUrl;
		}

		public static function ensure_dir($uid) {
			self::init_root();
			$dir = trailingslashit(self::$rootDir . Utils::sanitize_uid($uid));
			if (!is_dir($dir)) {
				wp_mkdir_p($dir);
			}
			return $dir;
		}

		public static function paths($uid, $slug) {
			$slug = Utils::sanitize_slug($slug);
			$dir  = self::ensure_dir($uid);
			$url  = trailingslashit(self::base_url() . $uid);
			return array(
				'scss_file' => $dir . $slug . '.scss',
				'css_file'  => $dir . $slug . '.css',
				'scss_url'  => $url . $slug . '.scss',
				'css_url'   => $url . $slug . '.css',
				'scss_rel'  => $uid . '/' . $slug . '.scss',
				'css_rel'   => $uid . '/' . $slug . '.css',
			);
		}

		public static function write_atomic($file, $contents) {
			$tmp = $file . '.tmp';
			$bytes = @file_put_contents($tmp, $contents);
			if ($bytes === false) {
				return false;
			}
			return @rename($tmp, $file);
		}
	}
}