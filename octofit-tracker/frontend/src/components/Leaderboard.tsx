import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch(() => setError('Unable to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return <section><h1>Leaderboard</h1>{loading ? <p role="status">Loading leaderboard...</p> : error ? <p role="alert">{error}</p> : leaderboard.length === 0 ? <p>No rankings or scores</p> : <ol className="list-group list-group-numbered">{leaderboard.map((entry) => <li className="list-group-item d-flex justify-content-between" key={entry.teamName}><span>{entry.teamName}</span><strong>{entry.totalPoints}</strong></li>)}</ol>}</section>;
}
