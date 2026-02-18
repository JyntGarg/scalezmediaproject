const supabase = require('../config/supabaseClient');
const createError = require("http-errors");
const userService = require("../services/userService");

module.exports = {
  // signAccessToken is now less useful for pure Supabase but kept for compatibility if needed
  signAccessToken: (userId) => {
    // In pure Supabase, we usually use Supabase's own JWTs.
    // If we still need custom tokens, we keep this, but they won't be Supabase-compatible.
    return new Promise((resolve, reject) => {
      // Identity is managed by Supabase now.
      resolve("supabase-session-active");
    });
  },
  verifyAccessToken: async (req, res, next) => {
    try {
      if (!req.headers["authorization"]) return next(createError.Unauthorized());
      const authHeader = req.headers["authorization"];
      const bearerToken = authHeader.split(" ");
      const token = bearerToken[1];

      // Verify with Supabase directly
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        const errorMsg = error?.message || "Unauthorized";
        console.error("Supabase verification error:", errorMsg);

        // Ensure "jwt expired" is returned for the frontend interceptor to handle logout cleanly
        const isExpired = errorMsg.toLowerCase().includes("expired");

        return res.status(401).json({
          message: isExpired ? "jwt expired" : "Unauthorized",
          debug: process.env.NODE_ENV === 'development' ? errorMsg : undefined
        });
      }

      const authUser = data.user;
      req.payload = { aud: authUser.id };

      // Fetch profile from public.users
      let targetUser = await userService.findUserById(authUser.id);
      req.user = targetUser;

      if (!targetUser) {
        const superOwner = await userService.findSuperOwnerById(authUser.id);
        if (!superOwner) {
          return res.status(404).json({
            message: "Admin removed the user",
          });
        }
        req.user = superOwner;
      }

      next();
    } catch (error) {
      console.error("Error in verifyAccessToken:", error);
      return next(createError.InternalServerError());
    }
  },
};
