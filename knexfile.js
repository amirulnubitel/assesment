require("dotenv").config();

module.exports = {
	development: {
		client: "mysql2",
		connection: {
			host: process.env.DB_HOST || "127.0.0.1",
			port: process.env.DB_PORT || 3306,
			user: process.env.DB_USER || "root",
			password: process.env.DB_PASS || "",
			database: process.env.DB_NAME || "listings_db",
			charset: "utf8mb4",
		},
		migrations: {
			directory: "./migrations",
			tableName: "migrations",
		},
		seeds: {
			directory: "./seeds",
		},
	},

	production: {
		client: "mysql2",
		connection: {
			host: process.env.DB_HOST,
			port: process.env.DB_PORT || 3306,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME,
			charset: "utf8mb4",
		},
		migrations: {
			directory: "./migrations",
			tableName: "migrations",
		},
		seeds: {
			directory: "./seeds",
		},
	},
};
