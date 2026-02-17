const userService = require("../services/userService");
const createError = require("http-errors");
const supabase = require('../config/supabaseClient');

module.exports = {
  // Fix Keymetric
  fixKeymetrics: async (req, res, next) => {
    const { keyMetricName, metricType, metricTime, description } = req.body;

    const { data: allOwnerRoles } = await supabase.from('roles').select('*').ilike('name', 'owner');
    const roleIds = (allOwnerRoles || []).map(r => r.id);

    const { data: allOwners } = await supabase.from('users').select('*').in('role_id', roleIds);

    await Promise.all(
      (allOwners || []).map(async (owner) => {
        const { data: targetKeymetrics } = await supabase.from('keymetrics').select('*').eq('owner_id', owner.id);

        if ((targetKeymetrics || []).filter(k => k.name === keyMetricName).length === 0) {
          await supabase.from('keymetrics').insert({
            name: keyMetricName,
            short_name: keyMetricName,
            description,
            metric_type: metricType,
            metric_time: metricTime,
            type: metricType,
            owner_id: owner.id,
          });
        }
      })
    );

    return res.send({ message: "Fixed Keymetrics" });
  },

  // Fix Growth Levers
  fixGrowthLevers: async (req, res, next) => {
    const { name, color } = req.body;

    const { data: allOwnerRoles } = await supabase.from('roles').select('*').ilike('name', 'owner');
    const roleIds = (allOwnerRoles || []).map(r => r.id);

    const { data: allOwners } = await supabase.from('users').select('*').in('role_id', roleIds);

    await Promise.all(
      (allOwners || []).map(async (owner) => {
        const { data: targetLevers } = await supabase.from('levers').select('*').eq('owner_id', owner.id);

        if ((targetLevers || []).filter(k => k.name === name).length === 0) {
          await supabase.from('levers').insert({
            name,
            color,
            owner_id: owner.id,
          });
        }
      })
    );

    return res.send({ message: "Fixed Lever" });
  },

  // Fix Role
  fixRole: async (req, res, next) => {
    const { name, permissions } = req.body;

    const { data: allOwnerRoles } = await supabase.from('roles').select('*').ilike('name', 'owner');
    const roleIds = (allOwnerRoles || []).map(r => r.id);

    const { data: allOwners } = await supabase.from('users').select('*').in('role_id', roleIds);

    await Promise.all(
      (allOwners || []).map(async (owner) => {
        const { data: targetRoles } = await supabase.from('roles').select('*').eq('owner_id', owner.id);

        if ((targetRoles || []).filter(k => k.name === name).length === 0) {
          await supabase.from('roles').insert({
            name,
            permissions,
            owner_id: owner.id,
          });
        }
      })
    );

    return res.send({ message: "Fixed Role" });
  },
};
