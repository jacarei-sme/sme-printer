import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60;

export default async function DetalhesImpressora({ params }: { params: { id: string } }) {
  const { id } = params;

  // Busca dados de apenas 1 impressora
  const { data: impressora, error } = await supabase
    .from('tabelaImpressoras')
    .select(`*, tabelaToner ( cor_toner, qtd_toner, id ), tabelaContador ( qtd_contador, id )`)
    .eq('id', id)
    .single();

  if (error || !impressora) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-rose-600 mb-4">Impressora não encontrada</h1>
        <Link href="/" className="text-blue-600 font-bold hover:underline">&larr; Voltar para o início</Link>
      </div>
    );
  }

  const toner = impressora.tabelaToner?.[0];
  const contador = impressora.tabelaContador?.[0];
  const nivelToner = toner?.qtd_toner ?? 0;
  const corToner = nivelToner >= 50 ? 'bg-emerald-500' : nivelToner >= 15 ? 'bg-amber-400' : 'bg-rose-500';

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        
        {/* Botão de Voltar */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm md:text-base text-slate-500 hover:text-blue-700 font-bold transition-all duration-300 mb-6 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md">
          &larr; Voltar para o Dashboard
        </Link>

        {/* Informações Superiores da Impressora */}
        <div className="mb-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{impressora.nome_maquina || impressora.modelo_impressora}</h1>
            <p className="text-base text-slate-500 font-medium mt-1">Modelo: {impressora.modelo_impressora}</p>
            <div className="mt-4 inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold border border-blue-100 text-sm tracking-wide">
              Endereço IP: {impressora.endereco_ip}
            </div>
          </div>
        </div>

        {/* Grade de Detalhes (Toner e Contador) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card do Toner Gigante */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Status do Suprimento</h2>
            <div className="flex justify-center mb-6">
              <div className="text-6xl font-black text-slate-900">
                {nivelToner}<span className="text-3xl text-slate-400">%</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-6 border border-slate-300 overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${corToner}`}
                style={{ width: `${nivelToner}%` }}
              ></div>
            </div>
            {toner?.cor_toner && (
              <p className="text-center mt-4 text-slate-500 font-medium uppercase tracking-widest text-sm">
                Cor: {toner.cor_toner}
              </p>
            )}
          </div>

          {/* Card do Contador de Páginas */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Volume de Impressão</h2>
            <p className="text-slate-500 mb-2 font-medium">Total de páginas impressas:</p>
            <div className="text-4xl md:text-5xl font-black text-blue-600 bg-blue-50 w-full py-8 rounded-xl border border-blue-200 mt-2 flex justify-center items-center shadow-inner">
              {contador?.qtd_contador?.toLocaleString('pt-BR') || '---'}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}