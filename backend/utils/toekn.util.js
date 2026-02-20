import jwt from "jsonwebtoken";

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" },
  );

const signRefreshToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "30d" },
  );

const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

export {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
