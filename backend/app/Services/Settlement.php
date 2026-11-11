<?php
namespace App\Services;
class Settlement
{
 public function calculate(array $players, array $costs): array
 {
  $court = (int) round($costs['minutes'] * $costs['courts'] * $costs['courtRateCents'] / 60);
  $total = $court + $costs['shuttleCostCents'] + array_sum(array_column($costs['extras'], 'cents'));
  $games = array_sum(array_column($players, 'games'));
  $allocations = [];
  foreach ($players as $index => $player) {
   $weighted = $total * $player['games'];
   $allocations[] = ['index' => $index, 'cents' => intdiv($weighted, $games), 'remainder' => $weighted % $games];
  }
  $remaining = $total - array_sum(array_column($allocations, 'cents'));
  $priority = $allocations;
  usort($priority, fn ($a, $b) => ($b['remainder'] <=> $a['remainder']) ?: ($a['index'] <=> $b['index']));
  foreach ($priority as $row) {
   if ($remaining <= 0) break;
   $allocations[$row['index']]['cents']++;
   $remaining--;
  }
  $rows = [];
  foreach ($players as $index => $p) $rows[] = ['id' => (int) $p['id'], 'name' => $p['name'], 'games' => (int) $p['games'], 'cents' => $allocations[$index]['cents']];
  return ['totalCents' => $total, 'courtCents' => $court, 'totalGames' => $games, 'rows' => $rows];
 }
}
