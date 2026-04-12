// frontend/app/page.tsx
import { createClient } from '@/utils/supabase/server'; // Ajuste o caminho se necessário
import { cookies } from 'next/headers';

// Configuração para o Digital Signage se atualizar sozinho a cada 1 minuto (60 segundos)
export const revalidate = 60;

async function Dashboard() {
  const cookieStore = cookies();
  
  // Substitua pelas suas variáveis reais se não estiverem no .env
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Busca os dados fazendo o join com as tabelas de Toner e Contador
  // Assumindo que a query traz o dado mais recente em 'last_medicao'
  const { data: impressoras, error } = await supabase
    .from('tabelaImpressoras')
    .select(`
      *,
      tabelaToner(nivel_percentual, last_medicao),
      tabelaContador(total_paginas, last_medicao)
    `);

  if (error) {
    console.error("Erro ao buscar dados do Supabase:", error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-rose-50 p-10">
        <div className="bg-white p-12 rounded-3xl shadow-2xl border-4 border-rose-200">
          <h1 className="text-5xl font-extrabold text-rose-600 mb-6">Erro de Conexão</h1>
          <p className="text-2xl text-rose-900">Não foi possível carregar os dados do painel de impressoras. Verifique os logs ou a conexão com o Supabase.</p>
        </div>
      </div>
    );
  }

  // Função auxiliar para definir a cor da barra baseada no percentual da imagem de referência
  const getTonerColor = (percent: number | null | undefined): string => {
    if (percent === null || percent === undefined) return 'bg-slate-300'; // Sem dados
    if (percent >= 50) return 'bg-emerald-500'; // Verde (Emerald no Tailwind)
    if (percent >= 15) return 'bg-amber-400';   // Amarelo (Amber no Tailwind)
    return 'bg-rose-500';                       // Vermelho (Rose no Tailwind)
  };

  // Função para formatar a data da última medição
  const formatarData = (dataIso: string | null | undefined): string => {
    if (!dataIso) return '--/--/---- --:--';
    const data = new Date(dataIso);
    return data.toLocaleString('pt-BR', { day: '2D', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    // Container Principal: Otimizado para 1920x1080 com fundo claro
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans antialiased text-slate-900">
      
      {/* Cabeçalho do Dashboard: Grande e claro no Digital Signage */}
      <header className="flex items-center justify-between pb-10 mb-10 border-b-2 border-slate-200">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-950">
            MONITORAMENTO DE IMPRESSORAS
          </h1>
          <p className="text-2xl text-slate-600 mt-2">Níveis de Suprimentos - SME Jacareí</p>
        </div>
        <div className="text-right flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          <p className="text-xl font-medium text-slate-900">Atualização automática</p>
          <p className="text-lg text-slate-500 ml-2">(60s)</p>
        </div>
      </header>

      {/* Grade de Impressoras: 3 colunas largas para Full HD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {impressoras && impressoras.map((imp: any) => {
          // Extrai o primeiro item da lista de join, assumindo que a query já trouxe o mais recente
          const toner = imp.tabelaToner?.[0];
          const contador = imp.tabelaContador?.[0];
          const nivelToner = toner?.nivel_percentual ?? 0;
          const corBarra = getTonerColor(toner?.nivel_percentual);

          return (
            // Card da Impressora: Grande, bordas suaves, sombra sutil
            <div key={imp.id} className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col justify-between transform transition-all duration-300 hover:shadow-2xl">
              
              {/* Informações Superiores do Card */}
              <div className="mb-6">
                <h2 className="text-3xl font-extrabold text-slate-950 leading-tight truncate">
                  {imp.modelo}
                </h2>
                <p className="text-xl text-slate-600 font-medium tracking-tight mt-1 truncate">
                  IP: {imp.last_ip}
                </p>
              </div>

              {/* BARRA DE TONER PRINCIPAL: Refinada conforme a imagem */}
              <div className="relative mb-6">
                <span className="text-base font-semibold text-slate-700 block mb-2">Toner</span>
                
                {/* Trilha da Barra (Background) */}
                <div className="w-full bg-slate-100 rounded-full h-10 border border-slate-200 shadow-inner overflow-hidden flex items-center">
                  
                  {/* Preenchimento da Barra: Altura total (h-10) e cor dinâmica */}
                  <div 
                    className={`${corBarra} h-full rounded-full transition-all duration-1000 ease-out shadow-lg`}
                    style={{ width: `${nivelToner}%` }}
                  ></div>
                  
                  {/* Texto do Percentual: Grande, sobrepondo a trilha */}
                  <span className={`absolute right-4 text-2xl font-black ${nivelToner < 60 ? 'text-slate-900' : 'text-slate-900'}`}>
                    {nivelToner}%
                  </span>
                </div>
              </div>

              {/* Informações Inferiores: Contadores e Atualização */}
              <div className="mt-4 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold text-slate-600">Total Impresso:</span>
                  <span className="font-bold text-slate-950">
                    {contador?.total_paginas?.toLocaleString('pt-BR') ?? '0'} págs
                  </span>
                </div>
                
                <div className="text-sm text-slate-500 text-right bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-medium">Última leitura:</span> {formatarData(toner?.last_medicao ?? contador?.last_medicao)}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </footer>
  );
}

export default Dashboard;