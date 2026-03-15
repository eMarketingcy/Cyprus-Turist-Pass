<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class CTP_Rest_API {

    const NAMESPACE = 'ctp/v1';

    public static function register_routes() {

        // Auth routes
        register_rest_route( self::NAMESPACE, '/auth/register', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'register_user' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/auth/login', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'login_user' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/auth/me', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'get_me' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        // Rental routes
        register_rest_route( self::NAMESPACE, '/rental/validate', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'validate_rental' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        register_rest_route( self::NAMESPACE, '/rental/status', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'rental_status' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        // Merchant routes
        register_rest_route( self::NAMESPACE, '/merchants', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'list_merchants' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        register_rest_route( self::NAMESPACE, '/merchants/profile', array(
            'methods'             => 'PUT',
            'callback'            => array( __CLASS__, 'update_merchant_profile' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        register_rest_route( self::NAMESPACE, '/merchants/(?P<id>\d+)', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'get_merchant' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        // Payment routes
        register_rest_route( self::NAMESPACE, '/payment/create-qr', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'create_qr' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        register_rest_route( self::NAMESPACE, '/payment/validate-qr', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'validate_qr' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        register_rest_route( self::NAMESPACE, '/payment/process', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'process_payment' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        register_rest_route( self::NAMESPACE, '/payment/transactions', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'get_transactions' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        // Admin routes
        register_rest_route( self::NAMESPACE, '/admin/stats', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'admin_stats' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        register_rest_route( self::NAMESPACE, '/admin/merchants', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'admin_merchants' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        register_rest_route( self::NAMESPACE, '/admin/merchants/(?P<id>\d+)/status', array(
            'methods'             => 'PUT',
            'callback'            => array( __CLASS__, 'admin_update_merchant_status' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        register_rest_route( self::NAMESPACE, '/admin/merchants/(?P<id>\d+)/fee', array(
            'methods'             => 'PUT',
            'callback'            => array( __CLASS__, 'admin_update_merchant_fee' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        register_rest_route( self::NAMESPACE, '/admin/transactions', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'admin_transactions' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        register_rest_route( self::NAMESPACE, '/admin/customers', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'admin_customers' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        register_rest_route( self::NAMESPACE, '/admin/settings', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'admin_get_settings' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );

        register_rest_route( self::NAMESPACE, '/admin/settings', array(
            'methods'             => 'PUT',
            'callback'            => array( __CLASS__, 'admin_update_settings' ),
            'permission_callback' => array( 'CTP_Auth', 'is_authenticated' ),
        ) );
    }

    // =====================
    // AUTH ENDPOINTS
    // =====================

    public static function register_user( $request ) {
        global $wpdb;
        $table_users     = $wpdb->prefix . 'ctp_users';
        $table_customers = $wpdb->prefix . 'ctp_customer_profiles';
        $table_merchants = $wpdb->prefix . 'ctp_merchant_profiles';

        $params = $request->get_json_params();
        $email      = sanitize_email( $params['email'] ?? '' );
        $password   = $params['password'] ?? '';
        $first_name = sanitize_text_field( $params['firstName'] ?? '' );
        $last_name  = sanitize_text_field( $params['lastName'] ?? '' );
        $role       = sanitize_text_field( $params['role'] ?? 'CUSTOMER' );

        if ( ! $email || ! $password || ! $first_name || ! $last_name ) {
            return new WP_Error( 'missing_fields', 'All fields are required.', array( 'status' => 400 ) );
        }

        if ( ! in_array( $role, array( 'CUSTOMER', 'MERCHANT' ), true ) ) {
            return new WP_Error( 'invalid_role', 'Invalid role.', array( 'status' => 400 ) );
        }

        $existing = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM $table_users WHERE email = %s", $email ) );
        if ( $existing ) {
            return new WP_Error( 'email_exists', 'Email already registered.', array( 'status' => 409 ) );
        }

        $wpdb->insert( $table_users, array(
            'email'         => $email,
            'password_hash' => CTP_Auth::hash_password( $password ),
            'first_name'    => $first_name,
            'last_name'     => $last_name,
            'role'          => $role,
        ) );
        $user_id = $wpdb->insert_id;

        if ( $role === 'CUSTOMER' ) {
            $wpdb->insert( $table_customers, array( 'user_id' => $user_id ) );
        } elseif ( $role === 'MERCHANT' ) {
            $business_name = sanitize_text_field( $params['businessName'] ?? '' );
            $business_type = sanitize_text_field( $params['businessType'] ?? 'RESTAURANT' );
            $city          = sanitize_text_field( $params['city'] ?? '' );
            $address       = sanitize_text_field( $params['address'] ?? '' );

            if ( ! $business_name ) {
                return new WP_Error( 'missing_business', 'Business name is required.', array( 'status' => 400 ) );
            }

            $wpdb->insert( $table_merchants, array(
                'user_id'       => $user_id,
                'business_name' => $business_name,
                'business_type' => $business_type,
                'city'          => $city,
                'address'       => $address,
            ) );
        }

        $token = CTP_Auth::generate_token( $user_id, $email, $role );

        return rest_ensure_response( array(
            'token' => $token,
            'user'  => array(
                'id'        => $user_id,
                'email'     => $email,
                'firstName' => $first_name,
                'lastName'  => $last_name,
                'role'      => $role,
            ),
        ) );
    }

    public static function login_user( $request ) {
        global $wpdb;
        $table_users = $wpdb->prefix . 'ctp_users';

        $params   = $request->get_json_params();
        $email    = sanitize_email( $params['email'] ?? '' );
        $password = $params['password'] ?? '';

        if ( ! $email || ! $password ) {
            return new WP_Error( 'missing_fields', 'Email and password are required.', array( 'status' => 400 ) );
        }

        $user = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table_users WHERE email = %s",
            $email
        ) );

        if ( ! $user || ! CTP_Auth::verify_password( $password, $user->password_hash ) ) {
            return new WP_Error( 'invalid_credentials', 'Invalid email or password.', array( 'status' => 401 ) );
        }

        $token = CTP_Auth::generate_token( $user->id, $user->email, $user->role );

        return rest_ensure_response( array(
            'token' => $token,
            'user'  => array(
                'id'        => (int) $user->id,
                'email'     => $user->email,
                'firstName' => $user->first_name,
                'lastName'  => $user->last_name,
                'role'      => $user->role,
            ),
        ) );
    }

    public static function get_me( $request ) {
        global $wpdb;
        $auth_user    = CTP_Auth::get_user_from_request( $request );
        $table_users  = $wpdb->prefix . 'ctp_users';

        $user = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table_users WHERE id = %d",
            $auth_user['userId']
        ) );

        if ( ! $user ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $response = array(
            'id'        => (int) $user->id,
            'email'     => $user->email,
            'firstName' => $user->first_name,
            'lastName'  => $user->last_name,
            'role'      => $user->role,
        );

        // Attach merchant profile if applicable
        if ( $user->role === 'MERCHANT' ) {
            $table_merchants = $wpdb->prefix . 'ctp_merchant_profiles';
            $merchant = $wpdb->get_row( $wpdb->prepare(
                "SELECT * FROM $table_merchants WHERE user_id = %d",
                $user->id
            ) );
            if ( $merchant ) {
                $response['merchantProfile'] = self::format_merchant( $merchant );
            }
        }

        return rest_ensure_response( $response );
    }

    // =====================
    // RENTAL ENDPOINTS
    // =====================

    public static function validate_rental( $request ) {
        global $wpdb;
        $auth_user = CTP_Auth::get_user_from_request( $request );

        if ( $auth_user['role'] !== 'CUSTOMER' ) {
            return new WP_Error( 'forbidden', 'Only customers can validate rentals.', array( 'status' => 403 ) );
        }

        $params          = $request->get_json_params();
        $contract_number = sanitize_text_field( $params['contractNumber'] ?? '' );
        $agency_name     = sanitize_text_field( $params['agencyName'] ?? '' );

        if ( ! $contract_number || ! $agency_name ) {
            return new WP_Error( 'missing_fields', 'Contract number and agency name are required.', array( 'status' => 400 ) );
        }

        // Mock rental API validation - accepts contracts starting with "TEST"
        if ( strpos( strtoupper( $contract_number ), 'TEST' ) !== 0 ) {
            return new WP_Error( 'invalid_contract', 'Contract not found. For demo, use a contract number starting with "TEST".', array( 'status' => 400 ) );
        }

        $table_customers = $wpdb->prefix . 'ctp_customer_profiles';
        $table_contracts = $wpdb->prefix . 'ctp_rental_contracts';

        // Get customer profile
        $customer = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table_customers WHERE user_id = %d",
            $auth_user['userId']
        ) );

        if ( ! $customer ) {
            // Create customer profile if missing
            $wpdb->insert( $table_customers, array( 'user_id' => $auth_user['userId'] ) );
            $customer_id = $wpdb->insert_id;
        } else {
            $customer_id = $customer->id;
        }

        // Check if contract already exists
        $existing = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM $table_contracts WHERE contract_number = %s",
            $contract_number
        ) );

        if ( $existing ) {
            return new WP_Error( 'contract_exists', 'This contract has already been validated.', array( 'status' => 409 ) );
        }

        $start_date = current_time( 'mysql' );
        $end_date   = date( 'Y-m-d H:i:s', strtotime( '+7 days' ) );

        $wpdb->insert( $table_contracts, array(
            'customer_id'     => $customer_id,
            'contract_number' => $contract_number,
            'agency_name'     => $agency_name,
            'start_date'      => $start_date,
            'end_date'        => $end_date,
            'vehicle_class'   => 'STANDARD',
            'is_valid'        => 1,
        ) );

        return rest_ensure_response( array(
            'message'  => 'Contract validated successfully!',
            'contract' => array(
                'contractNumber' => $contract_number,
                'agencyName'     => $agency_name,
                'startDate'      => $start_date,
                'endDate'        => $end_date,
                'vehicleClass'   => 'STANDARD',
                'isValid'        => true,
            ),
        ) );
    }

    public static function rental_status( $request ) {
        global $wpdb;
        $auth_user = CTP_Auth::get_user_from_request( $request );

        $table_customers = $wpdb->prefix . 'ctp_customer_profiles';
        $table_contracts = $wpdb->prefix . 'ctp_rental_contracts';

        $customer = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table_customers WHERE user_id = %d",
            $auth_user['userId']
        ) );

        if ( ! $customer ) {
            return rest_ensure_response( array( 'contract' => null ) );
        }

        $contract = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table_contracts WHERE customer_id = %d AND is_valid = 1 ORDER BY created_at DESC LIMIT 1",
            $customer->id
        ) );

        if ( ! $contract ) {
            return rest_ensure_response( array( 'contract' => null ) );
        }

        // Check if expired
        if ( strtotime( $contract->end_date ) < time() ) {
            $wpdb->update( $table_contracts, array( 'is_valid' => 0 ), array( 'id' => $contract->id ) );
            return rest_ensure_response( array( 'contract' => null ) );
        }

        return rest_ensure_response( array(
            'contract' => array(
                'contractNumber' => $contract->contract_number,
                'agencyName'     => $contract->agency_name,
                'startDate'      => $contract->start_date,
                'endDate'        => $contract->end_date,
                'vehicleClass'   => $contract->vehicle_class,
                'isValid'        => (bool) $contract->is_valid,
            ),
        ) );
    }

    // =====================
    // MERCHANT ENDPOINTS
    // =====================

    public static function list_merchants( $request ) {
        global $wpdb;
        $table_merchants = $wpdb->prefix . 'ctp_merchant_profiles';
        $table_users     = $wpdb->prefix . 'ctp_users';

        $city = sanitize_text_field( $request->get_param( 'city' ) ?? '' );
        $type = sanitize_text_field( $request->get_param( 'type' ) ?? '' );
        $search = sanitize_text_field( $request->get_param( 'search' ) ?? '' );

        $where = "m.status = 'APPROVED'";
        $params = array();

        if ( $city ) {
            $where .= " AND m.city = %s";
            $params[] = $city;
        }
        if ( $type ) {
            $where .= " AND m.business_type = %s";
            $params[] = $type;
        }
        if ( $search ) {
            $where .= " AND (m.business_name LIKE %s OR m.description LIKE %s OR m.address LIKE %s)";
            $like = '%' . $wpdb->esc_like( $search ) . '%';
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }

        $sql = "SELECT m.*, u.first_name, u.last_name, u.email
                FROM $table_merchants m
                JOIN $table_users u ON m.user_id = u.id
                WHERE $where
                ORDER BY m.created_at DESC";

        if ( ! empty( $params ) ) {
            $sql = $wpdb->prepare( $sql, ...$params );
        }

        $merchants = $wpdb->get_results( $sql );

        $result = array();
        foreach ( $merchants as $m ) {
            $result[] = self::format_merchant( $m );
        }

        return rest_ensure_response( $result );
    }

    public static function get_merchant( $request ) {
        global $wpdb;
        $table_merchants = $wpdb->prefix . 'ctp_merchant_profiles';
        $id = (int) $request['id'];

        $merchant = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table_merchants WHERE id = %d",
            $id
        ) );

        if ( ! $merchant ) {
            return new WP_Error( 'not_found', 'Merchant not found.', array( 'status' => 404 ) );
        }

        return rest_ensure_response( self::format_merchant( $merchant ) );
    }

    public static function update_merchant_profile( $request ) {
        global $wpdb;
        $auth_user       = CTP_Auth::get_user_from_request( $request );
        $table_merchants = $wpdb->prefix . 'ctp_merchant_profiles';

        if ( $auth_user['role'] !== 'MERCHANT' ) {
            return new WP_Error( 'forbidden', 'Only merchants can update profiles.', array( 'status' => 403 ) );
        }

        $params = $request->get_json_params();
        $update = array();

        if ( isset( $params['discountRate'] ) ) {
            $rate = floatval( $params['discountRate'] );
            $min  = floatval( CTP_Database::get_setting( 'minimum_discount_rate', 5 ) );
            $max  = floatval( CTP_Database::get_setting( 'maximum_discount_rate', 25 ) );
            if ( $rate < $min || $rate > $max ) {
                return new WP_Error( 'invalid_rate', "Discount rate must be between $min% and $max%.", array( 'status' => 400 ) );
            }
            $update['discount_rate'] = $rate;
        }

        if ( isset( $params['description'] ) ) {
            $update['description'] = sanitize_textarea_field( $params['description'] );
        }

        if ( isset( $params['imageUrl'] ) ) {
            $update['image_url'] = esc_url_raw( $params['imageUrl'] );
        }

        if ( empty( $update ) ) {
            return new WP_Error( 'no_changes', 'No fields to update.', array( 'status' => 400 ) );
        }

        $wpdb->update( $table_merchants, $update, array( 'user_id' => $auth_user['userId'] ) );

        $merchant = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table_merchants WHERE user_id = %d",
            $auth_user['userId']
        ) );

        return rest_ensure_response( self::format_merchant( $merchant ) );
    }

    // =====================
    // PAYMENT ENDPOINTS
    // =====================

    public static function create_qr( $request ) {
        global $wpdb;
        $auth_user = CTP_Auth::get_user_from_request( $request );

        if ( $auth_user['role'] !== 'CUSTOMER' ) {
            return new WP_Error( 'forbidden', 'Only customers can create QR codes.', array( 'status' => 403 ) );
        }

        $params      = $request->get_json_params();
        $merchant_id = intval( $params['merchantId'] ?? 0 );

        if ( ! $merchant_id ) {
            return new WP_Error( 'missing_merchant', 'Merchant ID is required.', array( 'status' => 400 ) );
        }

        $table_customers = $wpdb->prefix . 'ctp_customer_profiles';
        $table_merchants = $wpdb->prefix . 'ctp_merchant_profiles';
        $table_contracts = $wpdb->prefix . 'ctp_rental_contracts';
        $table_qr        = $wpdb->prefix . 'ctp_qr_tokens';

        // Verify customer has valid contract
        $customer = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table_customers WHERE user_id = %d",
            $auth_user['userId']
        ) );

        if ( ! $customer ) {
            return new WP_Error( 'no_profile', 'Customer profile not found.', array( 'status' => 404 ) );
        }

        $contract = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table_contracts WHERE customer_id = %d AND is_valid = 1 AND end_date > %s ORDER BY created_at DESC LIMIT 1",
            $customer->id,
            current_time( 'mysql' )
        ) );

        if ( ! $contract ) {
            return new WP_Error( 'no_contract', 'No valid rental contract found. Please validate your contract first.', array( 'status' => 400 ) );
        }

        // Verify merchant exists and is approved
        $merchant = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table_merchants WHERE id = %d AND status = 'APPROVED'",
            $merchant_id
        ) );

        if ( ! $merchant ) {
            return new WP_Error( 'merchant_not_found', 'Merchant not found or not approved.', array( 'status' => 404 ) );
        }

        // Generate QR token
        $token      = bin2hex( random_bytes( 32 ) );
        $expires_at = date( 'Y-m-d H:i:s', time() + ( 15 * MINUTE_IN_SECONDS ) );

        $wpdb->insert( $table_qr, array(
            'token'         => $token,
            'customer_id'   => $customer->id,
            'merchant_id'   => $merchant->id,
            'discount_rate' => $merchant->discount_rate,
            'expires_at'    => $expires_at,
            'used'          => 0,
        ) );

        return rest_ensure_response( array(
            'token'        => $token,
            'merchantName' => $merchant->business_name,
            'discountRate' => floatval( $merchant->discount_rate ),
            'expiresAt'    => $expires_at,
        ) );
    }

    public static function validate_qr( $request ) {
        global $wpdb;
        $auth_user = CTP_Auth::get_user_from_request( $request );

        if ( $auth_user['role'] !== 'MERCHANT' ) {
            return new WP_Error( 'forbidden', 'Only merchants can validate QR codes.', array( 'status' => 403 ) );
        }

        $params = $request->get_json_params();
        $token  = sanitize_text_field( $params['token'] ?? '' );

        if ( ! $token ) {
            return new WP_Error( 'missing_token', 'QR token is required.', array( 'status' => 400 ) );
        }

        $table_qr        = $wpdb->prefix . 'ctp_qr_tokens';
        $table_merchants  = $wpdb->prefix . 'ctp_merchant_profiles';
        $table_customers  = $wpdb->prefix . 'ctp_customer_profiles';
        $table_users      = $wpdb->prefix . 'ctp_users';

        $qr = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table_qr WHERE token = %s",
            $token
        ) );

        if ( ! $qr ) {
            return new WP_Error( 'invalid_token', 'Invalid QR token.', array( 'status' => 404 ) );
        }

        if ( $qr->used ) {
            return new WP_Error( 'token_used', 'This QR token has already been used.', array( 'status' => 400 ) );
        }

        if ( strtotime( $qr->expires_at ) < time() ) {
            return new WP_Error( 'token_expired', 'This QR token has expired.', array( 'status' => 400 ) );
        }

        // Verify merchant matches
        $merchant = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table_merchants WHERE user_id = %d",
            $auth_user['userId']
        ) );

        if ( ! $merchant || (int) $merchant->id !== (int) $qr->merchant_id ) {
            return new WP_Error( 'wrong_merchant', 'This QR code is for a different merchant.', array( 'status' => 403 ) );
        }

        // Get customer info
        $customer = $wpdb->get_row( $wpdb->prepare(
            "SELECT c.*, u.first_name, u.last_name FROM $table_customers c
             JOIN $table_users u ON c.user_id = u.id
             WHERE c.id = %d",
            $qr->customer_id
        ) );

        $default_fee = floatval( CTP_Database::get_setting( 'default_platform_fee', 10 ) );
        $platform_fee_rate = $merchant->platform_fee_rate !== null ? floatval( $merchant->platform_fee_rate ) : $default_fee;

        return rest_ensure_response( array(
            'valid'           => true,
            'qrTokenId'       => (int) $qr->id,
            'customerId'      => (int) $qr->customer_id,
            'customerName'    => $customer ? $customer->first_name . ' ' . $customer->last_name : 'Unknown',
            'discountRate'    => floatval( $qr->discount_rate ),
            'platformFeeRate' => $platform_fee_rate,
            'expiresAt'       => $qr->expires_at,
        ) );
    }

    public static function process_payment( $request ) {
        global $wpdb;
        $auth_user = CTP_Auth::get_user_from_request( $request );

        if ( $auth_user['role'] !== 'MERCHANT' ) {
            return new WP_Error( 'forbidden', 'Only merchants can process payments.', array( 'status' => 403 ) );
        }

        $params          = $request->get_json_params();
        $qr_token_id     = intval( $params['qrTokenId'] ?? 0 );
        $original_amount = floatval( $params['originalAmount'] ?? 0 );

        if ( ! $qr_token_id || $original_amount <= 0 ) {
            return new WP_Error( 'invalid_params', 'QR token ID and positive amount are required.', array( 'status' => 400 ) );
        }

        $table_qr           = $wpdb->prefix . 'ctp_qr_tokens';
        $table_merchants    = $wpdb->prefix . 'ctp_merchant_profiles';
        $table_transactions = $wpdb->prefix . 'ctp_transactions';

        $qr = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $table_qr WHERE id = %d", $qr_token_id ) );

        if ( ! $qr || $qr->used ) {
            return new WP_Error( 'invalid_qr', 'Invalid or already used QR token.', array( 'status' => 400 ) );
        }

        $merchant = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table_merchants WHERE user_id = %d",
            $auth_user['userId']
        ) );

        $discount_rate    = floatval( $qr->discount_rate );
        $discount_amount  = round( $original_amount * ( $discount_rate / 100 ), 2 );
        $final_amount     = round( $original_amount - $discount_amount, 2 );

        $default_fee       = floatval( CTP_Database::get_setting( 'default_platform_fee', 10 ) );
        $platform_fee_rate = $merchant->platform_fee_rate !== null ? floatval( $merchant->platform_fee_rate ) : $default_fee;
        $platform_fee      = round( $final_amount * ( $platform_fee_rate / 100 ), 2 );
        $merchant_payout   = round( $final_amount - $platform_fee, 2 );

        // Simulate Stripe payment ID
        $stripe_id = 'pi_simulated_' . bin2hex( random_bytes( 12 ) );

        $wpdb->insert( $table_transactions, array(
            'customer_id'       => $qr->customer_id,
            'merchant_id'       => $merchant->id,
            'qr_token_id'       => $qr->id,
            'original_amount'   => $original_amount,
            'discount_rate'     => $discount_rate,
            'discount_amount'   => $discount_amount,
            'final_amount'      => $final_amount,
            'platform_fee_rate' => $platform_fee_rate,
            'platform_fee'      => $platform_fee,
            'merchant_payout'   => $merchant_payout,
            'status'            => 'COMPLETED',
            'stripe_payment_id' => $stripe_id,
        ) );

        // Mark QR as used
        $wpdb->update( $table_qr, array( 'used' => 1 ), array( 'id' => $qr->id ) );

        return rest_ensure_response( array(
            'success'        => true,
            'transactionId'  => $wpdb->insert_id,
            'originalAmount' => $original_amount,
            'discountRate'   => $discount_rate,
            'discountAmount' => $discount_amount,
            'finalAmount'    => $final_amount,
            'platformFee'    => $platform_fee,
            'merchantPayout' => $merchant_payout,
            'stripePaymentId' => $stripe_id,
        ) );
    }

    public static function get_transactions( $request ) {
        global $wpdb;
        $auth_user          = CTP_Auth::get_user_from_request( $request );
        $table_transactions = $wpdb->prefix . 'ctp_transactions';
        $table_merchants    = $wpdb->prefix . 'ctp_merchant_profiles';
        $table_customers    = $wpdb->prefix . 'ctp_customer_profiles';
        $table_users        = $wpdb->prefix . 'ctp_users';

        if ( $auth_user['role'] === 'CUSTOMER' ) {
            $customer = $wpdb->get_row( $wpdb->prepare(
                "SELECT * FROM $table_customers WHERE user_id = %d",
                $auth_user['userId']
            ) );

            if ( ! $customer ) {
                return rest_ensure_response( array() );
            }

            $transactions = $wpdb->get_results( $wpdb->prepare(
                "SELECT t.*, m.business_name, m.business_type
                 FROM $table_transactions t
                 JOIN $table_merchants m ON t.merchant_id = m.id
                 WHERE t.customer_id = %d
                 ORDER BY t.created_at DESC",
                $customer->id
            ) );
        } elseif ( $auth_user['role'] === 'MERCHANT' ) {
            $merchant = $wpdb->get_row( $wpdb->prepare(
                "SELECT * FROM $table_merchants WHERE user_id = %d",
                $auth_user['userId']
            ) );

            if ( ! $merchant ) {
                return rest_ensure_response( array() );
            }

            $transactions = $wpdb->get_results( $wpdb->prepare(
                "SELECT t.*, c.user_id as customer_user_id, u.first_name as customer_first_name, u.last_name as customer_last_name
                 FROM $table_transactions t
                 JOIN $table_customers c ON t.customer_id = c.id
                 JOIN $table_users u ON c.user_id = u.id
                 WHERE t.merchant_id = %d
                 ORDER BY t.created_at DESC",
                $merchant->id
            ) );
        } else {
            return rest_ensure_response( array() );
        }

        $result = array();
        foreach ( $transactions as $t ) {
            $item = array(
                'id'              => (int) $t->id,
                'originalAmount'  => floatval( $t->original_amount ),
                'discountRate'    => floatval( $t->discount_rate ),
                'discountAmount'  => floatval( $t->discount_amount ),
                'finalAmount'     => floatval( $t->final_amount ),
                'platformFeeRate' => floatval( $t->platform_fee_rate ),
                'platformFee'     => floatval( $t->platform_fee ),
                'merchantPayout'  => floatval( $t->merchant_payout ),
                'status'          => $t->status,
                'createdAt'       => $t->created_at,
            );

            if ( isset( $t->business_name ) ) {
                $item['merchantName'] = $t->business_name;
                $item['merchantType'] = $t->business_type;
            }
            if ( isset( $t->customer_first_name ) ) {
                $item['customerName'] = $t->customer_first_name . ' ' . $t->customer_last_name;
            }

            $result[] = $item;
        }

        return rest_ensure_response( $result );
    }

    // =====================
    // ADMIN ENDPOINTS
    // =====================

    public static function admin_stats( $request ) {
        global $wpdb;
        $auth_user = CTP_Auth::get_user_from_request( $request );

        if ( $auth_user['role'] !== 'ADMIN' ) {
            return new WP_Error( 'forbidden', 'Admin access required.', array( 'status' => 403 ) );
        }

        $table_transactions = $wpdb->prefix . 'ctp_transactions';
        $table_merchants    = $wpdb->prefix . 'ctp_merchant_profiles';
        $table_customers    = $wpdb->prefix . 'ctp_customer_profiles';
        $table_users        = $wpdb->prefix . 'ctp_users';

        $total_volume   = $wpdb->get_var( "SELECT COALESCE(SUM(final_amount), 0) FROM $table_transactions WHERE status = 'COMPLETED'" );
        $platform_revenue = $wpdb->get_var( "SELECT COALESCE(SUM(platform_fee), 0) FROM $table_transactions WHERE status = 'COMPLETED'" );
        $active_merchants = $wpdb->get_var( "SELECT COUNT(*) FROM $table_merchants WHERE status = 'APPROVED'" );
        $total_tourists   = $wpdb->get_var( "SELECT COUNT(*) FROM $table_users WHERE role = 'CUSTOMER'" );

        // Recent transactions
        $recent = $wpdb->get_results(
            "SELECT t.*, m.business_name, c.user_id as customer_user_id, u.first_name, u.last_name
             FROM $table_transactions t
             JOIN $table_merchants m ON t.merchant_id = m.id
             JOIN $table_customers c ON t.customer_id = c.id
             JOIN $table_users u ON c.user_id = u.id
             ORDER BY t.created_at DESC LIMIT 10"
        );

        $recent_list = array();
        foreach ( $recent as $r ) {
            $recent_list[] = array(
                'id'            => (int) $r->id,
                'merchantName'  => $r->business_name,
                'customerName'  => $r->first_name . ' ' . $r->last_name,
                'finalAmount'   => floatval( $r->final_amount ),
                'platformFee'   => floatval( $r->platform_fee ),
                'status'        => $r->status,
                'createdAt'     => $r->created_at,
            );
        }

        return rest_ensure_response( array(
            'totalVolume'      => floatval( $total_volume ),
            'platformRevenue'  => floatval( $platform_revenue ),
            'activeMerchants'  => (int) $active_merchants,
            'totalTourists'    => (int) $total_tourists,
            'recentTransactions' => $recent_list,
        ) );
    }

    public static function admin_merchants( $request ) {
        global $wpdb;
        $auth_user = CTP_Auth::get_user_from_request( $request );

        if ( $auth_user['role'] !== 'ADMIN' ) {
            return new WP_Error( 'forbidden', 'Admin access required.', array( 'status' => 403 ) );
        }

        $table_merchants    = $wpdb->prefix . 'ctp_merchant_profiles';
        $table_users        = $wpdb->prefix . 'ctp_users';
        $table_transactions = $wpdb->prefix . 'ctp_transactions';

        $merchants = $wpdb->get_results(
            "SELECT m.*, u.first_name, u.last_name, u.email,
                    (SELECT COUNT(*) FROM $table_transactions WHERE merchant_id = m.id) as transaction_count
             FROM $table_merchants m
             JOIN $table_users u ON m.user_id = u.id
             ORDER BY m.created_at DESC"
        );

        $result = array();
        foreach ( $merchants as $m ) {
            $item = self::format_merchant( $m );
            $item['ownerName']        = $m->first_name . ' ' . $m->last_name;
            $item['ownerEmail']       = $m->email;
            $item['transactionCount'] = (int) $m->transaction_count;
            $result[] = $item;
        }

        return rest_ensure_response( $result );
    }

    public static function admin_update_merchant_status( $request ) {
        global $wpdb;
        $auth_user = CTP_Auth::get_user_from_request( $request );

        if ( $auth_user['role'] !== 'ADMIN' ) {
            return new WP_Error( 'forbidden', 'Admin access required.', array( 'status' => 403 ) );
        }

        $merchant_id = (int) $request['id'];
        $params = $request->get_json_params();
        $status = sanitize_text_field( $params['status'] ?? '' );

        if ( ! in_array( $status, array( 'APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING' ), true ) ) {
            return new WP_Error( 'invalid_status', 'Invalid status.', array( 'status' => 400 ) );
        }

        $table_merchants = $wpdb->prefix . 'ctp_merchant_profiles';

        $wpdb->update( $table_merchants, array( 'status' => $status ), array( 'id' => $merchant_id ) );

        return rest_ensure_response( array( 'success' => true, 'status' => $status ) );
    }

    public static function admin_update_merchant_fee( $request ) {
        global $wpdb;
        $auth_user = CTP_Auth::get_user_from_request( $request );

        if ( $auth_user['role'] !== 'ADMIN' ) {
            return new WP_Error( 'forbidden', 'Admin access required.', array( 'status' => 403 ) );
        }

        $merchant_id = (int) $request['id'];
        $params = $request->get_json_params();
        $fee_rate = floatval( $params['platformFeeRate'] ?? 0 );

        if ( $fee_rate < 2 || $fee_rate > 15 ) {
            return new WP_Error( 'invalid_fee', 'Platform fee must be between 2% and 15%.', array( 'status' => 400 ) );
        }

        $table_merchants = $wpdb->prefix . 'ctp_merchant_profiles';
        $wpdb->update( $table_merchants, array( 'platform_fee_rate' => $fee_rate ), array( 'id' => $merchant_id ) );

        return rest_ensure_response( array( 'success' => true, 'platformFeeRate' => $fee_rate ) );
    }

    public static function admin_transactions( $request ) {
        global $wpdb;
        $auth_user = CTP_Auth::get_user_from_request( $request );

        if ( $auth_user['role'] !== 'ADMIN' ) {
            return new WP_Error( 'forbidden', 'Admin access required.', array( 'status' => 403 ) );
        }

        $table_transactions = $wpdb->prefix . 'ctp_transactions';
        $table_merchants    = $wpdb->prefix . 'ctp_merchant_profiles';
        $table_customers    = $wpdb->prefix . 'ctp_customer_profiles';
        $table_users        = $wpdb->prefix . 'ctp_users';

        $page     = max( 1, intval( $request->get_param( 'page' ) ?? 1 ) );
        $per_page = 20;
        $offset   = ( $page - 1 ) * $per_page;

        $transactions = $wpdb->get_results( $wpdb->prepare(
            "SELECT t.*, m.business_name, u.first_name, u.last_name
             FROM $table_transactions t
             JOIN $table_merchants m ON t.merchant_id = m.id
             JOIN $table_customers c ON t.customer_id = c.id
             JOIN $table_users u ON c.user_id = u.id
             ORDER BY t.created_at DESC
             LIMIT %d OFFSET %d",
            $per_page,
            $offset
        ) );

        $total = $wpdb->get_var( "SELECT COUNT(*) FROM $table_transactions" );

        $result = array();
        foreach ( $transactions as $t ) {
            $result[] = array(
                'id'             => (int) $t->id,
                'merchantName'   => $t->business_name,
                'customerName'   => $t->first_name . ' ' . $t->last_name,
                'originalAmount' => floatval( $t->original_amount ),
                'discountAmount' => floatval( $t->discount_amount ),
                'finalAmount'    => floatval( $t->final_amount ),
                'platformFee'    => floatval( $t->platform_fee ),
                'merchantPayout' => floatval( $t->merchant_payout ),
                'status'         => $t->status,
                'createdAt'      => $t->created_at,
            );
        }

        return rest_ensure_response( array(
            'transactions' => $result,
            'total'        => (int) $total,
            'page'         => $page,
            'perPage'      => $per_page,
        ) );
    }

    public static function admin_customers( $request ) {
        global $wpdb;
        $auth_user = CTP_Auth::get_user_from_request( $request );

        if ( $auth_user['role'] !== 'ADMIN' ) {
            return new WP_Error( 'forbidden', 'Admin access required.', array( 'status' => 403 ) );
        }

        $table_users        = $wpdb->prefix . 'ctp_users';
        $table_customers    = $wpdb->prefix . 'ctp_customer_profiles';
        $table_contracts    = $wpdb->prefix . 'ctp_rental_contracts';
        $table_transactions = $wpdb->prefix . 'ctp_transactions';

        $customers = $wpdb->get_results(
            "SELECT u.id, u.email, u.first_name, u.last_name, u.created_at,
                    c.id as profile_id,
                    rc.contract_number, rc.agency_name, rc.is_valid, rc.end_date,
                    (SELECT COUNT(*) FROM $table_transactions WHERE customer_id = c.id) as transaction_count
             FROM $table_users u
             LEFT JOIN $table_customers c ON c.user_id = u.id
             LEFT JOIN $table_contracts rc ON rc.customer_id = c.id AND rc.is_valid = 1
             WHERE u.role = 'CUSTOMER'
             ORDER BY u.created_at DESC"
        );

        $result = array();
        foreach ( $customers as $c ) {
            $result[] = array(
                'id'               => (int) $c->id,
                'email'            => $c->email,
                'firstName'        => $c->first_name,
                'lastName'         => $c->last_name,
                'contractNumber'   => $c->contract_number,
                'agencyName'       => $c->agency_name,
                'contractValid'    => (bool) $c->is_valid,
                'contractEndDate'  => $c->end_date,
                'transactionCount' => (int) $c->transaction_count,
                'createdAt'        => $c->created_at,
            );
        }

        return rest_ensure_response( $result );
    }

    public static function admin_get_settings( $request ) {
        $auth_user = CTP_Auth::get_user_from_request( $request );

        if ( $auth_user['role'] !== 'ADMIN' ) {
            return new WP_Error( 'forbidden', 'Admin access required.', array( 'status' => 403 ) );
        }

        return rest_ensure_response( array(
            'defaultPlatformFee'  => floatval( CTP_Database::get_setting( 'default_platform_fee', 10 ) ),
            'minimumDiscountRate' => floatval( CTP_Database::get_setting( 'minimum_discount_rate', 5 ) ),
            'maximumDiscountRate' => floatval( CTP_Database::get_setting( 'maximum_discount_rate', 25 ) ),
        ) );
    }

    public static function admin_update_settings( $request ) {
        $auth_user = CTP_Auth::get_user_from_request( $request );

        if ( $auth_user['role'] !== 'ADMIN' ) {
            return new WP_Error( 'forbidden', 'Admin access required.', array( 'status' => 403 ) );
        }

        $params = $request->get_json_params();

        if ( isset( $params['defaultPlatformFee'] ) ) {
            $fee = floatval( $params['defaultPlatformFee'] );
            if ( $fee >= 2 && $fee <= 15 ) {
                CTP_Database::update_setting( 'default_platform_fee', $fee );
            }
        }
        if ( isset( $params['minimumDiscountRate'] ) ) {
            $rate = floatval( $params['minimumDiscountRate'] );
            if ( $rate >= 1 && $rate <= 50 ) {
                CTP_Database::update_setting( 'minimum_discount_rate', $rate );
            }
        }
        if ( isset( $params['maximumDiscountRate'] ) ) {
            $rate = floatval( $params['maximumDiscountRate'] );
            if ( $rate >= 5 && $rate <= 50 ) {
                CTP_Database::update_setting( 'maximum_discount_rate', $rate );
            }
        }

        return rest_ensure_response( array(
            'success'             => true,
            'defaultPlatformFee'  => floatval( CTP_Database::get_setting( 'default_platform_fee', 10 ) ),
            'minimumDiscountRate' => floatval( CTP_Database::get_setting( 'minimum_discount_rate', 5 ) ),
            'maximumDiscountRate' => floatval( CTP_Database::get_setting( 'maximum_discount_rate', 25 ) ),
        ) );
    }

    // =====================
    // HELPERS
    // =====================

    private static function format_merchant( $m ) {
        return array(
            'id'              => (int) $m->id,
            'businessName'    => $m->business_name,
            'businessType'    => $m->business_type,
            'discountRate'    => floatval( $m->discount_rate ),
            'status'          => $m->status,
            'platformFeeRate' => $m->platform_fee_rate !== null ? floatval( $m->platform_fee_rate ) : null,
            'description'     => $m->description,
            'imageUrl'        => $m->image_url,
            'address'         => $m->address,
            'city'            => $m->city,
        );
    }
}
