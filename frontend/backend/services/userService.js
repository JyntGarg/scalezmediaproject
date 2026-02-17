const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const mapUserToModel = (data) => {
    if (!data) return null;
    // Map snake_case to camelCase
    return {
        _id: data.id, // Keep _id for compatibility if needed, or just id
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        password: data.password,
        role: data.roles ? { ...data.roles, _id: data.roles.id } : data.role_id, // Map role object if joined
        avatar: data.avatar,
        designation: data.designation,
        company: data.company,
        timezone: data.timezone,
        address: data.address,
        address2: data.address2,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        currency: data.currency,
        domain: data.domain,
        phone: data.phone,
        industry: data.industry,
        fevicon: data.fevicon,
        logo: data.logo,
        widgets: data.widgets,
        notificationSettings: data.notification_settings,
        resetPasswordToken: data.reset_password_token,
        resetPasswordRequested: data.reset_password_requested,
        resetPasswordTokenUsed: data.reset_password_token_used,
        owner: data.owner_id, // or mapped owner object
        // Add other fields as necessary
    };
};

const userService = {
    findUserByEmail: async (email) => {
        // Case insensitive search using ilike or explicit lower()
        const { data, error } = await supabase
            .from('users')
            .select('*, roles!role_id(*)')
            .ilike('email', email)
            .maybeSingle();

        if (error) throw error;
        return mapUserToModel(data);
    },

    findUserById: async (id) => {
        const { data, error } = await supabase
            .from('users')
            .select('*, roles!role_id(*)')
            .eq('id', id)
            .single();

        if (error) return null; // or throw depending on preference
        return mapUserToModel(data);
    },

    findUserByToken: async (token) => {
        const { data, error } = await supabase
            .from('users')
            .select('*, roles!role_id(*)')
            .eq('token', token)
            .single();

        if (error) return null;
        return mapUserToModel(data);
    },

    createUser: async (userData) => {
        const { error, data } = await supabase.from('users').insert({
            id: userData.id, // Explicit ID from Supabase Auth
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email,
            password: userData.password,
            role_id: userData.role, // Assuming role is an ID
            designation: userData.designation,
            organization: userData.organization
        }).select().single();

        if (error) throw error;
        return mapUserToModel(data);
    },

    updateUser: async (id, updates) => {
        // Map updates to snake_case
        const dbUpdates = {};
        if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
        if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.password !== undefined) dbUpdates.password = updates.password;
        if (updates.designation !== undefined) dbUpdates.designation = updates.designation;
        if (updates.about !== undefined) dbUpdates.about = updates.about;
        if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
        if (updates.lastLogin) dbUpdates.last_login = updates.lastLogin;

        if (updates.resetPasswordToken !== undefined) dbUpdates.reset_password_token = updates.resetPasswordToken;
        if (updates.resetPasswordRequested !== undefined) dbUpdates.reset_password_requested = updates.resetPasswordRequested;
        if (updates.resetPasswordRequestedOn !== undefined) dbUpdates.reset_password_requested_on = updates.resetPasswordRequestedOn;
        if (updates.resetPasswordTokenUsed !== undefined) dbUpdates.reset_password_token_used = updates.resetPasswordTokenUsed;

        if (updates.company !== undefined) dbUpdates.company = updates.company;
        if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.address2 !== undefined) dbUpdates.address2 = updates.address2;
        if (updates.city !== undefined) dbUpdates.city = updates.city;
        if (updates.state !== undefined) dbUpdates.state = updates.state;
        if (updates.zip !== undefined) dbUpdates.zip = updates.zip;
        if (updates.country !== undefined) dbUpdates.country = updates.country;
        if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
        if (updates.domain !== undefined) dbUpdates.domain = updates.domain;
        if (updates.fevicon !== undefined) dbUpdates.fevicon = updates.fevicon;
        if (updates.logo !== undefined) dbUpdates.logo = updates.logo;
        if (updates.notificationSettings !== undefined) dbUpdates.notification_settings = updates.notificationSettings;

        // ... map other fields

        const { data, error } = await supabase
            .from('users')
            .update(dbUpdates)
            .eq('id', id)
            .select('*, roles!role_id(*)')
            .single();

        if (error) throw error;
        return mapUserToModel(data);
    },

    findAllUsers: async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*, roles!role_id(*)');

        if (error) throw error;
        return data.map(mapUserToModel);
    },

    findSuperOwnerById: async (id) => {
        const { data, error } = await supabase
            .from('super_owners')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return {
            id: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            avatar: data.avatar,
            organization: data.organization
        };
    }
};

module.exports = userService;
