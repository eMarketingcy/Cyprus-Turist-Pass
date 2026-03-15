<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class CTP_Auth {

    /**
     * Generate a simple JWT token
     */
    public static function generate_token( $user_id, $email, $role ) {
        $header  = self::base64url_encode( json_encode( array( 'alg' => 'HS256', 'typ' => 'JWT' ) ) );
        $payload = self::base64url_encode( json_encode( array(
            'userId' => $user_id,
            'email'  => $email,
            'role'   => $role,
            'iat'    => time(),
            'exp'    => time() + ( 7 * DAY_IN_SECONDS ),
        ) ) );
        $signature = self::base64url_encode(
            hash_hmac( 'sha256', "$header.$payload", CTP_JWT_SECRET, true )
        );
        return "$header.$payload.$signature";
    }

    /**
     * Verify and decode a JWT token
     */
    public static function verify_token( $token ) {
        $parts = explode( '.', $token );
        if ( count( $parts ) !== 3 ) {
            return false;
        }

        list( $header, $payload, $signature ) = $parts;

        $expected_sig = self::base64url_encode(
            hash_hmac( 'sha256', "$header.$payload", CTP_JWT_SECRET, true )
        );

        if ( ! hash_equals( $expected_sig, $signature ) ) {
            return false;
        }

        $data = json_decode( self::base64url_decode( $payload ), true );

        if ( ! $data || ! isset( $data['exp'] ) || $data['exp'] < time() ) {
            return false;
        }

        return $data;
    }

    /**
     * Get authenticated user from request
     */
    public static function get_user_from_request( $request ) {
        $auth_header = $request->get_header( 'Authorization' );
        if ( ! $auth_header ) {
            return null;
        }

        if ( strpos( $auth_header, 'Bearer ' ) !== 0 ) {
            return null;
        }

        $token = substr( $auth_header, 7 );
        $decoded = self::verify_token( $token );

        if ( ! $decoded ) {
            return null;
        }

        return $decoded;
    }

    /**
     * Permission callback for protected routes
     */
    public static function is_authenticated( $request ) {
        return self::get_user_from_request( $request ) !== null;
    }

    /**
     * Hash a password
     */
    public static function hash_password( $password ) {
        return password_hash( $password, PASSWORD_BCRYPT );
    }

    /**
     * Verify a password
     */
    public static function verify_password( $password, $hash ) {
        return password_verify( $password, $hash );
    }

    private static function base64url_encode( $data ) {
        return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
    }

    private static function base64url_decode( $data ) {
        return base64_decode( strtr( $data, '-_', '+/' ) . str_repeat( '=', 3 - ( 3 + strlen( $data ) ) % 4 ) );
    }
}
