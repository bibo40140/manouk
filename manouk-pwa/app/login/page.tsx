'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isConfigured, setIsConfigured] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    // Vérifier si Supabase est configuré
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_') || supabaseKey.includes('your_')) {
      setIsConfigured(false)
    }
  }, [])
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setError('Compte créé ! Vérifiez votre email pour confirmer.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Manouk PWA
            </h1>
            <p className="text-gray-600 mt-2">Configuration requise</p>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Supabase n'est pas configuré
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Pour utiliser cette application, vous devez configurer Supabase.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📝 Étapes de configuration :</h3>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Créez un compte gratuit sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">supabase.com</a></li>
                <li>Créez un nouveau projet</li>
                <li>Copiez vos clés API (Settings → API)</li>
                <li>Modifiez le fichier <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></li>
                <li>Exécutez le script SQL <code className="bg-gray-100 px-2 py-1 rounded">supabase-schema.sql</code></li>
                <li>Relancez le serveur : <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code></li>
              </ol>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">📖 Consultez le guide complet :</p>
              <p className="text-indigo-600">→ <code>GUIDE_DEMARRAGE.md</code></p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Manouk
          </h1>
          <p className="text-gray-600 mt-2">
            {isSignUp ? 'Créer un compte' : 'Connectez-vous à votre espace'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className={`p-3 rounded-lg text-sm ${
              error.includes('créé') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50"
          >
            {loading ? 'Chargement...' : isSignUp ? 'Créer mon compte' : 'Se connecter'}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          >
            {isSignUp ? 'Déjà un compte ? Connectez-vous' : 'Pas encore de compte ? Inscrivez-vous'}
          </button>
        </form>
      </div>
    </div>
  )
}
