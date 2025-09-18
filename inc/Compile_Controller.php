<?php
namespace RonakSCSS\Rest;

use RonakSCSS\DB;
use RonakSCSS\Files;
use RonakSCSS\Utils;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) { exit; }

if (!class_exists('RonakSCSS\\Rest\\Compile_Controller')) {
	final class Compile_Controller {
		public static function register_routes() {
			register_rest_route(
				'ronak-scss/v1',
				'/compilations/(?P<uid>[a-zA-Z0-9_\-]+)/compile',
				array(
					'methods'             => 'POST',
					'callback'            => array(__CLASS__, 'handle_compile'),
					'permission_callback' => function () { return current_user_can('manage_options'); },
					'args'                => array('uid' => array('required' => true)),
				)
			);
		}

		public static function handle_compile(WP_REST_Request $req) {
			$uid = Utils::sanitize_uid((string) $req->get_param('uid'));
			if ($uid === '') return new WP_Error('invalid_uid', __('Invalid UID.', 'ronak-scss'), array('status' => 400));

			$params = $req->get_json_params();
			$scss   = isset($params['scss']) ? (string) $params['scss'] : '';
			$css    = isset($params['css']) ? (string) $params['css'] : '';
			$style  = isset($params['output_style']) ? (string) $params['output_style'] : 'compressed';
			$slug   = isset($params['slug']) ? (string) $params['slug'] : 'untitled-compilation';

			if ($scss === '' || $css === '') {
				return new WP_Error('missing_data', __('SCSS and CSS are required.', 'ronak-scss'), array('status' => 400));
			}

			$styleNorm = ($style === 'expanded') ? 'expanded' : 'compressed';
			$slug = Utils::sanitize_slug($slug);

			// Style-aware hash for consistent versioning and UI status
			$hash = Utils::djb2($scss . '|' . $styleNorm);

			$paths = Files::paths($uid, $slug);

			if (!Files::write_atomic($paths['scss_file'], $scss)) {
				return new WP_Error('write_failed_scss', __('Failed to write SCSS file.', 'ronak-scss'), array('status' => 500));
			}
			if (!Files::write_atomic($paths['css_file'], $css)) {
				return new WP_Error('write_failed_css', __('Failed to write CSS file.', 'ronak-scss'), array('status' => 500));
			}

			if (class_exists('RonakSCSS\\DB')) {
				DB::upsert_compilation_basic(array(
					'uid' => $uid,
					'name' => 'Untitled compilation',
					'slug' => $slug,
					'output_style' => $styleNorm,
					'last_compiled_at' => Utils::now_mysql(),
					'last_compiled_hash' => $hash,
					'scss_rel_path' => $paths['scss_rel'],
					'css_rel_path' => $paths['css_rel'],
				));
			}

			$data = class_exists('RonakSCSS\\DB') ? DB::get_compilation_by_uid($uid) : null;
			$res = array(
				'uid' => $uid,
				'name' => $data ? (string) $data['name'] : 'Untitled compilation',
				'slug' => $data ? (string) $data['slug'] : $slug,
				'last_compiled_at' => $data ? (string) $data['last_compiled_at'] : Utils::now_mysql(),
				'last_compiled_hash' => $hash,
				'urls' => array('scss' => $paths['scss_url'], 'css' => $paths['css_url']),
			);

			return new WP_REST_Response($res, 200);
		}
	}
}