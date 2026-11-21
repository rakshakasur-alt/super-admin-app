import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Check if the given user_id exists in platform_admins
 */
export async function verifyPlatformAdmin(userId) {
  if (!supabase) return false;

  try {
    // 1. Server-side check: platform_admins.user_id = auth.uid()
    const { data: rpcIsAdmin } = await supabase.rpc('is_platform_admin');
    if (rpcIsAdmin === true) return true;

    // 2. Direct table lookup by user_id (older databases without the RPC).
    //    Never match by e-mail: an e-mail in the token is not proof of identity.
    if (userId) {
      const { data } = await supabase
        .from('platform_admins')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) return true;
    }

    return false;
  } catch (err) {
    console.error('[superAdmin] verifyPlatformAdmin error:', err);
    return false;
  }
}

/**
 * Authenticate super admin.
 * If credentials are valid in Auth, but user is not in platform_admins,
 * automatically signs out and returns an access denied error.
 */
export async function signInSuperAdmin(email, password) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client is not configured.') };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { data: null, error };
    }

    const userId = data?.user?.id;
    const isSuperAdmin = await verifyPlatformAdmin(userId);

    if (!isSuperAdmin) {
      await supabase.auth.signOut();
      return {
        data: null,
        error: new Error('Access denied: Your account is not registered as a platform administrator.'),
      };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getSuperAdminSession() {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    const session = data?.session;
    if (!session) return null;

    const isSuperAdmin = await verifyPlatformAdmin(session.user?.id);
    if (!isSuperAdmin) {
      await supabase.auth.signOut();
      return null;
    }

    return session;
  } catch (err) {
    console.error('[superAdmin] getSuperAdminSession error:', err);
    return null;
  }
}

export async function signOutSuperAdmin() {
  if (!supabase) return { error: null };
  return supabase.auth.signOut();
}

/**
 * Password Recovery
 */
export async function requestPasswordReset(email) {
  if (!supabase) return { error: new Error('Supabase client is not configured.') };
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

export async function updatePassword(newPassword) {
  if (!supabase) return { error: new Error('Supabase client is not configured.') };
  return supabase.auth.updateUser({ password: newPassword });
}


export async function verifyResetTokenHash(tokenHash) {
  if (!supabase) return { error: new Error('Supabase client is not configured.') };
  return supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'recovery',
  });
}

export async function exchangeResetCode(code) {
  if (!supabase) return { error: new Error('Supabase client is not configured.') };
  return supabase.auth.exchangeCodeForSession(code);
}

export async function resetPasswordWithOtp({ email, token, newPassword }) {
  if (!supabase) return { error: new Error('Supabase client is not configured.') };
  const { data, error: otpError } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'recovery',
  });
  if (otpError) return { error: otpError };
  return supabase.auth.updateUser({ password: newPassword });
}

/**
 * Fetch list of all hotels with counts and owner info
 */
export async function fetchAllHotels(statusFilter = 'all') {
  if (!supabase) return { hotels: [], error: null };

  // Select '*' so all available columns are loaded without failing if owner_email is missing
  let query = supabase
    .from('hotels')
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  let { data: hotels, error } = await query;
  if (error) {
    console.warn('[superAdmin] fetchAllHotels select(*) failed, attempting core columns fallback:', error.message);
    let fallbackQuery = supabase
      .from('hotels')
      .select('id, name, subdomain, menu_id, status, created_at, theme_config, owner_email')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      fallbackQuery = fallbackQuery.eq('status', statusFilter);
    }

    const fallbackRes = await fallbackQuery;
    if (fallbackRes.error) {
      console.error('[superAdmin] fetchAllHotels fallback error:', fallbackRes.error.message);
      return { hotels: [], error: fallbackRes.error };
    }
    hotels = fallbackRes.data;
  }

  // Also fetch counts for dishes, plus owner emails
  const hotelIds = hotels.map(h => h.id);
  if (hotelIds.length === 0) {
    return { hotels: [], error: null };
  }

  const [dishesRes, ownersRes, eventsRes] = await Promise.all([
    supabase.from('dishes').select('id, hotel_id'),
    supabase.from('hotel_owners').select('hotel_id, user_id, role'),
    supabase.from('menu_events').select('hotel_id, event_type')
  ]);

  const dishCounts = {};
  (dishesRes.data || []).forEach(d => {
    dishCounts[d.hotel_id] = (dishCounts[d.hotel_id] || 0) + 1;
  });

  const ownersMap = {};
  (ownersRes.data || []).forEach(o => {
    ownersMap[o.hotel_id] = o;
  });

  const visitCounts = {};
  const arViewCounts = {};
  (eventsRes.data || []).forEach(e => {
    if (e.event_type === 'site_visit') {
      visitCounts[e.hotel_id] = (visitCounts[e.hotel_id] || 0) + 1;
    } else if (e.event_type === 'ar_view') {
      arViewCounts[e.hotel_id] = (arViewCounts[e.hotel_id] || 0) + 1;
    }
  });

  const enrichedHotels = hotels.map(h => ({
    ...h,
    plan: h.plan || h.theme_config?.plan || 'free',
    dish_count: dishCounts[h.id] || 0,
    visit_count: visitCounts[h.id] || 0,
    ar_view_count: arViewCounts[h.id] || 0,
    owner: ownersMap[h.id] || null,
  }));

  return { hotels: enrichedHotels, error: null };
}

