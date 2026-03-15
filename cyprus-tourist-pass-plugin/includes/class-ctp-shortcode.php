<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class CTP_Shortcode {

    public static function register() {
        add_shortcode( 'cyprus_tourist_pass', array( __CLASS__, 'render_main_app' ) );
        add_shortcode( 'ctp_merchant_pos', array( __CLASS__, 'render_merchant_pos' ) );
        add_shortcode( 'ctp_admin_dashboard', array( __CLASS__, 'render_admin_dashboard' ) );
    }

    /**
     * Main shortcode: [cyprus_tourist_pass]
     * Renders the full tourist pass application (auth + customer/merchant/admin views)
     */
    public static function render_main_app( $atts ) {
        $atts = shortcode_atts( array(
            'view' => 'full', // full, customer, merchant, admin
        ), $atts, 'cyprus_tourist_pass' );

        ob_start();
        ?>
        <div id="ctp-app" class="ctp-app" data-view="<?php echo esc_attr( $atts['view'] ); ?>">
            <div id="ctp-loading" class="ctp-loading-screen">
                <div class="ctp-loading-spinner"></div>
                <p>Loading Cyprus Tourist Pass...</p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Merchant POS shortcode: [ctp_merchant_pos]
     */
    public static function render_merchant_pos( $atts ) {
        ob_start();
        ?>
        <div id="ctp-app" class="ctp-app" data-view="merchant">
            <div id="ctp-loading" class="ctp-loading-screen">
                <div class="ctp-loading-spinner"></div>
                <p>Loading Merchant POS...</p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Admin dashboard shortcode: [ctp_admin_dashboard]
     */
    public static function render_admin_dashboard( $atts ) {
        ob_start();
        ?>
        <div id="ctp-app" class="ctp-app" data-view="admin">
            <div id="ctp-loading" class="ctp-loading-screen">
                <div class="ctp-loading-spinner"></div>
                <p>Loading Admin Dashboard...</p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
