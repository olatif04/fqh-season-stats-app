export type Team = 'Red' | 'Blue';
export type Role = 'player' | 'goalie';

export type PlayerStat = {
  id: string;
  name: string;
  team: Team;
  role: Role;
  goals: number;
  assists: number;
};

export type Game = {
  id: string;
  date: string;
  notes: string;
  redScore: number;
  blueScore: number;
  playerStats: PlayerStat[];
  createdAt: string;
  updatedAt?: string;
};

export type SeasonRow = {
  name: string;
  playerGames: number;
  goals: number;
  assists: number;
  points: number;
  ppg: string;
  goalieWins: number;
  goalieLosses: number;
  goaliePlayed: number;
};

export type ExportTheme = {
  bg: string;
  card: string;
  text: string;
  accent: string;
};
