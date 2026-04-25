'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Music, Upload, BarChart2, Library,
    Play, Pause, X, Search, Trash2, Image as ImageIcon,
    ChevronDown, ChevronUp, Plus, CheckSquare, Square,
    Flame, Clock, Disc3, Mic2, Radio, Headphones,
    AlertCircle, Loader2, Volume2, ListMusic, Check,
    PlusCircle, Pencil, MoreHorizontal
} from 'lucide-react';
import { useBackgroundContext } from '@/app/(protected)/context/BackgroundContext';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_API_URL;
const BASE_URL = SERVER_URL?.endsWith('/admin')
    ? SERVER_URL.replace(/\/admin$/, '/music')
    : (SERVER_URL ?? '') + '/music';

const PRESET_GENRES = [
    { name: 'Pop', icon: '🎤' }, { name: 'Rock', icon: '🎸' },
    { name: 'Hip-Hop', icon: '🎧' }, { name: 'Jazz', icon: '🎷' },
    { name: 'Classical', icon: '🎻' }, { name: 'Electronic', icon: '🎛️' },
    { name: 'Lo-fi', icon: '☕' }, { name: 'R&B', icon: '🎶' },
    { name: 'Metal', icon: '🤘' }, { name: 'Indie', icon: '🌿' },
    { name: 'Blues', icon: '🎺' }, { name: 'Country', icon: '🪕' },
    { name: 'Reggae', icon: '🌴' }, { name: 'Soul', icon: '💿' },
    { name: 'Ambient', icon: '🌌' },
];

