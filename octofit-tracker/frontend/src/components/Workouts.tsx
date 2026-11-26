import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { title: string; reason: string; focus?: string; minutes?: number };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch(() => setError('Unable to load workout suggestions'))
      .finally(() => setLoading(false));
  }, []);

  return <section><h1>Workout suggestions</h1>{loading ? <p role="status">Loading workout suggestions...</p> : error ? <p role="alert">{error}</p> : suggestions.length === 0 ? <p>No workout suggestions</p> : <ul className="list-group">{suggestions.map((workout) => <li className="list-group-item" key={workout.title}><strong>{workout.title}</strong><p className="mb-0">{workout.reason}</p></li>)}</ul>}</section>;
}
