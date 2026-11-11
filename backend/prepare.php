<?php
foreach (['bootstrap/cache', 'storage/framework/cache/data', 'storage/framework/views', 'storage/logs'] as $path) {
 if (!is_dir(__DIR__.'/'.$path)) mkdir(__DIR__.'/'.$path, 0755, true);
}
