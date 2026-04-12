import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import GraficoContador from '../../components/GraficoContador'; // Importa o nosso novo componente

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60;

export default async function DetalhesImpressora({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Busca os dados. Note que removemos o limite do contador para pegar o histórico
  const { data: impressora, error } = await supabase
    .from('tabelaImpressoras')
    .select(`
      *, 
      tabelaToner ( cor_toner, qtd_toner, id ), 
      tabelaContador ( qtd_contador, id, created_at ) 
    `)
    // ATENÇÃO: Adicionei o 'created_at' no select acima. Verifique se no seu banco a data se chama assim.
    .eq('id', id)
    .single();

  if (error || !impressora) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-lg text-center border border-slate-200">
          <h1 className="text-4xl font-black text-rose-600 mb-4">Ops!</h1>
          <p className="text-xl text-slate-600 mb-6">Impressora não foi localizada.</p>
          <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  // Pega o toner mais recente (assumindo que o banco retorna ordenado ou pega o primeiro)
  const toner = impressora.tabelaToner?.[0];
  
  // Para o card principal de volume, queremos o último valor registrado
  const historicoContadores = impressora.tabelaContador || [];
  const ultimoContador = historicoContadores.length > 0 
    // Se não estiver ordenado pelo banco, pega o maior valor que representa o atual
    ? Math.max(...historicoContadores.map((c: any) => c.qtd_contador)) 
    : 0;

  const nivelToner = toner?.qtd_toner ?? 0;
  const corToner = nivelToner >= 50 ? 'bg-emerald-500' : nivelToner >= 15 ? 'bg-amber-400' : 'bg-rose-500';

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-700 font-bold mb-8 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-200 transition-all">
          &larr; Voltar para Visão Geral
        </Link>

        {/* Info Principal */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div>
              <span className="text-blue-600 font-black uppercase tracking-widest text-sm">Detalhes do Equipamento</span>
              <h1 className="text-4xl font-black text-slate-900 mt-2">
                {impressora.nome_maquina || "Sem Nome"}
              </h1>
              <p className="text-xl text-slate-500 font-medium">{impressora.modelo_impressora}</p>
            </div>
            <div className="bg-slate-100 px-6 py-3 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Endereço IP</p>
              <p className="text-xl font-mono font-bold text-slate-700">{impressora.endereco_ip}</p>
            </div>
          </div>
        </div>

        {/* Cards Superiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Card de Toner */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              Nível de Suprimento Atual
            </h2>
            <div className="relative flex flex-col items-center">
              <div className="text-7xl font-black text-slate-900 mb-6">
                {nivelToner}<span className="text-3xl text-slate-300">%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-2xl h-8 border-2 border-slate-200 overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${corToner}`}
                  style={{ width: `${nivelToner}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Card de Contador Atual */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              Contador Total
            </h2>
            <div className="flex-1 flex flex-col justify-center items-center">
              <p className="text-slate-500 mb-2 font-medium italic">Páginas impressas (Acumulado)</p>
              <div className="text-5xl font-black text-blue-700 bg-blue-50 w-full py-10 rounded-2xl border border-blue-100 flex justify-center items-center shadow-inner">
                {ultimoContador.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>

        {/* NOVO: Área de Análise e Gráficos */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              Evolução Mensal de Impressões
            </h2>
            <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">Visão Histórica</span>
          </div>
          <p className="text-slate-500 mb-8">Acompanhamento do volume acumulado de páginas ao longo dos meses.</p>
          
          {/* Chama o componente do gráfico passando os dados do banco */}
          <GraficoContador dadosHistoricos={historicoContadores} />
          
        </div>

      </div>
    </main>
  );
}