/**
 * Fetch engagement totals across all hotels or for a specific hotel.
 */
export async function getHotelEngagementSummary(hotelId = null) {
  if (!supabase) return { totalVisits: 0, totalArViews: 0, byHotel: {} };

  let query = supabase.from('menu_events').select('hotel_id, event_type');
  if (hotelId) {
    query = query.eq('hotel_id', hotelId);
  }

  const { data: events, error } = await query;
  if (error || !events) return { totalVisits: 0, totalArViews: 0, byHotel: {} };

  let totalVisits = 0;
  let totalArViews = 0;
  const byHotel = {};

  events.forEach(e => {
    if (!byHotel[e.hotel_id]) {
      byHotel[e.hotel_id] = { visits: 0, arViews: 0 };
    }
    if (e.event_type === 'site_visit') {
      totalVisits += 1;
      byHotel[e.hotel_id].visits += 1;
    } else if (e.event_type === 'ar_view') {
      totalArViews += 1;
      byHotel[e.hotel_id].arViews += 1;
    }
  });

  return { totalVisits, totalArViews, byHotel };
}

/**
 * Update hotel status ('verified', 'pending', 'suspended')
 */
export async function updateHotelStatus(hotelId, newStatus) {
  if (!supabase) return { error: new Error('Supabase client is not configured.') };

  // Use dedicated atomic approve_hotel RPC when verifying
  if (newStatus === 'verified') {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('approve_hotel', { p_hotel_id: hotelId });
      if (!rpcError && rpcData?.success) {
        return { data: rpcData, error: null };
      }
      if (rpcError && !rpcError.message?.includes('function') && !rpcError.message?.includes('does not exist')) {
        return { data: null, error: rpcError };
      }
    } catch (_) {}
  }

  const { data, error } = await supabase
    .from('hotels')
    .update({ status: newStatus })
    .eq('id', hotelId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('multiple (or no) rows') || error.message?.includes('policy')) {
      return {
        data: null,
        error: new Error('Permission denied: Your current account lacks platform administrator privileges in the database. Please verify your user ID is registered in platform_admins.'),
      };
    }
    return { data: null, error };
  }

  if (newStatus === 'verified' && data?.id) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from('platform_notifications').insert({
        title: 'Welcome to QR Menu! 🎉',
        message: 'Your hotel account and restaurant profile have been officially verified and approved. Your digital live dining menu, table QR ordering, and 3D WebAR previews are now live for guests!',
        type: 'update',
        target_type: 'hotel',
        target_value: String(data.id),
        created_by: session?.user?.id || null,
        source: 'system'
      });
    } catch (_) {}
  }

  return { data, error: null };
}

/**
 * Update hotel subscription tier ('free', 'pro')
 */
