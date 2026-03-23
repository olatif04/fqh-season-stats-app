import React, { forwardRef } from 'react';
import type { ExportTheme, Game, SeasonRow, Team } from '../types';
import { computeGameResult, formatDate, getTeamRows, safeNumber } from '../lib/utils';

type GameExportProps = {
  mode: 'game';
  game: Game;
  theme: ExportTheme;
  title: string;
  subtitle?: string;
};

type SeasonExportProps = {
  mode: 'season';
  rows: SeasonRow[];
  theme: ExportTheme;
  title: string;
  subtitle?: string;
};

type Props = GameExportProps | SeasonExportProps;

const teamBox = (team: Team, game: Game) => {
  const rows = getTeamRows(game, team);
  const score = team === 'Red' ? safeNumber(game.redScore) : safeNumber(game.blueScore);
  const result = computeGameResult(game, team);
  return { rows, score, result };
};

const ExportCard = forwardRef<HTMLDivElement, Props>(function ExportCard(props, ref) {
  const logoSrc = '/logo.png';

  return (
    <div
      ref={ref}
      style={{
        width: 1400,
        background: props.theme.bg,
        color: props.theme.text,
        padding: 40,
        borderRadius: 32,
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 24,
          marginBottom: 28,
          background: props.theme.card,
          borderRadius: 24,
          padding: 24,
          border: `2px solid ${props.theme.accent}`,
        }}
      >
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <img
            src={logoSrc}
            alt="FQH logo"
            style={{ width: 84, height: 84, objectFit: 'contain', borderRadius: 18, background: 'rgba(255,255,255,0.5)' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, opacity: 0.8 }}>FQH</div>
            <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.05 }}>{props.title}</div>
            {props.subtitle ? <div style={{ marginTop: 8, fontSize: 20, opacity: 0.85 }}>{props.subtitle}</div> : null}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: props.theme.accent }}>Generated from FQH Season Stats</div>
      </div>

      {props.mode === 'season' ? (
        <div
          style={{
            background: props.theme.card,
            borderRadius: 24,
            padding: 24,
            border: `1px solid ${props.theme.accent}`,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'Player GP', 'Goals', 'Assists', 'Points', 'PPG', 'Goalie W', 'Goalie L', 'Goalie GP'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '14px 12px',
                      fontSize: 18,
                      borderBottom: `2px solid ${props.theme.accent}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.rows.slice(0, 18).map((row) => (
                <tr key={row.name}>
                  <td style={{ padding: '14px 12px', fontSize: 18, fontWeight: 700 }}>{row.name}</td>
                  <td style={{ padding: '14px 12px', fontSize: 18 }}>{row.playerGames}</td>
                  <td style={{ padding: '14px 12px', fontSize: 18 }}>{row.goals}</td>
                  <td style={{ padding: '14px 12px', fontSize: 18 }}>{row.assists}</td>
                  <td style={{ padding: '14px 12px', fontSize: 18, fontWeight: 800 }}>{row.points}</td>
                  <td style={{ padding: '14px 12px', fontSize: 18 }}>{row.ppg}</td>
                  <td style={{ padding: '14px 12px', fontSize: 18 }}>{row.goalieWins}</td>
                  <td style={{ padding: '14px 12px', fontSize: 18 }}>{row.goalieLosses}</td>
                  <td style={{ padding: '14px 12px', fontSize: 18 }}>{row.goaliePlayed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {(['Red', 'Blue'] as Team[]).map((team) => {
            const info = teamBox(team, props.game);
            const players = info.rows.filter((row) => row.role === 'player');
            const goalies = info.rows.filter((row) => row.role === 'goalie');
            return (
              <div
                key={team}
                style={{
                  background: props.theme.card,
                  borderRadius: 24,
                  padding: 24,
                  border: `1px solid ${props.theme.accent}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div style={{ fontSize: 34, fontWeight: 900 }}>Team {team}</div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 900,
                      background: props.theme.accent,
                      color: '#111827',
                      padding: '8px 16px',
                      borderRadius: 999,
                    }}
                  >
                    {info.score}
                  </div>
                </div>

                <div style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, opacity: 0.75 }}>Players</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 22 }}>
                  <thead>
                    <tr>
                      {['Name', 'G', 'A', 'PTS'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', paddingBottom: 10, fontSize: 16, borderBottom: `1px solid ${props.theme.accent}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '10px 0', fontSize: 18, fontWeight: 700 }}>{row.name}</td>
                        <td style={{ padding: '10px 0', fontSize: 18 }}>{row.goals}</td>
                        <td style={{ padding: '10px 0', fontSize: 18 }}>{row.assists}</td>
                        <td style={{ padding: '10px 0', fontSize: 18, fontWeight: 800 }}>{row.goals + row.assists}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginBottom: 10, fontSize: 16, fontWeight: 700, opacity: 0.75 }}>Goalie</div>
                {goalies.length === 0 ? (
                  <div style={{ fontSize: 18 }}>No goalie entered</div>
                ) : goalies.map((row) => (
                  <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 20, fontWeight: 800, padding: '10px 0' }}>
                    <div>{row.name}</div>
                    <div>{computeGameResult(props.game, row.team)} · {row.assists} A · {row.assists} PTS</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default ExportCard;
