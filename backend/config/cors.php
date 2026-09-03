<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Yerel geliştirmede tüm origin'lere açık ('*'); production'da CORS_ALLOWED_ORIGINS
    // env değişkeniyle frontend origin'ine (örn. GitHub Pages URL'i) daraltın.
    // Birden çok origin virgülle ayrılabilir.
    // Production'da CORS_ALLOWED_ORIGINS unutulursa '*' + supports_credentials=true gibi
    // riskli bir varsayılana düşmek yerine, hiçbir origin'e izin verilmez (kapalı-varsayılan).
    'allowed_origins' => array_values(array_filter(
        explode(',', env('CORS_ALLOWED_ORIGINS', env('APP_ENV') === 'production' ? '' : '*'))
    )),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
