import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user and check admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const reportType = url.searchParams.get('type') || 'summary';
    const kabupatenKotaId = url.searchParams.get('kabupaten_kota_id') || null;
    const startDate = url.searchParams.get('start_date') || null;
    const endDate = url.searchParams.get('end_date') || null;

    console.log(`Fetching report: ${reportType}, filters:`, { kabupatenKotaId, startDate, endDate });

    let data;
    let error;

    switch (reportType) {
      case 'summary':
        ({ data, error } = await supabase.rpc('get_admin_dashboard_summary', {
          _kabupaten_kota_id: kabupatenKotaId,
          _start_date: startDate,
          _end_date: endDate,
        }));
        break;

      case 'income':
        ({ data, error } = await supabase.rpc('get_referee_income_summary', {
          _kabupaten_kota_id: kabupatenKotaId,
          _start_date: startDate,
          _end_date: endDate,
        }));
        break;

      case 'events':
        ({ data, error } = await supabase.rpc('get_referee_event_count', {
          _kabupaten_kota_id: kabupatenKotaId,
          _start_date: startDate,
          _end_date: endDate,
        }));
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid report type. Use: summary, income, or events' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Report ${reportType} fetched successfully, rows:`, Array.isArray(data) ? data.length : 1);

    return new Response(
      JSON.stringify({ data, type: reportType }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
