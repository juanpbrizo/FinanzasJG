/**
 * Componente Tabs simples y accesibles.
 */
export default function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="space-y-4">
      {/* Pestaña de navegación */}
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de pestaña activa */}
      <div>
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}
