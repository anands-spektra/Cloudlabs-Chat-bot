import { useCallback, useEffect } from 'react'
import { sessionApi, fileApi } from '../services/api'
import { useChatStore } from '../store/chatStore'

export function useChat() {
  const {
    session,
    ticket,
    messages,
    isLoading,
    isStarting,
    pendingAttachments,
    setSession,
    addMessage,
    setMessages,
    setLoading,
    setStarting,
    clearPendingAttachments,
    addUploadedId,
    uploadedAttachmentIds,
    setShowSatisfaction,
    clearChat,
  } = useChatStore()

  const startSession = useCallback(async () => {
    if (session) return
    setStarting(true)
    try {
      const { data } = await sessionApi.create()
      setSession(data.session, data.ticket)
    } finally {
      setStarting(false)
    }
  }, [session, setSession, setStarting])

  useEffect(() => {
    startSession()
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!session || isLoading) return
      setLoading(true)

      const attachmentIds: string[] = [...uploadedAttachmentIds]

      for (const file of pendingAttachments) {
        try {
          const { data } = await fileApi.upload(session.id, file)
          attachmentIds.push(data.id)
          addUploadedId(data.id)
        } catch {
          // continue without this attachment
        }
      }
      clearPendingAttachments()

      addMessage({
        id: `local-${Date.now()}`,
        session_id: session.id,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      })

      try {
        const { data } = await sessionApi.sendMessage(session.id, content, attachmentIds)
        addMessage(data)
      } catch {
        addMessage({
          id: `err-${Date.now()}`,
          session_id: session.id,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          created_at: new Date().toISOString(),
        })
      } finally {
        setLoading(false)
      }
    },
    [session, isLoading, pendingAttachments, uploadedAttachmentIds, setLoading, clearPendingAttachments, addMessage, addUploadedId]
  )

  const closeSession = useCallback(
    async (rating?: number, comment?: string) => {
      if (!session) return
      await sessionApi.close(session.id, rating, comment)
      setShowSatisfaction(false)
      clearChat()
    },
    [session, setShowSatisfaction, clearChat]
  )

  const loadHistory = useCallback(async () => {
    if (!session) return
    const { data } = await sessionApi.getMessages(session.id)
    setMessages(data)
  }, [session, setMessages])

  return {
    session,
    ticket,
    messages,
    isLoading,
    isStarting,
    sendMessage,
    closeSession,
    loadHistory,
    startSession,
  }
}
