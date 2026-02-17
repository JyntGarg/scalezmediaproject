const userService = require("../services/userService");
const createError = require("http-errors");
const { signAccessToken } = require("../helpers/jwt_helper");
const bcrypt = require("bcryptjs");
const { uploadAvatar, uploadFeviconIcon, uploadLogo } = require("../helpers/avatar_upload");
const fs = require("fs");
const { checkRole } = require("../helpers/role_helper");
const axios = require("axios");
const { sendResetPasswordEmail } = require("../helpers/email_helper");
const supabase = require('../config/supabaseClient');

function makeid(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

module.exports = {
  // create a new user
  create: async (req, res, next) => {
    try {
      const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
      const { password, firstName, lastName, designation, organization: company } = req.body;

      // 1. Create user with Supabase Auth Admin to bypass email confirmation
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) {
        return res.status(400).json({
          success: false,
          message: authError.message,
        });
      }

      if (!authData.user) {
        return res.status(400).json({
          success: false,
          message: "Registration failed",
        });
      }

      // If no role provided, find the "owner" role
      let roleId = req.body.role;
      if (!roleId) {
        const { data: ownerRole } = await supabase.from('roles').select('id').eq('name', 'Owner').single();
        if (ownerRole) {
          roleId = ownerRole.id;
        }
      }

      // 2. Create the user profile in public.users table
      const user = await userService.createUser({
        id: authData.user.id, // Use the UUID from Supabase Auth
        firstName,
        lastName,
        email,
        password: "", // Don't store plain/hashed password in public.users if using Supabase Auth
        role: roleId,
        designation: designation || "Owner",
        company: company
      });

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user.id || user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          designation: user.designation,
        },
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  //   login
  login: async (req, res, next) => {
    try {
      // Normalize email: trim whitespace and convert to lowercase
      const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
      const password = req.body.password || "";

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      console.log("🔍 Attempting login for email:", email);

      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.log("❌ Supabase Auth error for", email, ":", authError.message);
        console.log("Supabase URL used:", process.env.SUPABASE_URL);
        return res.status(401).json({
          success: false,
          message: authError.message,
          debug: {
            email: email,
            errorType: authError.name || "AuthError"
          }
        });
      }

      const user = await userService.findUserByEmail(email);

      if (!user) {
        console.log("❌ User profile not found for email:", email);
        return res.status(404).json({
          success: false,
          message: "User profile not found",
        });
      }

      console.log("✅ User authenticated and profile found:", user.email);

      await userService.updateUser(user.id, { lastLogin: new Date() });

      // We can use the Supabase token or our custom JWT. 
      // Using custom JWT for now to minimize frontend changes.
      const token = await signAccessToken(user.id);

      res.status(200).json({
        message: "User logged in successfully",
        token: token,
        supabaseAccessToken: authData.session.access_token, // Optionally provide this
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          designation: user.designation,
          avatar: user.avatar,
          widgets: user.widgets,
          company: user.company,
          timezone: user.timezone,
          address: user.address,
          address2: user.address2,
          city: user.city,
          state: user.state,
          zip: user.zip,
          country: user.country,
          currency: user.currency,
          domain: user.domain,
          fevicon: user.fevicon,
          logo: user.logo,
        },
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  sendForgotPasswordLink: async (req, res) => {
    try {
      // Get validated data
      const email = req.body.email ? req.body.email.trim().toLowerCase() : "";

      // Check if this user exists
      // const user = await User.findOne({ email: email });
      const user = await userService.findUserByEmail(email);
      if (!user) {
        return res.status(400).json({
          message: "This email is not associated with any account",
        });
      }

      // Generate new reset password token
      let resetPasswordToken = makeid(32);

      await userService.updateUser(user.id, {
        resetPasswordToken: resetPasswordToken,
        resetPasswordRequested: true,
        resetPasswordRequestedOn: new Date(),
        resetPasswordTokenUsed: false
      });

      // Send reset password email
      try {
        await sendResetPasswordEmail(email, resetPasswordToken);
        console.log(`Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send reset password email:', emailError);
        // Don't fail the request if email sending fails, just log it
      }

      return res.status(200).json({
        message: "Reset password link has been sent to your email",
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Failed to process password reset request",
        data: { error: e.message },
      });
    }
  },

  setNewPassword: async (req, res) => {
    try {
      // Get validated data
      const { resetPasswordToken, newPassword } = req.body;

      // Check if this user exists
      // const user = await User.findOne({ resetPasswordToken: resetPasswordToken });
      const user = await userService.findUserByToken(resetPasswordToken);

      if (!user) {
        return res.status(400).json({
          message: "Invalid Token",
        });
      }

      // Update password
      const passwordSalt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, passwordSalt);

      await userService.updateUser(user.id, {
        resetPasswordTokenUsed: true,
        password: hashedPassword,
        // loginSessionId: makeid(32), // Not in supabase schema yet, maybe add or ignore? Ignoring for now
        // salt: ""
      });

      return res.status(200).json({
        message: "Password updated successfully",
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Reset password request sent successfully",
        data: { error: e.message },
      });
    }
  },

  // update profile picture
  updateProfilePicture: async (req, res, next) => {
    try {
      uploadAvatar(req, res, async (err) => {
        if (err) {
          next(err);
          console.log(err);
        } else {
          const path = req.file.path.replace(/\\/g, "/");
          // const existingUser = await User.findById(req.payload.aud);
          const existingUser = await userService.findUserById(req.payload.aud);

          if (existingUser.avatar && existingUser.avatar !== "uploads/default.png") {
            try {
              fs.unlink(existingUser.avatar.replace(/\\/g, "/"), (err) => {
                if (err) {
                  // next(err); // Don't crash if file not found
                  console.error("Failed to delete old avatar:", err);
                }
              });
            } catch (fsErr) {
              console.error("FS Error:", fsErr);
            }
          }

          // await User.updateOne({ _id: req.payload.aud }, { avatar: path });
          await userService.updateUser(req.payload.aud, { avatar: path });

          // const user = await User.findById(req.payload.aud).populate("role");
          const user = await userService.findUserById(req.payload.aud);

          res.status(200).json({
            message: "Profile picture updated successfully",
            user: {
              id: user.id || user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role,
              designation: user.designation,
              avatar: user.avatar,
              company: user.company,
              timezone: user.timezone,
              address: user.address,
              address2: user.address2,
              city: user.city,
              state: user.state,
              zip: user.zip,
              country: user.country,
              currency: user.currency,
              domain: user.domain,
              fevicon: user.fevicon,
              logo: user.logo,
            },
          });
        }
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // delete profile picture
  deleteProfilePicture: async (req, res, next) => {
    try {
      //   const existingUser = await User.findById(req.payload.aud);
      const existingUser = await userService.findUserById(req.payload.aud);

      if (existingUser.avatar && existingUser.avatar !== "uploads/default.png") {
        try {
          fs.unlink(existingUser.avatar.replace(/\\/g, "/"), (err) => {
            if (err) {
              // next(err);
              console.error(err);
            }
          });
        } catch (fsErr) { console.error(fsErr); }
      }

      // await User.updateOne({ _id: req.payload.aud }, { avatar: "uploads/default.png" });
      await userService.updateUser(req.payload.aud, { avatar: "uploads/default.png" });

      // const user = await User.findById(req.payload.aud).populate("role");
      const user = await userService.findUserById(req.payload.aud);

      res.status(200).json({
        message: "Profile picture deleted successfully",
        user: {
          id: user.id || user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          designation: user.designation,
          avatar: user.avatar,
          company: user.company,
          timezone: user.timezone,
          address: user.address,
          address2: user.address2,
          city: user.city,
          state: user.state,
          zip: user.zip,
          country: user.country,
          currency: user.currency,
          domain: user.domain,
          fevicon: user.fevicon,
          logo: user.logo,
        },
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // read users
  read: async (req, res, next) => {
    try {
      const role = await checkRole(req.payload.aud);
      if (role.name.toLowerCase() !== "admin") {
        throw createError(401, "Unauthorized");
      }
      // const users = await User.find();
      const users = await userService.findAllUsers();

      res.status(200).json({
        message: "Users retrieved successfully",
        users: users.map((user) => {
          return {
            id: user.id || user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            designation: user.designation,
            avatar: user.avatar,
          };
        }),
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // read profile with invite token
  readProfileByToken: async (req, res, next) => {
    try {
      // const user = await User.findOne({ token: req.params.token }).populate("owner").populate("role");
      const user = await userService.findUserByToken(req.params.token);

      if (!user) {
        throw createError(404, "User not found");
      }
      res.status(200).json({
        message: "User retrieved successfully",
        user: {
          id: user.id || user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          designation: user.designation,
          avatar: user.avatar,
        },
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // update profile with invite token
  updateProfileByToken: async (req, res, next) => {
    try {
      const user = await userService.findUserByToken(req.params.token);

      if (!user) {
        throw createError(404, "User not found");
      }

      // 1. Create user with Supabase Auth Admin to bypass email confirmation
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: req.body.password,
        email_confirm: true
      });

      if (authError) {
        return res.status(400).json({
          success: false,
          message: authError.message,
        });
      }

      const newUserId = authData.user.id;

      // 2. Update the existing profile in public.users
      // Note: We might need to update the ID if it's different, but that's complex.
      // For now, let's assume we can at least update the other fields.
      // If we want to be clean, we should have created the auth user first.

      await userService.updateUser(user.id, {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: "", // Handled by Supabase Auth
        token: "",
        status: "enabled",
        joined: new Date(),
        employees: req.body.employees,
        company: req.body.company,
        phone: req.body.phone,
        industry: req.body.industry,
      });

      const token = await signAccessToken(user.id);

      const roleName = user.role?.name?.toLowerCase() || "";
      let permission = roleName === "owner" ?
        {
          company_access: true,
          create_workspace: true,
          create_actionPlans: true,
          share_ideas: true,
          add_teammates: true,
          // add_collaborators: true,
          create_project: true,
          delete_project: true,
          create_goals: true,
          create_ideas: true,
          create_tests: true,
          create_learnings: true,
          create_comments: true,
          mention_everyone: true,
        } : roleName === "admin" ?
          {
            company_access: true,
            create_workspace: true,
            create_actionPlans: true,
            share_ideas: true,
            add_teammates: true,
            // add_collaborators: true,
            create_project: true,
            delete_project: true,
            create_goals: true,
            create_ideas: true,
            create_tests: true,
            create_learnings: true,
            create_comments: true,
            mention_everyone: true,
          }
          :
          roleName === "member" ?
            {
              create_actionPlans: true,
              create_goals: true,
              create_ideas: true,
              create_tests: true,
              create_learnings: true,
              create_comments: true,
              mention_everyone: true,
            } :
            roleName === "viewer" ?
              {} : {}

      let metricsData = [{
        name: "Bounce Rate",
        shortName: "BR",
        metricType: "Rate",
        mode: "default"
      },
      {
        name: "Click Through Rate",
        shortName: "CTR",
        metricType: "Rate",
        mode: "default"
      },
      {
        name: "Conversion Rate",
        shortName: "CR",
        metricType: "Rate",
        mode: "default"
      },
      {
        name: "Cost Per Acquisition",
        shortName: "CPA",
        metricType: "Currency",
        mode: "default"
      },
      {
        name: "Cost Per Lead",
        shortName: "CPL",
        metricType: "Currency",
        mode: "default"
      },
      {
        name: "Monthly Revenue Rate",
        shortName: "MRR",
        metricType: "Rate",
        mode: "default"
      }
      ];

      if (roleName === "owner") {
        const metricsToInsert = metricsData.map(x => ({
          name: x.name,
          short_name: x.shortName,
          metric_type: x.metricType,
          mode: x.mode,
          owner_id: user.id
        }));

        const { error: kmError } = await supabase.from('keymetrics').insert(metricsToInsert);
        if (kmError) console.error("Error creating default keymetrics:", kmError);
      }

      // let levers = await Lever.find().populate("createdBy", "-password");
      let levers = [];
      const { data: leversData, error: lError } = await supabase
        .from('levers')
        .select('*, createdBy:users!created_by(id, first_name, last_name, email, avatar)');

      if (!lError && leversData) {
        levers = leversData.map(l => ({
          ...l,
          createdBy: l.createdBy ? {
            id: l.createdBy.id,
            firstName: l.createdBy.first_name,
            lastName: l.createdBy.last_name,
            email: l.createdBy.email,
            avatar: l.createdBy.avatar
          } : null
        }));
      }

      // Keymetrics fetch
      let keyMetrics = [];
      const ownerId = user.owner || user.id;
      if (ownerId) {
        const { data: kmData, error: kmDataError } = await supabase
          .from('keymetrics')
          .select('*, createdBy:users!created_by(id, first_name, last_name, email, avatar)')
          .eq('owner_id', ownerId);

        if (!kmDataError && kmData) {
          keyMetrics = kmData.map(km => ({
            ...km,
            id: km.id,
            _id: km.id,
            shortName: km.short_name,
            metricType: km.metric_type,
            createdBy: km.createdBy ? {
              id: km.createdBy.id,
              firstName: km.createdBy.first_name,
              lastName: km.createdBy.last_name,
              email: km.createdBy.email,
              avatar: km.createdBy.avatar
            } : null
          }));
        }
      }


      res.status(200).json({
        message: "Profile updated successfully, proceed to login",
        token: token,
        user: {
          id: user.id || user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          designation: user.designation,
          avatar: user.avatar,
          widgets: user.widgets,
          permissions: permission,
          levers: levers,
          keyMetrics: keyMetrics,
          company: user.company,
        },
      });

    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // update profile
  updateProfile: async (req, res, next) => {
    try {
      // const existingUser = await User.findById(req.payload.aud).populate("role");
      const existingUser = await userService.findUserById(req.payload.aud);

      // email
      if (req.body.email) {
        // const user = await User.findOne({ email: req.body.email }).populate("role");
        const user = await userService.findUserByEmail(req.body.email);

        if (user && user.id !== existingUser.id) {
          throw createError(409, "Email already exists");
        }
      }

      // await User.updateOne(...)
      await userService.updateUser(req.payload.aud, {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        designation: req.body.designation,
        about: req.body.about,
      });

      // const user = await User.findById(req.payload.aud).populate("role");
      const user = await userService.findUserById(req.payload.aud);

      res.status(200).json({
        message: "Profile updated successfully",
        user: {
          id: user.id || user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          designation: user.designation,
          avatar: user.avatar,
          about: user.about,
          widgets: user.widgets,
          company: user.company,
          timezone: user.timezone,
          address: user.address,
          address2: user.address2,
          city: user.city,
          state: user.state,
          zip: user.zip,
          country: user.country,
          currency: user.currency,
          domain: user.domain,
          fevicon: user.fevicon,
          logo: user.logo,
        },
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // update password
  updatePassword: async (req, res, next) => {
    try {
      // 1. Update password in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: req.body.newPassword
      });

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(200).json({
        message: "Password updated successfully",
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // update company
  updateCompany: async (req, res, next) => {
    try {
      // const existingUser = await User.findById(req.payload.aud).populate("owner").populate("role");
      const existingUser = await userService.findUserById(req.payload.aud);

      if (existingUser && (existingUser.role?.name?.toLowerCase() || "") === "owner") {
        if (req.body.domain && req.body.domain !== existingUser.domain) {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('domain', req.body.domain);

          if (count !== 0) {
            return res.status(403).send({ message: "Domain already in use" })
          }
        }

        // Legacy organization manager call removed (it was hitting localhost)
        /*
        try {
          await axios.post(`http://localhost:4000/manager/create-organization`, {
            domain: req.body.domain + ".scalez.in",
          });
        } catch (e) {
          console.log("Axios error ignored on updateCompany");
        }
        */

        /*
        await User.findByIdAndUpdate(
          { _id: req.payload.aud },
          { ... }
        );
        */
        await userService.updateUser(req.payload.aud, {
          company: req.body.company,
          timezone: req.body.timezone,
          address: req.body.address,
          address2: req.body.address2,
          city: req.body.city,
          state: req.body.state,
          zip: req.body.zip,
          country: req.body.country,
          currency: req.body.currency,
          domain: req.body.domain,
        });

        // const user = await User.findOne({ _id: req.payload.aud }).populate("role");
        const user = await userService.findUserById(req.payload.aud);

        // console.log(user)
        res.status(200).json({
          message: "Company updated successfully",
          user: {
            id: user.id || user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            designation: user.designation,
            avatar: user.avatar,
            widgets: user.widgets,
            company: user.company,
            timezone: user.timezone,
            address: user.address,
            address2: user.address2,
            city: user.city,
            state: user.state,
            zip: user.zip,
            country: user.country,
            currency: user.currency,
            domain: user.domain,
            fevicon: user.fevicon,
            logo: user.logo,
          },
        });
      } else {
        res.status(400).json({ message: "User Not Authorized" });
      }
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // upload fevicon
  updateFeviconPicture: async (req, res, next) => {
    try {
      uploadFeviconIcon(req, res, async (err) => {
        if (err) {
          next(err);
          console.log(err);
        } else {
          const path = req.file.path.replace(/\\/g, "/");
          // const existingUser = await User.findById(req.payload.aud);
          const existingUser = await userService.findUserById(req.payload.aud);

          if (existingUser.fevicon !== null) {
            try {
              fs.unlink(existingUser.fevicon.replace(/\\/g, "/"), (err) => {
                if (err) {
                  console.error(err);
                }
              });
            } catch (fsErr) { console.error(fsErr); }
          }

          // await User.updateOne({ _id: req.payload.aud }, { fevicon: path });
          await userService.updateUser(req.payload.aud, { fevicon: path });

          // const user = await User.findById(req.payload.aud).populate("role");
          const user = await userService.findUserById(req.payload.aud);

          res.status(200).json({
            message: "Fevicon picture updated successfully",
            user: {
              id: user.id || user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role,
              designation: user.designation,
              avatar: user.avatar,
              company: user.company,
              timezone: user.timezone,
              address: user.address,
              address2: user.address2,
              city: user.city,
              state: user.state,
              zip: user.zip,
              country: user.country,
              currency: user.currency,
              domain: user.domain,
              fevicon: user.fevicon,
              logo: user.logo,
            },
          });
        }
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // logo
  updateLogoPicture: async (req, res, next) => {
    try {
      uploadLogo(req, res, async (err) => {
        if (err) {
          next(err);
          console.log(err);
        } else {
          const path = req.file.path.replace(/\\/g, "/");
          // const existingUser = await User.findById(req.payload.aud);
          const existingUser = await userService.findUserById(req.payload.aud);

          if (existingUser.logo !== null) {
            try {
              fs.unlink(existingUser.logo.replace(/\\/g, "/"), (err) => {
                if (err) {
                  console.error(err);
                }
              });
            } catch (fsErr) { console.error(fsErr); }
          }

          // await User.updateOne({ _id: req.payload.aud }, { logo: path });
          await userService.updateUser(req.payload.aud, { logo: path });

          // const user = await User.findById(req.payload.aud).populate("role");
          const user = await userService.findUserById(req.payload.aud);

          res.status(200).json({
            message: "Logo picture updated successfully",
            user: {
              id: user.id || user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role,
              designation: user.designation,
              avatar: user.avatar,
              company: user.company,
              timezone: user.timezone,
              address: user.address,
              address2: user.address2,
              city: user.city,
              state: user.state,
              zip: user.zip,
              country: user.country,
              currency: user.currency,
              domain: user.domain,
              fevicon: user.fevicon,
              logo: user.logo,
            },
          });
        }
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // delete fevicon
  deleteFeviconPicture: async (req, res, next) => {
    try {
      // const existingUser = await User.findById(req.payload.aud);
      const existingUser = await userService.findUserById(req.payload.aud);

      if (existingUser.fevicon !== null) {
        try {
          fs.unlink(existingUser.fevicon.replace(/\\/g, "/"), (err) => {
            if (err) {
              console.error(err);
            }
          });
        } catch (fsErr) { console.error(fsErr); }
      }
      // await User.updateOne({ _id: req.payload.aud }, { fevicon: null });
      await userService.updateUser(req.payload.aud, { fevicon: null });

      // const user = await User.findById(req.payload.aud).populate("role");
      const user = await userService.findUserById(req.payload.aud);

      res.status(200).json({
        message: "Fevicon picture deleted successfully",
        user: {
          id: user.id || user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          designation: user.designation,
          avatar: user.avatar,
          company: user.company,
          timezone: user.timezone,
          address: user.address,
          address2: user.address2,
          city: user.city,
          state: user.state,
          zip: user.zip,
          country: user.country,
          currency: user.currency,
          domain: user.domain,
          fevicon: user.fevicon,
          logo: user.logo,
        },
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // delete logo
  deleteLogoPicture: async (req, res, next) => {
    try {
      // const existingUser = await User.findById(req.payload.aud);
      const existingUser = await userService.findUserById(req.payload.aud);

      if (existingUser.logo !== null) {
        try {
          fs.unlink(existingUser.logo.replace(/\\/g, "/"), (err) => {
            if (err) {
              console.error(err);
            }
          });
        } catch (fsErr) { console.error(fsErr); }
      }
      // await User.updateOne({ _id: req.payload.aud }, { logo: null });
      await userService.updateUser(req.payload.aud, { logo: null });

      // const user = await User.findById(req.payload.aud).populate("role");
      const user = await userService.findUserById(req.payload.aud);

      res.status(200).json({
        message: "Logo picture deleted successfully",
        user: {
          id: user.id || user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          designation: user.designation,
          avatar: user.avatar,
          company: user.company,
          timezone: user.timezone,
          address: user.address,
          address2: user.address2,
          city: user.city,
          state: user.state,
          zip: user.zip,
          country: user.country,
          currency: user.currency,
          domain: user.domain,
          fevicon: user.fevicon,
          logo: user.logo,
        },
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  // update notification settings
  updateNotificationSettings: async (req, res, next) => {
    try {
      // const existingUser = await User.findById(req.payload.aud);

      // await User.updateOne(...)
      await userService.updateUser(req.payload.aud, { notificationSettings: req.body.notificationSettings });

      res.status(200).json({
        message: "Notification settings updated successfully",
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },

  me: async (req, res, next) => {
    try {
      // let user = await User.findById(req.payload.aud).populate("role");
      let user = await userService.findUserById(req.payload.aud);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }
      const token = await signAccessToken(user.id);

      // user = {
      //   ...user
      // }
      // user = user.toObject(); // Removed
      // user["id"] = user._id; // handled by userService
      res.status(200).json({
        message: "User retrieved successfully",
        user,
        token: token,
      });
    } catch (err) {
      next(err);
      console.log(err);
    }
  },
};