function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(secs) {
    if (!secs) return '';
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

async function api(path, opts = {}) {
    const res = await fetch(`${BASE_URL}${path}`, opts);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
}

// ─── Genre Badges (multi) ─────────────────────────────────────────────────────
function GenreBadges({ genres, isDark, max = 2 }) {
    if (!genres) return null;
    const list = Array.isArray(genres) ? genres : [genres];
    const shown = list.slice(0, max);
    const rest = list.length - max;
    return (
        <div className="flex gap-1 flex-wrap">
            {shown.map(g => (
                <span key={g} className={`text-xs px-2 py-0.5 rounded-lg font-medium
                    ${isDark ? 'bg-white/8 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    {g}
                </span>
            ))}
            {rest > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-lg font-medium
                    ${isDark ? 'bg-white/8 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                    +{rest}
                </span>
            )}
        </div>
    );
}

// ─── Genre Picker (multi-select) ──────────────────────────────────────────────
function GenrePicker({ selected, onChange, isDark }) {
    const [custom, setCustom] = useState('');

    const toggle = (name) => {
        if (selected.includes(name)) onChange(selected.filter(g => g !== name));
        else onChange([...selected, name]);
    };

    const addCustom = () => {
        const val = custom.trim();
        if (val && !selected.includes(val)) onChange([...selected, val]);
        setCustom('');
    };

    const remove = (name) => onChange(selected.filter(g => g !== name));

    const inputCls = isDark
        ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-violet-500 focus:ring-violet-500/20'
        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-400 focus:ring-violet-400/20';

    return (
        <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-3
                ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Genre * <span className={`normal-case font-normal ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>(select multiple)</span>
            </label>

            {/* Selected tags */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {selected.map(g => (
                        <span key={g} className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-medium border
                            ${isDark ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-700'}`}>
                            {PRESET_GENRES.find(p => p.name === g)?.icon ?? '🎵'} {g}
                            <button onClick={() => remove(g)} className="hover:opacity-70 transition-opacity">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_GENRES.map(g => {
                    const active = selected.includes(g.name);
                    return (
                        <button key={g.name} onClick={() => toggle(g.name)}
                            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all flex items-center gap-1
                                ${active
                                    ? isDark ? 'bg-violet-500/20 border-violet-500 text-violet-300' : 'bg-violet-50 border-violet-400 text-violet-700'
                                    : isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}>
                            {active && <Check size={11} />}
                            {g.icon} {g.name}
                        </button>
                    );
                })}
            </div>

            {/* Custom genre input */}
            <div className="flex gap-2">
                <input
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${inputCls}`}
                    placeholder="Add custom genre…"
                    value={custom}
                    onChange={e => setCustom(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustom()}
                />
                <button onClick={addCustom}
                    disabled={!custom.trim()}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed
                        ${isDark ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                    Add
                </button>
            </div>
        </div>
    );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange, isDark }) {
    return (
        <div className={`flex gap-1 p-1 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            {tabs.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onChange(t.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center
                        ${active === t.id
                            ? isDark
                                ? 'bg-white/15 text-white shadow-lg'
                                : 'bg-white text-gray-900 shadow-md'
                            : isDark
                                ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
                        }`}
                >
                    <span className={`${active === t.id ? (isDark ? 'text-violet-400' : 'text-violet-600') : ''}`}>
                        {t.icon}
                    </span>
                    <span className="hidden sm:inline">{t.label}</span>
                </button>
            ))}
        </div>
    );
}

// ─── Add to Playlist Modal ────────────────────────────────────────────────────
function AddToPlaylistModal({ track, isDark, onClose }) {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [done, setDone] = useState([]);

    useEffect(() => {
        api('/playlists').then(setPlaylists).catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleAdd = async (playlistId) => {
        setSaving(playlistId);
        try {
            await api(`/playlists/${playlistId}/tracks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackIds: [track._id] }),
            });
            setDone(d => [...d, playlistId]);
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className={`relative w-full max-w-sm rounded-3xl border shadow-2xl p-5
                    ${isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Add to Playlist
                    </h3>
                    <button onClick={onClose}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center
                            ${isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                        <X size={15} />
                    </button>
                </div>
                <p className={`text-sm mb-4 truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    "{track.title}"
                </p>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 size={22} className={`animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    </div>
                ) : playlists.length === 0 ? (
                    <div className={`text-center py-8 text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        No playlists yet. Create one first.
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                        {playlists.map(pl => {
                            const added = done.includes(pl._id) || pl.trackIds?.includes(track._id);
                            return (
                                <div key={pl._id}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl border
                                        ${isDark ? 'border-white/8 bg-white/3' : 'border-gray-100 bg-gray-50'}`}>
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                                        ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                                        <ListMusic size={15} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{pl.name}</p>
                                        <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {pl.trackIds?.length ?? 0} tracks
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => !added && handleAdd(pl._id)}
                                        disabled={added || saving === pl._id}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5
                                            ${added
                                                ? isDark ? 'bg-emerald-500/20 text-emerald-400 cursor-default' : 'bg-emerald-50 text-emerald-600 cursor-default'
                                                : isDark ? 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-400' : 'bg-violet-50 hover:bg-violet-100 text-violet-600'
                                            }`}>
                                        {saving === pl._id
                                            ? <Loader2 size={11} className="animate-spin" />
                                            : added
                                                ? <><Check size={11} /> Added</>
                                                : <><Plus size={11} /> Add</>
                                        }
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Track Row ────────────────────────────────────────────────────────────────
function TrackRow({ track, isDark, onPlay, onDelete, onCoverUpload, onAddToPlaylist, playing, index }) {
    const coverInputRef = useRef(null);
    const genres = Array.isArray(track.genre) ? track.genre : (track.genre ? [track.genre] : []);

    return (
        <div className={`group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200
            ${playing
                ? isDark ? 'bg-violet-500/15 border border-violet-500/30' : 'bg-violet-50 border border-violet-200'
                : isDark ? 'hover:bg-white/5 border border-transparent' : 'hover:bg-gray-50 border border-transparent'
            }`}>

            {/* Index / Play Button */}
            <div className="w-8 flex-shrink-0 flex items-center justify-center">
                <span className={`text-xs font-mono group-hover:hidden ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {String(index + 1).padStart(2, '0')}
                </span>
                <button
                    onClick={() => onPlay(track)}
                    className={`hidden group-hover:flex w-8 h-8 rounded-full items-center justify-center transition-all
                        ${playing ? 'flex' : ''}
                        ${isDark ? 'bg-violet-500 hover:bg-violet-400 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
                >
                    {playing
                        ? <Pause size={13} fill="currentColor" />
                        : <Play size={13} fill="currentColor" className="ml-0.5" />
                    }
                </button>
            </div>

            {/* Waveform indicator */}
            {playing && (
                <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-0.5 bg-violet-400 rounded-full animate-pulse"
                            style={{ height: `${[60, 100, 70][i - 1]}%`, animationDelay: `${i * 0.15}s` }} />
                    ))}
                </div>
            )}

            {/* Track Info */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {track.title}
                </p>
                <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {[track.artist, track.album].filter(Boolean).join(' · ') || 'Unknown artist'}
                </p>
            </div>

            {/* Genre badges */}
            <div className="hidden md:block flex-shrink-0">
                <GenreBadges genres={genres} isDark={isDark} max={2} />
            </div>

            {/* Duration */}
            {track.duration && (
                <span className={`text-xs w-10 text-right flex-shrink-0 tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatDuration(track.duration)}
                </span>
            )}

            {/* Actions */}
            <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { if (e.target.files[0]) onCoverUpload(track._id, e.target.files[0]); }} />
                <button onClick={() => onAddToPlaylist(track)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                        ${isDark ? 'hover:bg-white/10 text-gray-500 hover:text-violet-400' : 'hover:bg-gray-100 text-gray-400 hover:text-violet-600'}`}
                    title="Add to playlist">
                    <ListMusic size={14} />
                </button>
                <button onClick={() => coverInputRef.current?.click()}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                        ${isDark ? 'hover:bg-white/10 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                    title="Upload cover art">
                    <ImageIcon size={14} />
                </button>
                <button onClick={() => onDelete(track._id)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                        ${isDark ? 'hover:bg-red-500/15 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                    title="Delete">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

// ─── Mini Player ──────────────────────────────────────────────────────────────
function MiniPlayer({ track, streamUrl, isDark, onClose }) {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (streamUrl && audioRef.current) {
            audioRef.current.src = streamUrl;
            audioRef.current.play().then(() => setPlaying(true)).catch(() => { });
        }
    }, [streamUrl]);

    const toggle = () => {
        if (!audioRef.current) return;
        if (playing) { audioRef.current.pause(); setPlaying(false); }
        else { audioRef.current.play(); setPlaying(true); }
    };

    const seek = (e) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
    };

    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(480px,calc(100vw-2rem))]
            rounded-2xl border backdrop-blur-2xl shadow-2xl
            ${isDark ? 'bg-gray-900/90 border-white/10' : 'bg-white/95 border-gray-200'}`}>
            <audio ref={audioRef}
                onTimeUpdate={() => { if (audioRef.current) setProgress(audioRef.current.currentTime); }}
                onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
                onEnded={() => setPlaying(false)}
            />
            <div className="px-4 py-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                    <Volume2 size={18} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{track.title}</p>
                    <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{track.artist || 'Unknown artist'}</p>
                </div>
                <button onClick={toggle}
                    className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-colors">
                    {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
                </button>
                <button onClick={onClose}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors
                        ${isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                    <X size={15} />
                </button>
            </div>
            {duration > 0 && (
                <div className="px-4 pb-3">
                    <div className={`h-1 rounded-full cursor-pointer ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} onClick={seek}>
                        <div className="h-full rounded-full bg-violet-500 transition-all"
                            style={{ width: `${(progress / duration) * 100}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                        <span className={`text-xs tabular-nums ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {formatDuration(Math.floor(progress))}
                        </span>
                        <span className={`text-xs tabular-nums ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {formatDuration(Math.floor(duration))}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tracks Tab ───────────────────────────────────────────────────────────────
function TracksTab({ isDark }) {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playingTrack, setPlayingTrack] = useState(null);
    const [streamUrl, setStreamUrl] = useState(null);
    const [search, setSearch] = useState('');
    const [addToPlaylistTrack, setAddToPlaylistTrack] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try { setTracks(await api('/tracks')); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handlePlay = async (track) => {
        if (playingTrack?._id === track._id) { setPlayingTrack(null); setStreamUrl(null); return; }
        try {
            const { url } = await api(`/tracks/${track._id}/stream`);
            setPlayingTrack(track); setStreamUrl(url);
        } catch (e) { alert(e.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this track?')) return;
        try {
            await api(`/tracks/${id}`, { method: 'DELETE' });
            load();
            if (playingTrack?._id === id) { setPlayingTrack(null); setStreamUrl(null); }
        } catch (e) { alert(e.message); }
    };

    const handleCoverUpload = async (id, file) => {
        const formData = new FormData(); formData.append('file', file);
        try { await fetch(`${BASE_URL}/tracks/${id}/cover`, { method: 'POST', body: formData }); alert('Cover art updated!'); }
        catch (e) { alert(e.message); }
    };

    const filtered = tracks.filter(t => {
        const genres = Array.isArray(t.genre) ? t.genre : (t.genre ? [t.genre] : []);
        return [t.title, t.artist, t.album, ...genres].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    });

    return (
        <div className="flex flex-col h-full">
            {/* Search */}
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border mb-4
                ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <Search size={15} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                <input
                    className={`flex-1 bg-transparent text-sm focus:outline-none
                        ${isDark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
                    placeholder="Search tracks, artists, albums, genres…"
                    value={search} onChange={e => setSearch(e.target.value)}
                />
                {search && (
                    <button onClick={() => setSearch('')}>
                        <X size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                    </button>
                )}
            </div>

            {!loading && (
                <p className={`text-xs font-medium mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {filtered.length} {filtered.length === 1 ? 'track' : 'tracks'}
                </p>
            )}

            <div className="flex-1 overflow-y-auto flex flex-col gap-1 pb-28">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={24} className={`animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Disc3 size={40} className={isDark ? 'text-gray-700' : 'text-gray-300'} />
                        <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No tracks found</p>
                    </div>
                ) : filtered.map((t, i) => (
                    <TrackRow key={t._id} track={t} index={i} isDark={isDark}
                        onPlay={handlePlay} onDelete={handleDelete} onCoverUpload={handleCoverUpload}
                        onAddToPlaylist={setAddToPlaylistTrack}
                        playing={playingTrack?._id === t._id} />
                ))}
            </div>

            {playingTrack && streamUrl && (
                <MiniPlayer track={playingTrack} streamUrl={streamUrl} isDark={isDark}
                    onClose={() => { setPlayingTrack(null); setStreamUrl(null); }} />
            )}

            {addToPlaylistTrack && (
                <AddToPlaylistModal
                    track={addToPlaylistTrack}
                    isDark={isDark}
                    onClose={() => setAddToPlaylistTrack(null)}
                />
            )}
        </div>
    );
}

// ─── Upload Tab ───────────────────────────────────────────────────────────────
function UploadTab({ isDark }) {
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [album, setAlbum] = useState('');
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [file, setFile] = useState(null);
    const [stage, setStage] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [uploadedTrack, setUploadedTrack] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const inputCls = isDark
        ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-violet-500 focus:ring-violet-500/20'
        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-400 focus:ring-violet-400/20';

    const handleFileDrop = (e) => {
        e.preventDefault(); setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped?.type.startsWith('audio/')) {
            setFile(dropped);
            if (!title) setTitle(dropped.name.replace(/\.[^.]+$/, ''));
        }
    };

    const handleUpload = async () => {
        if (!file) return setErrorMsg('Please select an audio file.');
        if (!title.trim()) return setErrorMsg('Please enter a title.');
        if (selectedGenres.length === 0) return setErrorMsg('Please select at least one genre.');
        setErrorMsg(''); setStage('uploading'); setProgress(10);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title.trim());
            if (artist.trim()) formData.append('artist', artist.trim());
            if (album.trim()) formData.append('album', album.trim());
            // Send genres as JSON array string or join — depends on backend handling
            formData.append('genre', JSON.stringify(selectedGenres));
            formData.append('fileName', file.name);
            formData.append('mimeType', file.type || 'audio/mpeg');
            formData.append('fileSize', String(file.size));

            const interval = setInterval(() => setProgress(p => p < 85 ? p + 4 : p), 300);
            const res = await fetch(`${BASE_URL}/tracks/upload`, { method: 'POST', body: formData });
            clearInterval(interval); setProgress(95);
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Upload failed: ${res.status}`);
            const track = await res.json();
            setProgress(100); setUploadedTrack(track); setStage('done');
        } catch (e) { setErrorMsg(e.message || 'Upload failed'); setStage('error'); }
    };

    const reset = () => {
        setTitle(''); setArtist(''); setAlbum(''); setSelectedGenres([]);
        setFile(null); setStage('idle'); setProgress(0); setErrorMsg(''); setUploadedTrack(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (stage === 'done') {
        const uploadedGenres = Array.isArray(uploadedTrack?.genre) ? uploadedTrack.genre : (uploadedTrack?.genre ? [uploadedTrack.genre] : []);
        return (
            <div className="flex flex-col items-center gap-6 text-center py-8">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center
                    ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
                    <Music size={36} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
                </div>
                <div>
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Track Uploaded!</h2>
                    <p className={`mt-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Your track is now in the library</p>
                </div>
                <div className={`w-full rounded-2xl border divide-y
                    ${isDark ? 'border-white/10 divide-white/10' : 'border-gray-100 divide-gray-100'}`}>
                    {[['Title', uploadedTrack?.title], ['Artist', uploadedTrack?.artist], ['Album', uploadedTrack?.album],
                    ['Size', formatSize(uploadedTrack?.fileSize)]]
                        .filter(([, v]) => v).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between px-5 py-3">
                                <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{k}</span>
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{v}</span>
                            </div>
                        ))}
                    {uploadedGenres.length > 0 && (
                        <div className="flex items-center justify-between px-5 py-3">
                            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Genres</span>
                            <div className="flex gap-1.5 flex-wrap justify-end">
                                {uploadedGenres.map(g => (
                                    <span key={g} className={`text-xs px-2 py-0.5 rounded-lg font-medium
                                        ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>{g}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={reset}
                    className="w-full py-3.5 rounded-2xl font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors">
                    Upload Another Track
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 pb-6">
            {/* Drop zone */}
            <div
                className={`rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
                    ${dragOver
                        ? isDark ? 'border-violet-500 bg-violet-500/10' : 'border-violet-400 bg-violet-50'
                        : isDark ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:border-violet-300'
                    }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" accept="audio/*" className="hidden"
                    onChange={e => {
                        const f = e.target.files[0];
                        if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); }
                    }} />
                {file ? (
                    <div className="m-3 flex items-center gap-3 p-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                            ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                            <Music size={18} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{file.name}</p>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {formatSize(file.size)} · {file.type || 'audio'}
                            </p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors
                                ${isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
                            ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <Upload size={24} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                        </div>
                        <div className="text-center">
                            <p className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {dragOver ? 'Drop it here!' : 'Drop audio or click to browse'}
                            </p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>MP3, FLAC, WAV, AAC, OGG</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 gap-4">
                <Field label="Title *" value={title} onChange={setTitle} placeholder="Track title" inputCls={inputCls} isDark={isDark} />
                <Field label="Artist" value={artist} onChange={setArtist} placeholder="Artist name" inputCls={inputCls} isDark={isDark} />
            </div>
            <Field label="Album" value={album} onChange={setAlbum} placeholder="Album name (optional)" inputCls={inputCls} isDark={isDark} />

            {/* Multi-genre picker */}
            <GenrePicker selected={selectedGenres} onChange={setSelectedGenres} isDark={isDark} />

            {/* Error */}
            {errorMsg && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm
                    ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                    <AlertCircle size={15} />
                    {errorMsg}
                </div>
            )}

            {/* Progress */}
            {stage === 'uploading' && (
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Uploading…</span>
                        <span className={`text-sm font-semibold tabular-nums ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{progress}%</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                        <div className="h-full rounded-full bg-violet-500 transition-all duration-300"
                            style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            <button onClick={handleUpload} disabled={stage === 'uploading'}
                className="w-full py-3.5 rounded-2xl font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {stage === 'uploading'
                    ? <><Loader2 size={16} className="animate-spin" /> Uploading… {progress}%</>
                    : <><Upload size={16} /> Upload Track</>
                }
            </button>
        </div>
    );
}

// ─── Library Tab ──────────────────────────────────────────────────────────────
function LibraryTab({ isDark }) {
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        api('/library').then(setLibrary).catch(console.error).finally(() => setLoading(false));
    }, []);

    return (
        <div className="flex flex-col gap-2 pb-6">
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={24} className={`animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
            ) : library.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Library size={40} className={isDark ? 'text-gray-700' : 'text-gray-300'} />
                    <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Library is empty</p>
                </div>
            ) : library.map(({ genre, count, tracks }) => (
                <div key={genre} className={`rounded-2xl border overflow-hidden transition-all
                    ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                    <button className={`w-full flex items-center gap-3 p-4 text-left transition-colors
                        ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                        onClick={() => setExpanded(expanded === genre ? null : genre)}>
                        <span className="text-xl">{PRESET_GENRES.find(g => g.name === genre)?.icon ?? '🎵'}</span>
                        <span className={`font-semibold flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{genre}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                            ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                            {count} track{count !== 1 ? 's' : ''}
                        </span>
                        {expanded === genre
                            ? <ChevronUp size={15} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                            : <ChevronDown size={15} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                        }
                    </button>
                    {expanded === genre && (
                        <div className={`border-t px-4 py-2 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                            {tracks.map(t => (
                                <div key={t._id} className="flex items-center gap-3 py-2.5">
                                    <Music size={13} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.title}</p>
                                        <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t.artist}</p>
                                    </div>
                                    {t.duration && (
                                        <span className={`text-xs tabular-nums ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {formatDuration(t.duration)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Playlists Tab ────────────────────────────────────────────────────────────
function PlaylistsTab({ isDark }) {
    const [playlists, setPlaylists] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' | 'create' | 'detail'
    const [selected, setSelected] = useState(null);

    // Create form
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [pickedTrackIds, setPickedTrackIds] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [searchTracks, setSearchTracks] = useState('');

    // Detail view — manage tracks
    const [detailPlaylist, setDetailPlaylist] = useState(null);
    const [removingSaving, setRemovingSaving] = useState(null);

    const inputCls = isDark
        ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-violet-500 focus:ring-violet-500/20'
        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-400 focus:ring-violet-400/20';

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [pl, tr] = await Promise.all([api('/playlists'), api('/tracks')]);
            setPlaylists(pl); setTracks(tr);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async () => {
        if (!name.trim()) return setErrorMsg('Playlist name is required.');
        setSaving(true); setErrorMsg('');
        try {
            await api('/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), description: description.trim(), trackIds: pickedTrackIds }),
            });
            setName(''); setDescription(''); setPickedTrackIds('');
            await load();
            setView('list');
        } catch (e) { setErrorMsg(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this playlist?')) return;
        try { await api(`/playlists/${id}`, { method: 'DELETE' }); load(); }
        catch (e) { alert(e.message); }
    };

    const handleRemoveTrack = async (playlistId, trackId) => {
        setRemovingSaving(trackId);
        try {
            await api(`/playlists/${playlistId}/tracks/${trackId}`, { method: 'DELETE' });
            setDetailPlaylist(pl => ({
                ...pl,
                trackIds: pl.trackIds.filter(id => id !== trackId),
            }));
            // refresh playlists in background
            api('/playlists').then(setPlaylists).catch(() => { });
        } catch (e) { alert(e.message); }
        finally { setRemovingSaving(null); }
    };

    const filteredTracks = tracks.filter(t =>
        [t.title, t.artist].some(v => v?.toLowerCase().includes(searchTracks.toLowerCase()))
    );

    const toggleTrack = (id) => {
        setPickedTrackIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // ── Create view ──
    if (view === 'create') return (
        <div className="flex flex-col gap-5 pb-6">
            <div className="flex items-center gap-3 mb-1">
                <button onClick={() => setView('list')}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors
                        ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                    <X size={16} />
                </button>
                <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>New Playlist</h2>
            </div>

            <Field label="Name *" value={name} onChange={setName} placeholder="My Playlist" inputCls={inputCls} isDark={isDark} />
            <Field label="Description" value={description} onChange={setDescription} placeholder="Optional description…" inputCls={inputCls} isDark={isDark} />

            {/* Track picker */}
            <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-3
                    ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Add Tracks
                    {pickedTrackIds.length > 0 && (
                        <span className={`ml-2 normal-case font-normal ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                            {pickedTrackIds.length} selected
                        </span>
                    )}
                </label>

                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border mb-3
                    ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <Search size={13} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                    <input
                        className={`flex-1 bg-transparent text-sm focus:outline-none
                            ${isDark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
                        placeholder="Search tracks…"
                        value={searchTracks} onChange={e => setSearchTracks(e.target.value)}
                    />
                </div>

                <div className={`rounded-2xl border overflow-hidden max-h-64 overflow-y-auto
                    ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                    {filteredTracks.length === 0 ? (
                        <div className={`px-4 py-8 text-center text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            No tracks
                        </div>
                    ) : filteredTracks.map((t) => {
                        const checked = pickedTrackIds.includes(t._id);
                        return (
                            <button key={t._id}
                                onClick={() => toggleTrack(t._id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-0
                                    ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50'}
                                    ${checked ? isDark ? 'bg-violet-500/10' : 'bg-violet-50/60' : ''}`}>
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-all
                                    ${checked
                                        ? 'bg-violet-600 border-violet-600'
                                        : isDark ? 'border-white/20 bg-white/5' : 'border-gray-300 bg-white'
                                    }`}>
                                    {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.title}</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t.artist || 'Unknown'}</p>
                                </div>
                                {t.duration && (
                                    <span className={`text-xs tabular-nums ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {formatDuration(t.duration)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {errorMsg && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm
                    ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                    <AlertCircle size={15} /> {errorMsg}
                </div>
            )}

            <button onClick={handleCreate} disabled={saving}
                className="w-full py-3.5 rounded-2xl font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <><PlusCircle size={16} /> Create Playlist</>}
            </button>
        </div>
    );

    // ── Detail view ──
    if (view === 'detail' && detailPlaylist) {
        const detailTracks = tracks.filter(t => detailPlaylist.trackIds?.includes(t._id));
        return (
            <div className="flex flex-col gap-4 pb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => { setView('list'); setDetailPlaylist(null); }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors
                            ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <X size={16} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h2 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{detailPlaylist.name}</h2>
                        {detailPlaylist.description && (
                            <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{detailPlaylist.description}</p>
                        )}
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                        ${isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                        {detailTracks.length} track{detailTracks.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {detailTracks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <ListMusic size={40} className={isDark ? 'text-gray-700' : 'text-gray-300'} />
                        <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No tracks in this playlist</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {detailTracks.map((t, i) => (
                            <div key={t._id}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border
                                    ${isDark ? 'border-white/8 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                                <span className={`text-xs font-mono w-5 text-center flex-shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.title}</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t.artist || 'Unknown'}</p>
                                </div>
                                {t.duration && (
                                    <span className={`text-xs tabular-nums ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {formatDuration(t.duration)}
                                    </span>
                                )}
                                <button
                                    onClick={() => handleRemoveTrack(detailPlaylist._id, t._id)}
                                    disabled={removingSaving === t._id}
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                                        ${isDark ? 'hover:bg-red-500/15 text-gray-600 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}>
                                    {removingSaving === t._id
                                        ? <Loader2 size={13} className="animate-spin" />
                                        : <X size={13} />
                                    }
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ── List view ──
    return (
        <div className="flex flex-col gap-3 pb-6">
            <div className="flex justify-end mb-1">
                <button onClick={() => setView('create')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-violet-600 hover:bg-violet-500 transition-colors">
                    <Plus size={15} /> New Playlist
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={24} className={`animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
            ) : playlists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center
                        ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                        <ListMusic size={28} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                    </div>
                    <div className="text-center">
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No playlists yet</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Create your first playlist to organise your music</p>
                    </div>
                    <button onClick={() => setView('create')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-violet-600 hover:bg-violet-500 transition-colors">
                        <Plus size={15} /> Create Playlist
                    </button>
                </div>
            ) : playlists.map(pl => (
                <div key={pl._id}
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all
                        ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                        ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                        <ListMusic size={20} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{pl.name}</p>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {pl.trackIds?.length ?? 0} track{(pl.trackIds?.length ?? 0) !== 1 ? 's' : ''}
                            {pl.description ? ` · ${pl.description}` : ''}
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => { setDetailPlaylist(pl); setView('detail'); }}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                                ${isDark ? 'hover:bg-white/10 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                            title="View tracks">
                            <ChevronDown size={14} />
                        </button>
                        <button onClick={() => handleDelete(pl._id)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                                ${isDark ? 'hover:bg-red-500/15 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                            title="Delete playlist">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────
function StatsTab({ isDark }) {
    const [mostPlayed, setMostPlayed] = useState([]);
    const [recentlyAdded, setRecentlyAdded] = useState([]);
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([api('/most-played?limit=10'), api('/recently-added?limit=10'), api('/genres')])
            .then(([mp, ra, g]) => { setMostPlayed(mp); setRecentlyAdded(ra); setGenres(g); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const cardBg = isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100';

    const Section = ({ title, icon: Icon, items, renderRight }) => (
        <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
            <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <Icon size={14} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
                <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{title}</h3>
            </div>
            <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-50'}`}>
                {items.length === 0 ? (
                    <div className={`px-4 py-8 text-center text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No data yet</div>
                ) : items.map((t, i) => (
                    <div key={t._id} className="flex items-center gap-3 px-4 py-3">
                        <span className={`w-5 text-center text-xs font-mono ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.title}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t.artist || 'Unknown'}</p>
                        </div>
                        <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{renderRight(t)}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className={`animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        </div>
    );

    return (
        <div className="flex flex-col gap-4 pb-6">
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total Tracks', value: recentlyAdded.length === 10 ? '10+' : recentlyAdded.length, icon: Disc3 },
                    { label: 'Genres', value: genres.length, icon: Radio },
                    { label: 'Top Track', value: mostPlayed[0]?.title?.slice(0, 10) + (mostPlayed[0]?.title?.length > 10 ? '…' : '') || '—', icon: Flame },
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className={`rounded-2xl border p-4 text-center ${cardBg}`}>
                        <Icon size={20} className={`mx-auto mb-2 ${isDark ? 'text-violet-400' : 'text-violet-500'}`} />
                        <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
                        <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{label}</div>
                    </div>
                ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <Section title="Most Played" icon={Flame} items={mostPlayed} renderRight={t => `${t.playCount ?? 0} plays`} />
                <Section title="Recently Added" icon={Clock} items={recentlyAdded}
                    renderRight={t => new Date(t.createdAt).toLocaleDateString()} />
            </div>

            {genres.length > 0 && (
                <div className={`rounded-2xl border p-4 ${cardBg}`}>
                    <div className={`flex items-center gap-2 mb-3`}>
                        <Headphones size={14} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
                        <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>All Genres</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {genres.map(g => (
                            <span key={g} className={`px-3 py-1.5 rounded-xl text-sm font-medium border
                                ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                {PRESET_GENRES.find(pg => pg.name === g)?.icon ?? '🎵'} {g}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Field Helper ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, inputCls, isDark }) {
    return (
        <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2
                ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</label>
            <input
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${inputCls}`}
                value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            />
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MusicManagerPage() {
    const { theme } = useBackgroundContext();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState('tracks');

    const TABS = [
        { id: 'tracks', label: 'Tracks', icon: <Music size={15} /> },
        { id: 'upload', label: 'Upload', icon: <Upload size={15} /> },
        { id: 'playlists', label: 'Playlists', icon: <ListMusic size={15} /> },
        { id: 'library', label: 'Library', icon: <Library size={15} /> },
        { id: 'stats', label: 'Stats', icon: <BarChart2 size={15} /> },
    ];

    return (
        <div className={`flex flex-col h-screen transition-colors duration-300
            ${isDark ? 'bg-gray-950' : 'bg-gray-50'} `}>

            <div
                className="absolute inset-0 -z-10"
                style={{
                    backgroundColor: "rgba(0,0,0,0.4)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                }}
            />

            {/* Header */}
            <div className={`flex-shrink-0 border-b px-6 py-4
                ${isDark ? 'border-white/8 bg-gray-950' : 'border-gray-200 bg-white'}`}>
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                        ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                        <Disc3 size={18} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
                    </div>
                    <div className="flex-1">
                        <h1 className={`text-base font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Music Manager
                        </h1>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            Manage your music library
                        </p>
                    </div>
                    <div className="flex-1 max-w-2xl">
                        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} isDark={isDark} />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <div className="max-w-5xl mx-auto h-full px-6 py-5 flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'tracks' && <TracksTab isDark={isDark} />}
                        {activeTab === 'upload' && <UploadTab isDark={isDark} />}
                        {activeTab === 'playlists' && <PlaylistsTab isDark={isDark} />}
                        {activeTab === 'library' && <LibraryTab isDark={isDark} />}
                        {activeTab === 'stats' && <StatsTab isDark={isDark} />}
                    </div>
                </div>
            </div>
        </div>
    );
}