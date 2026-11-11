<?php
require __DIR__.'/../vendor/autoload.php';
putenv('CACHE_STORE=array');
putenv('APP_ENV=testing');
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$assert = function (bool $condition, string $label): void { if (!$condition) throw new RuntimeException($label); echo "PASS: $label\n"; };
$request = function (array $payload, string $ip = '127.0.0.1', string $method = 'POST') use ($kernel) {
 $req = Illuminate\Http\Request::create('/api/settlements', $method, [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json', 'REMOTE_ADDR' => $ip], json_encode($payload));
 $response = $kernel->handle($req); $kernel->terminate($req, $response); return $response;
};
$fixtures = json_decode(file_get_contents(__DIR__.'/../../tests/billing-cases.json'), true);
foreach ($fixtures as $f) {
 $players = array_map(fn ($i, $g) => ['id' => $i+1, 'name' => 'คน'.($i+1), 'games' => $g], array_keys($f['games']), $f['games']);
 $payload = ['players' => $players, 'costs' => $f['costs']];
 $r = $request($payload); $body = json_decode($r->getContent(), true);
 $assert($r->getStatusCode() === 200, $f['name'].' HTTP 200');
 $assert(array_column($body['rows'], 'cents') === $f['expected'] && $body['totalCents'] === $f['total'], $f['name'].' exact allocation');
 $assert(str_contains($r->headers->get('Cache-Control'), 'no-store'), 'responses not cached');
}
$valid = $payload;
$bad = $valid; $bad['players'][0]['games'] = -1; $assert($request($bad)->getStatusCode() === 422, 'negative games rejected');
$bad = $valid; $bad['players'][1]['id'] = $bad['players'][0]['id']; $assert($request($bad)->getStatusCode() === 422, 'duplicate IDs rejected');
$bad = $valid; foreach ($bad['players'] as &$p) $p['games'] = 0; unset($p); $assert($request($bad)->getStatusCode() === 422, 'zero played games rejected');
$bad = $valid; $bad['costs']['shuttleCostCents'] = -1; $assert($request($bad)->getStatusCode() === 422, 'negative expense rejected');
$bad = $valid; $bad['players'][0]['name'] = str_repeat('x', 41); $assert($request($bad)->getStatusCode() === 422, 'oversized names rejected');
$bad = $valid; $bad['players'][0]['unexpected'] = true; $assert($request($bad)->getStatusCode() === 422, 'unexpected player fields rejected');
$assert($request(['payload' => str_repeat('x', 140000)])->getStatusCode() === 413, 'oversized requests rejected');
$assert($request([], '127.0.0.2', 'GET')->getStatusCode() === 405, 'GET cannot calculate');
$last = null; for ($i=0; $i<31; $i++) $last = $request($valid, '127.0.0.9');
$assert($last->getStatusCode() === 429, 'request rate limited');
echo "All API checks passed. No database used.\n";
