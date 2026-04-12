import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60;

export default async function DetalhesImpressora({ params }: { params: { id: string } }) {
  const { id } = params;

  // Busca a impressora específica pelo ID
  const { data: impressora, error } = await supabase
    .from('tabelaImpressoras')
    .select(`
      *,
      tabelaToner ( cor_toner, qtd_toner, id ),
      tabelaContador ( qtd_contador, id )
    `)
    .eq('id', id)
    .single();

  if (error || !impressora) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Impressora não encontrada</h1>
        <Link href="/" className="text-blue-500 hover:underline">&larr; Voltar para o início</Link>
      </div>
    );
  }

  const toner = impressora.tabelaToner?.[0];
  const contador = impressora.tabelaContador?.[0];

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Botão de Voltar */}
        <div className="mb-6">
          <Link href="/" className="text-gray-500 hover:text-blue-600 flex items-center gap-2 font-medium transition-colors">
            &larr; Voltar para o Dashboard
          </Link>
        </div>

        {/* Cabeçalho da Impressora */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">{impressora.nome_maquina || impressora.modelo_impressora}</h1>
          <p className="text-lg text-gray-500 mt-2">Modelo: {impressora.modelo_impressora}</p>
          <div className="mt-4 inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold border border-blue-100">
            Endereço IP: {impressora.endereco_ip}
          </div>
        </div>

        {/* Informações Detalhadas (Grade) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card do Toner */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Status do Suprimento</h2>
            
            <div className="flex items-center justify-center mb-6">
              <div className="text-6xl font-black text-gray-900">
                {toner?.qtd_toner ?? 0}<span className="text-3xl text-gray-400">%</span>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-6">
              <div 
                className={`h-6 rounded-full transition-all duration-1000 ${
                  (toner?.qtd_toner ?? 0) >= 50 ? 'bg-green-500' : 
                  (toner?.qtd_toner ?? 0) >= 15 ? 'bg-yellow-400' : 'bg-red-500'
                }`}
                style={{ width: `${toner?.qtd_toner ?? 0}%` }}
              ></div>
            </div>
            {toner?.cor_toner && (
              <p className="text-center mt-4 text-gray-500 font-medium uppercase tracking-widest text-sm">
                Cor: {toner.cor_toner}
              </p>
            )}
          </div>

          {/* Card do Contador */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Volume de Impressão</h2>
            <p className="text-gray-500 mb-2 font-medium">Total de páginas impressas até o momento:</p>
            <div className="text-5xl font-black text-blue-600 bg-blue-50 w-full py-8 rounded-xl border border-blue-100">
              {contador?.qtd_contador?.toLocaleString('pt-BR') || '---'}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}