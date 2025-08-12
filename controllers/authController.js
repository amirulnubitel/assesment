const knex = require("../knex"); // your configured knex instance
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "replace_me";
const TOKEN_EXPIRES_IN = "24h"; // or 3600s etc

exports.login = async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) return res.status(422).json({ status: 422, message: "Missing credentials" });

	const user = await knex("users").where({ email }).first();
	if (!user) return res.status(401).json({ status: 401, message: "Invalid credentials" });

	const ok = await bcrypt.compare(password, user.password);
	if (!ok) return res.status(401).json({ status: 401, message: "Invalid credentials" });

	// only allow mobile login for role_type = 'u' per your spec
	if (user.role_type !== "u") {
		return res.status(403).json({ status: 403, message: "Forbidden" });
	}

	const payload = { user_id: user.id, role_type: user.role_type };
	const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
	const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString().replace("T", " ").substr(0, 19);

	res.json({
		status: 200,
		message: "Logged in",
		result: {
			user_id: user.id,
			access_token: token,
			token_type: "Bearer",
			role_type: user.role_type,
			expires_at: expiresAt,
		},
	});
};
