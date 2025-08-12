const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "replace_me";

function authMiddleware(allowRoles = []) {
	return (req, res, next) => {
		// token in header Authorization: Bearer <token> or query param access_token
		const header = req.headers.authorization || "";
		const token = header.startsWith("Bearer ") ? header.split(" ")[1] : req.query.access_token || req.headers["x-access-token"];

		if (!token) return res.status(401).json({ status: 401, message: "Missing token" });

		try {
			const payload = jwt.verify(token, JWT_SECRET);
			// check role if allowRoles specified
			if (allowRoles.length && !allowRoles.includes(payload.role_type)) {
				return res.status(403).json({ status: 403, message: "Forbidden" });
			}
			req.user = payload;
			next();
		} catch (err) {
			return res.status(401).json({ status: 401, message: "Invalid/Expired token" });
		}
	};
}

module.exports = authMiddleware;
