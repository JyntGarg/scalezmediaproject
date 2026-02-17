const userService = require("../services/userService");
const createError = require("http-errors");
const { signAccessToken } = require("../helpers/jwt_helper");
// const bcrypt = require("bcryptjs"); // Removed (using Supabase Auth)
const supabase = require('../config/supabaseClient');

module.exports = {
  // create
  create: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true
      });

      if (authError) {
        return res.status(400).json({
          success: false,
          message: authError.message,
        });
      }

      // 2. Create the super owner profile in public.super_owners table
      const { data: superOwner, error: dbError } = await supabase
        .from('super_owners')
        .insert({
          id: authData.user.id,
          email: normalizedEmail
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const accessToken = await signAccessToken(superOwner.id);

      res.status(201).json({
        message: "SuperOwner created successfully",
        accessToken,
        superOwner: { id: superOwner.id, email: superOwner.email },
      });
    } catch (err) {
      next(err);
    }
  },

  // login
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError) {
        return res.status(401).json({
          success: false,
          message: authError.message,
        });
      }

      // 2. Fetch the super owner profile
      const { data: superOwner, error: dbError } = await supabase
        .from('super_owners')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (dbError || !superOwner) throw createError(401, "Invalid email or password");

      const accessToken = await signAccessToken(superOwner.id);

      res.status(200).json({
        message: "Login successful",
        accessToken,
        superOwner: { id: superOwner.id, email: superOwner.email },
      });
    } catch (err) {
      next(err);
    }
  },

  // create customer
  createCustomer: async (req, res, next) => {
    try {
      const { data: superOwner } = await supabase.from('super_owners').select('*').eq('id', req.payload.aud).single();
      if (!superOwner) throw createError(401, "Unauthorized");

      const { email, password, firstName, lastName, domain } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true
      });

      if (authError) {
        return res.status(400).json({
          success: false,
          message: authError.message,
        });
      }

      const { data: role } = await supabase.from('roles').select('*').ilike('name', 'owner').single();

      // 2. Create the user profile in public.users table
      const { data: user, error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: normalizedEmail,
          password: "", // Handled by Supabase Auth
          first_name: firstName,
          last_name: lastName,
          domain,
          role_id: role?.id,
          type: "owner",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      res.status(201).json({
        message: "Customer created successfully",
        user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
      });
    } catch (err) {
      next(err);
    }
  },

  // read customers
  readCustomers: async (req, res, next) => {
    try {
      const { data: superOwner } = await supabase.from('super_owners').select('*').eq('id', req.payload.aud).single();
      if (!superOwner) throw createError(401, "Unauthorized");

      const { data: users, error } = await supabase
        .from('users')
        .select('*, role:roles!role_id(*)')
        .eq('type', 'owner')
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json(users || []);
    } catch (err) {
      next(err);
    }
  },

  // disable customer
  disableCustomer: async (req, res, next) => {
    try {
      const { data: superOwner } = await supabase.from('super_owners').select('*').eq('id', req.payload.aud).single();
      if (!superOwner) throw createError(401, "Unauthorized");

      const { error } = await supabase.from('users').update({ is_active: false }).eq('id', req.params.id);
      if (error) throw error;

      res.status(200).json({ message: "Customer disabled successfully" });
    } catch (err) {
      next(err);
    }
  },

  // enable customer
  enableCustomer: async (req, res, next) => {
    try {
      const { data: superOwner } = await supabase.from('super_owners').select('*').eq('id', req.payload.aud).single();
      if (!superOwner) throw createError(401, "Unauthorized");

      const { error } = await supabase.from('users').update({ is_active: true }).eq('id', req.params.id);
      if (error) throw error;

      res.status(200).json({ message: "Customer enabled successfully" });
    } catch (err) {
      next(err);
    }
  },

  // edit customer
  editCustomer: async (req, res, next) => {
    try {
      const { data: superOwner } = await supabase.from('super_owners').select('*').eq('id', req.payload.aud).single();
      if (!superOwner) throw createError(401, "Unauthorized");

      const { firstName, lastName, domain } = req.body;

      const { data: user, error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          domain,
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Customer updated successfully",
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  getAllResetPasswordRequests: async (req, res) => {
    try {
      // Simplified - in production you'd have a password_reset_requests table
      res.status(200).json([]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  discardResetPasswordRequest: async (req, res) => {
    try {
      // Simplified - in production you'd update password_reset_requests table
      res.status(200).json({ message: "Request discarded" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
