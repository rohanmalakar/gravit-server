# GravitInfo Server - API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [WebSocket Events](#websocket-events)
- [Authentication APIs](#authentication-apis)
- [Event APIs](#event-apis)
- [Booking APIs](#booking-apis)
- [Error Handling](#error-handling)

---

## Overview

This is the complete API documentation for the GravitInfo Event Booking System. The server provides RESTful APIs for event management, user authentication, and booking operations, along with real-time WebSocket functionality for seat locking.

**Technology Stack:**
- Node.js + Express.js
- MySQL Database
- Socket.IO for real-time features
- JWT for authentication
- bcrypt for password hashing

---

## Base URL

```
http://localhost:5000/api
```

**Production URLs:**
- `https://gravit-info-client.vercel.app`
- `https://gravit-info-client-git-main-pradhyum2025s-projects.vercel.app`

---

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Roles
- **user**: Regular user (default)
- **admin**: Administrator with elevated privileges

---

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## WebSocket Events

The server uses Socket.IO for real-time seat locking functionality.

### Connection
```javascript
const socket = io('http://localhost:5000');
```

### Events

#### 1. Join Event Room
**Event:** `joinEvent`

**Emit:**
```javascript
socket.emit('joinEvent', eventId);
```

**Response:**
```javascript
socket.on('lockedSeats', (activeLocks) => {
  // activeLocks: { seatIndex: userId }
});
```

#### 2. Lock Seat
**Event:** `lockSeat`

**Emit:**
```javascript
socket.emit('lockSeat', {
  eventId: 1,
  seatIndex: 5,
  userId: 'user123'
});
```

**Success Response:**
```javascript
socket.on('seatLocked', ({ seatIndex, userId }) => {
  // Seat locked successfully
});
```

**Error Response:**
```javascript
socket.on('seatLockFailed', ({ seatIndex, reason }) => {
  // Failed to lock seat
});
```

#### 3. Unlock Seat
**Event:** `unlockSeat`

**Emit:**
```javascript
socket.emit('unlockSeat', {
  eventId: 1,
  seatIndex: 5,
  userId: 'user123'
});
```

**Response:**
```javascript
socket.on('seatUnlocked', ({ seatIndex }) => {
  // Seat unlocked successfully
});
```

**Note:** Seat locks automatically expire after 5 minutes.

---

## Authentication APIs

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Authentication:** None required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "user"  // Optional: "user" or "admin" (default: "user")
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

**Error Responses:**
- `400`: Name, email, or password missing
- `400`: User already exists
- `500`: Server error

---

### 2. Login User

**Endpoint:** `POST /api/auth/login`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

**Error Responses:**
- `400`: Email or password missing
- `400`: Invalid credentials
- `500`: Server error

---

## Event APIs

### 1. Get All Events

**Endpoint:** `GET /api/events`

**Authentication:** None required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Events fetched successfully",
  "data": [
    {
      "id": 1,
      "title": "Tech Conference 2025",
      "description": "Annual technology conference",
      "location": "Convention Center, New York",
      "date": "2025-06-15T10:00:00Z",
      "totalSeats": 500,
      "availableSeats": 450,
      "price": 99.99,
      "status": "upcoming",
      "image": "https://example.com/image.jpg"
    }
  ]
}
```

**Error Response:**
- `500`: Server error

---

### 2. Get Event by ID

**Endpoint:** `GET /api/events/:id`

**Authentication:** None required

**URL Parameters:**
- `id` (integer): Event ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Event fetched successfully",
  "data": {
    "id": 1,
    "title": "Tech Conference 2025",
    "description": "Annual technology conference",
    "location": "Convention Center, New York",
    "date": "2025-06-15T10:00:00Z",
    "totalSeats": 500,
    "availableSeats": 450,
    "price": 99.99,
    "status": "upcoming",
    "image": "https://example.com/image.jpg"
  }
}
```

**Error Responses:**
- `404`: Event not found
- `500`: Server error

---

### 3. Create Event

**Endpoint:** `POST /api/events`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "title": "Tech Conference 2025",
  "description": "Annual technology conference",
  "location": "Convention Center, New York",
  "date": "2025-06-15T10:00:00Z",
  "totalSeats": 500,
  "price": 99.99,
  "image": "https://example.com/image.jpg",
  "status": "upcoming"  // Optional: "upcoming" or "closed" (default: "upcoming")
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": 1,
    "title": "Tech Conference 2025",
    "description": "Annual technology conference",
    "location": "Convention Center, New York",
    "date": "2025-06-15T10:00:00Z",
    "totalSeats": 500,
    "availableSeats": 500,
    "price": 99.99,
    "status": "upcoming",
    "image": "https://example.com/image.jpg"
  }
}
```

**Error Responses:**
- `400`: Missing required fields (title, date, totalSeats, price)
- `401`: Unauthorized
- `403`: Forbidden (Admin access required)
- `500`: Server error

---

### 4. Update Event

**Endpoint:** `PUT /api/events/:id`

**Authentication:** Required (Admin only)

**URL Parameters:**
- `id` (integer): Event ID

**Request Body:**
```json
{
  "title": "Tech Conference 2025 - Updated",
  "description": "Updated description",
  "location": "New Location",
  "date": "2025-06-20T10:00:00Z",
  "totalSeats": 600,
  "price": 89.99,
  "status": "upcoming",
  "image": "https://example.com/new-image.jpg"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "id": 1,
    "title": "Tech Conference 2025 - Updated",
    "description": "Updated description",
    "location": "New Location",
    "date": "2025-06-20T10:00:00Z",
    "totalSeats": 600,
    "availableSeats": 450,
    "price": 89.99,
    "status": "upcoming",
    "image": "https://example.com/new-image.jpg"
  }
}
```

**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden (Admin access required)
- `404`: Event not found
- `500`: Server error

---

### 5. Delete Event

**Endpoint:** `DELETE /api/events/:id`

**Authentication:** Required (Admin only)

**URL Parameters:**
- `id` (integer): Event ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden (Admin access required)
- `404`: Event not found
- `500`: Server error

---

## Booking APIs

### 1. Create Booking

**Endpoint:** `POST /api/bookings`

**Authentication:** Required (User role)

**Request Body:**
```json
{
  "eventId": 1,
  "seats": [5, 6, 7],  // Array of seat numbers or JSON string or comma-separated string
  "quantity": 3,  // Optional: defaults to seats array length
  "totalAmount": 299.97,
  "name": "John Doe",  // Optional: defaults to user's name
  "email": "john@example.com",  // Optional: defaults to user's email
  "mobile": "+1234567890"  // Optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 1,
    "eventId": 1,
    "userId": 1,
    "seats": [5, 6, 7],
    "quantity": 3,
    "totalAmount": 299.97,
    "status": "confirmed",
    "createdAt": "2025-12-13T10:30:00Z",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400`: Missing required fields (eventId, seats, totalAmount)
- `400`: At least one valid seat is required
- `400`: Total amount must be greater than 0
- `400`: Not enough seats available
- `400`: Seats already booked
- `400`: Invalid seat numbers
- `400`: User has already booked these seats
- `401`: Unauthorized
- `403`: Event is closed
- `404`: Event not found
- `500`: Server error

**Features:**
- Transaction-based booking with automatic rollback on errors
- Concurrent booking protection (seat locking)
- Validates seat availability and conflicts
- Prevents duplicate bookings by the same user
- Automatically updates available seats

---

### 2. Get All Bookings

**Endpoint:** `GET /api/bookings`

**Authentication:** Required

**Query Parameters:**
- `eventId` (integer, optional): Filter by event ID
- `userId` (integer, optional): Filter by user ID (admin can view any user, users can only view their own)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bookings fetched successfully",
  "data": [
    {
      "id": 1,
      "eventId": 1,
      "userId": 1,
      "seats": [5, 6, 7],
      "quantity": 3,
      "totalAmount": 299.97,
      "status": "confirmed",
      "createdAt": "2025-12-13T10:30:00Z",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "+1234567890"
    }
  ]
}
```

**Error Responses:**
- `401`: Unauthorized
- `403`: Access denied (Admin access required to view all bookings without filters)
- `403`: You can only view your own bookings
- `500`: Server error

**Access Control:**
- Admins: Can view all bookings or filter by any user/event
- Users: Can only view their own bookings (must provide userId or eventId)

---

### 3. Get User Bookings

**Endpoint:** `GET /api/bookings/user/:userId`

**Authentication:** Required

**URL Parameters:**
- `userId` (integer): User ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "User bookings fetched successfully",
  "data": [
    {
      "id": 1,
      "eventId": 1,
      "userId": 1,
      "seats": [5, 6, 7],
      "quantity": 3,
      "totalAmount": 299.97,
      "status": "confirmed",
      "createdAt": "2025-12-13T10:30:00Z",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "+1234567890"
    }
  ]
}
```

**Error Responses:**
- `401`: Unauthorized
- `403`: You can only view your own bookings
- `500`: Server error

**Access Control:**
- Users can only view their own bookings
- Admins can view any user's bookings

---

### 4. Get Booking by ID

**Endpoint:** `GET /api/bookings/:id`

**Authentication:** Required

**URL Parameters:**
- `id` (integer): Booking ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking fetched successfully",
  "data": {
    "id": 1,
    "eventId": 1,
    "userId": 1,
    "seats": [5, 6, 7],
    "quantity": 3,
    "totalAmount": 299.97,
    "status": "confirmed",
    "createdAt": "2025-12-13T10:30:00Z",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "+1234567890"
  }
}
```

