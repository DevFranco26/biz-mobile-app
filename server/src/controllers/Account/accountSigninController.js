const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("@config/database");
const { JWT_SECRET } = require("@config/env");

/**
 * GET /api/account/get-user-email?email=...
 * Checks if the provided email exists and returns user info.
 */
const getUserEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const users = await prisma.user.findMany({
      where: { email: normalizedEmail },
      include: { company: { select: { id: true, name: true } } },
    });
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found with this email." });
    }
    const result = users.map((user) => ({
      userId: user.id,
      email: user.email,
      username: user.username,
      companyId: user.companyId,
      companyName: user.company ? user.company.name : null,
    }));
    return res.status(200).json({ message: "Users found.", data: result });
  } catch (error) {
    console.error("Error in getUserEmail:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/account/profile
 * Retrieves an organized profile for the currently signed‑in user.
 * Returns: { user, profile, company, subscription }
 */
const getUserProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided." });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid token." });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid token." });
    }
    const { userId, companyId } = decoded;
    if (!userId || !companyId) {
      return res.status(400).json({ message: "Token missing userId or companyId." });
    }
    // Query user along with profile, company and active subscription.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        company: true,
        Subscription: {
          where: { active: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { plan: true },
        },
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    let latestSubscription = user.Subscription && user.Subscription.length > 0 ? user.Subscription[0] : null;
    if (!latestSubscription) {
      // Fallback: Try to retrieve subscription via company.
      const companyWithSub = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          Subscription: {
            where: { active: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { plan: true },
          },
        },
      });
      latestSubscription = companyWithSub && companyWithSub.Subscription && companyWithSub.Subscription.length > 0 ? companyWithSub.Subscription[0] : null;
    }
    // Exclude sensitive fields
    const { password, Subscription, ...userData } = user;
    return res.status(200).json({
      message: "User profile retrieved successfully.",
      data: {
        user: userData,
        profile: user.profile,
        company: user.company,
        subscription: latestSubscription,
      },
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/account/sign-in?email=...&password=...&companyId=...
 * Authenticates a user and returns a JWT.
 */
const signIn = async (req, res) => {
  try {
    const { email, password, companyId } = req.query;
    if (!email || !password || !companyId) {
      return res.status(400).json({ message: "Email, password, and companyId are required." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail, companyId },
      include: { company: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });
    if (!JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret is not configured." });
    }
    const tokenPayload = { userId: user.id, companyId: user.companyId };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "30d" });
    return res.status(200).json({ message: "Sign-in successful.", data: { token } });
  } catch (error) {
    console.error("Error in signIn:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * POST /api/account/sign-out
 * Dummy sign-out endpoint.
 */
const signOut = (req, res) => {
  return res.status(200).json({ message: "Signed out successfully." });
};

module.exports = {
  getUserEmail,
  getUserProfile,
  signIn,
  signOut,
};
