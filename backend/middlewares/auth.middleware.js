import { verifyAccessToken } from "../utils/toekn.util.js";
import User from "../models/user.model.js";

const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token)
      return res.status(401).json({
        message: "Not authenticated",
      });

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.sub).select(
      "name email picture inboundPrefix",
    );
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export { isLoggedIn };
