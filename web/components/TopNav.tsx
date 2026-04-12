'use client'

export type TabId = 'create' | 'subtitle' | 'history'

const TABS: { id: TabId; label: string }[] = [
  { id: 'create', label: 'Video Oluştur' },
  { id: 'subtitle', label: 'Altyazı Ekle' },
  { id: 'history', label: 'Geçmiş' },
]

interface TopNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  return (
    <nav className="bg-white border-b border-gray-200 px-5 flex items-center gap-6 h-12 shrink-0">
      <span className="text-sm font-black tracking-tight text-gray-900">🎬 VideoEdit</span>
      <div className="flex flex-1 gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`text-xs px-4 h-12 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <button className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md font-semibold">
        + Yeni
      </button>
    </nav>
  )
}
