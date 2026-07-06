import { getDashboard } from "../services/dashboard.service.js";

export async function getDashboardController(_req, res, next) {
  try {
    const dashboard = await getDashboard();
    res.json({ data: dashboard });
  } catch (error) {
    next(error);
  }
}
