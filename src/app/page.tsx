'use client'

import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export default function Home() {
    const [session, setSession] = useState<Session | null>(null)
    const router = useRouter()

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session)
            if (data.session) {
                router.push('/dashboard')
            }
        })

        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session)
                if (session) {
                    router.push('/dashboard')
                }
            }
        )

        return () => {
            listener.subscription.unsubscribe()
        }
    }, [router])

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 flex items-center justify-center px-6">

            <div className="w-full max-w-md bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-10 text-center">

                <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">
                    Smart Bookmarks
                </h1>

                <p className="text-sm text-gray-500 mb-8">
                    A minimal, real-time bookmark manager
                </p>

                <button
                    onClick={handleLogin}
                    className="w-full py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-900 transition transform hover:scale-[1.02]"
                >
                    Continue with Google
                </button>

                <p className="text-xs text-gray-400 mt-6">
                    Secure authentication powered by Supabase
                </p>

            </div>

        </div>
    )

}
