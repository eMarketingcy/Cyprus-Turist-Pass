<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class CTP_Admin {

    public static function add_admin_menu() {
        add_menu_page(
            __( 'Cyprus Tourist Pass', 'cyprus-tourist-pass' ),
            __( 'Tourist Pass', 'cyprus-tourist-pass' ),
            'manage_options',
            'cyprus-tourist-pass',
            array( __CLASS__, 'render_admin_page' ),
            'dashicons-palmtree',
            30
        );

        add_submenu_page(
            'cyprus-tourist-pass',
            __( 'Settings', 'cyprus-tourist-pass' ),
            __( 'Settings', 'cyprus-tourist-pass' ),
            'manage_options',
            'cyprus-tourist-pass-settings',
            array( __CLASS__, 'render_settings_page' )
        );

        add_submenu_page(
            'cyprus-tourist-pass',
            __( 'Help', 'cyprus-tourist-pass' ),
            __( 'Help & Shortcodes', 'cyprus-tourist-pass' ),
            'manage_options',
            'cyprus-tourist-pass-help',
            array( __CLASS__, 'render_help_page' )
        );
    }

    public static function enqueue_admin_assets( $hook ) {
        if ( strpos( $hook, 'cyprus-tourist-pass' ) === false ) {
            return;
        }

        wp_enqueue_style(
            'ctp-admin',
            CTP_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            CTP_VERSION
        );
    }

    public static function render_admin_page() {
        $merchants_count = self::get_count( 'ctp_merchant_profiles' );
        $customers_count = self::get_count( 'ctp_users', "role = 'CUSTOMER'" );
        $transactions_count = self::get_count( 'ctp_transactions' );
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Cyprus Tourist Pass', 'cyprus-tourist-pass' ); ?></h1>

            <div class="ctp-admin-cards">
                <div class="ctp-admin-card">
                    <h3><?php echo esc_html( $merchants_count ); ?></h3>
                    <p>Total Merchants</p>
                </div>
                <div class="ctp-admin-card">
                    <h3><?php echo esc_html( $customers_count ); ?></h3>
                    <p>Total Tourists</p>
                </div>
                <div class="ctp-admin-card">
                    <h3><?php echo esc_html( $transactions_count ); ?></h3>
                    <p>Total Transactions</p>
                </div>
            </div>

            <h2>Quick Start</h2>
            <p>Use the shortcode <code>[cyprus_tourist_pass]</code> on any page to display the full application.</p>
            <p>Visit <a href="<?php echo admin_url( 'admin.php?page=cyprus-tourist-pass-help' ); ?>">Help & Shortcodes</a> for all available shortcodes.</p>

            <h2>Demo Accounts</h2>
            <table class="widefat fixed striped">
                <thead>
                    <tr>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Password</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Admin</td><td>admin@cypruspass.com</td><td>password123</td></tr>
                    <tr><td>Tourist</td><td>tourist@example.com</td><td>password123</td></tr>
                    <tr><td>Merchant</td><td>ocean@cypruspass.com</td><td>password123</td></tr>
                </tbody>
            </table>
        </div>
        <?php
    }

    public static function render_settings_page() {
        $saved = false;
        if ( isset( $_POST['ctp_save_settings'] ) && check_admin_referer( 'ctp_settings_nonce' ) ) {
            $fee = floatval( $_POST['default_platform_fee'] ?? 10 );
            $min = floatval( $_POST['minimum_discount_rate'] ?? 5 );
            $max = floatval( $_POST['maximum_discount_rate'] ?? 25 );

            CTP_Database::update_setting( 'default_platform_fee', max( 2, min( 15, $fee ) ) );
            CTP_Database::update_setting( 'minimum_discount_rate', max( 1, min( 50, $min ) ) );
            CTP_Database::update_setting( 'maximum_discount_rate', max( 5, min( 50, $max ) ) );
            $saved = true;
        }

        $fee = CTP_Database::get_setting( 'default_platform_fee', 10 );
        $min = CTP_Database::get_setting( 'minimum_discount_rate', 5 );
        $max = CTP_Database::get_setting( 'maximum_discount_rate', 25 );
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Platform Settings', 'cyprus-tourist-pass' ); ?></h1>

            <?php if ( $saved ) : ?>
                <div class="notice notice-success"><p>Settings saved successfully.</p></div>
            <?php endif; ?>

            <form method="post">
                <?php wp_nonce_field( 'ctp_settings_nonce' ); ?>

                <table class="form-table">
                    <tr>
                        <th><label for="default_platform_fee">Default Platform Fee (%)</label></th>
                        <td>
                            <input type="number" id="default_platform_fee" name="default_platform_fee"
                                   value="<?php echo esc_attr( $fee ); ?>" min="2" max="15" step="0.5" class="small-text">
                            <p class="description">Fee charged to merchants on each transaction (2-15%).</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="minimum_discount_rate">Minimum Discount Rate (%)</label></th>
                        <td>
                            <input type="number" id="minimum_discount_rate" name="minimum_discount_rate"
                                   value="<?php echo esc_attr( $min ); ?>" min="1" max="50" step="1" class="small-text">
                            <p class="description">Minimum discount a merchant can offer (1-50%).</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="maximum_discount_rate">Maximum Discount Rate (%)</label></th>
                        <td>
                            <input type="number" id="maximum_discount_rate" name="maximum_discount_rate"
                                   value="<?php echo esc_attr( $max ); ?>" min="5" max="50" step="1" class="small-text">
                            <p class="description">Maximum discount a merchant can offer (5-50%).</p>
                        </td>
                    </tr>
                </table>

                <p class="submit">
                    <input type="submit" name="ctp_save_settings" class="button-primary"
                           value="<?php esc_attr_e( 'Save Settings', 'cyprus-tourist-pass' ); ?>">
                </p>
            </form>

            <hr>
            <h2>Database Tools</h2>
            <?php if ( isset( $_POST['ctp_reseed'] ) && check_admin_referer( 'ctp_reseed_nonce' ) ) : ?>
                <?php
                    CTP_Database::drop_tables();
                    CTP_Database::create_tables();
                    CTP_Database::seed_data();
                ?>
                <div class="notice notice-success"><p>Database has been reset and re-seeded with demo data.</p></div>
            <?php endif; ?>
            <form method="post">
                <?php wp_nonce_field( 'ctp_reseed_nonce' ); ?>
                <p>
                    <input type="submit" name="ctp_reseed" class="button-secondary"
                           value="Reset & Re-seed Database"
                           onclick="return confirm('This will delete all data and re-seed with demo data. Are you sure?');">
                </p>
            </form>
        </div>
        <?php
    }

    public static function render_help_page() {
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Help & Shortcodes', 'cyprus-tourist-pass' ); ?></h1>

            <h2>Available Shortcodes</h2>
            <table class="widefat fixed striped">
                <thead>
                    <tr>
                        <th>Shortcode</th>
                        <th>Description</th>
                        <th>Parameters</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>[cyprus_tourist_pass]</code></td>
                        <td>Full application with login/register and all role-based views (Tourist, Merchant, Admin).</td>
                        <td><code>view</code> - Restrict to specific view: <code>full</code> (default), <code>customer</code>, <code>merchant</code>, <code>admin</code></td>
                    </tr>
                    <tr>
                        <td><code>[ctp_merchant_pos]</code></td>
                        <td>Merchant POS terminal only (requires merchant login).</td>
                        <td>None</td>
                    </tr>
                    <tr>
                        <td><code>[ctp_admin_dashboard]</code></td>
                        <td>Admin dashboard only (requires admin login).</td>
                        <td>None</td>
                    </tr>
                </tbody>
            </table>

            <h2>How It Works</h2>
            <ol>
                <li><strong>Add Shortcode:</strong> Create a new page and add <code>[cyprus_tourist_pass]</code> to its content.</li>
                <li><strong>Tourist Flow:</strong> Tourists register, validate their rental car contract (use "TEST-" prefix for demo), browse merchants, and claim discounts via QR codes.</li>
                <li><strong>Merchant Flow:</strong> Merchants register their business, wait for admin approval, then scan customer QR codes and process discounted payments.</li>
                <li><strong>Admin Flow:</strong> Admins manage merchants (approve/reject/suspend), view platform analytics, and configure settings.</li>
            </ol>

            <h2>Demo Credentials</h2>
            <ul>
                <li><strong>Admin:</strong> admin@cypruspass.com / password123</li>
                <li><strong>Tourist:</strong> tourist@example.com / password123 (has pre-validated contract TEST-12345)</li>
                <li><strong>Merchant:</strong> ocean@cypruspass.com / password123 (Ocean View Seafood)</li>
            </ul>
        </div>
        <?php
    }

    private static function get_count( $table, $where = '1=1' ) {
        global $wpdb;
        $full_table = $wpdb->prefix . $table;
        return (int) $wpdb->get_var( "SELECT COUNT(*) FROM $full_table WHERE $where" );
    }
}
