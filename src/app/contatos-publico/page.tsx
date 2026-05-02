'use client';

import { useState } from 'react';

export default function ContatosPublicoPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
          source: 'contatos-form',
          productInterest: formData.message
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      setSuccess(true);
      setFormData({ fullName: '', email: '', phone: '', company: '', message: '' });

      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem. Tente novamente.');
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
              Obrigado por entrar em contato!
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Recebemos sua mensagem e entraremos em contato em breve.
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
            Entre em Contato Conosco
          </h1>
          <p className="text-xl text-gray-600">
            Tem dúvidas? Envie uma mensagem e nossa equipe responderá em breve.
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
                Nome Completo
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
                Empresa
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Sua Empresa"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mensagem
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Conte-nos como podemos ajudar..."
                rows={5}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-lg disabled:bg-gray-400"
            >
              {loading ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Outras Formas de Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Email</h3>
              <a href="mailto:hola@automatizawpp.com" className="text-green-600 hover:underline">
                hola@automatizawpp.com
              </a>
            </div>
            <div>
              <h3 className="font-semibold mb-2">WhatsApp</h3>
              <a href="https://wa.me/5511999999999" className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Clique para conversar
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
