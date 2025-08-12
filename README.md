# Listings API with Admin Panel

A complete Node.js RESTful API with Vue.js admin panel for managing location-based listings with distance calculation, user authentication, and AI-powered description generation.

## Features

### 🔐 Authentication & Authorization

-  **Role-based access control**: Users (`u`) and Admins (`a`)
-  **JWT token authentication** with expiration
-  **Bcrypt password encryption**
-  **Separate login endpoints** for mobile users and admins

### 📍 Location-based Listings

-  **Haversine distance calculation** in kilometers
-  **Coordinate validation** (latitude: -90 to 90, longitude: -180 to 180)
-  **Pagination support** for large datasets
-  **Foreign key relationships** between users and listings

### 🤖 AI Integration

-  **Auto-generated descriptions** using OpenAI API
-  **Fallback descriptions** when AI is unavailable
-  **Environment-based API key configuration**

### 🎨 Admin Panel (Vue.js)

-  **Responsive dashboard** with statistics
-  **CRUD operations** for listings and users
-  **Real-time data management**
-  **Bootstrap UI components**

### 📚 API Documentation

-  **Swagger/OpenAPI 3.0** documentation
-  **Interactive API testing** interface
-  **Comprehensive endpoint descriptions**

## Tech Stack

-  **Backend**: Node.js, Express.js
-  **Database**: MySQL with Knex.js ORM
-  **Authentication**: JWT, Bcrypt
-  **Frontend**: Vue.js 3, Bootstrap 5
-  **Documentation**: Swagger UI
-  **AI**: OpenAI API (optional)

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository>
cd <project-directory>
npm install
```

### 2. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE listings_db;
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=listings_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_replace_in_production

# Server Configuration
PORT=3002

# AI API Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key
```

### 4. Database Migration and Seeding

```bash
# Run migrations
npm run migrate

# Seed sample data
npm run seed
```

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### 📱 Mobile API (role_type = 'u')

#### Login

```http
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
	"status": 200,
	"message": "Logged in",
	"result": {
		"user_id": 5,
		"access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6I......",
		"token_type": "Bearer",
		"role_type": "u",
		"expires_at": "2022-03-16 12:31:39"
	}
}
```

#### Get Listings with Distance

```http
GET /api/listing/get?latitude=3.12112&longitude=101.67905&page=1&per_page=10
Authorization: Bearer <access_token>
```

**Response:**

```json
{
	"status": 200,
	"message": "Success",
	"result": {
		"current_page": 1,
		"data": [
			{
				"id": 4,
				"name": "Starbucks Mid Valley",
				"distance": "0.6",
				"created_at": "2021-03-10 12:24:38",
				"updated_at": "2021-03-10 12:24:38"
			},
			{
				"id": 9,
				"name": "Burger King",
				"distance": "0.8",
				"created_at": "2021-03-10 12:24:38",
				"updated_at": "2021-03-10 12:24:38"
			}
		]
	}
}
```

### 🔧 Admin API (role_type = 'a')

#### Admin Login

```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

#### Dashboard Statistics

```http
GET /api/admin/dashboard
Authorization: Bearer <admin_token>
```

#### Listings Management

```http
# Get all listings
GET /api/admin/listings
Authorization: Bearer <admin_token>

# Create listing
POST /api/admin/listings
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "New Restaurant",
  "description": "Great food and atmosphere",
  "latitude": 3.1189,
  "longitude": 101.6767,
  "user_id": 1
}

# Update listing
PUT /api/admin/listings/{id}
Authorization: Bearer <admin_token>

# Delete listing
DELETE /api/admin/listings/{id}
Authorization: Bearer <admin_token>
```

## Admin Panel

Access the admin panel at: `http://localhost:3000/admin`

### Default Admin Credentials

-  **Email**: `admin@example.com`
-  **Password**: `admin123`

### Features

-  **Dashboard**: Overview with statistics and recent listings
-  **Listings Management**: Add, edit, delete listings with coordinate validation
-  **Users Management**: Manage user accounts and roles
-  **AI Description Generation**: Automatic description creation for listings

## API Documentation

Interactive API documentation is available at: `http://localhost:3000/api-docs`

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_type ENUM('u', 'a') DEFAULT 'u',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Listings Table

```sql
CREATE TABLE listings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT check_longitude CHECK (longitude >= -180 AND longitude <= 180)
);
```

## AI Integration

The application supports AI-powered description generation for listings. Configure your preferred AI service:

### OpenAI (Recommended)

```env
OPENAI_API_KEY=your_openai_api_key
```

### Usage

When creating or updating a listing without a description, the system will automatically generate one using AI based on the location name.

## Testing

### Sample Data

The seed file includes sample users and listings around Kuala Lumpur:

**Users:**

-  `user@example.com` / `password123` (role: user)
-  `admin@example.com` / `admin123` (role: admin)
-  `jane@example.com` / `password123` (role: user)

**Listings:**

-  Starbucks Mid Valley
-  Burger King
-  Pizza Hut
-  Sunway Pyramid
-  KLCC Twin Towers
-  Pavilion KL

### Testing Distance Calculation

Use these coordinates to test the distance calculation:

-  **Mid Valley Area**: latitude=3.1189, longitude=101.6767
-  **KLCC Area**: latitude=3.1581, longitude=101.7117
-  **Bukit Bintang**: latitude=3.1494, longitude=101.7131

## Error Handling

The API includes comprehensive error handling:

-  **Validation errors** (422): Invalid input data
-  **Authentication errors** (401): Invalid or missing tokens
-  **Authorization errors** (403): Insufficient permissions
-  **Not found errors** (404): Resource doesn't exist
-  **Server errors** (500): Internal server issues

## Security Features

-  **Password encryption** using bcrypt
-  **JWT token expiration** (24 hours)
-  **Role-based access control**
-  **SQL injection prevention** via parameterized queries
-  **Input validation** using express-validator
-  **CORS enabled** for cross-origin requests

## Development Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run migrate    # Run database migrations
npm run seed       # Seed database with sample data
```

## Deployment

1. **Set production environment variables**
2. **Create production database**
3. **Run migrations**: `npm run migrate`
4. **Optionally seed data**: `npm run seed`
5. **Start server**: `npm start`

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## License

This project is licensed under the ISC License.

## Support

For support and questions:

-  **Email**: support@example.com
-  **Documentation**: `/api-docs`
-  **Admin Panel**: `/admin`