**Error Responses:**
- `401`: Unauthorized
- `404`: Booking not found
- `500`: Server error

---

### 5. Update Booking

**Endpoint:** `PUT /api/bookings/:id`

**Authentication:** Required (Admin only)

**URL Parameters:**
- `id` (integer): Booking ID

**Request Body:**
```json
{
  "status": "cancelled"  // Status: "pending", "confirmed", "cancelled"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking updated successfully",
  "data": {
    "id": 1,
    "eventId": 1,
    "userId": 1,
    "seats": [5, 6, 7],
    "quantity": 3,
    "totalAmount": 299.97,
    "status": "cancelled",
    "createdAt": "2025-12-13T10:30:00Z",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "+1234567890"
  }
}
```

**Error Responses:**
- `400`: Status is required
- `401`: Unauthorized
- `403`: Forbidden (Admin access required)
- `404`: Booking not found
- `500`: Server error

---

## Error Handling

### Common HTTP Status Codes

- `200`: Success
- `201`: Resource created successfully
- `400`: Bad request (validation error, missing fields)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Resource not found
- `500`: Internal server error

### Error Response Format

```json
{
  "success": false,
  "message": "Detailed error message"
}
```

---

## Database Schema

### Users Table
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, hashed)
- role (ENUM: 'user', 'admin')
- created_at (TIMESTAMP)
```

### Events Table
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- title (VARCHAR)
- description (TEXT)
- location (VARCHAR)
- date (DATETIME)
- total_seats (INT)
- available_seats (INT)
- price (DECIMAL)
- status (ENUM: 'upcoming', 'closed')
- img (TEXT)
- created_at (TIMESTAMP)
```

