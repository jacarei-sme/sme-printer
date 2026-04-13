import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60;

export default async function Dashboard() {
  // Buscamos os dados incluindo a data de criação para o cálculo do ano
  const { data: impressoras, error } = await supabase
    .from('tabelaImpressoras')
    .select(`
      id,
      nome_maquina,
      modelo_impressora,
      endereco_ip,
      tabelaToner ( cor_toner, qtd_toner, id ),
      tabelaContador ( qtd_contador, id, created_at )
    `);

  if (error) {
    return <div className="p-10 text-red-500">Erro ao carregar dados: {error.message}</div>;
  }

  const anoAtual = new Date().getFullYear();

  // --- PROCESSAMENTO INTELIGENTE DE DADOS ---
  const impressorasProcessadas = impressoras.map(imp => {
    
    // 1. CÁLCULO DE USO NO ANO (O SEU NOVO RANKING)
    const contadoresAno = (imp.tabelaContador || [])
      .filter((c: any) => new Date(c.created_at).getFullYear() === anoAtual)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const ultimoContador = contadoresAno.length > 0 
      ? contadoresAno[contadoresAno.length - 1].qtd_contador 
      : 0;
    
    const valorInicialAno = contadoresAno.length > 0
      ? contadoresAno[0].qtd_contador
      : ultimoContador;

    // Este é o valor que define quem "trabalha mais"
    const usoNoAno = ultimoContador - valorInicialAno;
    
    // 2. FILTRAR TONER (Apenas o mais recente de cada cor)
    const tonersPorCor: Record<string, any> = {};
    (imp.tabelaToner || []).forEach((t: any) => {
      const cor = t.cor_toner || 'Preto';
      if (!tonersPorCor[cor] || t.id > tonersPorCor[cor].id) {
        tonersPorCor[cor] = t;
      }
    });
    const tonersRecentes = Object.values(tonersPorCor);

    return { ...imp, ultimoContador, usoNoAno, tonersRecentes };
  });

  // Ranking baseado no Uso Real (Uso no Ano)
  const rankingUso = [...impressorasProcessadas]
    .sort((a, b) => b.usoNoAno - a.usoNoAno)
    .slice(0, 5);

  // Alertas de Toner (Apenas recentes e ignorando Gráfica)
  const alertasToner = impressorasProcessadas.flatMap(imp => {
    const nomeBaixo = imp.nome_maquina?.toLowerCase() || "";
    const modeloBaixo = imp.modelo_impressora?.toLowerCase() || "";
    
    if (nomeBaixo.includes('gráfica') || modeloBaixo.includes('gráfica')) return [];

    return imp.tonersRecentes
      .filter((t: any) => t.qtd_toner <= 15)
      .map((t: any) => ({
        unidade: imp.nome_maquina,
        nivel: t.qtd_toner,
        cor: t.cor_toner
      }));
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Monitoramento SME</h1>
            <p className="text-slate-500 font-medium">Gestão centralizada e análise de demanda</p>
          </div>
        </div>

        {/* DASHBOARD SUPERIOR: Ranking e Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
             {/* ... conteúdo do RankingUso ... */}
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
             {/* ... conteúdo dos AlertasToner ... */}
          </div>
        </div>

        {/* --- NOVO: GRÁFICO DE USO GERAL DA REDE --- */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-800">Volume de Impressão Global</h2>
              <p className="text-sm text-slate-400 font-medium">Uso acumulado de todas as unidades da SME neste ano</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
              <span className="text-[10px] font-black text-blue-400 uppercase block leading-none mb-1">Total Acumulado</span>
              <span className="text-xl font-black text-blue-700">
                {impressorasProcessadas.reduce((acc, imp) => acc + imp.usoNoAno, 0).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
          
          <GraficoGeralUso impressoras={impressorasProcessadas} />
        </div>

        {/* GRID DE IMPRESSORAS (Lista Completa) */}
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 ml-2">Todos os Equipamentos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* ... mapeamento dos cards das impressoras ... */}
        </div>
      </div>
    </main>
  );
}
}