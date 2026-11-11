<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
class SecurityHeaders
{
 public function handle(Request $request, Closure $next): Response
 {
  if (strlen($request->getContent()) > 131072) {
   return response()->json(['message' => 'Request too large.'], 413)->withHeaders(['Cache-Control' => 'no-store', 'X-Content-Type-Options' => 'nosniff']);
  }
  $response = $next($request);
  $response->headers->set('Cache-Control', 'no-store');
  $response->headers->set('X-Content-Type-Options', 'nosniff');
  $response->headers->set('Referrer-Policy', 'no-referrer');
  $response->headers->set('X-Frame-Options', 'DENY');
  $response->headers->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  return $response;
 }
}
