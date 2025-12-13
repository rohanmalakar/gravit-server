// ---------------------------------------------------------------------
// <copyright file="analyticsController.js" company="Gravit InfoSystem">
// Copyright (c) Gravit InfoSystem. All rights reserved.
// </copyright>
// ---------------------------------------------------------------------

import db from '../config/db.js';

/**
 * Get dashboard analytics
 * Returns: total revenue, total bookings, total events, recent bookings, event stats, and revenue by date
 */
export const getDashboardAnalytics = async (req, res) => {
    try {
        // Get total revenue from confirmed bookings
        const [revenueResult] = await db.query(
            `SELECT COALESCE(SUM(total_amount), 0) as total 
             FROM bookings 
             WHERE status = 'confirmed' OR status = 'booked'`
        );
        const totalRevenue = parseFloat(revenueResult[0]?.total || 0);

        // Get total bookings count
        const [bookingsResult] = await db.query(
            `SELECT COUNT(*) as count FROM bookings`
        );
        const totalBookings = parseInt(bookingsResult[0]?.count || 0);

        // Get total events count
        const [eventsResult] = await db.query(
            `SELECT COUNT(*) as count FROM events`
        );
        const totalEvents = parseInt(eventsResult[0]?.count || 0);

        // Get recent bookings (last 7 days)
        const [recentResult] = await db.query(
            `SELECT COUNT(*) as count 
             FROM bookings 
             WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
                OR created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );
        const recentBookings = parseInt(recentResult[0]?.count || 0);

        // Get event statistics with bookings
        const [events] = await db.query(
            `SELECT id, title, price, total_seats, available_seats 
             FROM events 
             ORDER BY created_at DESC`
        );

        const eventStats = await Promise.all(events.map(async (event) => {
            const [bookingStats] = await db.query(
                `SELECT 
                    COALESCE(SUM(quantity), 0) as tickets_sold,
                    COALESCE(SUM(total_amount), 0) as revenue
                 FROM bookings 
                 WHERE event_id = ? AND (status = 'confirmed' OR status = 'booked')`,
                [event.id]
            );

            const stats = bookingStats[0] || {};
            return {
                title: event.title,
                ticketsSold: parseInt(stats.tickets_sold || 0),
                revenue: parseFloat(stats.revenue || 0),
                availableSeats: event.available_seats || 0
            };
        }));

        // Get revenue by date (last 7 days)
        const revenueByDate = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextDateStr = nextDate.toISOString().split('T')[0];

            const [dailyRevenue] = await db.query(
                `SELECT COALESCE(SUM(total_amount), 0) as total
                 FROM bookings 
                 WHERE (status = 'confirmed' OR status = 'booked')
                   AND (
                     (booking_date >= ? AND booking_date < ?)
                     OR 
                     (created_at >= ? AND created_at < ?)
                   )`,
                [dateStr, nextDateStr, dateStr, nextDateStr]
            );

            revenueByDate.push({
                date: dateStr,
                revenue: parseFloat(dailyRevenue[0]?.total || 0)
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalBookings,
                totalEvents,
                recentBookings,
                eventStats,
                revenueByDate
            }
        });

    } catch (error) {
        console.error('Analytics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
            error: error.message
        });
    }
};

/**
 * Get booking statistics
 */
export const getBookingStats = async (req, res) => {
    try {
        const [statusStats] = await db.query(
            `SELECT 
                status,
                COUNT(*) as count,
                COALESCE(SUM(total_amount), 0) as total_revenue
             FROM bookings 
             GROUP BY status`
        );

        return res.status(200).json({
            success: true,
            data: statusStats
        });

    } catch (error) {
        console.error('Booking stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch booking statistics',
            error: error.message
        });
    }
};

/**
 * Get event performance metrics
 */
export const getEventPerformance = async (req, res) => {
    try {
        const [eventPerformance] = await db.query(
            `SELECT 
                e.id,
                e.title,
                e.price,
                e.total_seats,
                e.available_seats,
                e.location,
                e.date as event_date,
                COALESCE(COUNT(b.id), 0) as total_bookings,
                COALESCE(SUM(b.quantity), 0) as tickets_sold,
                COALESCE(SUM(b.total_amount), 0) as revenue,
                ROUND((e.total_seats - e.available_seats) / e.total_seats * 100, 2) as occupancy_rate
             FROM events e
             LEFT JOIN bookings b ON e.id = b.event_id AND (b.status = 'confirmed' OR b.status = 'booked')
             GROUP BY e.id
             ORDER BY revenue DESC`
        );

        return res.status(200).json({
            success: true,
            data: eventPerformance.map(event => ({
                id: event.id,
                title: event.title,
                price: parseFloat(event.price),
                totalSeats: event.total_seats,
                availableSeats: event.available_seats,
                location: event.location,
                eventDate: event.event_date,
                totalBookings: parseInt(event.total_bookings),
                ticketsSold: parseInt(event.tickets_sold),
                revenue: parseFloat(event.revenue),
                occupancyRate: parseFloat(event.occupancy_rate || 0)
            }))
        });

    } catch (error) {
        console.error('Event performance error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch event performance',
            error: error.message
        });
    }
};
