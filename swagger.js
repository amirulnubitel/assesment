// Swagger definition for your Express API
module.exports = {
	openapi: "3.0.0",
	info: {
		title: "Listings API",
		version: "1.0.0",
		description: "RESTful API for location-based listings with distance calculation and admin management",
		contact: {
			name: "API Support",
			email: "support@example.com",
		},
	},
	servers: [
		{
			url: "http://localhost:3002",
			description: "Development server",
		},
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
			},
		},
		schemas: {
			User: {
				type: "object",
				properties: {
					id: {
						type: "integer",
						example: 1,
					},
					name: {
						type: "string",
						example: "John Doe",
					},
					email: {
						type: "string",
						example: "user@example.com",
					},
					role_type: {
						type: "string",
						enum: ["u", "a"],
						example: "u",
						description: "u = user, a = admin",
					},
					created_at: {
						type: "string",
						format: "date-time",
					},
					updated_at: {
						type: "string",
						format: "date-time",
					},
				},
			},
			Listing: {
				type: "object",
				properties: {
					id: {
						type: "integer",
						example: 1,
					},
					name: {
						type: "string",
						example: "Starbucks Mid Valley",
					},
					description: {
						type: "string",
						example: "Coffee shop located in Mid Valley Megamall",
					},
					latitude: {
						type: "number",
						minimum: -90,
						maximum: 90,
						example: 3.1189,
					},
					longitude: {
						type: "number",
						minimum: -180,
						maximum: 180,
						example: 101.6767,
					},
					user_id: {
						type: "integer",
						example: 1,
					},
					created_at: {
						type: "string",
						format: "date-time",
					},
					updated_at: {
						type: "string",
						format: "date-time",
					},
				},
			},
			LoginRequest: {
				type: "object",
				required: ["email", "password"],
				properties: {
					email: {
						type: "string",
						format: "email",
						example: "user@example.com",
					},
					password: {
						type: "string",
						example: "password123",
					},
				},
			},
			LoginResponse: {
				type: "object",
				properties: {
					status: {
						type: "integer",
						example: 200,
					},
					message: {
						type: "string",
						example: "Logged in",
					},
					result: {
						type: "object",
						properties: {
							user_id: {
								type: "integer",
								example: 1,
							},
							access_token: {
								type: "string",
								example: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
							},
							token_type: {
								type: "string",
								example: "Bearer",
							},
							role_type: {
								type: "string",
								example: "u",
							},
							expires_at: {
								type: "string",
								example: "2023-03-16 12:31:39",
							},
						},
					},
				},
			},
			ListingsResponse: {
				type: "object",
				properties: {
					status: {
						type: "integer",
						example: 200,
					},
					message: {
						type: "string",
						example: "Success",
					},
					result: {
						type: "object",
						properties: {
							current_page: {
								type: "integer",
								example: 1,
							},
							data: {
								type: "array",
								items: {
									type: "object",
									properties: {
										id: {
											type: "integer",
											example: 4,
										},
										name: {
											type: "string",
											example: "Starbucks Mid Valley",
										},
										distance: {
											type: "string",
											example: "0.6",
											description: "Distance in kilometers",
										},
										created_at: {
											type: "string",
											format: "date-time",
										},
										updated_at: {
											type: "string",
											format: "date-time",
										},
									},
								},
							},
						},
					},
				},
			},
			ErrorResponse: {
				type: "object",
				properties: {
					status: {
						type: "integer",
						example: 400,
					},
					message: {
						type: "string",
						example: "Error message",
					},
					errors: {
						type: "array",
						items: {
							type: "object",
						},
					},
				},
			},
		},
	},
	tags: [
		{
			name: "Mobile API",
			description: "API endpoints for mobile applications (role_type = 'u')",
		},
		{
			name: "Admin API",
			description: "API endpoints for admin panel (role_type = 'a')",
		},
	],
	paths: {
		"/api/login": {
			post: {
				tags: ["Mobile API"],
				summary: "Mobile user login",
				description: "Authenticate mobile users with role_type = 'u'",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/LoginRequest",
							},
						},
					},
				},
				responses: {
					200: {
						description: "Login successful",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/LoginResponse",
								},
							},
						},
					},
					401: {
						description: "Invalid credentials",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
					403: {
						description: "Forbidden - User role not allowed for mobile access",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
					422: {
						description: "Validation error",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/listing/get": {
			get: {
				tags: ["Mobile API"],
				summary: "Get listings with distance calculation",
				description: "Retrieve user's listings ordered by distance from provided coordinates",
				security: [
					{
						bearerAuth: [],
					},
				],
				parameters: [
					{
						in: "query",
						name: "latitude",
						required: true,
						schema: {
							type: "number",
							minimum: -90,
							maximum: 90,
						},
						example: 3.12112,
						description: "Current latitude for distance calculation",
					},
					{
						in: "query",
						name: "longitude",
						required: true,
						schema: {
							type: "number",
							minimum: -180,
							maximum: 180,
						},
						example: 101.67905,
						description: "Current longitude for distance calculation",
					},
					{
						in: "query",
						name: "page",
						schema: {
							type: "integer",
							minimum: 1,
						},
						example: 1,
						description: "Page number for pagination",
					},
					{
						in: "query",
						name: "per_page",
						schema: {
							type: "integer",
							minimum: 1,
							maximum: 100,
						},
						example: 10,
						description: "Number of items per page",
					},
				],
				responses: {
					200: {
						description: "Listings retrieved successfully",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ListingsResponse",
								},
							},
						},
					},
					401: {
						description: "Unauthorized - Invalid or missing token",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
					403: {
						description: "Forbidden - Admin users cannot access this endpoint",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
					422: {
						description: "Validation error - Invalid coordinates",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/admin/login": {
			post: {
				tags: ["Admin API"],
				summary: "Admin login",
				description: "Authenticate admin users with role_type = 'a'",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/LoginRequest",
							},
						},
					},
				},
				responses: {
					200: {
						description: "Admin login successful",
					},
					401: {
						description: "Invalid credentials",
					},
					403: {
						description: "Admin access required",
					},
				},
			},
		},
		"/api/admin/dashboard": {
			get: {
				tags: ["Admin API"],
				summary: "Get dashboard statistics",
				security: [
					{
						bearerAuth: [],
					},
				],
				responses: {
					200: {
						description: "Dashboard stats retrieved successfully",
					},
				},
			},
		},
		"/api/admin/listings": {
			get: {
				tags: ["Admin API"],
				summary: "Get all listings (admin)",
				security: [
					{
						bearerAuth: [],
					},
				],
				responses: {
					200: {
						description: "Listings retrieved successfully",
					},
				},
			},
			post: {
				tags: ["Admin API"],
				summary: "Create new listing",
				security: [
					{
						bearerAuth: [],
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["name", "latitude", "longitude", "user_id"],
								properties: {
									name: {
										type: "string",
										example: "New Restaurant",
									},
									description: {
										type: "string",
										example: "Great food and atmosphere",
									},
									latitude: {
										type: "number",
										minimum: -90,
										maximum: 90,
										example: 3.1189,
									},
									longitude: {
										type: "number",
										minimum: -180,
										maximum: 180,
										example: 101.6767,
									},
									user_id: {
										type: "integer",
										example: 1,
									},
								},
							},
						},
					},
				},
				responses: {
					201: {
						description: "Listing created successfully",
					},
				},
			},
		},
		"/api/admin/listings/{id}": {
			get: {
				tags: ["Admin API"],
				summary: "Get single listing",
				security: [
					{
						bearerAuth: [],
					},
				],
				parameters: [
					{
						in: "path",
						name: "id",
						required: true,
						schema: {
							type: "integer",
						},
					},
				],
				responses: {
					200: {
						description: "Listing retrieved successfully",
					},
					404: {
						description: "Listing not found",
					},
				},
			},
			put: {
				tags: ["Admin API"],
				summary: "Update listing",
				security: [
					{
						bearerAuth: [],
					},
				],
				parameters: [
					{
						in: "path",
						name: "id",
						required: true,
						schema: {
							type: "integer",
						},
					},
				],
				responses: {
					200: {
						description: "Listing updated successfully",
					},
				},
			},
			delete: {
				tags: ["Admin API"],
				summary: "Delete listing",
				security: [
					{
						bearerAuth: [],
					},
				],
				parameters: [
					{
						in: "path",
						name: "id",
						required: true,
						schema: {
							type: "integer",
						},
					},
				],
				responses: {
					200: {
						description: "Listing deleted successfully",
					},
				},
			},
		},
		"/api/admin/users": {
			get: {
				tags: ["Admin API"],
				summary: "Get all users",
				security: [
					{
						bearerAuth: [],
					},
				],
				responses: {
					200: {
						description: "Users retrieved successfully",
					},
				},
			},
			post: {
				tags: ["Admin API"],
				summary: "Create new user",
				security: [
					{
						bearerAuth: [],
					},
				],
				responses: {
					201: {
						description: "User created successfully",
					},
				},
			},
		},
	},
};
