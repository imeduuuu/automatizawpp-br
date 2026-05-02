'use client';

import { useState } from 'react';

export default function TesteGratisPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    challenge: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/forms/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          source: 'teste-gratis-form',
          productInterest: formData.challenge
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao enviar formulário');
      }

      setSuccess(true);
      setFormData({ fullName: '', email: '', phone: '', company: '', challenge: '' });

      // Redirecionar após sucesso
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar formulário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen py-20 px-4 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 rounded-lg p-12 border border-green-200">
            <div className="text-5xl mb-4">✓</div>
            <h2 className="text-3xl font-bold text-green-600 mb-4">
              Parabéns! Sua inscrição foi realizada
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Enviamos um email de confirmação com instruções de acesso.
            </p>
            <p className="text-gray-600">
              Você será redirecionado em poucos segundos...
            </p>
          </div>
        </div>
      </main>
    );
  }

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
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Seu Nome
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
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
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                name="phone"
                value={formData.phone}
                onChange={handleChange}
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
                name="company"
                value={formData.company}
                onChange={handleChange}
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
                name="challenge"
                value={formData.challenge}
                onChange={handleChange}
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
              disabled={loading}
              className="w-full px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-lg disabled:bg-gray-400"
            >
              {loading ? 'Enviando...' : 'Começar Teste Grátis'}
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