export async function updateHotelPlan(hotelId, newPlan) {
  if (!supabase) return { error: new Error('Supabase client is not configured.') };

  // Fetch current theme_config to double-store plan reliably
  let currentTheme = {};
  try {
    const { data: cur } = await supabase.from('hotels').select('theme_config').eq('id', hotelId).maybeSingle();
    currentTheme = cur?.theme_config || {};
  } catch (_) {}
  const nextTheme = { ...currentTheme, plan: newPlan };

  // 1. Try dedicated atomic RPC first
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('set_hotel_plan', {
      p_hotel_id: hotelId,
      p_plan: newPlan
    });
    if (!rpcError && rpcData?.success) {
      // Also sync theme_config.plan
      try {
        await supabase.from('hotels').update({ theme_config: nextTheme }).eq('id', hotelId);
      } catch (_) {}
      return { data: rpcData, error: null };
    }
    if (rpcError && !rpcError.message?.includes('function') && !rpcError.message?.includes('does not exist')) {
      // If RPC fails for reasons other than missing RPC function, continue to direct update
    }
  } catch (_) {}

  // 2. Direct table update: update both 'plan' column and 'theme_config'
  try {
    let { data, error } = await supabase
      .from('hotels')
      .update({ plan: newPlan, theme_config: nextTheme })
      .eq('id', hotelId)
      .select()
      .single();

    // Fallback if 'plan' column does not exist yet in the database schema
    if (error && (error.code === '42703' || /column.*plan/i.test(error.message) || /does not exist/i.test(error.message))) {
      const retry = await supabase
        .from('hotels')
        .update({ theme_config: nextTheme })
        .eq('id', hotelId)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Fetch detailed view for a single hotel
 */
export async function fetchHotelDetail(hotelId) {
  if (!supabase || !hotelId) return { hotel: null, dishes: [], error: null };

  const { data: hotel, error: hotelErr } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', hotelId)
    .maybeSingle();

  if (hotelErr) return { hotel: null, dishes: [], error: hotelErr };
  if (!hotel) return { hotel: null, dishes: [], error: new Error('Hotel not found') };

  let dishesQuery = supabase.from('dishes').select('*').is('deleted_at', null);
  if (hotel.menu_id) {
    dishesQuery = dishesQuery.or(`hotel_id.eq.${hotelId},menu_id.eq.${hotel.menu_id}`);
  } else {
    dishesQuery = dishesQuery.eq('hotel_id', hotelId);
  }

  const [
    { data: dishes },
    { data: owners }
  ] = await Promise.all([
    dishesQuery.order('category').order('created_at', { ascending: false }),
    supabase.from('hotel_owners').select('*').eq('hotel_id', hotelId)
  ]);

  let resolvedOwnerEmail = hotel?.owner_email || null;
  let ownerProfile = null;
  try {
    const { data: profileData, error: profileErr } = await supabase.rpc('get_hotel_owner_profile', { p_hotel_id: hotelId });
    if (!profileErr && profileData) {
      ownerProfile = profileData;
      if (profileData.email) {
        resolvedOwnerEmail = profileData.email;
      }
    }
  } catch (_) {}

  if (!resolvedOwnerEmail) {
    try {
      const { data: emailData, error: emailErr } = await supabase.rpc('get_hotel_owner_email', { p_hotel_id: hotelId });
      if (!emailErr && emailData) {
        resolvedOwnerEmail = emailData;
      }
    } catch (_) {}
  }

  return {
    hotel: {
      ...hotel,
      plan: hotel.plan || hotel.theme_config?.plan || 'free',
      owner: owners?.[0] || null,
      owner_email: resolvedOwnerEmail,
      ownerProfile: ownerProfile || null
    },
    dishes: dishes || [],
    error: null
  };
}

/**
 * Fetch all content reports across all hotels (Super Admin only)
 */
export async function fetchAllReports(statusFilter = 'all') {
  if (!supabase) return { reports: [], error: null };

  try {
    let query = supabase
      .from('content_reports')
      .select(`
        *,
        hotels ( id, name, subdomain ),
        dishes ( id, name, category, price, thumbnail_url )
      `)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      return { reports: data, error: null };
    }

    // Fallback: fetch raw content_reports and manually enrich with hotels and dishes
    console.warn('[superAdmin] fetchAllReports embedded query failed, using direct fallback:', error?.message);
    let rawQuery = supabase
      .from('content_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      rawQuery = rawQuery.eq('status', statusFilter);
    }

    const { data: rawReports, error: rawErr } = await rawQuery;
    if (rawErr) throw rawErr;

    const hotelIds = [...new Set((rawReports || []).map(r => r.hotel_id).filter(Boolean))];
    const dishIds = [...new Set((rawReports || []).map(r => r.dish_id).filter(Boolean))];

    let hotelMap = {};
    let dishMap = {};

    const [hotelsRes, dishesRes] = await Promise.all([
      hotelIds.length ? supabase.from('hotels').select('id, name, subdomain').in('id', hotelIds) : { data: [] },
      dishIds.length ? supabase.from('dishes').select('id, name, category, price, thumbnail_url').in('id', dishIds) : { data: [] }
    ]);

    (hotelsRes.data || []).forEach(h => { hotelMap[h.id] = h; });
    (dishesRes.data || []).forEach(d => { dishMap[d.id] = d; });

    const enriched = (rawReports || []).map(r => ({
      ...r,
      hotels: r.hotel_id ? (hotelMap[r.hotel_id] || null) : null,
      dishes: r.dish_id ? (dishMap[r.dish_id] || null) : null
    }));

    return { reports: enriched, error: null };
  } catch (err) {
    console.error('[superAdmin] fetchAllReports error:', err);
    return { reports: [], error: err };
  }
}

/**
 * Update report status (Super Admin only)
 */
export async function updateReportStatusAdmin(reportId, status) {
  if (!supabase) return { error: new Error('Supabase client is not configured.') };

  try {
    const { data, error } = await supabase
      .from('content_reports')
      .update({ status })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('[superAdmin] updateReportStatusAdmin error:', err);
    return { data: null, error: err };
  }
}

/**
 * Update hotel details (name, subdomain, status, owner_email, theme_config, etc.)
 */
export async function updateHotelAdmin(hotelId, updates = {}) {
  if (!supabase || !hotelId) return { data: null, error: new Error('Supabase client is not configured.') };

  try {
    const payload = { ...updates };
    if (payload.subdomain) {
      payload.subdomain = payload.subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    }
    if (payload.name) {
      payload.name = payload.name.trim();
    }
    if (payload.owner_email !== undefined) {
      payload.owner_email = payload.owner_email ? payload.owner_email.trim() : null;
    }
    delete payload.updated_at;

    // Older databases may lack some optional columns (owner_email, phone,
    // contact_email, operating_hours, currency…). Drop only the missing column
    // and retry, instead of failing the whole save.
    let data = null;
    let error = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      ({ data, error } = await supabase
        .from('hotels')
        .update(payload)
        .eq('id', hotelId)
        .select()
        .single());
      if (!error) break;
      const isMissingColumn = error.code === '42703' || error.code === 'PGRST204' || /could not find the '.+' column|column .+ does not exist/i.test(error.message || '');
      if (!isMissingColumn) break;
      const missing = Object.keys(payload).find(col => (error.message || '').includes(`'${col}'`) || (error.message || '').includes(`"${col}"`) || (error.message || '').includes(` ${col} `));
      if (!missing || ['name', 'subdomain', 'status'].includes(missing)) break;
      console.warn(`[superAdmin] hotels.${missing} column missing — skipped. Run supabase/functions/fix_debug_v3_bugs.sql.`);
      delete payload[missing];
    }

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('[superAdmin] updateHotelAdmin error:', err);
    return { data: null, error: err };
  }
}

