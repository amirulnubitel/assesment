const knex = require("../knex");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const JWT_SECRET = process.env.JWT_SECRET || "replace_me";
const TOKEN_EXPIRES_IN = "24h";

// Admin login (separate from mobile login)
exports.adminLogin = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				status: 422,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		const { email, password } = req.body;

		const user = await knex("users").where({ email }).first();
		if (!user) {
			return res.status(401).json({
				status: 401,
				message: "Invalid credentials",
			});
		}

		const ok = await bcrypt.compare(password, user.password);
		if (!ok) {
			return res.status(401).json({
				status: 401,
				message: "Invalid credentials",
			});
		}

		// Only allow admin login for role_type = 'a'
		if (user.role_type !== "a") {
			return res.status(403).json({
				status: 403,
				message: "Admin access required",
			});
		}

		const payload = { user_id: user.id, role_type: user.role_type };
		const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
		const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString().replace("T", " ").substr(0, 19);

		res.json({
			status: 200,
			message: "Admin logged in successfully",
			result: {
				user_id: user.id,
				access_token: token,
				token_type: "Bearer",
				role_type: user.role_type,
				expires_at: expiresAt,
				name: user.name,
				email: user.email,
			},
		});
	} catch (error) {
		console.error("Admin login error:", error);
		return res.status(500).json({
			status: 500,
			message: "Internal server error",
		});
	}
};

// Get all users (admin only)
exports.getUsers = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const perPage = parseInt(req.query.per_page) || 10;
		const offset = (page - 1) * perPage;

		const users = await knex("users").select("id", "name", "email", "role_type", "created_at", "updated_at").limit(perPage).offset(offset).orderBy("created_at", "desc");

		const total = await knex("users").count("id as count").first();

		return res.json({
			status: 200,
			message: "Success",
			result: {
				current_page: page,
				per_page: perPage,
				total: total.count,
				data: users,
			},
		});
	} catch (error) {
		console.error("Error getting users:", error);
		return res.status(500).json({
			status: 500,
			message: "Internal server error",
		});
	}
};

// Dashboard statistics
exports.getDashboardStats = async (req, res) => {
	try {
		const [totalUsers, totalListings, totalAdmins, recentListings] = await Promise.all([
			knex("users").count("id as count").first(),
			knex("listings").count("id as count").first(),
			knex("users").where("role_type", "a").count("id as count").first(),
			knex("listings").join("users", "listings.user_id", "users.id").select("listings.name", "listings.created_at", "users.name as user_name").orderBy("listings.created_at", "desc").limit(5),
		]);

		return res.json({
			status: 200,
			message: "Success",
			result: {
				total_users: totalUsers.count,
				total_listings: totalListings.count,
				total_admins: totalAdmins.count,
				recent_listings: recentListings,
			},
		});
	} catch (error) {
		console.error("Error getting dashboard stats:", error);
		return res.status(500).json({
			status: 500,
			message: "Internal server error",
		});
	}
};

// Validation rules
exports.validateAdminLogin = [body("email").isEmail().withMessage("Valid email is required"), body("password").isLength({ min: 1 }).withMessage("Password is required")];

exports.validateUser = [
	body("name").trim().isLength({ min: 1, max: 255 }).withMessage("Name is required and must be less than 255 characters"),
	body("email").isEmail().withMessage("Valid email is required"),
	body("password").optional().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
	body("role_type").isIn(["u", "a"]).withMessage('Role type must be either "u" or "a"'),
];

// Create user (admin only)
exports.createUser = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				status: 422,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		const { name, email, password, role_type } = req.body;

		// Check if email already exists
		const existingUser = await knex("users").where("email", email).first();
		if (existingUser) {
			return res.status(409).json({
				status: 409,
				message: "Email already exists",
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const [userId] = await knex("users").insert({
			name,
			email,
			password: hashedPassword,
			role_type,
		});

		const user = await knex("users").select("id", "name", "email", "role_type", "created_at", "updated_at").where("id", userId).first();

		return res.status(201).json({
			status: 201,
			message: "User created successfully",
			result: user,
		});
	} catch (error) {
		console.error("Error creating user:", error);
		return res.status(500).json({
			status: 500,
			message: "Internal server error",
		});
	}
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				status: 422,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		const { id } = req.params;
		const { name, email, password, role_type } = req.body;

		// Check if user exists
		const existingUser = await knex("users").where("id", id).first();
		if (!existingUser) {
			return res.status(404).json({
				status: 404,
				message: "User not found",
			});
		}

		// Check if email is taken by another user
		if (email && email !== existingUser.email) {
			const emailTaken = await knex("users").where("email", email).where("id", "!=", id).first();
			if (emailTaken) {
				return res.status(409).json({
					status: 409,
					message: "Email already exists",
				});
			}
		}

		const updateData = {};
		if (name !== undefined) updateData.name = name;
		if (email !== undefined) updateData.email = email;
		if (role_type !== undefined) updateData.role_type = role_type;
		if (password) {
			updateData.password = await bcrypt.hash(password, 10);
		}

		await knex("users").where("id", id).update(updateData);

		const updatedUser = await knex("users").select("id", "name", "email", "role_type", "created_at", "updated_at").where("id", id).first();

		return res.json({
			status: 200,
			message: "User updated successfully",
			result: updatedUser,
		});
	} catch (error) {
		console.error("Error updating user:", error);
		return res.status(500).json({
			status: 500,
			message: "Internal server error",
		});
	}
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
	try {
		const { id } = req.params;

		const user = await knex("users").where("id", id).first();
		if (!user) {
			return res.status(404).json({
				status: 404,
				message: "User not found",
			});
		}

		// Prevent admin from deleting themselves
		if (req.user.user_id === parseInt(id)) {
			return res.status(403).json({
				status: 403,
				message: "Cannot delete your own account",
			});
		}

		await knex("users").where("id", id).del();

		return res.json({
			status: 200,
			message: "User deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting user:", error);
		return res.status(500).json({
			status: 500,
			message: "Internal server error",
		});
	}
};
