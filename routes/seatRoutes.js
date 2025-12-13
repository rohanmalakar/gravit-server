// ---------------------------------------------------------------------
// <copyright file="seatRoutes.js" company="Gravit InfoSystem">
// Copyright (c) Gravit InfoSystem. All rights reserved.
// </copyright>
// ---------------------------------------------------------------------

import express from 'express';
import { getSeatAvailability } from '../controllers/seatController.js';

const router = express.Router();

// Get seat availability for an event
router.get('/:eventId/availability', getSeatAvailability);

export default router;
