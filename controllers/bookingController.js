// ---------------------------------------------------------------------
// <copyright file="bookingController.js" company="Gravit InfoSystem">
// Copyright (c) Gravit InfoSystem. All rights reserved.
// </copyright>
// ---------------------------------------------------------------------

import db from '../config/db.js';

const transformBooking = (booking) => {
    // Parse seats if it's a JSON string
    let seats = null;
    if (booking.seats) {
        try {
            seats = typeof booking.seats === 'string' ? JSON.parse(booking.seats) : booking.seats;
        } catch (e) {
            console.error('Error parsing seats:', e);
            seats = null;
        }
    }
    
    return {
        id: booking.id,
        eventId: Number(booking.event_id),
        userId: Number(booking.user_id),
        quantity: booking.quantity,
        totalAmount: Number(booking.total_amount),
        status: booking.status || 'booked',
        createdAt: booking.booking_date || booking.created_at,
        name: booking.name,
        email: booking.email,
        mobile: booking.mobile,
        seats: seats,
        title: booking.title,
        date: booking.date,
        location: booking.location,
        image: booking.img
    };
};

export const createBooking = async (req, res) => {
    const { eventId, quantity, totalAmount, name, email, mobile, seats } = req.body;
    const userId = req.user.id;
    
    if (!eventId || !totalAmount) {
        return res.status(400).json({
            success: false,
            message: 'EventId and totalAmount are required'
        });
    }

    // If seats array is provided, use its length as quantity
    const quantityVal = seats && Array.isArray(seats) ? seats.length : (quantity || 1);

    if (quantityVal <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Quantity must be greater than 0'
        });
    }

    if (totalAmount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Total amount must be greater than 0'
        });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [events] = await connection.execute(
            'SELECT * FROM events WHERE id = ? FOR UPDATE',
            [eventId]
        );

        if (events.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const event = events[0];

        if (event.status === 'closed') {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'This event is closed. Bookings are no longer available.'
            });
        }

        if (event.available_seats < quantityVal) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Not enough seats available. Only ${event.available_seats} seats remaining.`
            });
        }

        await connection.execute(
            'UPDATE events SET available_seats = available_seats - ? WHERE id = ?',
            [quantityVal, eventId]
        );

        const [updatedEvent] = await connection.execute(
            'SELECT available_seats FROM events WHERE id = ?',
            [eventId]
        );

        if (updatedEvent[0].available_seats < 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Seat count validation failed. Please try again.'
            });
        }

        const [users] = await connection.execute(
            'SELECT name, email FROM users WHERE id = ?',
            [userId]
        );
        const user = users[0] || {};
        
        // Convert seats array to JSON string if provided
        const seatsJson = seats && Array.isArray(seats) ? JSON.stringify(seats) : null;
        
        const [result] = await connection.execute(
            'INSERT INTO bookings (event_id, user_id, name, email, mobile, quantity, total_amount, seats, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                eventId,
                userId,
                name || user.name || null,
                email || user.email || null,
                mobile || null,
                quantityVal,
                totalAmount,
                seatsJson,
                'confirmed'
            ]
        );

        await connection.commit();

        const booking = {
            id: result.insertId,
            eventId,
            userId,
            quantity: quantityVal,
            totalAmount,
            seats: seats || [],
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            name: name || user.name || null,
            email: email || user.email || null,
            mobile: mobile || null
        };

        return res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rollback error:', rollbackError?.message);
            }
        }
        console.error('Create booking error:', error?.message);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Server error while creating booking'
        });
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (releaseError) {
                console.error('Error releasing connection:', releaseError?.message);
            }
        }
    }
};

export const getAllBookings = async (req, res) => {
    try {
        const { eventId, userId: queryUserId } = req.query;
        
        // If no filters and user is not admin, deny access
        if (!eventId && !queryUserId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin access required to view all bookings'
            });
        }
        
        let query = 'SELECT b.*, e.title, e.date, e.location, e.img FROM bookings b JOIN events e ON b.event_id = e.id';
        const params = [];
        const conditions = [];

        if (queryUserId) {
            if (req.user.role === 'admin') {
                // Admins can query any user's bookings
                conditions.push('b.user_id = ?');
                params.push(queryUserId);
            } else if (Number(queryUserId) === req.user.id) {
                // Users can only query their own bookings
                conditions.push('b.user_id = ?');
                params.push(queryUserId);
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'You can only view your own bookings'
                });
            }
        }

        if (eventId) {
            // Anyone authenticated can view bookings for an event (to see booked seats)
            conditions.push('b.event_id = ?');
            params.push(eventId);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY b.booking_date DESC';

        const [bookings] = await db.query(query, params);
        const transformed = bookings.map(transformBooking);

        return res.status(200).json({
            success: true,
            message: 'Bookings fetched successfully',
            data: transformed
        });
    } catch (error) {
        console.error('Get all bookings error:', error?.message);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Server error while fetching bookings'
        });
    }
};

export const getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const requestedUserId = req.params.userId;
        
        console.log('getUserBookings called - userId:', userId, 'requestedUserId:', requestedUserId);
        
        if (requestedUserId && req.user.role !== 'admin' && Number(requestedUserId) !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own bookings'
            });
        }
        
        const targetUserId = req.user.role === 'admin' && requestedUserId ? requestedUserId : userId;
        console.log('Fetching bookings for targetUserId:', targetUserId);
        
        const [bookings] = await db.execute(
            'SELECT b.*, e.title, e.date, e.location, e.img FROM bookings b JOIN events e ON b.event_id = e.id WHERE b.user_id = ? ORDER BY b.booking_date DESC',
            [targetUserId]
        );

        console.log('Found bookings:', bookings.length);
        const transformed = bookings.map(transformBooking);

        return res.status(200).json({
            success: true,
            message: 'User bookings fetched successfully',
            data: transformed
        });
    } catch (error) {
        console.error('Get user bookings error:', error?.message);
        console.error('Full error:', error);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Server error while fetching user bookings'
        });
    }
};

export const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [bookings] = await db.execute(
            'SELECT b.*, e.title, e.date, e.location, e.img FROM bookings b JOIN events e ON b.event_id = e.id WHERE b.id = ?',
            [id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Booking fetched successfully',
            data: transformBooking(bookings[0])
        });
    } catch (error) {
        console.error('Get booking by id error:', error?.message);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Server error while fetching booking'
        });
    }
};

export const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
        
        const [bookings] = await db.query(
            'SELECT b.*, e.title, e.date, e.location, e.img FROM bookings b JOIN events e ON b.event_id = e.id WHERE b.id = ?',
            [id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Booking updated successfully',
            data: transformBooking(bookings[0])
        });
    } catch (error) {
        console.error('Update booking error:', error?.message);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Server error while updating booking'
        });
    }
};