/**
 * Delete a hotel tenant and cascade delete dishes, events, etc.
 */
export async function deleteHotelAdmin(hotelId) {
  if (!supabase || !hotelId) return { error: new Error('Supabase client is not configured.') };

  try {
    // 1. Try secure stored procedure first if configured
    const { error: rpcError } = await supabase.rpc('delete_hotel_permanently', {
      p_hotel_id: hotelId
    });

    if (!rpcError) {
      return { error: null };
    }

    // 2. Direct delete fallback (older databases without the RPC).
    //    Audit logs are append-only and are never deleted from the app.
    const { error } = await supabase
      .from('hotels')
      .delete()
      .eq('id', hotelId);

    if (error) {
      if (/audit_logs_hotel_id_fkey/i.test(error.message)) {
        throw new Error(
          'Database constraint violation: audit_logs_hotel_id_fkey. ' +
          'Please execute the SQL migration "supabase/migration_fix_audit_logs_fkey.sql" in your Supabase SQL Editor to remove this constraint.'
        );
      }
      throw error;
    }

    return { error: null };
  } catch (err) {
    console.error('[superAdmin] deleteHotelAdmin error:', err);
    return { error: err };
  }
}

/**
 * Delete a content report (Super Admin only)
 */
export async function deleteReportAdmin(reportId) {
  if (!supabase || !reportId) return { error: new Error('Supabase client is not configured.') };

  try {
    const { error } = await supabase
      .from('content_reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[superAdmin] deleteReportAdmin error:', err);
    return { error: err };
  }
}

/**
 * Suspend or unsuspend a dish (Super Admin only)
 */
