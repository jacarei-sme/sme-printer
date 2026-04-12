import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import GraficoContador from '../../components/GraficoContador';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60;

export default async function DetalhesImpressora({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Buscamos o histórico de toners e contadores
  const { data: impressora, error } = await supabase
    .from('tabelaImpressoras')
    .select(`
      *, 
      tabelaToner ( cor_toner, qtd_toner, id, created_at ), 
      tabelaContador ( qtd_contador, id, created_at ) 
    `)
    .eq('id', id)
    .single();

  if (error || !impressora) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-rose-600">Impressora não encontrada</h1>
        <Link href="/" className="text-blue-600 mt-4 underline">Voltar</Link>
      </div>
    );
  }

  // --- LÓGICA DE DETECÇÃO DE TROCA DE TONER ---
  const historicoToner = (impressora.tabelaToner || []).sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const trocasDetectadas: any[] = [];
  historicoToner.forEach((leitura: any, index: number) => {
    if (index > 0) {
      const valorAnterior = historicoToner[index - 1].qtd_toner;
      // Se o valor atual for maior que o anterior, houve uma recarga/troca
      if (leitura.qtd_toner > valorAnterior) {
        trocasDetectadas.push({
          data: leitura.created_at,
          de: valorAnterior,
          para: leitura.qtd_toner
        });
      }
    }
  });

  // Pegamos o valor mais recente para o display principal
  const nivelAtual = historicoToner[historicoToner.length - 1]?.qtd_toner ?? 0;
  const corToner = nivelAtual >= 50 ? 'bg-emerald-500' : nivelAtual >= 15 ? 'bg-amber-400' : 'bg-rose-500';

  const historicoContadores = impressora.tabelaContador || [];
  const ultimoContador = historicoContadores.length > 0 
    ? Math.max(...historicoContadores.map((c: any) => c.qtd_contador)) 
    : 0;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-700 font-bold mb-8 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-200 transition-all">
          &larr; Voltar para Visão Geral
        </Link>

        {/* Info Principal */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-blue-600 font-black uppercase tracking-widest text-sm">Status em Tempo Real</span>
              <h1 className="text-4xl font-black text-slate-900 mt-2">{impressora.nome_maquina}</h1>
              <p className="text-xl text-slate-500">{impressora.modelo_impressora} • {impressora.endereco_ip}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* CARD DE TONER COM HISTÓRICO DE TROCAS */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              Nível de Suprimento
            </h2>
            
            <div className="flex flex-col items-center mb-8">
              <div className="text-7xl font-black text-slate-900 mb-4">
                {nivelAtual}<span className="text-3xl text-slate-300">%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-2xl h-6 border-2 border-slate-200 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${corToner}`}
                  style={{ width: `${nivelAtual}%` }}
                ></div>
              </div>
            </div>

            {/* ÁREA DO HISTÓRICO DE TROCAS */}
            <div className="mt-auto border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Histórico de Trocas (Trocas Detectadas)</h3>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                {trocasDetectadas.length > 0 ? (
                  trocasDetectadas.reverse().map((troca, i) => (
                    <div key={i} className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">♻️</span>
                        <div>
                          <p className="text-xs font-bold text-emerald-700">Toner Substituído</p>
                          <p className="text-[10px] text-emerald-600 font-medium">
                            {new Date(troca.data).toLocaleDateString('pt-BR')} às {new Date(troca.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-400 line-through mr-2">{troca.de}%</span>
                        <span className="text-sm font-black text-emerald-600">{troca.para}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">Nenhuma troca detectada no período.</p>
                )}
              </div>
            </div>
          </div>

          {/* Card de Contador Atual */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              Volume de Impressão
            </h2>
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="text-5xl font-black text-blue-700 bg-blue-50 w-full py-10 rounded-2xl border border-blue-100 flex justify-center items-center shadow-inner">
                {ultimoContador.toLocaleString('pt-BR')}
              </div>
              <p className="mt-4 text-slate-500 font-medium italic text-sm">Contagem total de páginas</p>
            </div>
          </div>
        </div>

        {/* Gráfico de Evolução */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Evolução de Uso</h2>
          <GraficoContador dadosHistoricos={historicoContadores} />
        </div>

      </div>
    </main>
  );
}