// Raiz/frontend/app/page.tsx
import { createClient } from '@supabase/supabase-js';

// Configuração das chaves (Certifique-se que estão na Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Atualização automática a cada 60 segundos
export const revalidate = 60;

export default async function Dashboard() {
  // Busca os dados seguindo a estrutura exata do seu schema
  const { data: impressoras, error } = await supabase
    .from('tabelaImpressoras')
    .select(`
      id,
      nome_maquina,
      modelo_impressora,
      endereco_ip,
      tabelaToner ( cor_toner, qtd_toner, id ),
      tabelaContador ( qtd_contador, id )
    `);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-rose-50 p-10">
        <div className="bg-white p-12 rounded-3xl shadow-2xl border-4 border-rose-200 text-center">
          <h1 className="text-5xl font-extrabold text-rose-600 mb-6">Erro de Conexão</h1>
          <p className="text-2xl text-rose-900">{error.message}</p>
        </div>
      </div>
    );
  }

  // Lógica de cores conforme a imagem de referência
  const getTonerColor = (percent: number) => {
    if (percent >= 50) return 'bg-emerald-500'; // Verde
    if (percent >= 15) return 'bg-amber-400';   // Amarelo
    return 'bg-rose-500';                       // Vermelho
  };

  return (
    // Container Principal: Otimizado para 1920x1080
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans antialiased text-slate-900">
      
      {/* Cabeçalho Superior */}
      <header className="flex items-center justify-between pb-10 mb-10 border-b-2 border-slate-200">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-950 uppercase">
            Monitoramento de Impressoras
          </h1>
          <p className="text-2xl text-slate-600 mt-2 font-medium">Secretaria Municipal de Educação - SME</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
          <p className="text-xl font-bold text-slate-900 uppercase tracking-wider">Live Dashboard</p>
        </div>
      </header>

      {/* Grid de Cards - 3 Colunas para preencher bem o Full HD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {impressoras?.map((imp) => {
          const toner = imp.tabelaToner?.[0]; // Pega a primeira medição de toner
          const contador = imp.tabelaContador?.[0]; // Pega o último contador
          const nivelToner = toner?.qtd_toner ?? 0;
          const corBarra = getTonerColor(nivelToner);

          return (
            <div key={imp.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
              
              {/* Título e Identificação */}
              <div className="mb-8">
                <div className="flex justify-between items-start">
                  <h2 className="text-3xl font-black text-slate-950 leading-none truncate pr-2 uppercase">
                    {imp.nome_maquina || imp.modelo_impressora}
                  </h2>
                </div>
                <p className="text-xl text-slate-500 font-bold mt-2 tracking-tight">
                  IP: {imp.endereco_ip}
                </p>
              </div>

              {/* Área da Barra de Toner - Seguindo o padrão visual da imagem */}
              <div className="relative mb-8">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-lg font-black text-slate-700 uppercase tracking-widest">Nível de Suprimento</span>
                </div>
                
                {/* Trilha da Barra */}
                <div className="w-full bg-slate-100 rounded-2xl h-14 border-2 border-slate-200 overflow-hidden relative flex items-center shadow-inner">
                  {/* Preenchimento Dinâmico */}
                  <div 
                    className={`${corBarra} h-full transition-all duration-1000 ease-in-out shadow-[4px_0_10px_rgba(0,0,0,0.1)]`}
                    style={{ width: `${nivelToner}%` }}
                  ></div>
                  
                  {/* Texto do Percentual em Destaque */}
                  <span className="absolute right-6 text-3xl font-black text-slate-900 drop-shadow-sm">
                    {nivelToner}%
                  </span>
                </div>
              </div>

              {/* Rodapé do Card: Contador de Páginas */}
              <div className="pt-6 border-t-2 border-slate-50 flex justify-between items-center">
                <span className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Páginas Totais</span>
                <span className="text-3xl font-black text-blue-600">
                  {contador?.qtd_contador?.toLocaleString('pt-BR') || '---'}
                </span>
              </div>

            </div>
          );
        })}
      </div>
      
    </main> // Corrigido aqui: </main> em vez de </footer>
  );
}