export async function setDishSuspensionAdmin({ dishId, isSuspended, reason = '' }) {
  if (!supabase || !dishId) return { data: null, error: new Error('Supabase client is not configured.') };

  try {
    // Attempt via secure RPC first
    const { data: rpcData, error: rpcErr } = await supabase.rpc('set_dish_suspension', {
      p_dish_id: dishId,
      p_suspended: Boolean(isSuspended),
      p_reason: reason || (isSuspended ? 'Suspended by platform administrator' : null)
    });

    if (!rpcErr && rpcData) {
      return { data: rpcData, error: null };
    }

    // Direct fallback
    const { data, error } = await supabase
      .from('dishes')
      .update({
        is_suspended: Boolean(isSuspended),
        suspended_reason: isSuspended ? (reason || 'Suspended by platform administrator') : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', dishId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('[superAdmin] setDishSuspensionAdmin error:', err);
    return { data: null, error: err };
  }
}

/**
 * Permanently delete a dish (Super Admin only)
 */
export async function deleteDishAdmin(dishId) {
  if (!supabase) return { error: null };
  try {
    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', dishId);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[superAdmin] deleteDishAdmin error:', err);
    return { error: err };
  }
}

/**
 * Create a new hotel (Super Admin only)
 */
export async function createHotelAdmin({ name, subdomain, ownerEmail = '' }) {
  if (!supabase) return { data: null, error: new Error('Supabase client is not configured.') };

  const trimmedName = (name || '').trim();
  const cleanSubdomain = (subdomain || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  const trimmedEmail = (ownerEmail || '').trim();

  if (!trimmedName) {
    return { data: null, error: new Error('Hotel name is required.') };
  }
  if (!cleanSubdomain || cleanSubdomain.length < 3) {
    return { data: null, error: new Error('Subdomain must be at least 3 characters long (letters, numbers, hyphens).') };
  }

  try {
    const menuId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `menu-${Date.now()}`;

    let { data: newHotel, error: insertError } = await supabase
      .from('hotels')
      .insert({
        name: trimmedName,
        subdomain: cleanSubdomain,
        menu_id: menuId,
        status: 'verified',
        owner_email: trimmedEmail || null,
        theme_config: {
          blockOrder: ['image', 'info', 'showcase'],
          headerData: {
            title: trimmedName,
            subtitle: 'Fresh, premium dishes with AR previews.',
            categories: ['All', 'Starters', 'Main', 'Desserts', 'Veg'],
            background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)'
          }
        }
      })
      .select()
      .single();

    if (insertError && (insertError.code === '42703' || /owner_email/i.test(insertError.message))) {
      const retry = await supabase
        .from('hotels')
        .insert({
          name: trimmedName,
          subdomain: cleanSubdomain,
          menu_id: menuId,
          status: 'verified',
          theme_config: {
            blockOrder: ['image', 'info', 'showcase'],
            headerData: {
              title: trimmedName,
              subtitle: 'Fresh, premium dishes with AR previews.',
              categories: ['All', 'Starters', 'Main', 'Desserts', 'Veg'],
              background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)'
            }
          }
        })
        .select()
        .single();
      newHotel = retry.data;
      insertError = retry.error;
    }

    if (insertError) throw insertError;

    // Build invite link for hotel owner to set their password
    const configuredAdminUrl = import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:4173';
    const inviteLink = `${configuredAdminUrl.replace(/\/$/, '')}/signup?hotel=${encodeURIComponent(cleanSubdomain)}${trimmedEmail ? `&email=${encodeURIComponent(trimmedEmail)}` : ''}&invited=true`;

    // Attempt sending invite email if email is provided
    let emailSent = false;
    let inviteNotice = '';
    if (trimmedEmail) {
      try {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email: trimmedEmail,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: inviteLink,
          }
        });
        if (!otpErr) {
          emailSent = true;
          inviteNotice = `Invitation email dispatched to ${trimmedEmail}.`;
        } else {
          console.warn('[superAdmin] createHotelAdmin signInWithOtp notice:', otpErr.message);
          inviteNotice = `Account created. Direct setup link generated. (Email service notice: ${otpErr.message})`;
        }
      } catch (err) {
        console.warn('[superAdmin] invite email attempt error:', err);
        inviteNotice = `Direct setup link generated.`;
      }
    }

    return {
      data: {
        ...newHotel,
        inviteLink,
        emailSent,
        inviteNotice
      },
      error: null
    };
  } catch (err) {
    console.error('[superAdmin] createHotelAdmin error:', err);
    return { data: null, error: err };
  }
}

