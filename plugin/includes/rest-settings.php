<?php
/**
 * REST API for banner settings — consumed by Preact admin app.
 *
 * @package Cookie_Banner_WP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'rest_api_init', 'cookie4_register_settings_routes' );

function cookie4_register_settings_routes(): void {
	$ns = 'cookie4/v1';

	register_rest_route( $ns, '/settings', [
		[
			'methods'             => 'GET',
			'callback'            => 'cookie4_rest_get_settings',
			'permission_callback' => fn() => current_user_can( 'manage_options' ),
		],
		[
			'methods'             => 'PUT',
			'callback'            => 'cookie4_rest_put_settings',
			'permission_callback' => fn() => current_user_can( 'manage_options' ),
		],
	] );
}

function cookie4_rest_get_settings(): WP_REST_Response {
	$fields = cookie4_get_fields();
	$values = [];

	foreach ( $fields as $key => $field ) {
		$raw = get_option( $key, $field['default'] );
		// Strip prefix for cleaner JSON keys: cookie4_primary_color → primary_color.
		$short = preg_replace( '/^cookie4_/', '', $key );
		$values[ $short ] = $raw;
	}

	// Add custom_texts (not a standard field).
	$values['custom_texts'] = get_option( 'cookie4_custom_texts', '' );

	return new WP_REST_Response( [
		'settings' => $values,
		'fields'   => array_map( function ( $key, $field ) {
			$short = preg_replace( '/^cookie4_/', '', $key );
			return [
				'key'         => $short,
				'label'       => $field['label'],
				'type'        => $field['type'],
				'default'     => $field['default'],
				'options'     => $field['options'] ?? null,
				'description' => $field['description'] ?? null,
			];
		}, array_keys( $fields ), array_values( $fields ) ),
	] );
}

function cookie4_rest_put_settings( WP_REST_Request $request ): WP_REST_Response {
	$fields  = cookie4_get_fields();
	$payload = $request->get_json_params();
	$updated = [];

	foreach ( $fields as $key => $field ) {
		$short = preg_replace( '/^cookie4_/', '', $key );

		if ( ! array_key_exists( $short, $payload ) ) {
			continue;
		}

		$value = $payload[ $short ];

		// Sanitize based on field type.
		switch ( $field['type'] ) {
			case 'color':
				$value = sanitize_hex_color( $value ) ?: $field['default'];
				break;
			case 'url':
				$value = esc_url_raw( $value );
				break;
			case 'checkbox':
				$value = ( $value === '1' || $value === true || $value === 'true' ) ? '1' : '';
				break;
			case 'select':
				if ( isset( $field['options'] ) && ! array_key_exists( $value, $field['options'] ) ) {
					$value = $field['default'];
				}
				break;
			default:
				$value = sanitize_text_field( $value );
		}

		update_option( $key, $value );
		$updated[ $short ] = $value;
	}

	// Handle custom_texts separately (JSON blob).
	if ( array_key_exists( 'custom_texts', $payload ) ) {
		$raw = $payload['custom_texts'];
		if ( is_string( $raw ) ) {
			$decoded = json_decode( $raw, true );
			if ( is_array( $decoded ) ) {
				$sanitized = array_map( 'sanitize_text_field', $decoded );
				update_option( 'cookie4_custom_texts', wp_json_encode( $sanitized ) );
				$updated['custom_texts'] = wp_json_encode( $sanitized );
			}
		}
	}

	return new WP_REST_Response( [ 'updated' => $updated ] );
}
