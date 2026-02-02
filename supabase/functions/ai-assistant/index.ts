import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const { messages, context, analysisType } = await req.json();

    // System prompts based on analysis type
    const systemPrompts: Record<string, string> = {
      general: `أنت مساعد محاسبي ذكي لنظام سمو الأمجاد المحاسبي. تساعد في:
- تحليل البيانات المالية وتقديم رؤى مفيدة
- الإجابة على الأسئلة المحاسبية
- تقديم نصائح لتحسين الأداء المالي
- شرح المفاهيم المحاسبية بشكل مبسط

أجب دائماً باللغة العربية وبشكل مختصر ومفيد.`,
      
      financial_analysis: `أنت محلل مالي خبير. قم بتحليل البيانات المالية المقدمة وقدم:
- ملخص الأداء المالي
- نقاط القوة والضعف
- توصيات للتحسين
- مقارنة بالفترات السابقة إن وجدت

أجب باللغة العربية.`,
      
      invoice_insights: `أنت خبير في تحليل الفواتير. قم بتحليل بيانات الفواتير وقدم:
- أنماط الشراء والبيع
- العملاء الأكثر نشاطاً
- المنتجات الأكثر مبيعاً
- توقعات للفترة القادمة

أجب باللغة العربية.`,
      
      tax_advisor: `أنت مستشار ضريبي. ساعد في:
- حساب الضرائب المستحقة
- تقديم نصائح للتخطيط الضريبي
- شرح القوانين الضريبية السعودية
- تحديد الخصومات المتاحة

أجب باللغة العربية.`
    };

    const systemPrompt = systemPrompts[analysisType || 'general'];

    // Build messages array
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...(context ? [{ role: "user", content: `السياق والبيانات المتاحة:\n${JSON.stringify(context, null, 2)}` }] : []),
      ...messages
    ];

    console.log("Calling Groq API with", apiMessages.length, "messages");

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً" 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || "عذراً، لم أتمكن من معالجة طلبك";

    console.log("Groq response received successfully");

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      usage: data.usage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Assistant error:", error);
    const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
