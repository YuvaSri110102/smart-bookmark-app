'use client'

import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session } from '@supabase/supabase-js'

interface Bookmark {
    id: string
    title: string
    url: string
    created_at: string
    user_id: string
}

export default function Dashboard() {
    const [session, setSession] = useState<Session | null>(null)
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
    const [title, setTitle] = useState('')
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        let channel: any

        const setupRealtime = async (currentSession: Session) => {
            setSession(currentSession)

            await fetchBookmarks()

            channel = supabase
                .channel('bookmarks-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'bookmarks',
                    },
                    async () => {
                        await fetchBookmarks()
                    }
                )
                .subscribe((status) => {
                })
        }

        const { data: listener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session) {
                    await setupRealtime(session)
                } else {
                    router.push('/')
                }
            }
        )

        return () => {
            listener.subscription.unsubscribe()
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [router])

    const handleAddBookmark = async () => {
        if (!title || !url || !session) return

        try {
            new URL(url)
        } catch {
            alert('Please enter a valid URL including https://')
            return
        }

        setLoading(true)

        const { error } = await supabase.from('bookmarks').insert([
            {
                title,
                url,
                user_id: session.user.id,
            },
        ])

        if (!error) {
            setTitle('')
            setUrl('')
        }

        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        await supabase.from('bookmarks').delete().eq('id', id)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const fetchBookmarks = async () => {
        const { data, error } = await supabase
            .from('bookmarks')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setBookmarks(data)
        }
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 flex justify-center">
            <div className="w-full max-w-2xl px-6 py-12">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                            Smart Bookmarks
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {session?.user.email}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-white border shadow-sm hover:shadow transition hover:bg-gray-50 cursor-pointer"
                    >
                        Logout
                    </button>
                </div>

                <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-2xl shadow-lg p-6 mb-10 transition">
                    <h2 className="text-lg font-medium mb-5 text-gray-800">
                        Add a new bookmark
                    </h2>

                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Bookmark title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-black/80 transition"
                        />

                        <input
                            type="text"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-black/80 transition"
                        />

                        <button
                            onClick={handleAddBookmark}
                            disabled={!title || !url || loading}
                            className="w-full py-2.5 rounded-xl bg-black text-white font-medium hover:bg-gray-900 transition disabled:opacity-40 cursor-pointer"
                        >
                            {loading ? 'Adding...' : 'Add Bookmark'}
                        </button>
                    </div>
                </div>

                <div className="space-y-5">
                    {bookmarks.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-gray-400 text-sm mb-2">
                                No bookmarks yet
                            </p>
                            <p className="text-gray-300 text-xs">
                                Start building your collection
                            </p>
                        </div>
                    )}

                    {bookmarks.map((bookmark) => (
                        <div
                            key={bookmark.id}
                            onClick={() => window.open(bookmark.url, '_blank')}
                            className="group bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex justify-between items-center"
                        >
                            <div className="overflow-hidden">
                                <p className="font-medium text-gray-800 truncate">
                                    {bookmark.title}
                                </p>
                                <p className="text-sm text-blue-600 truncate">
                                    {bookmark.url}
                                </p>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(bookmark.id)
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg border bg-white hover:bg-red-50 hover:border-red-300 text-gray-500 hover:text-red-600 transition cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}
