<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class CTP_Database {

    /**
     * Create all custom tables
     */
    public static function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        // Users table (separate from WP users for the pass system)
        $table_users = $wpdb->prefix . 'ctp_users';
        $sql_users = "CREATE TABLE $table_users (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            email varchar(255) NOT NULL,
            password_hash varchar(255) NOT NULL,
            first_name varchar(100) NOT NULL,
            last_name varchar(100) NOT NULL,
            role enum('CUSTOMER','MERCHANT','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY email (email)
        ) $charset_collate;";
        dbDelta( $sql_users );

        // Customer profiles
        $table_customers = $wpdb->prefix . 'ctp_customer_profiles';
        $sql_customers = "CREATE TABLE $table_customers (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_id (user_id)
        ) $charset_collate;";
        dbDelta( $sql_customers );

        // Merchant profiles
        $table_merchants = $wpdb->prefix . 'ctp_merchant_profiles';
        $sql_merchants = "CREATE TABLE $table_merchants (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id bigint(20) UNSIGNED NOT NULL,
            business_name varchar(255) NOT NULL,
            business_type enum('RESTAURANT','HOTEL','ACTIVITY','TOUR','SPA') NOT NULL,
            discount_rate decimal(5,2) NOT NULL DEFAULT 10.00,
            status enum('PENDING','APPROVED','REJECTED','SUSPENDED') NOT NULL DEFAULT 'PENDING',
            platform_fee_rate decimal(5,2) DEFAULT NULL,
            description text DEFAULT NULL,
            image_url varchar(500) DEFAULT NULL,
            address varchar(255) DEFAULT NULL,
            city varchar(100) DEFAULT NULL,
            latitude decimal(10,7) DEFAULT NULL,
            longitude decimal(10,7) DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_id (user_id)
        ) $charset_collate;";
        dbDelta( $sql_merchants );

        // Rental contracts
        $table_contracts = $wpdb->prefix . 'ctp_rental_contracts';
        $sql_contracts = "CREATE TABLE $table_contracts (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            customer_id bigint(20) UNSIGNED NOT NULL,
            contract_number varchar(100) NOT NULL,
            agency_name varchar(100) NOT NULL,
            start_date datetime NOT NULL,
            end_date datetime NOT NULL,
            vehicle_class varchar(50) DEFAULT 'STANDARD',
            is_valid tinyint(1) NOT NULL DEFAULT 1,
            validated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY contract_number (contract_number)
        ) $charset_collate;";
        dbDelta( $sql_contracts );

        // QR Tokens
        $table_qr = $wpdb->prefix . 'ctp_qr_tokens';
        $sql_qr = "CREATE TABLE $table_qr (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            token varchar(64) NOT NULL,
            customer_id bigint(20) UNSIGNED NOT NULL,
            merchant_id bigint(20) UNSIGNED NOT NULL,
            discount_rate decimal(5,2) NOT NULL,
            expires_at datetime NOT NULL,
            used tinyint(1) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY token (token)
        ) $charset_collate;";
        dbDelta( $sql_qr );

        // Transactions
        $table_transactions = $wpdb->prefix . 'ctp_transactions';
        $sql_transactions = "CREATE TABLE $table_transactions (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            customer_id bigint(20) UNSIGNED NOT NULL,
            merchant_id bigint(20) UNSIGNED NOT NULL,
            qr_token_id bigint(20) UNSIGNED DEFAULT NULL,
            original_amount decimal(10,2) NOT NULL,
            discount_rate decimal(5,2) NOT NULL,
            discount_amount decimal(10,2) NOT NULL,
            final_amount decimal(10,2) NOT NULL,
            platform_fee_rate decimal(5,2) NOT NULL,
            platform_fee decimal(10,2) NOT NULL,
            merchant_payout decimal(10,2) NOT NULL,
            status enum('PENDING','COMPLETED','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
            stripe_payment_id varchar(255) DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        dbDelta( $sql_transactions );

        // Platform settings
        $table_settings = $wpdb->prefix . 'ctp_platform_settings';
        $sql_settings = "CREATE TABLE $table_settings (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            setting_key varchar(100) NOT NULL,
            setting_value varchar(255) NOT NULL,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY setting_key (setting_key)
        ) $charset_collate;";
        dbDelta( $sql_settings );

        update_option( 'ctp_db_version', CTP_VERSION );
    }

    /**
     * Seed demo data
     */
    public static function seed_data() {
        global $wpdb;

        $table_users     = $wpdb->prefix . 'ctp_users';
        $table_customers = $wpdb->prefix . 'ctp_customer_profiles';
        $table_merchants = $wpdb->prefix . 'ctp_merchant_profiles';
        $table_contracts = $wpdb->prefix . 'ctp_rental_contracts';
        $table_settings  = $wpdb->prefix . 'ctp_platform_settings';
        $table_transactions = $wpdb->prefix . 'ctp_transactions';

        // Check if already seeded
        $existing = $wpdb->get_var( "SELECT COUNT(*) FROM $table_users" );
        if ( $existing > 0 ) {
            return;
        }

        $password_hash = password_hash( 'password123', PASSWORD_BCRYPT );

        // Admin user
        $wpdb->insert( $table_users, array(
            'email'         => 'admin@cypruspass.com',
            'password_hash' => $password_hash,
            'first_name'    => 'Admin',
            'last_name'     => 'User',
            'role'          => 'ADMIN',
        ) );

        // Tourist user
        $wpdb->insert( $table_users, array(
            'email'         => 'tourist@example.com',
            'password_hash' => $password_hash,
            'first_name'    => 'John',
            'last_name'     => 'Tourist',
            'role'          => 'CUSTOMER',
        ) );
        $tourist_user_id = $wpdb->insert_id;

        $wpdb->insert( $table_customers, array(
            'user_id' => $tourist_user_id,
        ) );
        $tourist_profile_id = $wpdb->insert_id;

        // Pre-validated rental contract
        $wpdb->insert( $table_contracts, array(
            'customer_id'     => $tourist_profile_id,
            'contract_number' => 'TEST-12345',
            'agency_name'     => 'Sixt',
            'start_date'      => current_time( 'mysql' ),
            'end_date'        => date( 'Y-m-d H:i:s', strtotime( '+7 days' ) ),
            'vehicle_class'   => 'STANDARD',
            'is_valid'        => 1,
        ) );

        // Merchant users and profiles
        $merchants_data = array(
            array(
                'email'         => 'ocean@cypruspass.com',
                'first_name'    => 'Maria',
                'last_name'     => 'Georgiou',
                'business_name' => 'Ocean View Seafood',
                'business_type' => 'RESTAURANT',
                'discount_rate' => 15.00,
                'status'        => 'APPROVED',
                'description'   => 'Fresh seafood restaurant with stunning ocean views in Paphos. Enjoy the catch of the day while watching the Mediterranean sunset.',
                'image_url'     => 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
                'address'       => 'Poseidon Avenue 42, Kato Paphos',
                'city'          => 'Paphos',
            ),
            array(
                'email'         => 'aphrodite@cypruspass.com',
                'first_name'    => 'Andreas',
                'last_name'     => 'Christou',
                'business_name' => 'Aphrodite Hills Resort',
                'business_type' => 'HOTEL',
                'discount_rate' => 10.00,
                'status'        => 'APPROVED',
                'description'   => 'Luxury 5-star resort nestled in the hills of Paphos with world-class golf, spa, and dining facilities.',
                'image_url'     => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
                'address'       => 'Aphrodite Hills, Kouklia',
                'city'          => 'Paphos',
            ),
            array(
                'email'         => 'bluelagoon@cypruspass.com',
                'first_name'    => 'Nikos',
                'last_name'     => 'Papadopoulos',
                'business_name' => 'Blue Lagoon Cruises',
                'business_type' => 'ACTIVITY',
                'discount_rate' => 20.00,
                'status'        => 'APPROVED',
                'description'   => 'Sail to the famous Blue Lagoon of Akamas Peninsula. Full-day cruises with snorkeling, lunch, and drinks included.',
                'image_url'     => 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
                'address'       => 'Latchi Marina, Polis Chrysochous',
                'city'          => 'Polis',
            ),
            array(
                'email'         => 'taverna@cypruspass.com',
                'first_name'    => 'Elena',
                'last_name'     => 'Stavrou',
                'business_name' => 'Taverna Agia Napa',
                'business_type' => 'RESTAURANT',
                'discount_rate' => 5.00,
                'status'        => 'APPROVED',
                'description'   => 'Traditional Cypriot meze taverna in the heart of Ayia Napa. Family recipes passed down through generations.',
                'image_url'     => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
                'address'       => 'Nissi Avenue 18, Ayia Napa',
                'city'          => 'Ayia Napa',
            ),
            array(
                'email'         => 'spa@cypruspass.com',
                'first_name'    => 'Sofia',
                'last_name'     => 'Kyriakou',
                'business_name' => 'Cyprus Zen Spa',
                'business_type' => 'SPA',
                'discount_rate' => 12.00,
                'status'        => 'APPROVED',
                'description'   => 'Luxurious wellness center offering traditional hammam, aromatherapy, and rejuvenating treatments.',
                'image_url'     => 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=400&h=300&fit=crop',
                'address'       => 'Makarios III Avenue, Limassol',
                'city'          => 'Limassol',
            ),
            array(
                'email'         => 'mountain@cypruspass.com',
                'first_name'    => 'Costas',
                'last_name'     => 'Demetriou',
                'business_name' => 'Mountain Adventures Cyprus',
                'business_type' => 'ACTIVITY',
                'discount_rate' => 18.00,
                'status'        => 'PENDING',
                'description'   => 'Guided hiking, mountain biking, and rock climbing in the Troodos Mountains.',
                'image_url'     => 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
                'address'       => 'Troodos Square',
                'city'          => 'Troodos',
            ),
        );

        $merchant_profile_ids = array();

        foreach ( $merchants_data as $m ) {
            $wpdb->insert( $table_users, array(
                'email'         => $m['email'],
                'password_hash' => $password_hash,
                'first_name'    => $m['first_name'],
                'last_name'     => $m['last_name'],
                'role'          => 'MERCHANT',
            ) );
            $merchant_user_id = $wpdb->insert_id;

            $wpdb->insert( $table_merchants, array(
                'user_id'       => $merchant_user_id,
                'business_name' => $m['business_name'],
                'business_type' => $m['business_type'],
                'discount_rate' => $m['discount_rate'],
                'status'        => $m['status'],
                'description'   => $m['description'],
                'image_url'     => $m['image_url'],
                'address'       => $m['address'],
                'city'          => $m['city'],
            ) );
            $merchant_profile_ids[] = $wpdb->insert_id;
        }

        // Sample transactions
        $sample_transactions = array(
            array(
                'customer_id'     => $tourist_profile_id,
                'merchant_id'     => $merchant_profile_ids[0],
                'original_amount' => 85.00,
                'discount_rate'   => 15.00,
                'discount_amount' => 12.75,
                'final_amount'    => 72.25,
                'platform_fee_rate' => 10.00,
                'platform_fee'    => 7.23,
                'merchant_payout' => 65.02,
                'status'          => 'COMPLETED',
                'created_at'      => date( 'Y-m-d H:i:s', strtotime( '-2 days' ) ),
            ),
            array(
                'customer_id'     => $tourist_profile_id,
                'merchant_id'     => $merchant_profile_ids[1],
                'original_amount' => 250.00,
                'discount_rate'   => 10.00,
                'discount_amount' => 25.00,
                'final_amount'    => 225.00,
                'platform_fee_rate' => 10.00,
                'platform_fee'    => 22.50,
                'merchant_payout' => 202.50,
                'status'          => 'COMPLETED',
                'created_at'      => date( 'Y-m-d H:i:s', strtotime( '-1 day' ) ),
            ),
            array(
                'customer_id'     => $tourist_profile_id,
                'merchant_id'     => $merchant_profile_ids[2],
                'original_amount' => 120.00,
                'discount_rate'   => 20.00,
                'discount_amount' => 24.00,
                'final_amount'    => 96.00,
                'platform_fee_rate' => 10.00,
                'platform_fee'    => 9.60,
                'merchant_payout' => 86.40,
                'status'          => 'COMPLETED',
                'created_at'      => date( 'Y-m-d H:i:s', strtotime( '-12 hours' ) ),
            ),
            array(
                'customer_id'     => $tourist_profile_id,
                'merchant_id'     => $merchant_profile_ids[4],
                'original_amount' => 180.00,
                'discount_rate'   => 12.00,
                'discount_amount' => 21.60,
                'final_amount'    => 158.40,
                'platform_fee_rate' => 10.00,
                'platform_fee'    => 15.84,
                'merchant_payout' => 142.56,
                'status'          => 'COMPLETED',
                'created_at'      => date( 'Y-m-d H:i:s', strtotime( '-6 hours' ) ),
            ),
        );

        foreach ( $sample_transactions as $t ) {
            $wpdb->insert( $table_transactions, $t );
        }

        // Platform settings
        $settings = array(
            array( 'setting_key' => 'default_platform_fee', 'setting_value' => '10' ),
            array( 'setting_key' => 'minimum_discount_rate', 'setting_value' => '5' ),
            array( 'setting_key' => 'maximum_discount_rate', 'setting_value' => '25' ),
        );

        foreach ( $settings as $s ) {
            $wpdb->replace( $table_settings, $s );
        }
    }

    /**
     * Get a platform setting
     */
    public static function get_setting( $key, $default = null ) {
        global $wpdb;
        $table = $wpdb->prefix . 'ctp_platform_settings';
        $value = $wpdb->get_var( $wpdb->prepare(
            "SELECT setting_value FROM $table WHERE setting_key = %s",
            $key
        ) );
        return $value !== null ? $value : $default;
    }

    /**
     * Update a platform setting
     */
    public static function update_setting( $key, $value ) {
        global $wpdb;
        $table = $wpdb->prefix . 'ctp_platform_settings';
        $wpdb->replace( $table, array(
            'setting_key'   => $key,
            'setting_value' => $value,
        ) );
    }

    /**
     * Drop all tables (for uninstall)
     */
    public static function drop_tables() {
        global $wpdb;
        $tables = array(
            'ctp_transactions',
            'ctp_qr_tokens',
            'ctp_rental_contracts',
            'ctp_merchant_profiles',
            'ctp_customer_profiles',
            'ctp_users',
            'ctp_platform_settings',
        );
        foreach ( $tables as $table ) {
            $wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}{$table}" );
        }
        delete_option( 'ctp_db_version' );
    }
}
