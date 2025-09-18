<?php
/**
 * Compilations page
 *
 * @package RonakSCSS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$current    = 'compilations';
$base_admin = admin_url( 'admin.php?page=' );
?>
<div class="rs-container">
	<header class="rs-header rs-panel" role="banner" aria-label="<?php echo esc_attr__( 'Ronak SCSS Header', 'ronak-scss' ); ?>">
		<div class="rs-header-left">
			<img class="rs-logo" src="<?php echo esc_url( RONAK_SCSS_URL . 'media/brand.svg' ); ?>" alt="<?php echo esc_attr__( 'Ronak SCSS', 'ronak-scss' ); ?>" />
			<h1 class="rs-title" aria-label="<?php echo esc_attr__( 'Ronak SCSS', 'ronak-scss' ); ?>"></h1>
		</div>
		<div class="rs-header-right">
			<a class="rs-panel-lite" href="https://lauresronak.com" target="_blank" rel="noopener noreferrer" aria-label="<?php echo esc_attr__( 'Visit Laures Ronak website', 'ronak-scss' ); ?>">
				<?php echo esc_html__( 'By Laures Ronak', 'ronak-scss' ); ?>
			</a>
		</div>
	</header>

	<nav class="rs-nav rs-panel" role="navigation" aria-label="<?php echo esc_attr__( 'Ronak SCSS navigation', 'ronak-scss' ); ?>">
		<a class="rs-nav-item" href="<?php echo esc_url( $base_admin . 'ronak-scss' ); ?>">
			<span class="dashicons dashicons-editor-code" aria-hidden="true"></span>
			<span><?php echo esc_html__( 'Snippets', 'ronak-scss' ); ?></span>
		</a>
		<a class="rs-nav-item is-active" href="<?php echo esc_url( $base_admin . 'ronak-scss-compilations' ); ?>">
			<span class="dashicons dashicons-category" aria-hidden="true"></span>
			<span><?php echo esc_html__( 'Compilations', 'ronak-scss' ); ?></span>
		</a>
		<a class="rs-nav-item" href="<?php echo esc_url( $base_admin . 'ronak-scss-cssmanager' ); ?>">
			<span class="dashicons dashicons-admin-appearance" aria-hidden="true"></span>
			<span><?php echo esc_html__( 'CSS Manager', 'ronak-scss' ); ?></span>
		</a>
		<a class="rs-nav-item" href="<?php echo esc_url( $base_admin . 'ronak-scss-help' ); ?>">
			<span class="dashicons dashicons-editor-help" aria-hidden="true"></span>
			<span><?php echo esc_html__( 'Help', 'ronak-scss' ); ?></span>
		</a>
	</nav>

	<div class="rs-content-grid">
		<aside class="rs-sidebar rs-panel" aria-label="<?php echo esc_attr__( 'Compilations sidebar', 'ronak-scss' ); ?>">
			<div class="rs-sidebar-toolbar">
				<label class="rs-visually-hidden" for="rs-compilations-search"><?php echo esc_html__( 'Search compilations', 'ronak-scss' ); ?></label>
				<input id="rs-compilations-search" type="search" class="rs-input" placeholder="<?php echo esc_attr__( 'Search compilations...', 'ronak-scss' ); ?>" aria-label="<?php echo esc_attr__( 'Search compilations', 'ronak-scss' ); ?>" />
				<button id="rs-new-compilation" class="rs-btn rs-btn-primary" type="button">
					<span class="dashicons dashicons-plus-alt2" aria-hidden="true"></span>
					<?php echo esc_html__( 'New Compilation', 'ronak-scss' ); ?>
				</button>
			</div>

			<div id="rs-compilations-list" class="rs-accordion" role="tree" aria-label="<?php echo esc_attr__( 'Compilations list', 'ronak-scss' ); ?>">
				<!-- Rendered by compilations.js -->
			</div>
		</aside>

		<section class="rs-main rs-panel" id="rs-compilation-detail" aria-live="polite" aria-label="<?php echo esc_attr__( 'Compilation details', 'ronak-scss' ); ?>">
			<div class="rs-empty">
				<p><?php echo esc_html__( 'Create a new compilation or select one on the left.', 'ronak-scss' ); ?></p>
			</div>
			<!-- Detail rendered by compilations.js -->
		</section>
	</div>
</div>