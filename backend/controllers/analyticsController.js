// controllers/analyticsController.js
const pool = require('../db/pool');

// ── GET /api/analytics/summary ───────────────────────────────
async function getSummary(req, res) {
  try {
    const uid = req.user.id;

    const summary = await pool.query(`
      SELECT
        COUNT(*)::int                        AS total_sessions,
        COALESCE(SUM(distance_km),0)::float  AS total_distance,
        COALESCE(AVG(avg_speed),0)::float    AS avg_speed,
        COALESCE(MIN(avg_pace),0)::float     AS best_pace,
        COALESCE(MAX(distance_km),0)::float  AS longest_run,
        COALESCE(MAX(avg_speed),0)::float    AS fastest_speed
      FROM training_sessions WHERE user_id=$1
    `, [uid]);

    // Weekly totals (last 7 days)
    const weekly = await pool.query(`
      SELECT
        COALESCE(SUM(distance_km),0)::float AS weekly_distance,
        COUNT(*)::int                       AS weekly_sessions
      FROM training_sessions
      WHERE user_id=$1 AND training_date >= NOW() - INTERVAL '7 days'
    `, [uid]);

    // Monthly totals
    const monthly = await pool.query(`
      SELECT
        COALESCE(SUM(distance_km),0)::float AS monthly_distance,
        COUNT(*)::int                       AS monthly_sessions
      FROM training_sessions
      WHERE user_id=$1
        AND EXTRACT(MONTH FROM training_date) = EXTRACT(MONTH FROM NOW())
        AND EXTRACT(YEAR  FROM training_date) = EXTRACT(YEAR  FROM NOW())
    `, [uid]);

    res.json({
      ...summary.rows[0],
      ...weekly.rows[0],
      ...monthly.rows[0]
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary.' });
  }
}

// ── GET /api/analytics/trends ────────────────────────────────
async function getTrends(req, res) {
  try {
    const uid    = req.user.id;
    const days   = parseInt(req.query.days) || 30;

    // Distance and speed over time
    const trends = await pool.query(`
      SELECT
        training_date,
        distance_km,
        avg_speed,
        avg_pace,
        duration_minutes
      FROM training_sessions
      WHERE user_id=$1
        AND training_date >= NOW() - INTERVAL '${days} days'
      ORDER BY training_date ASC
    `, [uid]);

    // Weekly aggregates
    const weekly = await pool.query(`
      SELECT
        DATE_TRUNC('week', training_date)   AS week_start,
        SUM(distance_km)::float             AS total_distance,
        AVG(avg_speed)::float               AS avg_speed,
        COUNT(*)::int                       AS sessions
      FROM training_sessions
      WHERE user_id=$1
        AND training_date >= NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', training_date)
      ORDER BY week_start ASC
    `, [uid]);

    // Best and worst sessions
    const extremes = await pool.query(`
      SELECT * FROM training_sessions WHERE user_id=$1
      ORDER BY avg_speed DESC LIMIT 5
    `, [uid]);

    res.json({
      daily:    trends.rows,
      weekly:   weekly.rows,
      top5:     extremes.rows
    });
  } catch (err) {
    console.error('Trends error:', err);
    res.status(500).json({ error: 'Failed to fetch trends.' });
  }
}

module.exports = { getSummary, getTrends };
