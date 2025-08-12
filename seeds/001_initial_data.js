const bcrypt = require("bcrypt");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
	// Deletes ALL existing entries
	await knex("listings").del();
	await knex("users").del();

	// Insert users
	const hashedPassword = await bcrypt.hash("password123", 10);
	const adminPassword = await bcrypt.hash("admin123", 10);

	const userIds = await knex("users").insert([
		{
			id: 1,
			name: "John Doe",
			email: "user@example.com",
			password: hashedPassword,
			role_type: "u",
		},
		{
			id: 2,
			name: "Admin User",
			email: "admin@example.com",
			password: adminPassword,
			role_type: "a",
		},
		{
			id: 3,
			name: "Jane Smith",
			email: "jane@example.com",
			password: hashedPassword,
			role_type: "u",
		},
	]);

	// Insert sample listings (around Kuala Lumpur area)
	await knex("listings").insert([
		{
			name: "Starbucks Mid Valley",
			description: "Coffee shop located in Mid Valley Megamall",
			latitude: 3.1189,
			longitude: 101.6767,
			user_id: 1,
		},
		{
			name: "Burger King",
			description: "Fast food restaurant serving burgers and fries",
			latitude: 3.1205,
			longitude: 101.6785,
			user_id: 1,
		},
		{
			name: "Pizza Hut",
			description: "Italian-American restaurant chain serving pizza",
			latitude: 3.158,
			longitude: 101.7123,
			user_id: 1,
		},
		{
			name: "Sunway Pyramid",
			description: "Large shopping mall with retail stores and entertainment",
			latitude: 3.0733,
			longitude: 101.6067,
			user_id: 1,
		},
		{
			name: "KLCC Twin Towers",
			description: "Iconic twin skyscrapers and shopping center",
			latitude: 3.1581,
			longitude: 101.7117,
			user_id: 2,
		},
		{
			name: "Pavilion KL",
			description: "Upscale shopping mall in Bukit Bintang",
			latitude: 3.1494,
			longitude: 101.7131,
			user_id: 3,
		},
	]);
};
