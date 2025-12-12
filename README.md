# Event Booking Platform - Backend Server

A robust Node.js backend API for event booking management with real-time features, JWT authentication, and MySQL database.

## 🚀 Features

- **RESTful API** - Clean and well-documented endpoints
- **JWT Authentication** - Secure user authentication and authorization
- **Role-based Access Control** - Admin and user roles with different permissions
- **Real-time Updates** - Socket.IO for live seat availability
- **Database Transactions** - ACID compliance for booking operations
- **Auto-table Creation** - Database schema setup on first run
- **Error Handling** - Comprehensive error handling and validation
- **CORS Support** - Configurable cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn package manager

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE event_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=event_booking

# Server Configuration
PORT=5000

# JWT Secret (Change in production!)
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

**For Production:**
```env
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=event_booking

PORT=5000

JWT_SECRET=use-a-strong-random-secret-key-at-least-32-characters-long

FRONTEND_URL=https://your-frontend-domain.com
```

### 4. Initialize Database

The application will automatically create tables on first run. Alternatively:

```bash
# Initialize database tables
node scripts/initDb.js

# Test database connection
node scripts/test-db-connection.js
```

## 🚀 Running the Server

### Development Mode

```bash
npm start
```

Server will start on `http://localhost:5000`

### Production Mode

```bash
NODE_ENV=production npm start
```

## 📁 Project Structure

```
GravitInfo_server/
├── config/
│   ├── db.js                    # Database connection
│   └── createTablesAuto.js      # Auto-table creation
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── eventController.js       # Event CRUD operations
│   └── bookingController.js     # Booking management
├── middleware/
│   ├── authMiddleware.js        # JWT verification
│   ├── roleMiddleware.js        # Role-based access
│   └── bookingMiddleware.js     # Booking validation
├── routes/
│   ├── authRoutes.js           # Auth endpoints
│   ├── eventRoutes.js          # Event endpoints
│   └── bookingRoutes.js        # Booking endpoints
├── scripts/
│   ├── initDb.js               # Database initialization
│   └── test-db-connection.js   # Connection test
├── database/
│   ├── event_booking.sql       # Database schema
│   └── migration_add_seats.sql # Database migrations
├── .env                        # Environment variables
├── server.js                   # Application entry point
└── package.json                # Dependencies
```

## 🔌 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"  // or "admin"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Events

#### Get All Events
```http
GET /api/events
```

#### Get Event by ID
```http
GET /api/events/:id
```

#### Create Event (Admin Only)
```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Concert Night",
  "description": "Amazing live concert",
  "location": "City Arena",
  "date": "2025-12-31T20:00:00",
  "totalSeats": 500,
  "price": 1500,
  "image": "https://example.com/image.jpg"
}
```

#### Update Event (Admin Only)
```http
PUT /api/events/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "price": 1800
}
```

#### Delete Event (Admin Only)
```http
DELETE /api/events/:id
Authorization: Bearer <token>
```