### Bookings Table
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- event_id (INT, FOREIGN KEY)
- user_id (INT, FOREIGN KEY)
- seats (JSON)
- quantity (INT)
- total_amount (DECIMAL)
- status (ENUM: 'pending', 'confirmed', 'cancelled')
- name (VARCHAR)
- email (VARCHAR)
- mobile (VARCHAR)
- booking_date (TIMESTAMP)
- created_at (TIMESTAMP)
```

---

## Environment Variables

Required environment variables in `.env` file:

```env
# Database Configuration
DB_HOST=hopper.proxy.rlwy.net
DB_PORT=29337
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=railway

# JWT Configuration
JWT_SECRET=your-secret-key

# Server Configuration
PORT=5000
```

---

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### Get All Events
```bash
curl -X GET http://localhost:5000/api/events
```

### Create Event (Admin)
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Tech Conference 2025",
    "description": "Annual technology conference",
    "location": "Convention Center",
    "date": "2025-06-15T10:00:00Z",
    "totalSeats": 500,
    "price": 99.99
  }'
```

### Create Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "eventId": 1,
    "seats": [5, 6, 7],
    "totalAmount": 299.97,
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

---

## Additional Notes

### Seat Format Support
The booking API accepts seats in multiple formats:
- **Array:** `[1, 2, 3]`
- **JSON String:** `"[1, 2, 3]"`
- **Comma-separated String:** `"1,2,3"`

### Seat Lock Expiration
- Locks expire after 5 minutes
- Automatic cleanup runs every minute
- Users are notified via WebSocket when locks expire

### Transaction Safety
- All booking operations use database transactions
- Automatic rollback on any error
- Row-level locking prevents race conditions

---

## Copyright

```
Copyright (c) Gravit InfoSystem. All rights reserved.
```

---

**Last Updated:** December 13, 2025