/**
 * Send a platform announcement/notification to hotel owners
 */
export async function sendPlatformNotification({ title, message, type = 'info', targetType = 'all', targetValue = null }) {
  if (!supabase) return { data: null, error: new Error('Supabase client is not configured.') };

  const trimmedTitle = (title || '').trim();
  const trimmedMsg = (message || '').trim();
  if (!trimmedTitle) return { data: null, error: new Error('Notification title is required.') };
  if (!trimmedMsg) return { data: null, error: new Error('Notification message is required.') };

  // Normalize type against DB constraint: ('info', 'warning', 'critical', 'update')
  const validTypes = ['info', 'warning', 'critical', 'update'];
  let normalizedType = (type || 'info').toLowerCase().trim();
  if (normalizedType === 'alert' || normalizedType === 'danger' || normalizedType === 'error') {
    normalizedType = 'critical';
  } else if (normalizedType === 'advisory') {
    normalizedType = 'warning';
  } else if (!validTypes.includes(normalizedType)) {
    normalizedType = 'info';
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;

    const row = {
      title: trimmedTitle,
      message: trimmedMsg,
      type: normalizedType,
      target_type: targetType,
      target_value: targetValue,
      created_by: userId,
      // Written by a super admin in the composer → shown in the hotel's
      // "Super Admin Compliance" panel (system messages are not).
      source: 'super_admin'
    };
    let { data, error } = await supabase.from('platform_notifications').insert(row).select().single();
    if (error && /source/.test(error.message || '')) {
      // Database not migrated yet (fix_debug_v2_bugs.sql) — send without the tag
      const { source: _omit, ...legacyRow } = row;
      ({ data, error } = await supabase.from('platform_notifications').insert(legacyRow).select().single());
    }

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('[superAdmin] sendPlatformNotification error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch sent platform notifications with read receipt counts
 */
export async function fetchPlatformNotifications() {
  if (!supabase) return { notifications: [], error: null };

  try {
    const { data: notifications, error } = await supabase
      .from('platform_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch read receipt counts
    const notifIds = (notifications || []).map(n => n.id);
    let readsMap = {};
    if (notifIds.length > 0) {
      const { data: reads } = await supabase
        .from('notification_reads')
        .select('notification_id');

      (reads || []).forEach(r => {
        readsMap[r.notification_id] = (readsMap[r.notification_id] || 0) + 1;
      });
    }

    const enriched = (notifications || []).map(n => ({
      ...n,
      read_count: readsMap[n.id] || 0
    }));

    return { notifications: enriched, error: null };
  } catch (err) {
    console.error('[superAdmin] fetchPlatformNotifications error:', err);
    return { notifications: [], error: err };
  }
}

/**
 * Delete a platform notification
 */
export async function deletePlatformNotification(notificationId) {
  if (!supabase) return { error: new Error('Supabase client is not configured.') };

  try {
    const { error } = await supabase
      .from('platform_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[superAdmin] deletePlatformNotification error:', err);
    return { error: err };
  }
}

/**
 * Fetch the global QR Merch URL configured by Super Admin
 */
export async function getQrMerchUrl() {
  if (!supabase) return { url: '', error: new Error('Supabase client is not configured.') };

  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_platform_setting', {
      p_key: 'qr_merch_url'
    });

    if (!rpcErr && rpcData) {
      return { url: rpcData.url || '', error: null };
    }

    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'qr_merch_url')
      .maybeSingle();

    if (error) throw error;
    return { url: data?.value?.url || '', error: null };
  } catch (err) {
    console.error('[superAdmin] getQrMerchUrl error:', err);
    return { url: '', error: err };
  }
}

/**
 * Update the global QR Merch URL
 */
export async function setQrMerchUrl(url) {
  if (!supabase) return { data: null, error: new Error('Supabase client is not configured.') };

  try {
    const cleanUrl = typeof url === 'string' ? url.trim() : '';

    const { data: rpcData, error: rpcErr } = await supabase.rpc('set_platform_setting', {
      p_key: 'qr_merch_url',
      p_value: { url: cleanUrl }
    });

    if (!rpcErr && rpcData?.success) {
      return { data: rpcData, error: null };
    }

    const { data, error } = await supabase
      .from('platform_settings')
      .upsert({
        key: 'qr_merch_url',
        value: { url: cleanUrl },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
      .select()
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('[superAdmin] setQrMerchUrl error:', err);
    return { data: null, error: err };
  }
}



