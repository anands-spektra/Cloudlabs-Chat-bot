import { useState } from 'react'
import AdminLayout from '../components/admin/AdminLayout'
import Dashboard from '../components/admin/Dashboard'
import ConversationList from '../components/admin/ConversationList'
import Analytics from '../components/admin/Analytics'
import IssueExplorer from '../components/admin/IssueExplorer'
import KnowledgeBase from '../components/admin/KnowledgeBase'
import AIChat from '../components/admin/AIChat'
import SettingsPlaceholderComponent from '../components/admin/SettingsPlaceholder'

export type AdminView =
  | 'dashboard'
  | 'ai-chat'
  | 'knowledge-base'
  | 'issue-explorer'
  | 'analytics'
  | 'settings'

export default function AdminPage() {
  const [activeView, setActiveView] = useState<AdminView>('dashboard')

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':      return <Dashboard onNavigate={setActiveView} />
      case 'ai-chat':        return <AIChat />
      case 'knowledge-base': return <KnowledgeBase />
      case 'issue-explorer': return <IssueExplorer />
      case 'analytics':      return <Analytics />
      case 'settings':       return <SettingsPlaceholderComponent />
      default:               return <Dashboard onNavigate={setActiveView} />
    }
  }

  return (
    <AdminLayout activeView={activeView} onNavigate={setActiveView}>
      {renderView()}
    </AdminLayout>
  )
}

