const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const auth = require("./middleware/auth");
const authController = require("./controllers/authController");
const listingController = require("./controllers/listingController");
const adminController = require("./controllers/adminController");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerDocument = require("./swagger");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for admin panel
app.use("/admin", express.static(path.join(__dirname, "public/admin")));

// Swagger setup
const specs = swaggerJsdoc({
	definition: swaggerDocument,
	apis: ["./controllers/*.js", "./app.js"],
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Root endpoint
app.get("/", (req, res) => {
	res.json({
		message: "Listings API Server",
		endpoints: {
			mobile: {
				login: "POST /api/login",
				listings: "GET /api/listing/get?latitude=X&longitude=Y",
			},
			admin: {
				panel: "GET /admin",
				login: "POST /api/admin/login",
				listings: "GET /api/admin/listings",
			},
			documentation: "/api-docs",
		},
	});
});

// Mobile API Routes
app.post("/api/login", authController.login);
app.get("/api/listing/get", auth(["u"]), listingController.getListings);

// Admin API Routes
app.post("/api/admin/login", adminController.validateAdminLogin, adminController.adminLogin);
app.get("/api/admin/dashboard", auth(["a"]), adminController.getDashboardStats);

// User management routes
app.get("/api/admin/users", auth(["a"]), adminController.getUsers);
app.post("/api/admin/users", auth(["a"]), adminController.validateUser, adminController.createUser);
app.put("/api/admin/users/:id", auth(["a"]), adminController.validateUser, adminController.updateUser);
app.delete("/api/admin/users/:id", auth(["a"]), adminController.deleteUser);

// Listing management routes
app.get("/api/admin/listings", auth(["a"]), listingController.getAdminListings);
app.get("/api/admin/listings/:id", auth(["a"]), listingController.getListing);
app.post("/api/admin/listings", auth(["a"]), listingController.validateListing, listingController.createListing);
app.put("/api/admin/listings/:id", auth(["a"]), listingController.validateListing, listingController.updateListing);
app.delete("/api/admin/listings/:id", auth(["a"]), listingController.deleteListing);

// Admin panel route
app.get("/admin", (req, res) => {
	res.sendFile(path.join(__dirname, "public/admin/index.html"));
});

// Error handling middleware
app.use((error, req, res, next) => {
	console.error("Error:", error);
	res.status(500).json({
		status: 500,
		message: "Internal server error",
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		status: 404,
		message: "Endpoint not found",
	});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
	console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
	console.log(`Admin Panel: http://localhost:${PORT}/admin`);
});
