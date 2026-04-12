import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60;

export default async function DetalhesImpressora({ params }: { params: { id: string } }) {
  const { id } = params;

  const { data: impressora, error } = await supabase
    .from('tabelaImpressoras')
    .select(`*, tabelaToner ( cor_toner, qtd_toner, id ), tabelaContador ( qtd_contador, id )`)
    .eq('id', id)
    .single();

  if (error || !impressora) {
    return (
      <div className="app-container flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Impressora não encontrada</h1>
        <Link href="/" className="text-blue-500 hover:underline">&larr; Voltar</Link>
      </div>
    );
  }

  const toner = impressora.tabelaToner?.[0];
  const contador = impressora.tabelaContador?.[0];
  const nivelToner = toner?.qtd_toner ?? 0;
  const corToner = nivelToner >= 50 ? 'bg-green-500' : nivelToner >= 15 ? 'bg-yellow-400' : 'bg-red-500';

  return (
    <main className="app-container">
      <div className="detail-wrapper">
        
        <Link href="/" className="btn-back">
          &larr; Voltar para o Dashboard
        </Link>

        <div className="header-card">
          <div>
            <h1 className="header-title">{impressora.nome_maquina || impressora.modelo_impressora}</h1>
            <p className="header-subtitle">Modelo: {impressora.modelo_impressora}</p>
            <div className="ip-badge">Endereço IP: {impressora.endereco_ip}</div>
          </div>
        </div>

        <div className="detail-grid">
          
          <div className="detail-card">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Status do Suprimento</h2>
            <div className="flex justify-center mb-6">
              <div className="text-6xl font-black text-gray-900">
                {nivelToner}<span className="text-3xl text-gray-400">%</span>
              </div>
            </div>
            <div className="toner-track-large">
              <div 
                className={`toner-fill h-6 ${corToner}`}
                style={{ width: `${nivelToner}%` }}
              ></div>
            </div>
            {toner?.cor_toner && (
              <p className="text-center mt-4 text-gray-500 font-medium uppercase tracking-widest text-sm">
                Cor: {toner.cor_toner}
              </p>
            )}
          </div>

          <div className="detail-card flex flex-col justify-center items-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Volume de Impressão</h2>
            <p className="text-gray-500 mb-2 font-medium">Total de páginas impressas:</p>
            <div className="counter-box">
              {contador?.qtd_contador?.toLocaleString('pt-BR') || '---'}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}