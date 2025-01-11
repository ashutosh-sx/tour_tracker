const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    // Check for token in both authorization and Authorization headers
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    
    // Log headers for debugging
    console.log('Headers received:', req.headers);
    
    if (!authHeader) {
        return res.status(401).json({
            error: true,
            message: "Access token is required"
        });
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({
            error: true,
            message: "Bearer token is missing"
        });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification error:', err);
            return res.status(401).json({
                error: true,
                message: "Invalid or expired token"
            });
        }
        
        req.user = user;
        next();
    });
}

module.exports = {
    authenticateToken,
};