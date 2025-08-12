/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.createTable("listings", function (table) {
		table.increments("id").primary();
		table.string("name", 255).notNullable();
		table.text("description").nullable();
		table.decimal("latitude", 10, 8).notNullable().comment("Latitude: -90 to 90");
		table.decimal("longitude", 11, 8).notNullable().comment("Longitude: -180 to 180");
		table.integer("user_id").unsigned().notNullable();
		table.timestamps(true, true);

		// Foreign key constraint
		table.foreign("user_id").references("id").inTable("users").onDelete("CASCADE");

		// Add check constraints for latitude and longitude ranges
		table.check("latitude >= -90 AND latitude <= 90");
		table.check("longitude >= -180 AND longitude <= 180");

		// Index for geo queries
		table.index(["latitude", "longitude"]);
		table.index("user_id");
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.schema.dropTable("listings");
};
