import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Find recurring bills due tomorrow that are still pending
    const { data: dueBills, error: fetchError } = await supabase
      .from('bills')
      .select('*')
      .eq('recurrent', true)
      .eq('status', 'pending')
      .eq('due_date', tomorrowStr);

    if (fetchError) throw fetchError;

    let generated = 0;

    for (const bill of (dueBills || [])) {
      const recType = bill.recurrence_type_text;
      if (!recType) continue;

      const nextDue = calculateNextDueDate(bill.due_date, recType);
      const endDate = bill.recurrence_end_date;

      if (endDate && nextDue > endDate) continue;

      const parentId = bill.parent_bill_id || bill.id;

      // Check no duplicate
      const { data: existing } = await supabase
        .from('bills')
        .select('id')
        .eq('parent_bill_id', parentId)
        .eq('due_date', nextDue)
        .maybeSingle();

      if (existing) continue;

      const { error: insertError } = await supabase
        .from('bills')
        .insert({
          user_id: bill.user_id,
          description: bill.description,
          amount: bill.amount,
          due_date: nextDue,
          type: bill.type,
          category_id: bill.category_id,
          recurrent: true,
          recurrence_type_text: bill.recurrence_type_text,
          recurrence_day: bill.recurrence_day,
          recurrence_end_date: bill.recurrence_end_date,
          parent_bill_id: parentId,
          recurrence_count: (bill.recurrence_count || 0) + 1,
          notes: bill.notes,
        });

      if (!insertError) generated++;
    }

    return new Response(
      JSON.stringify({ success: true, generated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateNextDueDate(currentDue: string, recType: string): string {
  const d = new Date(currentDue);
  switch (recType) {
    case 'semanal': d.setDate(d.getDate() + 7); break;
    case 'quinzenal': d.setDate(d.getDate() + 15); break;
    case 'mensal': d.setMonth(d.getMonth() + 1); break;
    case 'bimestral': d.setMonth(d.getMonth() + 2); break;
    case 'trimestral': d.setMonth(d.getMonth() + 3); break;
    case 'semestral': d.setMonth(d.getMonth() + 6); break;
    case 'anual': d.setFullYear(d.getFullYear() + 1); break;
    default: d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().split('T')[0];
}
