import pool from "../db.js";
export async function readMilestones(route = "all") {
    let query: string;
    let params: string[];

    if (route && route !== "all") {
      // Filter: only milestones that include this route in their route_ids array
      query = "SELECT * FROM milestones WHERE $1 = ANY(route_ids) ORDER BY sort_order, id";
      params = [route];
    } else {
      query = "SELECT * FROM milestones ORDER BY sort_order, id";
      params = [];
    }

    const result = await pool.query(query, params);

    // Convert snake_case columns to camelCase for the frontend
    const milestones = result.rows.map((row) => ({
      id: row.id,
      phase: row.phase,
      title: row.title,
      plainLanguage: row.plain_language,
      displayDate: row.display_date,
      routeIds: row.route_ids,
      sourceIds: row.source_ids,
      checklist: row.checklist,
      status: row.status
    }));

return milestones;
}
