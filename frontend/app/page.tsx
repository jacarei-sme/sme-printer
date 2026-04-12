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
    <main className="app-container">
      <div className="app-wrapper">
        
        <header className="header-card">
          <div>
            <h1 className="header-title">Monitoramento de Impressoras</h1>
            <p className="header-subtitle">SME - Visão Geral</p>
          </div>
        </header>

        <div className="cards-grid">
          {impressoras?.map((imp) => {
            const toner = imp.tabelaToner?.[0];
            const nivelToner = toner?.qtd_toner ?? 0;

            // Mantemos apenas a lógica dinâmica da cor no inline-style
            const corToner = nivelToner >= 50 ? 'bg-green-500' : nivelToner >= 15 ? 'bg-yellow-400' : 'bg-red-500';

            return (
              <Link href={`/impressora/${imp.id}`} key={imp.id}>
                <div className="printer-card">
                  
                  <div className="mb-4">
                    <h2 className="card-title">{imp.nome_maquina || imp.modelo_impressora}</h2>
                    <p className="card-ip">IP: {imp.endereco_ip}</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-semibold text-gray-600">Toner</span>
                      <span className={`text-sm font-bold ${nivelToner <= 15 ? 'text-red-600' : 'text-gray-700'}`}>
                        {nivelToner}%
                      </span>
                    </div>
                    <div className="toner-track">
                      <div 
                        className={`toner-fill h-3 ${corToner}`}
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