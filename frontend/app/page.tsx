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

  if (error) return <div>Erro ao carregar dados: {error.message}</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Monitoramento de Impressoras</h1>
            <p className="text-gray-500 font-medium mt-1">SME - Visão Geral</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {impressoras?.map((imp) => {
            const toner = imp.tabelaToner?.[0];
            const nivelToner = toner?.qtd_toner ?? 0;

            return (
              // O Link transforma o card inteiro em um botão clicável
              <Link href={`/impressora/${imp.id}`} key={imp.id}>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer h-full flex flex-col justify-between group">
                  
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {imp.nome_maquina || imp.modelo_impressora}
                    </h2>
                    <p className="text-sm text-gray-500">IP: {imp.endereco_ip}</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-semibold text-gray-600">Toner</span>
                      <span className={`text-sm font-bold ${nivelToner <= 15 ? 'text-red-600' : 'text-gray-700'}`}>
                        {nivelToner}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${nivelToner >= 50 ? 'bg-green-500' : nivelToner >= 15 ? 'bg-yellow-400' : 'bg-red-500'}`}
                        style={{ width: `${nivelToner}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-blue-500 font-medium text-right opacity-0 group-hover:opacity-100 transition-opacity">
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