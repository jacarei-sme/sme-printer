import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60;

export default async function Dashboard() {
  const { data: impressoras, error } = await supabase
    .from('tabelaImpressoras')
    .select(`
      id,
      nome_maquina,
      modelo_impressora,
      endereco_ip,
      tabelaToner ( qtd_toner ),
      tabelaContador ( qtd_contador )
    `);

  if (error) return <div className="p-10 text-red-600 font-bold text-center">Erro ao carregar dados: {error.message}</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho */}
        <header className="mb-10 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Monitoramento de Impressoras</h1>
            <p className="text-slate-500 font-medium mt-1">SME - Visão Geral</p>
          </div>
        </header>

        {/* Grelha de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {impressoras?.map((imp) => {
            const toner = imp.tabelaToner?.[0];
            const nivelToner = toner?.qtd_toner ?? 0;
            // Cor baseada na percentagem
            const corToner = nivelToner >= 50 ? 'bg-emerald-500' : nivelToner >= 15 ? 'bg-amber-400' : 'bg-rose-500';

            return (
              <Link href={`/impressora/${imp.id}`} key={imp.id}>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 hover:border-blue-400 transition-all duration-300 cursor-pointer h-full flex flex-col justify-between group">
                  
                  {/* Título da Impressora */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
                      {imp.nome_maquina || imp.modelo_impressora}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">IP: {imp.endereco_ip}</p>
                  </div>

                  {/* Barra de Toner */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-semibold text-slate-600">Toner</span>
                      <span className={`text-sm font-bold ${nivelToner <= 15 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {nivelToner}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 border border-slate-300 overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${corToner}`}
                        style={{ width: `${nivelToner}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Texto "Ver detalhes" que aparece ao passar o rato */}
                  <div className="mt-6 text-sm text-blue-600 font-bold text-right opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Ver detalhes &rarr;
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}