### Bookings

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventId": 1,
  "quantity": 2,
  "totalAmount": 3000,
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "1234567890"
}
```

#### Get User Bookings
```http
GET /api/bookings/user/:userId
Authorization: Bearer <token>
```

#### Get All Bookings (Admin Only)
```http
GET /api/bookings
Authorization: Bearer <token>
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Events Table
```sql
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  date DATETIME NOT NULL,
  total_seats INT NOT NULL,
  available_seats INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  img TEXT,
  status ENUM('active', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  mobile VARCHAR(20),
  quantity INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed',
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🔐 Authentication & Authorization

### JWT Token

- Tokens are generated on successful login
- Token expiration: 24 hours
- Include token in Authorization header: `Bearer <token>`

### Roles

**User Role:**
- View events
- Create bookings for themselves
- View own bookings

**Admin Role:**
- All user permissions
- Create/edit/delete events
- View all bookings
- Manage event status

## 🔌 Socket.IO Events

### Client Events

#### Join Event Room
```javascript
socket.emit('joinEvent', eventId);
```

#### Lock Seat
```javascript
socket.emit('lockSeat', {
  eventId: 1,
  seatIndex: 5,
  userId: 'user123'
});
```

#### Unlock Seat
```javascript
socket.emit('unlockSeat', {
  eventId: 1,
  seatIndex: 5,
  userId: 'user123'
});
```

### Server Events

#### Locked Seats
```javascript
socket.on('lockedSeats', (seats) => {
  // { "5": "user123", "10": "user456" }
});
```

#### Seat Locked
```javascript
socket.on('seatLocked', ({ seatIndex, userId }) => {
  // Seat locked by user
});
```

#### Seat Unlocked
```javascript
socket.on('seatUnlocked', ({ seatIndex }) => {
  // Seat released
});
```

## 🔧 Configuration

### CORS Configuration

Edit `server.js` to add allowed origins:

```javascript
const allowedOrigins = [
  "http://localhost:5173",
  "https://your-frontend-domain.com"
];
```

### Socket.IO Configuration

Lock expiry time (default: 5 minutes):

```javascript
const LOCK_EXPIRY_TIME = 5 * 60 * 1000; // milliseconds
```

## 🐛 Troubleshooting

### Database Connection Issues

**Error: ER_ACCESS_DENIED_ERROR**
```bash
# Check MySQL credentials in .env
# Verify user has database access
GRANT ALL PRIVILEGES ON event_booking.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

**Error: ER_BAD_DB_ERROR**
```bash
# Database doesn't exist, create it
mysql -u root -p
CREATE DATABASE event_booking;
```

### Port Already in Use

```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (Windows)
taskkill /PID <process_id> /F

# Or change PORT in .env
PORT=5001
```

### JWT Issues

**Token Expired:**
- Tokens expire after 24 hours
- User must login again
- Check JWT_SECRET is consistent

**Invalid Token:**
- Ensure token is passed in Authorization header
- Format: `Bearer <token>`
- Check token hasn't been tampered with

## 🎯 Available Scripts

```bash
# Start server
npm start

# Initialize database
node scripts/initDb.js

# Test database connection
node scripts/test-db-connection.js

# Add seats column (migration)
node scripts/add_seats_column.js
```

## 📦 Dependencies

### Production Dependencies
- **express** (5.1.0) - Web framework
- **mysql2** (3.15.3) - MySQL client
- **jsonwebtoken** (9.0.2) - JWT authentication
- **bcryptjs** (3.0.3) - Password hashing
- **socket.io** (4.8.1) - Real-time communication
- **cors** (2.8.5) - CORS middleware
- **dotenv** (16.4.7) - Environment variables

## 🚀 Deployment

### Railway / Render

1. Set environment variables in platform dashboard
2. Connect GitHub repository
3. Configure build command: `npm install`
4. Configure start command: `npm start`
5. Add MySQL database service

### Traditional VPS

```bash
# Install Node.js and MySQL
# Clone repository
git clone <repo-url>
cd GravitInfo_server

# Install dependencies
npm install

# Configure .env file
nano .env

# Install PM2 for process management
npm install -g pm2

# Start server with PM2
pm2 start server.js --name event-booking-api
pm2 save
pm2 startup
```

### Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔒 Security Best Practices

✅ **Change JWT_SECRET in production**
✅ **Use strong database passwords**
✅ **Enable HTTPS in production**
✅ **Implement rate limiting**
✅ **Validate all inputs**
✅ **Use prepared statements (done)**
✅ **Keep dependencies updated**
✅ **Use environment variables**
✅ **Enable database SSL**
✅ **Implement request logging**

## 📊 Performance Tips

- Use database connection pooling (configured)
- Implement caching for frequently accessed data
- Add database indexes on foreign keys
- Use database transactions for critical operations
- Monitor query performance
- Implement pagination for large datasets

## 🧪 Testing

### Manual Testing with curl

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123","role":"user"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Get events
curl http://localhost:5000/api/events
```

## 📄 License

Copyright (c) Gravit InfoSystem. All rights reserved.

## 🆘 Support

For issues or questions:
- Check database connection and credentials
- Review error logs in console
- Verify environment variables
- Check API documentation
- Test endpoints with Postman/curl

## 🔗 Related Documentation

- [Frontend Setup](../Frontend/README.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Main Project README](../README.md)
