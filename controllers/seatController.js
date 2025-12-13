// ---------------------------------------------------------------------
// <copyright file="seatController.js" company="Gravit InfoSystem">
// Copyright (c) Gravit InfoSystem. All rights reserved.
// </copyright>
// ---------------------------------------------------------------------

import db from '../config/db.js';

/**
 * Get seat availability for an event
 * Returns which seats are booked and which are available
 */
export const getSeatAvailability = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Get event details
        const [events] = await db.execute(
            'SELECT id, title, total_seats, available_seats FROM events WHERE id = ?',
            [eventId]
        );

        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const event = events[0];

        // Get all booked seats for this event
        const [bookings] = await db.execute(
            `SELECT seats FROM bookings 
             WHERE event_id = ? AND status != 'cancelled' AND seats IS NOT NULL`,
            [eventId]
        );

        // Collect all booked seat numbers
        const bookedSeats = [];
        bookings.forEach(booking => {
            if (booking.seats) {
                try {
                    const seats = JSON.parse(booking.seats);
                    bookedSeats.push(...seats);
                } catch (e) {
                    console.error('Error parsing seats:', e);
                }
            }
        });

        // Create array of all seats with their status
        const totalSeats = event.total_seats;
        const seats = [];
        for (let i = 1; i <= totalSeats; i++) {
            seats.push({
                number: i,
                isBooked: bookedSeats.includes(i)
            });
        }

        return res.json({
            success: true,
            data: {
                eventId: event.id,
                eventTitle: event.title,
                totalSeats: event.total_seats,
                availableSeats: event.available_seats,
                bookedSeats: bookedSeats,
                seats: seats
            }
        });

    } catch (error) {
        console.error('Error fetching seat availability:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch seat availability'
        });
    }
};
