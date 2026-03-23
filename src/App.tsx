import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  Calendar,
  ChevronLeft,
  Download,
  Edit3,
  Eye,
  ImageDown,
  Plus,
  Save,
  Shield,
  Trash2,
  Trophy,
  Upload,
  User,
} from 'lucide-react';
import ExportCard from './components/ExportCard';
import type { ExportTheme, Game, PlayerStat, Team } from './types';
import {
  computeGameResult,
  computeSeasonStats,
  emptyPlayerStat,
  EXPORT_THEME_KEY,
  formatDate,
  getTeamRows,
  slugify,
  STORAGE_KEY,
  uid,
} from './lib/utils';

const defaultTheme: ExportTheme = {
  bg: '#f8ede3',
  card: '#fffaf5',
  text: '#1f2937',
  accent: '#f59e0b',
};

type View = 'dashboard' | 'form' | 'game-detail';

const blankForm = () => ({
  id: undefined as string | undefined,
  date: '',
  notes: '',
  redScore: 0,
  blueScore: 0,
  playerStats: [
    emptyPlayerStat('Red', 'player'),
    emptyPlayerStat('Blue', 'player'),
    emptyPlayerStat('Red', 'goalie'),
    emptyPlayerStat('Blue', 'goalie'),
  ],
});

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm());
  const [theme, setTheme] = useState<ExportTheme>(defaultTheme);
  const [seasonExportOpen, setSeasonExportOpen] = useState(false);
  const seasonExportRef = useRef<HTMLDivElement>(null);
  const gameExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.games)) setGames(parsed.games);
      }
      const themeRaw = localStorage.getItem(EXPORT_THEME_KEY);
      if (themeRaw) setTheme({ ...defaultTheme, ...JSON.parse(themeRaw) });
    } catch (error) {
      console.error('Failed to load saved data', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ games }));
  }, [games]);

  useEffect(() => {
    localStorage.setItem(EXPORT_THEME_KEY, JSON.stringify(theme));
  }, [theme]);

  const seasonStats = useMemo(() => computeSeasonStats(games), [games]);
  const selectedGame = useMemo(() => games.find((g) => g.id === selectedGameId) ?? null, [games, selectedGameId]);

  function updateRow(id: string, patch: Partial<PlayerStat>) {
    setForm((prev) => ({
      ...prev,
      playerStats: prev.playerStats.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  }

  function addRow(team: Team, role: PlayerStat['role']) {
    setForm((prev) => ({
      ...prev,
      playerStats: [...prev.playerStats, emptyPlayerStat(team, role)],
    }));
  }

  function deleteRow(id: string) {
    setForm((prev) => ({
      ...prev,
      playerStats: prev.playerStats.filter((row) => row.id !== id),
    }));
  }

  function resetForm() {
    setForm(blankForm());
  }

  function beginAdd() {
    resetForm();
    setView('form');
  }

  function beginEdit(game: Game) {
    setForm({
      id: game.id,
      date: game.date,
      notes: game.notes,
      redScore: game.redScore,
      blueScore: game.blueScore,
      playerStats: game.playerStats.map((row) => ({ ...row })),
    });
    setView('form');
  }

  function saveGame() {
    const cleanRows = form.playerStats
      .map((row) => ({
        ...row,
        name: row.name.trim(),
        goals: Number(row.goals) || 0,
        assists: Number(row.assists) || 0,
      }))
      .filter((row) => row.name);

    const payload: Game = {
      id: form.id ?? uid(),
      date: form.date,
      notes: form.notes.trim(),
      redScore: Number(form.redScore) || 0,
      blueScore: Number(form.blueScore) || 0,
      playerStats: cleanRows,
      createdAt: form.id ? games.find((g) => g.id === form.id)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setGames((prev) => {
      const next = form.id ? prev.map((g) => (g.id === form.id ? payload : g)) : [payload, ...prev];
      return [...next].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    });

    setSelectedGameId(payload.id);
    setView('game-detail');
    resetForm();
  }

  function removeGame(id: string) {
    setGames((prev) => prev.filter((g) => g.id !== id));
    if (selectedGameId === id) {
      setSelectedGameId(null);
      setView('dashboard');
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ games }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fqh-season-data.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!Array.isArray(parsed.games)) {
          alert('That file is missing a valid games array.');
          return;
        }
        setGames(parsed.games);
        setView('dashboard');
      } catch {
        alert('Could not read that JSON file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  async function exportNodeAsPng(node: HTMLElement | null, filename: string) {
    if (!node) return;
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
    });
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  const topScorer = seasonStats[0];

  return (
    <div className="app-shell">
      <div className="container">
        <header className="hero">
          <div className="hero-copy">
            <div className="eyebrow">FQH</div>
            <h1>Season Stats Manager</h1>
            <p>
              Add games, edit them later, track season totals, and export a clean PNG for either a single game or the full stats table.
            </p>
          </div>
          <div className="hero-actions">
            <button className="primary" onClick={beginAdd}><Plus size={16} /> Add Game</button>
            <button className="secondary" onClick={exportJson}><Download size={16} /> Export JSON</button>
            <label className="secondary upload-button">
              <Upload size={16} /> Import JSON
              <input type="file" accept="application/json" hidden onChange={importJson} />
            </label>
          </div>
        </header>

        <section className="stats-grid">
          <StatBox label="Games" value={String(games.length)} />
          <StatBox label="People Tracked" value={String(seasonStats.length)} />
          <StatBox label="Top Scorer" value={topScorer?.name ?? '—'} />
          <StatBox label="Top Points" value={String(topScorer?.points ?? 0)} />
        </section>

        <section className="theme-panel">
          <div>
            <h3>PNG export styling</h3>
            <p>Name your logo file <strong>logo.png</strong> and put it in <strong>public/logo.png</strong>.</p>
          </div>
          <div className="theme-controls">
            <ColorInput label="Background" value={theme.bg} onChange={(bg) => setTheme((prev) => ({ ...prev, bg }))} />
            <ColorInput label="Card" value={theme.card} onChange={(card) => setTheme((prev) => ({ ...prev, card }))} />
            <ColorInput label="Text" value={theme.text} onChange={(text) => setTheme((prev) => ({ ...prev, text }))} />
            <ColorInput label="Accent" value={theme.accent} onChange={(accent) => setTheme((prev) => ({ ...prev, accent }))} />
          </div>
        </section>

        {view === 'form' ? (
          <GameForm
            form={form}
            setForm={setForm}
            updateRow={updateRow}
            addRow={addRow}
            deleteRow={deleteRow}
            onBack={() => setView('dashboard')}
            onSave={saveGame}
          />
        ) : view === 'game-detail' && selectedGame ? (
          <div className="detail-wrap">
            <div className="detail-toolbar">
              <button className="secondary" onClick={() => setView('dashboard')}><ChevronLeft size={16} /> Back</button>
              <div className="toolbar-actions">
                <button className="secondary" onClick={() => beginEdit(selectedGame)}><Edit3 size={16} /> Edit Game</button>
                <button className="secondary" onClick={() => exportNodeAsPng(gameExportRef.current, `${slugify(selectedGame.date || selectedGame.id)}-game-card.png`)}><ImageDown size={16} /> Export Game PNG</button>
              </div>
            </div>
            <GameDetail game={selectedGame} />
            <div className="export-preview-hidden">
              <ExportCard
                ref={gameExportRef}
                mode="game"
                game={selectedGame}
                theme={theme}
                title={`Game Recap · ${formatDate(selectedGame.date)}`}
                subtitle={selectedGame.notes || `Team Red ${selectedGame.redScore} - ${selectedGame.blueScore} Team Blue`}
              />
            </div>
          </div>
        ) : (
          <div className="dashboard-grid">
            <section className="season-card">
              <div className="section-header">
                <div>
                  <h2><Trophy size={20} /> Season Stats</h2>
                  <p>Assists count for everyone, including goalies. Points are one combined total.</p>
                </div>
                <button className="secondary" onClick={() => { setSeasonExportOpen(true); setTimeout(() => exportNodeAsPng(seasonExportRef.current, 'season-stats.png'), 50); }}>
                  <ImageDown size={16} /> Export Season PNG
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Player GP</th>
                      <th>Goals</th>
                      <th>Assists</th>
                      <th>Points</th>
                      <th>PPG</th>
                      <th>Goalie W</th>
                      <th>Goalie L</th>
                      <th>Goalie GP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasonStats.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="empty-cell">No games yet. Add your first one.</td>
                      </tr>
                    ) : seasonStats.map((row) => (
                      <tr key={row.name}>
                        <td className="name-cell">{row.name}</td>
                        <td>{row.playerGames}</td>
                        <td>{row.goals}</td>
                        <td>{row.assists}</td>
                        <td>{row.points}</td>
                        <td>{row.ppg}</td>
                        <td>{row.goalieWins}</td>
                        <td>{row.goalieLosses}</td>
                        <td>{row.goaliePlayed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="archive-card">
              <div className="section-header">
                <div>
                  <h2><Calendar size={20} /> Game Archive</h2>
                  <p>Open or edit any saved game.</p>
                </div>
              </div>
              <div className="archive-list">
                {games.length === 0 ? (
                  <div className="empty-state">No games saved yet.</div>
                ) : games.map((game) => (
                  <article key={game.id} className="archive-item">
                    <div>
                      <div className="archive-date">{formatDate(game.date)}</div>
                      <div className="archive-score">Team Red {game.redScore} - {game.blueScore} Team Blue</div>
                      <div className="archive-notes">{game.notes || 'No notes'}</div>
                    </div>
                    <div className="archive-actions">
                      <button className="secondary small" onClick={() => { setSelectedGameId(game.id); setView('game-detail'); }}><Eye size={14} /> View</button>
                      <button className="secondary small" onClick={() => beginEdit(game)}><Edit3 size={14} /> Edit</button>
                      <button className="secondary small danger" onClick={() => removeGame(game.id)}><Trash2 size={14} /> Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        )}

        {seasonExportOpen ? (
          <div className="export-preview-hidden">
            <ExportCard
              ref={seasonExportRef}
              mode="season"
              rows={seasonStats}
              theme={theme}
              title="Season Stats"
              subtitle={`Games tracked: ${games.length}`}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="color-control">
      <span>{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function GameForm({
  form,
  setForm,
  updateRow,
  addRow,
  deleteRow,
  onBack,
  onSave,
}: {
  form: ReturnType<typeof blankForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof blankForm>>>;
  updateRow: (id: string, patch: Partial<PlayerStat>) => void;
  addRow: (team: Team, role: PlayerStat['role']) => void;
  deleteRow: (id: string) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  return (
    <div className="form-wrap">
      <div className="section-header">
        <div>
          <h2>{form.id ? 'Edit Game' : 'Add Game'}</h2>
          <p>Goalie assists count toward total assists and total points.</p>
        </div>
        <button className="secondary" onClick={onBack}><ChevronLeft size={16} /> Back</button>
      </div>

      <div className="form-card meta-grid">
        <label>
          <span>Date</span>
          <input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
        </label>
        <label>
          <span>Red Score</span>
          <input type="number" value={form.redScore} onChange={(e) => setForm((prev) => ({ ...prev, redScore: Number(e.target.value) }))} />
        </label>
        <label>
          <span>Blue Score</span>
          <input type="number" value={form.blueScore} onChange={(e) => setForm((prev) => ({ ...prev, blueScore: Number(e.target.value) }))} />
        </label>
        <label className="full-width">
          <span>Notes</span>
          <textarea rows={3} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
        </label>
      </div>

      <div className="team-panels">
        {(['Red', 'Blue'] as Team[]).map((team) => (
          <section className="form-card" key={team}>
            <div className="section-header compact">
              <div>
                <h3>Team {team}</h3>
              </div>
              <div className="button-row">
                <button className="secondary small" onClick={() => addRow(team, 'player')}><User size={14} /> Add Player</button>
                <button className="secondary small" onClick={() => addRow(team, 'goalie')}><Shield size={14} /> Add Goalie</button>
              </div>
            </div>

            <div className="entry-list">
              {form.playerStats.filter((row) => row.team === team).map((row) => (
                <div className="entry-row" key={row.id}>
                  <label>
                    <span>Name</span>
                    <input value={row.name} onChange={(e) => updateRow(row.id, { name: e.target.value })} />
                  </label>
                  <label>
                    <span>Role</span>
                    <select value={row.role} onChange={(e) => updateRow(row.id, { role: e.target.value as PlayerStat['role'] })}>
                      <option value="player">Player</option>
                      <option value="goalie">Goalie</option>
                    </select>
                  </label>
                  <label>
                    <span>Goals</span>
                    <input type="number" value={row.goals} onChange={(e) => updateRow(row.id, { goals: Number(e.target.value) })} disabled={row.role === 'goalie'} />
                  </label>
                  <label>
                    <span>Assists</span>
                    <input type="number" value={row.assists} onChange={(e) => updateRow(row.id, { assists: Number(e.target.value) })} />
                  </label>
                  <button className="secondary small danger align-end" onClick={() => deleteRow(row.id)}><Trash2 size={14} /> Remove</button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="button-row end">
        <button className="primary" onClick={onSave}><Save size={16} /> {form.id ? 'Save Changes' : 'Save Game'}</button>
      </div>
    </div>
  );
}

function GameDetail({ game }: { game: Game }) {
  const redRows = getTeamRows(game, 'Red');
  const blueRows = getTeamRows(game, 'Blue');
  const redGoalies = redRows.filter((r) => r.role === 'goalie');
  const blueGoalies = blueRows.filter((r) => r.role === 'goalie');

  return (
    <div className="detail-card">
      <div className="game-banner">
        <div>
          <div className="eyebrow">Game Detail</div>
          <h2>Team Red {game.redScore} - {game.blueScore} Team Blue</h2>
          <p>{formatDate(game.date)}{game.notes ? ` · ${game.notes}` : ''}</p>
        </div>
      </div>

      <div className="team-detail-grid">
        <TeamDetail team="Red" score={game.redScore} result={computeGameResult(game, 'Red')} rows={redRows} goalies={redGoalies} />
        <TeamDetail team="Blue" score={game.blueScore} result={computeGameResult(game, 'Blue')} rows={blueRows} goalies={blueGoalies} />
      </div>
    </div>
  );
}

function TeamDetail({ team, score, result, rows, goalies }: { team: Team; score: number; result: string; rows: PlayerStat[]; goalies: PlayerStat[] }) {
  const players = rows.filter((r) => r.role === 'player');
  return (
    <section className="team-detail-card">
      <div className="team-detail-header">
        <h3>Team {team}</h3>
        <div className="pill">{score}</div>
      </div>
      <div className="subhead">Players</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>G</th>
              <th>A</th>
              <th>PTS</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr><td colSpan={4} className="empty-cell">No players entered.</td></tr>
            ) : players.map((row) => (
              <tr key={row.id}>
                <td className="name-cell">{row.name}</td>
                <td>{row.goals}</td>
                <td>{row.assists}</td>
                <td>{row.goals + row.assists}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="subhead">Goalies</div>
      <div className="goalie-list">
        {goalies.length === 0 ? (
          <div className="empty-state">No goalies entered.</div>
        ) : goalies.map((row) => (
          <div className="goalie-chip" key={row.id}>
            <strong>{row.name}</strong>
            <span>{result}</span>
            <span>{row.assists} A</span>
            <span>{row.assists} PTS</span>
          </div>
        ))}
      </div>
    </section>
  );
}
