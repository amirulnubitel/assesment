const knex = require("./knex");

async function setup() {
	try {
		console.log("🚀 Starting database setup...");

		// Drop tables if they exist (in correct order due to foreign keys)
		console.log("📋 Dropping existing tables...");
		try {
			await knex.schema.dropTableIfExists("listings");
			await knex.schema.dropTableIfExists("users");
			console.log("✅ Existing tables dropped successfully");
		} catch (error) {
			console.log("ℹ️ No existing tables to drop");
		}

		// Create users table
		console.log("👥 Creating users table...");
		await knex.schema.createTable("users", function (table) {
			table.increments("id").primary();
			table.string("name", 255).notNullable();
			table.string("email", 255).notNullable().unique();
			table.string("password", 255).notNullable();
			table.enum("role_type", ["u", "a"]).defaultTo("u").comment("u = user, a = admin");
			table.timestamps(true, true);
		});
		console.log("✅ Users table created successfully");

		// Create listings table
		console.log("📍 Creating listings table...");
		await knex.schema.createTable("listings", function (table) {
			table.increments("id").primary();
			table.string("name", 255).notNullable();
			table.text("description").nullable();
			table.decimal("latitude", 10, 8).notNullable().comment("Latitude: -90 to 90");
			table.decimal("longitude", 11, 8).notNullable().comment("Longitude: -180 to 180");
			table.integer("user_id").unsigned().notNullable();
			table.timestamps(true, true);

			// Foreign key constraint
			table.foreign("user_id").references("id").inTable("users").onDelete("CASCADE");

			// Index for geo queries
			table.index(["latitude", "longitude"]);
			table.index("user_id");
		});
		console.log("✅ Listings table created successfully");

		// Seed data
		console.log("🌱 Seeding database with sample data...");

		const bcrypt = require("bcrypt");

		// Insert users
		const hashedPassword = await bcrypt.hash("password123", 10);
		const adminPassword = await bcrypt.hash("admin123", 10);

		await knex("users").insert([
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
		console.log("✅ Users seeded successfully");

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
		console.log("✅ Listings seeded successfully");

		console.log("🎉 Database setup completed successfully!");
		console.log("");
		console.log("📊 Sample data created:");
		console.log("   👥 3 users (1 admin, 2 regular users)");
		console.log("   📍 6 sample listings around Kuala Lumpur");
		console.log("");
		console.log("🔑 Login credentials:");
		console.log("   Admin: admin@example.com / admin123");
		console.log("   User: user@example.com / password123");
		console.log("   User: jane@example.com / password123");
		console.log("");
		console.log("🌐 Access points:");
		console.log("   Admin Panel: http://localhost:3000/admin");
		console.log("   API Docs: http://localhost:3000/api-docs");
	} catch (error) {
		console.error("❌ Database setup failed:", error.message);
		console.error(error);
	} finally {
		await knex.destroy();
		process.exit(0);
	}
}

setup();
