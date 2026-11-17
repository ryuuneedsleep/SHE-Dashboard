/**
 * SPLD SAFETY - Dashboard Controller
 * Handles aggregated analytics and KPI endpoints for Administrator Dashboard
 */

import { dashboardModel } from '../models/dashboardModel.js';

export const dashboardController = {
  /**
   * GET /api/v1/dashboard
   * Retrieve aggregated KPIs, monthly trends, distributions, and recent findings
   */
  async getDashboard(req, res, next) {
    try {
      const {
        department,
        operational_area,
        operationalArea,
        from_date,
        startDate,
        to_date,
        endDate,
      } = req.query;

      const data = await dashboardModel.getDashboardData({
        department,
        operational_area: operational_area || operationalArea,
        from_date: from_date || startDate,
        to_date: to_date || endDate,
      });

      return res.status(200).json({
        success: true,
        message: 'Data analitik dashboard berhasil diambil.',
        data,
      });
    } catch (err) {
      return next(err);
    }
  },
};

export default dashboardController;
