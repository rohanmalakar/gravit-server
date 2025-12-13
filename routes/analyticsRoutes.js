// ---------------------------------------------------------------------
// <copyright file="analyticsRoutes.js" company="Gravit InfoSystem">
// Copyright (c) Gravit InfoSystem. All rights reserved.
// </copyright>
// ---------------------------------------------------------------------

import express from 'express';
import { 
    getDashboardAnalytics, 
    getBookingStats, 
    getEventPerformance 
} from '../controllers/analyticsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All analytics routes require authentication and admin role
router.use(verifyToken);
router.use(requireRole(['admin']));

// Dashboard analytics
router.get('/dashboard', getDashboardAnalytics);

// Booking statistics
router.get('/bookings', getBookingStats);

// Event performance metrics
router.get('/events', getEventPerformance);

export default router;
