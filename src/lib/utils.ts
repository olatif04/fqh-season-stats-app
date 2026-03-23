import type { Game, PlayerStat, SeasonRow, Team } from '../types';

export const STORAGE_KEY = 'fqh-season-stats-v2';
export const EXPORT_THEME_KEY = 'fqh-export-theme-v1';

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function safeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatDate(value: string) {
  if (!value) return 'No date';
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function emptyPlayerStat(team: Team = 'Red', role: PlayerStat['role'] = 'player'): PlayerStat {
  return {
    id: uid(),
    name: '',
    team,
    role,
    goals: 0,
    assists: 0,
  };
}

export function computeGameResult(game: Game, team: Team) {
  if (game.redScore === game.blueScore) return 'T';
  if (team === 'Red') return game.redScore > game.blueScore ? 'W' : 'L';
  return game.blueScore > game.redScore ? 'W' : 'L';
}

export function computeSeasonStats(games: Game[]): SeasonRow[] {
  const byName = new Map<string, Omit<SeasonRow, 'ppg'> & { ppg: string }>();

  for (const game of games) {
    for (const row of game.playerStats || []) {
      const name = row.name.trim();
      if (!name) continue;

      if (!byName.has(name)) {
        byName.set(name, {
          name,
          playerGames: 0,
          goals: 0,
          assists: 0,
          points: 0,
          ppg: '0.00',
          goalieWins: 0,
          goalieLosses: 0,
          goaliePlayed: 0,
        });
      }

      const current = byName.get(name)!;
      const goals = safeNumber(row.goals);
      const assists = safeNumber(row.assists);

      current.assists += assists;
      current.points += goals + assists;

      if (row.role === 'goalie') {
        current.goaliePlayed += 1;
        const result = computeGameResult(game, row.team);
        if (result === 'W') current.goalieWins += 1;
        if (result === 'L') current.goalieLosses += 1;
      } else {
        current.playerGames += 1;
        current.goals += goals;
      }
    }
  }

  return Array.from(byName.values())
    .map((row) => ({
      ...row,
      ppg: row.playerGames > 0 ? (row.points / row.playerGames).toFixed(2) : '0.00',
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.goalieWins !== a.goalieWins) return b.goalieWins - a.goalieWins;
      return a.name.localeCompare(b.name);
    });
}

export function getTeamRows(game: Game, team: Team) {
  return game.playerStats.filter((row) => row.team === team);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'export';
}
