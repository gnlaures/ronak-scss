<?php
/**
 * Help / Docs page
 *
 * @package RonakSCSS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$current    = 'help';
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
		<a class="rs-nav-item" href="<?php echo esc_url( $base_admin . 'ronak-scss-compilations' ); ?>">
			<span class="dashicons dashicons-category" aria-hidden="true"></span>
			<span><?php echo esc_html__( 'Compilations', 'ronak-scss' ); ?></span>
		</a>
		<a class="rs-nav-item" href="<?php echo esc_url( $base_admin . 'ronak-scss-cssmanager' ); ?>">
			<span class="dashicons dashicons-admin-appearance" aria-hidden="true"></span>
			<span><?php echo esc_html__( 'CSS Manager', 'ronak-scss' ); ?></span>
		</a>
		<a class="rs-nav-item is-active" href="<?php echo esc_url( $base_admin . 'ronak-scss-help' ); ?>">
			<span class="dashicons dashicons-editor-help" aria-hidden="true"></span>
			<span><?php echo esc_html__( 'Help', 'ronak-scss' ); ?></span>
		</a>
	</nav>

	<section class="rs-panel rs-doc" aria-label="<?php echo esc_attr__( 'Ronak SCSS Documentation', 'ronak-scss' ); ?>">
		<div class="rs-doc__intro">
			<h2 class="rs-doc__title"><?php echo esc_html__( 'Ronak SCSS — Help & Docs', 'ronak-scss' ); ?></h2>
			<p class="rs-doc__subtitle"><?php echo esc_html__( 'Manage SCSS snippets, build compilations, generate CSS, and enqueue it where you need — all inside WordPress.', 'ronak-scss' ); ?></p>
			<div class="rs-doc__quicklinks">
				<a href="#what" class="rs-panel-lite"><?php echo esc_html__( 'What is this?', 'ronak-scss' ); ?></a>
				<a href="#quickstart" class="rs-panel-lite"><?php echo esc_html__( 'Quick Start', 'ronak-scss' ); ?></a>
				<a href="#examples" class="rs-panel-lite"><?php echo esc_html__( 'Examples', 'ronak-scss' ); ?></a>
				<a href="#troubleshooting" class="rs-panel-lite"><?php echo esc_html__( 'Troubleshooting', 'ronak-scss' ); ?></a>
				<a href="#faq" class="rs-panel-lite"><?php echo esc_html__( 'FAQ', 'ronak-scss' ); ?></a>
			</div>
		</div>

		<hr class="rs-doc__sep" />

		<section id="what" class="rs-doc__section">
			<h3 class="rs-doc__h"><?php echo esc_html__( 'What is Ronak SCSS?', 'ronak-scss' ); ?></h3>
			<p class="rs-doc__p">
				<?php echo esc_html__( 'Ronak SCSS is a WordPress admin tool to write and organize SCSS as small snippets, combine them into compilations, validate, and generate CSS files. You can then activate each compilation and choose where the CSS should load (frontend, admin, specific IDs, or via shortcode).', 'ronak-scss' ); ?>
			</p>
		</section>

		<section id="quickstart" class="rs-doc__section">
			<h3 class="rs-doc__h"><?php echo esc_html__( 'Quick Start', 'ronak-scss' ); ?></h3>
			<ol class="rs-doc__steps">
				<li>
					<strong><?php echo esc_html__( 'Create Snippets', 'ronak-scss' ); ?></strong>
					<p class="rs-doc__p"><?php echo esc_html__( 'Go to Snippets, click “New”, name it, and write your SCSS. Save.', 'ronak-scss' ); ?></p>
				</li>
				<li>
					<strong><?php echo esc_html__( 'Build a Compilation', 'ronak-scss' ); ?></strong>
					<p class="rs-doc__p"><?php echo esc_html__( 'In Compilations, create or select one, add snippets to “Selected”, reorder if needed. Validate (no errors), then Save. The preview shows the concatenated SCSS.', 'ronak-scss' ); ?></p>
				</li>
				<li>
					<strong><?php echo esc_html__( 'Manage CSS output', 'ronak-scss' ); ?></strong>
					<p class="rs-doc__p"><?php echo esc_html__( 'Open CSS Manager. For each compilation: choose Output style (compressed/expanded), select Context (where to load), Compile, and toggle Active.', 'ronak-scss' ); ?></p>
				</li>
				<li>
					<strong><?php echo esc_html__( 'Use Shortcode (optional)', 'ronak-scss' ); ?></strong>
					<p class="rs-doc__p"><?php echo esc_html__( 'If the context is “Shortcode only”, place the shortcode in your content:', 'ronak-scss' ); ?></p>
					<div class="rs-doc__code">
						<code>[ronak-scss id="cmp_your-id"]</code>
						<button type="button" class="rs-btn rs-btn--ghost rs-doc__copy" data-copy="[ronak-scss id=&quot;cmp_your-id&quot;]"><?php echo esc_html__( 'Copy', 'ronak-scss' ); ?></button>
					</div>
				</li>
			</ol>
		</section>

		<section id="examples" class="rs-doc__section">
			<h3 class="rs-doc__h"><?php echo esc_html__( 'Examples', 'ronak-scss' ); ?></h3>

			<div class="rs-doc__grid">
				<div class="rs-doc__card">
					<h4 class="rs-doc__h4"><?php echo esc_html__( 'Contexts', 'ronak-scss' ); ?></h4>
					<ul class="rs-doc__list">
						<li><strong><?php echo esc_html__( 'All frontend', 'ronak-scss' ); ?></strong> — <?php echo esc_html__( 'Load CSS on every public page.', 'ronak-scss' ); ?></li>
						<li><strong><?php echo esc_html__( 'Admin area', 'ronak-scss' ); ?></strong> — <?php echo esc_html__( 'Load CSS only in wp-admin.', 'ronak-scss' ); ?></li>
						<li><strong><?php echo esc_html__( 'All pages (front + admin)', 'ronak-scss' ); ?></strong> — <?php echo esc_html__( 'Load CSS everywhere.', 'ronak-scss' ); ?></li>
						<li><strong><?php echo esc_html__( 'Shortcode only', 'ronak-scss' ); ?></strong> — <?php echo esc_html__( 'Load CSS only where the shortcode is present.', 'ronak-scss' ); ?></li>
						<li><strong><?php echo esc_html__( 'Selected areas', 'ronak-scss' ); ?></strong> — <?php echo esc_html__( 'Restrict by IDs. Provide Post/Page IDs and Taxonomy Term IDs (comma-separated, numbers only).', 'ronak-scss' ); ?></li>
					</ul>
				</div>

				<div class="rs-doc__card">
					<h4 class="rs-doc__h4"><?php echo esc_html__( 'Selected areas — examples', 'ronak-scss' ); ?></h4>
					<ul class="rs-doc__list">
						<li><?php echo esc_html__( 'Post/Page IDs: 12,45,102', 'ronak-scss' ); ?></li>
						<li><?php echo esc_html__( 'Term IDs: 34,58', 'ronak-scss' ); ?></li>
					</ul>
					<p class="rs-doc__note"><?php echo esc_html__( 'Only numeric IDs are accepted. Separate with commas. No spaces needed.', 'ronak-scss' ); ?></p>
				</div>

				<div class="rs-doc__card">
					<h4 class="rs-doc__h4"><?php echo esc_html__( 'Shortcode', 'ronak-scss' ); ?></h4>
					<p class="rs-doc__p"><?php echo esc_html__( 'Place this in a post, page, or block that supports shortcodes:', 'ronak-scss' ); ?></p>
					<div class="rs-doc__code">
						<code>[ronak-scss id="cmp_base"]</code>
						<button type="button" class="rs-btn rs-btn--ghost rs-doc__copy" data-copy="[ronak-scss id=&quot;cmp_base&quot;]"><?php echo esc_html__( 'Copy', 'ronak-scss' ); ?></button>
					</div>
					<p class="rs-doc__note"><?php echo esc_html__( 'The shortcode works only if enabled in Settings and if the compilation exists.', 'ronak-scss' ); ?></p>
				</div>

				<div class="rs-doc__card">
					<h4 class="rs-doc__h4"><?php echo esc_html__( 'Where are files stored?', 'ronak-scss' ); ?></h4>
					<p class="rs-doc__p">
						<?php
						/* translators: %s: example path */
						echo esc_html( sprintf( __( 'By default in uploads/ronak-scss. Example: %s', 'ronak-scss' ), 'wp-content/uploads/ronak-scss' ) );
						?>
					</p>
				</div>
			</div>
		</section>

		<section id="troubleshooting" class="rs-doc__section">
			<h3 class="rs-doc__h"><?php echo esc_html__( 'Troubleshooting', 'ronak-scss' ); ?></h3>
			<ul class="rs-doc__list">
				<li>
					<strong><?php echo esc_html__( 'Validation says Sass.compile requires a callback', 'ronak-scss' ); ?></strong>
					<p class="rs-doc__p"><?php echo esc_html__( 'Your admin likely loaded the worker build of Sass.js. The plugin auto-detects and uses callback mode. If issues persist, check CSP and worker URL in Settings.', 'ronak-scss' ); ?></p>
				</li>
				<li>
					<strong><?php echo esc_html__( 'No CSS output or 404 paths', 'ronak-scss' ); ?></strong>
					<p class="rs-doc__p"><?php echo esc_html__( 'Check the output base URL in Settings and folder permissions (uploads/ronak-scss must be writable).', 'ronak-scss' ); ?></p>
				</li>
				<li>
					<strong><?php echo esc_html__( 'CSS not loading', 'ronak-scss' ); ?></strong>
					<p class="rs-doc__p"><?php echo esc_html__( 'Ensure the compilation is Active in CSS Manager and the Context matches where you expect it to load.', 'ronak-scss' ); ?></p>
				</li>
				<li>
					<strong><?php echo esc_html__( 'Cache issues', 'ronak-scss' ); ?></strong>
					<p class="rs-doc__p"><?php echo esc_html__( 'Use cache busting (timestamp) and clear CDN/browser caches after compiling.', 'ronak-scss' ); ?></p>
				</li>
			</ul>
		</section>

		<section id="faq" class="rs-doc__section">
			<h3 class="rs-doc__h"><?php echo esc_html__( 'FAQ', 'ronak-scss' ); ?></h3>
			<details class="rs-doc__faq">
				<summary><?php echo esc_html__( 'Can I rename files?', 'ronak-scss' ); ?></summary>
				<p class="rs-doc__p"><?php echo esc_html__( 'Yes. The SCSS slug is defined in the Compilation. CSS adopts the same base name.', 'ronak-scss' ); ?></p>
			</details>
			<details class="rs-doc__faq">
				<summary><?php echo esc_html__( 'Does it support multisite?', 'ronak-scss' ); ?></summary>
				<p class="rs-doc__p"><?php echo esc_html__( 'Yes. In a network, you can centralize settings (optional) and each site keeps its snippets/compilations unless you design otherwise.', 'ronak-scss' ); ?></p>
			</details>
			<details class="rs-doc__faq">
				<summary><?php echo esc_html__( 'Where to report issues?', 'ronak-scss' ); ?></summary>
				<p class="rs-doc__p">
					<a class="rs-link" href="https://github.com/gnlaures/ronak-scss/issues" target="_blank" rel="noopener noreferrer"><?php echo esc_html__( 'Open an issue on GitHub', 'ronak-scss' ); ?></a>
				</p>
			</details>
		</section>
	</section>
</div>