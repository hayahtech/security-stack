import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { chave } = await req.json();

    if (!chave || typeof chave !== "string") {
      return new Response(
        JSON.stringify({ error: "Chave de acesso é obrigatória." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean key - only digits
    const cleanKey = chave.replace(/\D/g, "");
    if (cleanKey.length !== 44) {
      return new Response(
        JSON.stringify({ error: "Chave de acesso deve ter 44 dígitos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query BrasilAPI
    const brasilApiUrl = `https://brasilapi.com.br/api/nfe/v1/${cleanKey}`;
    const response = await fetch(brasilApiUrl, {
      headers: { "User-Agent": "PizzaFlow/1.0" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BrasilAPI error:", response.status, errorText);

      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: "NF-e não encontrada. Verifique a chave de acesso." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao consultar NF-e. Tente novamente em alguns minutos." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nfeData = await response.json();

    // Normalize the response to our format
    const result = {
      chave: cleanKey,
      numero: nfeData.nfe_numero || nfeData.numero || "",
      serie: nfeData.nfe_serie || nfeData.serie || "",
      data_emissao: nfeData.data_emissao || nfeData.dh_emi || "",
      valor_total: nfeData.valor_total || nfeData.vNF || 0,
      emitente: {
        cnpj: nfeData.cnpj_emitente || nfeData.emit?.CNPJ || "",
        nome: nfeData.nome_emitente || nfeData.emit?.xNome || "",
        fantasia: nfeData.nome_fantasia_emitente || nfeData.emit?.xFant || "",
        uf: nfeData.uf_emitente || "",
      },
      destinatario: {
        cnpj: nfeData.cnpj_destinatario || nfeData.dest?.CNPJ || "",
        nome: nfeData.nome_destinatario || nfeData.dest?.xNome || "",
      },
      itens: (nfeData.itens || nfeData.det || []).map((item: any) => ({
        codigo: item.codigo || item.prod?.cProd || "",
        descricao: item.descricao || item.prod?.xProd || "",
        ncm: item.ncm || item.prod?.NCM || "",
        cfop: item.cfop || item.prod?.CFOP || "",
        unidade: item.unidade || item.prod?.uCom || "",
        quantidade: Number(item.quantidade || item.prod?.qCom || 0),
        valor_unitario: Number(item.valor_unitario || item.prod?.vUnCom || 0),
        valor_total: Number(item.valor_total || item.prod?.vProd || 0),
      })),
      situacao: nfeData.situacao || nfeData.cSitNFe || "",
      raw: nfeData,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
