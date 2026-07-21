// controllers/sessionsController.js
const pool = require('../db/pool');

// ── Helper: calculate derived fields ─────────────────────────
function calcMetrics(distance_km, duration_minutes) {
  const hours = duration_minutes / 60;
  const avg_speed = hours > 0 ? +(distance_km / hours).toFixed(2) : 0;
  const avg_pace = distance_km > 0 ? +(duration_minutes / distance_km).toFixed(2) : 0;
  return { avg_speed, avg_pace };
}

// ── POST /api/sessions ───────────────────────────────────────
async function createSession(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      title, start_point, end_point,
      distance_km, duration_minutes,
      altitude, temperature, training_date, notes,
      splits = []
    } = req.body;

    const { avg_speed, avg_pace } = calcMetrics(distance_km, duration_minutes);

    const sessionResult = await client.query(
      `INSERT INTO training_sessions
        (user_id, title, start_point, end_point, distance_km, duration_minutes,
         avg_speed, avg_pace, altitude, temperature, training_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [req.user.id, title, start_point, end_point,
       distance_km, duration_minutes, avg_speed, avg_pace,
       altitude, temperature, training_date, notes]
    );

    const session = sessionResult.rows[0];

    // Insert km splits
    for (const split of splits) {
      const splitSpeed = split.split_time > 0
        ? +((3600 / split.split_time)).toFixed(2)
        : 0;
      await client.query(
        `INSERT INTO kilometer_splits (session_id, kilometer_number, split_time, split_speed)
         VALUES ($1,$2,$3,$4)`,
        [session.id, split.kilometer_number, split.split_time, splitSpeed]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(session);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Failed to create session.' });
  } finally {
    client.release();
  }
}

// ── GET /api/sessions ────────────────────────────────────────
async function getSessions(req, res) {
  try {
    const { page = 1, limit = 10, from, to } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM training_sessions WHERE user_id = $1`;
    const params = [req.user.id];
    let idx = 2;

    if (from) { query += ` AND training_date >= $${idx++}`; params.push(from); }
    if (to)   { query += ` AND training_date <= $${idx++}`; params.push(to); }

    query += ` ORDER BY training_date DESC LIMIT $${idx++} OFFSET $${idx}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countRes = await pool.query(
      'SELECT COUNT(*) FROM training_sessions WHERE user_id=$1', [req.user.id]
    );

    res.json({
      sessions: result.rows,
      total: parseInt(countRes.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countRes.rows[0].count / limit)
    });
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
}

// ── GET /api/sessions/:id ────────────────────────────────────
async function getSession(req, res) {
  try {
    const sessionRes = await pool.query(
      'SELECT * FROM training_sessions WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (sessionRes.rows.length === 0) return res.status(404).json({ error: 'Session not found.' });

    const splitsRes = await pool.query(
      'SELECT * FROM kilometer_splits WHERE session_id=$1 ORDER BY kilometer_number',
      [req.params.id]
    );

    res.json({ ...sessionRes.rows[0], splits: splitsRes.rows });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Failed to fetch session.' });
  }
}

// ── PUT /api/sessions/:id ────────────────────────────────────
async function updateSession(req, res) {
  try {
    const {
      title, start_point, end_point, distance_km,
      duration_minutes, altitude, temperature, training_date, notes
    } = req.body;

    const { avg_speed, avg_pace } = calcMetrics(distance_km, duration_minutes);

    const result = await pool.query(
      `UPDATE training_sessions SET
        title=$1, start_point=$2, end_point=$3, distance_km=$4,
        duration_minutes=$5, avg_speed=$6, avg_pace=$7,
        altitude=$8, temperature=$9, training_date=$10, notes=$11
       WHERE id=$12 AND user_id=$13
       RETURNING *`,
      [title, start_point, end_point, distance_km, duration_minutes,
       avg_speed, avg_pace, altitude, temperature, training_date, notes,
       req.params.id, req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update session error:', err);
    res.status(500).json({ error: 'Failed to update session.' });
  }
}

// ── DELETE /api/sessions/:id ─────────────────────────────────
async function deleteSession(req, res) {
  try {
    const result = await pool.query(
      'DELETE FROM training_sessions WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found.' });
    res.json({ message: 'Session deleted successfully.' });
  } catch (err) {
    console.error('Delete session error:', err);
    res.status(500).json({ error: 'Failed to delete session.' });
  }
}

module.exports = { 
  createSession, 
  getSessions, 
  getSession, 
  updateSession, 
  deleteSession 
};