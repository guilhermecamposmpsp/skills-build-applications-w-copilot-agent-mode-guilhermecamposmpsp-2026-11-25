import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch(() => setError('Unable to load teams'))
      .finally(() => setLoading(false));
  }, []);

  return <section><h1>Teams</h1>{loading ? <p role="status">Loading teams...</p> : error ? <p role="alert">{error}</p> : teams.length === 0 ? <p>No teams</p> : <ul className="list-group">{teams.map((team) => <li className="list-group-item" key={team.name}>{team.name}{team.mascot ? ` - ${team.mascot}` : ''}</li>)}</ul>}</section>;
}
