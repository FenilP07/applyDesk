import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/toekn.util.js";
import { setAuthCookies, clearAuthCookies } from "../utils/cokkies.util.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleSignIn = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ message: "missing credentials" });
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, email_verified } = payload;
    if (!email_verified) {
      return res.status(400).json({ message: "Google email not verified" });
    }
    let user = await User.findOne({
      email,
    }).select("+refreshToken");

    if (!user) {
      user = await User.create({
        googleId,
        email,
        name: name || email.split("@")[0],
        picture: picture || null,
      });
    } else {
      if (!user.googleId) user.googleId = googleId;
      if (name && user.name !== name) user.name = name;
      if (picture && user.picture !== picture) user.picture = picture;
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    setAuthCookies(res, { accessToken, refreshToken });

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Google authentication failed" });
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token)
      return res.status(401).json({ message: "Missing refresh token" });

    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.sub).select(
      "+refreshToken name email role picture",
    );
    if (!user) return res.status(401).json({ message: "User not found" });

    if (!user.refreshToken || user.refreshToken !== token) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Refresh token invalidated" });
    }

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    setAuthCookies(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (err) {
    return res.status(401).json({ message: "Refresh failed" });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        await User.findByIdAndUpdate(decoded.sub, {
          $set: { refreshToken: null },
        });
      } catch (error) {}
      clearAuthCookies(res);
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    clearAuthCookies(res);
    return res.status(200).json({ success: true });
  }
};

const me = async (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
};

export { googleSignIn, refresh, logout, me };
