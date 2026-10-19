<?php

declare(strict_types=1);

define('ABSPATH', __DIR__);

$cookie4Options = array();
$cookie4Locale = 'en_US';

function add_action(...$args): void {}
function add_shortcode(...$args): void {}

function get_option($key, $default = false)
{
    global $cookie4Options;
    return array_key_exists($key, $cookie4Options) ? $cookie4Options[$key] : $default;
}

function get_locale(): string
{
    global $cookie4Locale;
    return $cookie4Locale;
}

require_once __DIR__ . '/../plugin/includes/settings.php';
require_once __DIR__ . '/../plugin/includes/frontend.php';

$languageOptions = cookie4_get_fields()['cookie4_lang']['options'];
foreach (array('nl', 'da', 'no', 'sv') as $language) {
    if (!array_key_exists($language, $languageOptions)) {
        fwrite(STDERR, "Missing WordPress language option: {$language}\n");
        exit(1);
    }
}

$automaticLocales = array(
    'nl_NL' => 'nl',
    'da_DK' => 'da',
    'nb_NO' => 'no',
    'nn_NO' => 'no',
    'no_NO' => 'no',
    'sv_SE' => 'sv',
);

foreach ($automaticLocales as $locale => $expectedLanguage) {
    $cookie4Options = array('cookie4_lang' => 'auto');
    $cookie4Locale = $locale;
    $actualLanguage = cookie4_resolve_lang();
    if ($expectedLanguage !== $actualLanguage) {
        fwrite(STDERR, "Expected {$locale} to resolve to {$expectedLanguage}; got {$actualLanguage}.\n");
        exit(1);
    }
}

foreach (array('nl', 'da', 'no', 'sv') as $language) {
    $cookie4Options = array('cookie4_lang' => $language);
    if ($language !== cookie4_resolve_lang()) {
        fwrite(STDERR, "Explicit language selection failed: {$language}\n");
        exit(1);
    }
}

echo "Cookie Banner WordPress locale mapping: OK\n";
