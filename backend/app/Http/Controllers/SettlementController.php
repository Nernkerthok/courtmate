<?php
namespace App\Http\Controllers;
use App\Services\Settlement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
class SettlementController
{
 public function __invoke(Request $request, Settlement $settlement): JsonResponse
 {
  $data = $request->validate([
   'players' => ['required', 'array', 'min:1', 'max:40'],
   'players.*' => ['required', 'array:id,name,games'],
   'players.*.id' => ['required', 'integer', 'min:1', 'max:1000000000', 'distinct'],
   'players.*.name' => ['required', 'string', 'max:40'],
   'players.*.games' => ['required', 'integer', 'min:0', 'max:10000'],
   'costs' => ['required', 'array:minutes,courts,courtRateCents,shuttleCostCents,extras'],
   'costs.minutes' => ['required', 'integer', 'min:0', 'max:1440'],
   'costs.courts' => ['required', 'integer', 'min:1', 'max:20'],
   'costs.courtRateCents' => ['required', 'integer', 'min:0', 'max:100000000'],
   'costs.shuttleCostCents' => ['required', 'integer', 'min:0', 'max:100000000'],
   'costs.extras' => ['present', 'array', 'max:20'],
   'costs.extras.*' => ['required', 'array:name,cents'],
   'costs.extras.*.name' => ['required', 'string', 'max:60'],
   'costs.extras.*.cents' => ['required', 'integer', 'min:0', 'max:100000000'],
  ]);
  if (array_sum(array_column($data['players'], 'games')) === 0) {
   throw ValidationException::withMessages(['players' => 'At least one completed game is required.']);
  }
  return response()->json($settlement->calculate($data['players'], $data['costs']));
 }
}
