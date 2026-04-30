import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teste Grátis por 7 Dias - AutomatizaWPP',
  description: 'Crie sua conta e teste AutomatizaWPP gratuitamente por 7 dias. Sem cartão de crédito necessário. Acesso completo a todos os recursos.',
  alternates: {
    canonical: 'https://www.automatizawpp.com/teste-gratis',
  },
};

export default function TesteGratisPage() {
  return (
    <main className="min-h-screen py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6">
            Teste Grátis por 7 Dias
          </h1>
          <p className="text-xl text-gray-600">
            Nenhum cartão de crédito necessário. Acesso completo a todos os recursos.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Seu Nome
              </label>
              <input
                type="text"
                placeholder="João Silva"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="joao@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefone com WhatsApp
              </label>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome da Empresa
              </label>
              <input
                type="text"
                placeholder="Sua Empresa"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Qual é seu maior desafio?
              </label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-600"
                required
              >
                <option value="">Selecione uma opção</option>
                <option value="leads">Qualificar mais leads</option>
                <option value="vendas">Aumentar vendas</option>
                <option value="atendimento">Melhorar atendimento</option>
                <option value="custos">Reduzir custos operacionais</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-lg"
            >
              Começar Teste Grátis
            </button>

            <p className="text-sm text-gray-500 text-center">
              Ao continuar, você concorda com nossos <a href="/termos" className="text-green-600 hover:underline">Termos de Serviço</a> e <a href="/privacidade" className="text-green-600 hover:underline">Política de Privacidade</a>
            </p>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">✓</div>
            <h3 className="font-semibold mb-2">Sem Cartão de Crédito</h3>
            <p className="text-sm text-gray-600">Não precisamos de cartão para começar</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">✓</div>
            <h3 className="font-semibold mb-2">Acesso Completo</h3>
            <p className="text-sm text-gray-600">Todos os recursos disponíveis</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">✓</div>
            <h3 className="font-semibold mb-2">Suporte 24/7</h3>
            <p className="text-sm text-gray-600">Equipe pronta para ajudar</p>
          </div>
        </div>
      </div>
    </main>
  );
}
