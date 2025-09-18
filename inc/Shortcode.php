<?php
namespace RonakSCSS;

if (!defined('ABSPATH')) { exit; }

if (!class_exists('RonakSCSS\\Shortcode')) {
	final class Shortcode {
		public static function register() {
			add_shortcode('ronak-scss', array(__CLASS__, 'render'));
		}

		public static function render($atts = array(), $content = null) {
			if (!class_exists('RonakSCSS\\Utils') || !class_exists('RonakSCSS\\Files') || !class_exists('RonakSCSS\\DB')) {
				return '<!-- ronak-scss: bootstrap incomplete -->';
			}
			$atts = shortcode_atts(array('id' => ''), $atts, 'ronak-scss');
			$uid = Utils::sanitize_uid((string) $atts['id']);
			if ($uid === '') return '<!-- ronak-scss: invalid uid -->';

			$comp = DB::get_compilation_by_uid($uid);
			$slug = $comp ? (string) ($comp['slug'] ? $comp['slug'] : 'untitled-compilation') : 'untitled-compilation';
			$paths = Files::paths($uid, $slug);

			// Primary path check
			if (file_exists($paths['css_file'])) {
				$css = @file_get_contents($paths['css_file']);
				if ($css !== false) {
					$css_safe = str_replace('</style>', '<\/style>', $css);
					$id_attr = esc_attr('ronak-scss-' . $uid);
					return "<style id=\"{$id_attr}\">{$css_safe}</style>";
				}
			}

			// Fallback: pick the latest .css file in the UID dir
			$dir = dirname($paths['css_file']);
			if (is_dir($dir)) {
				$latestFile = null; $latestMTime = -1;
				$dh = @opendir($dir);
				if ($dh) {
					while (($file = readdir($dh)) !== false) {
						if (substr($file, -4) === '.css') {
							$full = $dir . DIRECTORY_SEPARATOR . $file;
							$mt = @filemtime($full);
							if ($mt !== false && $mt > $latestMTime) { $latestMTime = $mt; $latestFile = $full; }
						}
					}
					closedir($dh);
				}
				if ($latestFile && is_readable($latestFile)) {
					$css = @file_get_contents($latestFile);
					if ($css !== false) {
						$css_safe = str_replace('</style>', '<\/style>', $css);
						$id_attr = esc_attr('ronak-scss-' . $uid);
						return "<style id=\"{$id_attr}\">{$css_safe}</style>";
					}
				}
			}

			$msg = sprintf('ronak-scss: css not found (%s)', esc_html($uid));
			return sprintf("<!-- %s --><script>console.log(%s);</script>", $msg, wp_json_encode($msg));
		}
	}
}