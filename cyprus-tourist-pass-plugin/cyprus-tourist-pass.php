<?php
/**
 * Plugin Name: Cyprus Tourist Pass
 * Plugin URI: https://emarketing.cy
 * Description: A tourist discount pass platform for Cyprus. Validates rental car contracts and provides exclusive merchant discounts via QR codes.
 * Version: 1.0.0
 * Author: eMarketing Cyprus by Saltpixek Team
 * Author URI: https://eMarketing.cy
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: cyprus-tourist-pass
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Plugin constants
define( 'CTP_VERSION', '1.0.0' );
define( 'CTP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CTP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'CTP_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// JWT Secret - override in wp-config.php with: define('CTP_JWT_SECRET', 'your-secret-key');
if ( ! defined( 'CTP_JWT_SECRET' ) ) {
    define( 'CTP_JWT_SECRET', 'ctp-' . wp_salt( 'auth' ) );
}

/**
 * Main plugin class
 */
final class Cyprus_Tourist_Pass {

    private static $instance = null;

    public static function instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->includes();
        $this->init_hooks();
    }

    private function includes() {
        require_once CTP_PLUGIN_DIR . 'includes/class-ctp-database.php';
        require_once CTP_PLUGIN_DIR . 'includes/class-ctp-auth.php';
        require_once CTP_PLUGIN_DIR . 'includes/class-ctp-rest-api.php';
        require_once CTP_PLUGIN_DIR . 'includes/class-ctp-shortcode.php';
        require_once CTP_PLUGIN_DIR . 'includes/class-ctp-admin.php';
    }

    private function init_hooks() {
        register_activation_hook( __FILE__, array( $this, 'activate' ) );
        register_deactivation_hook( __FILE__, array( $this, 'deactivate' ) );

        add_action( 'init', array( $this, 'init' ) );
        add_action( 'rest_api_init', array( 'CTP_Rest_API', 'register_routes' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );
        add_action( 'admin_menu', array( 'CTP_Admin', 'add_admin_menu' ) );
        add_action( 'admin_enqueue_scripts', array( 'CTP_Admin', 'enqueue_admin_assets' ) );

        // Register shortcodes
        CTP_Shortcode::register();
    }

    public function init() {
        load_plugin_textdomain( 'cyprus-tourist-pass', false, dirname( CTP_PLUGIN_BASENAME ) . '/languages' );
    }

    public function activate() {
        CTP_Database::create_tables();
        CTP_Database::seed_data();
        flush_rewrite_rules();
    }

    public function deactivate() {
        flush_rewrite_rules();
    }

    public function enqueue_frontend_assets() {
        global $post;
        if ( ! is_a( $post, 'WP_Post' ) ) {
            return;
        }

        // Only load assets if shortcode is present
        if ( has_shortcode( $post->post_content, 'cyprus_tourist_pass' ) ||
             has_shortcode( $post->post_content, 'ctp_merchant_pos' ) ||
             has_shortcode( $post->post_content, 'ctp_admin_dashboard' ) ) {

            wp_enqueue_style(
                'ctp-frontend',
                CTP_PLUGIN_URL . 'assets/css/frontend.css',
                array(),
                CTP_VERSION
            );

            wp_enqueue_script(
                'ctp-frontend',
                CTP_PLUGIN_URL . 'assets/js/frontend.js',
                array(),
                CTP_VERSION,
                true
            );

            wp_localize_script( 'ctp-frontend', 'ctpData', array(
                'restUrl'  => esc_url_raw( rest_url( 'ctp/v1/' ) ),
                'nonce'    => wp_create_nonce( 'wp_rest' ),
                'pluginUrl' => CTP_PLUGIN_URL,
                'siteUrl'  => site_url(),
            ) );
        }
    }
}

// Initialize plugin
function cyprus_tourist_pass() {
    return Cyprus_Tourist_Pass::instance();
}
cyprus_tourist_pass();
