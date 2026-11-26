import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity data is required');

  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) {
    throw httpError(400, 'A valid userId is required');
  }
  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) {
    throw httpError(400, 'A valid teamId is required');
  }
  if (typeof type !== 'string' || type.trim().length === 0) {
    throw httpError(400, 'Activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw httpError(400, 'Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw httpError(400, 'User or team does not exist');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team data is required');

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) throw httpError(400, 'Team name is required');

  const mascot = typeof input.mascot === 'string' ? input.mascot.trim() : '';
  if (!mascot) throw httpError(400, 'Team mascot is required');

  let members: mongoose.Types.ObjectId[] = [];
  if (input.members !== undefined) {
    if (!Array.isArray(input.members)) throw httpError(400, 'Members must be an array');
    if (input.members.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id))) {
      throw httpError(400, 'Every member must have a valid ID');
    }
    members = input.members.map((id) => new mongoose.Types.ObjectId(id));
  }

  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const teams = await Team.find().lean();
  const activities = await Activity.find().lean();
  const totals = new Map<string, number>();

  for (const activity of activities) {
    const teamId = activity.team.toString();
    totals.set(teamId, (totals.get(teamId) ?? 0) + activity.points);
  }

  return teams
    .map((team) => ({ teamName: team.name, totalPoints: totals.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
    .filter((entry) => entry.totalPoints > 0);
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError(404, 'User not found');

  const workouts = await Workout.find().lean();
  if (workouts.length === 0) return [];

  const recent = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentTypes = new Set(recent.map((activity) => activity.type.toLowerCase()));

  const ranked = workouts.map((workout) => {
    const focus = workout.focus.toLowerCase();
    const goalMatches = focus === user.fitnessGoal.toLowerCase();
    const activityMatches = recentTypes.has(focus) || recentTypes.has(workout.title.toLowerCase());
    const rank = goalMatches ? 2 : activityMatches ? 1 : 0;
    const reason = goalMatches
      ? `Matches your ${user.fitnessGoal} fitness goal`
      : activityMatches
        ? `Matches your recent ${[...recentTypes].join(' or ')} activity`
        : `Complements your ${user.fitnessGoal} fitness goal`;
    return { workout, rank, reason };
  });

  return ranked
    .sort((left, right) => right.rank - left.rank)
    .map(({ workout, reason }) => ({ ...workout, reason }));
}

export { User };
