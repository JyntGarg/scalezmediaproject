const userService = require("../services/userService");
const createError = require("http-errors");
const { signAccessToken } = require("../helpers/jwt_helper");
const bcrypt = require("bcryptjs");
const supabase = require('../config/supabaseClient');

module.exports = {
  // create
  create: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const { data: existing } = await supabase.from('super_owners').select('*').eq('email', email.toLowerCase()).single();
      if (existing) throw createError(409, "Email already exists");

      const hashedPassword = await bcrypt.hash(password, 10);

      const { data: superOwner, error } = await supabase
        .from('super_owners')
        .insert({ email: email.toLowerCase(), password: hashedPassword })
        .select()
        .single();

      if (error) throw error;

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

      const { data: superOwner, error } = await supabase
        .from('super_owners')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !superOwner) throw createError(401, "Invalid email or password");

      const isMatch = await bcrypt.compare(password, superOwner.password);
      if (!isMatch) throw createError(401, "Invalid email or password");

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
      const { data: superOwner } = await supabase.from('superowners').select('*').eq('id', req.payload.aud).single();
      if (!superOwner) throw createError(401, "Unauthorized");

      const { email, password, firstName, lastName, domain } = req.body;

      const { data: existing } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single();
      if (existing) throw createError(409, "Email already exists");

      const hashedPassword = await bcrypt.hash(password, 10);

      const { data: role } = await supabase.from('roles').select('*').ilike('name', 'owner').single();

      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          domain,
          role_id: role?.id,
          type: "owner",
        })
        .select()
        .single();

      if (error) throw error;

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
      const { data: superOwner } = await supabase.from('superowners').select('*').eq('id', req.payload.aud).single();
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
      const { data: superOwner } = await supabase.from('superowners').select('*').eq('id', req.payload.aud).single();
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
      const { data: superOwner } = await supabase.from('superowners').select('*').eq('id', req.payload.aud).single();
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
      const { data: superOwner } = await supabase.from('superowners').select('*').eq('id', req.payload.aud).single();
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
