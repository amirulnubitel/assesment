const knex = require("../knex");
const { body, validationResult } = require("express-validator");
const axios = require("axios");

// Haversine formula for distance calculation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
	const R = 6371; // Earth's radius in kilometers
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};

// AI Description Generator
const generateDescription = async (locationName) => {
	try {
		// Try OpenAI first
		if (process.env.OPENAI_API_KEY) {
			const response = await axios.post(
				"https://api.openai.com/v1/chat/completions",
				{
					model: "gpt-3.5-turbo",
					messages: [
						{
							role: "user",
							content: `Generate a brief, professional description (max 100 words) for a location named "${locationName}". Focus on what type of place it might be and what visitors can expect.`,
						},
					],
					max_tokens: 150,
					temperature: 0.7,
				},
				{
					headers: {
						Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
						"Content-Type": "application/json",
					},
				}
			);

			return response.data.choices[0].message.content.trim();
		}

		// Fallback to generic description
		return `${locationName} is a point of interest that offers unique experiences for visitors. This location provides various amenities and services for guests to enjoy.`;
	} catch (error) {
		console.error("AI description generation failed:", error.message);
		return `${locationName} is a point of interest that offers unique experiences for visitors.`;
	}
};

// Mobile API: Get listings for normal users (role_type = 'u')
exports.getListings = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const lat = parseFloat(req.query.latitude);
		const lon = parseFloat(req.query.longitude);
		const page = parseInt(req.query.page) || 1;
		const perPage = parseInt(req.query.per_page) || 10;

		if (isNaN(lat) || isNaN(lon)) {
			return res.status(422).json({
				status: 422,
				message: "Valid latitude and longitude are required",
			});
		}

		if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
			return res.status(422).json({
				status: 422,
				message: "Latitude must be between -90 and 90, longitude between -180 and 180",
			});
		}

		const offset = (page - 1) * perPage;

		// Get all listings for the user
		const listings = await knex("listings").where("user_id", userId).select("id", "name", "latitude", "longitude", "created_at", "updated_at");

		// Calculate distances and sort
		const listingsWithDistance = listings.map((listing) => ({
			...listing,
			distance: parseFloat(calculateDistance(lat, lon, listing.latitude, listing.longitude).toFixed(2)),
		}));

		// Sort by distance and paginate
		listingsWithDistance.sort((a, b) => a.distance - b.distance);
		const paginatedData = listingsWithDistance.slice(offset, offset + perPage);

		// Format response
		const data = paginatedData.map((listing) => ({
			id: listing.id,
			name: listing.name,
			distance: listing.distance.toString(),
			created_at: listing.created_at,
			updated_at: listing.updated_at,
		}));

		return res.json({
			status: 200,
			message: "Success",
			result: {
				current_page: page,
				data,
			},
		});
	} catch (error) {
		console.error("Error getting listings:", error);
		return res.status(500).json({
			status: 500,
			message: "Internal server error",
		});
	}
};

// Admin API: Get all listings for admin panel
exports.getAdminListings = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const perPage = parseInt(req.query.per_page) || 10;
		const offset = (page - 1) * perPage;

		const listings = await knex("listings").join("users", "listings.user_id", "users.id").select("listings.*", "users.name as user_name", "users.email as user_email").limit(perPage).offset(offset).orderBy("listings.created_at", "desc");

		const total = await knex("listings").count("id as count").first();

		return res.json({
			status: 200,
			message: "Success",
			result: {
				current_page: page,
				per_page: perPage,
				total: total.count,
				data: listings,
			},
		});
	} catch (error) {
		console.error("Error getting admin listings:", error);
		return res.status(500).json({
			status: 500,
			message: "Internal server error",
		});
	}
};

// Validation rules
exports.validateListing = [
	body("name").trim().isLength({ min: 1, max: 255 }).withMessage("Name is required and must be less than 255 characters"),
	body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),
	body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
	body("user_id").optional().isInt({ min: 1 }).withMessage("User ID must be a positive integer"),
	body("description").optional().isLength({ max: 1000 }).withMessage("Description must be less than 1000 characters"),
];

// Admin API: Create listing
exports.createListing = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				status: 422,
				message: "Validation failed",
				errors: errors.array(),
			});
		}

		let { name, latitude, longitude, user_id, description } = req.body;

		// Validate user exists
		const user = await knex("users").where("id", user_id).first();
		if (!user) {
			return res.status(404).json({
				status: 404,
				message: "User not found",
			});
		}

		// Generate AI description if not provided
		if (!description) {
			description = await generateDescription(name);
		}

		const [listingId] = await knex("listings").insert({
			name,
			description,
			latitude,
			longitude,
			user_id,
		});

		const listing = await knex("listings").where("id", listingId).first();

		return res.status(201).json({
			status: 201,
			message: "Listing created successfully",
			result: listing,
		});
	} catch (error) {
		console.error("Error creating listing:", error);
		return res.status(500).json({
			status: 500,
			message: "Internal server error",
		});
	}
};

// Admin API: Update listing
exports.updateListing = async (req, res) => {
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
		const { name, latitude, longitude, user_id, description } = req.body;

		// Check if listing exists
		const existingListing = await knex("listings").where("id", id).first();
		if (!existingListing) {
			return res.status(404).json({
				status: 404,
				message: "Listing not found",
			});
		}

		// Validate user exists if user_id is being updated
		if (user_id) {
			const user = await knex("users").where("id", user_id).first();
			if (!user) {
				return res.status(404).json({
					status: 404,
					message: "User not found",
				});
			}
		}

		const updateData = {};
		if (name !== undefined) updateData.name = name;
		if (latitude !== undefined) updateData.latitude = latitude;
		if (longitude !== undefined) updateData.longitude = longitude;
		if (user_id !== undefined) updateData.user_id = user_id;
		if (description !== undefined) updateData.description = description;

		// Generate AI description if name changed but no description provided
		if (name && !description) {
			updateData.description = await generateDescription(name);
		}

		await knex("listings").where("id", id).update(updateData);

		const updatedListing = await knex("listings").where("id", id).first();

		return res.json({
			status: 200,
			message: "Listing updated successfully",
			result: updatedListing,
		});
	} catch (error) {
		console.error("Error updating listing:", error);
		return res.status(500).json({
			status: 500,
			message: "Internal server error",
		});
	}
};

// Admin API: Delete listing
exports.deleteListing = async (req, res) => {
	try {
		const { id } = req.params;

		const listing = await knex("listings").where("id", id).first();
		if (!listing) {
			return res.status(404).json({
				status: 404,
				message: "Listing not found",
			});
		}

		await knex("listings").where("id", id).del();

		return res.json({
			status: 200,
			message: "Listing deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting listing:", error);
		return res.status(500).json({
			status: 500,
			message: "Internal server error",
		});
	}
};

// Admin API: Get single listing
exports.getListing = async (req, res) => {
	try {
		const { id } = req.params;

		const listing = await knex("listings").join("users", "listings.user_id", "users.id").select("listings.*", "users.name as user_name", "users.email as user_email").where("listings.id", id).first();

		if (!listing) {
			return res.status(404).json({
				status: 404,
				message: "Listing not found",
			});
		}

		return res.json({
			status: 200,
			message: "Success",
			result: listing,
		});
	} catch (error) {
		console.error("Error getting listing:", error);
		return res.status(500).json({
			status: 500,
			message: "Internal server error",
		});
	}
};
